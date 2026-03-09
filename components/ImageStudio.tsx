
import React, { useState } from 'react';
import { ImageAspectRatio, ImageSize } from '../types';
import { geminiService, fileToBase64 } from '../services/geminiService';
import { MODEL_IMAGE_GEN_FREE, MODEL_IMAGE_GEN_PAID } from '../constants';
import { Image as ImageIcon, Wand2, Download, Layers, Loader2, Upload, Palette, AlertCircle, Check, Sparkles, Zap, X, Crown } from 'lucide-react';

const STYLES = ["None", "Photorealistic", "Hyper Realistic", "100% Real", "Natural", "Cinematic", "Movie Look", "Rich / Luxury", "Well Dressed", "Anime", "Cyberpunk", "Oil Painting", "Minimalist", "Studio Lighting"];
const EDIT_TEMPLATES = ["Remove the background", "Make the background transparent", "Change the background to a futuristic cityscape", "Apply a vintage, retro film filter", "Make this a professional product shot on a white background", "Add a small, cute cat wearing a party hat in the corner", "Turn this into a black and white fine art photograph"];

interface ImageStudioProps {
  onOpenUpgradeModal: () => void;
  onRequireApiKey: () => void;
}

const ImageStudio: React.FC<ImageStudioProps> = ({ onOpenUpgradeModal, onRequireApiKey }) => {
  const [tab, setTab] = useState<'generate' | 'edit'>('generate');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>(ImageAspectRatio.SQUARE);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [usePaidModel, setUsePaidModel] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.ONE_K);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setEditImage(file);
        const reader = new FileReader();
        reader.onload = (ev) => setEditPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    }
  };

  const toggleStyle = (style: string) => {
      if (style === 'None') { setSelectedStyles([]); return; }
      if (selectedStyles.includes(style)) setSelectedStyles(selectedStyles.filter(s => s !== style));
      else setSelectedStyles([...selectedStyles, style]);
  };

  const handleAction = async () => {
    if (!prompt) return;
    
    // Check Key
    if (!geminiService.hasApiKey()) {
        if ((window as any).aistudio?.openSelectKey) {
             try { await (window as any).aistudio.openSelectKey(); } catch {}
        } else {
             onRequireApiKey();
             return;
        }
    }

    setLoading(true);
    setResultImages([]);
    setError(null);

    try {
        let images: string[] = [];
        const model = usePaidModel ? MODEL_IMAGE_GEN_PAID : MODEL_IMAGE_GEN_FREE;

        if (tab === 'generate') {
            let finalPrompt = prompt;
            if (selectedStyles.length > 0) finalPrompt = `${prompt}. Styles: ${selectedStyles.join(', ')}.`;
            if (usePaidModel) finalPrompt += ` ${imageSize} resolution, ultra detailed, masterpiece.`
            images = await geminiService.generateImage(finalPrompt, aspectRatio, model, usePaidModel ? imageSize : undefined);
        } else {
            if (!editImage || !editPreview) return;
            const base64 = await fileToBase64(editImage);
            images = await geminiService.editImage(base64, editImage.type, prompt, model);
        }
        setResultImages(images);
    } catch (err: any) {
        console.error("Image operation failed", err);
        const errorMessage = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
        if (errorMessage.includes("API Key") || errorMessage.includes("403")) onRequireApiKey();
        else setError(errorMessage);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      <header className="mb-8"><h2 className="text-3xl font-bold text-white flex items-center gap-3"><ImageIcon className="w-8 h-8 text-emerald-500" /> Image Studio</h2><p className="text-slate-400 mt-2">Create stunning visuals or edit existing photos using natural language.</p></header>
      <div className="flex gap-4 mb-6 border-b border-slate-700 pb-1"><button onClick={() => { setTab('generate'); setResultImages([]); setError(null); }} className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${tab === 'generate' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Generate</button><button onClick={() => { setTab('edit'); setResultImages([]); setError(null); }} className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${tab === 'edit' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Edit</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        <div className="lg:col-span-4 xl:col-span-3 bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit shadow-lg">
            <div className="mb-6"><div className="flex items-center justify-between mb-2"><label className="block text-xs font-bold text-slate-400">Model Selection</label>{!usePaidModel && <span className="text-xs text-yellow-400">2 generations / day</span>}</div><div className="p-1 bg-slate-950 rounded-lg border border-slate-800 flex items-center"><button onClick={() => setUsePaidModel(false)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-colors ${!usePaidModel ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}><Zap className="w-3 h-3 text-yellow-400" /> Nano Banana 2.5 (Free)</button><button onClick={() => { setUsePaidModel(true); onOpenUpgradeModal(); }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-md transition-colors relative ${usePaidModel ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}><Sparkles className="w-3 h-3 text-purple-400" /> Nano Banana 3 (Paid)<div className="absolute -top-2 -right-2 bg-yellow-500 text-black p-0.5 rounded-full"><Crown className="w-3 h-3"/></div></button></div></div>
            {tab === 'edit' && (<div className="mb-6"><label className="block text-sm font-medium text-slate-300 mb-2">Upload Image to Edit</label><div className="border-2 border-dashed border-slate-600 rounded-lg p-8 hover:border-blue-500 transition-colors text-center relative overflow-hidden group"><input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />{editPreview ? (<img src={editPreview} alt="To Edit" className="max-h-48 mx-auto rounded shadow-md" />) : (<><Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" /><span className="text-sm text-slate-400">Click to upload</span></>)}</div></div>)}
            <label className="block text-sm font-bold text-slate-300 mb-2">{tab === 'generate' ? 'Image Prompt' : 'Edit Instruction'}</label><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-6 resize-none text-base" placeholder={tab === 'generate' ? "A futuristic city with flying cars..." : "Add a retro filter, remove the background..."} />
            {tab === 'edit' && (<div className="mb-6"><label className="block text-xs font-bold text-slate-400 mb-2">Quick Edits</label><div className="flex flex-wrap gap-2">{EDIT_TEMPLATES.map(template => (<button key={template} onClick={() => setPrompt(template)} className="px-3 py-1.5 text-xs rounded-md border bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors">{template}</button>))}</div></div>)}
            {tab === 'generate' && (<><div className="mb-6"><label className="block text-xs font-bold text-slate-400 mb-2 flex items-center gap-2"><Palette className="w-3 h-3"/> Style Presets (Select Multiple)</label><div className="flex flex-wrap gap-2">{STYLES.map(s => (<button key={s} onClick={() => toggleStyle(s)} className={`px-3 py-1.5 text-xs rounded-md border transition-colors flex items-center gap-1 ${ (s === 'None' && selectedStyles.length === 0) || selectedStyles.includes(s) ? 'bg-emerald-900/40 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>{s}{selectedStyles.includes(s) && <Check className="w-3 h-3" />}</button>))}</div></div><div className="grid grid-cols-2 gap-4 mb-6"><div><label className="block text-xs font-bold text-slate-400 mb-2">Aspect Ratio</label><select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as ImageAspectRatio)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500">{Object.values(ImageAspectRatio).map(r => <option key={r} value={r}>{r}</option>)}</select></div>{usePaidModel && (<div className="animate-in fade-in duration-300"><label className="block text-xs font-bold text-slate-400 mb-2">Quality</label><select value={imageSize} onChange={(e) => setImageSize(e.target.value as ImageSize)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500">{Object.values(ImageSize).map(s => <option key={s} value={s}>{s}</option>)}</select></div>)}</div></>)}
            <button onClick={handleAction} disabled={loading || !prompt || (tab === 'edit' && !editImage)} className={`w-full py-4 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] ${tab === 'generate' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-900/20' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-900/20'}`}>{loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Wand2 className="w-5 h-5" />}{tab === 'generate' ? 'Generate Image' : 'Apply Edits'}</button>
            {error && (<div className="mt-4 p-3 bg-red-900/30 border border-red-800 text-red-200 rounded-lg text-xs flex items-start gap-2 animate-in fade-in"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span className="leading-snug">{error}</span></div>)}
        </div>
        <div className="lg:col-span-8 xl:col-span-9 bg-slate-900 rounded-xl border border-slate-800 p-8 flex flex-col items-center justify-center min-h-[600px] relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
            {loading ? (<div className="text-center text-emerald-400 space-y-4 animate-pulse"><Loader2 className="w-12 h-12 animate-spin mx-auto"/><p>Crafting your masterpiece...</p></div>) : resultImages.length > 0 ? (<div className="w-full h-full flex flex-col items-center justify-center relative z-10 gap-6">{resultImages.map((img, idx) => (<div key={idx} className="flex flex-col items-center gap-4"><button onClick={() => setLightboxImage(img)} className="block rounded-lg overflow-hidden shadow-2xl border border-slate-700 max-w-full cursor-zoom-in hover:border-emerald-500 transition-colors"><img src={img} alt={`Generated ${idx}`} className="max-w-full max-h-[600px] object-contain" /></button><a href={img} download={`gemini-creation-${Date.now()}.png`} className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg"><Download className="w-5 h-5" /> Download Image</a></div>))}</div>) : (<div className="text-center opacity-30 relative z-10"><div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700"><Layers className="w-12 h-12 text-slate-500" /></div><p className="text-2xl font-medium text-slate-300">Results will appear here</p><p className="text-slate-500 mt-2">Ready to create a masterpiece.</p></div>)}
        </div>
      </div>
      {lightboxImage && (<div onClick={() => setLightboxImage(null)} className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-in fade-in cursor-zoom-out"><img src={lightboxImage} alt="Enlarged view" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default" onClick={(e) => e.stopPropagation()} /><button className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" title="Close"><X className="w-8 h-8" /></button></div>)}
    </div>
  );
};

export default ImageStudio;
