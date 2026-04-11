#!/usr/bin/env node

import { createClient, RedisClientType } from "redis";

interface ForumPost {
  id: number;
  content: string;
  author: string;
  createdAt: number;
}

interface ForumThread {
  id: number;
  title: string;
  replyCount: number;
  lastReplyTime: number;
  author: string;
}

interface Forum {
  id: string;
  title: string;
  description: string;
  threadCount: number;
  postCount: number;
  latestThread: ForumThread | null;
}

interface Section {
  id: string;
  title: string;
  forums: Forum[];
}

const mockSections: Section[] = [
  {
    id: "atto",
    title: "Atto",
    forums: [
      {
        id: "announcements",
        title: "Announcements",
        description: "Official news and updates about Atto",
        threadCount: 8,
        postCount: 45,
        latestThread: {
          id: 101,
          title: "Welcome to Atto Newsroom",
          replyCount: 12,
          lastReplyTime: Date.now() - 1800000,
          author: "admin"
        }
      },
      {
        id: "general",
        title: "General",
        description: "General discussion about Atto",
        threadCount: 15,
        postCount: 89,
        latestThread: {
          id: 115,
          title: "What's everyone working on this week?",
          replyCount: 8,
          lastReplyTime: Date.now() - 3600000,
          author: "user1"
        }
      },
      {
        id: "suggestions",
        title: "Suggestions",
        description: "Feature requests and ideas",
        threadCount: 12,
        postCount: 67,
        latestThread: {
          id: 125,
          title: "Add support for more social media sources",
          replyCount: 5,
          lastReplyTime: Date.now() - 7200000,
          author: "featurefan"
        }
      }
    ]
  },
  {
    id: "news",
    title: "News",
    forums: [
      {
        id: "content",
        title: "Content",
        description: "Discussion about generated articles and content",
        threadCount: 22,
        postCount: 156,
        latestThread: {
          id: 201,
          title: "Best headlines generated this week",
          replyCount: 14,
          lastReplyTime: Date.now() - 900000,
          author: "editor"
        }
      },
      {
        id: "sources",
        title: "Sources",
        description: "Social media sources and data collection",
        threadCount: 18,
        postCount: 94,
        latestThread: {
          id: 218,
          title: "Bluesky integration working great",
          replyCount: 7,
          lastReplyTime: Date.now() - 5400000,
          author: "integrator"
        }
      },
      {
        id: "methods",
        title: "Methods",
        description: "AI methods and prompt engineering",
        threadCount: 25,
        postCount: 178,
        latestThread: {
          id: 235,
          title: "Optimizing reporter prompts for better coverage",
          replyCount: 19,
          lastReplyTime: Date.now() - 2700000,
          author: "promptmaster"
        }
      }
    ]
  },
  {
    id: "olds",
    title: "Olds",
    forums: [
      {
        id: "history",
        title: "History",
        description: "Historical events and retrospective analysis",
        threadCount: 30,
        postCount: 245,
        latestThread: {
          id: 301,
          title: "Events from last month - retrospective",
          replyCount: 11,
          lastReplyTime: Date.now() - 10800000,
          author: "historian"
        }
      },
      {
        id: "prehistory",
        title: "Prehistory",
        description: "Very old events and archival discussions",
        threadCount: 18,
        postCount: 112,
        latestThread: {
          id: 315,
          title: "Archive: First articles ever generated",
          replyCount: 6,
          lastReplyTime: Date.now() - 86400000,
          author: "archivist"
        }
      },
      {
        id: "speculation",
        title: "Speculation",
        description: "Future predictions and speculation",
        threadCount: 14,
        postCount: 89,
        latestThread: {
          id: 325,
          title: "Where is the AI news industry heading?",
          replyCount: 22,
          lastReplyTime: Date.now() - 1800000,
          author: "futurist"
        }
      }
    ]
  },
  {
    id: "etc",
    title: "Etc",
    forums: [
      {
        id: "music",
        title: "Music",
        description: "Music discussions and recommendations",
        threadCount: 45,
        postCount: 312,
        latestThread: {
          id: 401,
          title: "What are you listening to while coding?",
          replyCount: 28,
          lastReplyTime: Date.now() - 600000,
          author: "coder1"
        }
      },
      {
        id: "movies-tv",
        title: "Movies & TV",
        description: "Film and television discussions",
        threadCount: 38,
        postCount: 267,
        latestThread: {
          id: 415,
          title: "Best documentaries about AI",
          replyCount: 15,
          lastReplyTime: Date.now() - 7200000,
          author: "filmmaker"
        }
      },
      {
        id: "technology",
        title: "Technology",
        description: "General tech talk",
        threadCount: 52,
        postCount: 389,
        latestThread: {
          id: 430,
          title: "New AI tools everyone should know about",
          replyCount: 31,
          lastReplyTime: Date.now() - 1800000,
          author: "earlyadopter"
        }
      },
      {
        id: "politics",
        title: "Politics",
        description: "Political discussions",
        threadCount: 28,
        postCount: 198,
        latestThread: {
          id: 445,
          title: "AI's role in political journalism",
          replyCount: 18,
          lastReplyTime: Date.now() - 14400000,
          author: "journalist"
        }
      },
      {
        id: "the-internet",
        title: "The Internet",
        description: "Web culture, memes, and online communities",
        threadCount: 42,
        postCount: 356,
        latestThread: {
          id: 460,
          title: "Internet culture trends this month",
          replyCount: 24,
          lastReplyTime: Date.now() - 3600000,
          author: "trendspotter"
        }
      }
    ]
  }
];

