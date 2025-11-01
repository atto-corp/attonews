import {
  Editor,
  Reporter,
  Article,
  NewspaperEdition,
  DailyEdition,
  Event,
  AdEntry,
  User,
  UserAIConfig,
  UserUsageStats,
  REDIS_KEYS
} from '../app/models/types';
import { IDataStorageService } from '../app/services/data-storage.interface';
import { createClient, RedisClientType } from 'redis';

export class RedisDataStorageMultiTenantService implements IDataStorageService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: 'redis://localhost:6379'
    });

    this.client.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
    });
  }

  async connect(): Promise<void> {
    try { await this.client.connect(); } catch (e) {console.log(e)}
    console.log('Connected to Redis (Multi-tenant)');
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
    console.log('Disconnected from Redis (Multi-tenant)');
  }

  // User AI Configuration operations
  async saveUserAIConfig(userId: string, config: UserAIConfig): Promise<void> {
    const multi = this.client.multi();
    multi.set(REDIS_KEYS.USER_OPENAI_API_KEY(userId), config.openaiApiKey);
    if (config.openaiBaseUrl) {
      multi.set(REDIS_KEYS.USER_OPENAI_BASE_URL(userId), config.openaiBaseUrl);
    }
    multi.set(REDIS_KEYS.USER_MODEL_NAME(userId), config.modelName);
    multi.set(REDIS_KEYS.USER_INPUT_TOKEN_COST(userId), config.inputTokenCost.toString());
    multi.set(REDIS_KEYS.USER_OUTPUT_TOKEN_COST(userId), config.outputTokenCost.toString());
    multi.set(REDIS_KEYS.USER_MESSAGE_SLICE_COUNT(userId), config.messageSliceCount.toString());
    multi.set(REDIS_KEYS.USER_ARTICLE_GENERATION_PERIOD_MINUTES(userId), config.articleGenerationPeriodMinutes.toString());
    multi.set(REDIS_KEYS.USER_EVENT_GENERATION_PERIOD_MINUTES(userId), config.eventGenerationPeriodMinutes.toString());
    multi.set(REDIS_KEYS.USER_EDITION_GENERATION_PERIOD_MINUTES(userId), config.editionGenerationPeriodMinutes.toString());
    await multi.exec();
  }

  async getUserAIConfig(userId: string): Promise<UserAIConfig | null> {
    const results = await Promise.all([
      this.client.get(REDIS_KEYS.USER_OPENAI_API_KEY(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_OPENAI_BASE_URL(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_MODEL_NAME(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_INPUT_TOKEN_COST(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_OUTPUT_TOKEN_COST(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_MESSAGE_SLICE_COUNT(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_ARTICLE_GENERATION_PERIOD_MINUTES(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EVENT_GENERATION_PERIOD_MINUTES(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EDITION_GENERATION_PERIOD_MINUTES(userId)) as Promise<string | null>
    ]);

    const [
      openaiApiKey,
      openaiBaseUrl,
      modelName,
      inputTokenCost,
      outputTokenCost,
      messageSliceCount,
      articleGenerationPeriodMinutes,
      eventGenerationPeriodMinutes,
      editionGenerationPeriodMinutes
    ] = results as (string | null)[];

    if (!openaiApiKey || !modelName) {
      return null;
    }

    return {
      openaiApiKey: openaiApiKey as string,
      openaiBaseUrl: openaiBaseUrl ?? undefined,
      modelName: modelName as string,
      inputTokenCost: parseFloat(String(inputTokenCost || '0.00015')),
      outputTokenCost: parseFloat(String(outputTokenCost || '0.0006')),
      messageSliceCount: parseInt(String(messageSliceCount || '200')),
      articleGenerationPeriodMinutes: parseInt(String(articleGenerationPeriodMinutes || '60')),
      eventGenerationPeriodMinutes: parseInt(String(eventGenerationPeriodMinutes || '30')),
      editionGenerationPeriodMinutes: parseInt(String(editionGenerationPeriodMinutes || '1440'))
    };
  }

  async updateUserAIConfig(userId: string, updates: Partial<UserAIConfig>): Promise<void> {
    const multi = this.client.multi();
    if (updates.openaiApiKey !== undefined) multi.set(REDIS_KEYS.USER_OPENAI_API_KEY(userId), updates.openaiApiKey!);
    if (updates.openaiBaseUrl !== undefined) multi.set(REDIS_KEYS.USER_OPENAI_BASE_URL(userId), updates.openaiBaseUrl!);
    if (updates.modelName !== undefined) multi.set(REDIS_KEYS.USER_MODEL_NAME(userId), updates.modelName!);
    if (updates.inputTokenCost !== undefined) multi.set(REDIS_KEYS.USER_INPUT_TOKEN_COST(userId), updates.inputTokenCost!.toString());
    if (updates.outputTokenCost !== undefined) multi.set(REDIS_KEYS.USER_OUTPUT_TOKEN_COST(userId), updates.outputTokenCost!.toString());
    if (updates.messageSliceCount !== undefined) multi.set(REDIS_KEYS.USER_MESSAGE_SLICE_COUNT(userId), updates.messageSliceCount!.toString());
    if (updates.articleGenerationPeriodMinutes !== undefined) multi.set(REDIS_KEYS.USER_ARTICLE_GENERATION_PERIOD_MINUTES(userId), updates.articleGenerationPeriodMinutes!.toString());
    if (updates.eventGenerationPeriodMinutes !== undefined) multi.set(REDIS_KEYS.USER_EVENT_GENERATION_PERIOD_MINUTES(userId), updates.eventGenerationPeriodMinutes!.toString());
    if (updates.editionGenerationPeriodMinutes !== undefined) multi.set(REDIS_KEYS.USER_EDITION_GENERATION_PERIOD_MINUTES(userId), updates.editionGenerationPeriodMinutes!.toString());
    await multi.exec();
  }

  // Editor operations (user-scoped)
  async saveEditor(userId: string, editor: Editor): Promise<void> {
    const multi = this.client.multi();
    multi.set(REDIS_KEYS.USER_EDITOR_BIO(userId), editor.bio);
    multi.set(REDIS_KEYS.USER_EDITOR_PROMPT(userId), editor.prompt);
    multi.set(REDIS_KEYS.USER_EDITOR_MODEL_NAME(userId), editor.modelName);
    multi.set(REDIS_KEYS.USER_EDITOR_MESSAGE_SLICE_COUNT(userId), editor.messageSliceCount.toString());
    multi.set(REDIS_KEYS.USER_EDITOR_INPUT_TOKEN_COST(userId), editor.inputTokenCost.toString());
    multi.set(REDIS_KEYS.USER_EDITOR_OUTPUT_TOKEN_COST(userId), editor.outputTokenCost.toString());
    multi.set(REDIS_KEYS.USER_ARTICLE_GENERATION_PERIOD_MINUTES(userId), editor.articleGenerationPeriodMinutes.toString());
    if (editor.lastArticleGenerationTime) {
      multi.set(REDIS_KEYS.USER_ARTICLE_GENERATION_LAST_TIME(userId), editor.lastArticleGenerationTime.toString());
    }
    multi.set(REDIS_KEYS.USER_EVENT_GENERATION_PERIOD_MINUTES(userId), editor.eventGenerationPeriodMinutes.toString());
    if (editor.lastEventGenerationTime) {
      multi.set(REDIS_KEYS.USER_EVENT_GENERATION_LAST_TIME(userId), editor.lastEventGenerationTime.toString());
    }
    multi.set(REDIS_KEYS.USER_EDITION_GENERATION_PERIOD_MINUTES(userId), editor.editionGenerationPeriodMinutes.toString());
    if (editor.lastEditionGenerationTime) {
      multi.set(REDIS_KEYS.USER_EDITION_GENERATION_LAST_TIME(userId), editor.lastEditionGenerationTime.toString());
    }
    await multi.exec();
  }

  async getEditor(userId: string): Promise<Editor | null> {
    const results = await Promise.all([
      this.client.get(REDIS_KEYS.USER_EDITOR_BIO(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EDITOR_PROMPT(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EDITOR_MODEL_NAME(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EDITOR_MESSAGE_SLICE_COUNT(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EDITOR_INPUT_TOKEN_COST(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EDITOR_OUTPUT_TOKEN_COST(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_ARTICLE_GENERATION_PERIOD_MINUTES(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_ARTICLE_GENERATION_LAST_TIME(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EVENT_GENERATION_PERIOD_MINUTES(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EVENT_GENERATION_LAST_TIME(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EDITION_GENERATION_PERIOD_MINUTES(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EDITION_GENERATION_LAST_TIME(userId)) as Promise<string | null>
    ]);

    const [
      bio,
      prompt,
      modelName,
      messageSliceCount,
      inputTokenCost,
      outputTokenCost,
      articleGenerationPeriodMinutes,
      lastArticleGenerationTime,
      eventGenerationPeriodMinutes,
      lastEventGenerationTime,
      editionGenerationPeriodMinutes,
      lastEditionGenerationTime
    ] = results;

    if (!bio || !prompt) {
      return null;
    }

    return {
      bio: bio as string,
      prompt: prompt as string,
      modelName: modelName || 'gpt-5-nano',
      messageSliceCount: parseInt(String(messageSliceCount || '200')),
      inputTokenCost: parseFloat(String(inputTokenCost || '0.00015')),
      outputTokenCost: parseFloat(String(outputTokenCost || '0.0006')),
      articleGenerationPeriodMinutes: parseInt(String(articleGenerationPeriodMinutes || '60')),
      lastArticleGenerationTime: lastArticleGenerationTime ? parseInt(String(lastArticleGenerationTime)) : undefined,
      eventGenerationPeriodMinutes: parseInt(String(eventGenerationPeriodMinutes || '30')),
      lastEventGenerationTime: lastEventGenerationTime ? parseInt(String(lastEventGenerationTime)) : undefined,
      editionGenerationPeriodMinutes: parseInt(String(editionGenerationPeriodMinutes || '1440')),
      lastEditionGenerationTime: lastEditionGenerationTime ? parseInt(String(lastEditionGenerationTime)) : undefined
    };
  }

  // Reporter operations (user-scoped)
  async saveReporter(userId: string, reporter: Reporter): Promise<void> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    const multi = this.client.multi();
    multi.sAdd(REDIS_KEYS.USER_REPORTERS(effectiveUserId), reporter.id);
    multi.sAdd(REDIS_KEYS.USER_REPORTER_BEATS(effectiveUserId, reporter.id), reporter.beats);
    multi.set(REDIS_KEYS.USER_REPORTER_PROMPT(effectiveUserId, reporter.id), reporter.prompt);
    multi.set(REDIS_KEYS.USER_REPORTER_ENABLED(effectiveUserId, reporter.id), reporter.enabled.toString());
    await multi.exec();
  }

  async getAllReporters(userId: string): Promise<Reporter[]> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    const reporterIds = await this.client.sMembers(REDIS_KEYS.USER_REPORTERS(effectiveUserId));
    const reporters: Reporter[] = [];

    for (const reporterId of reporterIds) {
      const reporter = await this.getReporter(effectiveUserId, reporterId);
      if (reporter) {
        reporters.push(reporter);
      }
    }

    return reporters;
  }

  async getReporter(userId: string, id: string): Promise<Reporter | null> {
    const effectiveUserId = await this.getEffectiveUserId(userId);
    const [beats, prompt, enabled] = await Promise.all([
      this.client.sMembers(REDIS_KEYS.USER_REPORTER_BEATS(effectiveUserId, id)),
      this.client.get(REDIS_KEYS.USER_REPORTER_PROMPT(effectiveUserId, id)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_REPORTER_ENABLED(effectiveUserId, id)) as Promise<string | null>
    ]);

    if (!prompt) {
      return null;
    }

    return {
      id,
      beats: beats as string[],
      prompt: prompt as string,
      enabled: enabled === 'true'
    };
  }

  // Article operations (user-scoped)
  async saveArticle(userId: string, article: Article): Promise<void> {
    const multi = this.client.multi();
    multi.zAdd(REDIS_KEYS.USER_ARTICLES_BY_REPORTER(userId, article.reporterId), {
      score: article.generationTime,
      value: article.id
    });
    multi.set(REDIS_KEYS.USER_ARTICLE_HEADLINE(userId, article.id), article.headline);
    multi.set(REDIS_KEYS.USER_ARTICLE_BODY(userId, article.id), article.body);
    multi.set(REDIS_KEYS.USER_ARTICLE_TIME(userId, article.id), article.generationTime.toString());
    multi.set(REDIS_KEYS.USER_ARTICLE_PROMPT(userId, article.id), article.prompt);
    multi.set(REDIS_KEYS.USER_ARTICLE_MESSAGE_IDS(userId, article.id), JSON.stringify(article.messageIds));
    multi.set(REDIS_KEYS.USER_ARTICLE_MESSAGE_TEXTS(userId, article.id), JSON.stringify(article.messageTexts));
    multi.set(REDIS_KEYS.USER_ARTICLE_REPORTER_ID(userId, article.id), article.reporterId);
    await multi.exec();
  }

  async getArticlesByReporter(userId: string, reporterId: string, limit?: number): Promise<Article[]> {
    const articleIds = await this.client.zRange(
      REDIS_KEYS.USER_ARTICLES_BY_REPORTER(userId, reporterId),
      0,
      limit ? limit - 1 : -1,
      { REV: true }
    );

    const articles: Article[] = [];
    for (const articleId of articleIds) {
      const article = await this.getArticle(userId, articleId);
      if (article) {
        articles.push(article);
      }
    }

    return articles;
  }

  async getAllArticles(userId: string, limit?: number): Promise<Article[]> {
    const reporters = await this.getAllReporters(userId);
    const allArticles: Article[] = [];

    for (const reporter of reporters) {
      const articles = await this.getArticlesByReporter(userId, reporter.id, limit);
      allArticles.push(...articles);
    }

    // Sort by generation time, most recent first
    allArticles.sort((a, b) => b.generationTime - a.generationTime);

    return limit ? allArticles.slice(0, limit) : allArticles;
  }

  async getArticlesInTimeRange(userId: string, reporterId: string, startTime: number, endTime: number): Promise<Article[]> {
    const articleIds = await this.client.zRangeByScore(
      REDIS_KEYS.USER_ARTICLES_BY_REPORTER(userId, reporterId),
      startTime,
      endTime
    );

    const articles: Article[] = [];
    for (const articleId of articleIds) {
      const article = await this.getArticle(userId, articleId);
      if (article) {
        articles.push(article);
      }
    }

    return articles;
  }

  async getArticle(userId: string, articleId: string): Promise<Article | null> {
    const [headline, body, time, prompt, messageIds, messageTexts, reporterId] = await Promise.all([
      this.client.get(REDIS_KEYS.USER_ARTICLE_HEADLINE(userId, articleId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_ARTICLE_BODY(userId, articleId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_ARTICLE_TIME(userId, articleId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_ARTICLE_PROMPT(userId, articleId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_ARTICLE_MESSAGE_IDS(userId, articleId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_ARTICLE_MESSAGE_TEXTS(userId, articleId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_ARTICLE_REPORTER_ID(userId, articleId)) as Promise<string | null>
    ]);

    if (!headline || !body || !time || !reporterId) {
      return null;
    }

    return {
      id: articleId,
      reporterId: reporterId as string,
      headline: headline as string,
      body: body as string,
      generationTime: parseInt(String(time)),
      prompt: prompt || '',
      messageIds: messageIds ? JSON.parse(String(messageIds)) : [],
      messageTexts: messageTexts ? JSON.parse(String(messageTexts)) : []
    };
  }

  // Event operations (user-scoped)
  async saveEvent(userId: string, event: Event): Promise<void> {
    const multi = this.client.multi();
    multi.zAdd(REDIS_KEYS.USER_EVENTS_BY_REPORTER(userId, event.reporterId), {
      score: event.createdTime,
      value: event.id
    });
    multi.set(REDIS_KEYS.USER_EVENT_TITLE(userId, event.id), event.title);
    multi.set(REDIS_KEYS.USER_EVENT_CREATED_TIME(userId, event.id), event.createdTime.toString());
    multi.set(REDIS_KEYS.USER_EVENT_UPDATED_TIME(userId, event.id), event.updatedTime.toString());
    multi.set(REDIS_KEYS.USER_EVENT_FACTS(userId, event.id), JSON.stringify(event.facts));
    multi.set(REDIS_KEYS.USER_EVENT_REPORTER_ID(userId, event.id), event.reporterId);
    if (event.where) multi.set(REDIS_KEYS.USER_EVENT_WHERE(userId, event.id), event.where);
    if (event.when) multi.set(REDIS_KEYS.USER_EVENT_WHEN(userId, event.id), event.when);
    if (event.messageIds) multi.set(REDIS_KEYS.USER_EVENT_MESSAGE_IDS(userId, event.id), JSON.stringify(event.messageIds));
    if (event.messageTexts) multi.set(REDIS_KEYS.USER_EVENT_MESSAGE_TEXTS(userId, event.id), JSON.stringify(event.messageTexts));
    await multi.exec();
  }

  async getEventsByReporter(userId: string, reporterId: string, limit?: number): Promise<Event[]> {
    const eventIds = await this.client.zRange(
      REDIS_KEYS.USER_EVENTS_BY_REPORTER(userId, reporterId),
      0,
      limit ? limit - 1 : -1,
      { REV: true }
    );

    const events: Event[] = [];
    for (const eventId of eventIds) {
      const event = await this.getEvent(userId, eventId);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  async getAllEvents(userId: string, limit?: number): Promise<Event[]> {
    const reporters = await this.getAllReporters(userId);
    const allEvents: Event[] = [];

    for (const reporter of reporters) {
      const events = await this.getEventsByReporter(userId, reporter.id, limit);
      allEvents.push(...events);
    }

    // Sort by created time, most recent first
    allEvents.sort((a, b) => b.createdTime - a.createdTime);

    return limit ? allEvents.slice(0, limit) : allEvents;
  }

  async getLatestUpdatedEvents(userId: string, limit?: number): Promise<Event[]> {
    const allEvents = await this.getAllEvents(userId);
    allEvents.sort((a, b) => b.updatedTime - a.updatedTime);
    return limit ? allEvents.slice(0, limit) : allEvents;
  }

  async getEvent(userId: string, eventId: string): Promise<Event | null> {
    const [title, createdTime, updatedTime, facts, where, when, messageIds, messageTexts, reporterId] = await Promise.all([
      this.client.get(REDIS_KEYS.USER_EVENT_TITLE(userId, eventId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EVENT_CREATED_TIME(userId, eventId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EVENT_UPDATED_TIME(userId, eventId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EVENT_FACTS(userId, eventId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EVENT_WHERE(userId, eventId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EVENT_WHEN(userId, eventId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EVENT_MESSAGE_IDS(userId, eventId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EVENT_MESSAGE_TEXTS(userId, eventId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EVENT_REPORTER_ID(userId, eventId)) as Promise<string | null>
    ]);

    if (!title || !createdTime || !updatedTime || !facts || !reporterId) {
      return null;
    }

    return {
      id: eventId,
      reporterId: reporterId as string,
      title: title as string,
      createdTime: parseInt(String(createdTime)),
      updatedTime: parseInt(String(updatedTime)),
      facts: JSON.parse(String(facts)),
      where: where ?? undefined,
      when: when ?? undefined,
      messageIds: messageIds ? JSON.parse(String(messageIds)) : undefined,
      messageTexts: messageTexts ? JSON.parse(String(messageTexts)) : undefined
    };
  }

  async updateEventFacts(userId: string, eventId: string, newFacts: string[]): Promise<void> {
    const multi = this.client.multi();
    multi.set(REDIS_KEYS.USER_EVENT_FACTS(userId, eventId), JSON.stringify(newFacts));
    multi.set(REDIS_KEYS.USER_EVENT_UPDATED_TIME(userId, eventId), Date.now().toString());
    await multi.exec();
  }

  // Newspaper Edition operations (user-scoped)
  async saveNewspaperEdition(userId: string, edition: NewspaperEdition): Promise<void> {
    const multi = this.client.multi();
    multi.zAdd(REDIS_KEYS.USER_EDITIONS(userId), {
      score: edition.generationTime,
      value: edition.id
    });
    multi.set(REDIS_KEYS.USER_EDITION_STORIES(userId, edition.id), JSON.stringify(edition.stories));
    multi.set(REDIS_KEYS.USER_EDITION_TIME(userId, edition.id), edition.generationTime.toString());
    multi.set(REDIS_KEYS.USER_EDITION_PROMPT(userId, edition.id), edition.prompt);
    await multi.exec();
  }

  async getNewspaperEditions(userId: string, limit?: number): Promise<NewspaperEdition[]> {
    const editionIds = await this.client.zRange(
      REDIS_KEYS.USER_EDITIONS(userId),
      0,
      limit ? limit - 1 : -1,
      { REV: true }
    );

    const editions: NewspaperEdition[] = [];
    for (const editionId of editionIds) {
      const edition = await this.getNewspaperEdition(userId, editionId);
      if (edition) {
        editions.push(edition);
      }
    }

    return editions;
  }

  async getNewspaperEdition(userId: string, editionId: string): Promise<NewspaperEdition | null> {
    const [stories, time, prompt] = await Promise.all([
      this.client.get(REDIS_KEYS.USER_EDITION_STORIES(userId, editionId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EDITION_TIME(userId, editionId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_EDITION_PROMPT(userId, editionId)) as Promise<string | null>
    ]);

    if (!stories || !time) {
      return null;
    }

    return {
      id: editionId,
      stories: JSON.parse(String(stories)),
      generationTime: parseInt(String(time)),
      prompt: prompt || ''
    };
  }

  // Daily Edition operations (user-scoped)
  async saveDailyEdition(userId: string, dailyEdition: DailyEdition): Promise<void> {
    const multi = this.client.multi();
    multi.zAdd(REDIS_KEYS.USER_DAILY_EDITIONS(userId), {
      score: dailyEdition.generationTime,
      value: dailyEdition.id
    });
    multi.set(REDIS_KEYS.USER_DAILY_EDITION_EDITIONS(userId, dailyEdition.id), JSON.stringify(dailyEdition.editions));
    multi.set(REDIS_KEYS.USER_DAILY_EDITION_TIME(userId, dailyEdition.id), dailyEdition.generationTime.toString());
    multi.set(REDIS_KEYS.USER_DAILY_EDITION_FRONT_PAGE_HEADLINE(userId, dailyEdition.id), dailyEdition.frontPageHeadline);
    multi.set(REDIS_KEYS.USER_DAILY_EDITION_FRONT_PAGE_ARTICLE(userId, dailyEdition.id), dailyEdition.frontPageArticle);
    multi.set(REDIS_KEYS.USER_DAILY_EDITION_TOPICS(userId, dailyEdition.id), JSON.stringify(dailyEdition.topics));
    multi.set(REDIS_KEYS.USER_DAILY_EDITION_MODEL_FEEDBACK_POSITIVE(userId, dailyEdition.id), dailyEdition.modelFeedbackAboutThePrompt.positive);
    multi.set(REDIS_KEYS.USER_DAILY_EDITION_MODEL_FEEDBACK_NEGATIVE(userId, dailyEdition.id), dailyEdition.modelFeedbackAboutThePrompt.negative);
    multi.set(REDIS_KEYS.USER_DAILY_EDITION_NEWSPAPER_NAME(userId, dailyEdition.id), dailyEdition.newspaperName);
    multi.set(REDIS_KEYS.USER_DAILY_EDITION_PROMPT(userId, dailyEdition.id), dailyEdition.prompt);
    await multi.exec();
  }

  async getDailyEditions(userId: string, limit?: number): Promise<DailyEdition[]> {
    const dailyEditionIds = await this.client.zRange(
      REDIS_KEYS.USER_DAILY_EDITIONS(userId),
      0,
      limit ? limit - 1 : -1,
      { REV: true }
    );

    const dailyEditions: DailyEdition[] = [];
    for (const dailyEditionId of dailyEditionIds) {
      const dailyEdition = await this.getDailyEdition(userId, dailyEditionId);
      if (dailyEdition) {
        dailyEditions.push(dailyEdition);
      }
    }

    return dailyEditions;
  }

  async getDailyEdition(userId: string, dailyEditionId: string): Promise<DailyEdition | null> {
    const [
      editions,
      time,
      frontPageHeadline,
      frontPageArticle,
      topics,
      modelFeedbackPositive,
      modelFeedbackNegative,
      newspaperName,
      prompt
    ] = await Promise.all([
      this.client.get(REDIS_KEYS.USER_DAILY_EDITION_EDITIONS(userId, dailyEditionId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_DAILY_EDITION_TIME(userId, dailyEditionId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_DAILY_EDITION_FRONT_PAGE_HEADLINE(userId, dailyEditionId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_DAILY_EDITION_FRONT_PAGE_ARTICLE(userId, dailyEditionId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_DAILY_EDITION_TOPICS(userId, dailyEditionId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_DAILY_EDITION_MODEL_FEEDBACK_POSITIVE(userId, dailyEditionId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_DAILY_EDITION_MODEL_FEEDBACK_NEGATIVE(userId, dailyEditionId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_DAILY_EDITION_NEWSPAPER_NAME(userId, dailyEditionId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_DAILY_EDITION_PROMPT(userId, dailyEditionId)) as Promise<string | null>
    ]);

    if (!editions || !time || !frontPageHeadline || !frontPageArticle || !topics) {
      return null;
    }

    return {
      id: dailyEditionId,
      editions: JSON.parse(String(editions)),
      generationTime: parseInt(String(time)),
      frontPageHeadline: frontPageHeadline as string,
      frontPageArticle: frontPageArticle as string,
      topics: JSON.parse(String(topics)),
      modelFeedbackAboutThePrompt: {
        positive: modelFeedbackPositive || '',
        negative: modelFeedbackNegative || ''
      },
      newspaperName: newspaperName || '',
      prompt: prompt || ''
    };
  }

  // Ad operations (user-scoped)
  async saveAd(userId: string, ad: AdEntry): Promise<void> {
    const multi = this.client.multi();
    multi.sAdd(REDIS_KEYS.USER_ADS(userId), ad.id);
    multi.set(REDIS_KEYS.USER_AD_NAME(userId, ad.id), ad.name);
    multi.set(REDIS_KEYS.USER_AD_BID_PRICE(userId, ad.id), ad.bidPrice.toString());
    multi.set(REDIS_KEYS.USER_AD_PROMPT_CONTENT(userId, ad.id), ad.promptContent);
    await multi.exec();
  }

  async getAllAds(userId: string): Promise<AdEntry[]> {
    const adIds = await this.client.sMembers(REDIS_KEYS.USER_ADS(userId));
    const ads: AdEntry[] = [];

    for (const adId of adIds) {
      const ad = await this.getAd(userId, adId);
      if (ad) {
        ads.push(ad);
      }
    }

    return ads;
  }

  async getMostRecentAd(userId: string): Promise<AdEntry | null> {
    const adIds = await this.client.sMembers(REDIS_KEYS.USER_ADS(userId));
    if (adIds.length === 0) {
      return null;
    }

    // For now, just return the first ad. In a real implementation,
    // you might want to track creation time and return the most recent
    return this.getAd(userId, adIds[0]);
  }

  async getAd(userId: string, adId: string): Promise<AdEntry | null> {
    const [name, bidPrice, promptContent] = await Promise.all([
      this.client.get(REDIS_KEYS.USER_AD_NAME(userId, adId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_AD_BID_PRICE(userId, adId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_AD_PROMPT_CONTENT(userId, adId)) as Promise<string | null>
    ]);

    if (!name || !bidPrice) {
      return null;
    }

    return {
      id: adId,
      userId,
      name: name as string,
      bidPrice: parseFloat(String(bidPrice)),
      promptContent: promptContent || ''
    };
  }

  async updateAd(userId: string, adId: string, updates: Partial<Omit<AdEntry, 'id'>>): Promise<void> {
    const multi = this.client.multi();
    if (updates.name) multi.set(REDIS_KEYS.USER_AD_NAME(userId, adId), updates.name);
    if (updates.bidPrice !== undefined) multi.set(REDIS_KEYS.USER_AD_BID_PRICE(userId, adId), updates.bidPrice.toString());
    if (updates.promptContent) multi.set(REDIS_KEYS.USER_AD_PROMPT_CONTENT(userId, adId), updates.promptContent);
    await multi.exec();
  }

  async deleteAd(userId: string, adId: string): Promise<void> {
    const multi = this.client.multi();
    multi.sRem(REDIS_KEYS.USER_ADS(userId), adId);
    multi.del(REDIS_KEYS.USER_AD_NAME(userId, adId));
    multi.del(REDIS_KEYS.USER_AD_BID_PRICE(userId, adId));
    multi.del(REDIS_KEYS.USER_AD_PROMPT_CONTENT(userId, adId));
    await multi.exec();
  }

  // User operations (global)
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<User> {
    const userId = await this.generateId('user');
    const now = Date.now();

    const newUser: User = {
      ...user,
      id: userId,
      createdAt: now,
      lastLoginAt: undefined
    };

    const multi = this.client.multi();
    multi.sAdd(REDIS_KEYS.USERS, userId);
    multi.set(REDIS_KEYS.USER_EMAIL(userId), user.email);
    multi.set(REDIS_KEYS.USER_PASSWORD_HASH(userId), user.passwordHash);
    multi.set(REDIS_KEYS.USER_ROLE(userId), user.role);
    multi.set(REDIS_KEYS.USER_CREATED_AT(userId), now.toString());
    multi.set(REDIS_KEYS.USER_HAS_READER(userId), user.hasReader.toString());
    multi.set(REDIS_KEYS.USER_HAS_REPORTER(userId), user.hasReporter.toString());
    multi.set(REDIS_KEYS.USER_HAS_EDITOR(userId), user.hasEditor.toString());
    multi.set(REDIS_KEYS.USER_BY_EMAIL(user.email), userId);
    await multi.exec();

    return newUser;
  }

  async getUserById(userId: string): Promise<User | null> {
    const [email, passwordHash, role, createdAt, lastLoginAt, hasReader, hasReporter, hasEditor] = await Promise.all([
      this.client.get(REDIS_KEYS.USER_EMAIL(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_PASSWORD_HASH(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_ROLE(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_CREATED_AT(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_LAST_LOGIN_AT(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_HAS_READER(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_HAS_REPORTER(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_HAS_EDITOR(userId)) as Promise<string | null>
    ]);

    if (!email || !passwordHash || !role || !createdAt) {
      return null;
    }

    return {
      id: userId,
      email: email as string,
      passwordHash: passwordHash as string,
      role: role as User['role'],
      createdAt: parseInt(String(createdAt)),
      lastLoginAt: lastLoginAt ? parseInt(String(lastLoginAt)) : undefined,
      hasReader: hasReader === 'true',
      hasReporter: hasReporter === 'true',
      hasEditor: hasEditor === 'true'
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const userId = await this.client.get(REDIS_KEYS.USER_BY_EMAIL(email));
    if (!userId) {
      return null;
    }
    return this.getUserById(userId);
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await this.client.set(REDIS_KEYS.USER_LAST_LOGIN_AT(userId), Date.now().toString());
  }

  async getAllUsers(): Promise<User[]> {
    const userIds = await this.client.sMembers(REDIS_KEYS.USERS);
    const users: User[] = [];

    for (const userId of userIds) {
      const user = await this.getUserById(userId);
      if (user) {
        users.push(user);
      }
    }

    return users;
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) {
      return;
    }

    const multi = this.client.multi();
    multi.sRem(REDIS_KEYS.USERS, userId);
    multi.del(REDIS_KEYS.USER_EMAIL(userId));
    multi.del(REDIS_KEYS.USER_PASSWORD_HASH(userId));
    multi.del(REDIS_KEYS.USER_ROLE(userId));
    multi.del(REDIS_KEYS.USER_CREATED_AT(userId));
    multi.del(REDIS_KEYS.USER_LAST_LOGIN_AT(userId));
    multi.del(REDIS_KEYS.USER_HAS_READER(userId));
    multi.del(REDIS_KEYS.USER_HAS_REPORTER(userId));
    multi.del(REDIS_KEYS.USER_HAS_EDITOR(userId));
    multi.del(REDIS_KEYS.USER_BY_EMAIL(user.email));
    await multi.exec();
  }

  // Usage tracking operations (user-scoped)
  async logUsage(userId: string, apiCalls: number, inputTokens: number, outputTokens: number, cost: number): Promise<void> {
    const timestamp = Date.now();
    const dateKey = new Date(timestamp).toISOString().split('T')[0]; // YYYY-MM-DD format

    const multi = this.client.multi();

    // Daily usage
    multi.incrBy(REDIS_KEYS.USER_USAGE_API_CALLS(userId, dateKey), apiCalls);
    multi.incrBy(REDIS_KEYS.USER_USAGE_INPUT_TOKENS(userId, dateKey), inputTokens);
    multi.incrBy(REDIS_KEYS.USER_USAGE_OUTPUT_TOKENS(userId, dateKey), outputTokens);
    multi.incrByFloat(REDIS_KEYS.USER_USAGE_COST(userId, dateKey), cost);

    // Total usage
    multi.incrBy(REDIS_KEYS.USER_USAGE_TOTAL_API_CALLS(userId), apiCalls);
    multi.incrBy(REDIS_KEYS.USER_USAGE_TOTAL_INPUT_TOKENS(userId), inputTokens);
    multi.incrBy(REDIS_KEYS.USER_USAGE_TOTAL_OUTPUT_TOKENS(userId), outputTokens);
    multi.incrByFloat(REDIS_KEYS.USER_USAGE_TOTAL_COST(userId), cost);

    await multi.exec();
  }

  async getUserUsageStats(userId: string): Promise<UserUsageStats> {
    const [totalApiCalls, totalInputTokens, totalOutputTokens, totalCost] = await Promise.all([
      this.client.get(REDIS_KEYS.USER_USAGE_TOTAL_API_CALLS(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_USAGE_TOTAL_INPUT_TOKENS(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_USAGE_TOTAL_OUTPUT_TOKENS(userId)) as Promise<string | null>,
      this.client.get(REDIS_KEYS.USER_USAGE_TOTAL_COST(userId)) as Promise<string | null>
    ]);

    return {
      totalApiCalls: parseInt(String(totalApiCalls || '0')),
      totalInputTokens: parseInt(String(totalInputTokens || '0')),
      totalOutputTokens: parseInt(String(totalOutputTokens || '0')),
      totalCost: parseFloat(String(totalCost || '0')),
      lastUpdated: Date.now()
    };
  }

  async getUserUsageHistory(userId: string, startTime: number, endTime: number): Promise<Array<{
    timestamp: number;
    apiCalls: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>> {
    // This is a simplified implementation. In a real system, you'd want to scan for all usage keys
    // and filter by date range. For now, return empty array.
    return [];
  }

  // Job status operations (user-scoped)
  async setJobRunning(userId: string, jobName: string, running: boolean): Promise<void> {
    await this.client.set(REDIS_KEYS.USER_JOB_RUNNING(userId, jobName), running.toString());
  }

  async getJobRunning(userId: string, jobName: string): Promise<boolean> {
    const value = await (this.client.get(REDIS_KEYS.USER_JOB_RUNNING(userId, jobName)) as Promise<string | null>);
    return value === 'true';
  }

  async setJobLastRun(userId: string, jobName: string, timestamp: number): Promise<void> {
    await this.client.set(REDIS_KEYS.USER_JOB_LAST_RUN(userId, jobName), timestamp.toString());
  }

  async getJobLastRun(userId: string, jobName: string): Promise<number | null> {
    const value = await (this.client.get(REDIS_KEYS.USER_JOB_LAST_RUN(userId, jobName)) as Promise<string | null>);
    return value ? parseInt(String(value)) : null;
  }

  async setJobLastSuccess(userId: string, jobName: string, timestamp: number): Promise<void> {
    await this.client.set(REDIS_KEYS.USER_JOB_LAST_SUCCESS(userId, jobName), timestamp.toString());
  }

  async getJobLastSuccess(userId: string, jobName: string): Promise<number | null> {
    const value = await (this.client.get(REDIS_KEYS.USER_JOB_LAST_SUCCESS(userId, jobName)) as Promise<string | null>);
    return value ? parseInt(String(value)) : null;
  }

  // KPI operations (global)
  async getKpiValue(userId: string, kpiName: string): Promise<number> {
    const value = await (this.client.get(REDIS_KEYS.USER_KPI_VALUE(userId, kpiName)) as Promise<string | null>);
    return parseFloat(String(value || '0'));
  }

  async setKpiValue(userId: string, kpiName: string, value: number): Promise<void> {
    const multi = this.client.multi();
    multi.set(REDIS_KEYS.USER_KPI_VALUE(userId, kpiName), value.toString());
    multi.set(REDIS_KEYS.USER_KPI_LAST_UPDATED(userId, kpiName), Date.now().toString());
    await multi.exec();
  }

  async incrementKpiValue(userId: string, kpiName: string, increment: number): Promise<void> {
    const currentValue = await this.getKpiValue(userId, kpiName);
    await this.setKpiValue(userId, kpiName, currentValue + increment);
  }

  // Utility methods
  async getModelName(): Promise<string | null> {
    // This method is deprecated in multi-tenant setup
    // Return null to indicate it should not be used
    return null;
  }

  async generateId(prefix: string): Promise<string> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  async clearAllData(): Promise<void> {
    await this.client.flushAll();
  }

  // Migration utilities
  async migrateLegacyDataToUser(defaultUserId: string): Promise<void> {
    // This would implement the migration logic from the migration script
    // For now, just mark as completed
    console.log(`Migration to user ${defaultUserId} would be implemented here`);
  }

  async getEffectiveUserId(userId: string): Promise<string> {
    const user = await this.getUserById(userId);
    return user?.role === 'admin' ? 'admin' : userId;
  }

  async getDefaultAdminUserId(): Promise<string> {
    const adminUserId = await this.client.get('migration:default_admin_user_id');
    return adminUserId || 'admin'; // fallback to 'admin' if not set
  }
}