/**
 * DAG Executor — Parallel workflow execution engine
 *
 * Executes workflow nodes in topological order with parallel execution
 * of independent nodes. Nodes only wait for their direct dependencies,
 * not siblings.
 *
 * Supports three execution scopes:
 * - full: execute all nodes in the workflow
 * - single: execute only a specific node
 * - multi: execute a selection of nodes
 */

import type { Node, Edge } from "@xyflow/react";
import { topologicalSort } from "./graph-validator";
import type { NodeRunResult, RunScope } from "@/types/workflow";

// ── Types ────────────────────────────────────────────────────────────

interface ExecutionContext {
  nodes: Node[];
  edges: Edge[];
  scope: RunScope;
  targetNodeIds?: string[];
  onNodeStart?: (nodeId: string) => void;
  onNodeComplete?: (nodeId: string, result: NodeRunResult) => void;
  onNodeError?: (nodeId: string, error: string) => void;
}

interface NodeExecutor {
  (nodeId: string, nodeType: string, inputs: Record<string, unknown>): Promise<Record<string, unknown>>;
}

// ── DAG Executor ─────────────────────────────────────────────────────

function getAncestors(nodes: Node[], edges: Edge[], targetIds: string[]): Set<string> {
  const ancestors = new Set<string>(targetIds);
  const queue = [...targetIds];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const parents = edges
      .filter((e) => e.target === current)
      .map((e) => e.source);
    for (const parent of parents) {
      if (!ancestors.has(parent)) {
        ancestors.add(parent);
        queue.push(parent);
      }
    }
  }
  return ancestors;
}

export async function executeDAG(
  context: ExecutionContext,
  executor: NodeExecutor
): Promise<NodeRunResult[]> {
  const { nodes, edges, scope, targetNodeIds } = context;
  const results: NodeRunResult[] = [];

  // Determine which nodes to execute based on scope (with dependency execution)
  let executionNodes: Node[];
  switch (scope) {
    case "single":
    case "multi": {
      const targetIds = targetNodeIds || [];
      const ancestorIds = getAncestors(nodes, edges, targetIds);
      executionNodes = nodes.filter((n) => ancestorIds.has(n.id));
      break;
    }
    case "full":
    default:
      executionNodes = nodes;
  }

  // Topological sort to determine execution order
  const sortedIds = topologicalSort(executionNodes, edges);
  if (!sortedIds) {
    throw new Error("Workflow contains a cycle — cannot execute");
  }

  // Build dependency map: nodeId -> set of predecessor nodeIds
  const dependencies = new Map<string, Set<string>>();
  for (const node of executionNodes) {
    dependencies.set(node.id, new Set());
  }
  for (const edge of edges) {
    const deps = dependencies.get(edge.target);
    if (deps && dependencies.has(edge.source)) {
      deps.add(edge.source);
    }
  }

  // Map of node ID to execution Promise
  const nodePromises = new Map<string, Promise<void>>();

  // Track completed and failed nodes and their outputs
  const completedNodes = new Set<string>();
  const failedNodes = new Set<string>();
  const nodeOutputs = new Map<string, Record<string, unknown>>();

  // Helper function to execute a single node
  const executeNode = async (nodeId: string) => {
    const node = executionNodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Gather predecessor node IDs
    const preds = dependencies.get(nodeId) || new Set<string>();

    // Wait for all predecessors' promises to resolve
    if (preds.size > 0) {
      await Promise.all([...preds].map(predId => nodePromises.get(predId)));
    }

    // Check if any dependency has failed or skipped — if so, skip this node
    const failedDep = [...preds].find((dep) => failedNodes.has(dep));
    if (failedDep) {
      const failedDepNode = executionNodes.find((n) => n.id === failedDep);
      const failedDepLabel = failedDepNode?.data?.label || failedDep;
      const skipMsg = `Skipped: upstream node "${failedDepLabel}" failed`;

      failedNodes.add(nodeId);
      const result: NodeRunResult = {
        nodeId,
        nodeType: node.type || "",
        status: "skipped",
        error: skipMsg,
        durationMs: 0,
      };
      results.push(result);
      context.onNodeError?.(nodeId, skipMsg);
      return;
    }

    // Gather inputs from connected edges (with multiple inputs support for image handles)
    const inputs: Record<string, unknown> = {};
    const incomingEdges = edges.filter((e) => e.target === nodeId);
    for (const edge of incomingEdges) {
      let val: unknown = null;
      const sourceOutput = nodeOutputs.get(edge.source);
      if (sourceOutput && edge.sourceHandle) {
        val = sourceOutput[edge.sourceHandle];
      } else if (edge.sourceHandle && edge.targetHandle) {
        // Fallback: get from source node's data in the workflow
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (sourceNode) {
          if (sourceNode.type === "requestInputs") {
            const fields = (sourceNode.data.fields || []) as { id: string; value: unknown }[];
            const field = fields.find((f) => f.id === edge.sourceHandle || `${f.id}_image` === edge.sourceHandle);
            if (field) {
              val = field.value;
            }
          } else if (sourceNode.type === "cropImage") {
            if (edge.sourceHandle === "outputImage") {
              val = sourceNode.data.output;
            }
          } else if (sourceNode.type === "gemini") {
            if (edge.sourceHandle === "response") {
              val = sourceNode.data.response;
            }
          }
        }
      }

      if (val !== undefined && val !== null && edge.targetHandle) {
        if (edge.targetHandle === "image") {
          if (!inputs.image) {
            inputs.image = [];
          }
          if (Array.isArray(inputs.image)) {
            inputs.image.push(val);
          } else {
            inputs.image = [inputs.image, val];
          }
        } else {
          inputs[edge.targetHandle] = val;
        }
      }
    }

    // Merge with node's own data as fallback for unconnected inputs
    const mergedInputs = { ...node.data, ...inputs };

    context.onNodeStart?.(nodeId);
    const startTime = Date.now();

    try {
      const output = await executor(nodeId, node.type || "", mergedInputs);
      const durationMs = Date.now() - startTime;

      nodeOutputs.set(nodeId, output);
      completedNodes.add(nodeId);

      const result: NodeRunResult = {
        nodeId,
        nodeType: node.type || "",
        status: "success",
        input: mergedInputs as Record<string, unknown>,
        output,
        durationMs,
      };

      results.push(result);
      context.onNodeComplete?.(nodeId, result);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      failedNodes.add(nodeId);

      const result: NodeRunResult = {
        nodeId,
        nodeType: node.type || "",
        status: "failed",
        input: mergedInputs as Record<string, unknown>,
        error: errorMsg,
        durationMs,
      };

      results.push(result);
      context.onNodeError?.(nodeId, errorMsg);
    }
  };

  // Kick off execution for all nodes.
  // Each node will wait internally for its predecessors to resolve.
  for (const node of executionNodes) {
    nodePromises.set(node.id, executeNode(node.id));
  }

  // Wait for all node promises to resolve completely
  await Promise.all(nodePromises.values());

  return results;
}
