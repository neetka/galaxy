"use client";

import { useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { BaseNode } from "./base-node";
import { useWorkflowStore } from "@/stores/workflow-store";
import type { GeminiNodeData } from "@/types/workflow";

const GEMINI_MODELS = [
  { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro" },
  { id: "gemini-3.1-flash", label: "Gemini 3.1 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
];

export function GeminiNode({ id, data }: NodeProps) {
  const nodeData = data as unknown as GeminiNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const connectedInputs = useWorkflowStore((s) => s.getConnectedInputs(id));
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isPromptConnected = connectedInputs.includes("prompt");
  const isSystemPromptConnected = connectedInputs.includes("systemPrompt");

  return (
    <div>
      {/* Input handles (left side) */}
      <Handle type="target" position={Position.Left} id="prompt" style={{ top: 80 }}
        className="!w-3 !h-3 !border-2 !border-zinc-600 !bg-zinc-800 hover:!border-purple-500 hover:!bg-purple-500" />
      <Handle type="target" position={Position.Left} id="systemPrompt" style={{ top: 140 }}
        className="!w-3 !h-3 !border-2 !border-zinc-600 !bg-zinc-800 hover:!border-purple-500 hover:!bg-purple-500" />
      <Handle type="target" position={Position.Left} id="image" style={{ top: 200 }}
        className="!w-3 !h-3 !border-2 !border-zinc-600 !bg-zinc-800 hover:!border-purple-500 hover:!bg-purple-500" />
      <Handle type="target" position={Position.Left} id="video" style={{ top: 230 }}
        className="!w-3 !h-3 !border-2 !border-zinc-600 !bg-zinc-800 hover:!border-purple-500 hover:!bg-purple-500" />
      <Handle type="target" position={Position.Left} id="audio" style={{ top: 260 }}
        className="!w-3 !h-3 !border-2 !border-zinc-600 !bg-zinc-800 hover:!border-purple-500 hover:!bg-purple-500" />
      <Handle type="target" position={Position.Left} id="file" style={{ top: 290 }}
        className="!w-3 !h-3 !border-2 !border-zinc-600 !bg-zinc-800 hover:!border-purple-500 hover:!bg-purple-500" />

      <BaseNode
        label={GEMINI_MODELS.find((m) => m.id === nodeData.model)?.label || "Gemini"}
        icon={<Sparkles className="h-4 w-4" />}
        color="#a855f7"
        isRunning={nodeData.isRunning}
        hasError={nodeData.hasError}
        headerExtra={
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400 outline-none"
            value={nodeData.model}
            onChange={(e) => updateNodeData(id, { model: e.target.value })}
          >
            {GEMINI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        }
      >
        {/* Prompt */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            Prompt
          </label>
          <textarea
            className={`w-full resize-none rounded-lg border px-3 py-2 text-xs outline-none transition-colors ${
              isPromptConnected
                ? "border-zinc-800 bg-zinc-800/20 text-zinc-600 cursor-not-allowed"
                : "border-zinc-700 bg-zinc-800/30 text-zinc-300 placeholder-zinc-600 focus:border-purple-500/50"
            }`}
            rows={3}
            placeholder={isPromptConnected ? "Connected" : "Enter your prompt..."}
            value={nodeData.prompt}
            onChange={(e) =>
              !isPromptConnected && updateNodeData(id, { prompt: e.target.value })
            }
            disabled={isPromptConnected}
          />
        </div>

        {/* System Prompt */}
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            System Prompt
          </label>
          <textarea
            className={`w-full resize-none rounded-lg border px-3 py-2 text-xs outline-none transition-colors ${
              isSystemPromptConnected
                ? "border-zinc-800 bg-zinc-800/20 text-zinc-600 cursor-not-allowed"
                : "border-zinc-700 bg-zinc-800/30 text-zinc-300 placeholder-zinc-600 focus:border-purple-500/50"
            }`}
            rows={2}
            placeholder={isSystemPromptConnected ? "Connected" : "System instructions..."}
            value={nodeData.systemPrompt}
            onChange={(e) =>
              !isSystemPromptConnected &&
              updateNodeData(id, { systemPrompt: e.target.value })
            }
            disabled={isSystemPromptConnected}
          />
        </div>

        {/* Media inputs indicator */}
        <div className="flex flex-wrap gap-1.5">
          {["image", "video", "audio", "file"].map((type) => (
            <span
              key={type}
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                connectedInputs.includes(type)
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "bg-zinc-800/50 text-zinc-600 border border-zinc-800"
              }`}
            >
              {type}
              {connectedInputs.includes(type) && " ✓"}
            </span>
          ))}
        </div>

        {/* Collapsible Settings */}
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex w-full items-center gap-1.5 rounded-lg py-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {settingsOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          Settings
        </button>

        {settingsOpen && (
          <div className="space-y-2 animate-fade-in">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-0.5 block text-[10px] text-zinc-600">
                  Temp
                </label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={2}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/30 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-purple-500/50"
                  value={nodeData.temperature}
                  onChange={(e) =>
                    updateNodeData(id, { temperature: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-zinc-600">
                  Max Tokens
                </label>
                <input
                  type="number"
                  step={256}
                  min={1}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/30 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-purple-500/50"
                  value={nodeData.maxTokens}
                  onChange={(e) =>
                    updateNodeData(id, { maxTokens: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-zinc-600">
                  Top P
                </label>
                <input
                  type="number"
                  step={0.05}
                  min={0}
                  max={1}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/30 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-purple-500/50"
                  value={nodeData.topP}
                  onChange={(e) =>
                    updateNodeData(id, { topP: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Response output */}
        {nodeData.response && (
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
            <p className="text-[10px] font-medium text-purple-400 mb-1">
              Response
            </p>
            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4">
              {nodeData.response}
            </p>
          </div>
        )}
      </BaseNode>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="response"
        className="!w-3 !h-3 !border-2 !border-zinc-600 !bg-zinc-800 hover:!border-purple-500 hover:!bg-purple-500"
        style={{ top: 38 }}
      />
    </div>
  );
}
