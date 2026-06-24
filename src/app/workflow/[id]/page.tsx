"use client";

import { use, useEffect, useState } from "react";
import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import { useWorkflowStore } from "@/stores/workflow-store";

export default function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const setWorkflow = useWorkflowStore((s) => s.setWorkflow);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkflow() {
      try {
        const res = await fetch(`/api/workflows/${id}`);
        if (!res.ok) {
          // If fetch fails with 404, might be a new workflow — load defaults
          if (res.status === 404) {
            setError("Workflow not found");
            return;
          }
          throw new Error("Failed to load workflow");
        }
        const data = await res.json();
        const nodes = Array.isArray(data.nodes) ? data.nodes : [];
        const edges = Array.isArray(data.edges) ? data.edges : [];
        setWorkflow(data.id, data.name, nodes, edges);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkflow();
  }, [id, setWorkflow]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f9fb]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Error</h2>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f9fb]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return <WorkflowCanvas workflowId={id} />;
}
