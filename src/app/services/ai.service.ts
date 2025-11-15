import { Reporter, Article, Event } from "../schemas/types";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  dailyEditionSchema,
  reporterArticleSchema,
  eventGenerationResponseSchema
} from "../schemas/schemas";
import { IDataStorageService } from "./data-storage.interface";
import { KpiService } from "./kpi.service";
import { fetchLatestMessages } from "./bluesky.service";
import { AIPrompts } from "./ai-prompts";
import { AIResponseUtils } from "./ai-response-utils";
import { AIClient } from "./ai-client";

export class AIService {
  private aiClient: AIClient;
  private dataStorageService: IDataStorageService;

  constructor(dataStorageService: IDataStorageService) {
    this.dataStorageService = dataStorageService;
    this.aiClient = new AIClient(dataStorageService);
  }

  getModelName(): string {
    return this.aiClient.getModelName();
  }

  async generateStructuredArticle(
    reporter: Reporter,
    modelName?: string
  ): Promise<{
    response: {
      id: string;
      reporterId: string;
      beat: string;
      headline: string;
      leadParagraph: string;
      body: string;
      keyQuotes: string[];
      sources: string[];
      wordCount: number;
      generationTime: number;
      reporterNotes: {
        researchQuality: string;
        sourceDiversity: string;
        factualAccuracy: string;
      };
      socialMediaSummary: string;
      messageIds: number[];
      potentialMessageIds: number[];
      modelName: string;
      inputTokenCount?: number;
      outputTokenCount?: number;
    };
    prompt: string;
    messages: string[];
  }> {
    const generationTime = Date.now();
    const articleId = `article_${generationTime}_${Math.random().toString(36).substring(2, 8)}`;
    const beatsList = reporter.beats.join(", ");

    try {
      // Get configurable message slice count from Redis
      const messageSliceCount = await this.aiClient.getMessageSliceCount();

      // Fetch recent social media messages to inform article generation
      let socialMediaMessages: Array<{
        did: string;
        text: string;
        time: number;
      }> = [];
      try {
        socialMediaMessages = await fetchLatestMessages(messageSliceCount);
      } catch (error) {
        console.warn("Failed to fetch social media messages:", error);
        // Continue with article generation even if social media fetch fails
      }

      // Fetch the most recent ad from data storage
      let mostRecentAd = null;
      try {
        mostRecentAd = await this.dataStorageService.getMostRecentAd();
      } catch (error) {
        console.warn("Failed to fetch most recent ad:", error);
        // Continue with article generation even if ad fetch fails
      }

      // Format social media messages for the prompt with ad insertion
      const socialMediaContext = AIResponseUtils.formatSocialMediaContext(
        socialMediaMessages,
        true,
        mostRecentAd
      );

      const { systemPrompt, userPrompt } =
        AIPrompts.generateStructuredArticlePrompts(
          reporter,
          beatsList,
          socialMediaContext
        );
      const fullPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;

      console.log(
        `Calling openai article generation with model ${modelName || this.getModelName()}`
      );
      const response = await this.aiClient.getClient().chat.completions.create({
        model: modelName || this.getModelName(),
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        response_format: zodResponseFormat(
          reporterArticleSchema,
          "reporter_article"
        )
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("No response content from AI service");
      }

      // Save the entire AI response to JSON file
      await AIResponseUtils.saveResponseToFile(
        response,
        "article",
        generationTime
      );

      const parsedResponse = reporterArticleSchema.parse(
        JSON.parse(content)
      ) as any;

      // Add generated fields
      AIResponseUtils.addArticleMetadata(
        parsedResponse,
        articleId,
        reporter.id,
        generationTime,
        modelName || this.getModelName(),
        response.usage
      );

      return {
        response: parsedResponse,
        prompt: fullPrompt,
        messages: socialMediaMessages.map((x) => x.text)
      };
    } catch (error) {
      console.error("Error generating structured article:", error);
      // Return fallback structured article
      throw error;
    }
  }

  async selectNewsworthyStories(
    articles: Article[],
    editorPrompt: string,
    modelName?: string
  ): Promise<{
    selectedArticles: Article[];
    fullPrompt: string;
    modelName: string;
    inputTokenCount?: number;
    outputTokenCount?: number;
  }> {
    if (articles.length === 0)
      return {
        selectedArticles: [],
        fullPrompt: "",
        modelName: modelName || this.getModelName()
      };

    try {
      const articlesText = AIResponseUtils.formatArticlesText(articles);
      const { systemPrompt, userPrompt } =
        AIPrompts.selectNewsworthyStoriesPrompts(articlesText, editorPrompt);
      const fullPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;

      console.log(
        `Calling openai story selection with model ${modelName || this.getModelName()}`
      );
      const response = await this.aiClient.getClient().chat.completions.create({
        model: modelName || this.getModelName(),
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ]
      });

      // Track KPI usage
      await KpiService.incrementKpisFromOpenAIResponse(
        response,
        this.dataStorageService
      );

      const selectedIndices =
        response.choices[0]?.message?.content
          ?.trim()
          .split(",")
          .map((num: string) => parseInt(num.trim()) - 1)
          .filter((index: number) => index >= 0 && index < articles.length) ||
        [];

      // If AI selection fails or returns empty, fall back to random selection
      if (selectedIndices.length === 0) {
        const minStories = 3;
        const maxStories = Math.min(5, articles.length);
        const numStories =
          Math.floor(Math.random() * (maxStories - minStories + 1)) +
          minStories;
        const shuffled = [...articles].sort(() => 0.5 - Math.random());
        return {
          selectedArticles: shuffled.slice(0, numStories),
          fullPrompt,
          modelName: modelName || this.getModelName(),
          inputTokenCount: response.usage?.prompt_tokens,
          outputTokenCount: response.usage?.completion_tokens
        };
      }

      return {
        selectedArticles: selectedIndices.map(
          (index: number) => articles[index]
        ),
        fullPrompt,
        modelName: modelName || this.getModelName(),
        inputTokenCount: response.usage?.prompt_tokens,
        outputTokenCount: response.usage?.completion_tokens
      };
    } catch (error) {
      console.error("Error selecting newsworthy stories:", error);
      // Fallback to random selection
      const minStories = 3;
      const maxStories = Math.min(5, articles.length);
      const numStories =
        Math.floor(Math.random() * (maxStories - minStories + 1)) + minStories;
      const shuffled = [...articles].sort(() => 0.5 - Math.random());
      return {
        selectedArticles: shuffled.slice(0, numStories),
        fullPrompt: `System: You are an experienced news editor evaluating story newsworthiness. Select the most important and engaging stories based on journalistic criteria.

User: Given the following articles and editorial guidelines: "${editorPrompt}", select the 3-5 most newsworthy stories from the list below.`,
        modelName: modelName || this.getModelName(),
        inputTokenCount: 0,
        outputTokenCount: 0
      };
    }
  }

