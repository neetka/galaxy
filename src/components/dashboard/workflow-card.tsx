"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface WorkflowCardProps {
  id: string;
  name: string;
  updatedAt: string;
  nodeCount: number;
  lastRunStatus?: "success" | "failed" | "partial";
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function WorkflowCard({
  id,
  name,
  updatedAt,
  nodeCount,
  lastRunStatus,
  onDelete,
  onRename,
}: WorkflowCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRename = () => {
    if (editName.trim() && editName !== name) {
      onRename(id, editName.trim());
    }
    setIsRenaming(false);
  };

  const statusLabel: Record<string, string> = {
    success: "Passed",
    failed: "Failed",
    partial: "Partial",
  };

  const statusDot: Record<string, string> = {
    success: "bg-emerald-500",
    failed: "bg-red-500",
    partial: "bg-amber-500",
  };

  const timeAgo = getTimeAgo(new Date(updatedAt), now);

  return (
    <div
      className="group relative flex flex-col rounded-xl border border-gray-200/60 bg-white p-4 transition-all duration-150 hover:border-gray-300 hover:shadow-md cursor-pointer"
      onClick={() => !isRenaming && router.push(`/workflow/${id}`)}
    >
      {/* Canvas preview placeholder */}
      <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
        <div className="flex gap-1.5">
          {Array.from({ length: Math.min(nodeCount, 4) }).map((_, i) => (
            <div
              key={i}
              className="h-6 w-10 rounded bg-gray-200/60 border border-gray-200"
              style={{
                transform: `translateY(${i % 2 === 0 ? -3 : 3}px)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Name */}
      {isRenaming ? (
        <input
          ref={inputRef}
          className="mb-1.5 rounded-md border border-purple-400 bg-purple-50 px-2 py-1 text-[13px] font-medium text-slate-800 outline-none focus:border-purple-500"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <h3 className="mb-1.5 text-[13px] font-medium text-slate-800 truncate">
          {name}
        </h3>
      )}

      {/* Meta */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <span>{timeAgo}</span>
        <span className="text-slate-300">·</span>
        <span>{nodeCount} nodes</span>
        <span className="text-slate-300">·</span>
        <div className="flex items-center gap-1">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              lastRunStatus ? statusDot[lastRunStatus] : "bg-slate-300"
            }`}
          />
          <span>{lastRunStatus ? statusLabel[lastRunStatus] : "Draft"}</span>
        </div>
      </div>

      {/* Context menu */}
      <div ref={menuRef} className="absolute right-2.5 top-2.5">
        <button
          className="rounded-md p-1 text-slate-400 opacity-0 transition-all duration-150 hover:bg-gray-100 hover:text-slate-600 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-7 z-50 w-32 animate-fade-in rounded-lg border border-gray-200 bg-white py-0.5 shadow-lg">
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-slate-500 hover:bg-gray-50 hover:text-slate-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                setIsRenaming(true);
              }}
            >
              <Pencil className="h-3 w-3" />
              Rename
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete(id);
              }}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date, now: number): string {
  if (!now) return "—";
  const seconds = Math.floor((now - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
