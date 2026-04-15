"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import ContentCard from "@/components/ContentCard";
import PageHeader from "@/components/PageHeader";
import { apiService } from "@/app/services/api.service";

interface ReplyOption {
  threadId: number;
  threadTitle: string;
  replies: string[];
  personaDisplay: string;
}

export interface PersonaInfo {
  key: string;
  display: string;
  description: string;
  color?: string;
}

export default function ActAsPage() {
  const [personas, setPersonas] = useState<PersonaInfo[]>([]);
  const [selectedPersonaKey, setSelectedPersonaKey] = useState<string>("");
  const [currentPersonaDisplay, setCurrentPersonaDisplay] =
    useState<string>("");
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
      const data = await apiService.get<{
        classic: Record<string, any>;
        dynamic: any[];
      }>("/api/personas");
      const classicPersonas = Object.entries(data.classic || {}).map(
        ([key, val]: [string, any]) => ({
          key,
          display: val.display || key,
          description: val.description || "",
          color: val.color
        })
      ) as PersonaInfo[];

      const dynamicPersonas = (data.dynamic || []).map((p: any) => ({
        key: p.display,
        display: p.display,
        description: p.description || "",
        color: p.color
      })) as PersonaInfo[];

      const allPersonas = [...classicPersonas, ...dynamicPersonas];
      setPersonas(allPersonas);
      if (allPersonas.length > 0) {
        const firstKey = allPersonas[0].key;
        setSelectedPersonaKey(firstKey);
        setCurrentPersonaDisplay(allPersonas[0].display);
        fetchReplyOptions(firstKey);
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
      const data = await apiService.get<{
        threadTitles: string[];
        threadIds?: number[];
        replies: string[][];
      }>(
        `/api/forum/${forumId}/act-as?persona=${encodeURIComponent(personaKey)}`
      );
      const personaInfo = personas.find(
        (p: PersonaInfo) => p.key === personaKey
      );
      const display = personaInfo?.display || personaKey;
      setCurrentPersonaDisplay(display);
      const formatted = data.threadTitles.map((title: string, i: number) => ({
        threadId: data.threadIds ? data.threadIds[i] : i,
        threadTitle: title,
        replies: data.replies[i] || [],
        personaDisplay: display
      }));
      setReplyOptions(formatted);
    } catch (err: any) {
      setError(err.message || "Failed to generate reply options");
      setReplyOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async (threadId: number, replyText: string) => {
    if (!selectedPersonaKey || !replyText) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await apiService.post<{ threadId: number }>(
        `/api/forum/${forumId}/act-as`,
        {
          persona: selectedPersonaKey,
          replyText,
          threadIndex: replyOptions.findIndex((r) => r.threadId === threadId)
        }
      );
      setSuccess("Reply posted successfully!");
      // Redirect to thread
      setTimeout(() => router.push(`/thread/${data.threadId}`), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to post reply");
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
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-white/80 font-medium">Select Persona:</label>
            <button
              onClick={() => fetchReplyOptions(selectedPersonaKey)}
              disabled={loading || !selectedPersonaKey}
              className="px-6 py-2 bg-purple-500/30 border border-purple-400/40 hover:bg-purple-500/50 text-white rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              ↻ Refresh
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-white/5 border border-white/20 rounded-2xl max-h-72 overflow-y-auto">
            {personas.map((persona) => (
              <button
                key={persona.key}
                onClick={() => {
                  setSelectedPersonaKey(persona.key);
                  fetchReplyOptions(persona.key);
                }}
                className={`p-3 rounded-xl border border-white/10 text-left transition-all duration-200 hover:border-purple-400/50 hover:shadow-lg hover:scale-[1.02]
                  ${
                    selectedPersonaKey === persona.key
                      ? `bg-gradient-to-br ${persona.color || "from-purple-500 to-indigo-600"} ring-2 ring-white/50 shadow-xl`
                      : "bg-white/10 hover:bg-white/20"
                  }`}
              >
                <div className="font-bold text-lg leading-tight mb-1">
                  {persona.display}
                </div>
                <div className="text-xs text-white/70 leading-tight line-clamp-2">
                  {persona.description}
                </div>
              </button>
            ))}
          </div>
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
                <Link
                  href={`/thread/${option.threadId}`}
                  className="text-xl font-semibold text-white hover:text-white/90 transition-colors"
                >
                  {option.threadTitle}
                </Link>
                <span className="text-purple-300 text-sm font-medium">
                  {option.personaDisplay}
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
                      {submitting
                        ? "Posting..."
                        : "Post as " + option.personaDisplay}
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
