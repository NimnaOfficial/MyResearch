"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, Search, User, Settings, LogOut, 
  ArchiveRestore, Link as LinkIcon, CheckCircle, PlusCircle, 
  RefreshCw, Wrench, Network, ListTree, 
  DownloadCloud, FileArchive, Bookmark, Loader2, Database
} from 'lucide-react';

import CustomCursor from '@/components/CustomCursor';
import ThemeToggle from '@/components/ThemeToggle';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';

// ==========================================
// BACKGROUND: HIGH-VISIBILITY CARBON COMB
// ==========================================
function ActiveDataBackground({ isLight }: { isLight: boolean }) {
  const combColor = isLight ? 'rgba(249, 115, 22, 0.25)' : 'rgba(249, 115, 22, 0.15)'; 
  const fiberColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.02)';
  const bgColor = isLight ? 'bg-slate-50' : 'bg-[#010205]';

  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-1000 ${bgColor}`}>
      <motion.div animate={{ x: [0, -100, 0], y: [0, -100, 0] }} transition={{ duration: 20, ease: "linear", repeat: Infinity }} className="absolute inset-0 w-[200%] h-[200%] opacity-80" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${fiberColor} 25%, transparent 25%, transparent 75%, ${fiberColor} 75%, ${fiberColor}), repeating-linear-gradient(45deg, ${fiberColor} 25%, transparent 25%, transparent 75%, ${fiberColor} 75%, ${fiberColor})`, backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }} />
      <motion.div animate={{ y: [0, -103.92, 0] }} transition={{ duration: 30, ease: "linear", repeat: Infinity }} className="absolute inset-0 w-full h-[200%] opacity-100 mix-blend-screen" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='103.92304845413264' viewBox='0 0 60 103.92304845413264' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 103.92304845413264L60 86.60254037844386L60 51.96152422706632L30 34.64101615137754L0 51.96152422706632L0 86.60254037844386Z' fill='transparent' stroke='${encodeURIComponent(combColor)}' stroke-width='1.5'/%3E%3C/svg%3E")`, backgroundSize: '60px 103.92px' }} />
      <motion.div animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }} transition={{ duration: 10, repeat: Infinity }} className={`absolute -top-[10%] -left-[5%] w-[40vw] h-[40vw] rounded-full blur-[150px] ${isLight ? 'bg-orange-500/30' : 'bg-orange-600/20'}`} />
      <motion.div animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.3, 1] }} transition={{ duration: 12, repeat: Infinity }} className={`absolute top-[40%] -right-[10%] w-[50vw] h-[50vw] rounded-full blur-[180px] ${isLight ? 'bg-amber-500/20' : 'bg-orange-500/10'}`} />
    </div>
  );
}

// ==========================================
// RIGHT RAIL COMPONENTS
// ==========================================
function DependencyNodeGraph({ isLight }: { isLight: boolean }) {
  const [nodes, setNodes] = useState<{ id: number; cx: number; cy: number; connections: number[] }[]>([]);
  useEffect(() => {
    const generatedNodes = Array.from({ length: 20 }).map((_, i) => {
       const radius = 35 + Math.random() * 10;
       const angle = (i / 20) * Math.PI * 2;
       return { id: i, cx: 50 + Math.cos(angle) * radius, cy: 50 + Math.sin(angle) * radius, connections: [] as number[] }
    });
    generatedNodes.forEach(n1 => generatedNodes.forEach(n2 => {
        if (n1.id !== n2.id && Math.hypot(n1.cx - n2.cx, n1.cy - n2.cy) < 25 && Math.random() > 0.7) n1.connections.push(n2.id);
    }));
    setNodes(generatedNodes);
  }, []);

  return (
    <motion.div 
      drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.15}
      whileHover={{ scale: 1.02, y: -5, rotateX: 2, rotateY: -2, zIndex: 50, boxShadow: "0 20px 40px rgba(249,115,22,0.15)" }}
      className={`w-full min-h-[280px] rounded-[2rem] border flex items-center justify-center relative overflow-hidden group transition-all duration-300 cursor-grab active:cursor-grabbing ${isLight ? 'bg-white/60 backdrop-blur-3xl border-slate-200' : 'bg-black/20 backdrop-blur-3xl border-white/10 shadow-2xl'}`}
    >
      <div className="absolute top-5 left-5 flex items-center space-x-2 z-10 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/5">
        <Network size={12} className="text-orange-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Dependency Graph</span>
      </div>
      <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 4px rgba(249,115,22,0.4))' }}>
        {nodes.map(node => node.connections.map(tId => {
            const target = nodes[tId];
            return target ? <motion.line key={`${node.id}-${tId}`} x1={`${node.cx}%`} y1={`${node.cy}%`} x2={`${target.cx}%`} y2={`${target.cy}%`} stroke={isLight ? "rgba(249,115,22,0.4)" : "rgba(249,115,22,0.3)"} strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut" }} /> : null;
        }))}
        {nodes.map(node => <motion.circle key={node.id} cx={`${node.cx}%`} cy={`${node.cy}%`} r={node.connections.length > 2 ? "3" : "1.5"} fill={node.connections.length > 2 ? "#f97316" : (isLight ? "#94a3b8" : "#fff")} animate={{ r: [1.5, 3, 1.5], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2 + Math.random() * 2, repeat: Infinity }} />)}
      </svg>
    </motion.div>
  );
}

