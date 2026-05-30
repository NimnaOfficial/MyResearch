"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useAnimationFrame } from 'framer-motion';
import Link from 'next/link';
import { 
  Search, User, Settings, Star, LogOut, GitCommit, 
  Terminal, ShieldAlert, Zap, Cpu, Layers, ArchiveRestore, Focus,
  Plus, Minus, ChevronDown, Rocket, Code2, Database, Box, PlayCircle, FolderOpen
} from 'lucide-react';

import CustomCursor from '@/components/CustomCursor';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';

// ==========================================
// MOCK DATABASES (Orange Theme)
// ==========================================
const RECENT_PROJECTS = [
  { id: "v2.4.0", date: "MAY 2026", title: "Quantum UI Framework", type: "Frontend Core", color: "from-orange-500 to-amber-400", icon: Layers, changes: ["Engineered 3D Spatial Cascading Stacks.", "Re-architected the Authentication HUD.", "Optimized Framer Motion physics springs."] },
  { id: "v2.3.5", date: "MAY 2026", title: "Lanka Washing System", type: "Fullstack App", color: "from-orange-600 to-red-500", icon: Terminal, changes: ["30-class Object-Oriented Architecture.", "Java Swing desktop component integration.", "PHP-based central administration panel."] },
  { id: "v2.2.0", date: "APR 2026", title: "AutoHub Platform", type: "Web Platform", color: "from-amber-400 to-orange-500", icon: Database, changes: ["Optimized MySQL database query latency.", "Integrated Stripe payment gateway APIs.", "Secured server routing protocols."] },
  { id: "v2.1.0", date: "MAR 2026", title: "Telemetry Analytics", type: "Data Matrix", color: "from-red-500 to-orange-600", icon: Zap, changes: ["Live web-socket data streaming.", "AJAX payload encryption routing.", "Interactive 3D Hologram deployment."] },
  { id: "v2.0.0", date: "FEB 2026", title: "Security Matrix", type: "Core Patch", color: "from-orange-500 to-pink-500", icon: ShieldAlert, changes: ["Strictly typed session roles.", "Patched vulnerabilities in Contact Matrix.", "Role-aware navigation headers."] }
];

const INCOMINGS = [
  { title: "AI Neural Network", desc: "Connecting local models.", icon: Cpu },
  { title: "Crypto Gateway", desc: "Web3 wallet endpoints.", icon: ShieldAlert },
  { title: "Telemetry Dashboard", desc: "Live web-socket streaming.", icon: Zap },
  { title: "SSR Optimization", desc: "Next.js core upgrades.", icon: Code2 },
  { title: "Quantum Crypto API", desc: "Next-gen encryption.", icon: Terminal }
];

const ALL_PROJECTS = [
  "Integrated Resource Management System", "Lanka Washing System", "AutoHub E-Commerce", 
  "Cyber-Defend Framework", "Quantum UI Components", "AI Image Processor", 
  "Stripe Checkout Portal", "MySQL Database Architect"
];

const FAQS = [
  { q: "What is your primary architectural stack?", a: "I specialize in Next.js, React, and Framer Motion for the frontend, coupled with PHP, Node.js, and complex MySQL databases on the backend." },
  { q: "How do you handle system scaling and latency?", a: "By implementing strict 3D DOM recycling, memoization techniques, and utilizing advanced state management to drop frame rendering times to zero." },
  { q: "Can you integrate AI into existing platforms?", a: "Yes. I have experience bridging Gemini APIs, Google AI Studio, and local LLMs directly into active production environments." },
  { q: "What is the process for deploying a new feature?", a: "Every feature goes through rigorous UI/UX prototyping, followed by local sandbox testing, before being pushed to the live matrix server." },
  { q: "How is security handled across your projects?", a: "I deploy strict CORS policies, encrypted data payloads via AJAX, and role-based matrix authentication to secure the perimeter." }
];

