import { readFile } from 'fs/promises';
import { join } from 'path';
import * as yaml from 'js-yaml';

interface AppConfig {
  name: string;
  fullName: string;
  description?: string;
}

interface Config {
  app: AppConfig;
}

export class ConfigService {
  private config: Config | null = null;
  private configPath: string;

  constructor() {
    this.configPath = join(process.cwd(), 'config.yaml');
  }

  async loadConfig(): Promise<Config> {
    if (this.config) {
      return this.config;
    }

    try {
      const configContent = await readFile(this.configPath, 'utf-8');
      const parsedConfig = yaml.load(configContent) as Config;

      // Apply environment variable overrides
      const overriddenConfig: Config = {
        app: {
          name: process.env.APP_NAME || parsedConfig.app.name,
          fullName: process.env.APP_FULL_NAME || parsedConfig.app.fullName,
          description: parsedConfig.app.description
        }
      };

      this.config = overriddenConfig;
      return this.config;
    } catch (error) {
      console.warn('Failed to load config.yaml, using default values:', error);
      // Fallback to default values
      this.config = {
        app: {
          name: 'Newsroom',
          fullName: 'AI Newsroom'
        }
      };
      return this.config;
    }
  }

  async getAppName(): Promise<string> {
    const config = await this.loadConfig();
    return config.app.name;
  }

  async getAppFullName(): Promise<string> {
    const config = await this.loadConfig();
    return config.app.fullName;
  }

  async getAppDescription(): Promise<string | undefined> {
    const config = await this.loadConfig();
    return config.app.description;
  }

  async getConfig(): Promise<Config> {
    return await this.loadConfig();
  }
}