"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Clock } from "lucide-react";
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

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
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

  const statusColor = {
    success: "bg-green-500",
    failed: "bg-red-500",
    partial: "bg-yellow-500",
  };

  const timeAgo = getTimeAgo(new Date(updatedAt));

  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-purple-900/10 cursor-pointer"
      onClick={() => !isRenaming && router.push(`/workflow/${id}`)}
    >
      {/* Canvas preview placeholder */}
      <div className="mb-4 flex h-32 items-center justify-center rounded-xl bg-zinc-800/50 border border-zinc-800">
        <div className="flex gap-2">
          {Array.from({ length: Math.min(nodeCount, 4) }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-14 rounded-lg bg-zinc-700/50 border border-zinc-700"
              style={{
                transform: `translateY(${i % 2 === 0 ? -4 : 4}px)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Name */}
      {isRenaming ? (
        <input
          ref={inputRef}
          className="mb-1 rounded-lg border border-purple-500/50 bg-zinc-800 px-2 py-1 text-sm font-medium text-zinc-50 outline-none focus:border-purple-500"
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
        <h3 className="mb-1 text-sm font-semibold text-zinc-100 truncate">
          {name}
        </h3>
      )}

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Clock className="h-3 w-3" />
        <span>{timeAgo}</span>
        <span className="text-zinc-700">•</span>
        <span>{nodeCount} nodes</span>
        {lastRunStatus && (
          <>
            <span className="text-zinc-700">•</span>
            <span
              className={`h-2 w-2 rounded-full ${statusColor[lastRunStatus]}`}
            />
          </>
        )}
      </div>

      {/* Context menu */}
      <div ref={menuRef} className="absolute right-3 top-3">
        <button
          className="rounded-lg p-1.5 text-zinc-600 opacity-0 transition-all duration-200 hover:bg-zinc-800 hover:text-zinc-300 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-50 w-36 animate-fade-in rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                setIsRenaming(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete(id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
