"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useTransform, useMotionValue, useAnimationFrame } from 'framer-motion';
import Link from 'next/link';
import { 
  User, Settings, Star, LogOut, GitCommit, 
  Terminal, ShieldAlert, Zap, Cpu, Layers, ArchiveRestore,
  Plus, Minus, ChevronDown, Rocket, Code2, Database, Box, PlayCircle, FolderOpen,
  X, Video, Image as ImageIcon
} from 'lucide-react';

import CustomCursor from '@/components/CustomCursor';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';

// ==========================================
// DB UI ASSETS & CONFIG
// ==========================================
const COLORS = ["from-orange-500 to-amber-400", "from-orange-600 to-red-500", "from-amber-400 to-orange-500", "from-red-500 to-orange-600", "from-orange-500 to-pink-500"];
const ICONS = [Layers, Terminal, Database, Zap, ShieldAlert, Cpu, Code2, Box];

// ==========================================
// UNIFIED MATRIX BACKGROUND
// ==========================================
function UnifiedMatrixBackground({ isLight }: { isLight: boolean }) {
  const bgColor = isLight ? 'bg-slate-50' : 'bg-[#010205]';
  const combColor = isLight ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.08)'; 

  return (
    <div className={`fixed inset-0 z-0 pointer-events-none ${bgColor} overflow-hidden`}>
      <motion.div 
        animate={{ backgroundPosition: ["0px 0px", "0px 103.92px"] }} 
        transition={{ duration: 5, ease: "linear", repeat: Infinity }}
        className="absolute inset-0 w-full h-full opacity-80 mix-blend-screen" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='103.92304845413264' viewBox='0 0 60 103.92304845413264' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 103.92304845413264L60 86.60254037844386L60 51.96152422706632L30 34.64101615137754L0 51.96152422706632L0 86.60254037844386Z' fill='transparent' stroke='${encodeURIComponent(combColor)}' stroke-width='1.5'/%3E%3C/svg%3E")`, 
          backgroundSize: '60px 103.92px' 
        }} 
      />
      <motion.div animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity }} className={`absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full blur-[150px] ${isLight ? 'bg-orange-500/20' : 'bg-orange-600/20'}`} />
      <motion.div animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }} transition={{ duration: 15, repeat: Infinity, delay: 2 }} className={`absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] rounded-full blur-[180px] ${isLight ? 'bg-amber-500/20' : 'bg-orange-700/20'}`} />
    </div>
  );
}

const ultraSmoothSpring = { type: "spring" as const, stiffness: 100, damping: 20, mass: 1 };
const slowExpandSpring = { type: "spring" as const, stiffness: 50, damping: 25, mass: 1.5 };