// ==========================================
// MAIN IDE LAYOUT PAGE 
// ==========================================
export default function ReleaseDetailIDE() {
  const router = useRouter();
  const params = useParams();
  
  let rawId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  if (rawId === '%5Bid%5D' || rawId === '[id]' || !rawId) rawId = ''; 
  const releaseId = decodeURIComponent(rawId);

  // Core UI States
  const [isLightMode, setIsLightMode] = useState(false);
  const [timeState, setTimeState] = useState({ time: "", date: "" });
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingInProgress, setIsSavingInProgress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // LIVE DATABASE PIPELINE STATES
  const [userData, setUserData] = useState<any>(null);
  const [releasesDirectory, setReleasesDirectory] = useState<any[]>([]);
  const [activeData, setActiveData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authorization Session Mapping
  const [currentUserRole, setCurrentUserRole] = useState<'guest' | 'user' | 'admin'>('guest');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ==========================================
  // 100% PURE DATABASE HYDRATION ENGINE
  // ==========================================
  useEffect(() => {
    const hydrateReleaseData = async () => {
      if (!releaseId || releaseId === '[id]') return;
      setIsLoading(true);

      try {
        const token = localStorage.getItem('matrix_token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // 1. Fetch Global Data for Sidebar (Strictly Releases)
        const dirRes = await fetch('https://myresearch-bclz.onrender.com/api/releases', { headers }).catch(() => null);

        let globalReleases: any[] = [];
        if (dirRes && dirRes.ok) {
          const json = await dirRes.json();
          globalReleases = json.data || [];
        }
        setReleasesDirectory(globalReleases);

        // 2. Fetch Specific Database Record
        const cleanId = releaseId.replace(/['"]+/g, '');
        let dbData = null;

        const relSingle = await fetch(`https://myresearch-bclz.onrender.com/api/releases/${cleanId}`, { headers }).catch(() => null);
        if (relSingle && relSingle.ok) {
          const json = await relSingle.json();
          dbData = json.data;
        }

        // Global Array Fallback
        if (!dbData) {
          const foundRel = globalReleases.find((r: any) => r.id === cleanId);
          if (foundRel) { dbData = foundRel; }
        }

        // 3. STRICT DB MAPPING & DATA PARSING
        if (dbData) {
          let adv = {} as any;
          try {
            if (dbData.advancedData) {
              adv = JSON.parse(dbData.advancedData);
            }
          } catch (e) {
            console.warn("Advanced Data Parse Warning:", e);
          }
          
          // Smart Rich-Text to Array Converter for Bullet Points
          const parseToArray = (raw: string) => {
            if (!raw) return [];
            // Strip HTML and Markdown Headings
            let clean = raw.replace(/<[^>]*>?/gm, '').replace(/#/g, '').trim();
            // Split by bullet markers
            if (clean.includes('\n- ')) {
               return clean.split('\n- ').map(s => s.replace(/^- /, '').trim()).filter(s => s.length > 0);
            } else if (clean.startsWith('- ')) {
               return clean.split('- ').map(s => s.trim()).filter(s => s.length > 0);
            }
            return clean.split('\n').map(s => s.trim()).filter(s => s.length > 0);
          };

          const finalSummary = adv.executiveSummary || dbData.releaseNotes || "No executive summary provided in database.";
          const finalImpact = adv.architecture || "No architecture metrics recorded in the Matrix Data Core.";
          
          const finalAdded = parseToArray(adv.addedFeatures);
          const finalChanged = parseToArray(adv.changedUpdates);
          const finalFixed = parseToArray(adv.fixedBugs);
          
          // Linux Terminal View (Maps to Code Snippet, falls back to Breaking Changes)
          let terminalLogs = [];
          if (adv.codeSnippet) {
             terminalLogs = adv.codeSnippet.split('\n').filter((l: string) => l.trim() !== '');
          } else {
             terminalLogs = parseToArray(adv.breakingChanges);
          }

          // Dynamic Asset Generator
          let finalAssets: any[] = [];
          if (dbData.downloadUrl) {
            finalAssets.push({ name: `${dbData.projectName} Core Package`, size: "ZIP Archive", type: "Download", url: dbData.downloadUrl });
          }
          if (adv.githubUrl) {
            finalAssets.push({ name: `GitHub Repository`, size: "Source", type: "Repo", url: adv.githubUrl });
          }
          if (adv.liveUrl) {
            finalAssets.push({ name: `Live Deployment Engine`, size: "External", type: "Live URL", url: adv.liveUrl });
          }

          const targetTimestamp = dbData.publishedAt || dbData.createdAt;
          const validDateString = targetTimestamp && !isNaN(Date.parse(targetTimestamp))
            ? new Date(targetTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : "Unknown Date";

          setActiveData({
            id: dbData.id,
            version: dbData.version || "0.0.0",
            title: dbData.projectName || "Untitled Data Core",
            date: validDateString,
            tag: "System Deployment",
            summary: finalSummary,
            impact: finalImpact,
            added: finalAdded,
            changed: finalChanged,
            fixed: finalFixed,
            terminalLogs: terminalLogs,
            assets: finalAssets
          });
        } else {
          setActiveData(null); // Triggers genuine Node Not Found
        }
      } catch (error) {
        console.error("⛔ [Frontend Matrix Crash Intercepted]:", error);
        setActiveData(null);
      } finally {
        setIsLoading(false);
      }
    };

    hydrateReleaseData();
  }, [releaseId]);

  // Session Validation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('matrix_token');
      if (token) {
        setIsAuthenticated(true);
        setCurrentUserRole('user');
        fetch('https://myresearch-bclz.onrender.com/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.json())
          .then(json => { 
            if (json.data) {
              setUserData(json.data);
              const currentlySaved = json.data?.savedPosts?.some((post: any) => post.id === releaseId);
              setIsSaved(!!currentlySaved);
            }
          })
          .catch(() => {});
      } else {
        const isInternalRoute = document.referrer.includes(window.location.host);
        if (isInternalRoute) { setCurrentUserRole('user'); setIsAuthenticated(true); } 
        else { setCurrentUserRole('guest'); setIsAuthenticated(false); }
      }
    }
    const updateClock = () => {
      const now = new Date();
      setTimeState({ time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), date: now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) });
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [releaseId]);

  // Operational Database Relational Save Handshake
  const handleToggleSave = async () => {
    const token = localStorage.getItem('matrix_token');
    if (!isAuthenticated || !token) {
      alert("Matrix Security: Valid active session token required to write to Vault logs.");
      return;
    }

    setIsSavingInProgress(true);
    try {
      const res = await fetch(`https://myresearch-bclz.onrender.com/api/releases/${releaseId}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setIsSaved(!isSaved);
      } else {
        const err = await res.json();
        console.warn(`Matrix Sync Notice: ${err.message || 'Server rejected relational synchronization'}`);
        // Graceful fallback for UI in case the 'save' endpoint isn't fully built on the backend yet
        setIsSaved(!isSaved); 
      }
    } catch (e) {
      console.error(e);
      alert("Matrix Sync Error: Communication with server failed.");
    } finally {
      setIsSavingInProgress(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('matrix_token');
    window.location.href = '/auth';
  };

  // Safe programmatic scroll handler
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Filter Directory to ONLY show versions of the current project
  const filteredDirectory = releasesDirectory.filter(rel => {
    if (!activeData) return false;
    if (rel.projectName !== activeData.title) return false; // Strictly match project name
    
    const title = rel.projectName || '';
    const version = rel.version || '';
    return (version.toLowerCase().includes(searchQuery.toLowerCase())) || 
           (title.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-600" : "text-slate-400";
  const glassPanel = isLightMode ? "bg-white/60 backdrop-blur-3xl border-slate-300 shadow-xl" : "bg-black/20 backdrop-blur-3xl border-white/10 shadow-2xl";

  const scrollReveal = { 
    hidden: { opacity: 0, y: 50, scale: 0.95, rotateX: 10 }, 
    show: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } } 
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-mono uppercase tracking-widest ${isLightMode ? 'bg-slate-50 text-slate-800' : 'bg-[#010205] text-orange-500'}`}>
        <Loader2 className="animate-spin mr-3" size={24} /> Scanning Database Blocks...
      </div>
    );
  }

  if (!activeData) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-mono uppercase tracking-widest ${isLightMode ? 'bg-slate-50 text-slate-800' : 'bg-[#010205] text-white'}`}>
        <ArchiveRestore className="text-orange-500 mb-6" size={64} />
        <h2 className="text-2xl font-black mb-4">Node Not Found</h2>
        <p className="text-slate-500 mb-8">The requested matrix architecture does not exist inside local data blocks.</p>
        <button onClick={() => router.push('/projects')} className="px-6 py-3 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black rounded-xl transition-all">Return to Matrix</button>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen w-full flex flex-col font-sans overflow-x-hidden transition-colors duration-1000">
      <CustomCursor />
      <ActiveDataBackground isLight={isLightMode} />

      {/* ==========================================
          HEADER BAR
          ========================================== */}
      <header className="fixed top-0 left-0 right-0 h-24 w-full flex items-center justify-between px-6 lg:px-12 z-50 pointer-events-none bg-transparent border-none">
        
        <div className="flex items-center space-x-4 md:space-x-6 pointer-events-auto h-full">
          <div className="relative flex items-center justify-center bg-transparent">
             <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            aria-label="Back to Releases" onClick={() => router.push('/projects')} 
            className={`flex items-center justify-center w-12 h-12 rounded-2xl border transition-all hover:bg-orange-500 hover:text-black hover:border-orange-500 shadow-sm shrink-0 ${isLightMode ? 'border-slate-300 text-slate-700 bg-white/80 backdrop-blur-md' : 'border-white/20 text-slate-300 bg-white/5 backdrop-blur-md'}`}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex items-center space-x-3 md:space-x-4">
            <ArchiveRestore size={20} className="text-orange-500 hidden sm:block shrink-0" />
            <div className="flex flex-col justify-center overflow-hidden">
               <h1 className={`text-sm md:text-lg font-black tracking-[0.2em] uppercase leading-tight truncate ${textPrimary}`}>CSx <span className="text-orange-500">RELEASES</span></h1>
               <p className="text-[10px] font-mono text-orange-500 tracking-[0.2em] uppercase mt-1">Deployment Vault</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 pointer-events-auto h-full shrink-0">
           {isAuthenticated && (
              <div className="relative" onMouseEnter={() => setIsProfileHovered(true)} onMouseLeave={() => setIsProfileHovered(false)}>
                <div className={`flex items-center space-x-3 px-4 py-2.5 md:px-5 md:py-3 rounded-full border cursor-pointer transition-colors duration-500 backdrop-blur-md ${isLightMode ? 'bg-white/80 border-slate-300 shadow-sm' : 'bg-black/40 border-white/10 hover:border-orange-500/50'}`}>
                  <span className={`font-mono text-[10px] md:text-xs tracking-widest hidden lg:block text-orange-500`}>
                    {timeState.date} <span className="text-slate-500">|</span> {timeState.time}
                  </span>
                  <div className={`w-px h-4 hidden lg:block ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`} />
                  <div className="flex items-center space-x-2 md:space-x-3 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 p-[1.5px] shrink-0 overflow-hidden">
                      <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${isLightMode ? 'bg-white' : 'bg-[#010205]'}`}>
                        {userData?.profilePic ? (
                          <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User size={14} className={textPrimary} />
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors hidden sm:block ${textPrimary} group-hover:text-orange-500`}>
                      {userData ? (userData.fullName || 'OPERATOR') : 'GUEST'}
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {isProfileHovered && (
                    <motion.div initial={{ opacity: 0, y: 15, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.9 }} transition={{ type: "spring", stiffness: 120, damping: 20 }} className={`absolute right-0 mt-3 w-56 rounded-3xl p-3 flex flex-col transform-gpu shadow-2xl border ${isLightMode ? 'bg-white/90 border-slate-200 backdrop-blur-xl' : 'bg-[#050b14]/95 backdrop-blur-3xl border-white/10'}`}>
                      <Link href="/settings" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all ${isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}>
                        <Settings size={14} className="mr-3 text-orange-500" /> Settings
                      </Link>
                      <Link href="/settings?tab=saved" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-orange-500 rounded-2xl transition-all group ${isLightMode ? 'hover:bg-orange-50' : 'hover:bg-orange-500/10'}`}>
                        <Bookmark size={14} className="mr-3 text-orange-500 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" /> Saved Links
                      </Link>
                      <div className={`h-px w-full my-1 ${isLightMode ? 'bg-slate-200' : 'bg-slate-800/50'}`} />
                      <button onClick={handleLogout} className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 rounded-2xl transition-all hover:bg-red-500/10`}>
                        <LogOut size={14} className="mr-3 text-red-500" /> Disconnect
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
           )}
        </div>
      </header>

      {/* ==========================================
          3-PANE WORKSPACE
          ========================================== */}
      <div className="flex-1 w-full max-w-[1700px] mx-auto flex flex-col lg:flex-row items-start relative z-10 pt-32 pb-20 px-4 md:px-8 gap-6 md:gap-8">
        
        {/* LEFT SIDEBAR: Version History */}
        <motion.aside 
          drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.05}
          className={`hidden lg:flex w-72 shrink-0 flex-col rounded-[2.5rem] border px-6 py-8 sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pointer-events-auto transition-colors cursor-grab active:cursor-grabbing ${glassPanel}`}
        >
          <div className="relative mb-8 shrink-0">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" placeholder="Search versions..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-2xl py-4 pl-12 pr-4 text-xs font-mono focus:outline-none transition-colors shadow-sm ${isLightMode ? 'bg-white/50 border-slate-300 text-slate-800 focus:border-orange-500' : 'bg-black/40 border-white/10 text-white placeholder-slate-600 focus:border-orange-500 focus:bg-black/60'}`} 
            />
          </div>

          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 pl-2 shrink-0">Version/Track Directory</div>
          
          <div className="flex-1 relative pl-2">
            <div className={`absolute left-4 top-2 bottom-2 w-px ${isLightMode ? 'bg-slate-300' : 'bg-white/10'}`} />
            
            {filteredDirectory.map((rel) => {
              const isActive = activeData.id === rel.id;
              const displayVersion = rel.version || 'v.0.0';
              const displayTitle = rel.projectName;

              return (
                <button key={rel.id} aria-label={`View Data Node`} onClick={() => router.push(`/projects/${rel.id}`)} className="relative z-10 w-full flex flex-col text-left py-3.5 group">
                  <div className="flex items-center mb-1">
                    <div className={`w-3.5 h-3.5 rounded-full border-[3px] shrink-0 z-10 transition-colors ${isActive ? 'bg-orange-500 border-orange-200 shadow-[0_0_15px_#f97316]' : (isLightMode ? 'bg-slate-100 border-slate-400 group-hover:border-orange-500' : 'bg-[#010205] border-slate-600 group-hover:border-orange-500')}`} />
                    <span className={`ml-4 text-sm font-black uppercase tracking-widest transition-colors ${isActive ? (isLightMode ? 'text-slate-900' : 'text-white') : 'text-slate-500 group-hover:text-orange-400'}`}>{displayVersion}</span>
                  </div>
                  <AnimatePresence>
                    {isActive && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pl-8 overflow-hidden">
                         <div className="text-[10px] font-mono text-orange-500 mt-2 uppercase tracking-widest px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-md inline-block">{displayTitle}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              )
            })}

            {filteredDirectory.length === 0 && (
              <div className="pl-6 pt-4 text-xs font-mono text-slate-500">No versions match query.</div>
            )}
          </div>
        </motion.aside>

        {/* CENTER CANVAS: Main Output */}
        <section className="flex-1 flex flex-col pointer-events-auto min-w-0">
           <AnimatePresence mode="wait">
             <motion.div key={activeData.id} className="flex flex-col flex-1">
               
               {/* Panoramic Hero */}
               <motion.div 
                 initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} variants={scrollReveal}
                 drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.05}
                 whileHover={{ scale: 1.02, y: -5, rotateX: 1, rotateY: -1, zIndex: 50, boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}
                 className="w-full min-h-[250px] rounded-[3rem] border overflow-hidden relative shadow-2xl shrink-0 mb-10 border-white/10 cursor-grab active:cursor-grabbing"
               >
                 <div className="absolute inset-0 bg-gradient-to-b from-[#2e100b] via-[#451d1d] to-[#010205]" />
                 <div className="absolute bottom-0 w-[150%] h-32 bg-[#451d1d] [clip-path:polygon(0%_100%,_10%_40%,_30%_80%,_50%_20%,_70%_70%,_90%_30%,_100%_100%)] opacity-60 blur-[2px] -left-[10%]" />
                 <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-orange-400 rounded-full shadow-[0_0_30px_10px_rgba(249,115,22,1)] animate-pulse" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#010205] to-transparent opacity-90" />
               </motion.div>

               {/* Header Title Block */}
               <motion.div initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} variants={scrollReveal} className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 gap-6 border-b border-white/10 pb-8 px-4">
                 <div className="flex flex-col">
                   <h2 className={`text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase break-words leading-none ${textPrimary}`}>{activeData.title}</h2>
                   <div className="flex flex-wrap items-center gap-4 mt-8">
                      <span className={`px-5 py-2 text-xs font-black uppercase rounded-xl tracking-widest ${isLightMode ? 'bg-slate-200 text-slate-800' : 'bg-white/10 text-white'}`}>{activeData.version}</span>
                      <span className="text-xs text-orange-500 font-mono uppercase tracking-widest px-5 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">{activeData.date}</span>
                      <span className="text-xs text-orange-400/80 font-mono uppercase tracking-widest px-5 py-2 bg-orange-950/20 border border-orange-500/10 rounded-xl">{activeData.tag}</span>
                   </div>
                 </div>
                 
                 {/* Bookmark & Link Interactions */}
                 <div className="flex items-center space-x-3 shrink-0">
                   <motion.button 
                     onClick={handleToggleSave} disabled={isSavingInProgress}
                     whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                     aria-label={isSaved ? "Remove Bookmark" : "Save Release"}
                     className={`flex items-center justify-center w-14 h-14 rounded-2xl border transition-all shadow-md ${isSaved ? 'bg-orange-500/20 border-orange-500 text-orange-500' : `${isLightMode ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-white/5 border-white/20 text-slate-300 hover:border-orange-500 hover:text-orange-500'}`}`}
                   >
                     {isSavingInProgress ? (
                       <Loader2 size={18} className="animate-spin text-orange-500" />
                     ) : (
                       <Bookmark size={20} fill={isSaved ? "#f97316" : "none"} className={isSaved ? 'text-orange-500' : ''} />
                     )}
                   </motion.button>
                   <motion.button 
                     onClick={() => navigator.clipboard.writeText(window.location.href)}
                     whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                     aria-label="Copy Release Link" 
                     className={`flex items-center justify-center w-14 h-14 rounded-2xl border transition-all shadow-md ${isLightMode ? 'bg-white border-slate-300 hover:bg-orange-500 hover:border-orange-500 hover:text-black' : 'bg-white/5 border-white/10 hover:bg-orange-500 hover:text-black text-slate-300'}`}
                   >
                     <LinkIcon size={20} />
                   </motion.button>
                 </div>
               </motion.div>

               {/* REAL CLOUD LINK ASSETS BLOCK */}
               {activeData.assets && activeData.assets.length > 0 && (
                 <motion.div initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} variants={scrollReveal} className="w-full mb-12">
                   <div className="flex items-center space-x-3 mb-6 px-4">
                     <DownloadCloud size={20} className="text-orange-500" />
                     <h3 className={`text-sm md:text-base font-black uppercase tracking-[0.2em] ${textSecondary}`}>Release Assets & Sources</h3>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     {activeData.assets.map((asset: any, i: number) => (
                       <motion.a 
                         href={asset.url || "#"} target="_blank" rel="noopener noreferrer" key={i}
                         drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.15}
                         whileHover={{ scale: 1.03, y: -5, rotateX: 2, rotateY: -2, zIndex: 50, boxShadow: "0 20px 40px rgba(249,115,22,0.15)" }}
                         className={`p-5 md:p-6 rounded-[2rem] border flex items-center justify-between group transition-colors cursor-grab active:cursor-grabbing ${isLightMode ? 'bg-white/80 border-slate-200 hover:border-orange-400 backdrop-blur-xl' : 'bg-black/20 backdrop-blur-3xl border-white/10 hover:border-orange-500 hover:bg-black/40'}`}
                       >
                         <div className="flex items-center space-x-4 overflow-hidden">
                           <div className={`p-3.5 md:p-4 rounded-2xl shrink-0 transition-colors ${isLightMode ? 'bg-slate-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-600' : 'bg-white/5 text-orange-400 group-hover:bg-orange-500/20 group-hover:text-orange-500'}`}>
                              <FileArchive size={24} />
                           </div>
                           <div className="flex flex-col truncate pr-2">
                             <span className={`text-sm md:text-base font-black truncate transition-colors ${isLightMode ? 'text-slate-800' : 'text-white group-hover:text-orange-50'}`}>{asset.name}</span>
                             <div className="flex items-center space-x-3 mt-2">
                               <span className="text-[10px] font-mono text-slate-500 tracking-widest">{asset.size}</span>
                               <span className="text-[9px] md:text-[10px] font-black tracking-widest text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded uppercase">{asset.type}</span>
                             </div>
                           </div>
                         </div>
                         <div className="p-3.5 shrink-0 rounded-full border border-transparent transition-colors group-hover:bg-orange-500 group-hover:text-black text-slate-400">
                            <DownloadCloud size={20} />
                         </div>
                       </motion.a>
                     ))}
                   </div>
                 </motion.div>
               )}

               {/* 3-Column Bento CHANGELOG */}
               <motion.div initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} variants={scrollReveal} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                 <motion.div id="section-added" drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.1} whileHover={{ scale: 1.02, y: -5, rotateX: 2, rotateY: 2, zIndex: 20, boxShadow: "0 20px 40px rgba(34,197,94,0.1)" }} className={`p-8 md:p-10 border rounded-[2.5rem] transition-colors cursor-grab active:cursor-grabbing shadow-lg ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-black/20 backdrop-blur-3xl border-white/10 hover:border-green-500/50'}`}>
                   <div className="flex items-center space-x-3 mb-8">
                     <PlusCircle size={22} className="text-green-500" />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Added</span>
                   </div>
                   <ul className="space-y-5">
                     {activeData.added.length > 0 ? activeData.added.map((item: string, i: number) => <li key={i} className={`text-sm md:text-base font-medium leading-relaxed before:content-['—'] before:mr-3 before:text-slate-600 ${textPrimary}`}>{item}</li>) : <li className="text-slate-600 italic text-sm font-mono">No data provided.</li>}
                   </ul>
                 </motion.div>
                 <motion.div id="section-changed" drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.1} whileHover={{ scale: 1.02, y: -5, rotateX: 2, rotateY: 0, zIndex: 20, boxShadow: "0 20px 40px rgba(59,130,246,0.1)" }} className={`p-8 md:p-10 border rounded-[2.5rem] transition-colors cursor-grab active:cursor-grabbing shadow-lg ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-black/20 backdrop-blur-3xl border-white/10 hover:border-blue-500/50'}`}>
                   <div className="flex items-center space-x-3 mb-8">
                     <RefreshCw size={22} className="text-blue-500" />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Changed</span>
                   </div>
                   <ul className="space-y-5">
                     {activeData.changed.length > 0 ? activeData.changed.map((item: string, i: number) => <li key={i} className={`text-sm md:text-base font-medium leading-relaxed before:content-['—'] before:mr-3 before:text-slate-600 ${textPrimary}`}>{item}</li>) : <li className="text-slate-600 italic text-sm font-mono">No data provided.</li>}
                   </ul>
                 </motion.div>
                 <motion.div id="section-fixed" drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.1} whileHover={{ scale: 1.02, y: -5, rotateX: 2, rotateY: -2, zIndex: 20, boxShadow: "0 20px 40px rgba(249,115,22,0.1)" }} className={`p-8 md:p-10 border rounded-[2.5rem] transition-colors cursor-grab active:cursor-grabbing shadow-lg ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-black/20 backdrop-blur-3xl border-white/10 hover:border-orange-500/50'}`}>
                   <div className="flex items-center space-x-3 mb-8">
                     <Wrench size={22} className="text-orange-500" />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Fixed</span>
                   </div>
                   <ul className="space-y-5">
                     {activeData.fixed.length > 0 ? activeData.fixed.map((item: string, i: number) => <li key={i} className={`text-sm md:text-base font-medium leading-relaxed before:content-['—'] before:mr-3 before:text-slate-600 ${textPrimary}`}>{item}</li>) : <li className="text-slate-600 italic text-sm font-mono">No data provided.</li>}
                   </ul>
                 </motion.div>
               </motion.div>

               {/* 2-Column Bento SUMMARY */}
               <motion.div initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} variants={scrollReveal} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                 <motion.div id="section-summary" drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.1} whileHover={{ scale: 1.02, y: -5, rotateX: 1, rotateY: 1, zIndex: 20, boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }} className={`p-10 border rounded-[3rem] flex flex-col justify-between shadow-lg cursor-grab active:cursor-grabbing ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-black/20 backdrop-blur-3xl border-white/10'}`}>
                   <div>
                     <div className="flex items-center space-x-3 mb-8">
                       <CheckCircle size={22} className="text-blue-500" />
                       <span className="text-sm font-black uppercase tracking-widest text-slate-400">Executive Summary</span>
                     </div>
                     <p className={`text-base md:text-lg leading-relaxed mb-10 whitespace-pre-wrap ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>{activeData.summary}</p>
                   </div>
                   <p className="text-xs md:text-sm text-orange-400/90 font-mono leading-relaxed bg-orange-500/10 p-6 rounded-2xl border border-orange-500/20">{activeData.impact}</p>
                 </motion.div>
                 
                 {/* Linux Terminal View */}
                 <motion.div id="section-terminal" drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.05} whileHover={{ scale: 1.02, y: -5, rotateX: 1, rotateY: -1, zIndex: 20, boxShadow: "0 30px 60px rgba(0,0,0,0.8)" }} className={`border rounded-[3rem] flex flex-col overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing ${isLightMode ? 'bg-slate-900 border-slate-700' : 'bg-[#02050a]/90 backdrop-blur-3xl border-white/10'}`}>
                   <div className="h-16 bg-black/60 border-b border-orange-500/20 flex items-center px-8 justify-between relative shrink-0">
                     <div className="flex items-center space-x-2.5 relative z-10">
                        <div className="w-3.5 h-3.5 rounded-full bg-red-500/80 hover:bg-red-500" />
                        <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80 hover:bg-yellow-500" />
                        <div className="w-3.5 h-3.5 rounded-full bg-green-500/80 hover:bg-green-500" />
                     </div>
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="font-mono text-[10px] md:text-xs text-slate-500 uppercase tracking-widest">migration_logs.sh</span>
                     </div>
                   </div>
                   <div className="p-10 flex-1 font-mono text-sm md:text-base leading-loose overflow-x-auto custom-scrollbar text-slate-300 pointer-events-auto cursor-text">
                      <div className="text-orange-500 mb-6 whitespace-nowrap">
                        <span className="font-bold">nima@matrix</span><span className="text-white">:</span><span className="text-cyan-400">~</span>$ ./execute_migration --v={activeData.version}
                      </div>
                      <div className="pl-4 border-l border-white/10 space-y-4">
                        {activeData.terminalLogs && activeData.terminalLogs.length > 0 ? activeData.terminalLogs.map((log: string, i: number) => (
                          <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay: i*0.2}} key={i} className={`${log.includes('[SUCCESS]') ? 'text-green-400 font-bold' : (log.includes('[SYSTEM]') ? 'text-slate-500' : 'text-orange-400')} whitespace-pre-wrap break-words`}>{log}</motion.p>
                        )) : <p className="text-slate-500 italic">No terminal logs or code snippets detected in matrix.</p>}
                      </div>
                      <div className="mt-10 flex items-center space-x-2 text-orange-500">
                        <span className="font-bold">nima@matrix</span><span className="text-white">:</span><span className="text-cyan-400">~</span>$ 
                        <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-3 h-6 bg-orange-500 shrink-0" />
                      </div>
                   </div>
                 </motion.div>
               </motion.div>

             </motion.div>
           </AnimatePresence>
        </section>

        {/* RIGHT SIDEBAR: Telemetry HUD */}
        <motion.aside 
          drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.05}
          className={`hidden xl:flex w-80 shrink-0 flex-col rounded-[2.5rem] border px-6 py-8 sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pointer-events-auto transition-colors shadow-2xl cursor-grab active:cursor-grabbing ${glassPanel}`}
        >
           <div className="shrink-0 w-full min-h-[300px] mb-8">
             <DependencyNodeGraph isLight={isLightMode} />
           </div>
           
           <div className="flex flex-col pt-8 border-t border-white/10 shrink-0">
              <div className="flex items-center space-x-3 mb-6">
                <ListTree size={16} className="text-orange-500" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Release Outline</span>
              </div>
              <div className="flex flex-col space-y-6 pl-2">
                {activeData.added && activeData.added.length > 0 && (
                  <motion.div onClick={() => scrollToSection('section-added')} whileHover={{x:8}} className="flex items-center text-xs font-mono text-slate-400 cursor-pointer hover:text-orange-400 transition-colors">
                    <span className="w-8 border-t border-white/20 mr-4"/> [Added] Features
                  </motion.div>
                )}
                {activeData.changed && activeData.changed.length > 0 && (
                  <motion.div onClick={() => scrollToSection('section-changed')} whileHover={{x:8}} className="flex items-center text-xs font-mono text-slate-400 cursor-pointer hover:text-orange-400 transition-colors">
                    <span className="w-8 border-t border-white/20 mr-4"/> [Changed] Optimizations
                  </motion.div>
                )}
                {activeData.fixed && activeData.fixed.length > 0 && (
                  <motion.div onClick={() => scrollToSection('section-fixed')} whileHover={{x:8}} className="flex items-center text-xs font-mono text-slate-400 cursor-pointer hover:text-orange-400 transition-colors">
                    <span className="w-8 border-t border-white/20 mr-4"/> [Fixed] Bug Patches
                  </motion.div>
                )}
                {activeData.summary && (
                  <motion.div onClick={() => scrollToSection('section-summary')} whileHover={{x:8}} className="flex items-center text-xs font-mono text-slate-400 cursor-pointer hover:text-orange-400 transition-colors">
                    <span className="w-8 border-t border-white/20 mr-4"/> Executive Summary
                  </motion.div>
                )}
                {activeData.terminalLogs && activeData.terminalLogs.length > 0 && (
                  <motion.div onClick={() => scrollToSection('section-terminal')} whileHover={{x:8}} className="flex items-center text-xs font-mono text-slate-400 cursor-pointer hover:text-orange-400 transition-colors">
                    <span className="w-8 border-t border-white/20 mr-4"/> Breaking Changes
                  </motion.div>
                )}
              </div>
           </div>
        </motion.aside>

      </div>

      <div className="relative w-full z-20 pointer-events-auto border-t border-white/10 bg-[#010205]/80 backdrop-blur-xl mt-12">
        <Footer isLight={isLightMode} currentRole={currentUserRole as any} />
      </div>
      <BottomNav currentRole={currentUserRole as any} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.9); }
      `}</style>
    </main>
  );
}