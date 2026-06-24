"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  RefreshCw,
  Workflow,
  CheckCircle2,
  XCircle,
  Activity,
  Clock,
} from "lucide-react";
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

interface RecentRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  scope: string;
  durationMs: number | null;
  createdAt: string;
}

interface DashboardMetrics {
  totalRuns: number;
  successCount: number;
  failedCount: number;
  successRate: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRuns: 0,
    successCount: 0,
    failedCount: 0,
    successRate: 0,
  });

  const [now, setNow] = useState<number>(0);

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
      setFetchError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/runs");
      if (res.ok) {
        const data = await res.json();
        setRecentRuns(data.recentRuns || []);
        setMetrics(
          data.metrics || {
            totalRuns: 0,
            successCount: 0,
            failedCount: 0,
            successRate: 0,
          }
        );
      }
    } catch {
      // Silently fail — activity is not critical
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    fetchWorkflows();
    fetchActivity();
  }, [fetchWorkflows, fetchActivity]);

  const handleCreate = async (
    name: string,
    template: "default" | "marketing"
  ) => {
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

  const statusIcon: Record<string, React.ReactNode> = {
    success: <CheckCircle2 className="h-3 w-3 text-emerald-600" />,
    failed: <XCircle className="h-3 w-3 text-red-500" />,
    partial: <AlertTriangle className="h-3 w-3 text-amber-500" />,
  };

  function formatDuration(ms: number | null): string {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  function getTimeAgo(dateStr: string): string {
    if (!now) return "—";
    const seconds = Math.floor(
      (now - new Date(dateStr).getTime()) / 1000
    );
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fb]">
      <DashboardHeader onCreateWorkflow={() => setIsCreateOpen(true)} />

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {/* Skeleton metrics */}
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-gray-100 bg-white/60"
                />
              ))}
            </div>
            {/* Skeleton cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-xl border border-gray-100 bg-white/60"
                />
              ))}
            </div>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="mb-1.5 text-sm font-medium text-slate-800">
              Something went wrong
            </h3>
            <p className="mb-4 max-w-xs text-[12px] text-slate-500">
              {fetchError}
            </p>
            <button
              onClick={fetchWorkflows}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-purple-500"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        ) : workflows.length === 0 ? (
          <EmptyState onCreateWorkflow={() => setIsCreateOpen(true)} />
        ) : (
          <div className="space-y-6">
            {/* Metrics row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard
                label="Workflows"
                value={workflows.length}
                icon={<Workflow className="h-3.5 w-3.5" />}
              />
              <MetricCard
                label="Executions"
                value={metrics.totalRuns}
                icon={<Activity className="h-3.5 w-3.5" />}
              />
              <MetricCard
                label="Success Rate"
                value={`${metrics.successRate}%`}
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                valueColor={
                  metrics.successRate >= 80
                    ? "text-emerald-600"
                    : metrics.successRate >= 50
                      ? "text-amber-600"
                      : "text-red-500"
                }
              />
              <MetricCard
                label="Failed"
                value={metrics.failedCount}
                icon={<XCircle className="h-3.5 w-3.5" />}
                valueColor={
                  metrics.failedCount > 0 ? "text-red-500" : undefined
                }
              />
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Workflows section */}
              <div className="lg:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">
                    Workflows ({workflows.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {workflows.map((workflow) => (
                    <WorkflowCard
                      key={workflow.id}
                      id={workflow.id}
                      name={workflow.name}
                      updatedAt={workflow.updatedAt}
                      nodeCount={
                        Array.isArray(workflow.nodes)
                          ? workflow.nodes.length
                          : 0
                      }
                      lastRunStatus={workflow.lastRunStatus ?? undefined}
                      onDelete={handleDelete}
                      onRename={handleRename}
                    />
                  ))}
                </div>
              </div>

              {/* Recent Activity sidebar */}
              <div>
                <div className="mb-3">
                  <h2 className="text-[12px] font-medium text-slate-400 uppercase tracking-wider">
                    Recent Activity
                  </h2>
                </div>
                <div className="rounded-xl border border-gray-200/60 bg-white">
                  {recentRuns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <Clock className="mb-2 h-5 w-5 text-slate-300" />
                      <p className="text-[12px] text-slate-400">
                        No runs yet
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {recentRuns.map((run) => (
                        <button
                          key={run.id}
                          onClick={() =>
                            router.push(`/workflow/${run.workflowId}`)
                          }
                          className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                        >
                          <div className="shrink-0">
                            {statusIcon[run.status] || (
                              <Activity className="h-3 w-3 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-medium text-slate-700 truncate">
                              {run.workflowName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {getTimeAgo(run.createdAt)}
                              {run.durationMs !== null && (
                                <> · {formatDuration(run.durationMs)}</>
                              )}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              run.status === "success"
                                ? "bg-emerald-50 text-emerald-600"
                                : run.status === "failed"
                                  ? "bg-red-50 text-red-500"
                                  : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {run.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
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

function MetricCard({
  label,
  value,
  icon,
  valueColor,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200/60 bg-white px-4 py-3">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className={`text-xl font-semibold ${valueColor || "text-slate-800"}`}>
        {value}
      </p>
    </div>
  );
}
