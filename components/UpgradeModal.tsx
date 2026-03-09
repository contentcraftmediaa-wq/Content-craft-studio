
import React from 'react';
import { X, CheckCircle, Zap, Sparkles, BrainCircuit } from 'lucide-react';

// Corrected Asset Path for the new silver logo
const ASSETS = {
  LOGO_FULL: '/cc-studio-logo.png', 
};

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  isPro: boolean;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade, isPro }) => {
  if (!isOpen) return null;

  const FeatureRow = ({ feature, free, pro }: { feature: string; free: string; pro: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-700/50">
      <div className="text-slate-300 text-sm">{feature}</div>
      <div className="text-center text-slate-400 text-sm">{free}</div>
      <div className="text-center text-yellow-400 font-bold text-sm flex items-center justify-center gap-1">{pro}</div>
    </div>
  );

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 text-center">
          <img 
            src={ASSETS.LOGO_FULL} 
            alt="CcStudio Logo" 
            className="h-16 mx-auto mb-6"
            onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                    const fallback = document.createElement('h3');
                    fallback.className = "text-2xl font-bold text-white mb-6";
                    fallback.innerText = "CcStudio";
                    parent.prepend(fallback);
                }
            }}
          />
          <h2 className="text-3xl font-bold text-white mb-2">Unlock Your Full Creative Potential</h2>
          <p className="text-slate-400 max-w-md mx-auto">Go Pro to access unlimited generations, advanced AI models, and strategic planning tools.</p>
        </div>

        <div className="px-8 pb-8">
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="font-bold text-slate-500 text-xs uppercase tracking-wider">Feature</div>
                    <div className="text-center font-bold text-slate-500 text-xs uppercase tracking-wider">Free Plan</div>
                    <div className="text-center font-bold text-yellow-400 text-xs uppercase tracking-wider">Pro Plan</div>
                </div>

                <FeatureRow 
                    feature="Daily Generations"
                    free="2 per day"
                    pro={<>Unlimited <CheckCircle className="w-4 h-4 text-green-500" /></>}
                />
                <FeatureRow 
                    feature="Standard AI Models"
                    free="Included"
                    pro={<>Included <CheckCircle className="w-4 h-4 text-green-500" /></>}
                />
                 <FeatureRow 
                    feature="Advanced Models (Veo, Gemini 3 Pro)"
                    free="-"
                    pro={<>Included <Sparkles className="w-4 h-4 text-purple-400" /></>}
                />
                <FeatureRow 
                    feature="Strategic Thinking Mode"
                    free="-"
                    pro={<>Included <BrainCircuit className="w-4 h-4 text-indigo-400" /></>}
                />
            </div>
        </div>

        <div className="p-8 bg-slate-900/50 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <p className="text-4xl font-bold text-white">{isPro ? 'Pro Active' : '₹599'} <span className="text-lg font-medium text-slate-400">{isPro ? '' : '/ month'}</span></p>
                <p className="text-xs text-slate-500">{isPro ? 'Thank you for your support!' : 'Billed monthly. Cancel anytime.'}</p>
            </div>
            <button 
                onClick={isPro ? onClose : onUpgrade}
                className={`w-full sm:w-auto ${isPro ? 'bg-slate-700 text-slate-300' : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black'} font-bold px-10 py-4 rounded-lg shadow-lg hover:scale-105 transition-transform`}
            >
                {isPro ? 'Close' : 'Upgrade Now & Go Pro'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
