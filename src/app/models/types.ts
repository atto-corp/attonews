export interface Editor {
  bio: string;
  prompt: string;
  modelName: string;
  messageSliceCount: number;
  inputTokenCost: number;
  outputTokenCost: number;
  articleGenerationPeriodMinutes: number;
  lastArticleGenerationTime?: number; // milliseconds since epoch, optional for backward compatibility
  eventGenerationPeriodMinutes: number;
  lastEventGenerationTime?: number; // milliseconds since epoch, optional for backward compatibility
  editionGenerationPeriodMinutes: number;
  lastEditionGenerationTime?: number; // milliseconds since epoch, optional for backward compatibility
}

export interface Reporter {
  id: string;
  beats: string[];
  prompt: string;
  enabled: boolean;
}

export interface Article {
  id: string;
  reporterId: string;
  headline: string;
  body: string;
  generationTime: number; // milliseconds since epoch
  prompt: string; // The full prompt used to generate this article
  messageIds: number[]; // Indices of social media messages used
  messageTexts: string[]; // Text content of the messages that were used
}

export interface NewspaperEdition {
  id: string;
  stories: string[]; // article IDs
  generationTime: number; // milliseconds since epoch
  prompt: string; // The full prompt used to generate this edition
}

export interface DailyEdition {
  id: string;
  editions: string[]; // edition IDs
  generationTime: number; // milliseconds since epoch
  // New detailed content from AI service
  frontPageHeadline: string;
  frontPageArticle: string;
  topics: Array<{
    name: string;
    headline: string;
    newsStoryFirstParagraph: string;
    newsStorySecondParagraph: string;
    oneLineSummary: string;
    supportingSocialMediaMessage: string;
    skepticalComment: string;
    gullibleComment: string;
  }>;
  modelFeedbackAboutThePrompt: {
    positive: string;
    negative: string;
  };
  newspaperName: string;
  prompt: string; // The full prompt used to generate this daily edition
}

export interface Event {
  id: string;
  reporterId: string;
  title: string;
  createdTime: number; // milliseconds since epoch
  updatedTime: number; // milliseconds since epoch
  facts: string[]; // JSON list of strings
  where?: string; // Where the event took place
  when?: string; // Date and time the event took place
  messageIds?: number[]; // Indices of social media messages used
  messageTexts?: string[]; // Text content of the messages that were used
}

export interface AdEntry {
  id: string;
  name: string;
  bidPrice: number;
  promptContent: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'editor' | 'reporter' | 'user';
  createdAt: number;
  lastLoginAt?: number;
  hasReader: boolean;
  hasReporter: boolean;
  hasEditor: boolean;
}

export interface UserAIConfig {
  openaiApiKey: string;
  openaiBaseUrl?: string;
  modelName: string;
  inputTokenCost: number;
  outputTokenCost: number;
  messageSliceCount: number;
  articleGenerationPeriodMinutes: number;
  eventGenerationPeriodMinutes: number;
  editionGenerationPeriodMinutes: number;
}

export interface UserUsageStats {
  totalApiCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  lastUpdated: number;
}

// KPI Names enum
export enum KpiName {
  TOTAL_AI_API_SPEND = 'Total AI API spend',
  TOTAL_TEXT_INPUT_TOKENS = 'Total text input tokens',
  TOTAL_TEXT_OUTPUT_TOKENS = 'Total text output tokens'
}

