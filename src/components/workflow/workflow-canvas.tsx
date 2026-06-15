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
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  // Poll workflow run status in the background when running
  useEffect(() => {
    if (!isRunning) return;

    let intervalId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await fetch(`/api/runs/${workflowId}`);
        if (!res.ok) return;
        const runs = await res.json();
        if (runs.length === 0) return;

        const latestRun = runs[0];

        // Update each node state
        latestRun.nodeRuns.forEach((nodeRun: any) => {
          if (nodeRun.status === "running") {
            setNodeRunning(nodeRun.nodeId, true);
            setNodeError(nodeRun.nodeId, false);
          } else if (nodeRun.status === "success") {
            setNodeRunning(nodeRun.nodeId, false);
            setNodeError(nodeRun.nodeId, false);
            // Update node data with output
            const output = typeof nodeRun.output === "string" ? JSON.parse(nodeRun.output) : nodeRun.output;
            if (output) {
              if (nodeRun.nodeType === "cropImage") {
                updateNodeData(nodeRun.nodeId, { output: output.outputImage });
              } else if (nodeRun.nodeType === "gemini") {
                updateNodeData(nodeRun.nodeId, { response: output.response });
              } else if (nodeRun.nodeType === "response") {
                updateNodeData(nodeRun.nodeId, { result: output.result });
              }
            }
          } else if (nodeRun.status === "failed") {
            setNodeRunning(nodeRun.nodeId, false);
            setNodeError(nodeRun.nodeId, true);
          }
        });

        if (latestRun.status === "success" || latestRun.status === "failed") {
          setIsRunning(false);
        }
      } catch (err) {
        console.error("Error polling run status:", err);
      }
    };

    // Poll immediately, then every 1500ms
    poll();
    intervalId = setInterval(poll, 1500);

    return () => clearInterval(intervalId);
  }, [isRunning, workflowId, setIsRunning, setNodeRunning, setNodeError, updateNodeData]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected nodes
      if (e.key === "Delete" || e.key === "Backspace") {
        const selectedNodes = useWorkflowStore.getState().selectedNodes;
        selectedNodes.forEach((id) => {
          const node = useWorkflowStore.getState().nodes.find((n) => n.id === id);
          if (node && node.deletable !== false) {
            removeNode(id);
          }
        });
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

  return (
    <div className="relative h-full w-full">
      {/* Toolbar */}
      <WorkflowToolbar workflowId={workflowId} />

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
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{
              type: "custom",
              animated: true,
              style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
            }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode={null} // We handle delete manually
            multiSelectionKeyCode="Shift"
            className="bg-[#09090b]"
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#333"
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
