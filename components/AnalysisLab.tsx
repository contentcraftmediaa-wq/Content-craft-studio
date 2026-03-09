
import React, { useState } from 'react';
import { geminiService, fileToBase64 } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Search, Upload, BarChart3, TrendingUp, Loader2, Table as TableIcon, FileText, Download, AlertCircle, Globe, Link, Star, UserCheck, ArrowRight, PenTool, Layout, CheckCircle2 } from 'lucide-react';

interface AnalysisLabProps {
  onRequireApiKey: () => void;
  onNavigateToCopywriter: () => void;
}

interface ProfileAuditData {
  reputation_score: number;
  sentiment: string;
  best_performing_topics: string[];
  missed_opportunities: string[];
  actionable_fixes: { category: string; fix: string }[];
  content_ideas: { title: string; why_it_works: string; format: string }[];
}

interface TrendData {
  trend_name: string;
  platform: string;
  virality_score: number; // 1-10
  why_trending: string;
  execution_hook: string;
}

const AnalysisLab: React.FC<AnalysisLabProps> = ({ onRequireApiKey, onNavigateToCopywriter }) => {
  const [mode, setMode] = useState<'audit' | 'trends'>('audit');
  const [inputType, setInputType] = useState<'screenshot' | 'url'>('url');
  
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [niche, setNiche] = useState('');

  // Results
  const [profileData, setProfileData] = useState<ProfileAuditData | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [rawResult, setRawResult] = useState('');

  const checkKey = () => {
    if (!geminiService.hasApiKey()) {
        onRequireApiKey();
        return false;
    }
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const f = e.target.files[0];
          setFile(f);
          const reader = new FileReader();
          reader.onload = (ev) => setPreview(ev.target?.result as string);
          reader.readAsDataURL(f);
      }
  };

  const runProfileAudit = async () => {
      if ((inputType === 'screenshot' && !file) || (inputType === 'url' && !url)) return;
      if (!checkKey()) return;

      setLoading(true);
      setProfileData(null);
      setRawResult('');

      try {
          let jsonStr = "";
          
          if (inputType === 'url') {
              // Deep Web Research
              const searchPrompt = `
              Perform a DEEP FORENSIC SOCIAL MEDIA AUDIT on this URL: ${url}
              
              Tasks:
              1. Search for this profile/brand across Google, LinkedIn, Instagram, and YouTube.
              2. Analyze their "Reputation" and "Sentiment" based on search results, reviews, and comments found on the web.
              3. Identify their "Most Viewed" or "Top Performing" content topics.
              4. Find critical "Missed Opportunities" or content gaps.
              5. Suggest 5 specific, high-potential "Content Ideas" that would perform well for them right now.

              OUTPUT: Return a valid JSON object (do NOT return Markdown code blocks, just raw JSON) with this exact structure:
              {
                "reputation_score": (number 1-100),
                "sentiment": (string, e.g., "Highly Trusted", "Mixed", "Controversial"),
                "best_performing_topics": [array of strings],
                "missed_opportunities": [array of strings],
                "actionable_fixes": [{ "category": string, "fix": string }],
                "content_ideas": [{ "title": string, "why_it_works": string, "format": "Reel/Post/Video" }]
              }
              `;
              
              const searchResult = await geminiService.researchWithWeb(searchPrompt);
              
              // Sometimes search grounding returns text, not JSON. We might need to ask the model to format it.
              const formatPrompt = `Convert this research data into the requested JSON format: ${searchResult}`;
              jsonStr = await geminiService.generateText(formatPrompt, true, "You are a JSON formatter.", true);

          } else if (file) {
              // Vision Analysis
              const base64 = await fileToBase64(file);
              const prompt = `
              Analyze this social media profile screenshot. 
              Critique the Bio, Profile Pic, and Content Grid. 
              OUTPUT JSON with keys: reputation_score (estimate 1-100), sentiment, best_performing_topics (infer from visuals), missed_opportunities, actionable_fixes, content_ideas.
              `;
              jsonStr = await geminiService.analyzeContent(prompt, base64, file.type);
          }

          // Parse JSON
          try {
              const clean = jsonStr.replace(/```json\n?|\n?```/g, '').trim();
              const parsed = JSON.parse(clean);
              setProfileData(parsed);
          } catch (e) {
              console.warn("JSON Parse Failed, falling back to text", e);
              setRawResult(jsonStr);
          }

      } catch (e: any) {
          console.error(e);
          if (e.message?.includes("API Key")) onRequireApiKey();
          else setRawResult("Error analyzing profile. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  const runAdvancedTrendHunt = async () => {
      if (!niche || !checkKey()) return;
      setLoading(true);
      setTrendData([]);
      setRawResult('');
      
      try {
          const researchQuery = `
          Find the top 10 SPECIFIC viral trends, audio, or formats for the "${niche}" niche right now in 2025.
          Check:
          1. Google Trends (Rising topics)
          2. YouTube Breakout Videos
          3. TikTok Creative Center / Viral Sounds
          4. Common questions in Forums/Reddit for this niche.
          `;
          
          const webData = await geminiService.researchWithWeb(researchQuery);

          const prompt = `
          Based on this real-time data: ${webData}
          
          Create a "Viral Trend Matrix".
          Return a JSON ARRAY where each object has:
          - "trend_name": string
          - "platform": "TikTok" | "YouTube" | "IG" | "General"
          - "virality_score": number (1-10)
          - "why_trending": string (brief psychological reason)
          - "execution_hook": string (The exact hook to use)
          `;

          const jsonStr = await geminiService.generateText(prompt, true, "You are a Data Analyst.", true);
          
          try {
              const clean = jsonStr.replace(/```json\n?|\n?```/g, '').trim();
              const parsed = JSON.parse(clean);
              setTrendData(Array.isArray(parsed) ? parsed : [parsed]);
          } catch (e) {
              setRawResult(jsonStr);
          }

      } catch (e: any) {
          setRawResult("Error fetching trends.");
          if (e.message?.includes("API Key")) onRequireApiKey();
      } finally {
          setLoading(false);
      }
  };

  const handleCreateFromIdea = (idea: string, context: string) => {
      const fullContext = `Source Material: ${context}\n\nUser selected topic: ${idea}. \n\nCreate a full script/post for this.`;
      localStorage.setItem('strategyContext', fullContext);
      onNavigateToCopywriter();
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      <header className="mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-fuchsia-500" /> 
            Analysis Lab 2.0
          </h2>
          <p className="text-slate-400 mt-2">
            Advanced forensic profile auditing & cross-platform viral trend hunting.
          </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
          <button onClick={() => { setMode('audit'); setProfileData(null); }} className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all font-bold ${mode === 'audit' ? 'bg-fuchsia-900/20 border-fuchsia-500 text-fuchsia-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
              <UserCheck className="w-4 h-4" /> Profile Auditor
          </button>
          <button onClick={() => { setMode('trends'); setTrendData([]); }} className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all font-bold ${mode === 'trends' ? 'bg-blue-900/20 border-blue-500 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
              <TrendingUp className="w-4 h-4" /> Viral Trend Hunter
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Input Panel */}
          <div className="lg:col-span-4 bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit shadow-xl">
              {mode === 'audit' ? (
                  <div className="space-y-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Search className="w-5 h-5 text-fuchsia-400" /> Audit Input
                      </h3>
                      
                      <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                          <button onClick={() => setInputType('url')} className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-2 ${inputType === 'url' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>
                              <Link className="w-3 h-3" /> Profile URL
                          </button>
                          <button onClick={() => setInputType('screenshot')} className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-2 ${inputType === 'screenshot' ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>
                              <Upload className="w-3 h-3" /> Screenshot
                          </button>
                      </div>

                      {inputType === 'url' ? (
                          <div>
                              <label className="block text-xs font-medium text-slate-400 mb-2">Social Profile URL</label>
                              <div className="relative">
                                  <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                  <input 
                                    type="text" 
                                    value={url} 
                                    onChange={(e) => setUrl(e.target.value)} 
                                    placeholder="https://instagram.com/username" 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 p-3 text-white focus:ring-2 focus:ring-fuchsia-500 focus:outline-none" 
                                  />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-2">
                                  <span className="text-fuchsia-400 font-bold">New:</span> Deep Web Search enabled. We check Google, Meta, & LinkedIn data.
                              </p>
                          </div>
                      ) : (
                          <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center relative hover:border-fuchsia-500 transition-colors group">
                              <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                              {preview ? (
                                  <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded shadow-lg" />
                              ) : (
                                  <>
                                      <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                                      <p className="text-sm text-slate-500">Upload Profile Screenshot</p>
                                  </>
                              )}
                          </div>
                      )}

                      <button 
                        onClick={runProfileAudit} 
                        disabled={loading || (inputType === 'url' && !url) || (inputType === 'screenshot' && !file)} 
                        className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white py-4 rounded-lg font-bold disabled:opacity-50 flex justify-center gap-2 shadow-lg shadow-fuchsia-900/20 hover:scale-[1.02] transition-transform"
                      >
                          {loading ? <Loader2 className="animate-spin" /> : <Search className="w-5 h-5" />} 
                          Run Deep Audit
                      </button>
                  </div>
              ) : (
                  <div className="space-y-6">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Globe className="w-5 h-5 text-blue-400" /> Niche Explorer
                      </h3>
                      <p className="text-sm text-slate-400">
                          Scours Google Trends, TikTok Creative Center, and YouTube Breakouts for real-time opportunities.
                      </p>
                      
                      <div>
                          <label className="block text-xs font-medium text-slate-400 mb-2">Target Niche / Industry</label>
                          <input 
                            type="text" 
                            value={niche} 
                            onChange={(e) => setNiche(e.target.value)} 
                            placeholder="e.g. AI Automation, Vegan Baking, Crossfit" 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                          />
                      </div>
                      
                      <button 
                        onClick={runAdvancedTrendHunt} 
                        disabled={!niche || loading} 
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-4 rounded-lg font-bold disabled:opacity-50 flex justify-center gap-2 shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-transform"
                      >
                          {loading ? (
                              <><Loader2 className="animate-spin w-4 h-4" /><span className="text-sm">Scanning Web...</span></>
                          ) : (
                              <><TrendingUp className="w-5 h-5" /> Hunt Viral Trends</>
                          )}
                      </button>
                  </div>
              )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-8 bg-slate-900 rounded-xl border border-slate-800 flex flex-col overflow-hidden min-h-[600px] relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800/20 via-slate-950 to-slate-950 pointer-events-none"></div>
              
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar z-10">
                  {loading ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-6 animate-pulse">
                          <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                              <Loader2 className="w-10 h-10 animate-spin text-fuchsia-500" />
                          </div>
                          <p className="text-lg font-medium text-slate-400">
                              {mode === 'audit' ? 'Forensic Audit in Progress...' : 'Scanning Global Trends...'}
                          </p>
                          <p className="text-xs text-slate-600 max-w-xs text-center">
                              Checking Search Results, Meta Data, Reviews, and Engagement Metrics.
                          </p>
                      </div>
                  ) : profileData && mode === 'audit' ? (
                      <div className="space-y-8 animate-in slide-in-from-bottom-5">
                          {/* Score Card */}
                          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
                              <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-xl font-bold text-white">Profile Health Score</h3>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${profileData.sentiment.includes('High') || profileData.sentiment.includes('Pos') ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-yellow-900/30 text-yellow-400 border-yellow-500/30'}`}>
                                      Sentiment: {profileData.sentiment}
                                  </span>
                              </div>
                              <div className="flex items-end gap-2 mb-2">
                                  <span className="text-5xl font-black text-white">{profileData.reputation_score}</span>
                                  <span className="text-lg text-slate-500 font-medium mb-1">/ 100</span>
                              </div>
                              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${profileData.reputation_score > 70 ? 'bg-green-500' : profileData.reputation_score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                    style={{ width: `${profileData.reputation_score}%` }}
                                  />
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               {/* Topics */}
                              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                                  <h4 className="text-fuchsia-400 font-bold mb-4 flex items-center gap-2">
                                      <Star className="w-4 h-4" /> Top Performing Topics
                                  </h4>
                                  <ul className="space-y-2">
                                      {profileData.best_performing_topics.map((topic, i) => (
                                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                              {topic}
                                          </li>
                                      ))}
                                  </ul>
                              </div>

                              {/* Fixes */}
                              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                                  <h4 className="text-red-400 font-bold mb-4 flex items-center gap-2">
                                      <AlertCircle className="w-4 h-4" /> Urgent Improvements
                                  </h4>
                                  <ul className="space-y-2">
                                      {profileData.actionable_fixes.slice(0, 3).map((fix, i) => (
                                          <li key={i} className="text-sm text-slate-300">
                                              <strong className="text-slate-200 block text-xs uppercase opacity-70 mb-0.5">{fix.category}</strong>
                                              {fix.fix}
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          </div>

                          {/* Content Ideas Integration */}
                          <div>
                              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                  <PenTool className="w-5 h-5 text-fuchsia-500" /> Recommended Content Strategy
                              </h4>
                              <div className="grid grid-cols-1 gap-4">
                                  {profileData.content_ideas.map((idea, i) => (
                                      <div key={i} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-fuchsia-500/50 transition-colors group">
                                          <div className="flex justify-between items-start gap-4">
                                              <div>
                                                  <h5 className="font-bold text-white text-base mb-1">{idea.title}</h5>
                                                  <p className="text-xs text-slate-400 mb-2">{idea.why_it_works}</p>
                                                  <span className="inline-block px-2 py-0.5 bg-slate-700 rounded text-[10px] text-slate-300 uppercase tracking-wide">
                                                      Format: {idea.format}
                                                  </span>
                                              </div>
                                              <button 
                                                onClick={() => handleCreateFromIdea(idea.title, `Context: ${profileData.sentiment} profile. Goal: ${idea.why_it_works}`)}
                                                className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                  Create <ArrowRight className="w-3 h-3" />
                                              </button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  ) : trendData.length > 0 && mode === 'trends' ? (
                      <div className="space-y-6 animate-in slide-in-from-bottom-5">
                          <h3 className="text-xl font-bold text-white mb-4">Top 10 Viral Opportunities for "{niche}"</h3>
                          <div className="grid grid-cols-1 gap-4">
                              {trendData.map((trend, i) => (
                                  <div key={i} className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 hover:bg-slate-800 transition-colors relative overflow-hidden group">
                                      <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-slate-500 select-none">#{i + 1}</div>
                                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                          <div className="flex-1">
                                              <div className="flex items-center gap-3 mb-1">
                                                  <h4 className="text-lg font-bold text-white">{trend.trend_name}</h4>
                                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${trend.platform === 'TikTok' ? 'bg-pink-900/40 text-pink-400' : 'bg-red-900/40 text-red-400'}`}>{trend.platform}</span>
                                              </div>
                                              <p className="text-sm text-slate-400 mb-3">{trend.why_trending}</p>
                                              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                                                  <span className="text-xs font-bold text-blue-400 uppercase mr-2">Hook:</span>
                                                  <span className="text-xs text-slate-300 italic">"{trend.execution_hook}"</span>
                                              </div>
                                          </div>
                                          
                                          <div className="flex flex-col items-end gap-3 min-w-[140px]">
                                              <div className="text-right">
                                                  <span className="text-xs text-slate-500 block">Virality Score</span>
                                                  <div className="flex items-center gap-1 justify-end">
                                                      <span className={`text-xl font-black ${trend.virality_score >= 9 ? 'text-red-500' : 'text-orange-500'}`}>{trend.virality_score}</span>
                                                      <span className="text-sm text-slate-600">/10</span>
                                                  </div>
                                              </div>
                                              <button 
                                                onClick={() => handleCreateFromIdea(trend.trend_name, `Viral Trend: ${trend.trend_name}. Hook: ${trend.execution_hook}. Why: ${trend.why_trending}`)}
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                                              >
                                                  Use Trend <ArrowRight className="w-3 h-3" />
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ) : rawResult ? (
                       <div className="prose prose-invert max-w-none p-4">
                           <ReactMarkdown>{rawResult}</ReactMarkdown>
                       </div>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40">
                          <Layout className="w-24 h-24 mb-6" />
                          <p className="text-xl font-medium">Ready to Analyze</p>
                          <p className="text-sm">Select a tool from the left to begin.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default AnalysisLab;