  async selectNotableEditions(
    editions: Array<{
      id: string;
      articles: Array<{ headline: string; body: string }>;
    }>,
    editorPrompt: string,
    modelName?: string
  ): Promise<{
    content: {
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
    };
    fullPrompt: string;
    modelName: string;
    inputTokenCount?: number;
    outputTokenCount?: number;
  }> {
    if (editions.length === 0) {
      throw new Error("No editions available for daily edition generation");
    }

    try {
      const editionsText = AIResponseUtils.formatEditionsText(editions);
      const { systemPrompt, userPrompt } =
        AIPrompts.selectNotableEditionsPrompts(editionsText, editorPrompt);
      const fullPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;

      console.log(
        `Calling openai daily edition generation with model ${modelName || this.getModelName()}`
      );
      console.log("Full prompt:", fullPrompt);
      const response = await this.aiClient.getClient().chat.completions.create({
        model: modelName || this.getModelName(),
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        response_format: zodResponseFormat(dailyEditionSchema, "daily_edition")
      });

      // Track KPI usage
      await KpiService.incrementKpisFromOpenAIResponse(
        response,
        this.dataStorageService
      );

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("No response content from AI service");
      }

      const parsedResponse = dailyEditionSchema.parse(
        JSON.parse(content)
      ) as any;

      // Validate the response structure
      if (
        !parsedResponse.frontPageHeadline ||
        !parsedResponse.frontPageArticle ||
        !Array.isArray(parsedResponse.topics) ||
        !parsedResponse.modelFeedbackAboutThePrompt
      ) {
        throw new Error("Invalid response structure from AI service");
      }

      return {
        content: parsedResponse,
        fullPrompt,
        modelName: modelName || this.getModelName(),
        inputTokenCount: response.usage?.prompt_tokens,
        outputTokenCount: response.usage?.completion_tokens
      };
    } catch (error) {
      console.error("Error generating daily edition:", error);
      throw error;
    }
  }

  async generateEvents(
    reporter: Reporter,
    lastEvents: Event[],
    modelName?: string
  ): Promise<{
    events: Array<{
      index?: number | null;
      title: string;
      facts: string[];
      where?: string | null;
      when?: string | null;
      messageIds: number[];
      potentialMessageIds: number[];
      modelName: string;
      inputTokenCount?: number;
      outputTokenCount?: number;
    }>;
    fullPrompt: string;
    messages: string[];
  }> {
    try {
      // Format last events for context
      const eventsContext = AIResponseUtils.formatEventsContext(lastEvents);

      // Get configurable message slice count
      const messageSliceCount = await this.aiClient.getMessageSliceCount();

      // Fetch recent social media messages
      let socialMediaMessages: Array<{
        did: string;
        text: string;
        time: number;
      }> = [];
      try {
        socialMediaMessages = await fetchLatestMessages(messageSliceCount);
      } catch (error) {
        console.warn(
          "Failed to fetch social media messages for events:",
          error
        );
      }

      // Format social media messages for the prompt
      const socialMediaContext =
        socialMediaMessages.length > 0
          ? socialMediaMessages
              .map((msg, index) => `${index + 1}. "${msg.text}"`)
              .join("\n")
          : "No social media messages available.";

      const beatsList = reporter.beats.join(", ");
      const { systemPrompt, userPrompt } = AIPrompts.generateEventsPrompts(
        reporter,
        beatsList,
        eventsContext,
        socialMediaContext
      );
      const fullPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;

      console.log(
        `Calling openai event generation with model ${modelName || this.getModelName()}`
      );
      const response = await this.aiClient.getClient().chat.completions.create({
        model: modelName || this.getModelName(),
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        response_format: zodResponseFormat(
          eventGenerationResponseSchema,
          "event_generation"
        )
      });

      // Track KPI usage
      await KpiService.incrementKpisFromOpenAIResponse(
        response,
        this.dataStorageService
      );

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("No response content from AI service for events");
      }

      const parsedResponse = eventGenerationResponseSchema.parse(
        JSON.parse(content)
      );

      // Add modelName and token counts to each event
      const eventsWithModelName = (parsedResponse.events as any[]).map(
        (event) => ({
          ...event,
          modelName: modelName || this.getModelName(),
          inputTokenCount: response.usage?.prompt_tokens,
          outputTokenCount: response.usage?.completion_tokens
        })
      );

      return {
        events: eventsWithModelName,
        fullPrompt,
        messages: socialMediaMessages.map((x) => x.text)
      };
    } catch (error) {
      console.error("Error generating events:", error);
      // Return empty events on error
      return {
        events: [],
        fullPrompt: "Error occurred during event generation",
        messages: []
      };
    }
  }

  async generateArticlesFromEvents(
    reporter: Reporter,
    modelName?: string
  ): Promise<{
    response: {
      id: string;
      reporterId: string;
      beat: string;
      headline: string;
      leadParagraph: string;
      body: string;
      keyQuotes: string[];
      sources: string[];
      wordCount: number;
      generationTime: number;
      reporterNotes: {
        researchQuality: string;
        sourceDiversity: string;
        factualAccuracy: string;
      };
      socialMediaSummary: string;
      messageIds: number[];
      potentialMessageIds: number[];
      modelName: string;
    };
    prompt: string;
    messages: string[];
  } | null> {
    const generationTime = Date.now();
    const articleId = `article_${generationTime}_${Math.random().toString(36).substring(2, 8)}`;
    const beatsList = reporter.beats.join(", ");

    try {
      // Get reporter's 5 latest events
      const latestEvents = await this.dataStorageService.getEventsByReporter(
        reporter.id,
        5
      );

      // Get reporter's 5 latest articles for context
      const latestArticles =
        await this.dataStorageService.getArticlesByReporter(reporter.id, 5);

      // Format events for the prompt
      const eventsContext = AIResponseUtils.formatEventsContext(latestEvents);

      // Format recent article headlines for context
      const articlesContext =
        AIResponseUtils.formatArticlesContext(latestArticles);

      // Get configurable message slice count
      const messageSliceCount = await this.aiClient.getMessageSliceCount();

      // Fetch recent social media messages to inform article generation
      let socialMediaMessages: Array<{
        did: string;
        text: string;
        time: number;
      }> = [];
      try {
        socialMediaMessages = await fetchLatestMessages(messageSliceCount);
      } catch (error) {
        console.warn("Failed to fetch social media messages:", error);
        // Continue with article generation even if social media fetch fails
      }

      // Format social media messages for the prompt
      const socialMediaContext = AIResponseUtils.formatSocialMediaContext(
        socialMediaMessages,
        false
      );

      const { systemPrompt, userPrompt } =
        AIPrompts.generateArticlesFromEventsPrompts(
          reporter,
          beatsList,
          eventsContext,
          articlesContext,
          socialMediaContext
        );
      const fullPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;

      console.log(
        `Calling openai articles from events generation with model ${modelName || this.getModelName()}`
      );
      const response = await this.aiClient.getClient().chat.completions.create({
        model: modelName || this.getModelName(),
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        response_format: zodResponseFormat(
          reporterArticleSchema,
          "reporter_article"
        )
      });

      // Track KPI usage
      await KpiService.incrementKpisFromOpenAIResponse(
        response,
        this.dataStorageService
      );

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("No response content from AI service");
      }

      // Save the entire AI response to JSON file
      await AIResponseUtils.saveResponseToFile(
        response,
        "article_from_events",
        generationTime
      );

      const parsedResponse = reporterArticleSchema.parse(
        JSON.parse(content)
      ) as any;

      // Add generated fields
      AIResponseUtils.addArticleMetadata(
        parsedResponse,
        articleId,
        reporter.id,
        generationTime,
        modelName || this.getModelName(),
        response.usage
      );

      return {
        response: parsedResponse,
        prompt: fullPrompt,
        messages: socialMediaMessages.map((x) => x.text)
      };
    } catch (error) {
      console.error("Error generating article from events:", error);
      return null;
    }
  }
}
