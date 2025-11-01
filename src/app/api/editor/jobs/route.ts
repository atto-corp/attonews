import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../utils/auth';
import { ServiceContainer } from '../../../services/service-container';

let container: ServiceContainer | null = null;

async function getContainer(): Promise<ServiceContainer> {
  if (!container) {
    container = ServiceContainer.getInstance();
  }
  return container;
}

// POST /api/editor/jobs/trigger - Trigger a specific job
export const POST = withAuth(async (request: NextRequest, user, dataStorage) => {
  const container = await getContainer();
  const reporterService = await container.getReporterService();
  const editorService = await container.getEditorService();

  const body = await request.json();
  const { jobType } = body;

  if (!jobType || typeof jobType !== 'string') {
    return NextResponse.json(
      { error: 'Job type is required and must be a string' },
      { status: 400 }
    );
  }

  const currentTime = Date.now();

  // Set job as running and update last run time
  await dataStorage.setJobRunning(user.id, jobType, true);
  await dataStorage.setJobLastRun(user.id, jobType, currentTime);

  let result;
  try {
    switch (jobType) {
      case 'reporter':
        const reporterResults = await reporterService.generateAllReporterArticles(user.id);
        const totalArticles = Object.values(reporterResults).reduce((sum, articles) => sum + articles.length, 0);
        result = { message: `Reporter article generation job triggered successfully. Generated ${totalArticles} articles.` };
        break;
      case 'newspaper':
        const edition = await editorService.generateHourlyEdition(user.id);
        result = { message: `Newspaper edition generation job triggered successfully. Created edition: ${edition.id} with ${edition.stories.length} stories.` };
        break;
      case 'daily':
        const dailyEdition = await editorService.generateDailyEdition(user.id);
        result = { message: `Daily edition generation job triggered successfully. Created daily edition: ${dailyEdition.id} with ${dailyEdition.editions.length} newspaper editions.` };
        break;
      default:
        // Mark job as not running for invalid job type
        await dataStorage.setJobRunning(user.id, jobType, false);
        return NextResponse.json(
          { error: 'Invalid job type. Must be one of: reporter, newspaper, daily' },
          { status: 400 }
        );
    }

    // Mark job as completed successfully
    await dataStorage.setJobRunning(user.id, jobType, false);
    await dataStorage.setJobLastSuccess(user.id, jobType, currentTime);
  } catch (error) {
    // Mark job as not running on error (don't update last_success)
    await dataStorage.setJobRunning(user.id, jobType, false);
    throw error; // Re-throw to be handled by outer catch
  }

  return NextResponse.json(result);
}, { requiredRole: 'admin' });

// GET /api/editor/jobs/status - Get job status and next run times
export async function GET() {
  return NextResponse.json({
    error: 'Job status is user-specific. Please use authenticated endpoints to check job status.',
    message: 'In multi-tenant mode, job status must be requested with user authentication.'
  }, { status: 400 });
}
