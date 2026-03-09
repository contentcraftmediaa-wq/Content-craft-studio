import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Smartphone, Share, PlusSquare, MoreVertical, X, ExternalLink } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [hasDismissedBanner, setHasDismissedBanner] = useState(false);
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    // Check if running in an iframe (like the AI Studio preview)
    setInIframe(window.self !== window.top);

    // 1. Check if already installed/standalone
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };
    
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    // 2. Check for iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Check for Global Deferred Prompt (Fix for Race Condition)
    if ((window as any).deferredPrompt) {
        console.log("Found global deferred prompt in component");
        setDeferredPrompt((window as any).deferredPrompt);
    }

    // 4. Listen for future install events
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Update global just in case
      (window as any).deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleShowInstructions = () => setShowInstructions(true);
    window.addEventListener('show-install-instructions', handleShowInstructions);

    // Check if banner was dismissed
    const dismissed = localStorage.getItem('dismissedInstallBanner');
    if (dismissed) {
        setHasDismissedBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('show-install-instructions', handleShowInstructions);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
        // Trigger native prompt
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
            setDeferredPrompt(null);
            (window as any).deferredPrompt = null;
            setHasDismissedBanner(true);
        }
    } else {
        // Fallback: Show instructions (iOS, Native prompt unavailable, or in iframe)
        setShowInstructions(true);
    }
  };

  const dismissBanner = () => {
      localStorage.setItem('dismissedInstallBanner', 'true');
      setHasDismissedBanner(true);
  };

  // Do not render if already installed
  if (isStandalone) return null;

  return (
    <>
        <button 
            onClick={handleInstallClick}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 mb-3"
        >
            <Download className="w-5 h-5" /> Install App
        </button>

        {typeof document !== 'undefined' && createPortal(
            <>
                {!hasDismissedBanner && (
                    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-800 border border-emerald-500/30 rounded-2xl p-4 z-50 flex flex-col gap-3 shadow-2xl shadow-emerald-900/20 animate-in slide-in-from-bottom-10">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold shadow-inner">Cc</div>
                                <div>
                                    <p className="font-bold text-white text-sm">Install Content Craft</p>
                                    <p className="text-xs text-slate-400">Add to home screen for faster access and full-screen mode.</p>
                                </div>
                            </div>
                            <button onClick={dismissBanner} className="text-slate-500 hover:text-white transition-colors p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <button onClick={handleInstallClick} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" /> Install Now
                        </button>
                    </div>
                )}

                {showInstructions && (
                    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-6 relative shadow-2xl animate-in zoom-in-95">
                            <button onClick={() => setShowInstructions(false)} className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Smartphone className="w-6 h-6 text-emerald-500" /> Install CcStudio
                            </h3>
                            
                            {inIframe ? (
                                <div className="space-y-4 text-slate-300 text-sm">
                                    <p>You are currently viewing the app inside a preview window. To install the app to your device, you must first open it in a new tab.</p>
                                    <button 
                                        onClick={() => window.open(window.location.href, '_blank')} 
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 mt-4"
                                    >
                                        <ExternalLink className="w-5 h-5" /> Open in New Tab
                                    </button>
                                </div>
                            ) : isIOS ? (
                                <div className="space-y-4 text-slate-300 text-sm">
                                    <p>To install on your iPhone or iPad:</p>
                                    <ol className="space-y-4 list-decimal pl-4">
                                        <li>Tap the <span className="inline-flex items-center gap-1 font-bold text-white px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700"><Share className="w-3 h-3" /> Share</span> button in your browser bar.</li>
                                        <li>Scroll down and tap <span className="inline-flex items-center gap-1 font-bold text-white px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700"><PlusSquare className="w-3 h-3" /> Add to Home Screen</span>.</li>
                                        <li>Tap <span className="font-bold text-white">Add</span> in the top right.</li>
                                    </ol>
                                </div>
                            ) : (
                                <div className="space-y-4 text-slate-300 text-sm">
                                    <p>To install on Android or Desktop:</p>
                                     <ol className="space-y-4 list-decimal pl-4">
                                        <li>Tap the <span className="inline-flex items-center gap-1 font-bold text-white px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700"><MoreVertical className="w-3 h-3" /> Menu</span> button (three dots).</li>
                                        <li>Tap <span className="inline-flex items-center gap-1 font-bold text-white px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700"><Download className="w-3 h-3" /> Install App</span> or <strong>Add to Home Screen</strong>.</li>
                                    </ol>
                                </div>
                            )}
                            
                            {!inIframe && (
                                <button onClick={() => setShowInstructions(false)} className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-bold transition-colors">
                                    Got it
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </>,
            document.body
        )}
    </>
  );
};

export default InstallPrompt;