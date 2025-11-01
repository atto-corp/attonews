import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../utils/auth';

// GET /api/usage/user - Get current user's usage statistics
export const GET = withAuth(async (request: NextRequest, user, dataStorage) => {
  const { searchParams } = new URL(request.url);
  const includeHistory = searchParams.get('history') === 'true';
  const days = parseInt(searchParams.get('days') || '30', 10);

  try {
    const currentStats = await dataStorage.getUserUsageStats(user.id);

    if (!includeHistory) {
      return NextResponse.json(currentStats);
    }

    // Get usage history for the specified number of days
    const endDate = Date.now();
    const startDate = endDate - (days * 24 * 60 * 60 * 1000);

    const history = await dataStorage.getUserUsageHistory(user.id, startDate, endDate);

    return NextResponse.json({
      current: currentStats,
      history: history
    });
  } catch (error) {
    console.error('Error fetching user usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    );
  }
});