import OpenAI from "openai";
import { IDataStorageService } from "./data-storage.interface";

export class AIClient {
  private openai: OpenAI;
  private modelName: string = "gpt-5-nano";
  private dataStorageService: IDataStorageService;

  constructor(dataStorageService: IDataStorageService) {
    this.dataStorageService = dataStorageService;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    // Initialize OpenAI client synchronously first, then update with baseUrl if available
    this.openai = new OpenAI({
      apiKey: apiKey
    });

    // Initialize OpenAI client with configurable base URL asynchronously
    this.initializeOpenAIClient(apiKey);

    // Initialize modelName from Redis with default
    this.initializeModelName();
  }

  private async initializeOpenAIClient(apiKey: string): Promise<void> {
    try {
      const editor = await this.dataStorageService.getEditor();
      const baseUrl = editor?.baseUrl;

      if (baseUrl) {
        // Re-initialize with baseUrl if available
        this.openai = new OpenAI({
          apiKey: apiKey,
          baseURL: baseUrl
        });
      }
    } catch (error) {
      console.warn(
        "Failed to fetch baseUrl from Redis, keeping default OpenAI API:",
        error
      );
    }
  }

  private async initializeModelName(): Promise<void> {
    try {
      const storedModelName = await this.dataStorageService.getModelName();
      this.modelName = storedModelName || "gpt-5-nano";
    } catch (error) {
      console.warn(
        "Failed to fetch modelName from Redis, using default:",
        error
      );
      this.modelName = "gpt-5-nano";
    }
  }

  getClient(): OpenAI {
    return this.openai;
  }

  getModelName(): string {
    return this.modelName;
  }

  async getMessageSliceCount(): Promise<number> {
    let messageSliceCount = 200; // Default fallback
    try {
      const editor = await this.dataStorageService.getEditor();
      if (editor) {
        messageSliceCount = editor.messageSliceCount;
      }
    } catch (error) {
      console.warn(
        "Failed to fetch message slice count from Redis, using default:",
        error
      );
    }
    return messageSliceCount;
  }
}
