"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { WorkflowCard } from "@/components/dashboard/workflow-card";
import { CreateWorkflowDialog } from "@/components/dashboard/create-workflow-dialog";
import { EmptyState } from "@/components/dashboard/empty-state";

interface Workflow {
  id: string;
  name: string;
  updatedAt: string;
  nodes: unknown[];
  edges: unknown[];
  lastRunStatus: "success" | "failed" | "partial" | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/workflows");
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      } else {
        setFetchError("Failed to load workflows. Please try again.");
      }
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
      setFetchError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleCreate = async (name: string, template: "default" | "marketing") => {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, template }),
    });

    if (res.ok) {
      const workflow = await res.json();
      router.push(`/workflow/${workflow.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  };

  const handleRename = async (id: string, name: string) => {
    await fetch(`/api/workflows/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, name } : w))
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b]">
      <DashboardHeader onCreateWorkflow={() => setIsCreateOpen(true)} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/50"
              />
            ))}
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-100">Something went wrong</h3>
            <p className="mb-6 max-w-sm text-sm text-zinc-500">{fetchError}</p>
            <button
              onClick={fetchWorkflows}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-500"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : workflows.length === 0 ? (
          <EmptyState onCreateWorkflow={() => setIsCreateOpen(true)} />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                Your Workflows ({workflows.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {workflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  id={workflow.id}
                  name={workflow.name}
                  updatedAt={workflow.updatedAt}
                  nodeCount={
                    Array.isArray(workflow.nodes) ? workflow.nodes.length : 0
                  }
                  lastRunStatus={workflow.lastRunStatus ?? undefined}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <CreateWorkflowDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
