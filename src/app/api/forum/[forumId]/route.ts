import { NextRequest, NextResponse } from "next/server";

interface Thread {
  id: number;
  title: string;
  replyCount: number;
  lastReplyTime: number;
  author: string;
}

const mockThreads: Record<string, Thread[]> = {
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

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ forumId: string }> }
) => {
  const { forumId } = await params;
  const threads = mockThreads[forumId] || [];
  return NextResponse.json(threads);
};
