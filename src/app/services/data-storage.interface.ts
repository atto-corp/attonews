
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
  UserUsageStats
} from '../models/types';

export interface IDataStorageService {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // User AI Configuration operations
  saveUserAIConfig(userId: string, config: UserAIConfig): Promise<void>;
  getUserAIConfig(userId: string): Promise<UserAIConfig | null>;
  updateUserAIConfig(userId: string, updates: Partial<UserAIConfig>): Promise<void>;

  // Editor operations (user-scoped)
  saveEditor(userId: string, editor: Editor): Promise<void>;
  getEditor(userId: string): Promise<Editor | null>;

  // Reporter operations (user-scoped)
  saveReporter(userId: string, reporter: Reporter): Promise<void>;
  getAllReporters(userId: string): Promise<Reporter[]>;
  getReporter(userId: string, id: string): Promise<Reporter | null>;

  // Article operations (user-scoped)
  saveArticle(userId: string, article: Article): Promise<void>;
  getArticlesByReporter(userId: string, reporterId: string, limit?: number): Promise<Article[]>;
  getAllArticles(userId: string, limit?: number): Promise<Article[]>;
  getArticlesInTimeRange(userId: string, reporterId: string, startTime: number, endTime: number): Promise<Article[]>;
  getArticle(userId: string, articleId: string): Promise<Article | null>;

  // Event operations (user-scoped)
  saveEvent(userId: string, event: Event): Promise<void>;
  getEventsByReporter(userId: string, reporterId: string, limit?: number): Promise<Event[]>;
  getAllEvents(userId: string, limit?: number): Promise<Event[]>;
  getLatestUpdatedEvents(userId: string, limit?: number): Promise<Event[]>;
  getEvent(userId: string, eventId: string): Promise<Event | null>;
  updateEventFacts(userId: string, eventId: string, newFacts: string[]): Promise<void>;

  // Newspaper Edition operations (user-scoped)
  saveNewspaperEdition(userId: string, edition: NewspaperEdition): Promise<void>;
  getNewspaperEditions(userId: string, limit?: number): Promise<NewspaperEdition[]>;
  getNewspaperEdition(userId: string, editionId: string): Promise<NewspaperEdition | null>;

  // Daily Edition operations (user-scoped)
  saveDailyEdition(userId: string, dailyEdition: DailyEdition): Promise<void>;
  getDailyEditions(userId: string, limit?: number): Promise<DailyEdition[]>;
  getDailyEdition(userId: string, dailyEditionId: string): Promise<DailyEdition | null>;

  // Ad operations (user-scoped)
  saveAd(userId: string, ad: AdEntry): Promise<void>;
  getAllAds(userId: string): Promise<AdEntry[]>;
  getMostRecentAd(userId: string): Promise<AdEntry | null>;
  getAd(userId: string, adId: string): Promise<AdEntry | null>;
  updateAd(userId: string, adId: string, updates: Partial<Omit<AdEntry, 'id'>>): Promise<void>;
  deleteAd(userId: string, adId: string): Promise<void>;

  // User operations (global)
  createUser(user: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<User>;
  getUserById(userId: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUserLastLogin(userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  deleteUser(userId: string): Promise<void>;

  // Usage tracking operations (user-scoped)
  logUsage(userId: string, apiCalls: number, inputTokens: number, outputTokens: number, cost: number): Promise<void>;
  getUserUsageStats(userId: string): Promise<UserUsageStats>;
  getUserUsageHistory(userId: string, startTime: number, endTime: number): Promise<Array<{
    timestamp: number;
    apiCalls: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>>;

  // Job status operations (user-scoped)
  setJobRunning(userId: string, jobName: string, running: boolean): Promise<void>;
  getJobRunning(userId: string, jobName: string): Promise<boolean>;
  setJobLastRun(userId: string, jobName: string, timestamp: number): Promise<void>;
  getJobLastRun(userId: string, jobName: string): Promise<number | null>;
  setJobLastSuccess(userId: string, jobName: string, timestamp: number): Promise<void>;
  getJobLastSuccess(userId: string, jobName: string): Promise<number | null>;

  // KPI operations (user-scoped)
  getKpiValue(userId: string, kpiName: string): Promise<number>;
  setKpiValue(userId: string, kpiName: string, value: number): Promise<void>;
  incrementKpiValue(userId: string, kpiName: string, increment: number): Promise<void>;

  // Utility methods
  getModelName(): Promise<string | null>;
  generateId(prefix: string): Promise<string>;
  clearAllData(): Promise<void>;

  // Migration utilities
  migrateLegacyDataToUser(defaultUserId: string): Promise<void>;
}