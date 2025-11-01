#!/usr/bin/env tsx

/**
 * Migration script to convert single-tenant data to multi-tenant structure
 * This script moves all existing global data to a default admin user
 */

import { RedisDataStorageMultiTenantService } from '../services/redis-data-storage-multi-tenant.service';
import { REDIS_KEYS } from '../app/models/types';
import { createClient, RedisClientType } from 'redis';

async function migrateToMultiTenant() {
  console.log('Starting multi-tenant migration...');

  const redis = createClient({
    url: 'redis://localhost:6379'
  });

  await redis.connect();
  console.log('Connected to Redis');

  // Define the default admin user ID
  const DEFAULT_ADMIN_USER_ID = 'admin';

  try {
    // Check if migration has already been run
    const migrationFlag = await redis.get('migration:multi_tenant_completed');
    if (migrationFlag === 'true') {
      console.log('Migration already completed. Skipping...');
      return;
    }

    console.log('Starting data migration to user:', DEFAULT_ADMIN_USER_ID);

    // Migrate Editor data
    console.log('Migrating editor data...');
    const editorBio = await redis.get(REDIS_KEYS.LEGACY_EDITOR_BIO);
    const editorPrompt = await redis.get(REDIS_KEYS.LEGACY_EDITOR_PROMPT);
    const messageSliceCount = await redis.get(REDIS_KEYS.LEGACY_EDITOR_MESSAGE_SLICE_COUNT);
    const inputTokenCost = await redis.get(REDIS_KEYS.LEGACY_INPUT_TOKEN_COST);
    const outputTokenCost = await redis.get(REDIS_KEYS.LEGACY_OUTPUT_TOKEN_COST);
    const articleGenPeriod = await redis.get(REDIS_KEYS.LEGACY_ARTICLE_GENERATION_PERIOD_MINUTES);
    const lastArticleGen = await redis.get(REDIS_KEYS.LEGACY_LAST_ARTICLE_GENERATION_TIME);
    const eventGenPeriod = await redis.get(REDIS_KEYS.LEGACY_EVENT_GENERATION_PERIOD_MINUTES);
    const lastEventGen = await redis.get(REDIS_KEYS.LEGACY_LAST_EVENT_GENERATION_TIME);
    const editionGenPeriod = await redis.get(REDIS_KEYS.LEGACY_EDITION_GENERATION_PERIOD_MINUTES);
    const lastEditionGen = await redis.get(REDIS_KEYS.LEGACY_LAST_EDITION_GENERATION_TIME);

    if (editorBio || editorPrompt) {
      const multi = redis.multi();
      if (editorBio) multi.set(REDIS_KEYS.USER_EDITOR_BIO(DEFAULT_ADMIN_USER_ID), editorBio);
      if (editorPrompt) multi.set(REDIS_KEYS.USER_EDITOR_PROMPT(DEFAULT_ADMIN_USER_ID), editorPrompt);
      if (messageSliceCount) multi.set(REDIS_KEYS.USER_EDITOR_MESSAGE_SLICE_COUNT(DEFAULT_ADMIN_USER_ID), messageSliceCount);
      if (inputTokenCost) multi.set(REDIS_KEYS.USER_INPUT_TOKEN_COST(DEFAULT_ADMIN_USER_ID), inputTokenCost);
      if (outputTokenCost) multi.set(REDIS_KEYS.USER_OUTPUT_TOKEN_COST(DEFAULT_ADMIN_USER_ID), outputTokenCost);
      if (lastArticleGen) multi.set(REDIS_KEYS.USER_ARTICLE_GENERATION_LAST_TIME(DEFAULT_ADMIN_USER_ID), lastArticleGen);
      if (lastEventGen) multi.set(REDIS_KEYS.USER_EVENT_GENERATION_LAST_TIME(DEFAULT_ADMIN_USER_ID), lastEventGen);
      if (lastEditionGen) multi.set(REDIS_KEYS.USER_EDITION_GENERATION_LAST_TIME(DEFAULT_ADMIN_USER_ID), lastEditionGen);
      await multi.exec();
      console.log('✓ Editor data migrated');
    }

    // Migrate AI Model Name to user config
    const modelName = await redis.get(REDIS_KEYS.LEGACY_MODEL_NAME);
    if (modelName) {
      await redis.set(REDIS_KEYS.USER_MODEL_NAME(DEFAULT_ADMIN_USER_ID), modelName);
      console.log('✓ Model name migrated');
    }

    // Create default user AI config
    const defaultConfig = {
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      openaiBaseUrl: undefined,
      modelName: modelName || 'gpt-5-nano',
      inputTokenCost: parseFloat(inputTokenCost || '0.00015'),
      outputTokenCost: parseFloat(outputTokenCost || '0.0006'),
      messageSliceCount: parseInt(messageSliceCount || '200'),
      articleGenerationPeriodMinutes: parseInt(articleGenPeriod || '60'),
      eventGenerationPeriodMinutes: parseInt(eventGenPeriod || '30'),
      editionGenerationPeriodMinutes: parseInt(editionGenPeriod || '1440')
    };

    const configMulti = redis.multi();
    configMulti.set(REDIS_KEYS.USER_OPENAI_API_KEY(DEFAULT_ADMIN_USER_ID), defaultConfig.openaiApiKey);
    configMulti.set(REDIS_KEYS.USER_MODEL_NAME(DEFAULT_ADMIN_USER_ID), defaultConfig.modelName);
    configMulti.set(REDIS_KEYS.USER_INPUT_TOKEN_COST(DEFAULT_ADMIN_USER_ID), defaultConfig.inputTokenCost.toString());
    configMulti.set(REDIS_KEYS.USER_OUTPUT_TOKEN_COST(DEFAULT_ADMIN_USER_ID), defaultConfig.outputTokenCost.toString());
    configMulti.set(REDIS_KEYS.USER_MESSAGE_SLICE_COUNT(DEFAULT_ADMIN_USER_ID), defaultConfig.messageSliceCount.toString());
    configMulti.set(REDIS_KEYS.USER_ARTICLE_GENERATION_PERIOD_MINUTES(DEFAULT_ADMIN_USER_ID), defaultConfig.articleGenerationPeriodMinutes.toString());
    configMulti.set(REDIS_KEYS.USER_EVENT_GENERATION_PERIOD_MINUTES(DEFAULT_ADMIN_USER_ID), defaultConfig.eventGenerationPeriodMinutes.toString());
    configMulti.set(REDIS_KEYS.USER_EDITION_GENERATION_PERIOD_MINUTES(DEFAULT_ADMIN_USER_ID), defaultConfig.editionGenerationPeriodMinutes.toString());
    await configMulti.exec();
    console.log('✓ User AI config created');

    // Migrate Reporters
    console.log('Migrating reporters...');
    const reporterIds = await redis.sMembers(REDIS_KEYS.LEGACY_REPORTERS);
    if (reporterIds.length > 0) {
      const reporterMulti = redis.multi();
      reporterIds.forEach(id => reporterMulti.sAdd(REDIS_KEYS.USER_REPORTERS(DEFAULT_ADMIN_USER_ID), id));

      for (const reporterId of reporterIds) {
        const beats = await redis.sMembers(REDIS_KEYS.LEGACY_REPORTER_BEATS(reporterId));
        const prompt = await redis.get(REDIS_KEYS.LEGACY_REPORTER_PROMPT(reporterId));
        const enabled = await redis.get(REDIS_KEYS.LEGACY_REPORTER_ENABLED(reporterId));

        if (beats.length > 0) {
          beats.forEach(beat => reporterMulti.sAdd(REDIS_KEYS.USER_REPORTER_BEATS(DEFAULT_ADMIN_USER_ID, reporterId), beat));
        }
        if (prompt) reporterMulti.set(REDIS_KEYS.USER_REPORTER_PROMPT(DEFAULT_ADMIN_USER_ID, reporterId), prompt);
        if (enabled) reporterMulti.set(REDIS_KEYS.USER_REPORTER_ENABLED(DEFAULT_ADMIN_USER_ID, reporterId), enabled);
      }
      await reporterMulti.exec();
      console.log(`✓ ${reporterIds.length} reporters migrated`);
    }

    // Migrate Articles
    console.log('Migrating articles...');
    for (const reporterId of reporterIds) {
      const articleIds = await redis.zRange(REDIS_KEYS.LEGACY_ARTICLES_BY_REPORTER(reporterId), 0, -1);

      for (const articleId of articleIds) {
        const headline = await redis.get(REDIS_KEYS.LEGACY_ARTICLE_HEADLINE(articleId));
        const body = await redis.get(REDIS_KEYS.LEGACY_ARTICLE_BODY(articleId));
        const time = await redis.get(REDIS_KEYS.LEGACY_ARTICLE_TIME(articleId));
        const prompt = await redis.get(REDIS_KEYS.LEGACY_ARTICLE_PROMPT(articleId));
        const messageIds = await redis.get(REDIS_KEYS.LEGACY_ARTICLE_MESSAGE_IDS(articleId));
        const messageTexts = await redis.get(REDIS_KEYS.LEGACY_ARTICLE_MESSAGE_TEXTS(articleId));

        if (headline && body && time) {
          const articleMulti = redis.multi();
          articleMulti.zAdd(REDIS_KEYS.USER_ARTICLES_BY_REPORTER(DEFAULT_ADMIN_USER_ID, reporterId), {
            score: parseInt(time),
            value: articleId
          });
          articleMulti.set(REDIS_KEYS.USER_ARTICLE_HEADLINE(DEFAULT_ADMIN_USER_ID, articleId), headline);
          articleMulti.set(REDIS_KEYS.USER_ARTICLE_BODY(DEFAULT_ADMIN_USER_ID, articleId), body);
          articleMulti.set(REDIS_KEYS.USER_ARTICLE_TIME(DEFAULT_ADMIN_USER_ID, articleId), time);
          if (prompt) articleMulti.set(REDIS_KEYS.USER_ARTICLE_PROMPT(DEFAULT_ADMIN_USER_ID, articleId), prompt);
          if (messageIds) articleMulti.set(REDIS_KEYS.USER_ARTICLE_MESSAGE_IDS(DEFAULT_ADMIN_USER_ID, articleId), messageIds);
          if (messageTexts) articleMulti.set(REDIS_KEYS.USER_ARTICLE_MESSAGE_TEXTS(DEFAULT_ADMIN_USER_ID, articleId), messageTexts);
          await articleMulti.exec();
        }
      }
    }
    console.log('✓ Articles migrated');

    // Migrate Events
    console.log('Migrating events...');
    for (const reporterId of reporterIds) {
      const eventIds = await redis.zRange(REDIS_KEYS.LEGACY_EVENTS_BY_REPORTER(reporterId), 0, -1);

      for (const eventId of eventIds) {
        const title = await redis.get(REDIS_KEYS.LEGACY_EVENT_TITLE(eventId));
        const createdTime = await redis.get(REDIS_KEYS.LEGACY_EVENT_CREATED_TIME(eventId));
        const updatedTime = await redis.get(REDIS_KEYS.LEGACY_EVENT_UPDATED_TIME(eventId));
        const facts = await redis.get(REDIS_KEYS.LEGACY_EVENT_FACTS(eventId));
        const where = await redis.get(REDIS_KEYS.LEGACY_EVENT_WHERE(eventId));
        const when = await redis.get(REDIS_KEYS.LEGACY_EVENT_WHEN(eventId));
        const messageIds = await redis.get(REDIS_KEYS.LEGACY_EVENT_MESSAGE_IDS(eventId));
        const messageTexts = await redis.get(REDIS_KEYS.LEGACY_EVENT_MESSAGE_TEXTS(eventId));

        if (title && createdTime && updatedTime && facts) {
          const eventMulti = redis.multi();
          eventMulti.zAdd(REDIS_KEYS.USER_EVENTS_BY_REPORTER(DEFAULT_ADMIN_USER_ID, reporterId), {
            score: parseInt(createdTime),
            value: eventId
          });
          eventMulti.set(REDIS_KEYS.USER_EVENT_TITLE(DEFAULT_ADMIN_USER_ID, eventId), title);
          eventMulti.set(REDIS_KEYS.USER_EVENT_CREATED_TIME(DEFAULT_ADMIN_USER_ID, eventId), createdTime);
          eventMulti.set(REDIS_KEYS.USER_EVENT_UPDATED_TIME(DEFAULT_ADMIN_USER_ID, eventId), updatedTime);
          eventMulti.set(REDIS_KEYS.USER_EVENT_FACTS(DEFAULT_ADMIN_USER_ID, eventId), facts);
          if (where) eventMulti.set(REDIS_KEYS.USER_EVENT_WHERE(DEFAULT_ADMIN_USER_ID, eventId), where);
          if (when) eventMulti.set(REDIS_KEYS.USER_EVENT_WHEN(DEFAULT_ADMIN_USER_ID, eventId), when);
          if (messageIds) eventMulti.set(REDIS_KEYS.USER_EVENT_MESSAGE_IDS(DEFAULT_ADMIN_USER_ID, eventId), messageIds);
          if (messageTexts) eventMulti.set(REDIS_KEYS.USER_EVENT_MESSAGE_TEXTS(DEFAULT_ADMIN_USER_ID, eventId), messageTexts);
          await eventMulti.exec();
        }
      }
    }
    console.log('✓ Events migrated');

    // Migrate Newspaper Editions
    console.log('Migrating newspaper editions...');
    const editionIds = await redis.zRange(REDIS_KEYS.LEGACY_EDITIONS, 0, -1);
    if (editionIds.length > 0) {
      const editionMulti = redis.multi();
      const editionScores = await redis.zRangeWithScores(REDIS_KEYS.LEGACY_EDITIONS, 0, -1);
      editionScores.forEach(({ value, score }) => {
        editionMulti.zAdd(REDIS_KEYS.USER_EDITIONS(DEFAULT_ADMIN_USER_ID), { score, value });
      });

      for (const editionId of editionIds) {
        const stories = await redis.get(REDIS_KEYS.LEGACY_EDITION_STORIES(editionId));
        const time = await redis.get(REDIS_KEYS.LEGACY_EDITION_TIME(editionId));
        const prompt = await redis.get(REDIS_KEYS.LEGACY_EDITION_PROMPT(editionId));

        if (stories) editionMulti.set(REDIS_KEYS.USER_EDITION_STORIES(DEFAULT_ADMIN_USER_ID, editionId), stories);
        if (time) editionMulti.set(REDIS_KEYS.USER_EDITION_TIME(DEFAULT_ADMIN_USER_ID, editionId), time);
        if (prompt) editionMulti.set(REDIS_KEYS.USER_EDITION_PROMPT(DEFAULT_ADMIN_USER_ID, editionId), prompt);
      }
      await editionMulti.exec();
      console.log(`✓ ${editionIds.length} newspaper editions migrated`);
    }

    // Migrate Daily Editions
    console.log('Migrating daily editions...');
    const dailyEditionIds = await redis.zRange(REDIS_KEYS.LEGACY_DAILY_EDITIONS, 0, -1);
    if (dailyEditionIds.length > 0) {
      const dailyEditionMulti = redis.multi();
      const dailyEditionScores = await redis.zRangeWithScores(REDIS_KEYS.LEGACY_DAILY_EDITIONS, 0, -1);
      dailyEditionScores.forEach(({ value, score }) => {
        dailyEditionMulti.zAdd(REDIS_KEYS.USER_DAILY_EDITIONS(DEFAULT_ADMIN_USER_ID), { score, value });
      });

      for (const dailyEditionId of dailyEditionIds) {
        const editions = await redis.get(REDIS_KEYS.LEGACY_DAILY_EDITION_EDITIONS(dailyEditionId));
        const time = await redis.get(REDIS_KEYS.LEGACY_DAILY_EDITION_TIME(dailyEditionId));
        const prompt = await redis.get(REDIS_KEYS.LEGACY_DAILY_EDITION_PROMPT(dailyEditionId));

        if (editions) dailyEditionMulti.set(REDIS_KEYS.USER_DAILY_EDITION_EDITIONS(DEFAULT_ADMIN_USER_ID, dailyEditionId), editions);
        if (time) dailyEditionMulti.set(REDIS_KEYS.USER_DAILY_EDITION_TIME(DEFAULT_ADMIN_USER_ID, dailyEditionId), time);
        if (prompt) dailyEditionMulti.set(REDIS_KEYS.USER_DAILY_EDITION_PROMPT(DEFAULT_ADMIN_USER_ID, dailyEditionId), prompt);
      }
      await dailyEditionMulti.exec();
      console.log(`✓ ${dailyEditionIds.length} daily editions migrated`);
    }

    // Migrate Ads
    console.log('Migrating ads...');
    const adIds = await redis.sMembers(REDIS_KEYS.LEGACY_ADS);
    if (adIds.length > 0) {
      const adMulti = redis.multi();
      adIds.forEach(id => adMulti.sAdd(REDIS_KEYS.USER_ADS(DEFAULT_ADMIN_USER_ID), id));

      for (const adId of adIds) {
        const name = await redis.get(REDIS_KEYS.LEGACY_AD_NAME(adId));
        const bidPrice = await redis.get(REDIS_KEYS.LEGACY_AD_BID_PRICE(adId));
        const promptContent = await redis.get(REDIS_KEYS.LEGACY_AD_PROMPT_CONTENT(adId));

        if (name) adMulti.set(REDIS_KEYS.USER_AD_NAME(DEFAULT_ADMIN_USER_ID, adId), name);
        if (bidPrice) adMulti.set(REDIS_KEYS.USER_AD_BID_PRICE(DEFAULT_ADMIN_USER_ID, adId), bidPrice);
        if (promptContent) adMulti.set(REDIS_KEYS.USER_AD_PROMPT_CONTENT(DEFAULT_ADMIN_USER_ID, adId), promptContent);
      }
      await adMulti.exec();
      console.log(`✓ ${adIds.length} ads migrated`);
    }

    // Mark migration as completed
    await redis.set('migration:multi_tenant_completed', 'true');
    await redis.set('migration:multi_tenant_timestamp', Date.now().toString());
    await redis.set('migration:default_admin_user_id', DEFAULT_ADMIN_USER_ID);

    console.log('\n🎉 Migration completed successfully!');
    console.log(`Default admin user ID: ${DEFAULT_ADMIN_USER_ID}`);
    console.log('You can now start using the multi-tenant system.');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await redis.disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToMultiTenant()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateToMultiTenant };