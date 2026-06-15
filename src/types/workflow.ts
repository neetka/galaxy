import type { Node, Edge } from "@xyflow/react";

// ── Node Data Types ──────────────────────────────────────────────────

export type HandleType = "text" | "image" | "video" | "audio" | "file";

export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  isRunning?: boolean;
  hasError?: boolean;
  output?: unknown;
}

export interface InputField {
  id: string;
  name: string;
  type: "text_field" | "image_field";
  value: string;
}

export interface RequestInputsNodeData extends BaseNodeData {
  fields: InputField[];
}

export interface CropImageNodeData extends BaseNodeData {
  x: number;
  y: number;
  width: number;
  height: number;
  inputImage?: string;
  connectedInputs: Set<string>;
}

export interface GeminiNodeData extends BaseNodeData {
  model: string;
  prompt: string;
  systemPrompt: string;
  images: string[];
  video?: string;
  audio?: string;
  file?: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  response?: string;
  connectedInputs: Set<string>;
}

export interface ResponseNodeData extends BaseNodeData {
  result?: string;
}

// ── Discriminated union of all node data types ───────────────────────

export type WorkflowNodeData =
  | RequestInputsNodeData
  | CropImageNodeData
  | GeminiNodeData
  | ResponseNodeData;

// ── React Flow Node/Edge aliases ─────────────────────────────────────

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

// ── Node Type Registry ───────────────────────────────────────────────

export const NODE_TYPES = {
  requestInputs: "requestInputs",
  cropImage: "cropImage",
  gemini: "gemini",
  response: "response",
} as const;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];

// ── Execution Types ──────────────────────────────────────────────────

export type RunStatus = "success" | "failed" | "partial";
export type RunScope = "full" | "single" | "multi";

export interface NodeRunResult {
  nodeId: string;
  nodeType: string;
  status: "success" | "failed" | "skipped";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  durationMs: number;
}

export interface WorkflowRunResult {
  id: string;
  workflowId: string;
  status: RunStatus;
  scope: RunScope;
  durationMs: number;
  nodeRuns: NodeRunResult[];
  createdAt: Date;
}

// ── Handle Registry ──────────────────────────────────────────────────

export interface HandleDefinition {
  id: string;
  type: "source" | "target";
  dataType: HandleType;
  label: string;
}

// Connection compatibility matrix
export const HANDLE_COMPATIBILITY: Record<HandleType, HandleType[]> = {
  text: ["text"],
  image: ["image"],
  video: ["video"],
  audio: ["audio"],
  file: ["file", "image", "video", "audio"],
};
