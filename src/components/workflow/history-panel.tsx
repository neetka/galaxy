"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronRight, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

interface RunData {
  id: string;
  status: "success" | "failed" | "partial";
  scope: string;
  durationMs: number | null;
  createdAt: string;
  nodeRuns: {
    id: string;
    nodeId: string;
    nodeType: string;
    status: string;
    error: string | null;
    durationMs: number | null;
  }[];
}

export function HistoryPanel({ workflowId }: { workflowId: string }) {
  const setHistoryPanelOpen = useUIStore((s) => s.setHistoryPanelOpen);
  const [runs, setRuns] = useState<RunData[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function fetchRuns() {
      try {
        const res = await fetch(`/api/runs/${workflowId}`);
        if (res.ok) {
          setRuns(await res.json());
          setFetchError(false);
        } else {
          setFetchError(true);
        }
      } catch (error) {
        console.error("Failed to fetch runs:", error);
        setFetchError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRuns();

    const intervalId = setInterval(fetchRuns, 3000);
    return () => clearInterval(intervalId);
  }, [workflowId]);

  const statusConfig = {
    success: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Success" },
    failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200", label: "Failed" },
    partial: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Partial" },
  };

  return (
    <div className="h-full w-80 border-l border-gray-200/60 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 mt-14">
        <h3 className="text-sm font-semibold text-slate-700">Run History</h3>
        <button
          onClick={() => setHistoryPanelOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Runs list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400/60 mb-3" />
            <p className="text-sm text-slate-500">Failed to load history</p>
            <p className="text-xs text-slate-400 mt-1">Try closing and reopening this panel</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No runs yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Run your workflow to see history here
            </p>
          </div>
        ) : (
          runs.map((run) => {
            const config = statusConfig[run.status];
            const StatusIcon = config.icon;
            const isExpanded = expandedRun === run.id;

            return (
              <div key={run.id} className="animate-fade-in">
                <button
                  onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                  className={`w-full rounded-xl border ${config.border} ${config.bg} p-3 text-left transition-colors hover:bg-opacity-70`}
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${config.color}`} />
                    <span className={`text-xs font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="ml-auto text-[10px] text-slate-400">
                      {run.scope}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                    <span>{new Date(run.createdAt).toLocaleTimeString()}</span>
                    {run.durationMs && (
                      <span>{(run.durationMs / 1000).toFixed(1)}s</span>
                    )}
                    <span>{run.nodeRuns.length} nodes</span>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && run.nodeRuns.length > 0 && (
                  <div className="mt-1 space-y-1 pl-2 animate-fade-in">
                    {run.nodeRuns.map((nodeRun) => (
                      <div
                        key={nodeRun.id}
                        className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            nodeRun.status === "success"
                              ? "bg-emerald-500"
                              : nodeRun.status === "failed"
                              ? "bg-red-500"
                              : "bg-slate-300"
                          }`}
                        />
                        <span className="flex-1 text-xs text-slate-500 truncate">
                          {nodeRun.nodeType}
                        </span>
                        {nodeRun.durationMs && (
                          <span className="text-[10px] text-slate-400">
                            {(nodeRun.durationMs / 1000).toFixed(1)}s
                          </span>
                        )}
                        {nodeRun.error && (
                          <span className="text-[10px] text-red-500 truncate max-w-[200px]" title={nodeRun.error}>
                            {nodeRun.error}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
