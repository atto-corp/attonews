import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import * as yaml from "js-yaml";

interface AppConfig {
  name: string;
  fullName: string;
  description?: string;
}

interface Config {
  app: AppConfig;
}

export async function GET() {
  try {
    const configPath = join(process.cwd(), "config.yaml");
    const configContent = await readFile(configPath, "utf-8");
    const parsedConfig = yaml.load(configContent) as Config;

    // Apply environment variable overrides
    const config: Config = {
      app: {
        name: process.env.APP_NAME || parsedConfig.app.name,
        fullName: process.env.APP_FULL_NAME || parsedConfig.app.fullName,
        description: parsedConfig.app.description
      }
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching config:", error);
    // Fallback to default values
    return NextResponse.json({
      app: {
        name: "Newsroom",
        fullName: "AI Newsroom"
      }
    });
  }
}
