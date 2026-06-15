"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WorkflowError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Workflow error:", error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#09090b] p-6">
      <div className="animate-fade-in flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-zinc-100">
          Workflow Error
        </h2>
        <p className="mb-6 text-sm text-zinc-500">
          {error.message || "Failed to load or execute the workflow."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 transition-all hover:bg-purple-500"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
