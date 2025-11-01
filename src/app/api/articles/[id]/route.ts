import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../utils/auth';

export const GET = withAuth(async (
  request: NextRequest,
  user,
  dataStorage,
  context: { params: Promise<{ id: string }> }
) => {
  const { id: articleId } = await context.params;

  if (!articleId) {
    return NextResponse.json(
      { error: 'Article ID is required' },
      { status: 400 }
    );
  }

  const article = await dataStorage.getArticle(user.id, articleId);

  if (!article) {
    return NextResponse.json(
      { error: 'Article not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(article);
});
