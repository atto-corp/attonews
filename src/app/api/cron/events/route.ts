import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '../../../services/service-container';

let container: ServiceContainer | null = null;

async function getContainer(): Promise<ServiceContainer> {
  if (!container) {
    container = ServiceContainer.getInstance();
  }
  return container;
}

// GET /api/cron/events - Trigger reporter event generation job
export async function GET(_request: NextRequest) {
  try {
    console.log('\n=== CRON JOB: REPORTER EVENT GENERATION ===');
    console.log(`[${new Date().toISOString()}] Starting cron-triggered event generation...`);

    const container = await getContainer();
    const redis = await container.getDataStorageService();
    const reporterService = await container.getReporterService();

    // Get all users
    const users = await redis.getAllUsers();
    console.log(`[${new Date().toISOString()}] Found ${users.length} users to process`);

    const currentTime = Date.now();
    let totalEventsGenerated = 0;
    const userResults: { [userId: string]: { events: number; skipped: boolean; reason?: string } } = {};

    // Process each user
    for (const user of users) {
      try {
        console.log(`[${new Date().toISOString()}] Processing user ${user.id} (${user.email})`);

        // Check if we should skip generation based on time constraints for this user
        const editor = await redis.getEditor(user.id);

        if (editor?.lastEventGenerationTime && editor?.eventGenerationPeriodMinutes) {
          const timeSinceLastGeneration = (currentTime - editor.lastEventGenerationTime) / (1000 * 60); // Convert to minutes
          const requiredInterval = editor.eventGenerationPeriodMinutes;

          if (timeSinceLastGeneration < requiredInterval) {
            const remainingMinutes = Math.ceil(requiredInterval - timeSinceLastGeneration);
            console.log(`[${new Date().toISOString()}] Skipping user ${user.id} - only ${timeSinceLastGeneration.toFixed(1)} minutes have passed since last run. Need ${requiredInterval} minutes. ${remainingMinutes} minutes remaining.`);
            userResults[user.id] = { events: 0, skipped: true, reason: `Time constraint: ${remainingMinutes} minutes remaining` };
            continue;
          }
        }

        try {
          // Proceed with generation for this user
          const results = await reporterService.generateAllReporterEvents(user.id);
          const userEvents = Object.values(results).reduce((sum, events) => sum + events.length, 0);
          totalEventsGenerated += userEvents;

          // Update the last generation time for this user
          if (editor) {
            const updatedEditor = {
              ...editor,
              lastEventGenerationTime: currentTime
            };
            await redis.saveEditor(user.id, updatedEditor);
            console.log(`[${new Date().toISOString()}] Updated last event generation time to ${new Date(currentTime).toISOString()} for user ${user.id}`);
          }

          userResults[user.id] = { events: userEvents, skipped: false };
          console.log(`[${new Date().toISOString()}] Successfully generated ${userEvents} events for user ${user.id}`);

        } catch (error) {
          console.error(`[${new Date().toISOString()}] Failed to generate events for user ${user.id}:`, error);
          userResults[user.id] = { events: 0, skipped: false, reason: error instanceof Error ? error.message : 'Unknown error' };
        }

      } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to process user ${user.id}:`, error);
        userResults[user.id] = { events: 0, skipped: false, reason: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    console.log(`[${new Date().toISOString()}] Successfully generated ${totalEventsGenerated} events across all users`);
    console.log('Event generation cron job completed successfully\n');

    return NextResponse.json({
      success: true,
      message: `Reporter event generation job completed successfully. Generated ${totalEventsGenerated} events across ${users.length} users.`,
      totalEvents: totalEventsGenerated,
      userResults,
      lastGenerationTime: currentTime
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Event generation cron job failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute reporter event generation job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
