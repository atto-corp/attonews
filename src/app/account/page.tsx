'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'reporter' | 'user';
  createdAt: number;
  lastLoginAt?: number;
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Form state for account info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');

  // Abilities state
  const [hasReader, setHasReader] = useState(false);
  const [hasReporter, setHasReporter] = useState(false);
  const [hasEditor, setHasEditor] = useState(false);

  // AI Configuration state
  const [aiConfig, setAiConfig] = useState({
    openaiApiKey: '',
    openaiBaseUrl: '',
    modelName: '',
    inputTokenCost: 0,
    outputTokenCost: 0,
    messageSliceCount: 0,
    articleGenerationPeriodMinutes: 0,
    eventGenerationPeriodMinutes: 0,
    editionGenerationPeriodMinutes: 0
  });
  const [aiConfigLoading, setAiConfigLoading] = useState(false);
  const [aiConfigSaving, setAiConfigSaving] = useState(false);

  // Usage state
  const [usageStats, setUsageStats] = useState({
    totalApiCalls: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    lastUpdated: 0
  });
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  const checkAuthAndLoadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        // Load existing account info (placeholder - would come from API)
        loadAccountInfo();
        // Load abilities
        loadAbilities();
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuthAndLoadUser();
  }, [checkAuthAndLoadUser]);

  useEffect(() => {
    if (user) {
      loadAiConfig();
      loadUsage();
    }
  }, [user]);

  const loadAccountInfo = async () => {
    // Placeholder - in a real app, this would fetch from an API
    // For now, we'll just set some placeholder data
    setFirstName('John');
    setLastName('Doe');
    setPhone('(555) 123-4567');
    setCompany('Example Corp');
    setBio('News enthusiast and content creator.');
  };

  const loadAbilities = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const [readerResponse, reporterResponse, editorResponse] = await Promise.all([
        fetch('/api/abilities/reader', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/abilities/reporter', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/abilities/editor', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (readerResponse.ok) {
        const readerData = await readerResponse.json();
        setHasReader(readerData.hasReader);
      }

      if (reporterResponse.ok) {
        const reporterData = await reporterResponse.json();
        setHasReporter(reporterData.hasReporter);
      }

      if (editorResponse.ok) {
        const editorData = await editorResponse.json();
        setHasEditor(editorData.hasEditor);
      }
    } catch {
      console.error('Failed to load abilities');
    }
  };

  const loadAiConfig = async () => {
    setAiConfigLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/config/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const config = await response.json();
        setAiConfig(config);
      }
    } catch (error) {
      console.error('Failed to load AI config:', error);
    } finally {
      setAiConfigLoading(false);
    }
  };

  const loadUsage = async () => {
    setUsageLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/usage/user?history=true&days=30', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsageStats(data.current);
        setUsageHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load usage:', error);
    } finally {
      setUsageLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Placeholder - in a real app, this would save to an API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      alert('Account information saved successfully!');
    } catch {
      alert('Failed to save account information.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAiConfig = async () => {
    setAiConfigSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/config/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(aiConfig)
      });

      if (response.ok) {
        alert('AI configuration saved successfully!');
      } else {
        alert('Failed to save AI configuration.');
      }
    } catch (error) {
      console.error('Failed to save AI config:', error);
      alert('Failed to save AI configuration.');
    } finally {
      setAiConfigSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 via-gray-500/20 to-gray-400/20 animate-pulse duration-3000"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-gray-400/30 to-gray-500/30 rounded-full blur-3xl duration-3000"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-gray-500/30 to-gray-400/30 rounded-full blur-3xl duration-3000" style={{animationDelay: '1s'}}></div>

        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">Loading account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 via-gray-500/20 to-gray-400/20 animate-pulse duration-3000"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-gray-400/30 to-gray-500/30 rounded-full blur-3xl duration-3000"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-gray-500/30 to-gray-400/30 rounded-full blur-3xl duration-3000" style={{animationDelay: '1s'}}></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/20">
            <h1 className="text-2xl font-bold text-white">Account Settings</h1>
            <p className="text-white/80 mt-1">Manage your account information and preferences</p>
          </div>

          <div className="p-6 space-y-8">
            {/* Account Permissions */}
            <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">Account Permissions</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="reader-permission"
                    checked={hasReader}
                    disabled
                    className="h-4 w-4 text-white focus:ring-white border-white/30 rounded cursor-not-allowed bg-white/10"
                  />
                  <label htmlFor="reader-permission" className="text-sm font-medium text-white/90">
                    Reader
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="reporter-permission"
                    checked={hasReporter}
                    disabled
                    className="h-4 w-4 text-white focus:ring-white border-white/30 rounded cursor-not-allowed bg-white/10"
                  />
                  <label htmlFor="reporter-permission" className="text-sm font-medium text-white/90">
                    Reporter
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="editor-permission"
                    checked={hasEditor}
                    disabled
                    className="h-4 w-4 text-white focus:ring-white border-white/30 rounded cursor-not-allowed bg-white/10"
                  />
                  <label htmlFor="editor-permission" className="text-sm font-medium text-white/90">
                    Editor
                  </label>
                </div>
              </div>
              <div className="mt-4 text-sm text-white/70">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
              {/* Upgrade Options */}
              <div className="mt-6 space-y-4">
                {/* Upgrade to Reader (existing) */}
                {!hasReader && (
                  <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white">Upgrade to Reader</h3>
                        <p className="text-xs text-white/70 mt-1">
                          Premium access to all published content and enhanced reading features
                        </p>
                      </div>
                      <a
                        href={`${process.env.NEXT_PUBLIC_STRIPE_READER_BUY_URL}?prefilled_email=${user.email}`}
                        className="group relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 overflow-hidden transition-all duration-300"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                        <span className="relative">Upgrade To Reader</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Upgrade to Reporter */}
                {!hasReporter && (
                  <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white">Upgrade to Reporter</h3>
                        <p className="text-xs text-white/70 mt-1">
                          Access AI-powered reporting tools and create professional news content
                        </p>
                      </div>
                      <a
                        href={`${process.env.NEXT_PUBLIC_STRIPE_REPORTER_BUY_URL}?prefilled_email=${user.email}`}
                        className="group relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 overflow-hidden transition-all duration-300"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                        <span className="relative">Upgrade To Reporter</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Upgrade to Editor */}
                {!hasEditor && (
                  <div className="backdrop-blur-xl bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white">Upgrade to Editor</h3>
                        <p className="text-xs text-white/70 mt-1">
                          Full editorial control with advanced publishing tools and team management
                        </p>
                      </div>
                      <a
                        href={`${process.env.NEXT_PUBLIC_STRIPE_EDITOR_BUY_URL}?prefilled_email=${user.email}`}
                        className="group relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 overflow-hidden transition-all duration-300"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                        <span className="relative">Upgrade To Editor</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-white/90 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-white/90 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                    placeholder="Enter your last name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg text-white/70 cursor-not-allowed"
                  />
                  <p className="text-xs text-white/50 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="company" className="block text-sm font-medium text-white/90 mb-2">
                    Company/Organization
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                    placeholder="Enter your company or organization"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-white/90 mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300 resize-none"
                    placeholder="Tell us a bit about yourself"
                  />
                </div>
              </div>
             </div>

              {/* AI Configuration */}
              <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-4">AI Configuration</h2>
                {aiConfigLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                    <p className="mt-2 text-white/80">Loading AI configuration...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="openaiApiKey" className="block text-sm font-medium text-white/90 mb-2">
                          OpenAI API Key
                        </label>
                        <input
                          type="password"
                          id="openaiApiKey"
                          value={aiConfig.openaiApiKey}
                          onChange={(e) => setAiConfig(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                          className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                          placeholder="Enter your OpenAI API key"
                        />
                      </div>

                      <div>
                        <label htmlFor="openaiBaseUrl" className="block text-sm font-medium text-white/90 mb-2">
                          OpenAI Base URL
                        </label>
                        <input
                          type="url"
                          id="openaiBaseUrl"
                          value={aiConfig.openaiBaseUrl}
                          onChange={(e) => setAiConfig(prev => ({ ...prev, openaiBaseUrl: e.target.value }))}
                          className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                          placeholder="https://api.openai.com/v1"
                        />
                      </div>

                      <div>
                        <label htmlFor="modelName" className="block text-sm font-medium text-white/90 mb-2">
                          Model Name
                        </label>
                        <input
                          type="text"
                          id="modelName"
                          value={aiConfig.modelName}
                          onChange={(e) => setAiConfig(prev => ({ ...prev, modelName: e.target.value }))}
                          className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                          placeholder="gpt-4"
                        />
                      </div>

                      <div>
                        <label htmlFor="inputTokenCost" className="block text-sm font-medium text-white/90 mb-2">
                          Input Token Cost ($ per 1K tokens)
                        </label>
                        <input
                          type="number"
                          id="inputTokenCost"
                          value={aiConfig.inputTokenCost}
                          onChange={(e) => setAiConfig(prev => ({ ...prev, inputTokenCost: parseFloat(e.target.value) || 0 }))}
                          step="0.01"
                          className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label htmlFor="outputTokenCost" className="block text-sm font-medium text-white/90 mb-2">
                          Output Token Cost ($ per 1K tokens)
                        </label>
                        <input
                          type="number"
                          id="outputTokenCost"
                          value={aiConfig.outputTokenCost}
                          onChange={(e) => setAiConfig(prev => ({ ...prev, outputTokenCost: parseFloat(e.target.value) || 0 }))}
                          step="0.01"
                          className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label htmlFor="messageSliceCount" className="block text-sm font-medium text-white/90 mb-2">
                          Message Slice Count
                        </label>
                        <input
                          type="number"
                          id="messageSliceCount"
                          value={aiConfig.messageSliceCount}
                          onChange={(e) => setAiConfig(prev => ({ ...prev, messageSliceCount: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                          placeholder="10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label htmlFor="articleGenerationPeriodMinutes" className="block text-sm font-medium text-white/90 mb-2">
                          Article Generation Period (minutes)
                        </label>
                        <input
                          type="number"
                          id="articleGenerationPeriodMinutes"
                          value={aiConfig.articleGenerationPeriodMinutes}
                          onChange={(e) => setAiConfig(prev => ({ ...prev, articleGenerationPeriodMinutes: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                          placeholder="60"
                        />
                      </div>

                      <div>
                        <label htmlFor="eventGenerationPeriodMinutes" className="block text-sm font-medium text-white/90 mb-2">
                          Event Generation Period (minutes)
                        </label>
                        <input
                          type="number"
                          id="eventGenerationPeriodMinutes"
                          value={aiConfig.eventGenerationPeriodMinutes}
                          onChange={(e) => setAiConfig(prev => ({ ...prev, eventGenerationPeriodMinutes: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                          placeholder="30"
                        />
                      </div>

                      <div>
                        <label htmlFor="editionGenerationPeriodMinutes" className="block text-sm font-medium text-white/90 mb-2">
                          Edition Generation Period (minutes)
                        </label>
                        <input
                          type="number"
                          id="editionGenerationPeriodMinutes"
                          value={aiConfig.editionGenerationPeriodMinutes}
                          onChange={(e) => setAiConfig(prev => ({ ...prev, editionGenerationPeriodMinutes: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-300"
                          placeholder="1440"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/20">
                      <button
                        onClick={handleSaveAiConfig}
                        disabled={aiConfigSaving}
                        className="group relative inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                        <span className="relative">{aiConfigSaving ? 'Saving...' : 'Save AI Config'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Usage Dashboard */}
              <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10">
                <h2 className="text-lg font-semibold text-white mb-4">Usage Dashboard</h2>
                {usageLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                    <p className="mt-2 text-white/80">Loading usage statistics...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="backdrop-blur-xl bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="text-sm text-white/70">API Calls</div>
                        <div className="text-2xl font-bold text-white">{usageStats.totalApiCalls.toLocaleString()}</div>
                      </div>
                      <div className="backdrop-blur-xl bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="text-sm text-white/70">Input Tokens</div>
                        <div className="text-2xl font-bold text-white">{usageStats.totalInputTokens.toLocaleString()}</div>
                      </div>
                      <div className="backdrop-blur-xl bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="text-sm text-white/70">Output Tokens</div>
                        <div className="text-2xl font-bold text-white">{usageStats.totalOutputTokens.toLocaleString()}</div>
                      </div>
                      <div className="backdrop-blur-xl bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="text-sm text-white/70">Total Cost</div>
                        <div className="text-2xl font-bold text-white">${usageStats.totalCost.toFixed(2)}</div>
                      </div>
                    </div>

                    {usageHistory.length > 0 && (
                      <div>
                        <h3 className="text-md font-medium text-white mb-3">Recent Usage (Last 30 Days)</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {usageHistory.slice(0, 10).map((entry, index) => (
                            <div key={index} className="flex justify-between items-center py-2 px-3 backdrop-blur-xl bg-white/5 rounded-lg border border-white/10">
                              <div className="text-sm text-white/80">
                                {new Date(entry.lastUpdated).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-white">
                                {entry.totalApiCalls} calls • ${entry.totalCost.toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-white/50 text-center">
                      Last updated: {usageStats.lastUpdated ? new Date(usageStats.lastUpdated).toLocaleString() : 'Never'}
                    </div>
                  </div>
                )}
              </div>

             {/* Account Activity */}
            <div className="backdrop-blur-xl bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">Account Activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/70">Last Login</p>
                  <p className="font-medium text-white">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/70">Account Created</p>
                  <p className="font-medium text-white">
                    {new Date(user.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-white/20">
              <button
                onClick={handleSave}
                disabled={saving}
                className="group relative inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <span className="relative">{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
