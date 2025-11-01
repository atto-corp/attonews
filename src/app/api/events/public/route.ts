import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '../../../services/service-container';

let container: ServiceContainer | null = null;

async function getContainer(): Promise<ServiceContainer> {
  if (!container) {
    container = ServiceContainer.getInstance();
  }
  return container;
}

// GET /api/events/public - Get latest 12 events sorted by updated time (public access, no auth required)
export async function GET(request: NextRequest) {
  try {
    // In multi-tenant mode, public access requires userId parameter
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required for public event access in multi-tenant mode' },
        { status: 400 }
      );
    }

    const container = await getContainer();
    const dataStorage = await container.getDataStorageService();

    // Get latest 12 events for the specified user sorted by updated time (most recent first)
    const events = await dataStorage.getLatestUpdatedEvents(userId, 12);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching public events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}