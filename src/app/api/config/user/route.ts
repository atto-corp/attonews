import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../utils/auth';
import { UserAIConfig } from '../../../models/types';

// GET /api/config/user - Get current user's AI configuration
export const GET = withAuth(async (request: NextRequest, user, dataStorage) => {
  const config = await dataStorage.getUserAIConfig(user.id);

  if (!config) {
    // Return default configuration
    const defaultConfig: UserAIConfig = {
      openaiApiKey: '',
      openaiBaseUrl: 'https://api.openai.com/v1',
      modelName: 'gpt-4',
      inputTokenCost: 0.03,
      outputTokenCost: 0.06,
      messageSliceCount: 200,
      articleGenerationPeriodMinutes: 15,
      eventGenerationPeriodMinutes: 30,
      editionGenerationPeriodMinutes: 180
    };
    return NextResponse.json(defaultConfig);
  }

  return NextResponse.json(config);
});

// PUT /api/config/user - Update current user's AI configuration
export const PUT = withAuth(async (request: NextRequest, user, dataStorage) => {
  const body = await request.json();
  const {
    openaiApiKey,
    openaiBaseUrl,
    modelName,
    inputTokenCost,
    outputTokenCost,
    messageSliceCount,
    articleGenerationPeriodMinutes,
    eventGenerationPeriodMinutes,
    editionGenerationPeriodMinutes
  } = body;

  // Validate required fields
  if (!openaiApiKey || typeof openaiApiKey !== 'string') {
    return NextResponse.json(
      { error: 'OpenAI API key is required and must be a string' },
      { status: 400 }
    );
  }

  if (!openaiBaseUrl || typeof openaiBaseUrl !== 'string') {
    return NextResponse.json(
      { error: 'OpenAI base URL is required and must be a string' },
      { status: 400 }
    );
  }

  if (!modelName || typeof modelName !== 'string') {
    return NextResponse.json(
      { error: 'Model name is required and must be a string' },
      { status: 400 }
    );
  }

  // Validate numeric fields
  if (typeof inputTokenCost !== 'number' || inputTokenCost < 0) {
    return NextResponse.json(
      { error: 'Input token cost must be a non-negative number' },
      { status: 400 }
    );
  }

  if (typeof outputTokenCost !== 'number' || outputTokenCost < 0) {
    return NextResponse.json(
      { error: 'Output token cost must be a non-negative number' },
      { status: 400 }
    );
  }

  if (typeof messageSliceCount !== 'number' || messageSliceCount < 1 || messageSliceCount > 1000) {
    return NextResponse.json(
      { error: 'Message slice count must be a number between 1 and 1000' },
      { status: 400 }
    );
  }

  if (typeof articleGenerationPeriodMinutes !== 'number' || articleGenerationPeriodMinutes < 1 || articleGenerationPeriodMinutes > 1440) {
    return NextResponse.json(
      { error: 'Article generation period must be a number between 1 and 1440 minutes' },
      { status: 400 }
    );
  }

  if (typeof eventGenerationPeriodMinutes !== 'number' || eventGenerationPeriodMinutes < 1 || eventGenerationPeriodMinutes > 1440) {
    return NextResponse.json(
      { error: 'Event generation period must be a number between 1 and 1440 minutes' },
      { status: 400 }
    );
  }

  if (typeof editionGenerationPeriodMinutes !== 'number' || editionGenerationPeriodMinutes < 1 || editionGenerationPeriodMinutes > 1440) {
    return NextResponse.json(
      { error: 'Edition generation period must be a number between 1 and 1440 minutes' },
      { status: 400 }
    );
  }

  const config: UserAIConfig = {
    openaiApiKey,
    openaiBaseUrl,
    modelName,
    inputTokenCost,
    outputTokenCost,
    messageSliceCount,
    articleGenerationPeriodMinutes,
    eventGenerationPeriodMinutes,
    editionGenerationPeriodMinutes
  };

  await dataStorage.saveUserAIConfig(user.id, config);

  return NextResponse.json({
    ...config,
    message: 'AI configuration updated successfully'
  });
});