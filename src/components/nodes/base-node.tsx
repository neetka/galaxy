"use client";

import { type ReactNode } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface BaseNodeProps {
  label: string;
  icon: ReactNode;
  color: string;
  isRunning?: boolean;
  hasError?: boolean;
  errorMessage?: string | null;
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
  errorMessage = null,
  children,
  headerExtra,
}: BaseNodeProps) {
  return (
    <div
      className={`
        w-[320px] rounded-2xl border bg-white shadow-md backdrop-blur-sm
        transition-all duration-300
        ${isRunning ? "animate-node-glow border-purple-300" : "border-gray-200"}
        ${hasError ? "animate-node-error border-red-300" : ""}
        hover:shadow-lg hover:border-gray-300
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}12`, color }}
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasError ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            icon
          )}
        </div>
        <span className="flex-1 text-sm font-semibold text-slate-700 truncate">
          {label}
        </span>
        {headerExtra}
        {isRunning && (
          <span className="flex items-center gap-1 text-xs text-purple-600">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
            Running
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {hasError && errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
              <span className="break-words leading-relaxed">{errorMessage}</span>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
