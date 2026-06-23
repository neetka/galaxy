"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  FileInput,
  Crop,
  Sparkles,
  FileOutput,
  X,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useWorkflowStore } from "@/stores/workflow-store";
import { NODE_CATALOG, type NodeCatalogEntry } from "@/lib/node-types";

const CATEGORY_LABELS: Record<string, string> = {
  input: "Input",
  transform: "Transform",
  ai: "AI Models",
  output: "Output",
};

const ICONS: Record<string, React.ReactNode> = {
  FileInput: <FileInput className="h-5 w-5" />,
  Crop: <Crop className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  FileOutput: <FileOutput className="h-5 w-5" />,
};

export function NodePicker() {
  const isOpen = useUIStore((s) => s.isNodePickerOpen);
  const toggleNodePicker = useUIStore((s) => s.toggleNodePicker);
  const setNodePickerOpen = useUIStore((s) => s.setNodePickerOpen);
  const addNode = useWorkflowStore((s) => s.addNode);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setNodePickerOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, setNodePickerOpen]);

  const filteredNodes = NODE_CATALOG.filter((node) => {
    const matchesSearch =
      !search ||
      node.label.toLowerCase().includes(search.toLowerCase()) ||
      node.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || node.category === activeCategory;
    // Filter out pre-placed nodes (requestInputs and response) from the picker
    return matchesSearch && matchesCategory && node.type !== "requestInputs" && node.type !== "response";
  });

  const categories = [...new Set(NODE_CATALOG
    .filter((n) => n.type !== "requestInputs" && n.type !== "response")
    .map((n) => n.category))];

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <>
      {/* Floating "+" button */}
      <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2">
        <button
          onClick={toggleNodePicker}
          className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-2xl transition-all duration-300 ${
            isOpen
              ? "rotate-45 bg-zinc-700 text-zinc-300"
              : "bg-purple-600 text-white shadow-purple-600/30 hover:bg-purple-500 hover:shadow-purple-500/40 hover:scale-110"
          }`}
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Picker panel */}
      {isOpen && (
        <div
          ref={pickerRef}
          className="absolute bottom-20 left-1/2 z-30 w-[420px] -translate-x-1/2 animate-slide-up rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/50"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-200">Add Node</h3>
            <button
              onClick={() => setNodePickerOpen(false)}
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                autoFocus
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-purple-500/50"
                placeholder="Search nodes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 px-4 pb-3">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !activeCategory
                  ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                  : "text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                    : "text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>

          {/* Node list */}
          <div className="max-h-[280px] overflow-y-auto px-3 pb-3">
            {filteredNodes.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-600">
                No nodes found
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNodes.map((node) => (
                  <NodePickerItem
                    key={node.type}
                    node={node}
                    onDragStart={onDragStart}
                    onClick={() => {
                      const id = `${node.type}-${Date.now()}`;
                      const newNode = {
                        id,
                        type: node.type,
                        position: { x: 450, y: 200 },
                        data: node.type === "cropImage" ? {
                          label: "Crop Image",
                          x: 0,
                          y: 0,
                          width: 100,
                          height: 100,
                          connectedInputs: new Set<string>(),
                        } : {
                          label: "Gemini 2.5 Pro",
                          model: "gemini-2.5-pro",
                          prompt: "",
                          systemPrompt: "",
                          images: [],
                          temperature: 0.7,
                          maxTokens: 8192,
                          topP: 0.95,
                          connectedInputs: new Set<string>(),
                        },
                      };
                      addNode(newNode as import("@/types/workflow").WorkflowNode);
                      setNodePickerOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function NodePickerItem({
  node,
  onDragStart,
  onClick,
}: {
  node: NodeCatalogEntry;
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
  onClick: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, node.type)}
      onClick={onClick}
      className="flex cursor-grab items-center gap-3 rounded-xl p-3 transition-colors hover:bg-zinc-800/70 active:cursor-grabbing"
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${node.color}20`, color: node.color }}
      >
        {ICONS[node.icon]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200">{node.label}</p>
        <p className="text-xs text-zinc-500 truncate">{node.description}</p>
      </div>
    </div>
  );
}
