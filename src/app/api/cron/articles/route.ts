import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '../../../services/service-container';

let container: ServiceContainer | null = null;

async function getContainer(): Promise<ServiceContainer> {
  if (!container) {
    container = ServiceContainer.getInstance();
  }
  return container;
}

// GET /api/cron/articles - Trigger reporter article generation job
export async function GET(_request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: REPORTER ARTICLE GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered article generation...`);

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

        // Set job as running and update last run time for this user
        await redis.setJobRunning(user.id, 'reporter', true);
        await redis.setJobLastRun(user.id, 'reporter', currentTime);
        console.log(`[${new Date().toISOString()}] Set reporter job running=true and last_run=${currentTime} for user ${user.id}`);

        try {
          // Proceed with generation for this user
          const results = await reporterService.generateAllReporterArticles(user.id);
          const userArticles = Object.values(results).reduce((sum, articles) => sum + articles.length, 0);
          totalArticlesGenerated += userArticles;

          // Update the last generation time for this user
          if (editor) {
            const updatedEditor = {
              ...editor,
              lastArticleGenerationTime: currentTime
            };
            await redis.saveEditor(user.id, updatedEditor);
            console.log(`[${new Date().toISOString()}] Updated last generation time to ${new Date(currentTime).toISOString()} for user ${user.id}`);
          }

          // Mark job as completed successfully for this user
          await redis.setJobRunning(user.id, 'reporter', false);
          await redis.setJobLastSuccess(user.id, 'reporter', currentTime);
          console.log(`[${new Date().toISOString()}] Set reporter job running=false and last_success=${currentTime} for user ${user.id}`);

          userResults[user.id] = { articles: userArticles, skipped: false };
          console.log(`[${new Date().toISOString()}] Successfully generated ${userArticles} articles for user ${user.id}`);

        } catch (error) {
          // Mark job as not running on error (don't update last_success) for this user
          await redis.setJobRunning(user.id, 'reporter', false);
          console.log(`[${new Date().toISOString()}] Set reporter job running=false due to error for user ${user.id}`);
          console.error(`[${new Date().toISOString()}] Failed to generate articles for user ${user.id}:`, error);
          userResults[user.id] = { articles: 0, skipped: false, reason: error instanceof Error ? error.message : 'Unknown error' };
        }

      } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to process user ${user.id}:`, error);
        userResults[user.id] = { articles: 0, skipped: false, reason: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    console.log(`[${new Date().toISOString()}] Successfully generated ${totalArticlesGenerated} articles across all users`);
    console.log('Cron job completed successfully\n');

    return NextResponse.json({
      success: true,
      message: `Reporter article generation job completed successfully. Generated ${totalArticlesGenerated} articles across ${users.length} users.`,
      totalArticles: totalArticlesGenerated,
      userResults,
      lastGenerationTime: currentTime
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cron job failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute reporter article generation job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
