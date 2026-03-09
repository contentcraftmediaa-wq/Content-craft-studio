
import React, { useState, useEffect } from 'react';
import { VideoAspectRatio } from '../types';
import { geminiService, fileToBase64 } from '../services/geminiService';
import { Video, Upload, Film, Loader2, AlertCircle, TrendingUp, Sparkles, Share2, Search, Link, PenTool, Crown, KeyRound, BarChart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface VideoStudioProps {
    onNavigateToCopywriter: () => void;
    onOpenUpgradeModal: () => void;
    onRequireApiKey: () => void;
}

const VideoStudio: React.FC<VideoStudioProps> = ({ onNavigateToCopywriter, onOpenUpgradeModal, onRequireApiKey }) => {
  const [mode, setMode] = useState<'generate' | 'analyze'>('generate');
  
  // Generate State
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>(VideoAspectRatio.LANDSCAPE);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  
  // Analyze State
  const [analyzeFile, setAnalyzeFile] = useState<File | null>(null);
  const [analyzeUrl, setAnalyzeUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [dailyUsage, setDailyUsage] = useState(0);
  const FREE_LIMIT_EST = 5; 

  useEffect(() => {
    const loadUsage = () => {
        try {
            const stored = localStorage.getItem('veo_daily_usage');
            if (stored) {
                const { count, date } = JSON.parse(stored);
                const today = new Date().toDateString();
                if (date === today) {
                    setDailyUsage(count);
                } else {
                    localStorage.removeItem('veo_daily_usage');
                    setDailyUsage(0);
                }
            }
        } catch (e) {
            console.error("Error loading usage", e);
        }
    };
    loadUsage();
  }, []);

  useEffect(() => {
      if (error) setError(null);
  }, [prompt, aspectRatio, referenceImage]);

  const incrementUsage = () => {
      const newCount = dailyUsage + 1;
      setDailyUsage(newCount);
      localStorage.setItem('veo_daily_usage', JSON.stringify({
          count: newCount,
          date: new Date().toDateString()
      }));
  };

  const ensureApiKey = async () => {
    if ((window as any).aistudio?.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        if (has) return true;
        try { await (window as any).aistudio.openSelectKey(); return true; } catch {}
    }
    if (geminiService.hasApiKey()) return true;
    onRequireApiKey();
    return false;
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setError(null);
    setIsGenerating(true);
    setGeneratedVideoUrl(null);

    try {
        const hasKey = await ensureApiKey();
        if (!hasKey) { setIsGenerating(false); return; }

        let imageBase64 = undefined;
        if (referenceImage) {
            imageBase64 = await fileToBase64(referenceImage);
        }
        const url = await geminiService.generateVideo(prompt, aspectRatio, imageBase64, referenceImage?.type);
        setGeneratedVideoUrl(url);
        incrementUsage();
    } catch (err: any) {
        console.error(err);
        const msg = err.message || '';
        if (msg.includes("429") || msg.includes("Quota") || msg.includes("RESOURCE_EXHAUSTED")) {
            setError("⚠️ Daily Quota Exceeded. The video model limit has been reached for this API Key.");
        } else if (msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("Requested entity was not found")) {
            setError("⚠️ Permission Denied. You need to select a valid paid API key for Veo.");
            if ((window as any).aistudio?.openSelectKey) {
                try { await (window as any).aistudio.openSelectKey(); } catch {}
            }
        } else if (msg.includes("API Key")) {
            onRequireApiKey();
        } else {
            setError(msg || "Failed to generate video.");
        }
    } finally {
        setIsGenerating(false);
    }
  };

  const handleAnalyzeAction = async (actionType: 'viral_score' | 'trend' | 'hooks' | 'repurpose' | 'general') => {
      if (!analyzeFile && !analyzeUrl) return;
      setIsAnalyzing(true);
      setAnalysisResult('');
      setError(null);

      try {
          const hasKey = await ensureApiKey();
          if (!hasKey) { setIsAnalyzing(false); return; }

          let analysisContent = "";
          let systemPrompt = "";

          switch (actionType) {
              case 'viral_score':
                  systemPrompt = "Analyze this video content for Viral Potential. Score / 10. Explain score.";
                  break;
              case 'trend':
                  systemPrompt = "Does this video concept align with current social media trends? Identify trend.";
                  break;
              case 'hooks':
                  systemPrompt = "Extract the current hook and suggest 3 BETTER, more scroll-stopping alternatives.";
                  break;
              case 'repurpose':
                  systemPrompt = "Suggest a repurposing strategy: LinkedIn Post, Tweet Thread, Blog, Email.";
                  break;
              default:
                  systemPrompt = "Analyze this video. Summarize key points, sentiment, and speakers.";
          }

          if (analyzeFile) {
              const base64 = await fileToBase64(analyzeFile);
              analysisContent = await geminiService.analyzeContent(systemPrompt, base64, analyzeFile.type);
          } else if (analyzeUrl) {
              const urlPrompt = `Based on the concept of the video at this URL: ${analyzeUrl}\n\n${systemPrompt}`;
              analysisContent = await geminiService.generateText(urlPrompt, true);
          }
          setAnalysisResult(analysisContent);
      } catch (e: any) {
          setError("Analysis failed. Ensure the video file is supported or the URL is valid.");
          if (e.message?.includes("API Key")) onRequireApiKey();
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleNavigateToCopywriter = () => {
      if (!analysisResult) return;
      localStorage.setItem('videoAnalysisContext', analysisResult);
      onNavigateToCopywriter();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3"><Film className="w-8 h-8 text-pink-500" /> Video Studio</h2>
          <p className="text-slate-400 mt-2">Generate videos with Veo or analyze existing footage for viral insights.</p>
        </div>
      </header>

      <div className="flex gap-4 mb-6 border-b border-slate-700 pb-1">
        <button onClick={() => setMode('generate')} className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${mode === 'generate' ? 'border-pink-500 text-pink-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Generate (Veo) <span onClick={(e) => { e.stopPropagation(); onOpenUpgradeModal(); }} className="bg-yellow-500 text-black px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 cursor-pointer"><Crown className="w-2.5 h-2.5" /> PRO</span></button>
        <button onClick={() => setMode('analyze')} className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${mode === 'analyze' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Advanced Analysis</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm h-fit">
                {mode === 'generate' ? (
                    <>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Prompt</label>
                        <textarea className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-pink-500 focus:outline-none resize-none" placeholder="Describe your video..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                        <div className="mt-4"><label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label><div className="flex gap-2">{[VideoAspectRatio.LANDSCAPE, VideoAspectRatio.PORTRAIT].map((ratio) => (<button key={ratio} onClick={() => setAspectRatio(ratio)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${aspectRatio === ratio ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{ratio}</button>))}</div></div>
                        <div className="mt-4"><label className="block text-sm font-medium text-slate-300 mb-2">Reference Image (Optional)</label><div className="border-2 border-dashed border-slate-600 rounded-lg p-4 hover:border-pink-500 transition-colors cursor-pointer relative"><input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files && setReferenceImage(e.target.files[0])} /><div className="text-center">{referenceImage ? (<p className="text-green-400 text-sm truncate">{referenceImage.name}</p>) : (<><Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" /><span className="text-xs text-slate-400">Upload source image</span></>)}</div></div></div>

                        <div className="mt-6 mb-2">
                             <div className="flex items-center justify-between text-xs text-slate-400 mb-2"><span className="flex items-center gap-1"><BarChart className="w-3 h-3" /> Daily Generations</span><span className={dailyUsage >= FREE_LIMIT_EST ? "text-orange-400 font-bold" : "text-slate-300"}>{dailyUsage} / {FREE_LIMIT_EST} (Est.)</span></div>
                              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${dailyUsage >= FREE_LIMIT_EST ? 'bg-orange-500' : 'bg-pink-500'}`} style={{ width: `${Math.min((dailyUsage / FREE_LIMIT_EST) * 100, 100)}%` }}></div></div>
                        </div>

                        <button onClick={handleGenerate} disabled={isGenerating || !prompt} className="w-full mt-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg">
                            {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating (Wait...)</> : <><Video className="w-5 h-5" /> Generate Video</>}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-slate-300 mb-2">Analyze from URL</label><div className="relative"><Link className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" /><input type="text" placeholder="Paste a YouTube or Instagram URL" value={analyzeUrl} onChange={(e) => { setAnalyzeUrl(e.target.value); setAnalyzeFile(null); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-slate-200 focus:ring-1 focus:ring-indigo-500" /></div></div>
                            <div className="text-center text-xs text-slate-500 font-bold">OR</div>
                            <div><label className="block text-sm font-medium text-slate-300 mb-2">Upload Video to Analyze</label><div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors relative group"><input type="file" accept="video/*,image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => { if (e.target.files) { setAnalyzeFile(e.target.files[0]); setAnalyzeUrl(''); } }} />{analyzeFile ? (<div className="flex flex-col items-center text-indigo-400"><Film className="w-10 h-10 mb-2" /><p className="text-sm font-medium truncate max-w-[200px]">{analyzeFile.name}</p></div>) : (<div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-300"><Upload className="w-10 h-10 mb-2 transition-transform group-hover:scale-110" /><p className="text-sm">Upload Video / Reel</p></div>)}</div></div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Advanced Viral Insights</p>
                            <button onClick={() => handleAnalyzeAction('viral_score')} disabled={(!analyzeFile && !analyzeUrl) || isAnalyzing} className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-900 hover:bg-indigo-900/30 border border-slate-700 hover:border-indigo-500 transition-all text-left group disabled:opacity-50"><div className="bg-indigo-500/20 p-2 rounded-md group-hover:bg-indigo-500 group-hover:text-white transition-colors text-indigo-400"><TrendingUp className="w-4 h-4" /></div><div><h4 className="text-sm font-bold text-slate-200">Viral Potential Score</h4></div></button>
                            <button onClick={() => handleAnalyzeAction('hooks')} disabled={(!analyzeFile && !analyzeUrl) || isAnalyzing} className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-900 hover:bg-orange-900/30 border border-slate-700 hover:border-orange-500 transition-all text-left group disabled:opacity-50"><div className="bg-orange-500/20 p-2 rounded-md group-hover:bg-orange-500 group-hover:text-white transition-colors text-orange-400"><Sparkles className="w-4 h-4" /></div><div><h4 className="text-sm font-bold text-slate-200">Hook Extractor</h4></div></button>
                            <button onClick={() => handleAnalyzeAction('repurpose')} disabled={(!analyzeFile && !analyzeUrl) || isAnalyzing} className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-900 hover:bg-green-900/30 border border-slate-700 hover:border-green-500 transition-all text-left group disabled:opacity-50"><div className="bg-green-500/20 p-2 rounded-md group-hover:bg-green-500 group-hover:text-white transition-colors text-green-400"><Share2 className="w-4 h-4" /></div><div><h4 className="text-sm font-bold text-slate-200">Repurpose Strategy</h4></div></button>
                        </div>
                    </>
                )}

                {error && (
                    <div className={`mt-4 p-3 border rounded-lg text-xs flex flex-col items-start gap-2 ${error.includes("Quota") || error.includes("Limit") ? "bg-orange-900/30 border-orange-800 text-orange-200" : "bg-red-900/30 border-red-800 text-red-200"}`}>
                        <div className="flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span className="leading-snug font-medium">{error}</span></div>
                        {(error.includes("Quota") || error.includes("Limit") || error.includes("429")) && (
                             <div className="w-full mt-2 pl-6">
                                <button onClick={onRequireApiKey} className="px-3 py-1.5 bg-orange-700 hover:bg-orange-600 text-white text-xs font-bold rounded-md transition-colors shadow-sm flex items-center gap-1.5"><KeyRound className="w-3 h-3" /> Switch API Key</button>
                             </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="lg:col-span-8 bg-slate-900 rounded-xl border border-slate-800 flex flex-col min-h-[500px] relative overflow-hidden">
            {mode === 'generate' ? (
                <div className="flex-1 flex items-center justify-center p-4">
                    {generatedVideoUrl ? (
                        <div className="w-full flex flex-col items-center">
                            <video src={generatedVideoUrl} controls autoPlay loop className="max-h-[500px] w-auto rounded-lg shadow-2xl bg-black" onError={() => setError("Video playback failed. Try the Direct Link below.")} />
                            <div className="mt-4 flex gap-3"><a href={generatedVideoUrl} download="gemini_video.mp4" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-800 rounded text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"><Link className="w-4 h-4" /> Open Direct Link (New Tab)</a></div>
                        </div>
                    ) : (
                        <div className="text-center p-8">
                            {isGenerating ? (<div className="space-y-4"><Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto" /><p className="text-slate-400">Dreaming up your video with Veo...<br/>This takes about 60 seconds.</p></div>) : (<div className="space-y-2 opacity-50"><Film className="w-16 h-16 mx-auto text-slate-600" /><p className="text-slate-500 font-medium">Video Preview Area</p></div>)}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center"><h3 className="text-lg font-bold text-white flex items-center gap-2"><TrendingUp className="w-6 h-6 text-indigo-500" /> Analysis Results</h3>{analysisResult && !isAnalyzing && (<button onClick={handleNavigateToCopywriter} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in transition-transform hover:scale-105"><PenTool className="w-3 h-3" /> Create Viral Script</button>)}</div>
                    <div className="flex-1 bg-slate-950/50 rounded-lg overflow-y-auto custom-scrollbar p-6">{isAnalyzing ? (<div className="h-full flex flex-col items-center justify-center text-indigo-400 space-y-4"><Loader2 className="w-10 h-10 animate-spin" /><p className="text-sm animate-pulse">Gemini is analyzing...</p></div>) : analysisResult ? (<div className="prose prose-invert max-w-none prose-indigo"><ReactMarkdown>{analysisResult}</ReactMarkdown></div>) : (<div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50"><Search className="w-16 h-16 mb-4" /><p>Upload a video or paste a URL to start.</p></div>)}</div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default VideoStudio;
