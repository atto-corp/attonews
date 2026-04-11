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
    console.log("\n=== CRON JOB: REPORTER ARTICLES FROM EVENTS GENERATION ===");
    console.log(
      `[${new Date().toISOString()}] Starting cron-triggered article generation from events...`
    );

    const container = await getContainer();
    const editorService = await container.getEditorService();

    const result = await editorService.runJob("reporter", {
      enforceTimeConstraint: true
    });

    if (result.skipped) {
      console.log(
        "Article generation from events cron job skipped due to time constraints\n"
      );
      return NextResponse.json({
        success: true,
        message: result.message,
        skipped: true,
        nextGenerationInMinutes: result.nextGenerationInMinutes
      });
    }

    console.log(
      "Article generation from events cron job completed successfully\n"
    );
    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Article generation from events cron job failed:`,
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute reporter article generation from events job",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
