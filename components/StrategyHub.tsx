
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { BrainCircuit, Lightbulb, Target, TrendingUp, Loader2, Globe, Briefcase, PenTool, Crown, Search, CheckCircle2, MapPin, Star, Users } from 'lucide-react';

interface StrategyHubProps {
    onNavigateToCopywriter: () => void;
    onOpenUpgradeModal: () => void;
    onRequireApiKey: () => void;
}

const StrategyHub: React.FC<StrategyHubProps> = ({ onNavigateToCopywriter, onOpenUpgradeModal, onRequireApiKey }) => {
  const [brandInfo, setBrandInfo] = useState('');
  const [objective, setObjective] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [location, setLocation] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'researching_maps' | 'researching_web' | 'thinking' | 'done'>('idle');
  const [analysisResult, setAnalysisResult] = useState('');

  const checkKey = () => {
    if (!geminiService.hasApiKey()) {
        onRequireApiKey();
        return false;
    }
    return true;
  };

  const handleAnalyze = async () => {
    if (!brandInfo || !checkKey()) return;
    
    setAnalysisResult('');
    
    try {
        // Step 1: Google Maps Recon
        setStatus('researching_maps');
        const mapQuery = `Find details for "${brandInfo}" located in "${location || 'USA'}". Get address, average rating, total reviews, and summarize the top 5 recent reviews (positive and negative). Also find 3 nearby competitors in the same niche.`;
        const mapData = await geminiService.researchWithMaps(mapQuery);

        // Step 2: Web Research
        setStatus('researching_web');
        let webQuery = "";
        if (websiteUrl) {
            webQuery = `Analyze the website ${websiteUrl}. What are their core services? Who is the target audience? Find their main online competitors and any current news or customer sentiment outside of Google Maps.`;
        } else {
            webQuery = `Search for the brand "${brandInfo}" in "${location}". Find similar real-world businesses, digital competitors, and current viral marketing trends in this industry for 2025.`;
        }
        const webData = await geminiService.researchWithWeb(webQuery);

        // Step 3: Deep Thinking Synthesis
        setStatus('thinking');
        const prompt = `
        Act as a Chief Strategy Officer.
        
        CLIENT: ${brandInfo}
        LOCATION: ${location}
        OBJECTIVE: ${objective}
        
        Using the provided Google Maps and Web Research data, create a COMPREHENSIVE STRATEGY REPORT.
        
        REQUIRED SECTIONS:
        
        ## 📊 Executive Summary
        Brief overview of the business health and market position.
        
        ## 📍 Google Maps & Local Presence
        - **Rating Analysis**: Analyze the star rating and volume.
        - **Customer Voice**: Summarize what customers love vs. hate based on the reviews.
        - **Local SEO Check**: Is their address/hours clear?
        
        ## ⚔️ Competitor Analysis
        - **Direct Competitors**: List 3 nearby rivals found in the data.
        - **Gap Analysis**: What are competitors doing that this client isn't?
        
        ## 📢 Customer Feedback & Sentiment
        - Deep dive into the "Why" behind the ratings.
        - Specific quotes or recurring themes from feedback.
        
        ## 🚀 Strategic Action Plan
        - **Immediate Fixes**: Quick wins for reputation management.
        - **Content Strategy**: What should they post to attract more local traffic?
        - **Paid Ads**: Recommended ad angles based on competitor weakness.
        
        Make this report spacious, easy to read, and professionally formatted.
        `;
        
        const result = await geminiService.generateDeepAnalysis(prompt, mapData, webData);
        setAnalysisResult(result || "Analysis complete, but no text returned.");
        setStatus('done');
    } catch (e: any) {
      console.error(e);
      setAnalysisResult("Strategic analysis failed. Please check your inputs and try again.");
      setStatus('idle');
      if (e.message?.includes("API Key")) onRequireApiKey();
    }
  };

  const handleCreateContent = () => {
      if (!analysisResult) return;
      localStorage.setItem('strategyContext', analysisResult);
      onNavigateToCopywriter();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
          <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <BrainCircuit className="w-8 h-8 text-indigo-500" /> Strategic Intelligence Hub
              </h2>
              <button onClick={onOpenUpgradeModal} className="bg-yellow-500 text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> PRO
              </button>
          </div>
          <p className="text-slate-400 mt-2">
              Deep reasoning mode powered by <strong>Gemini 3.0 Pro</strong> (Thinking) + <strong>Google Maps Grounding</strong>.<br/>
              Uncover local insights, review sentiment, and competitor strategies in one click.
          </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-400" /> Client Profile
                </h3>
                <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Business Name / Brand</label>
                      <input 
                        type="text" 
                        value={brandInfo} 
                        onChange={(e) => setBrandInfo(e.target.value)} 
                        placeholder="E.g. Joe's Pizza Palace" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                      />
                  </div>
                  
                  <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Location (City, State) - Vital for Maps</label>
                      <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input 
                            type="text" 
                            value={location} 
                            onChange={(e) => setLocation(e.target.value)} 
                            placeholder="E.g. Austin, TX" 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                          />
                      </div>
                  </div>

                  <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Website URL (Optional)</label>
                      <div className="relative">
                          <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input 
                            type="text" 
                            value={websiteUrl} 
                            onChange={(e) => setWebsiteUrl(e.target.value)} 
                            placeholder="https://example.com" 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                          />
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Specific Objective</label>
                      <div className="relative">
                          <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                          <input 
                            type="text" 
                            value={objective} 
                            onChange={(e) => setObjective(e.target.value)} 
                            placeholder="E.g. Increase weekend foot traffic" 
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                          />
                      </div>
                  </div>
                </div>

                <button 
                    onClick={handleAnalyze} 
                    disabled={!brandInfo || status.startsWith('researching') || status === 'thinking'} 
                    className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-lg font-bold shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all hover:scale-[1.02]"
                >
                    {status === 'researching_maps' ? (
                        <><MapPin className="animate-bounce w-5 h-5" /> Locating on Maps...</>
                    ) : status === 'researching_web' ? (
                        <><Globe className="animate-spin w-5 h-5" /> Web Intelligence...</>
                    ) : status === 'thinking' ? (
                        <><BrainCircuit className="animate-pulse w-5 h-5" /> Analyzing Data...</>
                    ) : (
                        <><Search className="w-5 h-5" /> Run Deep Analysis</>
                    )}
                </button>
            </div>

            <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-lg">
                <h4 className="text-indigo-300 text-sm font-bold mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Intelligence Pipeline
                </h4>
                <ul className="space-y-3 text-xs text-indigo-200/70">
                    <li className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-indigo-400"/> 
                        <span><strong>Maps Grounding:</strong> Fetches real location data, star ratings, and review snippets.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Users className="w-4 h-4 mt-0.5 text-indigo-400"/> 
                        <span><strong>Competitor Recon:</strong> Identifies nearby rivals and market gaps.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <BrainCircuit className="w-4 h-4 mt-0.5 text-indigo-400"/> 
                        <span><strong>Deep Thinking:</strong> Synthesizes millions of data points into a clear strategy.</span>
                    </li>
                </ul>
            </div>
        </div>

        <div className="lg:col-span-8">
            <div className="bg-slate-900 rounded-xl border border-slate-800 h-full min-h-[700px] flex flex-col relative overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex justify-between items-center z-10">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Strategic Roadmap
                    </span>
                    {analysisResult && status === 'done' && (
                        <button onClick={handleCreateContent} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in hover:scale-105 transition-transform">
                            <PenTool className="w-3 h-3" /> Create Content Plan
                        </button>
                    )}
                </div>

                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
                    {status === 'researching_maps' ? (
                         <div className="h-full flex flex-col items-center justify-center space-y-6 animate-pulse">
                            <div className="w-24 h-24 rounded-full bg-green-900/30 flex items-center justify-center relative">
                                <div className="absolute inset-0 border-4 border-green-500/30 rounded-full animate-ping"></div>
                                <MapPin className="w-10 h-10 text-green-400" />
                            </div>
                            <div className="text-center max-w-xs">
                                <h3 className="text-green-300 font-bold text-lg mb-2">Connecting to Google Maps...</h3>
                                <p className="text-slate-500 text-sm">Retrieving address, star ratings, and review sentiment.</p>
                            </div>
                         </div>
                    ) : status === 'researching_web' ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-6 animate-pulse">
                           <div className="w-24 h-24 rounded-full bg-blue-900/30 flex items-center justify-center relative">
                               <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-spin"></div>
                               <Globe className="w-10 h-10 text-blue-400" />
                           </div>
                           <div className="text-center max-w-xs">
                               <h3 className="text-blue-300 font-bold text-lg mb-2">Analyzing Web Presence...</h3>
                               <p className="text-slate-500 text-sm">Identifying digital competitors and viral trends.</p>
                           </div>
                        </div>
                    ) : status === 'thinking' ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-6 animate-pulse">
                           <div className="w-24 h-24 rounded-full bg-indigo-900/30 flex items-center justify-center relative">
                               <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping"></div>
                               <BrainCircuit className="w-12 h-12 text-indigo-400 animate-pulse" />
                           </div>
                           <div className="text-center max-w-xs">
                               <h3 className="text-indigo-300 font-bold text-lg mb-2">Thinking (Gemini 3.0 Pro)...</h3>
                               <p className="text-slate-500 text-sm">Connecting the dots between local data and market strategy.</p>
                           </div>
                        </div>
                    ) : analysisResult ? (
                        <div className="prose prose-invert prose-lg prose-indigo max-w-none">
                            <ReactMarkdown 
                                components={{
                                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-white mt-10 mb-6 pb-2 border-b border-slate-700 flex items-center gap-2" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-xl font-bold text-indigo-400 mt-6 mb-3" {...props} />,
                                    p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-slate-300" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-6 space-y-2 text-slate-300" {...props} />,
                                    strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />
                                }}
                            >
                                {analysisResult}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40">
                            <Target className="w-24 h-24 mb-6" />
                            <p className="text-xl font-medium">Ready to analyze.</p>
                            <p className="text-sm">Enter a business name & location to start.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyHub;
