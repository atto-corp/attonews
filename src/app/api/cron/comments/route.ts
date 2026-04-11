import { NextRequest, NextResponse } from "next/server";
import { ServiceContainer } from "../../../services/service-container";

let container: ServiceContainer | null = null;

async function getContainer(): Promise<ServiceContainer> {
  if (!container) {
    container = ServiceContainer.getInstance();
  }
  return container;
}

// GET /api/cron/comments - Trigger comment generation for latest daily edition
export async function GET(_request: NextRequest) {
  try {
    console.log("\n=== CRON JOB: COMMENT GENERATION ===");
    console.log(
      `[${new Date().toISOString()}] Starting cron-triggered comment generation...`
    );

    const container = await getContainer();
    const redis = await container.getDataStorageService();
    const editorService = await container.getEditorService();

    const currentTime = Date.now();

    // Throttle: Only run once per day (check last success)
    const lastSuccess = await redis.getJobLastSuccess("comments");
    if (lastSuccess) {
      const hoursSinceLastSuccess =
        (currentTime - lastSuccess) / (1000 * 60 * 60);
      if (hoursSinceLastSuccess < 24) {
        console.log(
          `[${new Date().toISOString()}] Skipping comment generation: Only ${hoursSinceLastSuccess.toFixed(1)} hours since last run`
        );
        return NextResponse.json({
          success: true,
          skipped: true,
          message: "Comment generation skipped: ran within the last 24 hours"
        });
      }
    }

    // Set job as running and update last run time
    await redis.setJobRunning("comments", true);
    await redis.setJobLastRun("comments", currentTime);
    console.log(
      `[${new Date().toISOString()}] Set comments job running=true and last_run=${currentTime}`
    );

    try {
      const { topicIndex, author } = await editorService.generateComment();

      // Mark job as completed successfully
      await redis.setJobRunning("comments", false);
      await redis.setJobLastSuccess("comments", currentTime);
      console.log(
        `[${new Date().toISOString()}] Set comments job running=false and last_success=${currentTime}`
      );

      console.log(
        `[${new Date().toISOString()}] Successfully added comment to topic ${topicIndex} as ${author}`
      );
      console.log("Cron job completed successfully\n");

      return NextResponse.json({
        success: true,
        message: `Comment generation job completed. Added comment to topic ${topicIndex} as ${author}.`,
        topicIndex,
        author
      });
    } catch (error) {
      // Mark job as not running on error (don't update last_success)
      await redis.setJobRunning("comments", false);
      console.log(
        `[${new Date().toISOString()}] Set comments job running=false due to error`
      );
      throw error; // Re-throw to be handled by outer catch
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cron job failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute comment generation job",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
