import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '../../../services/service-container';

let container: ServiceContainer | null = null;

async function getContainer(): Promise<ServiceContainer> {
  if (!container) {
    container = ServiceContainer.getInstance();
  }
  return container;
}

// GET /api/cron/articles-from-events - Trigger reporter article generation from events job
export async function GET(_request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: REPORTER ARTICLES FROM EVENTS GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered article generation from events...`);

    const container = await getContainer();
    const redis = await container.getDataStorageService();
    const reporterService = await container.getReporterService();

    // Get all users
    const users = await redis.getAllUsers();
    console.log(`[${new Date().toISOString()}] Found ${users.length} users to process`);

    const currentTime = Date.now();
    let totalArticlesGenerated = 0;
    const userResults: { [userId: string]: { articles: number; skipped: boolean; reason?: string } } = {};

    // Process each user
    for (const user of users) {
      try {
        console.log(`[${new Date().toISOString()}] Processing user ${user.id} (${user.email})`);

        // Check if we should skip generation based on time constraints for this user
        const editor = await redis.getEditor(user.id);

        if (editor?.lastArticleGenerationTime && editor?.articleGenerationPeriodMinutes) {
          const timeSinceLastGeneration = (currentTime - editor.lastArticleGenerationTime) / (1000 * 60); // Convert to minutes
          const requiredInterval = editor.articleGenerationPeriodMinutes;

          if (timeSinceLastGeneration < requiredInterval) {
            const remainingMinutes = Math.ceil(requiredInterval - timeSinceLastGeneration);
            console.log(`[${new Date().toISOString()}] Skipping user ${user.id} - only ${timeSinceLastGeneration.toFixed(1)} minutes have passed since last run. Need ${requiredInterval} minutes. ${remainingMinutes} minutes remaining.`);
            userResults[user.id] = { articles: 0, skipped: true, reason: `Time constraint: ${remainingMinutes} minutes remaining` };
            continue;
          }
        }

        try {
          // Proceed with generation for this user
          const results = await reporterService.generateArticlesFromEvents(user.id);
          const userArticles = Object.values(results).reduce((sum, articles) => sum + articles.length, 0);
          totalArticlesGenerated += userArticles;

          // Update the last generation time for this user
          if (editor) {
            const updatedEditor = {
              ...editor,
              lastArticleGenerationTime: currentTime
            };
            await redis.saveEditor(user.id, updatedEditor);
            console.log(`[${new Date().toISOString()}] Updated last article generation time to ${new Date(currentTime).toISOString()} for user ${user.id}`);
          }

          userResults[user.id] = { articles: userArticles, skipped: false };
          console.log(`[${new Date().toISOString()}] Successfully generated ${userArticles} articles from events for user ${user.id}`);

        } catch (error) {
          console.error(`[${new Date().toISOString()}] Failed to generate articles from events for user ${user.id}:`, error);
          userResults[user.id] = { articles: 0, skipped: false, reason: error instanceof Error ? error.message : 'Unknown error' };
        }

      } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to process user ${user.id}:`, error);
        userResults[user.id] = { articles: 0, skipped: false, reason: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    console.log(`[${new Date().toISOString()}] Successfully generated ${totalArticlesGenerated} articles from events across all users`);
    console.log('Article generation from events cron job completed successfully\n');

    return NextResponse.json({
      success: true,
      message: `Reporter article generation from events job completed successfully. Generated ${totalArticlesGenerated} articles across ${users.length} users.`,
      totalArticles: totalArticlesGenerated,
      userResults,
      lastGenerationTime: currentTime
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Article generation from events cron job failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute reporter article generation from events job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
