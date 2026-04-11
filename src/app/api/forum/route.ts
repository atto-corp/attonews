import { NextRequest, NextResponse } from "next/server";

interface Forum {
  id: string;
  title: string;
  description: string;
  threadCount: number;
  postCount: number;
  latestThread: {
    id: number;
    title: string;
    replyCount: number;
    lastReplyTime: number;
  } | null;
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
          lastReplyTime: Date.now() - 1800000
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
          lastReplyTime: Date.now() - 3600000
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
          lastReplyTime: Date.now() - 7200000
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
          lastReplyTime: Date.now() - 900000
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
          lastReplyTime: Date.now() - 5400000
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
          lastReplyTime: Date.now() - 2700000
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
          lastReplyTime: Date.now() - 10800000
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
          lastReplyTime: Date.now() - 86400000
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
          lastReplyTime: Date.now() - 1800000
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
          lastReplyTime: Date.now() - 600000
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
          lastReplyTime: Date.now() - 7200000
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
          lastReplyTime: Date.now() - 1800000
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
          lastReplyTime: Date.now() - 14400000
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
          lastReplyTime: Date.now() - 3600000
        }
      }
    ]
  }
];

export const GET = async (_request: NextRequest) => {
  return NextResponse.json(mockSections);
};
