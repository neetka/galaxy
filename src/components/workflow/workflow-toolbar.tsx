"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Play,
  History,
  Download,
  Upload,
  Pencil,
  Check,
  Loader2,
} from "lucide-react";
import { useWorkflowStore } from "@/stores/workflow-store";
import { useUIStore } from "@/stores/ui-store";

interface WorkflowToolbarProps {
  workflowId: string;
}

export function WorkflowToolbar({ workflowId }: WorkflowToolbarProps) {
  const router = useRouter();
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName);
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const isRunning = useWorkflowStore((s) => s.isRunning);

  const toggleHistoryPanel = useUIStore((s) => s.toggleHistoryPanel);
  const isHistoryPanelOpen = useUIStore((s) => s.isHistoryPanelOpen);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(workflowName);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          nodes,
          edges,
        }),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [workflowId, workflowName, nodes, edges]);

  // Listen for Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const handleRename = () => {
    if (editName.trim()) {
      setWorkflowName(editName.trim());
    }
    setIsEditing(false);
  };

  const handleRun = async () => {
    // Clear old node states and set running
    useWorkflowStore.getState().clearNodeStates();
    useWorkflowStore.getState().setIsRunning(true);

    // Save first, then trigger execution
    await handleSave();

    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          scope: "full",
          nodes,
          edges,
        }),
      });
      if (!res.ok) {
        useWorkflowStore.getState().setIsRunning(false);
        const data = await res.json().catch(() => ({}));
        useWorkflowStore.getState().setWorkflowError(data.error || "Failed to start workflow execution");
      }
    } catch (error) {
      console.error("Failed to run:", error);
      useWorkflowStore.getState().setIsRunning(false);
      useWorkflowStore.getState().setWorkflowError(
        error instanceof Error ? error.message : "Failed to start workflow execution"
      );
    }
  };

  const handleExport = () => {
    const data = JSON.stringify({ name: workflowName, nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.nodes && data.edges) {
          useWorkflowStore.getState().setWorkflow(
            workflowId,
            data.name || workflowName,
            data.nodes,
            data.edges
          );
        }
      } catch {
        console.error("Invalid workflow file");
      }
    };
    input.click();
  };

  return (
    <div className="absolute left-0 right-0 top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200/60 bg-white/80 px-4 backdrop-blur-xl">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="h-5 w-px bg-gray-200" />

        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              className="rounded-lg border border-purple-400 bg-purple-50 px-2 py-1 text-sm font-medium text-slate-800 outline-none"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setEditName(workflowName);
                  setIsEditing(false);
                }
              }}
            />
            <button
              onClick={handleRename}
              className="rounded-lg p-1 text-green-600 hover:bg-green-50"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditName(workflowName);
              setIsEditing(true);
            }}
            className="group flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-gray-100"
          >
            <span className="text-sm font-medium text-slate-700">
              {workflowName}
            </span>
            <Pencil className="h-3 w-3 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleImport}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-medium text-slate-500 transition-all hover:border-gray-300 hover:text-slate-700"
          title="Import"
        >
          <Upload className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleExport}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-medium text-slate-500 transition-all hover:border-gray-300 hover:text-slate-700"
          title="Export"
        >
          <Download className="h-3.5 w-3.5" />
        </button>

        <div className="h-5 w-px bg-gray-200" />

        <button
          onClick={toggleHistoryPanel}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all ${
            isHistoryPanelOpen
              ? "border-purple-200 bg-purple-50 text-purple-600"
              : "border-gray-200 text-slate-500 hover:border-gray-300 hover:text-slate-700"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          History
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all disabled:opacity-50 ${
            saveStatus === "error"
              ? "border-red-200 text-red-500 hover:border-red-300"
              : "border-gray-200 text-slate-500 hover:border-gray-300 hover:text-slate-700"
          }`}
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saveStatus === "saved" ? "Saved!" : saveStatus === "error" ? "Error!" : "Save"}
        </button>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex h-8 items-center gap-1.5 rounded-xl bg-purple-600 px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-purple-500 disabled:opacity-50"
        >
          {isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
          {isRunning ? "Running..." : "Run"}
        </button>
      </div>
    </div>
  );
}