// Redis key patterns
export const REDIS_KEYS = {
  // Legacy keys (for backward compatibility during migration)
  LEGACY_MODEL_NAME: 'ai:model_name',
  LEGACY_EDITOR_BIO: 'editor:bio',
  LEGACY_EDITOR_PROMPT: 'editor:prompt',
  LEGACY_EDITOR_MESSAGE_SLICE_COUNT: 'editor:message_slice_count',
  LEGACY_INPUT_TOKEN_COST: 'editor:input_token_cost',
  LEGACY_OUTPUT_TOKEN_COST: 'editor:output_token_cost',
  LEGACY_ARTICLE_GENERATION_PERIOD_MINUTES: 'article_generation:period_minutes',
  LEGACY_LAST_ARTICLE_GENERATION_TIME: 'article_generation:last_time',
  LEGACY_EVENT_GENERATION_PERIOD_MINUTES: 'event_generation:period_minutes',
  LEGACY_LAST_EVENT_GENERATION_TIME: 'event_generation:last_time',
  LEGACY_EDITION_GENERATION_PERIOD_MINUTES: 'edition_generation:period_minutes',
  LEGACY_LAST_EDITION_GENERATION_TIME: 'edition_generation:last_time',
  LEGACY_REPORTERS: 'reporters',
  LEGACY_REPORTER_BEATS: (id: string) => `reporter:${id}:beats`,
  LEGACY_REPORTER_PROMPT: (id: string) => `reporter:${id}:prompt`,
  LEGACY_REPORTER_ENABLED: (id: string) => `reporter:${id}:enabled`,
  LEGACY_ARTICLES_BY_REPORTER: (reporterId: string) => `articles:${reporterId}`,
  LEGACY_ARTICLE_HEADLINE: (articleId: string) => `article:${articleId}:headline`,
  LEGACY_ARTICLE_BODY: (articleId: string) => `article:${articleId}:body`,
  LEGACY_ARTICLE_TIME: (articleId: string) => `article:${articleId}:time`,
  LEGACY_ARTICLE_PROMPT: (articleId: string) => `article:${articleId}:prompt`,
  LEGACY_ARTICLE_MESSAGE_IDS: (articleId: string) => `article:${articleId}:message_ids`,
  LEGACY_ARTICLE_MESSAGE_TEXTS: (articleId: string) => `article:${articleId}:message_texts`,
  LEGACY_EDITIONS: 'editions',
  LEGACY_EDITION_STORIES: (editionId: string) => `edition:${editionId}:stories`,
  LEGACY_EDITION_TIME: (editionId: string) => `edition:${editionId}:time`,
  LEGACY_EDITION_PROMPT: (editionId: string) => `edition:${editionId}:prompt`,
  LEGACY_DAILY_EDITIONS: 'daily_editions',
  LEGACY_DAILY_EDITION_EDITIONS: (dailyEditionId: string) => `daily_edition:${dailyEditionId}:editions`,
  LEGACY_DAILY_EDITION_TIME: (dailyEditionId: string) => `daily_edition:${dailyEditionId}:time`,
  LEGACY_DAILY_EDITION_PROMPT: (dailyEditionId: string) => `daily_edition:${dailyEditionId}:prompt`,
  LEGACY_EVENTS_BY_REPORTER: (reporterId: string) => `events:${reporterId}`,
  LEGACY_EVENT_TITLE: (eventId: string) => `event:${eventId}:title`,
  LEGACY_EVENT_CREATED_TIME: (eventId: string) => `event:${eventId}:created_time`,
  LEGACY_EVENT_UPDATED_TIME: (eventId: string) => `event:${eventId}:updated_time`,
  LEGACY_EVENT_FACTS: (eventId: string) => `event:${eventId}:facts`,
  LEGACY_EVENT_WHERE: (eventId: string) => `event:${eventId}:where`,
  LEGACY_EVENT_WHEN: (eventId: string) => `event:${eventId}:when`,
  LEGACY_EVENT_MESSAGE_IDS: (eventId: string) => `event:${eventId}:message_ids`,
  LEGACY_EVENT_MESSAGE_TEXTS: (eventId: string) => `event:${eventId}:message_texts`,
  LEGACY_ADS: 'ads',
  LEGACY_AD_NAME: (adId: string) => `ad:${adId}:name`,
  LEGACY_AD_BID_PRICE: (adId: string) => `ad:${adId}:bid_price`,
  LEGACY_AD_PROMPT_CONTENT: (adId: string) => `ad:${adId}:prompt_content`,
  LEGACY_AD_USER_ID: (adId: string) => `ad:${adId}:user_id`,

  // User Configuration (Multi-tenant)
  USER_OPENAI_API_KEY: (userId: string) => `user:${userId}:openai_api_key`,
  USER_OPENAI_BASE_URL: (userId: string) => `user:${userId}:openai_base_url`,
  USER_MODEL_NAME: (userId: string) => `user:${userId}:model_name`,
  USER_INPUT_TOKEN_COST: (userId: string) => `user:${userId}:input_token_cost`,
  USER_OUTPUT_TOKEN_COST: (userId: string) => `user:${userId}:output_token_cost`,
  USER_MESSAGE_SLICE_COUNT: (userId: string) => `user:${userId}:message_slice_count`,
  USER_ARTICLE_GENERATION_PERIOD_MINUTES: (userId: string) => `user:${userId}:article_generation_period_minutes`,
  USER_EVENT_GENERATION_PERIOD_MINUTES: (userId: string) => `user:${userId}:event_generation_period_minutes`,
  USER_EDITION_GENERATION_PERIOD_MINUTES: (userId: string) => `user:${userId}:edition_generation_period_minutes`,

  // User-scoped Editor
  USER_EDITOR_BIO: (userId: string) => `user:${userId}:editor:bio`,
  USER_EDITOR_PROMPT: (userId: string) => `user:${userId}:editor:prompt`,
  USER_EDITOR_MODEL_NAME: (userId: string) => `user:${userId}:editor:model_name`,
  USER_EDITOR_MESSAGE_SLICE_COUNT: (userId: string) => `user:${userId}:editor:message_slice_count`,
  USER_EDITOR_INPUT_TOKEN_COST: (userId: string) => `user:${userId}:editor:input_token_cost`,
  USER_EDITOR_OUTPUT_TOKEN_COST: (userId: string) => `user:${userId}:editor:output_token_cost`,
  USER_ARTICLE_GENERATION_LAST_TIME: (userId: string) => `user:${userId}:article_generation:last_time`,
  USER_EVENT_GENERATION_LAST_TIME: (userId: string) => `user:${userId}:event_generation:last_time`,
  USER_EDITION_GENERATION_LAST_TIME: (userId: string) => `user:${userId}:edition_generation:last_time`,

  // User-scoped Reporters
  USER_REPORTERS: (userId: string) => `user:${userId}:reporters`,
  USER_REPORTER_BEATS: (userId: string, reporterId: string) => `user:${userId}:reporter:${reporterId}:beats`,
  USER_REPORTER_PROMPT: (userId: string, reporterId: string) => `user:${userId}:reporter:${reporterId}:prompt`,
  USER_REPORTER_ENABLED: (userId: string, reporterId: string) => `user:${userId}:reporter:${reporterId}:enabled`,

  // User-scoped Articles
  USER_ARTICLES_BY_REPORTER: (userId: string, reporterId: string) => `user:${userId}:articles:${reporterId}`,
  USER_ARTICLE_HEADLINE: (userId: string, articleId: string) => `user:${userId}:article:${articleId}:headline`,
  USER_ARTICLE_BODY: (userId: string, articleId: string) => `user:${userId}:article:${articleId}:body`,
  USER_ARTICLE_TIME: (userId: string, articleId: string) => `user:${userId}:article:${articleId}:time`,
  USER_ARTICLE_PROMPT: (userId: string, articleId: string) => `user:${userId}:article:${articleId}:prompt`,
  USER_ARTICLE_MESSAGE_IDS: (userId: string, articleId: string) => `user:${userId}:article:${articleId}:message_ids`,
  USER_ARTICLE_MESSAGE_TEXTS: (userId: string, articleId: string) => `user:${userId}:article:${articleId}:message_texts`,
  USER_ARTICLE_REPORTER_ID: (userId: string, articleId: string) => `user:${userId}:article:${articleId}:reporter_id`,

  // User-scoped Newspaper Editions
  USER_EDITIONS: (userId: string) => `user:${userId}:editions`,
  USER_EDITION_STORIES: (userId: string, editionId: string) => `user:${userId}:edition:${editionId}:stories`,
  USER_EDITION_TIME: (userId: string, editionId: string) => `user:${userId}:edition:${editionId}:time`,
  USER_EDITION_PROMPT: (userId: string, editionId: string) => `user:${userId}:edition:${editionId}:prompt`,

  // User-scoped Daily Editions
  USER_DAILY_EDITIONS: (userId: string) => `user:${userId}:daily_editions`,
  USER_DAILY_EDITION_EDITIONS: (userId: string, dailyEditionId: string) => `user:${userId}:daily_edition:${dailyEditionId}:editions`,
  USER_DAILY_EDITION_TIME: (userId: string, dailyEditionId: string) => `user:${userId}:daily_edition:${dailyEditionId}:time`,
  USER_DAILY_EDITION_FRONT_PAGE_HEADLINE: (userId: string, dailyEditionId: string) => `user:${userId}:daily_edition:${dailyEditionId}:front_page_headline`,
  USER_DAILY_EDITION_FRONT_PAGE_ARTICLE: (userId: string, dailyEditionId: string) => `user:${userId}:daily_edition:${dailyEditionId}:front_page_article`,
  USER_DAILY_EDITION_TOPICS: (userId: string, dailyEditionId: string) => `user:${userId}:daily_edition:${dailyEditionId}:topics`,
  USER_DAILY_EDITION_MODEL_FEEDBACK_POSITIVE: (userId: string, dailyEditionId: string) => `user:${userId}:daily_edition:${dailyEditionId}:model_feedback_positive`,
  USER_DAILY_EDITION_MODEL_FEEDBACK_NEGATIVE: (userId: string, dailyEditionId: string) => `user:${userId}:daily_edition:${dailyEditionId}:model_feedback_negative`,
  USER_DAILY_EDITION_NEWSPAPER_NAME: (userId: string, dailyEditionId: string) => `user:${userId}:daily_edition:${dailyEditionId}:newspaper_name`,
  USER_DAILY_EDITION_PROMPT: (userId: string, dailyEditionId: string) => `user:${userId}:daily_edition:${dailyEditionId}:prompt`,

  // User-scoped Events
  USER_EVENTS_BY_REPORTER: (userId: string, reporterId: string) => `user:${userId}:events:${reporterId}`,
  USER_EVENT_TITLE: (userId: string, eventId: string) => `user:${userId}:event:${eventId}:title`,
  USER_EVENT_CREATED_TIME: (userId: string, eventId: string) => `user:${userId}:event:${eventId}:created_time`,
  USER_EVENT_UPDATED_TIME: (userId: string, eventId: string) => `user:${userId}:event:${eventId}:updated_time`,
  USER_EVENT_FACTS: (userId: string, eventId: string) => `user:${userId}:event:${eventId}:facts`,
  USER_EVENT_WHERE: (userId: string, eventId: string) => `user:${userId}:event:${eventId}:where`,
  USER_EVENT_WHEN: (userId: string, eventId: string) => `user:${userId}:event:${eventId}:when`,
  USER_EVENT_MESSAGE_IDS: (userId: string, eventId: string) => `user:${userId}:event:${eventId}:message_ids`,
  USER_EVENT_MESSAGE_TEXTS: (userId: string, eventId: string) => `user:${userId}:event:${eventId}:message_texts`,
  USER_EVENT_REPORTER_ID: (userId: string, eventId: string) => `user:${userId}:event:${eventId}:reporter_id`,

  // User-scoped Ads
  USER_ADS: (userId: string) => `user:${userId}:ads`,
  USER_AD_NAME: (userId: string, adId: string) => `user:${userId}:ad:${adId}:name`,
  USER_AD_BID_PRICE: (userId: string, adId: string) => `user:${userId}:ad:${adId}:bid_price`,
  USER_AD_PROMPT_CONTENT: (userId: string, adId: string) => `user:${userId}:ad:${adId}:prompt_content`,

  // Usage Logging (Multi-tenant)
  USER_USAGE_API_CALLS: (userId: string, timestamp: string) => `user:${userId}:usage:${timestamp}:api_calls`,
  USER_USAGE_INPUT_TOKENS: (userId: string, timestamp: string) => `user:${userId}:usage:${timestamp}:input_tokens`,
  USER_USAGE_OUTPUT_TOKENS: (userId: string, timestamp: string) => `user:${userId}:usage:${timestamp}:output_tokens`,
  USER_USAGE_COST: (userId: string, timestamp: string) => `user:${userId}:usage:${timestamp}:cost`,
  USER_USAGE_TOTAL_API_CALLS: (userId: string) => `user:${userId}:usage:total:api_calls`,
  USER_USAGE_TOTAL_INPUT_TOKENS: (userId: string) => `user:${userId}:usage:total:input_tokens`,
  USER_USAGE_TOTAL_OUTPUT_TOKENS: (userId: string) => `user:${userId}:usage:total:output_tokens`,
  USER_USAGE_TOTAL_COST: (userId: string) => `user:${userId}:usage:total:cost`,

  // Global Users (unchanged)
  USERS: 'users',
  USER_EMAIL: (userId: string) => `user:${userId}:email`,
  USER_PASSWORD_HASH: (userId: string) => `user:${userId}:password_hash`,
  USER_ROLE: (userId: string) => `user:${userId}:role`,
  USER_CREATED_AT: (userId: string) => `user:${userId}:created_at`,
  USER_LAST_LOGIN_AT: (userId: string) => `user:${userId}:last_login_at`,
  USER_HAS_READER: (userId: string) => `user:${userId}:has_reader`,
  USER_HAS_REPORTER: (userId: string) => `user:${userId}:has_reporter`,
  USER_HAS_EDITOR: (userId: string) => `user:${userId}:has_editor`,
  USER_BY_EMAIL: (email: string) => `user_by_email:${email}`,

   // User-scoped KPIs
    USER_KPI_VALUE: (userId: string, name: string) => `user:${userId}:kpi:${name}:value`,
    USER_KPI_LAST_UPDATED: (userId: string, name: string) => `user:${userId}:kpi:${name}:last_updated`,

   // Global KPIs (unchanged)
    KPI_VALUE: (name: string) => `kpi:${name}:value`,
    KPI_LAST_UPDATED: (name: string) => `kpi:${name}:last_updated`,

   // User-scoped Jobs
   USER_JOB_RUNNING: (userId: string, jobName: string) => `user:${userId}:job:${jobName}:running`,
   USER_JOB_LAST_RUN: (userId: string, jobName: string) => `user:${userId}:job:${jobName}:last_run`,
   USER_JOB_LAST_SUCCESS: (userId: string, jobName: string) => `user:${userId}:job:${jobName}:last_success`,
 } as const;

// Utility types for Redis operations
export interface RedisArticleData {
  id: string;
  headline: string;
  body: string;
  time: number;
}

export interface RedisEditionData {
  id: string;
  stories: string[];
  time: number;
}

export interface RedisDailyEditionData {
  id: string;
  editions: string[];
  time: number;
}
