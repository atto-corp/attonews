import { NextRequest, NextResponse } from "next/server";
import { ServiceContainer } from "../../../services/service-container";
import { PERSONA_DISPLAY_NAMES } from "../../../services/ai-prompts";

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
    const aiService = await container.getAIService();

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
      // Get latest daily edition
      const dailyEditions = await redis.getDailyEditions(1);
      if (dailyEditions.length === 0) {
        await redis.setJobRunning("comments", false);
        console.log(
          `[${new Date().toISOString()}] No daily editions available to comment on`
        );
        return NextResponse.json({
          success: true,
          skipped: true,
          message: "No daily editions available to comment on"
        });
      }

      const dailyEdition = dailyEditions[0];
      console.log(
        `[${new Date().toISOString()}] Found daily edition: ${dailyEdition.id} with ${dailyEdition.topics.length} topics`
      );

      // Build daily edition text for the AI
      const dailyEditionText = [
        `Front Page Headline: ${dailyEdition.frontPageHeadline}`,
        `Front Page Article: ${dailyEdition.frontPageArticle}`,
        "",
        "Stories:",
        ...dailyEdition.topics.map(
          (topic, index) =>
            `Story ${index}: ${topic.name}\nHeadline: ${topic.headline}\nSummary: ${topic.oneLineSummary}\nFirst Paragraph: ${topic.newsStoryFirstParagraph}\nSecond Paragraph: ${topic.newsStorySecondParagraph}`
        )
      ].join("\n\n");

      // Collect existing comments
      const existingComments: Array<{ author: string; content: string }> = [];
      for (const topic of dailyEdition.topics) {
        if (topic.comments) {
          for (const comment of topic.comments) {
            existingComments.push({
              author: comment.author,
              content: comment.content
            });
          }
        }
      }

      // Generate comment
      const result = await aiService.generateComment(
        dailyEditionText,
        existingComments
      );

      if (!result) {
        await redis.setJobRunning("comments", false);
        console.log(`[${new Date().toISOString()}] Failed to generate comment`);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to generate comment"
          },
          { status: 500 }
        );
      }

      console.log(
        `[${new Date().toISOString()}] Generated comment: topicIndex=${result.topicIndex}, persona=${result.persona}`
      );

      // Add comment to the topic
      const topicIndex = result.topicIndex;
      if (topicIndex < 0 || topicIndex >= dailyEdition.topics.length) {
        await redis.setJobRunning("comments", false);
        console.log(
          `[${new Date().toISOString()}] Invalid topic index: ${topicIndex}`
        );
        return NextResponse.json(
          {
            success: false,
            error: `Invalid topic index: ${topicIndex}`
          },
          { status: 500 }
        );
      }

      // Initialize comments array if needed
      if (!dailyEdition.topics[topicIndex].comments) {
        dailyEdition.topics[topicIndex].comments = [];
      }

      // Add the new comment
      const newComment = {
        author: PERSONA_DISPLAY_NAMES[result.persona],
        content: result.commentText,
        createdAt: currentTime,
        persona: result.persona
      };
      dailyEdition.topics[topicIndex].comments!.push(newComment);

      // Save updated daily edition
      await redis.saveDailyEdition(dailyEdition);

      // Mark job as completed successfully
      await redis.setJobRunning("comments", false);
      await redis.setJobLastSuccess("comments", currentTime);
      console.log(
        `[${new Date().toISOString()}] Set comments job running=false and last_success=${currentTime}`
      );

      console.log(
        `[${new Date().toISOString()}] Successfully added comment to daily edition ${dailyEdition.id}, topic ${topicIndex}`
      );
      console.log("Cron job completed successfully\n");

      return NextResponse.json({
        success: true,
        message: `Comment generation job completed. Added comment to topic ${topicIndex} as ${newComment.author}.`,
        dailyEditionId: dailyEdition.id,
        topicIndex,
        author: newComment.author
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
