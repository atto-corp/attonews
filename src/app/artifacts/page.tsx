"use client";

import { useState, useEffect } from "react";
import { Artifact, ArtifactJob } from "../schemas/types";

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [jobs, setJobs] = useState<ArtifactJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchArtifacts();
    fetchJobs();
    const interval = setInterval(() => fetchJobs(), 5000); // poll jobs every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchArtifacts = async () => {
    try {
      const res = await fetch("/api/artifacts");
      if (!res.ok) throw new Error("Failed to fetch artifacts");
      const data = await res.json();
      setArtifacts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/artifacts/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  };

  const queueArtifact = async (id: string) => {
    try {
      await fetch(`/api/artifacts/queue/${id}`, { method: "POST" });
      await fetchJobs();
    } catch (err) {
      console.error("Failed to queue:", err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Artifacts</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Artifacts</h2>
        <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                ID
              </th>
              <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                Type
              </th>
              <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                Status
              </th>
              <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                Inputs
              </th>
              <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                Prompt
              </th>
              <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {artifacts.map((artifact) => (
              <tr key={artifact.id}>
                <td className="px-4 py-2 border text-sm text-gray-900 dark:text-gray-100">
                  {artifact.id}
                </td>
                <td className="px-4 py-2 border text-sm text-gray-900 dark:text-gray-100">
                  {artifact.type}
                </td>
                <td className="px-4 py-2 border text-sm text-gray-900 dark:text-gray-100">
                  {artifact.metadata.status}
                </td>
                <td className="px-4 py-2 border text-sm text-gray-900 dark:text-gray-100">
                  {JSON.stringify(artifact.inputs).slice(0, 50)}
                </td>
                <td className="px-4 py-2 border text-sm text-gray-900 dark:text-gray-100">
                  {artifact.prompt_user_template.slice(0, 50)}
                </td>
                <td className="px-4 py-2 border text-sm text-gray-900 dark:text-gray-100">
                  <button
                    onClick={() => queueArtifact(artifact.id)}
                    className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 mr-2 rounded"
                  >
                    Queue
                  </button>
                  {/* Edit, Delete buttons */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Jobs</h2>
        <table className="min-w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                ID
              </th>
              <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                Artifact ID
              </th>
              <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                Status
              </th>
              <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-4 py-2 border text-sm text-gray-900 dark:text-gray-100">
                  {job.id}
                </td>
                <td className="px-4 py-2 border text-sm text-gray-900 dark:text-gray-100">
                  {job.artifactId}
                </td>
                <td className="px-4 py-2 border text-sm text-gray-900 dark:text-gray-100">
                  {job.status}
                </td>
                <td className="px-4 py-2 border text-sm text-gray-900 dark:text-gray-100">
                  {new Date(job.createdAt || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