// ==========================================
// CSS ONLY CARBON-COMB BACKGROUND
// ==========================================
function CarbonCombBackground({ isLight }: { isLight: boolean }) {
  const bgColor = isLight ? 'bg-slate-50' : 'bg-[#010205]';
  const combColor = isLight ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.08)'; 
  const fiberColor = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.02)';

  return (
    <div className={`fixed inset-0 z-0 pointer-events-none ${bgColor} overflow-hidden`}>
      <motion.div animate={{ x: [0, -100, 0], y: [0, -100, 0] }} transition={{ duration: 20, ease: "linear", repeat: Infinity }} className="absolute inset-0 w-[200%] h-[200%] opacity-60" style={{ backgroundImage: `repeating-linear-gradient(45deg, ${fiberColor} 25%, transparent 25%, transparent 75%, ${fiberColor} 75%, ${fiberColor}), repeating-linear-gradient(45deg, ${fiberColor} 25%, transparent 25%, transparent 75%, ${fiberColor} 75%, ${fiberColor})`, backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }} />
      <motion.div animate={{ y: [0, -103.92, 0] }} transition={{ duration: 30, ease: "linear", repeat: Infinity }} className="absolute inset-0 w-full h-[200%] opacity-80 mix-blend-screen" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='103.92304845413264' viewBox='0 0 60 103.92304845413264' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 103.92304845413264L60 86.60254037844386L60 51.96152422706632L30 34.64101615137754L0 51.96152422706632L0 86.60254037844386Z' fill='transparent' stroke='${encodeURIComponent(combColor)}' stroke-width='1.5'/%3E%3C/svg%3E")`, backgroundSize: '60px 103.92px' }} />
      <motion.div animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity }} className={`absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full blur-[150px] ${isLight ? 'bg-orange-500/20' : 'bg-orange-600/20'}`} />
    </div>
  );
}

const ultraSmoothSpring = { type: "spring" as const, stiffness: 100, damping: 20, mass: 1 };
const slowExpandSpring = { type: "spring" as const, stiffness: 50, damping: 25, mass: 1.5 };

