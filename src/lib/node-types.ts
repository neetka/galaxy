import { HANDLE_COMPATIBILITY, type HandleType, type HandleDefinition } from "@/types/workflow";

// ── Node Handle Definitions ──────────────────────────────────────────

export const REQUEST_INPUTS_HANDLES: HandleDefinition[] = [];
// Dynamic — created per field in the node component

export const CROP_IMAGE_HANDLES: { inputs: HandleDefinition[]; outputs: HandleDefinition[] } = {
  inputs: [
    { id: "inputImage", type: "target", dataType: "image", label: "Input Image" },
    { id: "x", type: "target", dataType: "text", label: "X %" },
    { id: "y", type: "target", dataType: "text", label: "Y %" },
    { id: "width", type: "target", dataType: "text", label: "W %" },
    { id: "height", type: "target", dataType: "text", label: "H %" },
  ],
  outputs: [
    { id: "outputImage", type: "source", dataType: "image", label: "Output Image" },
  ],
};

export const GEMINI_HANDLES: { inputs: HandleDefinition[]; outputs: HandleDefinition[] } = {
  inputs: [
    { id: "prompt", type: "target", dataType: "text", label: "Prompt" },
    { id: "systemPrompt", type: "target", dataType: "text", label: "System Prompt" },
    { id: "image", type: "target", dataType: "image", label: "Image (Vision)" },
    { id: "video", type: "target", dataType: "video", label: "Video" },
    { id: "audio", type: "target", dataType: "audio", label: "Audio" },
    { id: "file", type: "target", dataType: "file", label: "File" },
  ],
  outputs: [
    { id: "response", type: "source", dataType: "text", label: "Response" },
  ],
};

export const RESPONSE_HANDLES: { inputs: HandleDefinition[]; outputs: HandleDefinition[] } = {
  inputs: [
    { id: "result", type: "target", dataType: "text", label: "Result" },
  ],
  outputs: [],
};

// ── Connection Validation ────────────────────────────────────────────

/**
 * Maps nodeType -> handleId -> HandleDefinition
 * Used for connection type-checking.
 */
export function getHandleDataType(
  nodeType: string,
  handleId: string,
  handleType: "source" | "target"
): HandleType | null {
  const registry: Record<string, { inputs: HandleDefinition[]; outputs: HandleDefinition[] }> = {
    cropImage: CROP_IMAGE_HANDLES,
    gemini: GEMINI_HANDLES,
    response: RESPONSE_HANDLES,
  };

  const def = registry[nodeType];
  if (!def) {
    // requestInputs — all outputs are dynamic, default to "text" unless image_field
    if (nodeType === "requestInputs") {
      return handleId.endsWith("_image") ? "image" : "text";
    }
    return null;
  }

  const handles = handleType === "source" ? def.outputs : def.inputs;
  const found = handles.find((h) => h.id === handleId);
  return found?.dataType ?? null;
}

/**
 * Check if two handle types are compatible for connection.
 */
export function areHandlesCompatible(
  sourceType: HandleType,
  targetType: HandleType
): boolean {
  const compatible = HANDLE_COMPATIBILITY[sourceType];
  return compatible?.includes(targetType) ?? false;
}

// ── Node Catalog (for Node Picker) ───────────────────────────────────

export interface NodeCatalogEntry {
  type: string;
  label: string;
  description: string;
  category: "input" | "transform" | "ai" | "output";
  icon: string; // Lucide icon name
  color: string;
}

export const NODE_CATALOG: NodeCatalogEntry[] = [
  {
    type: "requestInputs",
    label: "Request Inputs",
    description: "Define input fields for your workflow",
    category: "input",
    icon: "FileInput",
    color: "#3b82f6",
  },
  {
    type: "cropImage",
    label: "Crop Image",
    description: "Crop an image by percentage coordinates",
    category: "transform",
    icon: "Crop",
    color: "#f97316",
  },
  {
    type: "gemini",
    label: "Gemini 2.5 Pro",
    description: "Google Gemini multimodal AI model",
    category: "ai",
    icon: "Sparkles",
    color: "#a855f7",
  },
  {
    type: "response",
    label: "Response",
    description: "Final output of the workflow",
    category: "output",
    icon: "FileOutput",
    color: "#22c55e",
  },
];
