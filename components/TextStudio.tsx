import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { PenTool, Zap, Sparkles, Copy, Check, Settings2, Hash, LayoutTemplate, Target, AlignLeft, CalendarPlus, Edit3, FileText, ClipboardCheck, Crown, Lightbulb } from 'lucide-react';
import { SAMPLE_PROMPTS } from '../constants';
import { Tone, Platform, CalendarItem } from '../types';
import { Type } from '@google/genai';

type ContentType = 
  | 'General Post'
  | 'LinkedIn Personal Story' | 'LinkedIn Actionable Listicle' | 'LinkedIn Carousel Text' | 'LinkedIn Contrarian Take'
  | 'Instagram Reel POV Script' | 'Instagram Reel Educational Script' | 'Instagram Carousel (Slide-by-Slide)' | 'Instagram Story Sales Sequence' | 'Instagram Single Image Caption'
  | 'TikTok Viral Hook + Value Script' | 'TikTok Storytime Script' | 'TikTok Trending Audio Concept'
  | 'Twitter/X Value Thread' | 'Twitter/X Engagement Bait' | 'Twitter/X Short-Form Story'
  | 'YouTube High-Retention Script' | 'YouTube Shorts Script' | 'YouTube Video Title & Description (SEO)'
  | 'Facebook Group Value Post' | 'Facebook Ad Copy (Direct Response)' | 'Facebook Storytelling Post'
  | 'Email Newsletter (Value)' | 'Email Sales Sequence (Conversion)' | 'Email Subject Line Variations';

type ViralTemplate = 'AI Best Choice' | 'Hook-Value-CTA' | 'Problem-Agitate-Solve' | 'Storytelling' | 'Contrarian/Polarizing' | 'Educational Listicle' | 'AIDA (Attention-Interest-Desire-Action)' | 'BAB (Before-After-Bridge)' | 'PASO (Problem-Agitate-Solve-Outcome)';

interface GeneratedContent {
  hook_options?: string[];
  creative: string; 
  caption?: string; 
  strategy: string; 
  hashtags: string[];
  seoTags: string[];
  engagement_trigger?: string;
}

// Platform-Specific Viral Engineering Rules
const PLATFORM_RULES: Record<Platform, string> = {
  'LinkedIn': `
    LENGTH & PACING: 150-300 words. Read time: 1-2 minutes.
    FORMATTING: Use natural punctuation (.,) and double line breaks (\\n\\n) between thoughts. Max 1-2 sentences per paragraph to avoid walls of text.
    ALGORITHM BIAS: Favors dwell time and "see more" clicks.
    HOOK: Must create an information gap in the first 2 lines.
    CONTENT: Actionable frameworks, contrarian takes, or vulnerable stories.
    CTA: Ask a highly specific, polarizing question.
  `,
  'Instagram': `
    LENGTH & PACING: Captions: 100-150 words. Reels Script: 15-30 seconds (30-60 words).
    FORMATTING: Use natural line breaks (\\n\\n) to separate ideas. Use emojis naturally, not excessively.
    ALGORITHM BIAS: Favors Saves (Carousels) and Watch Time/Replays (Reels).
    REELS: Include [Visual Hook], [On-Screen Text], and [Spoken Audio].
    CAROUSELS: Slide 1 = Bold Claim. Slide 2 = Agitate. Slides 3-7 = Value. Slide 8 = Save/Share CTA.
    CAPTION: First 125 characters must be a hook. Use bullet points for readability.
  `,
  'TikTok': `
    LENGTH & PACING: Script duration: 15-34 seconds (40-80 words). Fast-paced, zero fluff.
    FORMATTING: Write exactly as it should be spoken. Use commas for natural pauses and periods for hard stops.
    ALGORITHM BIAS: 100% based on retention graph and completion rate.
    THE 3-SECOND RULE: Visual pattern interrupt + spoken hook challenging a belief.
    SCRIPTING: 1. Hook (0-3s) 2. Setup (3-7s) 3. Payoff (7-15s) 4. Loop/CTA.
    LANGUAGE: Native TikTok slang. Cut out all filler words.
    VISUALS: Include [Walking towards camera], [Pointing at text].
  `,
  'Twitter/X': `
    LENGTH & PACING: Single tweets: < 280 characters. Threads: 5-8 tweets.
    FORMATTING: Use line breaks (\\n\\n) within tweets. End sentences with periods. No rigid corporate speak.
    ALGORITHM BIAS: Favors replies, retweets, and time spent reading threads.
    THREADS: Tweet 1 = Ultimate Hook. Tweet 2 = Agitate. Tweets 3-7 = Value. Last Tweet = CTA.
    STYLE: Punchy, authoritative, and confident.
  `,
  'YouTube': `
    LENGTH & PACING: Shorts: 30-60 seconds (70-130 words). Long-form: 5-10 minutes (700-1500 words).
    FORMATTING: Write exactly as a human speaks to a camera. DO NOT use rigid bullet points, numbered lists, or overly formal structure. Use natural punctuation for the speaker's rhythm.
    ALGORITHM BIAS: Click-Through Rate (CTR) and Average View Duration (AVD).
    TITLES: Evoke curiosity or extreme benefit.
    HOOK (0-30s): State problem, prove solution, tease payoff.
    PACING: Write fluidly. Do not make it sound like an essay. Include subtle [B-Roll Idea] or [Visual] cues naturally, but keep the focus on the spoken word. Avoid robotic section headers.
  `,
  'Facebook': `
    LENGTH & PACING: 200-400 words. Read time: 2-3 minutes.
    FORMATTING: Conversational paragraphs (3-4 sentences). Use natural punctuation and line breaks.
    ALGORITHM BIAS: Favors meaningful social interactions (long comments) and shares.
    STYLE: Community-focused, relatable, emotional storytelling.
    VISUALS: Suggest an image type that pairs perfectly with the copy.
  `,
  'Email': `
    LENGTH & PACING: 200-350 words. Read time: 1.5-2 minutes.
    FORMATTING: Short paragraphs (1-3 sentences). Use line breaks (\\n\\n) to create a "slippery slope" reading experience.
    ALGORITHM BIAS: Deliverability, Open Rate, CTR.
    SUBJECT LINE: < 50 characters. Curiosity/urgency.
    BODY: Conversational, "Friendly Expert" tone.
    CTA: One single, unmissable link.
  `
};

