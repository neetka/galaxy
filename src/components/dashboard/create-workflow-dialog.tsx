"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface CreateWorkflowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, template: "default" | "marketing") => void;
}

export function CreateWorkflowDialog({
  isOpen,
  onClose,
  onCreate,
}: CreateWorkflowDialogProps) {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<"default" | "marketing">("default");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await onCreate(name.trim(), template);
      setName("");
      setTemplate("default");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md animate-slide-up rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-1 text-lg font-semibold text-zinc-50">
          Create New Workflow
        </h2>
        <p className="mb-6 text-sm text-zinc-500">
          Give your workflow a name and select a starting template.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Workflow Name
            </label>
            <input
              autoFocus
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-50 placeholder-zinc-600 outline-none transition-colors focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
              placeholder="My AI Workflow"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Template
            </label>
            <select
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-300 outline-none transition-colors focus:border-purple-500/50"
              value={template}
              onChange={(e) => setTemplate(e.target.value as "default" | "marketing")}
            >
              <option value="default">Blank Workflow (Request + Response)</option>
              <option value="marketing">Social Marketing Generator (7-node template)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 transition-all hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
