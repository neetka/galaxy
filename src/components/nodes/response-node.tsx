"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileOutput } from "lucide-react";
import { BaseNode } from "./base-node";
import { useWorkflowStore } from "@/stores/workflow-store";
import type { ResponseNodeData } from "@/types/workflow";

export function ResponseNode({ id, data }: NodeProps) {
  const nodeData = data as unknown as ResponseNodeData;
  const nodeErrors = useWorkflowStore((s) => s.nodeErrors);
  const errorMessage = nodeErrors.get(id) || null;

  return (
    <div>
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="result"
        className="!w-3 !h-3 !border-2 !border-zinc-600 !bg-zinc-800 hover:!border-green-500 hover:!bg-green-500"
        style={{ top: 38 }}
      />

      <BaseNode
        label="Response"
        icon={<FileOutput className="h-4 w-4" />}
        color="#22c55e"
        isRunning={nodeData.isRunning}
        hasError={nodeData.hasError}
        errorMessage={errorMessage}
        isDeletable={false}
      >
        {/* Result display */}
        <div className="min-h-[60px] rounded-xl border border-zinc-800 bg-zinc-800/20 p-3">
          {nodeData.result ? (
            <div>
              <p className="text-[10px] font-medium text-green-400 mb-1.5">
                Output
              </p>
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {nodeData.result}
              </p>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-xs text-zinc-600">
                Connect a result input to see the workflow output
              </p>
            </div>
          )}
        </div>
      </BaseNode>
    </div>
  );
}
