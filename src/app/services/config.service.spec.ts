import { ConfigService } from "./config.service";
import { readFile } from "fs/promises";
import * as yaml from "js-yaml";

// Mock fs/promises
jest.mock("fs/promises");
jest.mock("js-yaml");

const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockYamlLoad = yaml.load as jest.MockedFunction<typeof yaml.load>;

describe("ConfigService", () => {
  let configService: ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    configService = new ConfigService();
  });

  describe("loadConfig", () => {
    it("should load config from yaml file", async () => {
      const mockConfig = {
        app: {
          name: "TestRoom",
          fullName: "Test AI Newsroom"
        }
      };

      mockReadFile.mockResolvedValue("yaml content");
      mockYamlLoad.mockReturnValue(mockConfig);

      const config = await configService.loadConfig();

      expect(mockReadFile).toHaveBeenCalledWith("config.yaml", "utf-8");
      expect(mockYamlLoad).toHaveBeenCalledWith("yaml content");
      expect(config).toEqual(mockConfig);
    });

    it("should apply environment variable overrides", async () => {
      const mockConfig = {
        app: {
          name: "Newsroom",
          fullName: "AI Newsroom"
        }
      };

      process.env.APP_NAME = "CustomName";
      process.env.APP_FULL_NAME = "Custom Full Name";

      mockReadFile.mockResolvedValue("yaml content");
      mockYamlLoad.mockReturnValue(mockConfig);

      const config = await configService.loadConfig();

      expect(config.app.name).toBe("CustomName");
      expect(config.app.fullName).toBe("Custom Full Name");

      delete process.env.APP_NAME;
      delete process.env.APP_FULL_NAME;
    });

    it("should return default config when file read fails", async () => {
      mockReadFile.mockRejectedValue(new Error("File not found"));

      const config = await configService.loadConfig();

      expect(config.app.name).toBe("Newsroom");
      expect(config.app.fullName).toBe("AI Newsroom");
    });
  });

  describe("getAppName", () => {
    it("should return app name", async () => {
      const mockConfig = {
        app: {
          name: "TestName",
          fullName: "Test Full Name"
        }
      };

      mockReadFile.mockResolvedValue("yaml content");
      mockYamlLoad.mockReturnValue(mockConfig);

      const name = await configService.getAppName();

      expect(name).toBe("TestName");
    });
  });

  describe("getAppFullName", () => {
    it("should return app full name", async () => {
      const mockConfig = {
        app: {
          name: "TestName",
          fullName: "Test Full Name"
        }
      };

      mockReadFile.mockResolvedValue("yaml content");
      mockYamlLoad.mockReturnValue(mockConfig);

      const fullName = await configService.getAppFullName();

      expect(fullName).toBe("Test Full Name");
    });
  });
});
