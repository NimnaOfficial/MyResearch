"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, Search, User, Settings, LogOut, 
  ArchiveRestore, Link as LinkIcon, CheckCircle, PlusCircle, 
  RefreshCw, Wrench, Activity, Rss, Network, ListTree, 
  Terminal as TerminalIcon, DownloadCloud, FileArchive, FileCode, Monitor, FileText, Bookmark
} from 'lucide-react';

import CustomCursor from '@/components/CustomCursor';
import ThemeToggle from '@/components/ThemeToggle';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';

// ==========================================
// MOCK RELEASES DATABASE 
// ==========================================
const RELEASES_DB: Record<string, any> = {
  "v2.4.0": {
    id: "v2.4.0",
    version: "2.4.0",
    title: "Spatial API & Generative Models",
    date: "May 27, 2026",
    tag: "Major Core Update",
    summary: "This release fundamentally rewrites the core generative pipeline. We have successfully bridged the Gemini API and local LLMs directly into the active production environment. The spatial animation engine has been decoupled from the React render cycle to eliminate layout thrashing, ensuring strict 144fps locks across the ecosystem.",
    impact: "Users querying the AI models or engaging with video/photo generation tools will experience an 84% reduction in inference latency. Hardware acceleration is mandatory.",
    added: [
      "Gemini API generative endpoints",
      "Framer Motion physics engine integration",
      "Automated video editing render pipeline"
    ],
    changed: [
      "Node.js server routing protocols via FNM",
      "Optimized MySQL query payloads"
    ],
    fixed: [
      "Memory leak during spatial component unmounting",
      "Stripe payment gateway webhook drops"
    ],
    breaking: [
      "[SYSTEM] Analyzing deprecated nodes...",
      "> Legacy DOM nodes strictly recycled.",
      "> Deprecated legacy PHP 7 endpoints.",
      "> Ensure WebGL2 context is enabled.",
      "[SUCCESS] Matrix synchronized."
    ],
    assets: [
      { name: "Source Code (zip)", size: "14.2 MB", type: "Archive", icon: FileArchive },
      { name: "Windows Installer (exe)", size: "89.5 MB", type: "Executable", icon: Monitor },
      { name: "Linux Build (tar.gz)", size: "76.1 MB", type: "Executable", icon: TerminalIcon },
      { name: "Release Notes (md)", size: "12 KB", type: "Readme", icon: FileText }
    ],
    contributors: ["Nima", "AI Matrix Core"],
    commits: 42
  },
  "v2.3.5": {
    id: "v2.3.5",
    version: "2.3.5",
    title: "Lanka Washing System Sync",
    date: "May 15, 2026",
    tag: "Fullstack Patch",
    summary: "Stabilization patch for the Lanka Washing System architecture. Optimized the data handshake between the Java Swing desktop client and the central PHP administration panel to eliminate synchronization deadlocks.",
    impact: "Administrative users will notice instantaneous status updates across the web dashboard without manual refreshing, streamlining operational resource management.",
    added: [
      "30-class Object-Oriented Architecture docs",
      "Apache Tomcat 9.0.96 deployment scripts"
    ],
    changed: [
      "Refactored Java Swing controllers",
      "Updated UI/UX paradigms for admin panel"
    ],
    fixed: [
      "Resolved cross-origin resource sharing (CORS)",
      "Fixed sequence diagram role assignments"
    ],
    breaking: [
      "[SYSTEM] Commencing framework shift...",
      "> Migrated to PHP 8.2 strict typing.",
      "> Legacy JDBC driver unsupported.",
      "[SUCCESS] Environment patched."
    ],
    assets: [
      { name: "Source Code (zip)", size: "8.4 MB", type: "Archive", icon: FileArchive },
      { name: "Database Schema (sql)", size: "1.2 MB", type: "Database", icon: FileCode },
      { name: "Patch Notes (md)", size: "8 KB", type: "Readme", icon: FileText }
    ],
    contributors: ["Nima"],
    commits: 18
  },
  "default": {
    id: "unknown",
    version: "0.0.0",
    title: "Classified Node",
    date: "UNKNOWN",
    tag: "Encrypted",
    summary: "The requested release log requires elevated clearance. Telemetry data has been sanitized.",
    impact: "System access is restricted.",
    added: ["Classified"], changed: ["Classified"], fixed: ["Classified"],
    breaking: ["> ACCESS DENIED.", "> Terminating connection."],
    assets: [],
    contributors: ["Unknown"], commits: 0
  }
};

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
      
      {/* Intense Glowing Orbs */}
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
  
  let rawId = params?.id as string;
  if (rawId === '%5Bid%5D' || !rawId) rawId = 'v2.4.0'; 
  const releaseId = decodeURIComponent(rawId);
  const activeData = RELEASES_DB[releaseId] || RELEASES_DB["default"];

  const [isLightMode, setIsLightMode] = useState(false);
  const [timeState, setTimeState] = useState({ time: "", date: "" });
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [currentUserRole, setCurrentUserRole] = useState<'guest' | 'user' | 'admin'>('guest');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole) {
        setCurrentUserRole(storedRole as 'guest' | 'user' | 'admin');
        setIsAuthenticated(storedRole === 'user' || storedRole === 'admin');
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
  }, []);

  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-600" : "text-slate-400";
  const glassPanel = isLightMode ? "bg-white/60 backdrop-blur-3xl border-slate-300 shadow-xl" : "bg-black/20 backdrop-blur-3xl border-white/10 shadow-2xl";

  // Framer Motion Scroll-Reveal Variants
  const scrollReveal = { 
    hidden: { opacity: 0, y: 50, scale: 0.95, rotateX: 10 }, 
    show: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } } 
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col font-sans overflow-x-hidden transition-colors duration-1000">
      <CustomCursor />
      <ActiveDataBackground isLight={isLightMode} />

      {/* ==========================================
          HEADER BAR (Completely Transparent, Zero Background)
          ========================================== */}
      <header className="fixed top-0 left-0 right-0 h-24 w-full flex items-center justify-between px-6 lg:px-12 z-50 pointer-events-none bg-transparent border-none">
        
        {/* Left Side: Theme, Back, Title */}
        <div className="flex items-center space-x-4 md:space-x-6 pointer-events-auto h-full">
          <div className="relative flex items-center justify-center bg-transparent">
             <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            aria-label="Back to Releases" onClick={() => router.push('/releases')} 
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

        {/* Right Side: Profile HUD */}
        <div className="flex items-center space-x-4 pointer-events-auto h-full shrink-0">
           {isAuthenticated && (
              <div className="relative" onMouseEnter={() => setIsProfileHovered(true)} onMouseLeave={() => setIsProfileHovered(false)}>
                <div className={`flex items-center space-x-3 px-4 py-2.5 md:px-5 md:py-3 rounded-full border cursor-pointer transition-colors duration-500 backdrop-blur-md ${isLightMode ? 'bg-white/80 border-slate-300 shadow-sm' : 'bg-black/40 border-white/10 hover:border-orange-500/50'}`}>
                  <span className={`font-mono text-[10px] md:text-xs tracking-widest hidden lg:block text-orange-500`}>
                    {timeState.date} <span className="text-slate-500">|</span> {timeState.time}
                  </span>
                  <div className={`w-px h-4 hidden lg:block ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`} />
                  <div className="flex items-center space-x-2 md:space-x-3 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 p-[1.5px] shrink-0">
                      <div className={`w-full h-full rounded-full flex items-center justify-center ${isLightMode ? 'bg-white' : 'bg-[#010205]'}`}>
                        <User size={14} className={textPrimary} />
                      </div>
                    </div>
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors hidden sm:block ${textPrimary} group-hover:text-orange-500`}>Nima</span>
                  </div>
                </div>

                <AnimatePresence>
                  {isProfileHovered && (
                    <motion.div initial={{ opacity: 0, y: 15, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.9 }} className={`absolute right-0 mt-3 w-56 rounded-3xl p-3 flex flex-col transform-gpu shadow-2xl border ${isLightMode ? 'bg-white/90 border-slate-200 backdrop-blur-xl' : 'bg-[#050b14]/95 backdrop-blur-3xl border-white/10'}`}>
                      <Link href="/settings" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all ${isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}>
                        <Settings size={14} className="mr-3 text-orange-500" /> Settings
                      </Link>
                      
                      {/* ADDED SAVED RELEASES OPTION TO DROPDOWN */}
                      <button type="button" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-orange-500 rounded-2xl transition-all group ${isLightMode ? 'hover:bg-orange-50' : 'hover:bg-orange-500/10'}`}>
                        <Bookmark size={14} className="mr-3 text-orange-500 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" /> Saved Releases
                      </button>
                      
                      <div className={`h-px w-full my-1 ${isLightMode ? 'bg-slate-200' : 'bg-slate-800/50'}`} />
                      <button onClick={() => { localStorage.removeItem('userRole'); setCurrentUserRole('guest'); setIsAuthenticated(false); }} className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 rounded-2xl transition-all hover:bg-red-500/10`}>
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
          3-PANE WORKSPACE (Native Scroll Enabled with items-start)
          ========================================== */}
      <div className="flex-1 w-full max-w-[1700px] mx-auto flex flex-col lg:flex-row items-start relative z-10 pt-32 pb-20 px-4 md:px-8 gap-6 md:gap-8">
        
        {/* LEFT SIDEBAR: Version Directory (Sticky) */}
        <motion.aside 
          drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.05}
          className={`hidden lg:flex w-72 shrink-0 flex-col rounded-[2.5rem] border px-6 py-8 sticky top-28 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pointer-events-auto transition-colors cursor-grab active:cursor-grabbing ${glassPanel}`}
        >
          <div className="relative mb-8 shrink-0">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Search versions..." className={`w-full border rounded-2xl py-4 pl-12 pr-4 text-xs font-mono focus:outline-none transition-colors shadow-sm ${isLightMode ? 'bg-white/50 border-slate-300 text-slate-800 focus:border-orange-500' : 'bg-black/40 border-white/10 text-white placeholder-slate-600 focus:border-orange-500 focus:bg-black/60'}`} />
          </div>

          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 pl-2 shrink-0">Version History</div>
          
          <div className="flex-1 relative pl-2">
            <div className={`absolute left-4 top-2 bottom-2 w-px ${isLightMode ? 'bg-slate-300' : 'bg-white/10'}`} />
            {Object.keys(RELEASES_DB).map((key) => {
              const rel = RELEASES_DB[key];
              const isActive = releaseId === rel.id;
              
              return (
                <button key={rel.id} aria-label={`View Release ${rel.version}`} onClick={() => router.push(`/releases/${rel.id}`)} className="relative z-10 w-full flex flex-col text-left py-3.5 group">
                  <div className="flex items-center mb-1">
                    <div className={`w-3.5 h-3.5 rounded-full border-[3px] shrink-0 z-10 transition-colors ${isActive ? 'bg-orange-500 border-orange-200 shadow-[0_0_15px_#f97316]' : (isLightMode ? 'bg-slate-100 border-slate-400 group-hover:border-orange-500' : 'bg-[#010205] border-slate-600 group-hover:border-orange-500')}`} />
                    <span className={`ml-4 text-sm font-black uppercase tracking-widest transition-colors ${isActive ? (isLightMode ? 'text-slate-900' : 'text-white') : 'text-slate-500 group-hover:text-orange-400'}`}>{rel.version}</span>
                  </div>
                  <AnimatePresence>
                    {isActive && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pl-8 overflow-hidden">
                         <div className="text-[10px] font-mono text-orange-500 mt-2 uppercase tracking-widest px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-md inline-block">{rel.tag}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              )
            })}
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            aria-label="Subscribe to RSS" 
            className="mt-6 shrink-0 w-full py-4 px-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 text-orange-500 flex items-center justify-center space-x-2 hover:bg-orange-500 hover:text-black transition-all shadow-lg hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
          >
            <Rss size={16} />
            <span className="text-[11px] font-black uppercase tracking-widest">Subscribe RSS</span>
          </motion.button>
        </motion.aside>

        {/* CENTER CANVAS: Main Output */}
        <section className="flex-1 flex flex-col pointer-events-auto min-w-0">
           <AnimatePresence mode="wait">
             <motion.div key={releaseId} className="flex flex-col flex-1">
               
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
                   </div>
                 </div>
                 
                 {/* Bookmark & Link Interactions */}
                 <div className="flex items-center space-x-3 shrink-0">
                   <motion.button 
                     onClick={() => setIsSaved(!isSaved)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                     aria-label={isSaved ? "Remove Bookmark" : "Save Release"}
                     className={`flex items-center justify-center w-14 h-14 rounded-2xl border transition-all shadow-md ${isSaved ? 'bg-orange-500/20 border-orange-500 text-orange-500' : `${isLightMode ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-white/5 border-white/20 text-slate-300 hover:border-orange-500 hover:text-orange-500'}`}`}
                   >
                     <Bookmark size={20} fill={isSaved ? "#f97316" : "none"} className={isSaved ? 'text-orange-500' : ''} />
                   </motion.button>
                   <motion.button 
                     whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                     aria-label="Copy Release Link" 
                     className={`flex items-center justify-center w-14 h-14 rounded-2xl border transition-all shadow-md ${isLightMode ? 'bg-white border-slate-300 hover:bg-orange-500 hover:border-orange-500 hover:text-black' : 'bg-white/5 border-white/10 hover:bg-orange-500 hover:text-black text-slate-300'}`}
                   >
                     <LinkIcon size={20} />
                   </motion.button>
                 </div>
               </motion.div>

               {/* RELEASE ASSETS / SOURCES DOWNLOADS (Elastic Hover) */}
               {activeData.assets && activeData.assets.length > 0 && (
                 <motion.div initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} variants={scrollReveal} className="w-full mb-12">
                   <div className="flex items-center space-x-3 mb-6 px-4">
                     <DownloadCloud size={20} className="text-orange-500" />
                     <h3 className={`text-sm md:text-base font-black uppercase tracking-[0.2em] ${textSecondary}`}>Release Assets & Sources</h3>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     {activeData.assets.map((asset: any, i: number) => (
                       <motion.a 
                         href="#" key={i}
                         drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.15}
                         whileHover={{ scale: 1.03, y: -5, rotateX: 2, rotateY: -2, zIndex: 50, boxShadow: "0 20px 40px rgba(249,115,22,0.15)" }}
                         className={`p-5 md:p-6 rounded-[2rem] border flex items-center justify-between group transition-colors cursor-grab active:cursor-grabbing ${isLightMode ? 'bg-white/80 border-slate-200 hover:border-orange-400 backdrop-blur-xl' : 'bg-black/20 backdrop-blur-3xl border-white/10 hover:border-orange-500 hover:bg-black/40'}`}
                       >
                         <div className="flex items-center space-x-4 overflow-hidden">
                           <div className={`p-3.5 md:p-4 rounded-2xl shrink-0 transition-colors ${isLightMode ? 'bg-slate-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-600' : 'bg-white/5 text-orange-400 group-hover:bg-orange-500/20 group-hover:text-orange-500'}`}>
                              <asset.icon size={24} />
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

               {/* 3-Column Bento: CHANGELOG (Elastic Drag) */}
               <motion.div initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} variants={scrollReveal} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                 <motion.div drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.1} whileHover={{ scale: 1.02, y: -5, rotateX: 2, rotateY: 2, zIndex: 20, boxShadow: "0 20px 40px rgba(34,197,94,0.1)" }} className={`p-8 md:p-10 border rounded-[2.5rem] transition-colors cursor-grab active:cursor-grabbing shadow-lg ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-black/20 backdrop-blur-3xl border-white/10 hover:border-green-500/50'}`}>
                   <div className="flex items-center space-x-3 mb-8">
                     <PlusCircle size={22} className="text-green-500" />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Added</span>
                   </div>
                   <ul className="space-y-5">
                     {activeData.added.map((item: string, i: number) => <li key={i} className={`text-sm md:text-base font-medium leading-relaxed before:content-['—'] before:mr-3 before:text-slate-600 ${textPrimary}`}>{item}</li>)}
                   </ul>
                 </motion.div>
                 <motion.div drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.1} whileHover={{ scale: 1.02, y: -5, rotateX: 2, rotateY: 0, zIndex: 20, boxShadow: "0 20px 40px rgba(59,130,246,0.1)" }} className={`p-8 md:p-10 border rounded-[2.5rem] transition-colors cursor-grab active:cursor-grabbing shadow-lg ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-black/20 backdrop-blur-3xl border-white/10 hover:border-blue-500/50'}`}>
                   <div className="flex items-center space-x-3 mb-8">
                     <RefreshCw size={22} className="text-blue-500" />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Changed</span>
                   </div>
                   <ul className="space-y-5">
                     {activeData.changed.map((item: string, i: number) => <li key={i} className={`text-sm md:text-base font-medium leading-relaxed before:content-['—'] before:mr-3 before:text-slate-600 ${textPrimary}`}>{item}</li>)}
                   </ul>
                 </motion.div>
                 <motion.div drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.1} whileHover={{ scale: 1.02, y: -5, rotateX: 2, rotateY: -2, zIndex: 20, boxShadow: "0 20px 40px rgba(249,115,22,0.1)" }} className={`p-8 md:p-10 border rounded-[2.5rem] transition-colors cursor-grab active:cursor-grabbing shadow-lg ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-black/20 backdrop-blur-3xl border-white/10 hover:border-orange-500/50'}`}>
                   <div className="flex items-center space-x-3 mb-8">
                     <Wrench size={22} className="text-orange-500" />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Fixed</span>
                   </div>
                   <ul className="space-y-5">
                     {activeData.fixed.map((item: string, i: number) => <li key={i} className={`text-sm md:text-base font-medium leading-relaxed before:content-['—'] before:mr-3 before:text-slate-600 ${textPrimary}`}>{item}</li>)}
                   </ul>
                 </motion.div>
               </motion.div>

               {/* 2-Column Bento: SUMMARY & TERMINAL (Elastic Drag) */}
               <motion.div initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} variants={scrollReveal} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                 <motion.div drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.1} whileHover={{ scale: 1.02, y: -5, rotateX: 1, rotateY: 1, zIndex: 20, boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }} className={`p-10 border rounded-[3rem] flex flex-col justify-between shadow-lg cursor-grab active:cursor-grabbing ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-black/20 backdrop-blur-3xl border-white/10'}`}>
                   <div>
                     <div className="flex items-center space-x-3 mb-8">
                       <CheckCircle size={22} className="text-blue-500" />
                       <span className="text-sm font-black uppercase tracking-widest text-slate-400">Executive Summary</span>
                     </div>
                     <p className={`text-base md:text-lg leading-relaxed mb-10 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>{activeData.summary}</p>
                   </div>
                   <p className="text-xs md:text-sm text-orange-400/90 font-mono leading-relaxed bg-orange-500/10 p-6 rounded-2xl border border-orange-500/20">{activeData.impact}</p>
                 </motion.div>
                 
                 {/* Authentic Linux Terminal */}
                 <motion.div drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.05} whileHover={{ scale: 1.02, y: -5, rotateX: 1, rotateY: -1, zIndex: 20, boxShadow: "0 30px 60px rgba(0,0,0,0.8)" }} className={`border rounded-[3rem] flex flex-col overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing ${isLightMode ? 'bg-slate-900 border-slate-700' : 'bg-[#02050a]/90 backdrop-blur-3xl border-white/10'}`}>
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
                        {activeData.breaking.map((log: string, i: number) => (
                          <motion.p initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{delay: i*0.2}} key={i} className={`${log.includes('[SUCCESS]') ? 'text-green-400 font-bold' : (log.includes('[SYSTEM]') ? 'text-slate-500' : 'text-orange-400')} whitespace-pre-wrap break-words`}>{log}</motion.p>
                        ))}
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

        {/* RIGHT SIDEBAR: Telemetry HUD (Sticky) */}
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
                <motion.div whileHover={{x:8}} className="flex items-center text-xs font-mono text-slate-400 cursor-pointer hover:text-orange-400 transition-colors"><span className="w-8 border-t border-white/20 mr-4"/> [Added] Features</motion.div>
                <motion.div whileHover={{x:8}} className="flex items-center text-xs font-mono text-slate-400 cursor-pointer hover:text-orange-400 transition-colors"><span className="w-8 border-t border-white/20 mr-4"/> [Changed] Optimizations</motion.div>
                <motion.div whileHover={{x:8}} className="flex items-center text-xs font-mono text-slate-400 cursor-pointer hover:text-orange-400 transition-colors"><span className="w-8 border-t border-white/20 mr-4"/> [Fixed] Bug Patches</motion.div>
                <motion.div whileHover={{x:8}} className="flex items-center text-xs font-mono text-slate-400 cursor-pointer hover:text-orange-400 transition-colors"><span className="w-8 border-t border-white/20 mr-4"/> Executive Summary</motion.div>
                <motion.div whileHover={{x:8}} className="flex items-center text-xs font-mono text-slate-400 cursor-pointer hover:text-orange-400 transition-colors"><span className="w-8 border-t border-white/20 mr-4"/> Breaking Changes</motion.div>
              </div>
           </div>
        </motion.aside>

      </div>

      <div className="relative w-full z-20 pointer-events-auto border-t border-white/10 bg-[#010205]/80 backdrop-blur-xl mt-12">
        <Footer isLight={isLightMode} currentRole={currentUserRole as any} />
      </div>
      <BottomNav currentRole={currentUserRole as any} />

      <style jsx global>{`
        /* Native scrolling enabled */
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.9); }
      `}</style>
    </main>
  );
}