const mockThreads: Record<string, ForumThread[]> = {
  announcements: [
    {
      id: 101,
      title: "Welcome to Atto Newsroom",
      replyCount: 12,
      lastReplyTime: Date.now() - 1800000,
      author: "admin"
    },
    {
      id: 102,
      title: "System maintenance scheduled",
      replyCount: 3,
      lastReplyTime: Date.now() - 86400000,
      author: "system"
    },
    {
      id: 103,
      title: "New feature: Daily edition emails",
      replyCount: 8,
      lastReplyTime: Date.now() - 172800000,
      author: "admin"
    },
    {
      id: 104,
      title: "Version 2.0 release notes",
      replyCount: 15,
      lastReplyTime: Date.now() - 259200000,
      author: "dev"
    },
    {
      id: 105,
      title: "Community guidelines update",
      replyCount: 5,
      lastReplyTime: Date.now() - 345600000,
      author: "moderator"
    }
  ],
  general: [
    {
      id: 115,
      title: "What's everyone working on this week?",
      replyCount: 8,
      lastReplyTime: Date.now() - 3600000,
      author: "user1"
    },
    {
      id: 116,
      title: "Introductions thread",
      replyCount: 22,
      lastReplyTime: Date.now() - 7200000,
      author: "newuser"
    },
    {
      id: 117,
      title: "Best practices for using Atto",
      replyCount: 11,
      lastReplyTime: Date.now() - 14400000,
      author: "expert"
    },
    {
      id: 118,
      title: "Questions about the pipeline",
      replyCount: 6,
      lastReplyTime: Date.now() - 21600000,
      author: "curious"
    },
    {
      id: 119,
      title: "Show off your setup",
      replyCount: 14,
      lastReplyTime: Date.now() - 43200000,
      author: "enthusiast"
    }
  ],
  suggestions: [
    {
      id: 125,
      title: "Add support for more social media sources",
      replyCount: 5,
      lastReplyTime: Date.now() - 7200000,
      author: "featurefan"
    },
    {
      id: 126,
      title: "Dark mode for the web interface",
      replyCount: 18,
      lastReplyTime: Date.now() - 10800000,
      author: "designer"
    },
    {
      id: 127,
      title: "Export articles to PDF",
      replyCount: 9,
      lastReplyTime: Date.now() - 18000000,
      author: "user2"
    },
    {
      id: 128,
      title: "Improved search functionality",
      replyCount: 7,
      lastReplyTime: Date.now() - 25200000,
      author: "poweruser"
    },
    {
      id: 129,
      title: "Email notifications for new editions",
      replyCount: 12,
      lastReplyTime: Date.now() - 32400000,
      author: "user3"
    }
  ],
  content: [
    {
      id: 201,
      title: "Best headlines generated this week",
      replyCount: 14,
      lastReplyTime: Date.now() - 900000,
      author: "editor"
    },
    {
      id: 202,
      title: "How to improve article quality",
      replyCount: 19,
      lastReplyTime: Date.now() - 5400000,
      author: "writer"
    },
    {
      id: 203,
      title: "Favorite beats to cover",
      replyCount: 11,
      lastReplyTime: Date.now() - 10800000,
      author: "reporter1"
    },
    {
      id: 204,
      title: "Article length preferences",
      replyCount: 8,
      lastReplyTime: Date.now() - 18000000,
      author: "user4"
    },
    {
      id: 205,
      title: "Tone and style discussions",
      replyCount: 16,
      lastReplyTime: Date.now() - 25200000,
      author: "styleguide"
    }
  ],
  sources: [
    {
      id: 218,
      title: "Bluesky integration working great",
      replyCount: 7,
      lastReplyTime: Date.now() - 5400000,
      author: "integrator"
    },
    {
      id: 219,
      title: "Which social platforms do you use?",
      replyCount: 13,
      lastReplyTime: Date.now() - 12600000,
      author: "researcher"
    },
    {
      id: 220,
      title: "Data quality tips",
      replyCount: 9,
      lastReplyTime: Date.now() - 19800000,
      author: "analyst"
    },
    {
      id: 221,
      title: "Source reliability discussion",
      replyCount: 21,
      lastReplyTime: Date.now() - 27000000,
      author: "skeptic"
    }
  ],
  methods: [
    {
      id: 235,
      title: "Optimizing reporter prompts for better coverage",
      replyCount: 19,
      lastReplyTime: Date.now() - 2700000,
      author: "promptmaster"
    },
    {
      id: 236,
      title: "Temperature and creativity settings",
      replyCount: 12,
      lastReplyTime: Date.now() - 9000000,
      author: "tuner"
    },
    {
      id: 237,
      title: "Using few-shot examples effectively",
      replyCount: 8,
      lastReplyTime: Date.now() - 16200000,
      author: "learner"
    },
    {
      id: 238,
      title: "Chain of thought prompting tips",
      replyCount: 14,
      lastReplyTime: Date.now() - 23400000,
      author: "thinker"
    },
    {
      id: 239,
      title: "Role-playing in prompts",
      replyCount: 16,
      lastReplyTime: Date.now() - 30600000,
      author: "actor"
    }
  ],
  history: [
    {
      id: 301,
      title: "Events from last month - retrospective",
      replyCount: 11,
      lastReplyTime: Date.now() - 10800000,
      author: "historian"
    },
    {
      id: 302,
      title: "Archive: First week of Atto",
      replyCount: 25,
      lastReplyTime: Date.now() - 21600000,
      author: "founder"
    },
    {
      id: 303,
      title: "Evolution of the editor selection",
      replyCount: 8,
      lastReplyTime: Date.now() - 32400000,
      author: "oldtimer"
    },
    {
      id: 304,
      title: "Milestones and achievements",
      replyCount: 17,
      lastReplyTime: Date.now() - 43200000,
      author: "achiever"
    }
  ],
  prehistory: [
    {
      id: 315,
      title: "Archive: First articles ever generated",
      replyCount: 6,
      lastReplyTime: Date.now() - 86400000,
      author: "archivist"
    },
    {
      id: 316,
      title: "Early beta feedback",
      replyCount: 32,
      lastReplyTime: Date.now() - 172800000,
      author: "betatester"
    },
    {
      id: 317,
      title: "Original concept sketches",
      replyCount: 14,
      lastReplyTime: Date.now() - 259200000,
      author: "visionary"
    }
  ],
  speculation: [
    {
      id: 325,
      title: "Where is the AI news industry heading?",
      replyCount: 22,
      lastReplyTime: Date.now() - 1800000,
      author: "futurist"
    },
    {
      id: 326,
      title: "Predictions for next year",
      replyCount: 18,
      lastReplyTime: Date.now() - 7200000,
      author: "oracle"
    },
    {
      id: 327,
      title: "What beats will AI cover next?",
      replyCount: 9,
      lastReplyTime: Date.now() - 14400000,
      author: "planner"
    }
  ],
  music: [
    {
      id: 401,
      title: "What are you listening to while coding?",
      replyCount: 28,
      lastReplyTime: Date.now() - 600000,
      author: "coder1"
    },
    {
      id: 402,
      title: "Lo-fi beats for productivity",
      replyCount: 15,
      lastReplyTime: Date.now() - 4800000,
      author: "musician"
    },
    {
      id: 403,
      title: "Album of the month discussion",
      replyCount: 21,
      lastReplyTime: Date.now() - 9600000,
      author: "listener"
    },
    {
      id: 404,
      title: "Synthwave recommendations",
      replyCount: 12,
      lastReplyTime: Date.now() - 16800000,
      author: "synthfan"
    }
  ],
  "movies-tv": [
    {
      id: 415,
      title: "Best documentaries about AI",
      replyCount: 15,
      lastReplyTime: Date.now() - 7200000,
      author: "filmmaker"
    },
    {
      id: 416,
      title: "Sci-fi movies with realistic AI",
      replyCount: 19,
      lastReplyTime: Date.now() - 14400000,
      author: "scifan"
    },
    {
      id: 417,
      title: "TV shows about journalism",
      replyCount: 8,
      lastReplyTime: Date.now() - 21600000,
      author: "viewer"
    },
    {
      id: 418,
      title: "Must-watch for developers",
      replyCount: 11,
      lastReplyTime: Date.now() - 36000000,
      author: "recommender"
    }
  ],
  technology: [
    {
      id: 430,
      title: "New AI tools everyone should know about",
      replyCount: 31,
      lastReplyTime: Date.now() - 1800000,
      author: "earlyadopter"
    },
    {
      id: 431,
      title: "Hardware setups for AI work",
      replyCount: 18,
      lastReplyTime: Date.now() - 5400000,
      author: "builder"
    },
    {
      id: 432,
      title: "Open source vs proprietary",
      replyCount: 24,
      lastReplyTime: Date.now() - 10800000,
      author: "debater"
    },
    {
      id: 433,
      title: "Programming languages in 2024",
      replyCount: 14,
      lastReplyTime: Date.now() - 18000000,
      author: "polyglot"
    }
  ],
  politics: [
    {
      id: 445,
      title: "AI's role in political journalism",
      replyCount: 18,
      lastReplyTime: Date.now() - 14400000,
      author: "journalist"
    },
    {
      id: 446,
      title: "Bias in automated news",
      replyCount: 27,
      lastReplyTime: Date.now() - 21600000,
      author: "researcher"
    },
    {
      id: 447,
      title: "Fact-checking automation",
      replyCount: 12,
      lastReplyTime: Date.now() - 36000000,
      author: "factchecker"
    }
  ],
  "the-internet": [
    {
      id: 460,
      title: "Internet culture trends this month",
      replyCount: 24,
      lastReplyTime: Date.now() - 3600000,
      author: "trendspotter"
    },
    {
      id: 461,
      title: "Memes that explain programming",
      replyCount: 19,
      lastReplyTime: Date.now() - 7200000,
      author: "humorist"
    },
    {
      id: 462,
      title: "Best tech YouTube channels",
      replyCount: 22,
      lastReplyTime: Date.now() - 12600000,
      author: "contentconsumer"
    },
    {
      id: 463,
      title: "Subreddits worth following",
      replyCount: 16,
      lastReplyTime: Date.now() - 19800000,
      author: "aggregator"
    }
  ]
};