// ==========================================
// MAIN MATRIX PAGE
// ==========================================
export default function ProjectMatrix() {
  const router = useRouter();
  const [isLightMode, setIsLightMode] = useState(false);
  const [timeState, setTimeState] = useState({ time: "", date: "" });
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  // LIVE DATABASE STATES
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [incomings, setIncomings] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [nodeProjects, setNodeProjects] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [showcases, setShowcases] = useState<any[]>([]);

  // Section 1: "Standing File Drawer"
  const [activeStackIndex, setActiveStackIndex] = useState(0);
  const [isHoveringStack, setIsHoveringStack] = useState(false);

  // Section 2: Incoming Arc Carousel
  const [incomingIndex, setIncomingIndex] = useState(0);
  const [isHoveringIncomings, setIsHoveringIncomings] = useState(false);

  // Section 3: Combobox Filter
  const [filterType, setFilterType] = useState('All Systems');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Section 4: Hologram Video Carousel
  const holoMouseX = useMotionValue(0);
  const holoRotY = useMotionValue(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [activeVideoNode, setActiveVideoNode] = useState<any>(null);

  useAnimationFrame(() => {
    if (!isCarouselHovered && !activeVideoNode) {
      holoRotY.set(holoRotY.get() + 0.03 + (holoMouseX.get() * 0.15)); 
    }
  });

  // Section 5: Automated FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isFaqHovered, setIsFaqHovered] = useState(false);

  // Section 6: Interactive Dial 
  const [isDialOpen, setIsDialOpen] = useState(false);
  const dialDragX = useMotionValue(0);
  const dialRotation = useTransform(dialDragX, [-300, 300], [-180, 180]);

  // Auth State
  const [currentUserRole, setCurrentUserRole] = useState<'guest' | 'user' | 'admin'>('guest');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (activeVideoNode) { document.body.style.overflow = 'hidden'; } 
    else { document.body.style.overflow = 'unset'; }
    return () => { document.body.style.overflow = 'unset'; };
  }, [activeVideoNode]);

  // ==========================================
  // PURE DATABASE HYDRATION ENGINE
  // ==========================================
  useEffect(() => {
    const hydrateMatrix = async () => {
      try {
        const [relRes, showRes, faqRes] = await Promise.all([
          fetch('https://myresearch-bclz.onrender.com/api/releases').catch(() => null),
          fetch('https://myresearch-bclz.onrender.com/api/showcase').catch(() => null),
          fetch('https://myresearch-bclz.onrender.com/api/faqs').catch(() => null)
        ]);

        // Safely parse JSON to prevent crashes if a route 404s
        let releases = [];
        let showcasesData = [];
        let faqsData = [];

        if (relRes && relRes.ok) { try { releases = (await relRes.json()).data || []; } catch(e) {} }
        if (showRes && showRes.ok) { try { showcasesData = (await showRes.json()).data || []; } catch(e) {} }
        if (faqRes && faqRes.ok) { try { faqsData = (await faqRes.json()).data || []; } catch(e) {} }

        // 1. Process Core Releases (Projects ONLY)
        const parsedReleases = releases.map((r: any, i: number) => {
          let adv = {} as any;
          try { if (r.advancedData) adv = JSON.parse(r.advancedData); } catch(e) {}
          const techStr = Array.isArray(adv.techStack) ? adv.techStack.join(" ") : "";
          return {
            id: r.id,
            rawId: r.id,
            title: r.projectName,
            version: r.version,
            published: r.published,
            dateObj: new Date(r.publishedAt || r.createdAt || 0),
            date: new Date(r.publishedAt || r.createdAt || 0).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase(),
            type: `System Release ${techStr}`, 
            color: COLORS[i % COLORS.length],
            icon: ICONS[i % ICONS.length],
            routing: adv.routing || { targetExplorer: true, targetVault: true, targetUpcoming: false, targetPrototypes: true },
            adv
          };
        }).sort((a: any, b: any) => b.dateObj.getTime() - a.dateObj.getTime());

        // 2. Recent Projects (Standing Drawer)
        const recent = parsedReleases
          .filter((p: any) => p.published && p.routing.targetVault)
          .slice(0, 5)
          .map((p: any) => {
             let changes: string[] = [];
             const strip = (html: string) => (html || '').replace(/<[^>]*>?/gm, '').replace(/([*~_`#])/g, '').split('\n').filter(l => l.trim().length > 0);
             const added = strip(p.adv.addedFeatures);
             const changed = strip(p.adv.changedUpdates);
             const fixed = strip(p.adv.fixedBugs);
             if (added.length) changes.push(`[ADDED] ${added[0]}`);
             if (changed.length) changes.push(`[CHANGED] ${changed[0]}`);
             if (fixed.length) changes.push(`[FIXED] ${fixed[0]}`);
             if (changes.length === 0) changes = ["System architecture finalized.", "Database relationships active.", "UI parameters locked."];

             return { ...p, changes: changes.slice(0, 3) };
          });
        setRecentProjects(recent);

        // 3. Incomings (Arc Carousel)
        const upcoming = parsedReleases
          .filter((p: any) => !p.published || p.routing.targetUpcoming)
          .slice(0, 5)
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            desc: "IN DEVELOPMENT / LOCAL BUILD",
            icon: p.icon
          }));
        setIncomings(upcoming);

        // 4. All Projects (Marquee)
        setAllProjects(parsedReleases.filter((p: any) => p.published));

        // 5. Node Graph (Hero Connectors)
        setNodeProjects(parsedReleases.filter((p: any) => p.routing.targetPrototypes));

        // 6. Showcases (Hologram Carousel)
        setShowcases(showcasesData.map((s: any) => ({
          id: s.id, title: s.title, videoUrl: s.videoUrl, thumbnailUrl: s.thumbnailUrl, description: s.description
        })));

        // 7. System Queries (FAQs)
        setFaqs(faqsData.map((f: any) => ({ q: f.query, a: f.response })));

      } catch (error) {
        console.error("Matrix Hydration Failed:", error);
      }
    };

    hydrateMatrix();
  }, []);

  // Auto-Cycle Timers
  useEffect(() => {
    const faqTimer = setInterval(() => {
      if (!isFaqHovered && faqs.length > 0) setOpenFaq((prev) => (prev !== null ? (prev + 1) % faqs.length : 0));
    }, 5000); 

    const stackTimer = setInterval(() => {
      if (!isHoveringStack && recentProjects.length > 0) setActiveStackIndex((prev) => (prev + 1) % recentProjects.length);
    }, 3000);

    const incomingTimer = setInterval(() => {
      if (!isHoveringIncomings && incomings.length > 0) setIncomingIndex((prev) => (prev + 1) % incomings.length);
    }, 3500);

    return () => { clearInterval(faqTimer); clearInterval(stackTimer); clearInterval(incomingTimer); };
  }, [isFaqHovered, isHoveringStack, isHoveringIncomings, recentProjects.length, incomings.length, faqs.length]);

  // Auth & Clock Init
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('matrix_token');
      if (token) {
        setIsAuthenticated(true);
        setCurrentUserRole('user');
        fetch('https://myresearch-bclz.onrender.com/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.json())
          .then(json => { if (json.data) setUserData(json.data); })
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
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsDialOpen(false);
  };

  const handleStackMouseMove = (e: React.MouseEvent) => {
    if (recentProjects.length === 0) return;
    setIsHoveringStack(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
    const newIndex = Math.floor(percentage * recentProjects.length);
    if (newIndex < recentProjects.length && newIndex !== activeStackIndex) {
      setActiveStackIndex(newIndex);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('matrix_token');
    router.push('/auth');
  };

  // 🔥 FILTER LOGIC FOR MARQUEE
  const filteredAllProjects = allProjects.filter(proj => {
    if (filterType === 'All Systems') return true;
    const searchStr = `${proj.title} ${proj.type}`.toLowerCase();
    if (filterType === 'Frontend') return searchStr.match(/frontend|ui|web|app|react|next/i);
    if (filterType === 'Backend') return searchStr.match(/backend|server|api|database|sql|php|node/i);
    if (filterType === 'AI Models') return searchStr.match(/ai|model|llm|neural|gemini|vision/i);
    return true; 
  });

  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-600" : "text-slate-400";
  const glassBg = isLightMode ? "bg-white/90 border-slate-200 shadow-2xl" : "bg-[#010308]/90 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]";
  const accentHex = isLightMode ? "#ea580c" : "#f97316";

  return (
    <main className={`relative min-h-screen font-sans cursor-none overflow-x-hidden flex flex-col transition-colors duration-1000 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
      <CustomCursor />
      <UnifiedMatrixBackground isLight={isLightMode} />

      <div className="fixed top-24 left-6 lg:left-12 z-[100] pointer-events-auto">
        <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />
      </div>

      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-6 px-6 lg:px-12 flex justify-between items-start pointer-events-none">
        <div className="flex items-center space-x-3 pointer-events-auto mt-20">
          <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-orange-500 to-amber-400 rounded-lg flex items-center justify-center text-black shadow-[0_0_20px_rgba(249,115,22,0.3)]">
            <ArchiveRestore size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className={`text-xl font-black tracking-widest uppercase ${textPrimary}`}>CSx<span className="text-orange-500">PROJECTS</span></h1>
            <p className="text-[10px] font-mono text-amber-500 tracking-[0.2em] uppercase">Architecture Deck</p>
          </div>
        </div>

        {isAuthenticated && (
          <div className="flex items-center space-x-4 pointer-events-auto mt-6">
            <div className="relative" onMouseEnter={() => setIsProfileHovered(true)} onMouseLeave={() => setIsProfileHovered(false)}>
              <div className={`flex items-center space-x-4 px-6 py-2.5 rounded-full backdrop-blur-xl cursor-pointer transition-colors duration-700 ${glassBg}`}>
                <span className={`font-mono text-xs tracking-widest hidden sm:block transition-colors duration-500`} style={{ color: accentHex }}>
                  {timeState.date} <span className={textSecondary}>|</span> {timeState.time}
                </span>
                <div className={`w-px h-4 hidden sm:block ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`} />
                <div className="flex items-center space-x-3 group">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 p-[1.5px] transition-all duration-500 overflow-hidden">
                    <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${isLightMode ? 'bg-white' : 'bg-[#010205]'}`}>
                      {userData?.profilePic ? (
                        <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={12} className={textPrimary} />
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest transition-colors ${textPrimary}`} style={{ color: isProfileHovered ? accentHex : undefined }}>
                    {userData ? (userData.fullName || 'OPERATOR') : 'GUEST'}
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {isProfileHovered && (
                  <motion.div initial={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }} exit={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} transition={ultraSmoothSpring} className={`absolute right-0 mt-3 w-56 rounded-2xl backdrop-blur-2xl p-2 flex flex-col transform-gpu shadow-2xl ${glassBg}`}>
                    <button type="button" onClick={() => router.push('/settings')} className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}>
                      <Settings size={14} className="mr-3 text-orange-500" /> Settings
                    </button>
                    <button type="button" onClick={() => router.push('/settings?tab=saved')} className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-cyan-500 rounded-xl transition-all group ${isLightMode ? 'hover:bg-cyan-50' : 'hover:bg-cyan-500/10'}`}>
                      <Star size={14} className="mr-3 text-orange-400 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" /> Saved Links
                    </button>
                    <div className={`h-px w-full my-1 ${isLightMode ? 'bg-slate-200' : 'bg-slate-800/50'}`} />
                    <button type="button" onClick={handleLogout} className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 rounded-xl transition-all group ${isLightMode ? 'hover:bg-red-50' : 'hover:bg-red-500/10'}`}>
                      <LogOut size={14} className="mr-3 text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> Terminate Link
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 w-full pt-48 pb-20 flex flex-col flex-grow">
        
        {/* ==========================================
            SKILL 1: THE STANDING FILE DRAWER
            ========================================== */}
        <div id="recent" className="max-w-7xl mx-auto w-full px-6 lg:px-12 mb-40">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={ultraSmoothSpring}>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-2 leading-none">
                Recent <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Projects</span>
              </h2>
              <p className={`text-sm md:text-base font-mono tracking-widest uppercase mt-4 ${textSecondary}`}>Architecture Deck. Click front node to enter Matrix.</p>
            </motion.div>
          </div>

          <div 
            className="relative w-full flex flex-col justify-end items-center [perspective:1500px] h-[550px] z-10 pb-10"
            onMouseMove={handleStackMouseMove}
            onMouseLeave={() => setIsHoveringStack(false)}
          >
            {recentProjects.length === 0 ? (
              <div className={`w-full max-w-4xl h-[420px] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-colors ${isLightMode ? 'border-slate-300 bg-white/50' : 'border-orange-500/20 bg-black/40'}`}>
                 <ArchiveRestore size={48} className={isLightMode ? 'text-slate-300 mb-4' : 'text-orange-500/30 mb-4'} />
                 <p className={`font-mono tracking-widest uppercase text-sm ${textSecondary}`}>No core projects detected in matrix.</p>
              </div>
            ) : (
              recentProjects.map((project, i) => {
                const total = recentProjects.length;
                const offset = (i - activeStackIndex + total) % total;
                
                const isFront = offset === 0;
                const isLeaving = offset === total - 1; 
                const isVisible = offset >= 0 && offset < 4; 

                let yPos = 0; let zPos = 0; let rotX = 0; let opacity = 1; let scale = 1;

                if (isFront) {
                   yPos = 0; zPos = 0; rotX = 0; opacity = 1; scale = 1;
                } else if (isLeaving) {
                   yPos = 300; zPos = 100; rotX = -20; opacity = 0; scale = 1.1; 
                } else {
                   yPos = -offset * 75;  
                   zPos = -offset * 120;  
                   rotX = offset * 4;    
                   opacity = 1 - (offset * 0.15);
                   scale = 1 - (offset * 0.04);
                }

                return (
                  <motion.div
                    key={project.rawId || i}
                    onClick={() => {
                      if (isFront) {
                        router.push(`/projects/${project.rawId}`);
                      } else {
                        setActiveStackIndex(i);
                      }
                    }} 
                    drag="y" 
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                      if (offset.y < -50 || velocity.y < -500) setActiveStackIndex((prev) => (prev + 1) % total);
                      else if (offset.y > 50 || velocity.y > 500) setActiveStackIndex((prev) => (prev - 1 + total) % total);
                    }}
                    animate={{ y: yPos, z: zPos, rotateX: rotX, scale: scale, opacity: isVisible || isLeaving ? opacity : 0, zIndex: total - offset }}
                    whileHover={{ scale: isFront ? 1 : scale + 0.02, cursor: "pointer" }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    className="absolute bottom-0 w-full max-w-4xl h-[380px] md:h-[420px] active:cursor-grabbing"
                    style={{ transformOrigin: "bottom center" }}
                    title={isFront ? "Click to Enter Project Matrix" : undefined}
                  >
                    <div className={`absolute -top-10 left-8 px-6 py-2.5 rounded-t-xl border-t border-l border-r flex items-center gap-3 shadow-lg z-20 transition-colors ${isFront ? 'bg-orange-600 border-orange-400' : 'bg-orange-900 border-orange-700/50'}`}>
                       <FolderOpen size={16} className={isFront ? "text-black" : "text-orange-400"} />
                       <span className={`font-black uppercase text-xs tracking-widest ${isFront ? "text-black" : "text-orange-400"}`}>{project.id}</span>
                    </div>

                    <div className={`absolute top-0 bottom-0 left-0 right-0 rounded-3xl border overflow-hidden flex flex-col justify-between p-8 md:p-10 transition-colors duration-500 shadow-2xl ${isLightMode ? 'bg-white/95 border-slate-300' : 'bg-[#050b14]/95 border-orange-500/30 backdrop-blur-xl'} ${isFront ? 'border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.2)]' : 'hover:border-orange-400'}`}>
                      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${project.color}`} />
                      <div>
                        <div className="flex justify-between items-start mb-6 mt-2">
                           <h3 className={`text-3xl md:text-5xl font-black tracking-tight uppercase ${textPrimary} truncate pr-4`}>{project.title}</h3>
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${project.color} text-black shrink-0 ${isFront ? 'animate-pulse' : ''}`}>
                             <project.icon size={24} />
                           </div>
                        </div>
                        <div className="inline-flex px-4 py-2 bg-orange-500/10 text-orange-500 font-black text-[10px] tracking-[0.2em] uppercase rounded-lg border border-orange-500/30 mb-8">
                           {project.type}
                        </div>
                        <ul className="space-y-4 max-h-32 overflow-hidden">
                           {project.changes.map((change: string, idx: number) => (
                             <li key={idx} className="flex items-start">
                                <GitCommit size={18} className="mr-4 mt-0.5 shrink-0 text-orange-500" />
                                <span className={`text-sm md:text-base font-medium leading-relaxed truncate ${textPrimary}`}>{change}</span>
                             </li>
                           ))}
                        </ul>
                      </div>
                      <div className="w-full border-t border-white/10 pt-5 flex justify-between items-center text-orange-500/60 font-mono text-[10px] uppercase tracking-widest">
                         <span>DEPLOYED: {project.date}</span>
                         <span>[ ENTER MATRIX ]</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* ==========================================
            SKILL 2: INCOMINGS (COVERFLOW ARC CAROUSEL)
            ========================================== */}
        <div id="incomings" className={`w-full py-32 border-y overflow-hidden relative ${isLightMode ? 'border-slate-200 bg-white/20 backdrop-blur-sm' : 'border-white/5 bg-transparent'}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-16 relative z-10">
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="lg:w-1/3">
                <h3 className={`text-xs font-black tracking-[0.3em] uppercase mb-4 ${isLightMode ? 'text-orange-600' : 'text-orange-500'}`}>Incoming Systems</h3>
                <h2 className={`text-4xl font-black uppercase tracking-tighter leading-none ${textPrimary}`}>Future <br/> Architecture</h2>
              </div>
              <div className={`lg:w-2/3 text-lg font-medium leading-relaxed ${textSecondary}`}>
                Draggable 3D Coverflow array. These panels map to a spatial arc facing the viewport. Drag left or right to cycle the active prototype.
              </div>
            </div>
          </div>

          <div 
            className="relative w-full flex justify-center items-center h-[500px] [perspective:1500px] mt-10"
            onMouseEnter={() => setIsHoveringIncomings(true)}
            onMouseLeave={() => setIsHoveringIncomings(false)}
          >
            {incomings.length === 0 ? (
              <div className={`w-[320px] h-[420px] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-colors ${isLightMode ? 'border-slate-300 bg-white/50' : 'border-orange-500/20 bg-black/40'}`}>
                 <Code2 size={48} className={isLightMode ? 'text-slate-300 mb-4' : 'text-orange-500/30 mb-4'} />
                 <p className={`font-mono tracking-widest uppercase text-xs text-center px-4 ${textSecondary}`}>No incoming drafts found.</p>
              </div>
            ) : (
              incomings.map((item, i) => {
                 const total = incomings.length;
                 let offset = (i - incomingIndex) % total;
                 if (offset > Math.floor(total / 2)) offset -= total;
                 if (offset < -Math.floor(total / 2)) offset += total;

                 const absOffset = Math.abs(offset);
                 const isCenter = offset === 0;

                 const xPos = offset * 280; 
                 const zPos = isCenter ? 50 : absOffset * -200; 
                 const rotY = isCenter ? 0 : offset > 0 ? -35 : 35;
                 const scale = isCenter ? 1.05 : 1 - (absOffset * 0.1);
                 const opacity = isCenter ? 1 : Math.max(0, 1 - (absOffset * 0.4));
                 const zIndex = 100 - absOffset;

                 return (
                    <motion.div
                       key={item.id || i}
                       onClick={() => setIncomingIndex(i)}
                       drag="x"
                       dragConstraints={{ left: 0, right: 0 }}
                       dragElastic={0.2}
                       onDragEnd={(e, { offset: dragOffset, velocity }) => {
                         if (dragOffset.x < -50 || velocity.x < -500) {
                           setIncomingIndex((prev) => (prev + 1 + total) % total);
                         } else if (dragOffset.x > 50 || velocity.x > 500) {
                           setIncomingIndex((prev) => (prev - 1 + total) % total);
                         }
                       }}
                       animate={{ x: xPos, z: zPos, rotateY: rotY, scale: scale, opacity: opacity }}
                       whileHover={{ scale: isCenter ? 1.05 : scale + 0.05, cursor: "pointer" }}
                       transition={{ type: "spring", stiffness: 120, damping: 20 }}
                       style={{ zIndex, transformOrigin: 'center center' }}
                       className={`absolute w-[320px] h-[420px] p-8 flex flex-col justify-between border-2 rounded-3xl active:cursor-grabbing transition-colors duration-500 ${
                          isLightMode 
                            ? 'bg-white/90 shadow-xl border-slate-200 backdrop-blur-md' 
                            : 'bg-[#050b14]/90 backdrop-blur-xl border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]'
                       } ${isCenter ? 'border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.3)]' : 'hover:border-orange-400/50'}`}
                    >
                       <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500 ${isCenter ? 'bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.6)]' : 'bg-white/5 text-orange-400'}`}>
                          <item.icon size={32} />
                       </div>
                       <div className="relative z-10">
                          <h4 className={`text-3xl font-black tracking-tight mb-4 leading-snug break-words ${textPrimary}`}>{item.title}</h4>
                          <p className={`text-xs font-mono font-bold uppercase ${textSecondary}`}>{item.desc}</p>
                       </div>
                    </motion.div>
                 )
              })
            )}
          </div>
        </div>

        {/* ==========================================
            SKILL 3: ALL PROJECTS FILTER & AUTO-MARQUEE
            ========================================== */}
        <div id="all" className={`w-full py-24 overflow-hidden flex flex-col border-b relative z-20 ${isLightMode ? 'border-slate-200 bg-slate-100/50 backdrop-blur-sm' : 'border-white/10 bg-black/40 backdrop-blur-sm'}`}>
          <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 mb-12 flex justify-end z-30">
            <div className="relative">
              <button onClick={() => setIsFilterOpen(!isFilterOpen)} aria-label="Toggle Filter" className={`flex items-center space-x-4 px-6 py-3 rounded-xl border font-black uppercase tracking-widest text-xs transition-colors ${isFilterOpen ? 'bg-orange-500 text-black border-orange-500' : 'bg-[#050b14] text-white border-white/20 hover:border-orange-500/50'}`}>
                <span>{filterType}</span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute top-full right-0 mt-2 w-48 bg-[#050b14] border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
                    {['All Systems', 'Frontend', 'Backend', 'AI Models'].map(type => (
                      <button key={type} aria-label={`Filter by ${type}`} onClick={() => { setFilterType(type); setIsFilterOpen(false); }} className="w-full text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-orange-500 hover:text-black transition-colors">
                        {type}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {filteredAllProjects.length === 0 ? (
            <div className="w-full py-10 flex justify-center">
              <p className={`font-mono uppercase tracking-widest text-sm ${textSecondary}`}>No matrix data matches this filter.</p>
            </div>
          ) : (
            <>
              <div className="flex w-fit whitespace-nowrap mb-6 group cursor-none">
                <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ ease: "linear", duration: 30, repeat: Infinity }} className="flex gap-4 px-2">
                  {[...filteredAllProjects, ...filteredAllProjects, ...filteredAllProjects, ...filteredAllProjects].map((proj, idx) => (
                    <motion.div 
                      key={idx} 
                      onClick={() => router.push(`/projects/${proj.id}`)}
                      whileHover={{ scale: 1.05, backgroundColor: '#f97316', borderColor: '#f97316' }} 
                      className="inline-flex items-center px-8 py-6 mx-2 border border-white/10 rounded-2xl bg-[#03060d]/80 backdrop-blur-md transition-colors group-hover:[&:not(:hover)]:opacity-50 cursor-pointer shadow-lg"
                    >
                      <Box size={20} className="mr-4 text-white" />
                      <span className="text-xl font-black uppercase text-white">{proj.title}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <div className="flex w-fit whitespace-nowrap group cursor-none ml-[-1000px]">
                <motion.div animate={{ x: ["-50%", "0%"] }} transition={{ ease: "linear", duration: 30, repeat: Infinity }} className="flex gap-4 px-2">
                  {[...filteredAllProjects].reverse().concat([...filteredAllProjects].reverse(), [...filteredAllProjects].reverse(), [...filteredAllProjects].reverse()).map((proj, idx) => (
                    <motion.div 
                      key={idx} 
                      onClick={() => router.push(`/projects/${proj.id}`)}
                      whileHover={{ scale: 1.05, backgroundColor: '#000', borderColor: '#f97316', color: '#f97316' }} 
                      className="inline-flex items-center px-8 py-6 mx-2 border border-orange-500 rounded-2xl bg-orange-600 transition-colors group-hover:[&:not(:hover)]:opacity-50 cursor-pointer shadow-lg"
                    >
                      <Rocket size={20} className="mr-4 text-black" />
                      <span className="text-xl font-black uppercase text-black">{proj.title}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </>
          )}
        </div>

        {/* ==========================================
            SKILL 4: HOLOGRAM CAROUSEL -> SMART VIDEO PLAYER
            ========================================== */}
        <div 
          id="hologram" 
          className="w-full py-40 flex flex-col items-center justify-center overflow-hidden relative z-10"
          onMouseMove={(e) => {
            if (activeVideoNode) return; 
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            holoMouseX.set(x);
          }}
          onMouseLeave={() => holoMouseX.set(0)}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.15)_0%,transparent_60%)] pointer-events-none" />

          {/* Title Header */}
          <div className={`relative bg-black w-72 h-80 flex flex-col items-center justify-center p-8 shadow-2xl group z-20 transition-opacity duration-500`}>
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-4 border-l-4 border-cyan-400 transition-transform group-hover:-translate-x-2 group-hover:-translate-y-2" />
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-4 border-r-4 border-orange-500 transition-transform group-hover:translate-x-2 group-hover:-translate-y-2" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-4 border-l-4 border-pink-500 transition-transform group-hover:-translate-x-2 group-hover:translate-y-2" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-4 border-r-4 border-purple-500 transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
            
            <h3 className="text-white text-3xl font-black uppercase tracking-tight leading-tight text-center">
              Have an idea?<br/><span className="text-orange-500">We'll make it real.</span>
            </h3>
            <p className="text-white/50 text-[10px] font-mono mt-6 uppercase tracking-[0.2em] animate-pulse">Move Cursor to Spin Orbit</p>
          </div>

          {/* 3D Spinning Nodes */}
          <div className="relative w-full h-32 mt-20 flex justify-center [perspective:1200px]">
            <motion.div style={{ rotateY: holoRotY }} className="absolute w-[300px] h-[200px] [transform-style:preserve-3d] flex items-center justify-center">
              {showcases.slice(0, 5).map((node: any, i: number) => {
                const isVideo = !!node.videoUrl;
                return (
                  <button 
                    key={i} aria-label={`View Video for ${node.title}`}
                    onMouseEnter={() => setIsCarouselHovered(true)} 
                    onMouseLeave={() => setIsCarouselHovered(false)}
                    onClick={() => setActiveVideoNode(node)}
                    className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center rounded-2xl border bg-black/80 backdrop-blur-md hover:scale-110 transition-all duration-500 cursor-pointer ${
                      activeVideoNode?.id === node.id ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                    } ${isVideo ? 'border-orange-500/50 hover:border-orange-400 hover:bg-orange-950/80 hover:shadow-[0_0_50px_rgba(249,115,22,0.6)]' : 'border-slate-700/50 hover:border-slate-500 hover:bg-slate-900/80 hover:shadow-[0_0_50px_rgba(255,255,255,0.1)]'}`}
                    style={{ transform: `rotateY(${i * (360 / 5)}deg) translateZ(350px)` }}
                  >
                    {isVideo ? <Video size={32} className="text-orange-500 mb-4 animate-pulse" /> : <ImageIcon size={32} className="text-slate-500 mb-4" />}
                    <span className="text-white font-black uppercase tracking-widest text-sm text-center px-4 leading-tight">{node.title.substring(0,25)}</span>
                    <span className={`text-[10px] font-mono mt-3 uppercase tracking-widest px-3 py-1 rounded border ${isVideo ? 'text-orange-400 bg-orange-500/10 border-orange-500/30' : 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                      {isVideo ? '[ PLAY FEED ]' : '[ NO FEED ]'}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* ==========================================
            SKILL 5: AUTO-EXPANDING FAQ 
            ========================================== */}
        <div id="faq" className={`w-full py-32 border-t relative z-10 ${isLightMode ? 'border-slate-200 bg-white/40 backdrop-blur-sm' : 'border-white/10 bg-transparent'}`}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/3">
              <h2 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6 ${textPrimary}`}>System <br/> Queries.</h2>
              <p className={`font-mono text-sm uppercase tracking-widest ${textSecondary}`}>Automated Core Scan Sequence.</p>
            </div>
            
            <div className="lg:w-2/3 border-t border-current relative" onMouseEnter={() => setIsFaqHovered(true)} onMouseLeave={() => setIsFaqHovered(false)}>
              {faqs.map((faq, i) => (
                <div key={i} className={`relative border-b ${isLightMode ? 'border-slate-300' : 'border-white/20'}`}>
                  {openFaq === i && (
                    <motion.div layoutId="faqHighlight" className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent -z-10" initial={false} transition={slowExpandSpring} />
                  )}
                  <button aria-label={`Toggle Question ${i+1}`} onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full py-6 px-4 flex items-center justify-between text-left focus:outline-none group relative z-10">
                    <span className={`text-lg md:text-2xl font-black tracking-tight transition-colors duration-500 ${openFaq === i ? 'text-orange-500' : textPrimary}`}>{faq.q}</span>
                    {openFaq === i ? <Minus size={24} className="text-orange-500 shrink-0 ml-4" /> : <Plus size={24} className={`${textSecondary} shrink-0 ml-4`} />}
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.8, ease: "easeInOut" }} className="overflow-hidden relative z-10">
                        <p className={`pb-8 px-4 font-medium leading-relaxed ${textSecondary}`}>{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==========================================
            SKILL 6: ADVANCED SCROLLABLE/DRAGGABLE DIAL
            ========================================== */}
        <div id="nav-dial" className={`w-full py-64 flex flex-col items-center justify-center border-t relative overflow-hidden z-10 ${isLightMode ? 'border-slate-200 bg-white/40 backdrop-blur-md' : 'border-white/5 bg-transparent'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0%,transparent_60%)] pointer-events-none" />

          <motion.div
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} style={{ rotate: dialRotation }}
            onDragEnd={(e, { offset }) => { if (offset.x > 50 || offset.x < -50) setIsDialOpen(!isDialOpen); }}
            className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center z-30 cursor-grab active:cursor-grabbing transition-colors duration-500 ${isDialOpen ? 'text-orange-500' : textPrimary}`}
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, ease: "linear", repeat: Infinity }} className={`absolute inset-0 rounded-full border-[10px] border-dashed opacity-40 ${isDialOpen ? 'border-orange-500' : 'border-current'}`} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 25, ease: "linear", repeat: Infinity }} className={`absolute inset-6 rounded-full border-4 border-dotted opacity-50 ${isDialOpen ? 'border-orange-500' : 'border-current'}`} />
            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 2, repeat: Infinity }} className={`absolute inset-16 rounded-full blur-xl ${isDialOpen ? 'bg-orange-500' : 'bg-transparent'}`} />
            
            <div className="flex flex-col items-center relative z-10" style={{ transform: 'rotate(0deg)' }}>
              <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center bg-black">
                 <motion.div animate={{ rotate: isDialOpen ? 90 : 0 }} className="w-full h-1 bg-current rounded-full" />
                 <motion.div animate={{ rotate: isDialOpen ? 0 : 90 }} className="absolute w-1 h-full bg-current rounded-full" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] mt-6 text-center leading-loose">
                {isDialOpen ? 'SYSTEM\nOPEN' : 'DRAG TO\nACCESS'}
              </span>
            </div>
          </motion.div>

          <AnimatePresence>
            {isDialOpen && (
              <>
                <NavNode id="recent" label="Recent" angle={-135} radius={220} onClick={scrollToSection} />
                <NavNode id="incomings" label="Upcoming" angle={-45} radius={220} onClick={scrollToSection} />
                <NavNode id="all" label="All Projects" angle={-135} radius={350} delay={0.1} onClick={scrollToSection} />
                <NavNode id="faq" label="Queries" angle={-45} radius={350} delay={0.1} onClick={scrollToSection} />
              </>
            )}
          </AnimatePresence>
        </div>

      </div>
      
      {/* ==========================================
          FOOTER & NAVIGATION
          ========================================== */}
      <div className="relative z-20 pointer-events-auto">
        <Footer isLight={isLightMode} currentRole={currentUserRole as any} />
      </div>
      
      <BottomNav currentRole={currentUserRole as any} />

      {/* 🔥 THE FIXED CINEMATIC VIDEO MODAL (Rendered at Root Level for Z-Index Safety) */}
      <AnimatePresence>
        {activeVideoNode && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 pointer-events-auto cursor-default"
            onClick={() => setActiveVideoNode(null)} // Click outside closes modal
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              onClick={(e) => e.stopPropagation()} // Prevent clicking modal from closing it
              className="w-full max-w-3xl bg-[#050b14] border border-orange-500/50 rounded-[2.5rem] p-6 md:p-8 shadow-[0_0_80px_rgba(249,115,22,0.2)] flex flex-col relative"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center animate-pulse shrink-0"><PlayCircle size={20} className="text-black" /></div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest break-words leading-tight">{activeVideoNode.title}</h3>
                    <p className="text-[10px] md:text-xs text-orange-500 font-mono tracking-widest uppercase mt-1">Live Database Feed Stream</p>
                  </div>
                </div>
                <button onClick={() => setActiveVideoNode(null)} title="Close video modal" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all shrink-0">
                  <X size={18} />
                </button>
              </div>
              
              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 relative flex items-center justify-center">
                {activeVideoNode.videoUrl ? (
                   activeVideoNode.videoUrl.includes('youtube') || activeVideoNode.videoUrl.includes('vimeo') ? (
                      <iframe className="w-full h-full" src={activeVideoNode.videoUrl} title="Cloud Video Feed" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                   ) : (
                      <video className="w-full h-full object-cover" src={activeVideoNode.videoUrl} controls autoPlay muted loop />
                   )
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6">
                    <ShieldAlert size={48} className="text-slate-700 mb-4" />
                    <h4 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-2">Video Feed Encrypted</h4>
                    <p className="text-xs text-slate-600 font-mono max-w-sm">No cloud video URL has been provided by the admin for this matrix node.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function NavNode({ id, label, angle, radius, delay = 0, onClick }: { id: string, label: string, angle: number, radius: number, delay?: number, onClick: (id: string) => void }) {
  const rad = angle * (Math.PI / 180);
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  return (
    <motion.button
      type="button" aria-label={`Maps to ${label}`} onClick={() => onClick(id)}
      initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
      animate={{ opacity: 1, x, y, scale: 1 }}
      exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay }}
      className="absolute top-1/2 left-1/2 -ml-16 -mt-16 w-32 h-32 rounded-full bg-black border-2 border-orange-500 flex flex-col items-center justify-center text-white hover:bg-orange-500 hover:text-black hover:scale-110 transition-all z-20 shadow-[0_0_40px_rgba(249,115,22,0.6)]"
    >
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      <span className="text-[8px] font-mono opacity-60 mt-1 uppercase">GOTO_ROUTE</span>
    </motion.button>
  );
}