const PLATFORM_CONTENT_TYPES: Record<Platform, ContentType[]> = {
  'LinkedIn': ['LinkedIn Actionable Listicle', 'LinkedIn Personal Story', 'LinkedIn Carousel Text', 'LinkedIn Contrarian Take', 'General Post'],
  'Instagram': ['Instagram Reel POV Script', 'Instagram Reel Educational Script', 'Instagram Carousel (Slide-by-Slide)', 'Instagram Story Sales Sequence', 'Instagram Single Image Caption'],
  'TikTok': ['TikTok Viral Hook + Value Script', 'TikTok Storytime Script', 'TikTok Trending Audio Concept'],
  'Twitter/X': ['Twitter/X Value Thread', 'Twitter/X Engagement Bait', 'Twitter/X Short-Form Story', 'General Post'],
  'YouTube': ['YouTube High-Retention Script', 'YouTube Shorts Script', 'YouTube Video Title & Description (SEO)'],
  'Facebook': ['Facebook Group Value Post', 'Facebook Ad Copy (Direct Response)', 'Facebook Storytelling Post', 'General Post'],
  'Email': ['Email Newsletter (Value)', 'Email Sales Sequence (Conversion)', 'Email Subject Line Variations']
};

interface TextStudioProps {
  onOpenUpgradeModal: () => void;
  onRequireApiKey: () => void;
}

