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
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md animate-slide-up rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-1 text-lg font-semibold text-slate-800">
          Create New Workflow
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Give your workflow a name and select a starting template.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Workflow Name
            </label>
            <input
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 focus:bg-white"
              placeholder="My AI Workflow"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">
              Template
            </label>
            <select
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-purple-400"
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
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-gray-300 hover:text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
