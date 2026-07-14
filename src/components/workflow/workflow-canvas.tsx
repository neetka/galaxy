"use client";

import { useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useWorkflowStore } from "@/stores/workflow-store";
import { useUIStore } from "@/stores/ui-store";
import { AlertCircle, X } from "lucide-react";
import { WorkflowToolbar } from "./workflow-toolbar";
import { NodePicker } from "./node-picker";
import { HistoryPanel } from "./history-panel";
import { CustomEdge } from "./custom-edge";
import { RequestInputsNode } from "@/components/nodes/request-inputs-node";
import { CropImageNode } from "@/components/nodes/crop-image-node";
import { GeminiNode } from "@/components/nodes/gemini-node";
import { ResponseNode } from "@/components/nodes/response-node";

// Register custom node types
const nodeTypes: NodeTypes = {
  requestInputs: RequestInputsNode,
  cropImage: CropImageNode,
  gemini: GeminiNode,
  response: ResponseNode,
};

// Register custom edge types
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

function WorkflowCanvasInner({ workflowId }: { workflowId: string }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowStore((s) => s.onConnect);
  const addNode = useWorkflowStore((s) => s.addNode);
  const removeNode = useWorkflowStore((s) => s.removeNode);
  const setSelectedNodes = useWorkflowStore((s) => s.setSelectedNodes);

  const isHistoryPanelOpen = useUIStore((s) => s.isHistoryPanelOpen);

  const isRunning = useWorkflowStore((s) => s.isRunning);
  const setIsRunning = useWorkflowStore((s) => s.setIsRunning);
  const setNodeRunning = useWorkflowStore((s) => s.setNodeRunning);
  const setNodeError = useWorkflowStore((s) => s.setNodeError);
  const setNodeErrorMessage = useWorkflowStore((s) => s.setNodeErrorMessage);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const workflowError = useWorkflowStore((s) => s.workflowError);
  const resetAllRunningNodes = useWorkflowStore((s) => s.resetAllRunningNodes);

  // Poll workflow run status in the background when running
  useEffect(() => {
    if (!isRunning) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/runs/${workflowId}`);
        if (!res.ok) return;
        const runs = await res.json();
        if (runs.length === 0) return;

        const latestRun = runs[0];

        // Update each node state
        latestRun.nodeRuns.forEach((nodeRun: {
          nodeId: string;
          status: string;
          output?: string | Record<string, unknown> | null;
          error?: string | null;
          nodeType: string;
        }) => {
          if (nodeRun.status === "running") {
            setNodeRunning(nodeRun.nodeId, true);
            setNodeError(nodeRun.nodeId, false);
            setNodeErrorMessage(nodeRun.nodeId, null);
          } else if (nodeRun.status === "success") {
            setNodeRunning(nodeRun.nodeId, false);
            setNodeError(nodeRun.nodeId, false);
            setNodeErrorMessage(nodeRun.nodeId, null);
            // Update node data with output
            const output = typeof nodeRun.output === "string" ? JSON.parse(nodeRun.output) : nodeRun.output;
            if (output) {
              if (nodeRun.nodeType === "cropImage") {
                updateNodeData(nodeRun.nodeId, { output: output.outputImage });
              } else if (nodeRun.nodeType === "gemini") {
                updateNodeData(nodeRun.nodeId, { response: output.response });
              } else if (nodeRun.nodeType === "response") {
                const raw = output.result;
                const result = Array.isArray(raw)
                  ? raw.filter(Boolean).join("\n\n")
                  : (raw as string) || "";
                updateNodeData(nodeRun.nodeId, { result });
              }
            }
          } else if (nodeRun.status === "failed") {
            setNodeRunning(nodeRun.nodeId, false);
            setNodeError(nodeRun.nodeId, true);
            setNodeErrorMessage(nodeRun.nodeId, nodeRun.error || "Execution failed");
          } else if (nodeRun.status === "skipped") {
            setNodeRunning(nodeRun.nodeId, false);
            setNodeError(nodeRun.nodeId, true);
            setNodeErrorMessage(nodeRun.nodeId, nodeRun.error || "Skipped due to upstream failure");
          }
        });

        if (latestRun.status === "success" || latestRun.status === "failed") {
          setIsRunning(false);
          resetAllRunningNodes();
          if (latestRun.status === "failed") {
            useWorkflowStore.getState().setWorkflowError(latestRun.error || "Workflow execution failed");
          } else {
            useWorkflowStore.getState().setWorkflowError(null);
          }
        }
      } catch (err) {
        console.error("Error polling run status:", err);
      }
    };

    // Poll immediately, then every 1500ms
    poll();
    const intervalId = setInterval(poll, 1500);

    return () => clearInterval(intervalId);
  }, [isRunning, workflowId, setIsRunning, setNodeRunning, setNodeError, setNodeErrorMessage, updateNodeData, resetAllRunningNodes]);

  // Handle keyboard shortcuts (Delete, Backspace, Undo, Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditingText =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true");

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (isEditingText) return;
        e.preventDefault();
        useWorkflowStore.getState().undo();
        return;
      }

      // Redo: Ctrl+Y / Cmd+Y / Ctrl+Shift+Z / Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        if (isEditingText) return;
        e.preventDefault();
        useWorkflowStore.getState().redo();
        return;
      }

      // Delete selected nodes and edges
      if (e.key === "Delete" || e.key === "Backspace") {
        if (isEditingText) return;
        
        let hasChanges = false;
        
        const selectedNodes = useWorkflowStore.getState().selectedNodes;
        selectedNodes.forEach((id) => {
          const node = useWorkflowStore.getState().nodes.find((n) => n.id === id);
          // Don't delete requestInputs and response nodes
          if (node && node.type !== "requestInputs" && node.type !== "response") {
            removeNode(id);
            hasChanges = true;
          }
        });

        const edges = useWorkflowStore.getState().edges;
        const selectedEdges = edges.filter((e) => e.selected);
        if (selectedEdges.length > 0) {
          if (!hasChanges) {
            useWorkflowStore.getState().takeSnapshot();
          }
          const selectedEdgeIds = new Set(selectedEdges.map((e) => e.id));
          useWorkflowStore.setState((state) => ({
            edges: state.edges.filter((e) => !selectedEdgeIds.has(e.id)),
          }));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [removeNode]);

  // Handle drop from node picker
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = createNodeByType(type, position);
      if (newNode) {
        addNode(newNode);
      }
    },
    [screenToFlowPosition, addNode]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: { id: string }[] }) => {
      setSelectedNodes(selectedNodes.map((n) => n.id));
    },
    [setSelectedNodes]
  );

  const onNodeDragStart = useCallback(() => {
    useWorkflowStore.getState().takeSnapshot();
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Toolbar */}
      <WorkflowToolbar workflowId={workflowId} />

      {/* Workflow Error Banner */}
      {workflowError && (
        <div className="absolute top-16 left-1/2 z-30 w-full max-w-xl -translate-x-1/2 px-4 animate-in fade-in slide-in-from-top-4 duration-250">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 shadow-md backdrop-blur-md">
            <div className="flex items-center gap-2.5 text-xs text-red-600 font-medium">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <span className="break-words leading-relaxed">{workflowError}</span>
            </div>
            <button
              onClick={() => useWorkflowStore.getState().setWorkflowError(null)}
              className="rounded-lg p-1 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex h-full">
        {/* Main canvas */}
        <div
          ref={reactFlowWrapper}
          className="flex-1 h-full"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onSelectionChange={onSelectionChange}
            onNodeDragStart={onNodeDragStart}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{
              type: "custom",
              animated: true,
              style: { stroke: "hsl(263, 70%, 50%)", strokeWidth: 2 },
            }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode={null} // We handle delete manually
            multiSelectionKeyCode="Shift"
            className="bg-[#f4f4f7]"
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#d1d5db"
            />
            <Controls
              position="bottom-left"
              showInteractive={false}
            />
            <MiniMap
              position="bottom-right"
              nodeStrokeWidth={3}
              pannable
              zoomable
              style={{
                width: 160,
                height: 100,
              }}
            />
          </ReactFlow>
        </div>

        {/* History panel */}
        {isHistoryPanelOpen && (
          <HistoryPanel workflowId={workflowId} />
        )}
      </div>

      {/* Node picker */}
      <NodePicker />
    </div>
  );
}

// Create a node instance by type
function createNodeByType(
  type: string,
  position: { x: number; y: number }
) {
  const id = `${type}-${Date.now()}`;

  switch (type) {
    case "cropImage":
      return {
        id,
        type: "cropImage",
        position,
        data: {
          label: "Crop Image",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          connectedInputs: new Set<string>(),
        },
      };
    case "gemini":
      return {
        id,
        type: "gemini",
        position,
        data: {
          label: "Gemini 3.1 Pro",
          model: "gemini-3.1-pro",
          prompt: "",
          systemPrompt: "",
          images: [],
          temperature: 0.7,
          maxTokens: 8192,
          topP: 0.95,
          connectedInputs: new Set<string>(),
        },
      };
    default:
      return null;
  }
}

// Wrap with ReactFlowProvider
export function WorkflowCanvas({ workflowId }: { workflowId: string }) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner workflowId={workflowId} />
    </ReactFlowProvider>
  );
}
