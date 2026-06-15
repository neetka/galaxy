"use client";

import { Workflow, Plus, Sparkles } from "lucide-react";

interface EmptyStateProps {
  onCreateWorkflow: () => void;
}

export function EmptyState({ onCreateWorkflow }: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="animate-fade-in flex max-w-md flex-col items-center text-center">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/10">
            <Workflow className="h-10 w-10 text-purple-400" />
          </div>
          <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 shadow-lg shadow-purple-600/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-zinc-100">
          No workflows yet
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-zinc-500">
          Create your first AI workflow to get started. Connect nodes like Gemini AI,
          image processing, and more to build powerful automation pipelines.
        </p>

        <button
          onClick={onCreateWorkflow}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 transition-all hover:bg-purple-500 hover:shadow-purple-500/30 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Create your first workflow
        </button>
      </div>
    </div>
  );
}
