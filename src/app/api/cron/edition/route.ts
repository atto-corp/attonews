import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '../../../services/service-container';

let container: ServiceContainer | null = null;

async function getContainer(): Promise<ServiceContainer> {
  if (!container) {
    container = ServiceContainer.getInstance();
  }
  return container;
}

// GET /api/cron/edition - Trigger hourly edition generation job
export async function GET(_request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: HOURLY EDITION GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered hourly edition generation...`);

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

        // Check if we should skip generation based on time constraints for this user
        const editor = await redis.getEditor(user.id);

        if (editor?.lastEditionGenerationTime && editor?.editionGenerationPeriodMinutes) {
          const timeSinceLastGeneration = (currentTime - editor.lastEditionGenerationTime) / (1000 * 60); // Convert to minutes
          const requiredInterval = editor.editionGenerationPeriodMinutes;

          if (timeSinceLastGeneration < requiredInterval) {
            const remainingMinutes = Math.ceil(requiredInterval - timeSinceLastGeneration);
            console.log(`[${new Date().toISOString()}] Skipping user ${user.id} - only ${timeSinceLastGeneration.toFixed(1)} minutes have passed since last run. Need ${requiredInterval} minutes. ${remainingMinutes} minutes remaining.`);
            userResults[user.id] = { skipped: true, reason: `Time constraint: ${remainingMinutes} minutes remaining` };
            continue;
          }
        }

        // Set job as running and update last run time for this user
        await redis.setJobRunning(user.id, 'newspaper', true);
        await redis.setJobLastRun(user.id, 'newspaper', currentTime);
        console.log(`[${new Date().toISOString()}] Set newspaper job running=true and last_run=${currentTime} for user ${user.id}`);

        try {
          const hourlyEdition = await editorService.generateHourlyEdition(user.id);

          // Update the last generation time for this user
          if (editor) {
            const updatedEditor = {
              ...editor,
              lastEditionGenerationTime: currentTime
            };
            await redis.saveEditor(user.id, updatedEditor);
            console.log(`[${new Date().toISOString()}] Updated last edition generation time to ${new Date(currentTime).toISOString()} for user ${user.id}`);
          }

          // Mark job as completed successfully for this user
          await redis.setJobRunning(user.id, 'newspaper', false);
          await redis.setJobLastSuccess(user.id, 'newspaper', currentTime);
          console.log(`[${new Date().toISOString()}] Set newspaper job running=false and last_success=${currentTime} for user ${user.id}`);

          userResults[user.id] = { editionId: hourlyEdition.id, skipped: false };
          console.log(`[${new Date().toISOString()}] Successfully generated hourly edition ${hourlyEdition.id} for user ${user.id}`);

        } catch (error) {
          // Mark job as not running on error (don't update last_success) for this user
          await redis.setJobRunning(user.id, 'newspaper', false);
          console.log(`[${new Date().toISOString()}] Set newspaper job running=false due to error for user ${user.id}`);
          console.error(`[${new Date().toISOString()}] Failed to generate edition for user ${user.id}:`, error);
          userResults[user.id] = { skipped: false, reason: error instanceof Error ? error.message : 'Unknown error' };
        }

      } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to process user ${user.id}:`, error);
        userResults[user.id] = { skipped: false, reason: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    console.log(`[${new Date().toISOString()}] Hourly edition generation completed for all users`);
    console.log('Cron job completed successfully\n');

    return NextResponse.json({
      success: true,
      message: `Hourly edition generation job completed successfully for ${users.length} users.`,
      userResults,
      lastGenerationTime: currentTime
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Cron job failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute hourly edition generation job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
