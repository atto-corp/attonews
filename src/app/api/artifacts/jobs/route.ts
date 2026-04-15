import { NextResponse } from "next/server";
import { ServiceContainer } from "../../../services/service-container";

// GET /api/artifacts/jobs - Get all artifact jobs
export async function GET() {
  const artifactQueueService =
    await ServiceContainer.getInstance().getArtifactQueueService();
  const jobs = await artifactQueueService.getJobs();
  return NextResponse.json(jobs);
}
