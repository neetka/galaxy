"use client";

import { create } from "zustand";
import {
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";

import type {
  WorkflowNodeData,
  WorkflowRunResult,
} from "@/types/workflow";
import { getHandleDataType, areHandlesCompatible } from "@/lib/node-types";

// ── Store Interface ──────────────────────────────────────────────────

interface WorkflowState {
  // Workflow metadata
  workflowId: string | null;
  workflowName: string;

  // React Flow state
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];

  // Selection
  selectedNodes: string[];

  // Execution state
  isRunning: boolean;
  runningNodes: Set<string>;
  workflowError: string | null;
  nodeErrors: Map<string, string>;

  // History
  history: WorkflowRunResult[];

  // Actions — React Flow handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  // Actions — CRUD
  setWorkflow: (id: string, name: string, nodes: Node<WorkflowNodeData>[], edges: Edge[]) => void;
  setWorkflowName: (name: string) => void;
  addNode: (node: Node<WorkflowNodeData>) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  setSelectedNodes: (ids: string[]) => void;

  // Actions — Execution
  setIsRunning: (running: boolean) => void;
  setNodeRunning: (nodeId: string, running: boolean) => void;
  setNodeError: (nodeId: string, hasError: boolean) => void;
  setNodeErrorMessage: (nodeId: string, message: string | null) => void;
  setWorkflowError: (error: string | null) => void;
  setNodeOutput: (nodeId: string, output: unknown) => void;
  clearNodeStates: () => void;
  resetAllRunningNodes: () => void;
  addRunToHistory: (run: WorkflowRunResult) => void;

  // Actions — Validation
  validateConnection: (connection: Connection) => boolean;

  // Actions — Connected inputs tracking
  getConnectedInputs: (nodeId: string) => string[];
}

// ── Cycle Detection ──────────────────────────────────────────────────

function wouldCreateCycle(
  nodes: Node[],
  edges: Edge[],
  newEdge: { source: string; target: string }
): boolean {
  // Build adjacency list including the proposed new edge
  const adj = new Map<string, string[]>();
  for (const node of nodes) {
    adj.set(node.id, []);
  }
  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
  }
  adj.get(newEdge.source)?.push(newEdge.target);

  // DFS from target to check if we can reach source (cycle)
  const visited = new Set<string>();
  const stack = [newEdge.target];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === newEdge.source) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const neighbors = adj.get(current) || [];
    stack.push(...neighbors);
  }

  return false;
}

// ── Store ────────────────────────────────────────────────────────────

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflowId: null,
  workflowName: "Untitled Workflow",
  nodes: [],
  edges: [],
  selectedNodes: [],
  isRunning: false,
  runningNodes: new Set(),
  workflowError: null,
  nodeErrors: new Map(),
  history: [],

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as Node<WorkflowNodeData>[],
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect: (connection) => {
    const state = get();

    // Validate connection type compatibility
    if (!state.validateConnection(connection)) return;

    // Check for cycles
    if (
      wouldCreateCycle(state.nodes, state.edges, {
        source: connection.source,
        target: connection.target,
      })
    ) {
      console.warn("Connection rejected: would create a cycle");
      return;
    }

    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          animated: true,
          style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
        },
        state.edges
      ),
    }));
  },

  setWorkflow: (id, name, nodes, edges) =>
    set({ workflowId: id, workflowName: name, nodes: nodes as Node<WorkflowNodeData>[], edges }),

  setWorkflowName: (name) => set({ workflowName: name }),

  addNode: (node) =>
    set((state) => ({ nodes: [...state.nodes, node] as Node<WorkflowNodeData>[] })),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
    })),

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    })),

  setSelectedNodes: (ids) => set({ selectedNodes: ids }),

  setIsRunning: (running) => set({ isRunning: running }),

  setNodeRunning: (nodeId, running) =>
    set((state) => {
      const newRunning = new Set(state.runningNodes);
      if (running) {
        newRunning.add(nodeId);
      } else {
        newRunning.delete(nodeId);
      }
      return {
        runningNodes: newRunning,
        nodes: state.nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, isRunning: running } }
            : node
        ),
      };
    }),

  setNodeError: (nodeId, hasError) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, hasError } }
          : node
      ),
    })),

  setNodeErrorMessage: (nodeId, message) =>
    set((state) => {
      const newErrors = new Map(state.nodeErrors);
      if (message) {
        newErrors.set(nodeId, message);
      } else {
        newErrors.delete(nodeId);
      }
      return { nodeErrors: newErrors };
    }),

  setWorkflowError: (error) => set({ workflowError: error }),

  setNodeOutput: (nodeId, output) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, output } }
          : node
      ),
    })),

  clearNodeStates: () =>
    set((state) => ({
      runningNodes: new Set(),
      workflowError: null,
      nodeErrors: new Map(),
      nodes: state.nodes.map((node) => ({
        ...node,
        data: { ...node.data, isRunning: false, hasError: false },
      })),
    })),

  resetAllRunningNodes: () =>
    set((state) => ({
      runningNodes: new Set(),
      nodes: state.nodes.map((node) =>
        node.data.isRunning
          ? { ...node, data: { ...node.data, isRunning: false } }
          : node
      ),
    })),

  addRunToHistory: (run) =>
    set((state) => ({ history: [run, ...state.history] })),

  validateConnection: (connection) => {
    const state = get();
    const sourceNode = state.nodes.find((n) => n.id === connection.source);
    const targetNode = state.nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

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

    if (!sourceType || !targetType) return true; // Allow if types unknown

    return areHandlesCompatible(sourceType, targetType);
  },

  getConnectedInputs: (nodeId) => {
    const state = get();
    return state.edges
      .filter((e) => e.target === nodeId)
      .map((e) => e.targetHandle || "");
  },
}));
