import { NextResponse } from "next/server";
import { ServiceContainer } from "../../../../services/service-container";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: "Missing artifact ID" }, { status: 400 });
  }

  try {
    const artifactQueueService =
      await ServiceContainer.getInstance().getArtifactQueueService();
    const jobId = await artifactQueueService.queueSingle(id);
    return NextResponse.json({ jobId });
  } catch (error) {
    console.error("Error queuing artifact:", error);
    return NextResponse.json(
      { error: "Failed to queue artifact" },
      { status: 500 }
    );
  }
}
