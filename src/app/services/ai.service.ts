import {
  Reporter,
  Article,
  Event,
  ArticleGenerationMetadata,
  EventGenerationMetadata
} from "../schemas/types";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import OpenAI from "openai";

type OpenAIResponse = OpenAI.Chat.Completions.ChatCompletion;

import {
  dailyEditionSchema,
  reporterArticleSchema,
  eventGenerationResponseSchema,
  generatedCommentSchema
} from "../schemas/response-schemas";
import { IDataStorageService } from "./data-storage.interface";
import { KpiService } from "./kpi.service";
import { fetchLatestMessages } from "./bluesky.service";
import { AIPrompts, Persona, PERSONA_DISPLAY_NAMES } from "./ai-prompts";
import { AIResponseUtils } from "./ai-response-utils";
import { AIClient } from "./ai-client";

interface ForumThread {
  id: number;
  title: string;
  forumId: string;
  author: string;
  createdAt: number;
  replyCount: number;
  lastReplyTime: number;
}

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

  private async logAIResponse(
    eventDescription: string,
    response?: OpenAIResponse,
    errorMessage?: string
  ): Promise<void> {
    let strippedResponse: OpenAIResponse | undefined;

    if (response) {
      strippedResponse = this.stripReasoningDetails(response);
    }

    const message = errorMessage
      ? `${eventDescription} failed: ${errorMessage}`
      : `${eventDescription} completed - OpenAI response: ${JSON.stringify(strippedResponse)}`;

    await this.dataStorageService.addLog(message);
  }

  private stripReasoningDetails(response: OpenAIResponse): OpenAIResponse {
    if (!response.choices) {
      return response;
    }

    return {
      ...response,
      choices: response.choices.map((choice) => {
        if (!choice.message) {
          return choice;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { reasoning_details, ...messageWithoutReasoning } =
          choice.message as unknown as Record<string, unknown>;
        return {
          ...choice,
          message:
            messageWithoutReasoning as unknown as OpenAI.Chat.Completions.ChatCompletionMessage
        };
      })
    };
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

      await this.logAIResponse(
        `Article generation for reporter ${reporter.id}`,
        response
      );

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("No response content from AI service");
      }

      // Save the entire AI response to JSON file
      // await AIResponseUtils.saveResponseToFile(
      //   response,
      //   "article",
      //   generationTime
      // );

      const parsedResponse = reporterArticleSchema.parse(
        JSON.parse(content)
      ) as any;

      const metadata = AIResponseUtils.createArticleMetadata(
        articleId,
        reporter.id,
        generationTime,
        modelName || this.getModelName(),
        parsedResponse.body,
        response.usage
      );

      return {
        response: { ...parsedResponse, ...metadata },
        prompt: fullPrompt,
        messages: socialMediaMessages.map((x) => x.text)
      };
    } catch (error) {
      console.error("Error generating structured article:", error);
      await this.logAIResponse(
        `Article generation for reporter ${reporter.id}`,
        undefined,
        error instanceof Error ? error.message : "Unknown error"
      );
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

    const originalIndices = articles.map((_, i) => i);
    const shuffledIndices = [...originalIndices].sort(
      () => 0.5 - Math.random()
    );
    const shuffledArticles = shuffledIndices.map((i) => articles[i]);

    try {
      const articlesText = AIResponseUtils.formatArticlesText(shuffledArticles);
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

      await this.logAIResponse("Story selection", response);

      const selectedShuffledIndices =
        response.choices[0]?.message?.content
          ?.trim()
          .split(",")
          .map((num: string) => parseInt(num.trim()) - 1)
          .filter(
            (index: number) => index >= 0 && index < shuffledArticles.length
          ) || [];

      if (selectedShuffledIndices.length === 0) {
        const minStories = 3;
        const maxStories = Math.min(5, shuffledArticles.length);
        const numStories =
          Math.floor(Math.random() * (maxStories - minStories + 1)) +
          minStories;
        const fallbackShuffled = [...shuffledArticles].sort(
          () => 0.5 - Math.random()
        );
        return {
          selectedArticles: fallbackShuffled.slice(0, numStories),
          fullPrompt,
          modelName: modelName || this.getModelName(),
          inputTokenCount: response.usage?.prompt_tokens,
          outputTokenCount: response.usage?.completion_tokens
        };
      }

      const originalSelectedIndices = selectedShuffledIndices.map(
        (shuffledIdx) => shuffledIndices[shuffledIdx]
      );
      const selectedArticles = originalSelectedIndices.map(
        (origIdx) => articles[origIdx]
      );

      return {
        selectedArticles,
        fullPrompt,
        modelName: modelName || this.getModelName(),
        inputTokenCount: response.usage?.prompt_tokens,
        outputTokenCount: response.usage?.completion_tokens
      };
    } catch (error) {
      console.error("Error selecting newsworthy stories:", error);
      await this.logAIResponse(
        "Story selection",
        undefined,
        error instanceof Error ? error.message : "Unknown error"
      );
      const minStories = 3;
      const maxStories = Math.min(5, shuffledArticles.length);
      const numStories =
        Math.floor(Math.random() * (maxStories - minStories + 1)) + minStories;
      const fallbackShuffled = [...shuffledArticles].sort(
        () => 0.5 - Math.random()
      );
      const fallbackIndices = fallbackShuffled
        .slice(0, numStories)
        .map((article) => shuffledArticles.indexOf(article));
      const originalFallbackIndices = fallbackIndices.map(
        (shuffledIdx) => shuffledIndices[shuffledIdx]
      );
      const selectedArticles = originalFallbackIndices.map(
        (origIdx) => articles[origIdx]
      );
      return {
        selectedArticles,
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
      }>;
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

      await this.logAIResponse("Daily edition generation", response);

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
        !Array.isArray(parsedResponse.topics)
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
      await this.logAIResponse(
        "Daily edition generation",
        undefined,
        error instanceof Error ? error.message : "Unknown error"
      );
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

      await this.logAIResponse(
        `Event generation for reporter ${reporter.id}`,
        response
      );

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("No response content from AI service for events");
      }

      const parsedResponse = eventGenerationResponseSchema.parse(
        JSON.parse(content)
      );

      const eventMetadata = AIResponseUtils.createEventMetadata(
        modelName || this.getModelName(),
        response.usage
      );

      const eventsWithMetadata = (parsedResponse.events as any[]).map(
        (event) => ({
          ...event,
          ...eventMetadata
        })
      );

      return {
        events: eventsWithMetadata,
        fullPrompt,
        messages: socialMediaMessages.map((x) => x.text)
      };
    } catch (error) {
      console.error("Error generating events:", error);
      await this.logAIResponse(
        `Event generation for reporter ${reporter.id}`,
        undefined,
        error instanceof Error ? error.message : "Unknown error"
      );
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

      await this.logAIResponse(
        `Article from events for reporter ${reporter.id}`,
        response
      );

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("No response content from AI service");
      }

      // Save the entire AI response to JSON file
      // await AIResponseUtils.saveResponseToFile(
      //   response,
      //   "article_from_events",
      //   generationTime
      // );

      const parsedResponse = reporterArticleSchema.parse(
        JSON.parse(content)
      ) as any;

      const metadata = AIResponseUtils.createArticleMetadata(
        articleId,
        reporter.id,
        generationTime,
        modelName || this.getModelName(),
        parsedResponse.body,
        response.usage
      );

      return {
        response: { ...parsedResponse, ...metadata },
        prompt: fullPrompt,
        messages: socialMediaMessages.map((x) => x.text)
      };
    } catch (error) {
      console.error("Error generating article from events:", error);
      await this.logAIResponse(
        `Article from events for reporter ${reporter.id}`,
        undefined,
        error instanceof Error ? error.message : "Unknown error"
      );
      return null;
    }
  }

  async generateThreadReplyOptions(
    forumId: string,
    persona: Persona,
    modelName?: string
  ): Promise<{
    replies: string[][];
    threadIds: number[];
    threadTitles: string[];
    fullPrompt: string;
    modelName: string;
  }> {
    try {
      const threads = await this.dataStorageService.getForumThreads(
        forumId,
        0,
        3
      );

      if (threads.length === 0) {
        return {
          replies: [],
          threadIds: [],
          threadTitles: [],
          fullPrompt: "No threads available",
          modelName: modelName || this.getModelName()
        };
      }

      const postsResults = await Promise.all(
        threads.map((thread) =>
          this.dataStorageService.getThreadPosts(thread.id, 0, 1000)
        )
      );

      const promptData = postsResults.map((allPosts, index) => {
        const thread = threads[index];
        const postContents = allPosts.map((p) => p.content);
        const first10 = postContents.slice(0, 10);
        const last15 = postContents.slice(-15);
        const selectedPosts = [...first10, ...last15];

        const { systemPrompt, userPrompt } =
          AIPrompts.generateThreadReplyPrompts(
            persona,
            thread.title,
            selectedPosts
          );
        const fullPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;

        return { thread, systemPrompt, userPrompt, fullPrompt };
      });

      const model = modelName || this.getModelName();

      const threadRepliesSchema = z.array(z.string()).length(3);

      const replies = await Promise.all(
        promptData.map(
          async ({ thread, systemPrompt, userPrompt, fullPrompt }) => {
            try {
              console.log(
                `Calling openai thread reply generation for thread ${thread.id} with model ${model}`
              );

              const response = await this.aiClient
                .getClient()
                .chat.completions.create({
                  model,
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                  ],
                  response_format: zodResponseFormat(
                    threadRepliesSchema,
                    "replies"
                  )
                });

              const content = response.choices[0]?.message?.content;
              if (!content) {
                throw new Error("No response content from AI service");
              }

              const parsed = JSON.parse(content);

              await this.logAIResponse(
                `Thread reply generation for thread ${thread.id}`,
                response
              );

              return parsed;
            } catch (error) {
              console.error(
                `Error generating reply for thread ${thread.id}:`,
                error
              );
              await this.logAIResponse(
                `Thread reply generation for thread ${thread.id}`,
                undefined,
                error instanceof Error ? error.message : "Unknown error"
              );
              return ["", "", ""];
            }
          }
        )
      );

      return {
        replies,
        threadIds: threads.map((t) => t.id),
        threadTitles: threads.map((t) => t.title),
        fullPrompt: promptData.map((p) => p.fullPrompt).join("\n\n---\n\n"),
        modelName: model
      };
    } catch (error) {
      console.error("Error generating thread reply options:", error);
      await this.logAIResponse(
        "Thread reply generation",
        undefined,
        error instanceof Error ? error.message : "Unknown error"
      );
      throw error;
    }
  }

  async generateComment(
    dailyEditionText: string,
    existingComments: Array<{ author: string; content: string }>,
    modelName?: string,
    recentPosts?: string[]
  ): Promise<{
    topicIndex: number;
    persona: Persona;
    commentText: string;
    fullPrompt: string;
    modelName: string;
  } | null> {
    try {
      const personas: Persona[] = ["happy", "loafy", "awoken"];
      const randomPersona =
        personas[Math.floor(Math.random() * personas.length)];

      const existingCommentsText = existingComments
        .map((c) => `- ${c.author}: ${c.content}`)
        .join("\n");

      const { systemPrompt, userPrompt } = AIPrompts.generateCommentPrompts(
        randomPersona,
        dailyEditionText,
        existingCommentsText,
        recentPosts
      );

      const fullPrompt = `System: ${systemPrompt}\n\nUser: ${userPrompt}`;
      const model = modelName || this.getModelName();

      console.log(
        `Generating comment for daily edition with persona: ${randomPersona}, model: ${model}`
      );

      const response = await this.aiClient.getClient().chat.completions.create({
        model,
        reasoning_effort: "minimal",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: zodResponseFormat(generatedCommentSchema, "comment")
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response content from AI service");
      }

      const parsed = JSON.parse(content);

      await this.logAIResponse(
        "Comment generation for daily edition",
        response
      );

      return {
        topicIndex: parsed.topicIndex,
        persona: randomPersona,
        commentText: parsed.comment,
        fullPrompt,
        modelName: model
      };
    } catch (error) {
      console.error("Error generating comment:", error);
      await this.logAIResponse(
        "Comment generation for daily edition",
        undefined,
        error instanceof Error ? error.message : "Unknown error"
      );
      return null;
    }
  }
}
