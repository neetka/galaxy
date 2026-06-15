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

export async function executeDAG(
  context: ExecutionContext,
  executor: NodeExecutor
): Promise<NodeRunResult[]> {
  const { nodes, edges, scope, targetNodeIds } = context;
  const results: NodeRunResult[] = [];

  // Determine which nodes to execute based on scope
  let executionNodes: Node[];
  switch (scope) {
    case "single":
      executionNodes = nodes.filter(
        (n) => targetNodeIds?.includes(n.id)
      );
      break;
    case "multi":
      executionNodes = nodes.filter(
        (n) => targetNodeIds?.includes(n.id)
      );
      break;
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

  // Track completed nodes and their outputs
  const completedNodes = new Set<string>();
  const nodeOutputs = new Map<string, Record<string, unknown>>();

  // Execute nodes in topological order, parallelizing independent nodes
  // Group nodes into "levels" — nodes in the same level can run in parallel
  const levels: string[][] = [];
  const assigned = new Set<string>();

  for (const nodeId of sortedIds) {
    // Find the earliest level where all dependencies are satisfied
    let level = 0;
    const deps = dependencies.get(nodeId) || new Set();
    for (const dep of deps) {
      // Find which level the dependency is in
      for (let l = 0; l < levels.length; l++) {
        if (levels[l].includes(dep)) {
          level = Math.max(level, l + 1);
        }
      }
    }

    // Add to that level
    while (levels.length <= level) levels.push([]);
    levels[level].push(nodeId);
    assigned.add(nodeId);
  }

  // Execute level by level
  for (const level of levels) {
    // All nodes in this level can execute in parallel
    const levelResults = await Promise.allSettled(
      level.map(async (nodeId) => {
        const node = executionNodes.find((n) => n.id === nodeId);
        if (!node) return;

        // Gather inputs from connected edges
        const inputs: Record<string, unknown> = {};
        const incomingEdges = edges.filter((e) => e.target === nodeId);
        for (const edge of incomingEdges) {
          const sourceOutput = nodeOutputs.get(edge.source);
          if (sourceOutput && edge.sourceHandle && edge.targetHandle) {
            inputs[edge.targetHandle] = sourceOutput[edge.sourceHandle];
          } else if (edge.sourceHandle && edge.targetHandle) {
            // Fallback: get from source node's data in the workflow
            const sourceNode = nodes.find((n) => n.id === edge.source);
            if (sourceNode) {
              if (sourceNode.type === "requestInputs") {
                const fields = (sourceNode.data.fields || []) as any[];
                const field = fields.find((f) => f.id === edge.sourceHandle || `${f.id}_image` === edge.sourceHandle);
                if (field) {
                  inputs[edge.targetHandle] = field.value;
                }
              } else if (sourceNode.type === "cropImage") {
                if (edge.sourceHandle === "outputImage") {
                  inputs[edge.targetHandle] = sourceNode.data.output;
                }
              } else if (sourceNode.type === "gemini") {
                if (edge.sourceHandle === "response") {
                  inputs[edge.targetHandle] = sourceNode.data.response;
                }
              }
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
      })
    );

    // Check for rejected promises (shouldn't happen with try/catch, but safety)
    for (const result of levelResults) {
      if (result.status === "rejected") {
        console.error("Unexpected rejection:", result.reason);
      }
    }
  }

  return results;
}
