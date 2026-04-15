"use client";

import { useState, useEffect } from "react";
import {
  Artifact,
  ArtifactJob,
  ArtifactInput,
  ArtifactType
} from "../schemas/types";

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [jobs, setJobs] = useState<ArtifactJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: "event" as ArtifactType,
    inputs: [
      { name: "", source: "artifacts" as "artifacts" | "external" }
    ] as ArtifactInput[],
    prompt_system: "",
    prompt_user_template: ""
  });

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

  const handleCreateArtifact = async () => {
    try {
      const res = await fetch("/api/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({
          type: "event",
          inputs: [{ name: "", source: "artifacts" }],
          prompt_system: "",
          prompt_user_template: ""
        });
        fetchArtifacts();
      } else {
        alert("Failed to create artifact");
      }
    } catch (err) {
      console.error("Error creating artifact:", err);
    }
  };

  const addInput = () => {
    setCreateForm((prev) => ({
      ...prev,
      inputs: [...prev.inputs, { name: "", source: "artifacts" }]
    }));
  };

  const updateInput = (
    index: number,
    field: keyof ArtifactInput,
    value: any
  ) => {
    setCreateForm((prev) => ({
      ...prev,
      inputs: prev.inputs.map((inp, i) =>
        i === index ? { ...inp, [field]: value } : inp
      )
    }));
  };

  const removeInput = (index: number) => {
    setCreateForm((prev) => ({
      ...prev,
      inputs: prev.inputs.filter((_, i) => i !== index)
    }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Artifacts</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Create New Artifact
        </button>
      </div>

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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create New Artifact
              </h3>

              <div className="mb-4 p-4 bg-gray-50 rounded">
                <h4 className="font-semibold mb-2">Inputs & Templates</h4>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Inputs</strong> fetch data for prompts.
                </p>
                <ul className="text-sm text-gray-600 list-disc pl-5 mb-2">
                  <li>
                    <strong>Artifacts source:</strong>{" "}
                    <code>{`{name:"events", source:"artifacts", type:"event", filter:{limit:5, reporterId:"demo", since:"1h"}}`}</code>{" "}
                    → Fetches latest matching artifacts from the database.
                  </li>
                  <li>
                    <strong>Bluesky (external):</strong>{" "}
                    <code>{`{name:"bluesky", source:"external", filter:{limit:20}}`}</code>{" "}
                    → Fetches an array of latest Bluesky message texts via
                    TinyJetstream.
                  </li>
                </ul>
                <p className="text-sm text-gray-600">
                  <strong>Prompts:</strong>
                  <br />- <strong>system:</strong> Instructions for the AI
                  (e.g., "You are a news editor").
                  <br />- <strong>user_template:</strong> Template string with
                  variables like <code>{`{{inputs[0].name}}`}</code>, rendered
                  with Handlebars.
                </p>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={createForm.type}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        type: e.target.value as ArtifactType
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                  >
                    <option value="event">event</option>
                    <option value="article">article</option>
                    <option value="edition">edition</option>
                    <option value="daily_edition">daily_edition</option>
                    <option value="custom">custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inputs
                  </label>
                  {createForm.inputs.map((input, index) => (
                    <div key={index} className="border p-3 mb-2 rounded">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500">
                            Name
                          </label>
                          <input
                            type="text"
                            value={input.name}
                            onChange={(e) =>
                              updateInput(index, "name", e.target.value)
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md p-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500">
                            Source
                          </label>
                          <select
                            value={input.source}
                            onChange={(e) =>
                              updateInput(
                                index,
                                "source",
                                e.target.value as "artifacts" | "external"
                              )
                            }
                            className="mt-1 block w-full border border-gray-300 rounded-md p-1 text-sm"
                          >
                            <option value="artifacts">artifacts</option>
                            <option value="external">external</option>
                          </select>
                        </div>
                        {input.source === "artifacts" && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-500">
                                Type
                              </label>
                              <select
                                value={input.type || ""}
                                onChange={(e) =>
                                  updateInput(
                                    index,
                                    "type",
                                    e.target.value || undefined
                                  )
                                }
                                className="mt-1 block w-full border border-gray-300 rounded-md p-1 text-sm"
                              >
                                <option value="">any</option>
                                <option value="event">event</option>
                                <option value="article">article</option>
                                <option value="edition">edition</option>
                                <option value="daily_edition">
                                  daily_edition
                                </option>
                                <option value="custom">custom</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500">
                                Filter (JSON)
                              </label>
                              <textarea
                                value={JSON.stringify(
                                  input.filter || {},
                                  null,
                                  2
                                )}
                                onChange={(e) => {
                                  try {
                                    const val = JSON.parse(e.target.value);
                                    updateInput(index, "filter", val);
                                  } catch {}
                                }}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-1 text-sm"
                                rows={2}
                              />
                            </div>
                          </>
                        )}
                        {input.source === "external" && (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500">
                              Filter (JSON)
                            </label>
                            <textarea
                              value={JSON.stringify(
                                input.filter || {},
                                null,
                                2
                              )}
                              onChange={(e) => {
                                try {
                                  const val = JSON.parse(e.target.value);
                                  updateInput(index, "filter", val);
                                } catch {}
                              }}
                              className="mt-1 block w-full border border-gray-300 rounded-md p-1 text-sm"
                              rows={2}
                            />
                          </div>
                        )}
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeInput(index)}
                            className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 text-xs rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addInput}
                    className="bg-green-500 hover:bg-green-700 text-white px-3 py-1 text-sm rounded"
                  >
                    Add Input
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Prompt System
                  </label>
                  <textarea
                    value={createForm.prompt_system}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        prompt_system: e.target.value
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Prompt User Template
                  </label>
                  <textarea
                    value={createForm.prompt_user_template}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        prompt_user_template: e.target.value
                      }))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    rows={5}
                  />
                </div>
              </form>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="mr-3 bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateArtifact}
                  className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
