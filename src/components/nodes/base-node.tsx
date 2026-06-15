"use client";

import { type ReactNode } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface BaseNodeProps {
  label: string;
  icon: ReactNode;
  color: string;
  isRunning?: boolean;
  hasError?: boolean;
  children: ReactNode;
  headerExtra?: ReactNode;
  isDeletable?: boolean;
}

export function BaseNode({
  label,
  icon,
  color,
  isRunning = false,
  hasError = false,
  children,
  headerExtra,
}: BaseNodeProps) {
  return (
    <div
      className={`
        w-[320px] rounded-2xl border bg-zinc-900/95 backdrop-blur-sm shadow-lg
        transition-all duration-300
        ${isRunning ? "animate-node-glow border-purple-500/50" : "border-zinc-700/60"}
        ${hasError ? "border-red-500/50" : ""}
        hover:shadow-xl hover:border-zinc-600/60
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-zinc-800/50 px-4 py-3">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasError ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            icon
          )}
        </div>
        <span className="flex-1 text-sm font-semibold text-zinc-200 truncate">
          {label}
        </span>
        {headerExtra}
        {isRunning && (
          <span className="flex items-center gap-1 text-xs text-purple-400">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
            Running
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}