const mockPosts: Record<number, ForumPost[]> = {
  101: [
    {
      id: 1,
      content:
        "Welcome to Atto Newsroom! This is the official announcement thread for our AI-powered journalism platform.",
      author: "admin",
      createdAt: Date.now() - 604800000
    },
    {
      id: 2,
      content:
        "So excited to be here! Can't wait to see what the AI reporters come up with.",
      author: "user1",
      createdAt: Date.now() - 518400000
    },
    {
      id: 3,
      content:
        "The editor selection seems really smart. Love how it curates the best stories.",
      author: "reader1",
      createdAt: Date.now() - 432000000
    },
    {
      id: 4,
      content:
        "How does the beat system work? Are reporters assigned specific topics?",
      author: "curious1",
      createdAt: Date.now() - 345600000
    },
    {
      id: 5,
      content:
        "Yes! Each reporter has specific beats they cover. Check the reporters page to see who's covering what.",
      author: "admin",
      createdAt: Date.now() - 259200000
    },
    {
      id: 6,
      content:
        "This is exactly what I wanted - automated journalism done right!",
      author: "fan1",
      createdAt: Date.now() - 172800000
    },
    {
      id: 7,
      content: "The daily edition is fantastic. Love the editorial selection.",
      author: "reader2",
      createdAt: Date.now() - 86400000
    },
    {
      id: 8,
      content: "Just subscribed to the newsletter. Great stuff!",
      author: "subscriber1",
      createdAt: Date.now() - 43200000
    },
    {
      id: 9,
      content: "Can't wait for more features. This is just the beginning!",
      author: "optimist1",
      createdAt: Date.now() - 21600000
    },
    {
      id: 10,
      content: "The article quality keeps improving. Great work team!",
      author: "fan2",
      createdAt: Date.now() - 10800000
    },
    {
      id: 11,
      content: "Is there a way to suggest new beats for reporters?",
      author: "suggestion1",
      createdAt: Date.now() - 5400000
    },
    {
      id: 12,
      content:
        "Yes! Use the suggestions forum. The team reviews them regularly.",
      author: "admin",
      createdAt: Date.now() - 1800000
    }
  ]
};

