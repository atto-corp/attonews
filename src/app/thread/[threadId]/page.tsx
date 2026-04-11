"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import ContentCard from "@/components/ContentCard";
import PageHeader from "@/components/PageHeader";

interface Post {
  id: number;
  content: string;
  author: string;
  createdAt: number;
}

const threadTitles: Record<string, string> = {
  "101": "Welcome to Atto Newsroom",
  "102": "System maintenance scheduled",
  "103": "New feature: Daily edition emails",
  "104": "Version 2.0 release notes",
  "105": "Community guidelines update",
  "115": "What's everyone working on this week?",
  "116": "Introductions thread",
  "117": "Best practices for using Atto",
  "118": "Questions about the pipeline",
  "119": "Show off your setup",
  "125": "Add support for more social media sources",
  "126": "Dark mode for the web interface",
  "127": "Export articles to PDF",
  "128": "Improved search functionality",
  "129": "Email notifications for new editions",
  "201": "Best headlines generated this week",
  "202": "How to improve article quality",
  "203": "Favorite beats to cover",
  "204": "Article length preferences",
  "205": "Tone and style discussions",
  "218": "Bluesky integration working great",
  "219": "Which social platforms do you use?",
  "220": "Data quality tips",
  "221": "Source reliability discussion",
  "235": "Optimizing reporter prompts for better coverage",
  "236": "Temperature and creativity settings",
  "237": "Using few-shot examples effectively",
  "238": "Chain of thought prompting tips",
  "239": "Role-playing in prompts",
  "301": "Events from last month - retrospective",
  "302": "Archive: First week of Atto",
  "303": "Evolution of the editor selection",
  "304": "Milestones and achievements",
  "315": "Archive: First articles ever generated",
  "316": "Early beta feedback",
  "317": "Original concept sketches",
  "325": "Where is the AI news industry heading?",
  "326": "Predictions for next year",
  "327": "What beats will AI cover next?",
  "401": "What are you listening to while coding?",
  "402": "Lo-fi beats for productivity",
  "403": "Album of the month discussion",
  "404": "Synthwave recommendations",
  "415": "Best documentaries about AI",
  "416": "Sci-fi movies with realistic AI",
  "417": "TV shows about journalism",
  "418": "Must-watch for developers",
  "430": "New AI tools everyone should know about",
  "431": "Hardware setups for AI work",
  "432": "Open source vs proprietary",
  "433": "Programming languages in 2024",
  "445": "AI's role in political journalism",
  "446": "Bias in automated news",
  "447": "Fact-checking automation",
  "460": "Internet culture trends this month",
  "461": "Memes that explain programming",
  "462": "Best tech YouTube channels",
  "463": "Subreddits worth following"
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function ThreadViewPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const threadId = params.threadId as string;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchPosts();
  }, [router, threadId]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/thread/${threadId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 via-gray-500/20 to-gray-400/20 animate-pulse duration-3000"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-gray-400/30 to-gray-500/30 rounded-full blur-3xl duration-3000"></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-gray-500/30 to-gray-400/30 rounded-full blur-3xl duration-3000"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">Loading posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 flex items-center justify-center relative overflow-hidden">
        <div className="text-center">
          <div className="w-16 h-16 backdrop-blur-xl bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white/90 mb-2">
            Error Loading Posts
          </h2>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  const threadTitle = threadTitles[threadId] || `Thread #${threadId}`;

  return (
    <PageContainer>
      <ContentCard className="p-8 mb-8">
        <PageHeader title={threadTitle} description={`${posts.length} posts`}>
          <Link
            href="/forum"
            className="relative px-6 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl font-medium text-white/90 hover:bg-white/20 transition-all duration-300"
          >
            ← Back to Forum
          </Link>
        </PageHeader>
      </ContentCard>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center shadow-2xl">
            <p className="text-white/70">No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    {post.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white/90">
                    {post.author}
                  </span>
                </div>
                <span className="text-xs text-white/50">
                  {formatDate(post.createdAt)}
                </span>
              </div>
              <div className="text-white/80 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </div>
            </div>
          ))
        )}
      </div>
    </PageContainer>
  );
}
