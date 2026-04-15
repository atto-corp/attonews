"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import ContentCard from "@/components/ContentCard";
import PageHeader from "@/components/PageHeader";

interface ReplyOption {
  threadId: number;
  threadTitle: string;
  replies: string[];
  persona: string;
}

export default function ActAsPage() {
  const [personas, setPersonas] = useState<string[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [replyOptions, setReplyOptions] = useState<ReplyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const forumId = params.forumId as string;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchPersonas();
  }, [router, forumId]);

  const fetchPersonas = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("/api/personas", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch personas");
      const data = await res.json();
      // Combine classic and dynamic personas for display
      const allPersonas = [
        ...Object.keys(data.classic || {}),
        ...(Array.isArray(data.dynamic)
          ? data.dynamic.map((p: any) => p.display)
          : [])
      ];
      setPersonas(allPersonas);
      if (allPersonas.length > 0) {
        setSelectedPersona(allPersonas[0]);
        fetchReplyOptions(allPersonas[0]);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load personas");
      setLoading(false);
    }
  };

  const fetchReplyOptions = async (personaKey: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `/api/forum/${forumId}/act-as?persona=${encodeURIComponent(personaKey)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate replies");
      }
      const data = await res.json();
      const formatted = data.threadTitles.map((title: string, i: number) => ({
        threadId: data.threadIds ? data.threadIds[i] : i,
        threadTitle: title,
        replies: data.replies[i] || [],
        persona: personaKey
      }));
      setReplyOptions(formatted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate reply options"
      );
      setReplyOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async (threadId: number, replyText: string) => {
    if (!selectedPersona || !replyText) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`/api/forum/${forumId}/act-as`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          persona: selectedPersona,
          replyText,
          threadIndex: replyOptions.findIndex((r) => r.threadId === threadId)
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to post reply");
      }
      setSuccess("Reply posted successfully!");
      // Refresh options
      setTimeout(() => fetchReplyOptions(selectedPersona), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && personas.length === 0) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentCard className="p-8 mb-8">
        <PageHeader
          title="Act as Forum User"
          description="Generate authentic replies as different forum personas"
        >
          <Link
            href={`/forum/${forumId}`}
            className="relative px-6 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl font-medium text-white/90 hover:bg-white/20 transition-all duration-300"
          >
            ← Back to Forum
          </Link>
        </PageHeader>
      </ContentCard>

      <ContentCard className="p-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <label className="text-white/80 font-medium">Select Persona:</label>
          <select
            value={selectedPersona}
            onChange={(e) => {
              setSelectedPersona(e.target.value);
              fetchReplyOptions(e.target.value);
            }}
            className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-purple-400"
          >
            {personas.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchReplyOptions(selectedPersona)}
            disabled={loading}
            className="px-5 py-2 bg-purple-500/30 border border-purple-400/40 hover:bg-purple-500/50 text-white rounded-xl transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </ContentCard>

      {error && (
        <ContentCard className="mt-6 p-4 bg-red-500/20 border border-red-500/30">
          <p className="text-red-200">{error}</p>
        </ContentCard>
      )}

      {success && (
        <ContentCard className="mt-6 p-4 bg-green-500/20 border border-green-500/30">
          <p className="text-green-200">{success}</p>
        </ContentCard>
      )}

      {replyOptions.length === 0 && !loading && !error ? (
        <ContentCard className="p-8">
          <p className="text-center text-white/70">
            No threads available in this forum to generate replies for.
          </p>
        </ContentCard>
      ) : (
        <div className="space-y-8">
          {replyOptions.map((option, idx) => (
            <ContentCard key={idx} className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">
                  {option.threadTitle}
                </h3>
                <span className="text-purple-300 text-sm font-medium">
                  {option.persona}
                </span>
              </div>

              <div className="space-y-4">
                {option.replies.map((reply, rIdx) => (
                  <div
                    key={rIdx}
                    className="group bg-white/5 border border-white/10 rounded-xl p-5 hover:border-purple-400/40 transition-all"
                  >
                    <div className="text-white/90 text-[15px] leading-relaxed mb-4">
                      {reply}
                    </div>
                    <button
                      onClick={() => handlePostReply(option.threadId, reply)}
                      disabled={submitting}
                      className="text-xs px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/50 text-white font-medium rounded-xl transition-all flex items-center gap-2"
                    >
                      {submitting ? "Posting..." : "Post as " + option.persona}
                    </button>
                  </div>
                ))}
              </div>
            </ContentCard>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
