"use client";

import { useState, useEffect } from "react";
import { User } from "../schemas/types";

interface LogsResponse {
  logs: string[];
  count: number;
}

export default function LogsPage() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuthAndFetchLogs();
  }, []);

  const checkAuthAndFetchLogs = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const userResponse = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!userResponse.ok) {
        setError("Authentication failed");
        setLoading(false);
        return;
      }

      const userData = await userResponse.json();
      setCurrentUser(userData.user);

      if (userData.user.role !== "admin") {
        setError("Admin access required");
        setLoading(false);
        return;
      }

      const logsResponse = await fetch("/api/logs/latest", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!logsResponse.ok) {
        throw new Error("Failed to fetch logs");
      }

      const logsData = await logsResponse.json();
      setData(logsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
          <p className="mt-4 text-white/80">Loading logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 via-gray-500/20 to-gray-400/20 animate-pulse duration-3000"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-gray-400/30 to-gray-500/30 rounded-full blur-3xl duration-3000"></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-gray-500/30 to-gray-400/30 rounded-full blur-3xl duration-3000"
          style={{ animationDelay: "1s" }}
        ></div>

        <div className="text-center relative z-10">
          <div className="text-red-300 text-lg font-semibold mb-2">
            Access Denied
          </div>
          <p className="text-white/80">{error}</p>
          <a
            href="/login"
            className="group relative inline-flex items-center mt-4 px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 overflow-hidden transition-all duration-300"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
            <span className="relative">Go to Login</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 via-gray-500/20 to-gray-400/20 animate-pulse duration-3000"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-gray-400/30 to-gray-500/30 rounded-full blur-3xl duration-3000"></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-gray-500/30 to-gray-400/30 rounded-full blur-3xl duration-3000"
        style={{ animationDelay: "1s" }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20">
          <div className="px-6 py-4 border-b border-white/20">
            <h1 className="text-2xl font-bold text-white">App Logs</h1>
            <p className="mt-1 text-sm text-white/80">
              Application logs from various cron jobs and processes.
            </p>
            {data && (
              <div className="mt-2 text-sm text-white/70">
                <span className="font-medium">{data.count}</span> log entries
              </div>
            )}
          </div>

          <div className="p-6">
            {data ? (
              <div className="space-y-4">
                <div className="backdrop-blur-xl bg-white/5 rounded-lg border border-white/10">
                  <div className="px-4 py-3 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">
                      Log Entries
                    </h3>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto">
                    {data.logs.length > 0 ? (
                      <div className="divide-y divide-white/10">
                        {data.logs.map((log, index) => (
                          <div
                            key={index}
                            className="p-4 hover:bg-white/5 transition-colors font-mono text-sm"
                          >
                            <span className="text-white/90">{log}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-white/70">
                        No logs available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/70">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
