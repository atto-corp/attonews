import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../utils/auth';

// GET /api/daily-editions - Get daily editions (requires reader permission)
export const GET = withAuth(async (request: NextRequest, user, dataStorage) => {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  let limit = undefined;

  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = parsed;
    }
  }

  const dailyEditions = await dataStorage.getDailyEditions(user.id, limit);
  return NextResponse.json(dailyEditions);
}, { requiredPermission: 'reader' });

// POST /api/daily-editions - Generate a new daily edition
export const POST = withAuth(async (request: NextRequest, user, dataStorage) => {
  try {
    // For now, return a message that this feature is not yet implemented
    // In a full implementation, this would call the AI service to generate a new daily edition
    return NextResponse.json(
      { error: 'Daily edition generation not yet implemented in API' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error generating daily edition:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily edition' },
      { status: 500 }
    );
  }
}, { requiredPermission: 'editor' });
