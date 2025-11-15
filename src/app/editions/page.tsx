"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageContainer from "../../components/PageContainer";
import LoadingSpinner from "../../components/LoadingSpinner";
import ContentCard from "../../components/ContentCard";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";

interface Article {
  id: string;
  reporterId: string;
  headline: string;
  body: string;
  generationTime: number;
  prompt: string;
}

interface NewspaperEdition {
  id: string;
  stories: Article[];
  generationTime: number;
  prompt: string;
}

export default function EditionsPage() {
  const [editions, setEditions] = useState<NewspaperEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [appName, setAppName] = useState("Newsroom");

  // Fetch newspaper editions on component mount
  useEffect(() => {
    fetchEditions();
  }, []);

  // Load app configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/config");
        if (response.ok) {
          const config = await response.json();
          setAppName(config.app.name);
        }
      } catch (error) {
        console.error("Failed to load config:", error);
      }
    };
    loadConfig();
  }, []);

  const fetchEditions = async () => {
    try {
      const response = await fetch("/api/editions");
      if (response.ok) {
        const data = await response.json();
        setEditions(data);
      } else {
        setMessage("Failed to load newspaper editions");
      }
    } catch (error) {
      setMessage("Error loading newspaper editions");
      console.error("Error fetching newspaper editions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <PageContainer maxWidth="max-w-7xl">
      <ContentCard className="p-8 mb-8">
        <PageHeader
          title="All Newspaper Editions"
          description="Browse and view all available newspaper editions"
        >
          <Link
            href="/"
            className="relative px-6 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl font-medium text-white/90 hover:bg-white/20 transition-all duration-300"
          >
            ← Back to Home
          </Link>
        </PageHeader>
      </ContentCard>

      {/* Message */}
      {message && (
        <div className="mb-6 px-6 py-4 backdrop-blur-sm rounded-xl text-center font-medium bg-red-500/20 border border-red-500/30 text-red-200">
          {message}
        </div>
      )}

      {editions.length === 0 ? (
        <EmptyState
          icon={
            <svg
              className="w-8 h-8 text-white/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM16 2v4M8 2v4M3 10h18"
              />
            </svg>
          }
          title="No Editions Available"
          description="Newspaper editions are generated automatically. Check back later!"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {editions.map((edition: NewspaperEdition) => (
            <div
              key={edition.id}
              className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300"
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white/90 mb-2">
                  Newspaper Edition
                </h2>
                <p className="text-sm text-white/70 mb-2">
                  {formatDate(edition.generationTime)}
                </p>
                <p className="text-white/80 text-sm mb-4">
                  {edition.stories.length} stories included
                </p>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-white/90 mb-2">
                  Articles
                </h4>
                <div className="space-y-4">
                  {edition.stories.map((article: Article, _index: number) => (
                    <div
                      key={article.id}
                      className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      <Link href={`/articles/${article.id}`} className="block">
                        <h5 className="font-semibold text-white/90 mb-2 hover:text-white transition-colors cursor-pointer">
                          {article.headline}
                        </h5>
                      </Link>
                      <p className="text-white/80 text-sm leading-relaxed">
                        {article.body}
                      </p>
                      <div className="mt-2 text-xs text-white/60">
                        Reporter: {article.reporterId} | Generated:{" "}
                        {new Date(article.generationTime).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center text-sm text-white/70">
                Edition ID: {edition.id.slice(0, 12)}...
              </div>

              {/* Prompt Display */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2 mb-2 relative group">
                  <h4 className="text-sm font-semibold text-white/90">
                    Generation Prompt
                  </h4>
                  <div className="relative group">
                    <svg
                      className="w-4 h-4 text-white/60 hover:text-white/80 cursor-help"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      To ensure full journalistic transparency, this is the
                      exact prompt given to the AI model to generate this
                      edition. This allows the user to verify that no funny
                      business has taken place.
                    </div>
                  </div>
                </div>
                <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white/70 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {edition.prompt}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-12 text-white/50">
        <p>{appName} Edition Archive</p>
      </div>
    </PageContainer>
  );
}
