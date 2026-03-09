
import React, { useState } from 'react';
import { AppView } from './types';
import { 
  LayoutDashboard, PenTool, Image as ImageIcon, Video, Mic, Radio, 
  BarChart3, RefreshCw, BookOpen, Menu, X, ScanLine, BrainCircuit, 
  CalendarDays, Crown, Settings, ChevronRight, Bell, Search, Sparkles, Smartphone 
} from 'lucide-react';

// Views
import TextStudio from './components/TextStudio';
import ImageStudio from './components/ImageStudio';
import VideoStudio from './components/VideoStudio';
import AudioStudio from './components/AudioStudio';
import LiveSession from './components/LiveSession';
import AnalysisLab from './components/AnalysisLab';
import MediaTools from './components/MediaTools';
import KnowledgeBase from './components/KnowledgeBase';
import StrategyHub from './components/StrategyHub';
import ContentCalendar from './components/ContentCalendar';
import UpgradeModal from './components/UpgradeModal';
import ApiKeyModal from './components/ApiKeyModal';
import InstallPrompt from './components/InstallPrompt';

const ASSETS = {
  LOGO_ICON: '/cc-studio-logo.png',      
  LOGO_FULL: '/cc-studio-logo.png',  
  QR_CODE: '/qr-code.png'           
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isPro, setIsPro] = useState(() => localStorage.getItem('cc_studio_pro') === 'true');

  const handleOpenUpgradeModal = () => setIsUpgradeModalOpen(true);
  const handleOpenApiKeyModal = () => setIsApiKeyModalOpen(true);
  
  const handleUpgrade = () => {
    setIsPro(true);
    localStorage.setItem('cc_studio_pro', 'true');
    setIsUpgradeModalOpen(false);
    // Optional: Add a success toast or notification here if a toast system existed
  };

  const getViewTitle = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return 'Dashboard';
      case AppView.TEXT_STUDIO: return 'Copywriting Studio';
      case AppView.IMAGE_STUDIO: return 'Image Studio';
      case AppView.VIDEO_STUDIO: return 'Video Studio';
      case AppView.AUDIO_STUDIO: return 'Audio Studio';
      case AppView.LIVE_ASSISTANT: return 'Live Assistant';
      case AppView.STRATEGY_HUB: return 'Strategy Hub';
      case AppView.ANALYSIS_LAB: return 'Analysis Lab';
      case AppView.CALENDAR: return 'Content Calendar';
      case AppView.MEDIA_TOOLS: return 'Media Tools';
      case AppView.KNOWLEDGE_BASE: return 'Knowledge Base';
      default: return 'Content Craft Studio';
    }
  };

  const renderContent = () => {
    const commonProps = { 
        onOpenUpgradeModal: handleOpenUpgradeModal,
        onRequireApiKey: handleOpenApiKeyModal
    };

    // Pro access check
    const isProView = (view: AppView) => {
        return view === AppView.STRATEGY_HUB || view === AppView.VIDEO_STUDIO;
    };

    if (isProView(currentView) && !isPro) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-900/50 rounded-3xl border border-slate-800 animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 border border-yellow-500/20">
                    <Crown className="w-10 h-10 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Pro Feature Locked</h2>
                <p className="text-slate-400 max-w-md mb-8">
                    The {getViewTitle()} is exclusive to Pro members. Upgrade now to unlock advanced AI models and strategic tools.
                </p>
                <button 
                    onClick={handleOpenUpgradeModal}
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 text-black font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-orange-900/20 flex items-center gap-2"
                >
                    <Crown className="w-5 h-5" /> Upgrade to Pro
                </button>
                <button 
                    onClick={() => setCurrentView(AppView.DASHBOARD)}
                    className="mt-4 text-slate-500 hover:text-white transition-colors text-sm font-medium"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    switch (currentView) {
      case AppView.STRATEGY_HUB: return <StrategyHub onNavigateToCopywriter={() => setCurrentView(AppView.TEXT_STUDIO)} {...commonProps} />;
      case AppView.CALENDAR: return <ContentCalendar />;
      case AppView.TEXT_STUDIO: return <TextStudio {...commonProps} />;
      case AppView.IMAGE_STUDIO: return <ImageStudio {...commonProps} />;
      case AppView.VIDEO_STUDIO: return <VideoStudio onNavigateToCopywriter={() => setCurrentView(AppView.TEXT_STUDIO)} {...commonProps} />;
      case AppView.AUDIO_STUDIO: return <AudioStudio onRequireApiKey={handleOpenApiKeyModal} />;
      case AppView.LIVE_ASSISTANT: return <LiveSession />;
      case AppView.ANALYSIS_LAB: return <AnalysisLab onRequireApiKey={handleOpenApiKeyModal} onNavigateToCopywriter={() => setCurrentView(AppView.TEXT_STUDIO)} />;
      case AppView.MEDIA_TOOLS: return <MediaTools onRequireApiKey={handleOpenApiKeyModal} />;
      case AppView.KNOWLEDGE_BASE: return <KnowledgeBase onRequireApiKey={handleOpenApiKeyModal} />;
      case AppView.DASHBOARD:
      default:
        return (
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Section */}
            <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 p-8 md:p-12 mb-10 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <Sparkles className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
                        Create content that <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">moves the world.</span>
                    </h1>
                    <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                        Welcome to your AI-powered creative command center. 
                        Draft viral scripts, generate cinematic videos, and analyze market trends—all in one place.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button onClick={() => setCurrentView(AppView.TEXT_STUDIO)} className="px-6 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2">
                            <PenTool className="w-4 h-4" /> Start Writing
                        </button>
                        <button onClick={() => setCurrentView(AppView.VIDEO_STUDIO)} className="px-6 py-3 bg-slate-800 text-white font-bold rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors flex items-center gap-2">
                            <Video className="w-4 h-4" /> Create Video
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Strategic Planning */}
                <div className="col-span-full flex items-center gap-2 mb-2 mt-4">
                    <div className="h-px bg-slate-800 flex-1"></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Core Tools</span>
                    <div className="h-px bg-slate-800 flex-1"></div>
                </div>

                <DashboardCard 
                    icon={<BrainCircuit className="w-6 h-6 text-indigo-400"/>}
                    title="Strategy Hub"
                    desc="Deep market analysis & planning."
                    onClick={() => setCurrentView(AppView.STRATEGY_HUB)}
                    color="bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/50"
                    isPro
                />
                <DashboardCard 
                    icon={<PenTool className="w-6 h-6 text-orange-400"/>}
                    title="Copywriting"
                    desc="Viral scripts & blog posts."
                    onClick={() => setCurrentView(AppView.TEXT_STUDIO)}
                    color="bg-orange-500/10 border-orange-500/20 hover:border-orange-500/50"
                />
                <DashboardCard 
                    icon={<ImageIcon className="w-6 h-6 text-emerald-400"/>}
                    title="Image Studio"
                    desc="Generate & edit visuals."
                    onClick={() => setCurrentView(AppView.IMAGE_STUDIO)}
                    color="bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50"
                />
                <DashboardCard 
                    icon={<Video className="w-6 h-6 text-pink-400"/>}
                    title="Video Studio"
                    desc="Veo 3 video generation."
                    onClick={() => setCurrentView(AppView.VIDEO_STUDIO)}
                    color="bg-pink-500/10 border-pink-500/20 hover:border-pink-500/50"
                    isPro
                />

                <div className="col-span-full flex items-center gap-2 mb-2 mt-8">
                    <div className="h-px bg-slate-800 flex-1"></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Utilities & Live</span>
                    <div className="h-px bg-slate-800 flex-1"></div>
                </div>

                <DashboardCard 
                    icon={<BarChart3 className="w-6 h-6 text-fuchsia-400"/>}
                    title="Analysis Lab"
                    desc="Audit profiles & trends."
                    onClick={() => setCurrentView(AppView.ANALYSIS_LAB)}
                    color="bg-fuchsia-500/10 border-fuchsia-500/20 hover:border-fuchsia-500/50"
                />
                <DashboardCard 
                    icon={<CalendarDays className="w-6 h-6 text-green-400"/>}
                    title="Calendar"
                    desc="Manage scheduled content."
                    onClick={() => setCurrentView(AppView.CALENDAR)}
                    color="bg-green-500/10 border-green-500/20 hover:border-green-500/50"
                />
                <DashboardCard 
                    icon={<Radio className="w-6 h-6 text-white"/>}
                    title="Live Assistant"
                    desc="Real-time voice brainstorming."
                    onClick={() => setCurrentView(AppView.LIVE_ASSISTANT)}
                    color="bg-red-500/10 border-red-500/20 hover:border-red-500/50"
                />
                <DashboardCard 
                    icon={<Smartphone className="w-6 h-6 text-emerald-400"/>}
                    title="Mobile App Guide"
                    desc="How to install on your phone."
                    onClick={() => {
                        // We can just trigger the install prompt fallback instructions
                        const event = new CustomEvent('show-install-instructions');
                        window.dispatchEvent(event);
                    }}
                    color="bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50"
                />
            </div>
          </div>
        );
    }
  };

  const NavItem = ({ view, icon, label, isPro = false }: { view: AppView, icon: React.ReactNode, label: string, isPro?: boolean }) => (
    <button 
        onClick={() => { setCurrentView(view); setIsMobileMenuOpen(false); }}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group relative ${
            currentView === view 
            ? 'bg-gradient-to-r from-slate-800 to-slate-800/50 text-white shadow-lg border border-slate-700' 
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }`}
    >
        <div className="flex items-center gap-3">
            <span className={`transition-colors ${currentView === view ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{icon}</span>
            <span className="text-sm font-medium">{label}</span>
        </div>
        {currentView === view && <ChevronRight className="w-4 h-4 text-slate-500" />}
        {isPro && <Crown className="w-3 h-3 text-yellow-500 absolute top-3 right-3" />}
    </button>
  );

  return (
    <div className="flex h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-red-500/30 selection:text-white overflow-hidden">
      
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        onUpgrade={handleUpgrade}
        isPro={isPro}
      />
      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white">Cc</div>
             <span className="font-bold text-white">CcStudio</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2 hover:bg-slate-800 rounded-lg transition-colors">
              {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-[#0f1420] border-r border-slate-800/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
                    <span className="font-black text-white text-lg">Cc</span>
                </div>
                <div>
                    <h1 className="font-bold text-white leading-none">Content Craft</h1>
                    <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Studio v2.0</span>
                </div>
            </div>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
            
            {/* Group 1 */}
            <div>
                <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Create</h3>
                <div className="space-y-1">
                    <NavItem view={AppView.TEXT_STUDIO} icon={<PenTool className="w-5 h-5"/>} label="Copywriting" />
                    <NavItem view={AppView.IMAGE_STUDIO} icon={<ImageIcon className="w-5 h-5"/>} label="Image Gen" />
                    <NavItem view={AppView.VIDEO_STUDIO} icon={<Video className="w-5 h-5"/>} label="Video Gen" isPro />
                    <NavItem view={AppView.AUDIO_STUDIO} icon={<Mic className="w-5 h-5"/>} label="Audio & TTS" />
                </div>
            </div>

            {/* Group 2 */}
            <div>
                <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Agency Mind</h3>
                <div className="space-y-1">
                    <NavItem view={AppView.STRATEGY_HUB} icon={<BrainCircuit className="w-5 h-5"/>} label="Strategy Hub" isPro />
                    <NavItem view={AppView.CALENDAR} icon={<CalendarDays className="w-5 h-5"/>} label="Calendar" />
                    <NavItem view={AppView.ANALYSIS_LAB} icon={<BarChart3 className="w-5 h-5"/>} label="Analysis Lab" />
                    <NavItem view={AppView.MEDIA_TOOLS} icon={<RefreshCw className="w-5 h-5"/>} label="Media Tools" />
                    <NavItem view={AppView.KNOWLEDGE_BASE} icon={<BookOpen className="w-5 h-5"/>} label="Knowledge Base" />
                </div>
            </div>

            {/* Group 3 */}
            <div>
                <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Real-Time</h3>
                <div className="space-y-1">
                    <NavItem view={AppView.LIVE_ASSISTANT} icon={<Radio className="w-5 h-5"/>} label="Live Assistant" />
                </div>
            </div>

            {/* Install Prompt integrated */}
            <div className="px-2">
                 <InstallPrompt />
            </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/50 bg-[#0b0f19]/50">
             <button onClick={() => setCurrentView(AppView.DASHBOARD)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors w-full">
                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                     <LayoutDashboard className="w-4 h-4 text-slate-400" />
                 </div>
                 <div className="text-left">
                     <p className="text-xs font-bold text-white">Dashboard</p>
                     <p className="text-[10px] text-slate-500">Back to Home</p>
                 </div>
             </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden transition-all">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800/50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 z-20 mt-14 lg:mt-0">
           <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white hidden md:block">{getViewTitle()}</h2>
           </div>

           <div className="flex items-center gap-3">
               <div className="hidden md:flex items-center bg-slate-900 border border-slate-700 rounded-full px-4 py-1.5 gap-2">
                   <Search className="w-3 h-3 text-slate-500" />
                   <input type="text" placeholder="Search tools..." className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:ring-0 w-32" />
               </div>
               
               <div className="h-6 w-px bg-slate-800 mx-2 hidden md:block"></div>

               <button onClick={handleOpenApiKeyModal} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors" title="Settings & API Key">
                   <Settings className="w-5 h-5" />
               </button>
               
               <button 
                 onClick={handleOpenUpgradeModal} 
                 className={`${isPro ? 'bg-slate-800 text-yellow-500 border border-yellow-500/50' : 'bg-gradient-to-r from-yellow-500 to-orange-600 text-black'} px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-orange-900/20`}
               >
                   <Crown className="w-4 h-4" /> <span className="hidden sm:inline">{isPro ? 'Pro Member' : 'Upgrade Pro'}</span>
               </button>
           </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 relative scroll-smooth">
           {/* Subtle Background Elements */}
           <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none opacity-50"></div>
           
           <div className="relative z-10 max-w-[1600px] mx-auto">
                {renderContent()}
           </div>

           <footer className="mt-12 py-6 border-t border-slate-800/50 text-center">
               <p className="text-xs text-slate-600">
                   Content Craft Studio © 2025. Powered by Google Gemini.
               </p>
           </footer>
        </main>
      </div>
    </div>
  );
};

const DashboardCard = ({ icon, title, desc, onClick, color = "bg-slate-800 border-slate-700", className = '', isPro = false }: any) => (
    <button 
        onClick={onClick}
        className={`text-left p-6 rounded-2xl border transition-all duration-300 group relative overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 ${color} ${className}`}
    >
        {isPro && (
            <div className="absolute top-4 right-4 bg-yellow-500 text-black px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 z-20">
                <Crown className="w-3 h-3" />
            </div>
        )}
        <div className="w-12 h-12 rounded-xl bg-slate-950/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform backdrop-blur-sm border border-white/5">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-1 relative z-10">{title}</h3>
        <p className="text-sm text-slate-400 relative z-10 group-hover:text-slate-300 transition-colors">{desc}</p>
        
        {/* Hover Glow */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-all duration-500"></div>
    </button>
);

export default App;
