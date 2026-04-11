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
  forumId: string;
  author: string;
  createdAt: number;
  replyCount: number;
  lastReplyTime: number;
}

interface Post {
  id: number;
  content: string;
  author: string;
  createdAt: number;
}

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
  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPost, setNewPost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const threadId = params.threadId as string;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchThread();
  }, [router, threadId]);

  const fetchThread = async () => {
    try {
      const response = await fetch(`/api/thread/${threadId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch thread");
      }
      const data = await response.json();
      setThread(data.thread);
      setPosts(data.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load thread");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || newPost.length > 4096) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/thread/${threadId}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newPost,
          author: "user"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      setNewPost("");
      await fetchThread();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setSubmitting(false);
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
          <p className="mt-4 text-white/80">Loading thread...</p>
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
            Error Loading Thread
          </h2>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  const threadTitle = thread?.title || `Thread #${threadId}`;

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

      <form onSubmit={handleSubmitPost} className="mb-8">
        <ContentCard className="p-6">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Write a reply..."
            maxLength={4096}
            className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:border-white/40 resize-none"
            rows={4}
            disabled={submitting}
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-white/50">
              {newPost.length}/4096 characters
            </span>
            <button
              type="submit"
              disabled={submitting || !newPost.trim()}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              {submitting ? "Posting..." : "Post Reply"}
            </button>
          </div>
        </ContentCard>
      </form>

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