const TextStudio: React.FC<TextStudioProps> = ({ onOpenUpgradeModal, onRequireApiKey }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usePro, setUsePro] = useState(false); 
  const [copied, setCopied] = useState(false);
  
  const [generatedData, setGeneratedData] = useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = useState<'creative' | 'strategy' | 'ready'>('creative');

  const [dmKeyword, setDmKeyword] = useState('GUIDE');
  const [includeHook, setIncludeHook] = useState(true);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [selectedSeoTags, setSelectedSeoTags] = useState<string[]>([]);

  const [tone, setTone] = useState<Tone>('Professional');
  const [platform, setPlatform] = useState<Platform>('LinkedIn');
  const [contentType, setContentType] = useState<ContentType>('General Post');
  const [template, setTemplate] = useState<ViralTemplate>('AI Best Choice');
  const [targetAudience, setTargetAudience] = useState('');
  const [customVoice, setCustomVoice] = useState('');
  const [referenceContent, setReferenceContent] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
      const strategyContext = localStorage.getItem('strategyContext');
      const videoContext = localStorage.getItem('videoAnalysisContext');
      
      if (videoContext) {
          setPrompt(`Based on this video analysis, generate a new viral script:\n\n${videoContext}`);
          setPlatform('Instagram');
          setContentType('Instagram Reel POV Script');
          setUsePro(true);
          localStorage.removeItem('videoAnalysisContext');
      } else if (strategyContext) {
          setPrompt(`Based on this strategy analysis, create a high-performing post:\n\n${strategyContext}`);
          setUsePro(true);
          localStorage.removeItem('strategyContext');
      }
  }, []);

  useEffect(() => {
      if (!PLATFORM_CONTENT_TYPES[platform].includes(contentType)) {
          setContentType(PLATFORM_CONTENT_TYPES[platform][0]);
      }
  }, [platform]);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    if (!geminiService.hasApiKey()) {
        onRequireApiKey();
        return;
    }

    setIsLoading(true);
    setGeneratedData(null);
    setActiveTab('creative');

    try {
        const platformViralRules = PLATFORM_RULES[platform] || "";
        
        const systemInstruction = `
        You are an ELITE 8-FIGURE DIRECT RESPONSE COPYWRITER and MASTER SOCIAL MEDIA STRATEGIST.
        Your goal is to generate content that ranks in the top 1% of engagement, retention, and conversion for ${platform}.
        
        VIRAL ENGINEERING RULES FOR ${platform}:
        ${platformViralRules}

        SPECIFIC FORMAT: ${contentType}
        TONE: ${tone}
        CUSTOM BRAND VOICE: ${customVoice || 'Adapt to the selected tone.'}
        FRAMEWORK: ${template === 'AI Best Choice' ? 'Dynamic Selection based on cognitive biases' : template}
        TARGET AUDIENCE: ${targetAudience || 'General audience'}

        UNIVERSAL VIRAL PSYCHOLOGY RULES:
        1. THE HOOK IS EVERYTHING: Spend 80% of your effort on the first sentence. It must break patterns, create a curiosity gap, or make a bold claim.
        2. NO FLUFF: Delete the first sentence if it's just a warm-up. Start in the middle of the action.
        3. RHYTHM & PACING: Write exactly like a human speaks. Use natural, conversational language. Use periods (.) and commas (,) naturally. Avoid robotic, overly structured, or repetitive sentence patterns.
        4. FORMATTING: DO NOT use rigid bullet point lists, numbered lists, or excessive bolding unless it is specifically a listicle format. DO NOT use corporate jargon. DO NOT use excessive emojis.
        5. LINE BREAKS: Use double line breaks (\\n\\n) frequently to separate thoughts and avoid walls of text. Make it easy to skim.
        6. AUTHENTICITY: The text must feel raw, authentic, and native to the platform. It should look like a real person wrote it from their phone, not an AI.

        CRITICAL INSTRUCTION:
        - DO NOT generate prompts, templates, or instructions on how to write.
        - YOU MUST generate the FINAL, READY-TO-PUBLISH content (the actual script, the actual caption, the actual post).
        - If the user asks for a script, write the actual script with dialogue, b-roll suggestions, and visual cues.
        - If the user asks for a carousel, write the actual text for each slide.
        - The "creative" field in your response MUST contain the final copy.
        - ALWAYS provide 3 highly optimized, distinct hook options in the hook_options array.
        - NEVER output rigid, formulaic text. Make the formatting flow naturally.
        `;

        const finalPrompt = `Topic/Goal: ${prompt}. \nTarget Audience: ${targetAudience || 'General Audience'}. \nReference Content to Model (Optional): ${referenceContent || 'None'}. \n\nWrite the actual, final ${contentType} for ${platform}. Make it scroll-stopping and ready to publish.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                hook_options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Provide 3 highly optimized, scroll-stopping hook variations (or Subject Lines for Email/Titles for YouTube) for this specific platform."
                },
                creative: {
                    type: Type.STRING,
                    description: "The actual generated content (caption, script, post, etc.) ready to be copied and pasted. MUST follow platform formatting perfectly."
                },
                caption: {
                    type: Type.STRING,
                    description: "A short social media caption, if applicable (e.g., for a video script)."
                },
                strategy: {
                    type: Type.STRING,
                    description: "A brief explanation of why this copy will perform well based on the platform's current algorithm."
                },
                hashtags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of relevant, high-reach hashtags."
                },
                seoTags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of SEO keywords for the platform's search engine."
                },
                engagement_trigger: {
                    type: Type.STRING,
                    description: "A specific question or call to action to encourage comments and algorithmic boosting."
                }
            },
            required: ["hook_options", "creative", "strategy", "hashtags", "seoTags"]
        };

        const jsonString = await geminiService.generateText(finalPrompt, usePro, systemInstruction, true, responseSchema);
        
        let parsed: GeneratedContent;
        try {
            const cleanJson = jsonString?.replace(/```json\n?|\n?```/g, '').trim();
            parsed = JSON.parse(cleanJson || '{}');
            
            if (!Array.isArray(parsed.hashtags)) parsed.hashtags = [];
            if (!Array.isArray(parsed.seoTags)) parsed.seoTags = [];
            if (!parsed.creative) parsed.creative = jsonString || "";

        } catch (e) {
            parsed = { 
                creative: jsonString || "Error parsing output.", 
                strategy: "Direct text generation fallback.", 
                hashtags: [], 
                seoTags: [] 
            };
        }

        setGeneratedData(parsed);
        setSelectedHashtags(parsed.hashtags || []);
        setSelectedSeoTags(parsed.seoTags || []);
        setActiveTab('ready');

    } catch (e: any) {
        console.error(e);
        alert("Error generating viral content. Please check your API key.");
    } finally {
        setIsLoading(false);
    }
  };

  const getAssembledContent = () => {
      if (!generatedData) return '';
      const parts = [];
      
      // Hook addition for short-form
      if (includeHook && dmKeyword) {
          parts.push(`👇 Comment '${dmKeyword.toUpperCase()}' below and I'll send you the full details instantly!`);
          parts.push('---');
          parts.push('');
      }

      parts.push(generatedData.creative);
      parts.push('');

      if (generatedData.engagement_trigger) {
          parts.push('---');
          parts.push(`💬 ${generatedData.engagement_trigger}`);
          parts.push('');
      }

      if (selectedSeoTags.length > 0) {
          parts.push(`Keywords: ${selectedSeoTags.join(', ')}`);
          parts.push('');
      }
      if (selectedHashtags.length > 0) {
          parts.push(selectedHashtags.join(' '));
      }
      return parts.join('\n');
  };

  const handleCopy = () => {
      const textToCopy = activeTab === 'ready' ? getAssembledContent() : generatedData?.creative;
      if (!textToCopy) return;
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCalendar = () => {
      if (!generatedData) return;
      const finalContent = getAssembledContent();
      const newItem: CalendarItem = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          platform: platform,
          contentType: contentType,
          topic: prompt.substring(0, 50) + '...',
          content: finalContent,
          status: 'Approved',
          hashtags: selectedHashtags
      };
      const existing = localStorage.getItem('contentCalendar');
      const items = existing ? JSON.parse(existing) : [];
      items.push(newItem);
      localStorage.setItem('contentCalendar', JSON.stringify(items));
      alert("Optimized creative saved to your Content Calendar!");
  };

  const toggleHashtag = (tag: string) => {
    if (selectedHashtags.includes(tag)) {
        setSelectedHashtags(prev => prev.filter(t => t !== tag));
    } else {
        setSelectedHashtags(prev => [...prev, tag]);
    }
  };

  return (
    <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
      <div className="lg:col-span-12 mb-2">
        <header>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <PenTool className="w-8 h-8 text-orange-500" />
                Copywriting Studio
            </h2>
            <p className="text-slate-400 mt-2">Platform-specific viral engineering with Gemini 3 Pro.</p>
        </header>
      </div>

      <div className="lg:col-span-3 xl:col-span-3 space-y-6">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg">
             <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                 <h3 className="text-base font-bold text-white flex items-center gap-2"><Settings2 className="w-4 h-4 text-orange-400" /> Viral Settings</h3>
                 <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
                     <button onClick={() => setUsePro(false)} className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${!usePro ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500'}`}>FAST</button>
                     <button onClick={() => { setUsePro(true); onOpenUpgradeModal(); }} className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all relative ${usePro ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500'}`}>PRO <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-black p-0.5 rounded-full"><Crown className="w-2.5 h-2.5"/></div></button>
                 </div>
             </div>

             <div className="space-y-4 mb-6">
                 <div>
                     <label className="block text-xs font-bold text-slate-400 mb-2">Target Platform</label>
                     <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500">
                        <option value="LinkedIn">LinkedIn (Authority)</option>
                        <option value="Instagram">Instagram (Visuals/Captions)</option>
                        <option value="TikTok">TikTok (Viral Hooks)</option>
                        <option value="Twitter/X">Twitter/X (Threads/Engagement)</option>
                        <option value="YouTube">YouTube (SEO/Scripts)</option>
                        <option value="Facebook">Facebook (Community)</option>
                        <option value="Email">Email (CTR Optimization)</option>
                     </select>
                 </div>
                 
                 <div>
                     <label className="block text-xs font-bold text-slate-400 mb-2">Content Type</label>
                     <select value={contentType} onChange={(e) => setContentType(e.target.value as ContentType)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500">
                        {PLATFORM_CONTENT_TYPES[platform].map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                     </select>
                 </div>

                 <div>
                     <label className="block text-xs font-bold text-slate-400 mb-2">Psychological Tone</label>
                     <select value={tone} onChange={(e) => setTone(e.target.value as Tone)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500">
                        <option value="Professional">Professional & Authoritative</option>
                        <option value="Viral/Edgy">Viral, Edgy & Bold</option>
                        <option value="Witty">Witty, Fun & Relatable</option>
                        <option value="Urgent">Urgent & Conversion-Focused</option>
                        <option value="Empathetic">Empathetic & Community-Driven</option>
                     </select>
                 </div>

                 <div>
                     <label className="block text-xs font-bold text-slate-400 mb-2">Creative Framework</label>
                     <select value={template} onChange={(e) => setTemplate(e.target.value as ViralTemplate)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500">
                        <option value="AI Best Choice">Auto-Select Best Framework</option>
                        <option value="Hook-Value-CTA">Hook-Value-CTA (Standard)</option>
                        <option value="Problem-Agitate-Solve">Problem-Agitate-Solve (Sales)</option>
                        <option value="PASO (Problem-Agitate-Solve-Outcome)">PASO (Advanced Sales)</option>
                        <option value="AIDA (Attention-Interest-Desire-Action)">AIDA (Classic Direct Response)</option>
                        <option value="BAB (Before-After-Bridge)">BAB (Transformation)</option>
                        <option value="Storytelling">Personal Storytelling (Trust)</option>
                        <option value="Contrarian/Polarizing">Contrarian (Viral/Debate)</option>
                        <option value="Educational Listicle">Educational Listicle (Value)</option>
                     </select>
                 </div>
             </div>
             
             <div className="space-y-4 mb-6">
                 <div>
                     <label className="block text-xs font-bold text-slate-400 mb-2">Target Audience (Optional)</label>
                     <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g. B2B SaaS Founders, Fitness Beginners..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500" />
                 </div>
                 
                 <div>
                     <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs font-bold text-orange-500 hover:text-orange-400 flex items-center gap-1 mb-2 transition-colors">
                         {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                     </button>
                     
                     {showAdvanced && (
                         <div className="space-y-4 p-4 bg-slate-950/50 border border-slate-800 rounded-lg mb-4 animate-in fade-in slide-in-from-top-2">
                             <div>
                                 <label className="block text-xs font-bold text-slate-400 mb-2">Custom Brand Voice</label>
                                 <input type="text" value={customVoice} onChange={(e) => setCustomVoice(e.target.value)} placeholder="e.g. Sarcastic but helpful, use Gen-Z slang..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500" />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-slate-400 mb-2">Reference Content (Model this)</label>
                                 <textarea value={referenceContent} onChange={(e) => setReferenceContent(e.target.value)} placeholder="Paste a viral post here to model its structure..." className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none text-sm" />
                             </div>
                         </div>
                     )}
                 </div>

                 <div>
                     <label className="block text-xs font-bold text-slate-400 mb-2">Main Topic or Product</label>
                     <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="What are we promoting today?" className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none text-sm" />
                 </div>
             </div>

             <button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-4 rounded-lg transition-all shadow-lg disabled:opacity-50 flex justify-center items-center gap-2">
                 {isLoading ? 'Engineering Virality...' : 'Generate Viral Creative'} {!isLoading && <Zap className="w-5 h-5" />}
             </button>
        </div>
      </div>

      <div className="lg:col-span-9 xl:col-span-9">
        <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col shadow-2xl overflow-hidden min-h-[600px]">
            <div className="flex border-b border-slate-800 bg-slate-900/50">
                <button onClick={() => setActiveTab('ready')} disabled={!generatedData} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'ready' ? 'text-white border-b-2 border-green-500 bg-slate-800/50' : 'text-slate-500 opacity-60'}`}><ClipboardCheck className="w-4 h-4" /> Final Post</button>
                <button onClick={() => setActiveTab('strategy')} disabled={!generatedData} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'strategy' ? 'text-white border-b-2 border-purple-500 bg-slate-800/50' : 'text-slate-500 opacity-60'}`}><Lightbulb className="w-4 h-4" /> Strategy</button>
                <button onClick={() => setActiveTab('creative')} disabled={!generatedData} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'creative' ? 'text-white border-b-2 border-orange-500 bg-slate-800/50' : 'text-slate-500 opacity-60'}`}><FileText className="w-4 h-4" /> Raw Text</button>
            </div>

            <div className="p-6 flex-1 bg-slate-950/30">
                {generatedData ? (
                    <>
                        {activeTab === 'ready' && (
                            <div className="flex flex-col gap-4 h-full">
                                {generatedData.hook_options && generatedData.hook_options.length > 0 && (
                                    <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 shadow-inner animate-in fade-in slide-in-from-top-2">
                                        <h4 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2"><Zap className="w-4 h-4"/> 3 Scroll-Stopping Hooks (Pick Your Favorite)</h4>
                                        <ul className="space-y-3">
                                            {generatedData.hook_options.map((hook, i) => (
                                                <li key={i} className="text-sm text-slate-200 flex gap-3 items-start bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 hover:border-orange-500/30 transition-colors">
                                                    <span className="text-orange-500/70 font-mono font-bold mt-0.5">{i+1}.</span> 
                                                    <span className="leading-relaxed">{hook}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-800">
                                    <div className="flex flex-col gap-3">
                                        <label className="text-sm font-bold text-slate-300 flex items-center gap-2 cursor-pointer w-fit">
                                          <input type="checkbox" checked={includeHook} onChange={e => setIncludeHook(e.target.checked)} className="rounded text-orange-500 focus:ring-0 w-4 h-4"/> 
                                          Enable Viral DM Comment-Hook
                                        </label>
                                        {includeHook && (
                                            <div className="flex flex-wrap items-center gap-2 pl-6 animate-in slide-in-from-top-1">
                                                <span className="text-sm text-slate-400 whitespace-nowrap">👇 Comment</span>
                                                <input type="text" value={dmKeyword} onChange={e => setDmKeyword(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm text-white w-32 text-center font-mono uppercase font-bold tracking-wide"/>
                                                <span className="text-sm text-slate-400">for the link!</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-px bg-slate-700/50 my-3"></div>
                                    <div className="flex flex-wrap gap-2">
                                        {generatedData.hashtags.map(tag => (
                                          <button key={tag} onClick={() => toggleHashtag(tag)} className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${selectedHashtags.includes(tag) ? 'bg-blue-900 border-blue-500 text-blue-200' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>{tag}</button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex-1 flex flex-col relative">
                                    <textarea value={getAssembledContent()} readOnly className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-xl p-6 text-slate-200 focus:outline-none font-mono text-base leading-loose min-h-[400px]" />
                                    <button onClick={handleCopy} className={`absolute top-4 right-4 px-4 py-2 rounded-md text-sm font-bold transition-colors flex items-center gap-2 shadow-lg ${copied ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'}`}>{copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy for {platform}</>}</button>
                                </div>
                                <button onClick={handleAddToCalendar} className="bg-green-700 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold shadow-lg flex justify-center items-center gap-2 mt-2">
                                    <CalendarPlus className="w-5 h-5" /> Schedule to Content Calendar
                                </button>
                            </div>
                        )}
                        {activeTab === 'strategy' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                                    <h4 className="text-purple-400 font-bold mb-4 flex items-center gap-2 text-lg"><Zap className="w-5 h-5"/> Viral Strategy</h4>
                                    <div className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap">{generatedData.strategy}</div>
                                </div>
                                {generatedData.engagement_trigger && (
                                  <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                                      <h4 className="text-blue-400 font-bold mb-4 flex items-center gap-2 text-lg"><Target className="w-5 h-5"/> Engagement Trigger</h4>
                                      <div className="text-slate-300 text-base leading-relaxed">{generatedData.engagement_trigger}</div>
                                  </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'creative' && (
                            <div className="h-full flex flex-col"><textarea readOnly value={generatedData.creative} className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-xl p-6 text-slate-400 focus:outline-none font-mono text-sm leading-relaxed opacity-80" /></div>
                        )}
                    </>
                ) : (
                    <div className="min-h-[500px] flex flex-col items-center justify-center text-slate-600 opacity-50">
                         {isLoading ? (<div className="text-center"><div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div><p className="text-lg">Engineering viral magic for {platform}...</p></div>) : (<><div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6"><Edit3 className="w-12 h-12 text-slate-500" /></div><p className="text-xl font-medium">Select your platform & start creating.</p></>)}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TextStudio;