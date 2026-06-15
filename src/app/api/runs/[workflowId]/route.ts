import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/runs/[workflowId] — Fetch run history for a workflow
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workflowId } = await params;

  // Verify ownership
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { userId: true },
  });

  if (!workflow || workflow.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const runs = await prisma.workflowRun.findMany({
    where: { workflowId },
    orderBy: { createdAt: "desc" },
    include: {
      nodeRuns: {
        orderBy: { id: "asc" },
      },
    },
    take: 50,
  });

  return NextResponse.json(runs);
}
