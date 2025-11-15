import { writeFile } from 'fs/promises';
import { join } from 'path';

export class AIResponseUtils {
  static async saveResponseToFile(response: any, prefix: string, timestamp: number): Promise<void> {
    try {
      const responseFilePath = join(process.cwd(), 'api_responses', `${prefix}_${timestamp}.json`);
      await writeFile(responseFilePath, JSON.stringify(response, null, 2));
    } catch (error) {
      console.warn('Failed to save AI response to file:', error);
      // Continue with article generation even if file save fails
    }
  }

  static addArticleMetadata(
    response: any,
    articleId: string,
    reporterId: string,
    generationTime: number,
    modelName: string,
    tokenUsage?: { prompt_tokens?: number; completion_tokens?: number }
  ): void {
    response.id = articleId;
    response.reporterId = reporterId;
    response.generationTime = generationTime;
    response.wordCount = response.body!.split(' ').length;
    response.modelName = modelName;
    response.inputTokenCount = tokenUsage?.prompt_tokens;
    response.outputTokenCount = tokenUsage?.completion_tokens;
  }

  static formatSocialMediaContext(
    messages: Array<{did: string; text: string; time: number}>,
    includeAds?: boolean,
    mostRecentAd?: any
  ): string {
    if (messages.length === 0) {
      return '';
    }

    const formattedMessages: string[] = [];

    for (let i = 0; i < messages.length; i++) {
      formattedMessages.push(`${i + 1}. "${messages[i].text}"`);

      // Insert ad prompt after every 20 message entries if ads are enabled
      if (includeAds && (i + 1) % 20 === 0 && mostRecentAd) {
        formattedMessages.push(`\n\n${mostRecentAd.promptContent}\n\n`);
      }
    }

    return `\n\nRecent social media discussions:\n${formattedMessages.join('\n')}`;
  }

  static formatArticlesText(articles: any[]): string {
    return articles.map((article, index) =>
      `Article ${index + 1}:\nHeadline: ${article.headline}\nContent: ${article.body.substring(0, 300)}...`
    ).join('\n\n');
  }

  static formatEditionsText(editions: Array<{id: string; articles: Array<{headline: string; body: string}>}>): string {
    return editions.map((edition, index) => {
      const articlesText = edition.articles.map((article, articleIndex) =>
        `Article ${articleIndex + 1}:\nHeadline: ${article.headline}\nFirst Paragraph: ${article.body.split('\n')[0] || article.body.substring(0, 200)}`
      ).join('\n\n');
      return `Edition ${index + 1} (ID: ${edition.id}):\n${articlesText}`;
    }).join('\n\n');
  }

  static formatEventsContext(events: any[]): string {
    if (events.length === 0) {
      return 'No previous events available.';
    }
    return events.map((event, index) =>
      `Event ${index + 1}:\nTitle: ${event.title}\nFacts: ${event.facts.join(', ')}\nCreated: ${new Date(event.createdTime).toISOString()}`
    ).join('\n\n');
  }

  static formatArticlesContext(articles: any[]): string {
    if (articles.length === 0) {
      return 'No previous articles available for this reporter.';
    }
    return articles.map((article, index) =>
      `Article ${index + 1}: "${article.headline}"`
    ).join('\n');
  }
}