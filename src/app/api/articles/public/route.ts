import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '../../../services/service-container';

let container: ServiceContainer | null = null;

async function getContainer(): Promise<ServiceContainer> {
  if (!container) {
    container = ServiceContainer.getInstance();
  }
  return container;
}

// GET /api/articles/public - Get latest 5 articles (public access, no auth required)
export async function GET(request: NextRequest) {
  try {
    // In multi-tenant mode, public access requires userId parameter
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required for public article access in multi-tenant mode' },
        { status: 400 }
      );
    }

    const container = await getContainer();
    const dataStorage = await container.getDataStorageService();

    // Get latest 5 articles for the specified user (sorted by generation time, most recent first)
    const articles = await dataStorage.getAllArticles(userId, 5);

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching public articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
