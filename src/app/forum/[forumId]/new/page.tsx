"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import ContentCard from "@/components/ContentCard";
import PageHeader from "@/components/PageHeader";
import FormInput from "@/components/FormInput";

export default function NewThreadPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
    checkReaderPermission(token);
  }, [router]);

  const checkReaderPermission = async (token: string) => {
    try {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/forum/${forumId}/thread`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: subject, content: body })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create thread");
      }

      const data = await response.json();
      router.push(`/thread/${data.threadId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create thread");
      setSubmitting(false);
    }
  };

  if (!hasReader) {
    return (
      <PageContainer>
        <ContentCard className="p-8">
          <h2 className="text-xl font-semibold text-white/90 mb-2">
            Permission Required
          </h2>
          <p className="text-white/70 mb-4">
            You need reader permission to create a new thread.
          </p>
          <Link
            href={`/forum/${forumId}`}
            className="text-blue-400 hover:text-blue-300"
          >
            ← Back to Forum
          </Link>
        </ContentCard>
      </PageContainer>
    );
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

  const forumTitle = forumTitles[forumId] || forumId;

  return (
    <PageContainer>
      <ContentCard className="p-8 mb-8">
        <PageHeader title="New Thread" description={forumTitle}>
          <Link
            href={`/forum/${forumId}`}
            className="relative px-6 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl font-medium text-white/90 hover:bg-white/20 transition-all duration-300"
          >
            ← Back to Forum
          </Link>
        </PageHeader>
      </ContentCard>

      <form onSubmit={handleSubmit}>
        <ContentCard className="p-6">
          <div className="space-y-6">
            <FormInput
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter thread subject..."
              maxLength={200}
              required
            />
            <span className="text-xs text-white/50">
              {subject.length}/200 characters
            </span>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter thread content..."
                maxLength={4096}
                rows={8}
                required
                className="w-full bg-white/5 border border-white/20 rounded-xl p-4 text-white placeholder-white/50 focus:outline-none focus:border-white/40 resize-none"
              />
              <span className="text-xs text-white/50">
                {body.length}/4096 characters
              </span>
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !subject.trim() || !body.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                {submitting ? "Creating..." : "Create Thread"}
              </button>
            </div>
          </div>
        </ContentCard>
      </form>
    </PageContainer>
  );
}
