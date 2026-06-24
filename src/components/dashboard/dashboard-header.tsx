"use client";

import { UserButton } from "@clerk/nextjs";
import { Plus, Workflow } from "lucide-react";

interface DashboardHeaderProps {
  onCreateWorkflow: () => void;
}

export function DashboardHeader({ onCreateWorkflow }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/60 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600">
            <Workflow className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            Galaxy
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCreateWorkflow}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-[13px] font-medium text-white transition-all duration-150 hover:bg-purple-500 active:scale-[0.97] shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New Workflow
          </button>
          <div className="ml-1.5 pl-2.5 border-l border-gray-200/60">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-7 w-7 rounded-full ring-1 ring-gray-200 hover:ring-gray-300 transition-all",
                },
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
