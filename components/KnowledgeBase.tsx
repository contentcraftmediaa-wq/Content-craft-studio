
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { BookOpen, FileText, BrainCircuit, Loader2 } from 'lucide-react';

interface KnowledgeBaseProps {
  onRequireApiKey: () => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onRequireApiKey }) => {
  const [content, setContent] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const checkKey = () => {
    if (!geminiService.hasApiKey()) {
        onRequireApiKey();
        return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!content || !checkKey()) return;
    setLoading(true);
    try {
        const prompt = `Act as an expert corporate trainer. Transform the provided SOP into a "Micro-Learning" Lesson Plan. FORMAT: Blog Style, Short Paragraphs, Numbered Lists. Required: Title, Objective, Process (Step-by-Step), Pro Tips, Quiz. CONTENT: ${content}`;
        const res = await geminiService.generateText(prompt, true);
        setOutput(res);
    } catch (e: any) {
        if (e.message?.includes("API Key")) onRequireApiKey();
        else setOutput("Error generating lesson plan.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col">
      <header className="mb-6"><h2 className="text-3xl font-bold text-white flex items-center gap-3"><BookOpen className="w-8 h-8 text-yellow-500" /> Knowledge Base & Training</h2><p className="text-slate-400 mt-2">Turn agency documents into crisp, step-by-step employee lessons.</p></header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-[600px]">
          <div className="flex flex-col h-full"><div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex-1 flex flex-col"><label className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-yellow-500" /> Paste SOP / Documentation</label><textarea className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-yellow-500 focus:outline-none resize-none mb-4 text-sm leading-relaxed" placeholder="Paste your agency process, guidelines, or rough notes here..." value={content} onChange={(e) => setContent(e.target.value)} /><button onClick={handleGenerate} disabled={!content || loading} className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white py-4 rounded-lg font-bold disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-yellow-900/20 transition-transform hover:scale-[1.02]">{loading ? <Loader2 className="animate-spin" /> : <BrainCircuit className="w-5 h-5" />} Generate Lesson Plan</button></div></div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 overflow-y-auto custom-scrollbar h-full">{output ? (<div className="prose prose-invert prose-lg prose-yellow max-w-none"><ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-6 leading-relaxed text-slate-300" {...props} />, h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white mb-6 pb-4 border-b border-slate-800" {...props} />, h2: ({node, ...props}) => <h2 className="text-xl font-bold text-yellow-400 mt-8 mb-4 flex items-center gap-2" {...props} />, li: ({node, ...props}) => <li className="mb-2 text-slate-300" {...props} />, ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-6 space-y-2" {...props} />, ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-6 space-y-2" {...props} />, strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} /> }}>{output}</ReactMarkdown></div>) : (<div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50"><div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse"><BrainCircuit className="w-10 h-10" /></div><p className="text-lg font-medium">Ready to train.</p><p className="text-sm">Paste content to generate a lesson.</p></div>)}</div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