function getKey(key: string): string {
  return key;
}

const REDIS_KEYS = {
  FORUM_SECTIONS: "forum:sections",
  FORUM_THREADS: (forumId: string) => `forum:${forumId}:threads`,
  FORUM_POSTS: (threadId: number) => `forum:thread:${threadId}:posts`,
  FORUM_THREAD: (threadId: number) => `forum:thread:${threadId}`,
  FORUM_POST: (threadId: number, postId: number) =>
    `forum:thread:${threadId}:post:${postId}`,
  FORUM_COUNTER: (forumId: string) => `forum:${forumId}:counter`,
  FORUM_NEXT_THREAD_ID: "forum:next_thread_id",
  FORUM_NEXT_POST_ID: "forum:next_post_id"
};

async function seedForumData() {
  const client = createClient({
    url: "redis://localhost:6379"
  });

  await client.connect();
  console.log("Connected to Redis");

  let maxThreadId = 0;
  let maxPostId = 0;

  const multi = client.multi();

  console.log("Seeding forum sections...");
  multi.set(REDIS_KEYS.FORUM_SECTIONS, JSON.stringify(mockSections));

  console.log("Seeding forum counters and threads...");
  for (const section of mockSections) {
    for (const forum of section.forums) {
      multi.hSet(REDIS_KEYS.FORUM_COUNTER(forum.id), {
        threadCount: forum.threadCount.toString(),
        postCount: forum.postCount.toString()
      });

      const threads = mockThreads[forum.id] || [];
      for (const thread of threads) {
        maxThreadId = Math.max(maxThreadId, thread.id);
        multi.zAdd(REDIS_KEYS.FORUM_THREADS(forum.id), {
          score: thread.lastReplyTime,
          value: thread.id.toString()
        });

        multi.hSet(REDIS_KEYS.FORUM_THREAD(thread.id), {
          title: thread.title,
          forumId: forum.id,
          author: thread.author,
          createdAt: thread.lastReplyTime.toString(),
          replyCount: thread.replyCount.toString(),
          lastReplyTime: thread.lastReplyTime.toString()
        });
      }
    }
  }

  console.log("Seeding posts...");
  for (const [threadIdStr, posts] of Object.entries(mockPosts)) {
    const threadId = parseInt(threadIdStr);
    maxPostId = Math.max(maxPostId, ...posts.map((p) => p.id));

    for (const post of posts) {
      multi.zAdd(REDIS_KEYS.FORUM_POSTS(threadId), {
        score: post.createdAt,
        value: post.id.toString()
      });

      multi.set(
        REDIS_KEYS.FORUM_POST(threadId, post.id),
        JSON.stringify({
          id: post.id,
          content: post.content,
          author: post.author,
          createdAt: post.createdAt
        })
      );
    }
  }

  multi.set(REDIS_KEYS.FORUM_NEXT_THREAD_ID, (maxThreadId + 1).toString());
  multi.set(REDIS_KEYS.FORUM_NEXT_POST_ID, (maxPostId + 1).toString());

  await multi.exec();
  console.log("Forum data seeded successfully!");
  console.log(`Max thread ID: ${maxThreadId}, Max post ID: ${maxPostId}`);

  await client.disconnect();
}

seedForumData().catch(console.error);
