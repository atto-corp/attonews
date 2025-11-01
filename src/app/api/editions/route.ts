import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../utils/auth';

// GET /api/editions - Get all newspaper editions with full article data
export const GET = withAuth(async (_request: NextRequest, user, dataStorage) => {
  const editions = await dataStorage.getNewspaperEditions(user.id);

  // Fetch full article data for each edition
  const editionsWithArticles = await Promise.all(
    editions.map(async (edition) => {
      const articles = await Promise.all(
        edition.stories.map(async (storyId) => {
          const article = await dataStorage.getArticle(user.id, storyId);
          return article;
        })
      );

      // Filter out null articles (in case some are missing)
      const validArticles = articles.filter(article => article !== null);

      return {
        ...edition,
        stories: validArticles
      };
    })
  );

  return NextResponse.json(editionsWithArticles);
}, { requiredPermission: 'reader' });

// POST /api/editions - Generate a new newspaper edition
export const POST = withAuth(async (request: NextRequest, user, dataStorage) => {
  try {
    // For now, return a message that this feature is not yet implemented
    // In a full implementation, this would call the EditorService to generate a new edition
    return NextResponse.json(
      { error: 'Newspaper edition generation not yet implemented in API' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error generating newspaper edition:', error);
    return NextResponse.json(
      { error: 'Failed to generate newspaper edition' },
      { status: 500 }
    );
  }
}, { requiredPermission: 'editor' });
