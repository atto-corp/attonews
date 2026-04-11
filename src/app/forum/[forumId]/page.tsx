"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import ContentCard from "@/components/ContentCard";
import PageHeader from "@/components/PageHeader";

interface Thread {
  id: number;
  title: string;
  replyCount: number;
  lastReplyTime: number;
  author: string;
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const forumTitles: Record<string, string> = {
  announcements: "Announcements",
  general: "General",
  suggestions: "Suggestions",
  content: "Content",
  sources: "Sources",
  methods: "Methods",
  history: "History",
  prehistory: "Prehistory",
  speculation: "Speculation",
  music: "Music",
  "movies-tv": "Movies & TV",
  technology: "Technology",
  politics: "Politics",
  "the-internet": "The Internet"
};

export default function ForumViewPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasReader, setHasReader] = useState(false);
  const router = useRouter();
  const params = useParams();
  const forumId = params.forumId as string;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchThreads();
    checkReaderPermission();
  }, [router, forumId]);

  const checkReaderPermission = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const response = await fetch("/api/abilities/reader", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHasReader(data.hasReader);
      }
    } catch (err) {
      console.error("Failed to check reader permission", err);
    }
  };

  const fetchThreads = async () => {
    try {
      const response = await fetch(`/api/forum/${forumId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch threads");
      }
      const data = await response.json();
      setThreads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load threads");
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
          <p className="mt-4 text-white/80">Loading threads...</p>
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
            Error Loading Threads
          </h2>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  const forumTitle = forumTitles[forumId] || forumId;

  return (
    <PageContainer>
      <ContentCard className="p-8 mb-8">
        <PageHeader
          title={forumTitle}
          description={`${threads.length} threads`}
        >
          <Link
            href="/forum"
            className="relative px-6 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl font-medium text-white/90 hover:bg-white/20 transition-all duration-300"
          >
            ← Back to Forum
          </Link>
          {hasReader && (
            <Link
              href={`/forum/${forumId}/new`}
              className="relative px-6 py-3 backdrop-blur-sm bg-blue-500/30 border border-blue-400/40 rounded-xl font-medium text-white/90 hover:bg-blue-500/50 transition-all duration-300"
            >
              + New Thread
            </Link>
          )}
          {hasReader && (
            <Link
              href={`/forum/${forumId}/act-as`}
              className="relative px-6 py-3 backdrop-blur-sm bg-purple-500/30 border border-purple-400/40 rounded-xl font-medium text-white/90 hover:bg-purple-500/50 transition-all duration-300"
            >
              Act as forum user
            </Link>
          )}
        </PageHeader>
      </ContentCard>

      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        <div className="divide-y divide-white/10">
          {threads.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/70">No threads yet</p>
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                className="p-6 hover:bg-white/5 transition-colors duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/thread/${thread.id}`}
                      className="text-lg font-semibold text-white/90 hover:text-white transition-colors"
                    >
                      {thread.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                      <span>by {thread.author}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <span>{thread.replyCount} replies</span>
                      <span className="text-white/50">
                        {formatTime(thread.lastReplyTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
}
