"use client";

import { useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileInput, Plus, Trash2, Type, Image as ImageIcon } from "lucide-react";
import { BaseNode } from "./base-node";
import { useWorkflowStore } from "@/stores/workflow-store";
import type { RequestInputsNodeData, InputField } from "@/types/workflow";

export function RequestInputsNode({ id, data }: NodeProps) {
  const nodeData = data as unknown as RequestInputsNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const nodeErrors = useWorkflowStore((s) => s.nodeErrors);
  const errorMessage = nodeErrors.get(id) || null;

  const addField = useCallback(
    (type: "text_field" | "image_field") => {
      const fields = [...nodeData.fields];
      const newField: InputField = {
        id: `field-${Date.now()}`,
        name: type === "text_field" ? `Text ${fields.length + 1}` : `Image ${fields.length + 1}`,
        type,
        value: "",
      };
      updateNodeData(id, { fields: [...fields, newField] });
    },
    [id, nodeData.fields, updateNodeData]
  );

  const removeField = useCallback(
    (fieldId: string) => {
      updateNodeData(id, {
        fields: nodeData.fields.filter((f) => f.id !== fieldId),
      });
    },
    [id, nodeData.fields, updateNodeData]
  );

  const updateField = useCallback(
    (fieldId: string, updates: Partial<InputField>) => {
      updateNodeData(id, {
        fields: nodeData.fields.map((f) =>
          f.id === fieldId ? { ...f, ...updates } : f
        ),
      });
    },
    [id, nodeData.fields, updateNodeData]
  );

  return (
    <div>
      <BaseNode
        label="Request Inputs"
        icon={<FileInput className="h-4 w-4" />}
        color="#3b82f6"
        isRunning={nodeData.isRunning}
        hasError={nodeData.hasError}
        errorMessage={errorMessage}
        isDeletable={false}
      >
        <div className="space-y-2">
          {nodeData.fields.map((field) => (
            <div key={field.id} className="group relative">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-800/30 p-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-700/50">
                  {field.type === "text_field" ? (
                    <Type className="h-3 w-3 text-blue-400" />
                  ) : (
                    <ImageIcon className="h-3 w-3 text-green-400" />
                  )}
                </div>
                <input
                  className="flex-1 bg-transparent text-xs text-zinc-300 outline-none placeholder-zinc-600"
                  value={field.name}
                  onChange={(e) => updateField(field.id, { name: e.target.value })}
                  placeholder="Field name"
                />
                <button
                  onClick={() => removeField(field.id)}
                  className="rounded p-0.5 text-zinc-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Field value input */}
              {field.type === "text_field" ? (
                <textarea
                  className="mt-1 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-800/20 px-3 py-2 text-xs text-zinc-400 outline-none placeholder-zinc-700 focus:border-blue-500/30"
                  rows={2}
                  placeholder="Enter text..."
                  value={field.value}
                  onChange={(e) => updateField(field.id, { value: e.target.value })}
                />
              ) : (
                <div className="mt-1 flex h-16 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-800/20">
                  {field.value ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={field.value}
                        alt="uploaded"
                        className="h-full w-full rounded-lg object-cover"
                      />
                    </>
                  ) : (
                    <span className="text-xs text-zinc-600">
                      Drop image or click to upload
                    </span>
                  )}
                </div>
              )}

              {/* Output handle for this field */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${field.id}${field.type === "image_field" ? "_image" : ""}`}
                className="!w-3 !h-3 !border-2 !border-zinc-600 !bg-zinc-800 hover:!border-blue-500 hover:!bg-blue-500"
                style={{ top: "50%" }}
              />
            </div>
          ))}
        </div>

        {/* Add field buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => addField("text_field")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 py-2 text-xs text-zinc-500 transition-colors hover:border-blue-500/30 hover:text-blue-400"
          >
            <Plus className="h-3 w-3" />
            Text
          </button>
          <button
            onClick={() => addField("image_field")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 py-2 text-xs text-zinc-500 transition-colors hover:border-green-500/30 hover:text-green-400"
          >
            <Plus className="h-3 w-3" />
            Image
          </button>
        </div>
      </BaseNode>
    </div>
  );
}
