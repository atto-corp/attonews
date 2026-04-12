"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import ContentCard from "@/components/ContentCard";
import PageHeader from "@/components/PageHeader";

type Persona =
  | "us_china_hawk"
  | "loafy"
  | "awoken"
  | "american_business"
  | "european_business"
  | "silicon_sage"
  | "geo_hawk"
  | "space_visionary"
  | "ai_doomsayer";

const personas: Record<
  Persona,
  { title: string; description: string; color: string }
> = {
  us_china_hawk: {
    title: "US-China Hawk",
    description: "Realist tracking CCP threats & decoupling",
    color: "from-orange-500 to-red-600"
  },
  loafy: {
    title: "Loafy",
    description: "A casual, laid-back user with little commitment",
    color: "from-amber-500 to-orange-600"
  },
  awoken: {
    title: "Awoken",
    description: "A user with strong convictions ready to share",
    color: "from-purple-500 to-indigo-600"
  },
  american_business: {
    title: "New Money",
    description: "Pro-disruption, competition-focused entrepreneur",
    color: "from-blue-500 to-cyan-600"
  },
  european_business: {
    title: "Old Money",
    description: "Pro-stability, continuity-focused traditionalist",
    color: "from-slate-600 to-slate-800"
  },
  silicon_sage: {
    title: "Silicon Sage",
    description: "Superintelligent AI predicting tech/AI/space convergence",
    color: "from-emerald-500 to-teal-600"
  },
  geo_hawk: {
    title: "Geo Hawk",
    description: "Hardened strategist on geopolitics/security threats",
    color: "from-red-500 to-rose-600"
  },
  space_visionary: {
    title: "Space Scaler",
    description: "Visionary on space+AI scaling vs Earth limits",
    color: "from-indigo-500 to-violet-600"
  },
  ai_doomsayer: {
    title: "AI Doomsayer",
    description: "Forecaster warning of AI existential risks",
    color: "from-gray-900 to-slate-900"
  }
};

export default function ActAsPage() {
  const [step, setStep] = useState<"persona" | "reply">("persona");
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [replyOptions, setReplyOptions] = useState<string[][]>([]);
  const [threadIds, setThreadIds] = useState<number[]>([]);
  const [threadTitles, setThreadTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasReader, setHasReader] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const handlePersonaSelect = async (persona: Persona) => {
    setSelectedPersona(persona);
    setLoading(true);
    setStep("reply");
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `/api/forum/${forumId}/act-as?persona=${persona}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate reply options");
      }

      const data = await response.json();
      setReplyOptions(data.replies || []);
      setThreadIds(data.threadIds || []);
      setThreadTitles(data.threadTitles || []);
      setStep("reply");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate reply options"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReplySelect = async (replyText: string, threadIndex: number) => {
    if (!selectedPersona) return;

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/forum/${forumId}/act-as`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          persona: selectedPersona,
          replyText,
          threadIndex
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create post");
      }

      router.push(`/forum/${forumId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === "reply") {
      setStep("persona");
      setSelectedPersona(null);
      setReplyOptions([]);
      setThreadIds([]);
      setThreadTitles([]);
    }
  };

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

  if (!hasReader) {
    return (
      <PageContainer>
        <ContentCard className="p-8">
          <h2 className="text-xl font-semibold text-white/90 mb-2">
            Permission Required
          </h2>
          <p className="text-white/70 mb-4">
            You need reader permission to act as a forum user.
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

  return (
    <PageContainer>
      <ContentCard className="p-8 mb-8">
        <PageHeader
          title={step === "persona" ? "Act as Forum User" : "Choose a Reply"}
          description={forumTitle}
        >
          <button
            onClick={
              step === "reply"
                ? handleBack
                : () => router.push(`/forum/${forumId}`)
            }
            className="relative px-6 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl font-medium text-white/90 hover:bg-white/20 transition-all duration-300"
          >
            ← Back to Forum
          </button>
        </PageHeader>
      </ContentCard>

      {step === "persona" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(personas) as Persona[]).map((key) => {
            const persona = personas[key];
            return (
              <button
                key={key}
                onClick={() => handlePersonaSelect(key)}
                disabled={loading}
                className="group text-left"
              >
                <ContentCard
                  className={`p-8 h-full bg-gradient-to-br ${persona.color} border-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {persona.title}
                    </h3>
                    <p className="text-white/80">{persona.description}</p>
                  </div>
                </ContentCard>
              </button>
            );
          })}
        </div>
      )}

      {step === "reply" && loading && (
        <ContentCard className="p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-white/80">Generating reply options...</p>
          </div>
        </ContentCard>
      )}

      {step === "reply" && !loading && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <span
              className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${personas[selectedPersona!].color} text-white font-medium`}
            >
              Acting as: {personas[selectedPersona!].title}
            </span>
          </div>

          {replyOptions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 text-left text-white/50 text-sm font-medium w-16">
                      Reply Options
                    </th>
                    {threadTitles.map((title, idx) => (
                      <th
                        key={idx}
                        className="p-4 text-left text-white/80 text-sm font-semibold bg-white/5 border-b border-white/10"
                      >
                        <div className="max-w-xs truncate" title={title}>
                          {title}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[0, 1, 2].map((replyIndex) => (
                    <tr key={replyIndex}>
                      <td className="p-4 text-white/50 text-sm font-medium align-top">
                        Option {replyIndex + 1}
                      </td>
                      {replyOptions.map((threadReplies, threadIdx) => (
                        <td
                          key={threadIdx}
                          className="p-4 align-top border-b border-white/5"
                        >
                          <button
                            onClick={() =>
                              handleReplySelect(
                                threadReplies[replyIndex],
                                threadIdx
                              )
                            }
                            disabled={submitting}
                            className="w-full text-left group"
                          >
                            <ContentCard className="p-4 h-full border border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed">
                              <div className="text-white/90 whitespace-pre-wrap text-sm">
                                {threadReplies[replyIndex] ||
                                  "(No reply generated)"}
                              </div>
                              <div className="mt-2 text-xs text-white/50">
                                {threadReplies[replyIndex]?.length || 0} chars
                              </div>
                            </ContentCard>
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {replyOptions.length === 0 && (
            <ContentCard className="p-8">
              <p className="text-center text-white/70">
                No threads available in this forum to generate replies for.
              </p>
            </ContentCard>
          )}
        </div>
      )}

      {error && (
        <ContentCard className="mt-6 p-4 bg-red-500/20 border border-red-500/30">
          <p className="text-red-200">{error}</p>
        </ContentCard>
      )}
    </PageContainer>
  );
}
