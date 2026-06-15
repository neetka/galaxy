"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Crop } from "lucide-react";
import { BaseNode } from "./base-node";
import { useWorkflowStore } from "@/stores/workflow-store";
import type { CropImageNodeData } from "@/types/workflow";

export function CropImageNode({ id, data }: NodeProps) {
  const nodeData = data as unknown as CropImageNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const connectedInputs = useWorkflowStore((s) => s.getConnectedInputs(id));

  const fields = [
    { key: "x", label: "X %", handleId: "x" },
    { key: "y", label: "Y %", handleId: "y" },
    { key: "width", label: "W %", handleId: "width" },
    { key: "height", label: "H %", handleId: "height" },
  ] as const;

  return (
    <div>
      {/* Input image handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="inputImage"
        className="!w-3 !h-3 !border-2 !border-zinc-600 !bg-zinc-800 hover:!border-orange-500 hover:!bg-orange-500"
        style={{ top: 38 }}
      />

      <BaseNode
        label="Crop Image"
        icon={<Crop className="h-4 w-4" />}
        color="#f97316"
        isRunning={nodeData.isRunning}
        hasError={nodeData.hasError}
      >
        {/* Image preview / placeholder */}
        <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-800/30">
          {nodeData.inputImage ? (
            <img
              src={nodeData.inputImage}
              alt="Input"
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <span className="text-xs text-zinc-600">
              {connectedInputs.includes("inputImage")
                ? "Connected — waiting for data"
                : "Connect an image input"}
            </span>
          )}
        </div>

        {/* Crop parameters */}
        <div className="grid grid-cols-2 gap-2">
          {fields.map(({ key, label, handleId }) => {
            const isConnected = connectedInputs.includes(handleId);
            return (
              <div key={key} className="relative">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={handleId}
                  className="!w-2.5 !h-2.5 !border-2 !border-zinc-600 !bg-zinc-800 hover:!border-orange-500 hover:!bg-orange-500"
                />
                <label className="mb-1 block text-[10px] font-medium text-zinc-500 uppercase">
                  {label}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none transition-colors ${
                    isConnected
                      ? "border-zinc-800 bg-zinc-800/20 text-zinc-600 cursor-not-allowed"
                      : "border-zinc-700 bg-zinc-800/30 text-zinc-300 focus:border-orange-500/50"
                  }`}
                  value={nodeData[key]}
                  onChange={(e) =>
                    !isConnected &&
                    updateNodeData(id, { [key]: Number(e.target.value) })
                  }
                  disabled={isConnected}
                />
              </div>
            );
          })}
        </div>

        {/* Output preview */}
        {!!nodeData.output && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-2">
            <p className="text-[10px] font-medium text-green-400 mb-1">Output</p>
            <div className="h-16 rounded-lg bg-zinc-800/50 flex items-center justify-center">
              <span className="text-xs text-zinc-500">Cropped image ready</span>
            </div>
          </div>
        )}
      </BaseNode>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="outputImage"
        className="!w-3 !h-3 !border-2 !border-zinc-600 !bg-zinc-800 hover:!border-orange-500 hover:!bg-orange-500"
        style={{ top: 38 }}
      />
    </div>
  );
}
