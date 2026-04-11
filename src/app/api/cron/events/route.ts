import { NextRequest, NextResponse } from "next/server";
import { ServiceContainer } from "../../../services/service-container";

let container: ServiceContainer | null = null;

async function getContainer(): Promise<ServiceContainer> {
  if (!container) {
    container = ServiceContainer.getInstance();
  }
  return container;
}

export async function GET(_request: NextRequest) {
  try {
    console.log("\n=== CRON JOB: REPORTER EVENT GENERATION ===");
    console.log(
      `[${new Date().toISOString()}] Starting cron-triggered event generation...`
    );

    const container = await getContainer();
    const editorService = await container.getEditorService();

    const result = await editorService.runJob("events", {
      enforceTimeConstraint: true
    });

    if (result.skipped) {
      console.log(
        "Event generation cron job skipped due to time constraints\n"
      );
      return NextResponse.json({
        success: true,
        message: result.message,
        skipped: true,
        nextGenerationInMinutes: result.nextGenerationInMinutes
      });
    }

    console.log("Event generation cron job completed successfully\n");
    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Event generation cron job failed:`,
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute reporter event generation job",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
