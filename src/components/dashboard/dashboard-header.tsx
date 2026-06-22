"use client";

import { UserButton } from "@clerk/nextjs";
import { Plus, Upload, Workflow } from "lucide-react";

interface DashboardHeaderProps {
  onCreateWorkflow: () => void;
}

export function DashboardHeader({ onCreateWorkflow }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-400">
            <Workflow className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
            Galaxy
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-100"
            title="Import workflow"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button
            onClick={onCreateWorkflow}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 transition-all duration-200 hover:bg-purple-500 hover:shadow-purple-500/30 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New Workflow
          </button>
          <div className="ml-2 pl-3 border-l border-zinc-800">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 rounded-full ring-2 ring-zinc-700 hover:ring-purple-500 transition-all",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
