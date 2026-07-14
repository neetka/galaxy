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
import { validateConnection as validateGraphConnection } from "@/lib/engine/graph-validator";

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

  // Undo/Redo stacks
  past: { nodes: Node<WorkflowNodeData>[]; edges: Edge[] }[];
  future: { nodes: Node<WorkflowNodeData>[]; edges: Edge[] }[];

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

  // Actions — Undo/Redo
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

// Helper to clone nodes and edges cleanly without circular refs
const cloneNodesAndEdges = (nodesList: Node<WorkflowNodeData>[], edgesList: Edge[]) => {
  return {
    nodes: nodesList.map((node) => ({
      ...node,
      position: { ...node.position },
      data: {
        ...node.data,
        connectedInputs: node.data.connectedInputs instanceof Set
          ? new Set(node.data.connectedInputs)
          : Array.isArray(node.data.connectedInputs)
            ? new Set(node.data.connectedInputs)
            : new Set(),
        fields: "fields" in node.data && Array.isArray(node.data.fields)
          ? node.data.fields.map((f) => ({ ...f }))
          : undefined,
      } as WorkflowNodeData,
    })),
    edges: edgesList.map((edge) => ({
      ...edge,
      style: edge.style ? { ...edge.style } : undefined,
    })),
  };
};

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
  past: [],
  future: [],

  onNodesChange: (changes) => {
    const hasRemoval = changes.some((c) => c.type === "remove");
    if (hasRemoval) {
      get().takeSnapshot();
    }
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as Node<WorkflowNodeData>[],
    }));
  },

  onEdgesChange: (changes) => {
    const hasRemoval = changes.some((c) => c.type === "remove");
    if (hasRemoval) {
      get().takeSnapshot();
    }
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect: (connection) => {
    const state = get();

    // Validate connection (type compatibility, target uniqueness, cycle prevention)
    if (!state.validateConnection(connection)) return;

    state.takeSnapshot();

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
    set({
      workflowId: id,
      workflowName: name,
      nodes: nodes as Node<WorkflowNodeData>[],
      edges,
      past: [],
      future: [],
    }),

  setWorkflowName: (name) => set({ workflowName: name }),

  addNode: (node) => {
    get().takeSnapshot();
    set((state) => ({ nodes: [...state.nodes, node] as Node<WorkflowNodeData>[] }));
  },

  removeNode: (nodeId) => {
    get().takeSnapshot();
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
    }));
  },

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
    const res = validateGraphConnection(state.nodes, state.edges, {
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    });
    return res.valid;
  },

  getConnectedInputs: (nodeId) => {
    const state = get();
    return state.edges
      .filter((e) => e.target === nodeId)
      .map((e) => e.targetHandle || "");
  },

  // ── History Actions ────────────────────────────────────────────────

  takeSnapshot: () => {
    const { nodes, edges, past } = get();

    // Serialize node structure for comparison to avoid redundant history points
    const serializeState = (nodesList: Node<WorkflowNodeData>[], edgesList: Edge[]) => {
      return JSON.stringify({
        nodes: nodesList.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            ...n.data,
            connectedInputs: undefined,
          },
        })),
        edges: edgesList.map((e) => ({ id: e.id, source: e.source, target: e.target })),
      });
    };

    const last = past[past.length - 1];
    if (last) {
      const currentSer = serializeState(nodes, edges);
      const lastSer = serializeState(last.nodes, last.edges);
      if (currentSer === lastSer) return;
    }

    set({
      past: [...past.slice(-49), cloneNodesAndEdges(nodes, edges)],
      future: [],
    });
  },

  undo: () => {
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    set({
      past: newPast,
      future: [cloneNodesAndEdges(nodes, edges), ...future],
      nodes: previous.nodes,
      edges: previous.edges,
    });
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      past: [...past, cloneNodesAndEdges(nodes, edges)],
      future: newFuture,
      nodes: next.nodes,
      edges: next.edges,
    });
  },
}));
