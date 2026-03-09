
import React, { useState, useEffect } from 'react';
import { KeyRound, X, Save, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  
  useEffect(() => {
      if (isOpen) {
          // Load existing key if any
          const current = localStorage.getItem('GEMINI_API_KEY');
          if (current) setKey(current);
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
      if (!key.trim()) return;
      geminiService.setApiKey(key.trim());
      onClose();
      // Optional: Force reload or rely on reactive state updates in components
      alert("API Key saved securely! You can now use all features.");
  };

  const handleClear = () => {
      geminiService.setApiKey('');
      setKey('');
      alert("API Key removed from this device.");
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-500" />
                API Key Settings
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
            <p className="text-sm text-slate-400">
                To use Content Craft Studio in a live environment, please provide your own Google Gemini API Key. It will be stored securely in your browser's local storage.
            </p>

            <div className="relative">
                <input 
                    type={showKey ? "text" : "password"}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Paste your API Key here (starts with AIza...)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 pl-4 pr-12 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm"
                />
                <button 
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/10 p-2 rounded border border-green-900/30">
                <ShieldCheck className="w-4 h-4" />
                Keys are never sent to our servers. Direct to Google only.
            </div>

            <div className="pt-2 flex gap-3">
                <button 
                    onClick={handleSave}
                    disabled={!key}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                    <Save className="w-4 h-4" /> Save & Continue
                </button>
                {key && (
                    <button 
                        onClick={handleClear}
                        className="px-4 py-2.5 rounded-lg border border-red-900/50 text-red-400 hover:bg-red-900/20 text-xs font-bold transition-colors"
                    >
                        Clear Key
                    </button>
                )}
            </div>
            
            <div className="text-center">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline">
                    Get a free API Key from Google AI Studio &rarr;
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
