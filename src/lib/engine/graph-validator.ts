/**
 * DAG Validator — Cycle detection and connection type validation
 *
 * Uses DFS-based cycle detection to prevent circular dependencies
 * and validates handle type compatibility before edge creation.
 */

import type { Node, Edge } from "@xyflow/react";
import { getHandleDataType, areHandlesCompatible } from "@/lib/node-types";

// ── Cycle Detection (DFS-based) ─────────────────────────────────────

interface CycleCheckResult {
  hasCycle: boolean;
  cycleNodes?: string[];
}

/**
 * Detect if adding a new edge would create a cycle in the DAG.
 * Uses iterative DFS from the target node to check if we can reach the source.
 */
export function detectCycle(
  nodes: Node[],
  edges: Edge[],
  newEdge: { source: string; target: string }
): CycleCheckResult {
  // Build adjacency list including the proposed edge
  const adj = new Map<string, string[]>();
  for (const node of nodes) {
    adj.set(node.id, []);
  }
  for (const edge of edges) {
    const neighbors = adj.get(edge.source);
    if (neighbors) neighbors.push(edge.target);
  }
  // Add the proposed edge
  const sourceNeighbors = adj.get(newEdge.source);
  if (sourceNeighbors) sourceNeighbors.push(newEdge.target);

  // DFS from target — if we reach source, there's a cycle
  const visited = new Set<string>();
  const path: string[] = [];
  const stack = [newEdge.target];

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (current === newEdge.source) {
      return { hasCycle: true, cycleNodes: [...path, current] };
    }

    if (visited.has(current)) continue;
    visited.add(current);
    path.push(current);

    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      stack.push(neighbor);
    }
  }

  return { hasCycle: false };
}

// ── Connection Type Validation ───────────────────────────────────────

interface ConnectionValidation {
  valid: boolean;
  reason?: string;
}

/**
 * Validate that a connection between two handles is type-safe.
 * Checks handle data types against the compatibility matrix.
 */
export function validateConnection(
  nodes: Node[],
  edges: Edge[],
  connection: {
    source: string;
    target: string;
    sourceHandle: string | null;
    targetHandle: string | null;
  }
): ConnectionValidation {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) {
    return { valid: false, reason: "Node not found" };
  }

  // Self-connection check
  if (connection.source === connection.target) {
    return { valid: false, reason: "Cannot connect node to itself" };
  }

  // Type compatibility check
  const sourceType = getHandleDataType(
    sourceNode.type || "",
    connection.sourceHandle || "",
    "source"
  );
  const targetType = getHandleDataType(
    targetNode.type || "",
    connection.targetHandle || "",
    "target"
  );

  if (sourceType && targetType && !areHandlesCompatible(sourceType, targetType)) {
    return {
      valid: false,
      reason: `Incompatible types: ${sourceType} → ${targetType}`,
    };
  }

  // Duplicate connection check — don't allow multiple edges to the same target handle
  // (unless it's the multimodal "image" input on a Gemini node, or any input on a Response node)
  const isGeminiImage = targetNode.type === "gemini" && connection.targetHandle === "image";
  const isResponse = targetNode.type === "response";
  if (!isGeminiImage && !isResponse) {
    const existingEdge = edges.find(
      (e) =>
        e.target === connection.target &&
        e.targetHandle === connection.targetHandle
    );
    if (existingEdge) {
      return { valid: false, reason: "Target handle already connected" };
    }
  }

  // Cycle detection
  const cycleCheck = detectCycle(nodes, edges, {
    source: connection.source,
    target: connection.target,
  });
  if (cycleCheck.hasCycle) {
    return { valid: false, reason: "Would create a cycle" };
  }

  return { valid: true };
}

// ── Topological Sort (Kahn's Algorithm) ──────────────────────────────

/**
 * Perform topological sort on the DAG using Kahn's algorithm.
 * Returns ordered array of node IDs, or null if the graph has a cycle.
 */
export function topologicalSort(
  nodes: Node[],
  edges: Edge[]
): string[] | null {
  // Build in-degree map and adjacency list
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    if (!inDegree.has(edge.source) || !inDegree.has(edge.target)) continue;
    const currentDegree = inDegree.get(edge.target) ?? 0;
    inDegree.set(edge.target, currentDegree + 1);
    adj.get(edge.source)?.push(edge.target);
  }

  // Start with nodes that have no incoming edges
  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  const sorted: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  // If not all nodes are sorted, there's a cycle
  if (sorted.length !== nodes.length) return null;

  return sorted;
}
