
import React, { useState } from 'react';
import { geminiService, fileToBase64 } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Video, FileVideo, Download, RefreshCw, Youtube, Instagram, Loader2, CheckCircle2, Upload, Settings, AlertTriangle, Globe } from 'lucide-react';

interface MediaToolsProps {
  onRequireApiKey: () => void;
}

const MediaTools: React.FC<MediaToolsProps> = ({ onRequireApiKey }) => {
  const [activeTab, setActiveTab] = useState<'repurpose' | 'downloader'>('repurpose');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [repurposeResult, setRepurposeResult] = useState('');
  const [url, setUrl] = useState('');
  const RAPID_API_KEY = '34341a1536mshcc228898d87f90cp1d68d8jsn8f5fed00bb9b';
  const RAPID_API_HOST = 'snap-video3.p.rapidapi.com';
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'fetching' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRepurpose = async () => {
      if (!videoFile) return;
      if (!geminiService.hasApiKey()) { onRequireApiKey(); return; }

      setIsProcessing(true);
      setRepurposeResult('');
      try {
          const base64 = await fileToBase64(videoFile);
          const prompt = "Watch this video content. 1. Transcribe the key points. 2. Write a catchy Instagram Caption. 3. Write 3 Tweets (X Posts) summarizing it. 4. Suggest a blog post title.";
          const result = await geminiService.analyzeContent(prompt, base64, videoFile.type);
          setRepurposeResult(result);
      } catch (e: any) {
          console.error(e);
          if (e.message?.includes("API Key")) onRequireApiKey();
          else setRepurposeResult("Failed to process video.");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDownloadVideo = async () => {
      if (!url) return;
      setDownloadStatus('fetching');
      setErrorMessage('');
      const isSocialUrl = url.includes('youtube.com') || url.includes('youtu.be') || url.includes('instagram.com') || url.includes('tiktok.com');

      try {
          let downloadUrl = url;
          const filename = `video_${Date.now()}.mp4`;

          if (isSocialUrl) {
              const apiUrl = `https://${RAPID_API_HOST}/download`;
              const formData = new URLSearchParams();
              formData.append('url', url);

              const response = await fetch(apiUrl, {
                  method: 'POST',
                  headers: { 'x-rapidapi-key': RAPID_API_KEY, 'x-rapidapi-host': RAPID_API_HOST, 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: formData
              });

              if (!response.ok) throw new Error(`API Error ${response.status}`);
              const data = await response.json();
              
              if (typeof data === 'string' && data.startsWith('http')) downloadUrl = data;
              else if (data?.link) downloadUrl = data.link;
              else if (data?.download) downloadUrl = data.download;
              else if (Array.isArray(data) && data[0]?.link) downloadUrl = data[0].link;
              else if (data?.data?.downlink) downloadUrl = data.data.downlink;
              else if (data?.url) downloadUrl = data.url;
              else throw new Error('Could not find a valid video link.');
          }

          try {
              const res = await fetch(downloadUrl);
              if (!res.ok) throw new Error(`Failed to fetch video file directly.`);
              const blob = await res.blob();
              const videoBlob = new Blob([blob], { type: 'video/mp4' });
              const blobUrl = window.URL.createObjectURL(videoBlob);
              const a = document.createElement('a'); a.href = blobUrl; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(blobUrl);
          } catch (fetchErr) {
              window.open(downloadUrl, '_blank');
          }
          setDownloadStatus('done');
      } catch (error: any) {
          console.error("Download Error:", error);
          setDownloadStatus('error');
          setErrorMessage(error.message || "Download failed.");
      }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8"><h2 className="text-3xl font-bold text-white flex items-center gap-3"><RefreshCw className="w-8 h-8 text-blue-500" /> Media Tools</h2><p className="text-slate-400 mt-2">Repurpose content and manage assets.</p></header>
      <div className="flex gap-4 mb-6"><button onClick={() => setActiveTab('repurpose')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'repurpose' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Video Repurposer</button><button onClick={() => setActiveTab('downloader')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'downloader' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Asset Downloader</button></div>
      {activeTab === 'repurpose' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="bg-slate-800 p-6 rounded-xl border border-slate-700"><h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Video className="w-4 h-4" /> Upload Source Video</h3><div className="border-2 border-dashed border-slate-600 rounded-lg p-8 mb-6 text-center hover:border-blue-500 transition-colors relative"><input type="file" accept="video/*" onChange={(e) => e.target.files && setVideoFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />{videoFile ? (<div className="flex flex-col items-center text-green-400"><FileVideo className="w-8 h-8 mb-2" /><p className="text-sm">{videoFile.name}</p></div>) : (<div className="flex flex-col items-center text-slate-400"><Upload className="w-8 h-8 mb-2" /><p className="text-sm">Upload Reel / Short Video</p></div>)}</div><button onClick={handleRepurpose} disabled={!videoFile || isProcessing} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex justify-center gap-2 disabled:opacity-50">{isProcessing ? <Loader2 className="animate-spin" /> : <RefreshCw className="w-5 h-5" />} Generate Captions & Tweets</button></div><div className="bg-slate-900 rounded-xl border border-slate-800 p-6 h-[500px] overflow-y-auto">{repurposeResult ? (<div className="prose prose-invert max-w-none"><ReactMarkdown>{repurposeResult}</ReactMarkdown></div>) : (<div className="h-full flex flex-col items-center justify-center text-slate-600"><p>AI Output will appear here</p></div>)}</div></div>)}
      {activeTab === 'downloader' && (<div className="max-w-2xl mx-auto bg-slate-800 p-8 rounded-xl border border-slate-700 text-center"><h3 className="text-xl font-bold text-white mb-2">Universal Media Downloader</h3><p className="text-slate-400 text-sm mb-6">Download assets from YouTube, Instagram, or TikTok instantly.</p><div className="flex gap-2 mb-8"><div className="relative flex-1"><input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste YouTube or Instagram URL here..." className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div><button onClick={handleDownloadVideo} disabled={!url || downloadStatus === 'fetching'} className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2">{downloadStatus === 'fetching' ? <Loader2 className="animate-spin w-5 h-5"/> : <Download className="w-5 h-5" />} Download</button></div>{downloadStatus === 'error' && (<div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4 flex items-start gap-3 text-left mb-6 animate-in fade-in"><AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /><div><h4 className="text-red-400 font-bold text-sm">Download Failed</h4><p className="text-red-300/70 text-xs mt-1 leading-relaxed">{errorMessage}</p></div></div>)}{downloadStatus === 'done' && (<div className="bg-green-900/20 border border-green-900/50 rounded-lg p-4 flex items-center gap-4 text-left animate-in slide-in-from-bottom-2"><div className="bg-green-500/20 p-3 rounded-full"><CheckCircle2 className="w-6 h-6 text-green-500" /></div><div><h4 className="text-green-400 font-bold">Download Started</h4><p className="text-green-400/70 text-xs">Your file should appear in your downloads shortly.</p></div></div>)}<div className="flex justify-center gap-8 text-slate-500 mt-8"><div className="flex flex-col items-center gap-2 opacity-50"><Youtube className="w-8 h-8" /><span className="text-xs">YouTube</span></div><div className="flex flex-col items-center gap-2 opacity-50"><Instagram className="w-8 h-8" /><span className="text-xs">Instagram</span></div></div></div>)}
    </div>
  );
};

export default MediaTools;
