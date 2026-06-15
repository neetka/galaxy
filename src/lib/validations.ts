import { z } from "zod";

// ── Workflow Validation Schemas ──────────────────────────────────────

export const createWorkflowSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  template: z.enum(["default", "marketing"]).optional(),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nodes: z.any().optional(), // React Flow serialized nodes
  edges: z.any().optional(), // React Flow serialized edges
});

// ── Run Schemas ──────────────────────────────────────────────────────

export const triggerRunSchema = z.object({
  workflowId: z.string().cuid(),
  scope: z.enum(["full", "single", "multi"]),
  nodeIds: z.array(z.string()).optional(), // for single/multi scope
  nodes: z.any(), // serialized nodes with current data
  edges: z.any(), // serialized edges
});

// ── Input Field Schema ───────────────────────────────────────────────

export const inputFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(["text_field", "image_field"]),
  value: z.string(),
});

// ── Type exports ─────────────────────────────────────────────────────

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type TriggerRunInput = z.infer<typeof triggerRunSchema>;
