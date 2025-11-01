import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '../../../services/service-container';

let container: ServiceContainer | null = null;

async function getContainer(): Promise<ServiceContainer> {
  if (!container) {
    container = ServiceContainer.getInstance();
  }
  return container;
}

// GET /api/cron/daily - Trigger daily edition generation job
export async function GET(_request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: DAILY EDITION GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered daily edition generation...`);

    const container = await getContainer();
    const redis = await container.getDataStorageService();
    const editorService = await container.getEditorService();

    // Get all users
    const users = await redis.getAllUsers();
    console.log(`[${new Date().toISOString()}] Found ${users.length} users to process`);

    const currentTime = Date.now();
    const userResults: { [userId: string]: { editionId?: string; skipped: boolean; reason?: string } } = {};

    // Process each user
    for (const user of users) {
      try {
        console.log(`[${new Date().toISOString()}] Processing user ${user.id} (${user.email})`);

        // Set job as running and update last run time for this user
        await redis.setJobRunning(user.id, 'daily', true);
        await redis.setJobLastRun(user.id, 'daily', currentTime);
        console.log(`[${new Date().toISOString()}] Set daily job running=true and last_run=${currentTime} for user ${user.id}`);

        try {
          const dailyEdition = await editorService.generateDailyEdition(user.id);

          // Mark job as completed successfully for this user
          await redis.setJobRunning(user.id, 'daily', false);
          await redis.setJobLastSuccess(user.id, 'daily', currentTime);
          console.log(`[${new Date().toISOString()}] Set daily job running=false and last_success=${currentTime} for user ${user.id}`);

          userResults[user.id] = { editionId: dailyEdition.id, skipped: false };
          console.log(`[${new Date().toISOString()}] Successfully generated daily edition ${dailyEdition.id} for user ${user.id}`);

        } catch (error) {
          // Mark job as not running on error (don't update last_success) for this user
          await redis.setJobRunning(user.id, 'daily', false);
          console.log(`[${new Date().toISOString()}] Set daily job running=false due to error for user ${user.id}`);
          console.error(`[${new Date().toISOString()}] Failed to generate daily edition for user ${user.id}:`, error);
          userResults[user.id] = { skipped: false, reason: error instanceof Error ? error.message : 'Unknown error' };
        }

      } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to process user ${user.id}:`, error);
        userResults[user.id] = { skipped: false, reason: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    console.log(`[${new Date().toISOString()}] Daily edition generation completed for all users`);
    console.log('Cron job completed successfully\n');

    return NextResponse.json({
      success: true,
      message: `Daily edition generation job completed successfully for ${users.length} users.`,
      userResults
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cron job failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute daily edition generation job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
