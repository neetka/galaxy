import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerRunSchema } from "@/lib/validations";
import { after } from "next/server";
import { executeDAG } from "@/lib/engine/dag-executor";

// POST /api/runs — Trigger a workflow execution
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = triggerRunSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // Verify ownership
  const workflow = await prisma.workflow.findUnique({
    where: { id: parsed.data.workflowId },
    select: { userId: true },
  });

  if (!workflow || workflow.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Create a run record
  const run = await prisma.workflowRun.create({
    data: {
      workflowId: parsed.data.workflowId,
      status: "partial", // Initially partial
      scope: parsed.data.scope,
    },
  });

  // Execute in the background after returning the response
  after(async () => {
    const startTime = Date.now();
    console.log("[api/runs/POST] Starting workflow execution for runId:", run.id);
    
    try {
      console.log("[api/runs/POST] Starting DAG execution with scope:", parsed.data.scope);
      const nodeRunResults = await executeDAG(
        {
          nodes: parsed.data.nodes,
          edges: parsed.data.edges,
          scope: parsed.data.scope,
          targetNodeIds: parsed.data.nodeIds,
          onNodeStart: async (nodeId) => {
            console.log("[api/runs/POST] Node start:", nodeId);
            const node = parsed.data.nodes.find((n: { id: string; type?: string }) => n.id === nodeId);
            await prisma.nodeRun.create({
              data: {
                runId: run.id,
                nodeId,
                nodeType: node?.type || "unknown",
                status: "running",
              },
            });
          },
          onNodeComplete: async (nodeId, result) => {
            console.log("[api/runs/POST] Node complete:", nodeId, "status:", result.status);
            const existingNodeRun = await prisma.nodeRun.findFirst({
              where: { runId: run.id, nodeId },
            });
            if (existingNodeRun) {
              await prisma.nodeRun.update({
                where: { id: existingNodeRun.id },
                data: {
                  status: "success",
                  durationMs: result.durationMs,
                  input: result.input ? (result.input as unknown as object) : undefined,
                  output: result.output ? (result.output as unknown as object) : undefined,
                },
              });
            }
          },
          onNodeError: async (nodeId, error) => {
            console.error("[api/runs/POST] Node error:", nodeId, error);
            const existingNodeRun = await prisma.nodeRun.findFirst({
              where: { runId: run.id, nodeId },
            });
            if (existingNodeRun) {
              await prisma.nodeRun.update({
                where: { id: existingNodeRun.id },
                data: {
                  status: "failed",
                  error,
                },
              });
            }
          },
        },
        async (nodeId, nodeType, inputs) => {
          console.log("[api/runs/POST] Executing node:", nodeId, "type:", nodeType);
          
          if (nodeType === "requestInputs") {
            const outputs: Record<string, unknown> = {};
            const fields = (inputs.fields || []) as { id: string; value: unknown; type: string }[];
            for (const f of fields) {
              outputs[f.id] = f.value;
              if (f.type === "image_field") {
                outputs[`${f.id}_image`] = f.value;
              }
            }
            console.log("[api/runs/POST] RequestInputs outputs:", Object.keys(outputs));
            return outputs;
          } else if (nodeType === "cropImage") {
            const inputImage = inputs.inputImage as string;
            const x = Number(inputs.x ?? 0);
            const y = Number(inputs.y ?? 0);
            const width = Number(inputs.width ?? 100);
            const height = Number(inputs.height ?? 100);
            if (!inputImage) {
              throw new Error("No input image connected");
            }
            const { executeCropImage } = await import("@/trigger/crop-image-task");
            const res = await executeCropImage({
              imageBase64: inputImage,
              x,
              y,
              width,
              height,
            });
            return {
              outputImage: res.croppedImageBase64,
            };
          } else if (nodeType === "gemini") {
            // Validate and sanitize model (prefer gemini-2.0-flash for free tier)
            const validModels = ["gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-pro", "gemini-1.5-flash"];
            const rawModel = (inputs.model as string);
            const model = validModels.includes(rawModel) ? rawModel : "gemini-2.0-flash";
            
            const prompt = (inputs.prompt as string) || "";
            const systemPrompt = (inputs.systemPrompt as string) || "";
            const image = inputs.image as string | undefined;
            const video = inputs.video as string | undefined;
            const audio = inputs.audio as string | undefined;
            const file = inputs.file as string | undefined;

            const images = image ? [image] : [];
            console.log("[api/runs/POST] Executing Gemini with:", {
              model,
              promptLength: prompt.length,
              hasSystemPrompt: !!systemPrompt,
              hasImages: !!images.length,
            });
            
            const { executeGemini } = await import("@/trigger/gemini-task");
            const res = await executeGemini({
              model,
              prompt,
              systemPrompt,
              images,
              video,
              audio,
              file,
            });
            
            console.log("[api/runs/POST] Gemini returned response, length:", res.response.length);
            return {
              response: res.response,
            };
          } else if (nodeType === "response") {
            const result = (inputs.result as string) || "";
            return {
              result,
            };
          }
          return {};
        }
      );

      const hasFailure = nodeRunResults.some((r) => r.status === "failed");
      const durationMs = Date.now() - startTime;
      console.log("[api/runs/POST] DAG execution complete, duration:", durationMs, "ms, hasFailure:", hasFailure);

      // Update WorkflowRun record with the final status and duration
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: hasFailure ? "failed" : "success",
          durationMs,
        },
      });

      // Update the workflow's nodes JSON to store the outputs/response in the workflow structure itself so the frontend gets them on load!
      const finalNodes = parsed.data.nodes.map((node: { id: string; type: string; data: Record<string, unknown> }) => {
        const nodeRun = nodeRunResults.find((r) => r.nodeId === node.id);
        if (nodeRun) {
          if (node.type === "gemini") {
            return {
              ...node,
              data: {
                ...node.data,
                response: nodeRun.output?.response || "",
                hasError: nodeRun.status === "failed",
              },
            };
          } else if (node.type === "cropImage") {
            return {
              ...node,
              data: {
                ...node.data,
                output: nodeRun.output?.outputImage || "",
                hasError: nodeRun.status === "failed",
              },
            };
          } else if (node.type === "response") {
            return {
              ...node,
              data: {
                ...node.data,
                result: nodeRun.output?.result || "",
                hasError: nodeRun.status === "failed",
              },
            };
          }
        }
        return node;
      });

      await prisma.workflow.update({
        where: { id: parsed.data.workflowId },
        data: {
          nodes: finalNodes,
        },
      });

    } catch (error) {
      console.error("[api/runs/POST] Workflow execution failed:", error);
      const durationMs = Date.now() - startTime;
      
      // Get a clear error message
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Clean up any NodeRun records still stuck in "running" status
      try {
        await prisma.nodeRun.updateMany({
          where: {
            runId: run.id,
            status: "running",
          },
          data: {
            status: "failed",
            error: `Workflow crashed: ${errorMessage}`,
          },
        });
      } catch (cleanupErr) {
        console.error("[api/runs/POST] Failed to clean up running nodes:", cleanupErr);
      }

      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          durationMs,
        },
      });
    }
  });

  return NextResponse.json(run, { status: 201 });
}
