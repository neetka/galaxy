import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { createWorkflowSchema } from "@/lib/validations";

// GET /api/workflows — List all workflows for current user
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      nodes: true,
      edges: true,
      createdAt: true,
      updatedAt: true,
      runs: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { status: true },
      },
    },
  });

  const formattedWorkflows = workflows.map((w) => {
    const { runs, ...rest } = w;
    return {
      ...rest,
      lastRunStatus: runs[0]?.status || null,
    };
  });

  return NextResponse.json(formattedWorkflows);
}

// POST /api/workflows — Create a new workflow
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createWorkflowSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  let nodes: Record<string, unknown>[] = [];
  let edges: Record<string, unknown>[] = [];

  if (parsed.data.template === "marketing") {
    // Seed the sample 7-node marketing workflow
    nodes = [
      {
        id: "request-inputs-1",
        type: "requestInputs",
        position: { x: 100, y: 300 },
        data: {
          label: "Request Inputs",
          fields: [
            { id: "text-input", name: "Product Text Description", type: "text_field", value: "A high-performance gaming laptop with RTX 4080 graphics and a beautiful OLED screen." },
            { id: "image-input", name: "Product Image", type: "image_field", value: "" },
          ],
        },
        deletable: false,
      },
      {
        id: "crop-image-1",
        type: "cropImage",
        position: { x: 400, y: 100 },
        data: {
          label: "Crop Image #1",
          x: 0,
          y: 0,
          width: 50,
          height: 50,
          connectedInputs: new Set<string>(),
        },
      },
      {
        id: "crop-image-2",
        type: "cropImage",
        position: { x: 400, y: 500 },
        data: {
          label: "Crop Image #2",
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          connectedInputs: new Set<string>(),
        },
      },
      {
        id: "gemini-1",
        type: "gemini",
        position: { x: 400, y: 300 },
        data: {
          label: "Gemini #1 (Copywriter)",
          model: "gemini-3.5-flash",
          systemPrompt: "You are a marketing copywriter. Write a one-paragraph product description.",
          prompt: "",
          temperature: 0.7,
          maxTokens: 8192,
          topP: 0.95,
          connectedInputs: new Set<string>(),
        },
      },
      {
        id: "gemini-2",
        type: "gemini",
        position: { x: 700, y: 300 },
        data: {
          label: "Gemini #2 (Twitter Hook)",
          model: "gemini-3.5-flash",
          systemPrompt: "Condense the following product description into a tweet-length hook under 240 characters.",
          prompt: "",
          temperature: 0.7,
          maxTokens: 8192,
          topP: 0.95,
          connectedInputs: new Set<string>(),
        },
      },
      {
        id: "final-gemini",
        type: "gemini",
        position: { x: 1000, y: 300 },
        data: {
          label: "Final Gemini (Social Post)",
          model: "gemini-3.5-flash",
          systemPrompt: "You are a social media manager. Combine the tweet hook and the two product crops into a final marketing post.",
          prompt: "",
          temperature: 0.7,
          maxTokens: 8192,
          topP: 0.95,
          connectedInputs: new Set<string>(),
        },
      },
      {
        id: "response-1",
        type: "response",
        position: { x: 1300, y: 300 },
        data: {
          label: "Response",
          result: "",
        },
        deletable: false,
      },
    ];

    edges = [
      {
        id: "e1",
        source: "request-inputs-1",
        target: "crop-image-1",
        sourceHandle: "image-input_image",
        targetHandle: "inputImage",
        animated: true,
        style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
      },
      {
        id: "e2",
        source: "request-inputs-1",
        target: "crop-image-2",
        sourceHandle: "image-input_image",
        targetHandle: "inputImage",
        animated: true,
        style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
      },
      {
        id: "e3",
        source: "request-inputs-1",
        target: "gemini-1",
        sourceHandle: "text-input",
        targetHandle: "prompt",
        animated: true,
        style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
      },
      {
        id: "e4",
        source: "gemini-1",
        target: "gemini-2",
        sourceHandle: "response",
        targetHandle: "prompt",
        animated: true,
        style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
      },
      {
        id: "e5",
        source: "crop-image-1",
        target: "final-gemini",
        sourceHandle: "outputImage",
        targetHandle: "image",
        animated: true,
        style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
      },
      {
        id: "e6",
        source: "crop-image-2",
        target: "final-gemini",
        sourceHandle: "outputImage",
        targetHandle: "image",
        animated: true,
        style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
      },
      {
        id: "e7",
        source: "gemini-2",
        target: "final-gemini",
        sourceHandle: "response",
        targetHandle: "prompt",
        animated: true,
        style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
      },
      {
        id: "e8",
        source: "final-gemini",
        target: "response-1",
        sourceHandle: "response",
        targetHandle: "result",
        animated: true,
        style: { stroke: "hsl(271, 91%, 65%)", strokeWidth: 2 },
      },
    ];
  } else {
    // Default nodes: Request Inputs + Response (pre-placed)
    nodes = [
      {
        id: "request-inputs-1",
        type: "requestInputs",
        position: { x: 100, y: 200 },
        data: {
          label: "Request Inputs",
          fields: [
            { id: "field-1", name: "Input Text", type: "text_field", value: "" },
          ],
        },
        deletable: false,
      },
      {
        id: "response-1",
        type: "response",
        position: { x: 800, y: 200 },
        data: {
          label: "Response",
          result: "",
        },
        deletable: false,
      },
    ];
    edges = [];
  }

  const workflow = await prisma.workflow.create({
    data: {
      userId,
      name: parsed.data.name,
      nodes: nodes as unknown as Prisma.InputJsonValue,
      edges: edges as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json(workflow, { status: 201 });
}