// ==========================================
// MAIN MATRIX PAGE
// ==========================================
export default function ProjectMatrix() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [timeState, setTimeState] = useState({ time: "", date: "" });
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  
  // Section 1: "Standing File Drawer" State
  const [activeStackIndex, setActiveStackIndex] = useState(0);
  const [isHoveringStack, setIsHoveringStack] = useState(false);

  // Section 3: Combobox & Filter
  const [filterType, setFilterType] = useState('All Systems');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Section 4: 3D Hologram Carousel Cursor Tracking
  const holoMouseX = useMotionValue(0);
  const holoRotY = useMotionValue(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  useAnimationFrame(() => {
    if (!isCarouselHovered) {
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

  // Auto-Cycle Timers
  useEffect(() => {
    const faqTimer = setInterval(() => {
      if (!isFaqHovered) setOpenFaq((prev) => (prev !== null ? (prev + 1) % FAQS.length : 0));
    }, 5000); 

    const stackTimer = setInterval(() => {
      if (!isHoveringStack) setActiveStackIndex((prev) => (prev + 1) % RECENT_PROJECTS.length);
    }, 4000); // Slowed slightly for better reading pace

    return () => { clearInterval(faqTimer); clearInterval(stackTimer); };
  }, [isFaqHovered, isHoveringStack]);

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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsDialOpen(false);
  };

  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-600" : "text-slate-400";
  const glassBg = isLightMode ? "bg-white/90 border-slate-200 shadow-2xl" : "bg-[#010308]/90 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]";
  const inputBg = isLightMode ? "bg-slate-100 border-slate-300 focus:border-orange-500" : "bg-black/40 border-orange-500/30 focus:border-orange-500";
  const accentHex = isLightMode ? "#ea580c" : "#f97316";

  return (
    <main className={`relative min-h-screen font-sans cursor-none overflow-x-hidden flex flex-col transition-colors duration-1000 ${isLightMode ? 'text-slate-900 bg-slate-50' : 'text-white bg-[#010205]'}`}>
      <CustomCursor />
      
      <CarbonCombBackground isLight={isLightMode} />

      <div className="fixed top-24 left-6 lg:left-12 z-[100] pointer-events-auto">
        <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />
      </div>

      {/* ==========================================
          HEADER 
          ========================================== */}
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
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 p-[1.5px] transition-all duration-500">
                    <div className={`w-full h-full rounded-full flex items-center justify-center ${isLightMode ? 'bg-white' : 'bg-[#010205]'}`}>
                      <User size={12} className={textPrimary} />
                    </div>
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest transition-colors ${textPrimary}`} style={{ color: isProfileHovered ? accentHex : undefined }}>Nima</span>
                </div>
              </div>

              <AnimatePresence>
                {isProfileHovered && (
                  <motion.div initial={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }} exit={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} transition={ultraSmoothSpring} className={`absolute right-0 mt-3 w-56 rounded-2xl backdrop-blur-2xl p-2 flex flex-col transform-gpu shadow-2xl ${glassBg}`}>
                    <Link href="/settings" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}>
                      <Settings size={14} className="mr-3 text-orange-500" /> Settings
                    </Link>
                    <button type="button" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-cyan-500 rounded-xl transition-all group ${isLightMode ? 'hover:bg-cyan-50' : 'hover:bg-cyan-500/10'}`}>
                      <Star size={14} className="mr-3 text-orange-400 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" /> Saved Links
                    </button>
                    <div className={`h-px w-full my-1 ${isLightMode ? 'bg-slate-200' : 'bg-slate-800/50'}`} />
                    <button type="button" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 rounded-xl transition-all group ${isLightMode ? 'hover:bg-red-50' : 'hover:bg-red-500/10'}`}>
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
            SKILL 1: THE STANDING FILE DRAWER (FIXED CONTROL)
            ========================================== */}
        <div id="recent" className="max-w-7xl mx-auto w-full px-6 lg:px-12 mb-40">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={ultraSmoothSpring}>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-2 leading-none">
                Recent <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Projects</span>
              </h2>
              <p className={`text-sm md:text-base font-mono tracking-widest uppercase mt-4 ${textSecondary}`}>Architecture Deck. Click or Drag files to cycle.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, ...ultraSmoothSpring }}
              className={`relative flex items-center w-full md:w-96 rounded-xl border transition-all shadow-xl backdrop-blur-xl z-20 ${inputBg}`} 
            >
              <Search size={20} className={`ml-5 text-orange-500`} />
              <input 
                type="text" placeholder="Search architecture..." 
                className="w-full bg-transparent border-none py-4 px-4 text-sm font-mono focus:outline-none placeholder-slate-500"
              />
            </motion.div>
          </div>

          {/* STANDING DRAWER PHYSICS CONTAINER */}
          <div 
            className="relative w-full flex flex-col justify-end items-center [perspective:1500px] h-[550px] z-10 pb-10"
            onMouseEnter={() => setIsHoveringStack(true)}
            onMouseLeave={() => setIsHoveringStack(false)}
          >
            {RECENT_PROJECTS.map((project, i) => {
              const total = RECENT_PROJECTS.length;
              const offset = (i - activeStackIndex + total) % total;
              
              const isFront = offset === 0;
              const isLeaving = offset === total - 1; 
              const isVisible = offset >= 0 && offset < 4; 

              let yPos = 0;
              let zPos = 0;
              let rotX = 0;
              let opacity = 1;
              let scale = 1;

              if (isFront) {
                 yPos = 0; zPos = 0; rotX = 0; opacity = 1; scale = 1;
              } else if (isLeaving) {
                 yPos = 300; zPos = 100; rotX = -20; opacity = 0; scale = 1.1; 
              } else {
                 yPos = -offset * 75;   // Increased spread for easy clicking
                 zPos = -offset * 120;  // Pushes it into the drawer
                 rotX = offset * 4;     // Adds the slight backward lean
                 opacity = 1 - (offset * 0.15); // Better visibility for back cards
                 scale = 1 - (offset * 0.04);
              }

              return (
                <motion.div
                  key={project.id}
                  onClick={() => setActiveStackIndex(i)} // TACTILE CLICK TO SELECT
                  drag="y" // SWIPE GESTURE SUPPORT
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(e, { offset, velocity }) => {
                    if (offset.y < -50 || velocity.y < -500) {
                      setActiveStackIndex((prev) => (prev + 1) % total);
                    } else if (offset.y > 50 || velocity.y > 500) {
                      setActiveStackIndex((prev) => (prev - 1 + total) % total);
                    }
                  }}
                  animate={{
                    y: yPos,
                    z: zPos,
                    rotateX: rotX,
                    scale: scale,
                    opacity: isVisible || isLeaving ? opacity : 0,
                    zIndex: total - offset
                  }}
                  whileHover={{
                    scale: isFront ? 1 : scale + 0.02, 
                    cursor: isFront ? "grab" : "pointer"
                  }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  className="absolute bottom-0 w-full max-w-4xl h-[380px] md:h-[420px] active:cursor-grabbing"
                  style={{ transformOrigin: "bottom center" }}
                >
                  {/* FOLDER TAB */}
                  <div className={`absolute -top-10 left-8 px-6 py-2.5 rounded-t-xl border-t border-l border-r flex items-center gap-3 shadow-lg z-20 transition-colors ${
                      isFront ? 'bg-orange-600 border-orange-400' : 'bg-orange-900 border-orange-700/50'
                  }`}>
                     <FolderOpen size={16} className={isFront ? "text-black" : "text-orange-400"} />
                     <span className={`font-black uppercase text-xs tracking-widest ${isFront ? "text-black" : "text-orange-400"}`}>{project.id}</span>
                  </div>

                  {/* MAIN CARD BODY */}
                  <div className={`absolute top-0 bottom-0 left-0 right-0 rounded-3xl border overflow-hidden flex flex-col justify-between p-8 md:p-10 transition-colors duration-500 shadow-2xl ${
                      isLightMode ? 'bg-white/95 border-slate-300' : 'bg-[#050b14]/95 border-orange-500/30 backdrop-blur-xl'
                  } ${isFront ? 'border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.2)]' : 'hover:border-orange-400'}`}>
                    
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${project.color}`} />

                    <div>
                      <div className="flex justify-between items-start mb-6 mt-2">
                         <h3 className={`text-3xl md:text-5xl font-black tracking-tight uppercase ${textPrimary}`}>{project.title}</h3>
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${project.color} text-black shrink-0`}>
                           <project.icon size={24} />
                         </div>
                      </div>
                      
                      <div className="inline-flex px-4 py-2 bg-orange-500/10 text-orange-500 font-black text-[10px] tracking-[0.2em] uppercase rounded-lg border border-orange-500/30 mb-8">
                         {project.type}
                      </div>
                      
                      <ul className="space-y-4">
                         {project.changes.map((change, idx) => (
                           <li key={idx} className="flex items-start">
                              <GitCommit size={18} className="mr-4 mt-0.5 shrink-0 text-orange-500" />
                              <span className={`text-sm md:text-base font-medium leading-relaxed ${textPrimary}`}>{change}</span>
                           </li>
                         ))}
                      </ul>
                    </div>

                    <div className="w-full border-t border-white/10 pt-5 flex justify-between items-center text-orange-500/60 font-mono text-[10px] uppercase tracking-widest">
                       <span>DEPLOYED: {project.date}</span>
                       <span>[ SYSTEM MATRIX ]</span>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ==========================================
            SKILL 2: INCOMINGS (AUTO-SCROLL CURVED MONITOR)
            ========================================== */}
        <div id="incomings" className={`w-full py-32 border-y overflow-hidden relative ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#03060d] border-white/5'}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-16 relative z-10">
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="lg:w-1/3">
                <h3 className={`text-xs font-black tracking-[0.3em] uppercase mb-4 ${isLightMode ? 'text-orange-600' : 'text-orange-500'}`}>Incoming Systems</h3>
                <h2 className={`text-4xl font-black uppercase tracking-tighter leading-none ${textPrimary}`}>Future <br/> Architecture</h2>
              </div>
              <div className={`lg:w-2/3 text-lg font-medium leading-relaxed ${textSecondary}`}>
                Auto-scrolling immersive HUD. The cards physically curve in 3D space, mirroring a panoramic gaming monitor setup.
              </div>
            </div>
          </div>

          <div className="w-full flex justify-center [perspective:2000px] h-[400px] mt-10">
            <motion.div animate={{ rotateY: [0, -360] }} transition={{ ease: "linear", duration: 40, repeat: Infinity }} className="relative w-[320px] h-full [transform-style:preserve-3d]">
              {[...INCOMINGS, ...INCOMINGS].map((item, i) => {
                const angle = i * (360 / 10);
                return (
                  <motion.div 
                    key={i} style={{ transform: `rotateY(${angle}deg) translateZ(600px)` }}
                    whileHover={{ scale: 1.05, backgroundColor: isLightMode ? '#fff' : '#010205', borderColor: '#f97316' }}
                    className={`absolute inset-0 p-8 flex flex-col justify-between border-2 rounded-3xl transition-colors duration-500 ${isLightMode ? 'bg-slate-50 border-slate-200 shadow-xl' : 'bg-[#050b14]/80 backdrop-blur-md border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)]'}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-orange-500/10 text-orange-500 border border-orange-500/30`}>
                      <item.icon size={28} />
                    </div>
                    <div className="relative z-10">
                      <h4 className={`text-2xl font-black tracking-tight mb-3 leading-snug ${textPrimary}`}>{item.title}</h4>
                      <p className={`text-sm font-mono font-bold uppercase ${textSecondary}`}>{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* ==========================================
            SKILL 3: ALL PROJECTS FILTER & AUTO-MARQUEE
            ========================================== */}
        <div id="all" className={`w-full py-24 overflow-hidden flex flex-col bg-black border-b border-white/10 relative z-20`}>
          <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 mb-12 flex justify-end z-30">
            <div className="relative">
              <button onClick={() => setIsFilterOpen(!isFilterOpen)} aria-label="Toggle Filter" className={`flex items-center space-x-4 px-6 py-3 rounded-xl border font-black uppercase tracking-widest text-xs transition-colors ${isFilterOpen ? 'bg-orange-500 text-black border-orange-500' : 'bg-[#050b14] text-white border-white/20 hover:border-orange-500/50'}`}>
                <span>{filterType}</span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute top-full right-0 mt-2 w-48 bg-[#050b14] border border-white/20 rounded-xl shadow-2xl overflow-hidden">
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

          <div className="flex w-fit whitespace-nowrap mb-6 group cursor-none">
            <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ ease: "linear", duration: 30, repeat: Infinity }} className="flex gap-4 px-2">
              {[...ALL_PROJECTS, ...ALL_PROJECTS].map((proj, idx) => (
                 <motion.div key={idx} whileHover={{ scale: 1.05, backgroundColor: '#f97316', borderColor: '#f97316' }} className="inline-flex items-center px-8 py-6 mx-2 border border-white/10 rounded-2xl bg-[#03060d] transition-colors group-hover:[&:not(:hover)]:opacity-50">
                   <Box size={20} className="mr-4 text-white" />
                   <span className="text-xl font-black uppercase text-white">{proj}</span>
                 </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="flex w-fit whitespace-nowrap group cursor-none ml-[-1000px]">
            <motion.div animate={{ x: ["-50%", "0%"] }} transition={{ ease: "linear", duration: 30, repeat: Infinity }} className="flex gap-4 px-2">
              {[...ALL_PROJECTS].reverse().concat([...ALL_PROJECTS].reverse()).map((proj, idx) => (
                 <motion.div key={idx} whileHover={{ scale: 1.05, backgroundColor: '#000', borderColor: '#f97316', color: '#f97316' }} className="inline-flex items-center px-8 py-6 mx-2 border border-orange-500 rounded-2xl bg-orange-600 transition-colors group-hover:[&:not(:hover)]:opacity-50">
                   <Rocket size={20} className="mr-4 text-black" />
                   <span className="text-xl font-black uppercase text-black">{proj}</span>
                 </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ==========================================
            SKILL 4: SLOW CURSOR-TRACKING HOLOGRAPHIC CAROUSEL
            ========================================== */}
        <div 
          id="hologram" 
          className="w-full py-40 flex flex-col items-center justify-center overflow-hidden relative z-10"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            holoMouseX.set(x);
          }}
          onMouseLeave={() => holoMouseX.set(0)}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.1)_0%,transparent_70%)] pointer-events-none" />

          <div className="relative bg-black w-72 h-80 flex flex-col items-center justify-center p-8 shadow-2xl group z-20">
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-4 border-l-4 border-cyan-400 transition-transform group-hover:-translate-x-2 group-hover:-translate-y-2" />
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-4 border-r-4 border-orange-500 transition-transform group-hover:translate-x-2 group-hover:-translate-y-2" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-4 border-l-4 border-pink-500 transition-transform group-hover:-translate-x-2 group-hover:translate-y-2" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-4 border-r-4 border-purple-500 transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
            
            <h3 className="text-white text-3xl font-black uppercase tracking-tight leading-tight text-center">
              Have an idea?<br/><span className="text-orange-500">We'll make it real.</span>
            </h3>
            <p className="text-white/50 text-[10px] font-mono mt-6 uppercase tracking-[0.2em] animate-pulse">Move Cursor to Spin Orbit</p>
          </div>

          <div className="relative w-full h-32 mt-20 flex justify-center [perspective:1200px]">
            <motion.div style={{ rotateY: holoRotY }} className="absolute w-[300px] h-[200px] [transform-style:preserve-3d] flex items-center justify-center">
              {[1, 2, 3, 4, 5].map((item, i) => (
                <Link 
                  href="/feedback" key={i} aria-label={`Provide feedback for Project ${item}`}
                  onMouseEnter={() => setIsCarouselHovered(true)} 
                  onMouseLeave={() => setIsCarouselHovered(false)}
                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-center rounded-2xl border border-orange-500/50 bg-black/80 backdrop-blur-md hover:border-orange-400 hover:bg-orange-950/80 hover:scale-110 hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300"
                  style={{ transform: `rotateY(${i * (360 / 5)}deg) translateZ(350px)` }}
                >
                  <PlayCircle size={32} className="text-orange-500 mb-4 animate-pulse" />
                  <span className="text-white font-black uppercase tracking-widest text-sm">Project Node {item}</span>
                  <span className="text-orange-500/80 text-[10px] font-mono mt-2 uppercase">Route to Feedback</span>
                </Link>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ==========================================
            SKILL 5: AUTO-EXPANDING FAQ 
            ========================================== */}
        <div id="faq" className={`w-full py-32 border-t ${isLightMode ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-[#010205]'}`}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/3">
              <h2 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6 ${textPrimary}`}>System <br/> Queries.</h2>
              <p className={`font-mono text-sm uppercase tracking-widest ${textSecondary}`}>Automated Core Scan Sequence.</p>
            </div>
            
            <div className="lg:w-2/3 border-t border-current relative" onMouseEnter={() => setIsFaqHovered(true)} onMouseLeave={() => setIsFaqHovered(false)}>
              {FAQS.map((faq, i) => (
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
        <div id="nav-dial" className={`w-full py-64 flex flex-col items-center justify-center border-t relative overflow-hidden ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#03060d] border-white/5'}`}>
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
    </main>
  );
}

function NavNode({ id, label, angle, radius, delay = 0, onClick }: { id: string, label: string, angle: number, radius: number, delay?: number, onClick: (id: string) => void }) {
  const rad = angle * (Math.PI / 180);
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  return (
    <motion.button
      type="button" aria-label={`Navigate to ${label}`} onClick={() => onClick(id)}
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