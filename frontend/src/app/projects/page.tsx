"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useAnimationFrame } from 'framer-motion';
import Link from 'next/link';
import { 
  Search, User, Settings, Star, LogOut, GitCommit, 
  Terminal, ShieldAlert, Zap, Cpu, Layers, ArchiveRestore, Focus,
  Plus, Minus, ChevronDown, Rocket, Code2, Database, Box, PlayCircle
} from 'lucide-react';

import CustomCursor from '@/components/CustomCursor';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';

// ==========================================
// MOCK DATABASES
// ==========================================
const RECENT_PROJECTS = [
  { id: "v2.4.0", date: "MAY 2026", title: "Quantum UI Framework", type: "Frontend Core", color: "from-orange-500 to-amber-400", icon: Layers, changes: ["Engineered 3D Spatial Cascading Stacks.", "Re-architected the Authentication HUD.", "Optimized Framer Motion physics springs."] },
  { id: "v2.3.5", date: "MAY 2026", title: "Lanka Washing System", type: "Fullstack App", color: "from-orange-600 to-red-500", icon: Terminal, changes: ["30-class Object-Oriented Architecture.", "Java Swing desktop component integration.", "PHP-based central administration panel."] },
  { id: "v2.2.0", date: "APR 2026", title: "AutoHub Platform", type: "Web Platform", color: "from-amber-400 to-orange-500", icon: Database, changes: ["Optimized MySQL database query latency.", "Integrated Stripe payment gateway APIs.", "Secured server routing protocols."] }
];

const INCOMINGS = [
  { title: "AI Neural Network Integration", desc: "Connecting local models to the frontend matrix.", icon: Cpu, delay: 0.1 },
  { title: "Crypto Payment Gateway", desc: "Web3 wallet connection endpoints.", icon: ShieldAlert, delay: 0.2 },
  { title: "Real-time Telemetry Dashboard", desc: "Live web-socket data streaming.", icon: Zap, delay: 0.3 },
  { title: "Server-side Rendering Optimization", desc: "Next.js core caching upgrades.", icon: Code2, delay: 0.4 }
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
// ANIMATED CYBER GRID (Orange Theme)
// ==========================================
function AnimatedCyberGrid({ isLight }: { isLight: boolean }) {
  const bgColor = isLight ? 'bg-slate-50' : 'bg-[#010205]';
  const hexColor = isLight ? 'rgba(249, 115, 22, 0.1)' : 'rgba(249, 115, 22, 0.05)'; 
  return (
    <div className={`fixed inset-0 z-0 pointer-events-none transition-colors duration-1000 ${bgColor} overflow-hidden`}>
      <motion.div animate={{ y: [0, -100, 0] }} transition={{ duration: 40, ease: "linear", repeat: Infinity }} className="absolute inset-0 w-full h-[200%] opacity-50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='103.92304845413264' viewBox='0 0 60 103.92304845413264' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 103.92304845413264L60 86.60254037844386L60 51.96152422706632L30 34.64101615137754L0 51.96152422706632L0 86.60254037844386Z' fill='transparent' stroke='${encodeURIComponent(hexColor)}' stroke-width='1'/%3E%3C/svg%3E")`, backgroundSize: '60px 103.92px' }} />
      <motion.div animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }} transition={{ duration: 12, repeat: Infinity }} className={`absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full blur-[150px] ${isLight ? 'bg-orange-400/20' : 'bg-orange-600/10'}`} />
      <motion.div animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.05, 1] }} transition={{ duration: 9, repeat: Infinity }} className={`absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] rounded-full blur-[180px] ${isLight ? 'bg-amber-400/20' : 'bg-amber-600/10'}`} />
    </div>
  );
}

const ultraSmoothSpring = { type: "spring" as const, stiffness: 120, damping: 20, mass: 1 };

// ==========================================
// MAIN RELEASES / PROJECTS PAGE
// ==========================================
export default function ProjectMatrix() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [timeState, setTimeState] = useState({ time: "", date: "" });
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  
  // Section 1: Stack State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Section 3: Combobox & Filter
  const [filterType, setFilterType] = useState('All Systems');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Section 4: 3D Hologram Carousel Drag
  const carouselDragX = useMotionValue(0);
  const carouselRotation = useTransform(carouselDragX, [-1000, 1000], [360, -360]);

  // Section 5: FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Section 6: Dial State
  const [isDialOpen, setIsDialOpen] = useState(false);
  const [dialHover, setDialHover] = useState(false);

  // Auth State
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
        if (isInternalRoute) {
          setCurrentUserRole('user');
          setIsAuthenticated(true);
        } else {
          setCurrentUserRole('guest');
          setIsAuthenticated(false);
        }
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

  // Theme Variables
  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-600" : "text-slate-400";
  const glassBg = isLightMode ? "bg-white/90 border-slate-200 shadow-2xl" : "bg-[#010308]/90 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]";
  const inputBg = isLightMode ? "bg-slate-100 border-slate-300 focus:border-orange-500" : "bg-black/40 border-orange-500/30 focus:border-orange-500";
  const accentHex = isLightMode ? "#ea580c" : "#f97316";

  const filteredReleases = RECENT_PROJECTS.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.changes.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <main className={`relative min-h-screen font-sans cursor-none overflow-x-hidden flex flex-col transition-colors duration-1000 ${isLightMode ? 'text-slate-900 bg-slate-50' : 'text-white bg-[#010205]'}`}>
      <CustomCursor />
      <AnimatedCyberGrid isLight={isLightMode} />

      <div className="fixed top-24 left-6 lg:left-12 z-[100] pointer-events-auto">
        <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />
      </div>

      {/* ==========================================
          HEADER (PROFILE ICON INCLUDED)
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
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }} exit={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} transition={ultraSmoothSpring}
                    className={`absolute right-0 mt-3 w-56 rounded-2xl backdrop-blur-2xl p-2 flex flex-col transform-gpu shadow-2xl ${glassBg}`}
                  >
                    <Link href="/settings" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}>
                      <Settings size={14} className="mr-3 text-orange-500" /> Settings
                    </Link>
                    <button type="button" aria-label="Saved Links" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-orange-500 rounded-xl transition-all group ${isLightMode ? 'hover:bg-orange-50' : 'hover:bg-orange-500/10'}`}>
                      <Star size={14} className="mr-3 text-orange-400 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" /> Saved Links
                    </button>
                    <div className={`h-px w-full my-1 ${isLightMode ? 'bg-slate-200' : 'bg-slate-800/50'}`} />
                    <button type="button" aria-label="Terminate Link" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 rounded-xl transition-all group ${isLightMode ? 'hover:bg-red-50' : 'hover:bg-red-500/10'}`}>
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
            SKILL 1: RECENT PROJECTS (3D CASCADING STACK)
            ========================================== */}
        <div id="recent" className="max-w-7xl mx-auto w-full px-6 lg:px-12 mb-32">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={ultraSmoothSpring}>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-2 leading-none">
                Recent <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Projects</span>
              </h2>
              <p className={`text-sm md:text-base font-mono tracking-widest uppercase mt-4 ${textSecondary}`}>Deployed Architecture.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, ...ultraSmoothSpring }}
              className={`relative flex items-center w-full md:w-96 rounded-xl border transition-all shadow-xl backdrop-blur-xl ${inputBg}`} 
              style={{ borderColor: isSearching ? accentHex : undefined, boxShadow: isSearching ? `0 0 20px rgba(249,115,22,0.2)` : undefined }}
            >
              <div className={`absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 transition-colors ${isSearching ? 'border-orange-500' : 'border-transparent'}`} />
              <div className={`absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 transition-colors ${isSearching ? 'border-orange-500' : 'border-transparent'}`} />
              <div className={`absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 transition-colors ${isSearching ? 'border-orange-500' : 'border-transparent'}`} />
              <div className={`absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 transition-colors ${isSearching ? 'border-orange-500' : 'border-transparent'}`} />
              
              <Search size={20} className={`ml-5 ${isSearching ? 'text-orange-500' : textSecondary}`} />
              <input 
                type="text" placeholder="Search architecture..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearching(true)} onBlur={() => setIsSearching(false)}
                className="w-full bg-transparent border-none py-4 px-4 text-sm font-mono focus:outline-none placeholder-slate-500"
              />
              {isSearching && <Focus size={16} className="absolute right-5 text-orange-500 animate-pulse" />}
            </motion.div>
          </div>

          <div className="relative w-full flex flex-col items-center [perspective:2000px] mt-10 min-h-[600px]">
            <AnimatePresence mode="popLayout">
              {filteredReleases.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`py-20 text-center font-mono text-xl ${textSecondary}`}>
                  No architecture records match your query.
                </motion.div>
              ) : (
                filteredReleases.map((release, index) => {
                  const isHovered = hoveredCard === release.id;
                  const totalItems = filteredReleases.length;
                  const baseRotateX = 20; 
                  const baseTranslateZ = -index * 60; 
                  const baseScale = 1 - (index * 0.04);
                  const dynamicMargin = index === 0 ? 'mt-0' : '-mt-[140px] md:-mt-[180px]';

                  return (
                    <motion.div
                      key={release.id}
                      onMouseEnter={() => setHoveredCard(release.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      layout
                      initial={{ opacity: 0, y: 100, rotateX: 60 }}
                      animate={{ 
                        opacity: 1, rotateX: isHovered ? 0 : baseRotateX, z: isHovered ? 50 : baseTranslateZ,
                        y: isHovered ? -30 : 0, scale: isHovered ? 1.02 : baseScale,
                      }}
                      exit={{ opacity: 0, y: -100, scale: 0.8 }}
                      transition={ultraSmoothSpring}
                      className={`relative w-full max-w-4xl rounded-3xl p-8 md:p-10 border backdrop-blur-3xl transform-gpu cursor-pointer transition-colors duration-500 ${dynamicMargin} ${
                        isLightMode ? 'bg-white/90 border-slate-300' : 'bg-[#030814]/90 border-orange-900/30 hover:border-orange-500/50'
                      }`}
                      style={{ zIndex: isHovered ? 100 : totalItems - index, boxShadow: isHovered ? `0 50px 100px -20px rgba(0,0,0,0.8), inset 0 0 20px rgba(249,115,22,0.1)` : `0 20px 40px rgba(0,0,0,0.5)` }}
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${release.color} opacity-80 rounded-t-3xl`} />
                      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8">
                        <div className="flex items-center space-x-6">
                          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${release.color} text-white shadow-lg shrink-0`}>
                            <release.icon size={26} />
                          </div>
                          <div>
                            <h3 className={`text-2xl md:text-3xl font-black tracking-tight uppercase ${textPrimary}`}>{release.title}</h3>
                            <div className="flex items-center space-x-3 mt-2">
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded tracking-widest uppercase ${isLightMode ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-slate-300'}`}>{release.id}</span>
                              <span className={`text-xs font-mono tracking-widest ${textSecondary}`}>{release.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase border ${isLightMode ? 'border-slate-300 text-slate-600' : 'border-white/20 text-slate-400'}`}>
                          {release.type}
                        </div>
                      </div>
                      <div className={`w-full h-px mb-8 ${isLightMode ? 'bg-slate-200' : 'bg-white/10'}`} />
                      <ul className="space-y-4">
                        {release.changes.map((change, i) => (
                          <motion.li key={i} initial={false} animate={{ x: isHovered ? 10 : 0, opacity: isHovered ? 1 : 0.6 }} transition={{ delay: i * 0.05 }} className="flex items-start">
                            <GitCommit size={18} className={`mr-4 mt-0.5 shrink-0 transition-colors duration-500 ${isHovered ? 'text-orange-500' : textSecondary}`} />
                            <span className={`text-sm md:text-base font-medium leading-relaxed ${textPrimary}`}>{change}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ==========================================
            SKILL 2: INCOMINGS (INTEGRATED ANIMATION BENTO)
            ========================================== */}
        <div id="incomings" className={`w-full py-32 border-y ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#03060d] border-white/5'}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row gap-12 mb-16">
              <div className="lg:w-1/3">
                <h3 className={`text-xs font-black tracking-[0.3em] uppercase mb-4 ${isLightMode ? 'text-orange-600' : 'text-orange-500'}`}>Incoming Systems</h3>
                <h2 className={`text-4xl font-black uppercase tracking-tighter leading-none ${textPrimary}`}>Future <br/> Architecture</h2>
              </div>
              <div className={`lg:w-2/3 text-lg font-medium leading-relaxed ${textSecondary}`}>
                The matrix is constantly evolving. These are the highly-anticipated frameworks, algorithms, and endpoints currently being prototyped in the local sandbox.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {INCOMINGS.map((item, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ scale: 1.05, y: -10 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className={`relative overflow-hidden p-8 flex flex-col justify-between aspect-square border group cursor-none ${isLightMode ? 'bg-slate-50 border-slate-200 hover:border-orange-400' : 'bg-[#050b14] border-white/10 hover:border-orange-500/50 hover:bg-orange-950/20'}`}
                >
                  <motion.div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-t from-orange-500/20 to-transparent" />
                  
                  <motion.div 
                    initial={{ scale: 1 }} whileHover={{ scale: 1.2, rotate: 10 }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors ${isLightMode ? 'bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white' : 'bg-white/5 text-orange-400 group-hover:bg-orange-500 group-hover:text-black'}`}
                  >
                    <item.icon size={24} />
                  </motion.div>
                  
                  <div className="relative z-10">
                    <h4 className={`text-xl font-black tracking-tight mb-2 ${textPrimary}`}>{item.title}</h4>
                    <p className={`text-xs font-mono font-bold uppercase ${textSecondary} group-hover:text-orange-500 transition-colors`}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ==========================================
            SKILL 3: ALL PROJECTS FILTER & DOUBLE MARQUEE
            ========================================== */}
        <div id="all" className={`w-full py-24 overflow-hidden flex flex-col bg-black border-b border-white/10 relative`}>
          
          {/* Animated Combobox Filter */}
          <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 mb-12 flex justify-end z-20">
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)} aria-label="Toggle Filter"
                className={`flex items-center space-x-4 px-6 py-3 rounded-xl border font-black uppercase tracking-widest text-xs transition-colors ${isFilterOpen ? 'bg-orange-500 text-black border-orange-500' : 'bg-[#050b14] text-white border-white/20 hover:border-orange-500/50'}`}
              >
                <span>{filterType}</span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-[#050b14] border border-white/20 rounded-xl shadow-2xl overflow-hidden"
                  >
                    {['All Systems', 'Frontend', 'Backend', 'AI Models'].map(type => (
                      <button 
                        key={type} aria-label={`Filter by ${type}`}
                        onClick={() => { setFilterType(type); setIsFilterOpen(false); }}
                        className="w-full text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-orange-500 hover:text-black transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Marquee 1: Moves Left (User Draggable) */}
          <motion.div 
            drag="x" dragConstraints={{ left: -1500, right: 0 }}
            className="flex w-fit whitespace-nowrap cursor-grab active:cursor-grabbing mb-4 px-6"
          >
            {/* We duplicate the array to allow for visual looping during drag */}
            {[...ALL_PROJECTS, ...ALL_PROJECTS].map((proj, idx) => (
               <div key={idx} className="inline-flex items-center px-8 py-6 mx-2 border border-white/10 rounded-2xl bg-[#03060d] hover:border-orange-500/50 transition-colors pointer-events-none">
                 <Box size={20} className="mr-4 text-orange-500" />
                 <span className="text-xl font-black uppercase text-white">{proj}</span>
               </div>
            ))}
          </motion.div>

          {/* Marquee 2: Moves Right (User Draggable) */}
          <motion.div 
            drag="x" dragConstraints={{ left: -1500, right: 0 }}
            className="flex w-fit whitespace-nowrap cursor-grab active:cursor-grabbing px-6 ml-[-500px]"
          >
            {[...ALL_PROJECTS].reverse().concat([...ALL_PROJECTS].reverse()).map((proj, idx) => (
               <div key={idx} className="inline-flex items-center px-8 py-6 mx-2 border border-white/10 rounded-2xl bg-orange-600 hover:bg-orange-500 transition-colors pointer-events-none">
                 <Rocket size={20} className="mr-4 text-black" />
                 <span className="text-xl font-black uppercase text-black">{proj}</span>
               </div>
            ))}
          </motion.div>
        </div>

        {/* ==========================================
            SKILL 4: TARGETING BLOCK + HOLOGRAPHIC CAROUSEL
            ========================================== */}
        <div id="hologram" className="w-full py-40 flex flex-col items-center justify-center overflow-hidden relative">
          
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.1)_0%,transparent_70%)] pointer-events-none" />

          {/* Central Target Block */}
          <div className="relative bg-black w-72 h-80 flex flex-col items-center justify-center p-8 shadow-2xl group z-20">
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-4 border-l-4 border-cyan-400 transition-transform group-hover:-translate-x-2 group-hover:-translate-y-2" />
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-4 border-r-4 border-orange-500 transition-transform group-hover:translate-x-2 group-hover:-translate-y-2" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-4 border-l-4 border-pink-500 transition-transform group-hover:-translate-x-2 group-hover:translate-y-2" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-4 border-r-4 border-purple-500 transition-transform group-hover:translate-x-2 group-hover:translate-y-2" />
            
            <h3 className="text-white text-3xl font-black uppercase tracking-tight leading-tight text-center">
              Have an idea?<br/><span className="text-orange-500">We'll make it real.</span>
            </h3>
            <p className="text-white/50 text-[10px] font-mono mt-6 uppercase tracking-[0.2em] animate-pulse">Drag Orbit Below</p>
          </div>

          {/* 3D Holographic CSS Carousel (Draggable) */}
          <div className="relative w-full h-32 mt-20 flex justify-center [perspective:1200px]">
            <motion.div 
              style={{ rotateY: carouselRotation }}
              drag="x" dragConstraints={{ left: -1000, right: 1000 }}
              className="absolute w-[300px] h-[200px] [transform-style:preserve-3d] cursor-grab active:cursor-grabbing flex items-center justify-center"
            >
              {[1, 2, 3, 4, 5].map((item, i) => (
                <Link 
                  href="/feedback" key={i} aria-label={`Provide feedback for Project ${item}`}
                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-center rounded-2xl border border-orange-500/50 bg-black/60 backdrop-blur-md hover:border-orange-400 hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all"
                  style={{ transform: `rotateY(${i * (360 / 5)}deg) translateZ(350px)` }}
                >
                  <PlayCircle size={32} className="text-orange-500 mb-4" />
                  <span className="text-white font-black uppercase tracking-widest text-sm">Project Node {item}</span>
                  <span className="text-white/50 text-[10px] font-mono mt-2 uppercase">Click to Review</span>
                </Link>
              ))}
            </motion.div>
          </div>

        </div>

        {/* ==========================================
            SKILL 5: EXPANDED FAQ & COURSE ANIMATION
            ========================================== */}
        <div id="faq" className={`w-full py-32 border-t ${isLightMode ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-[#010205]'}`}>
          <div className="max-w-5xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/3">
              <h2 className={`text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-6 ${textPrimary}`}>System <br/> Queries.</h2>
              <p className={`font-mono text-sm uppercase tracking-widest ${textSecondary}`}>Dive back into the matrix.</p>
            </div>
            
            <div className="lg:w-2/3 border-t border-current relative">
              {FAQS.map((faq, i) => (
                <div key={i} className={`relative border-b ${isLightMode ? 'border-slate-300' : 'border-white/20'}`}>
                  
                  {/* Course Selection Highlight Animation */}
                  {openFaq === i && (
                    <motion.div 
                      layoutId="faqHighlight"
                      className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent -z-10"
                      initial={false}
                      transition={ultraSmoothSpring}
                    />
                  )}

                  <button aria-label={`Toggle Question ${i+1}`} onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full py-6 px-4 flex items-center justify-between text-left focus:outline-none group relative z-10">
                    <span className={`text-lg md:text-2xl font-black tracking-tight group-hover:text-orange-500 transition-colors ${textPrimary}`}>{faq.q}</span>
                    {openFaq === i ? <Minus size={24} className="text-orange-500 shrink-0 ml-4" /> : <Plus size={24} className={`${textSecondary} shrink-0 ml-4`} />}
                  </button>
                  
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden relative z-10">
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
            SKILL 6: INTERACTIVE NAVIGATION DIAL
            ========================================== */}
        <div id="nav-dial" className={`w-full py-64 flex flex-col items-center justify-center border-t relative overflow-hidden ${isLightMode ? 'bg-white border-slate-200' : 'bg-black border-white/5'}`}>
          
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.05)_0%,transparent_60%)]" />

          {/* Central Interactive Dial */}
          <motion.button
            aria-label="Toggle Navigation Hub"
            onMouseEnter={() => setDialHover(true)} onMouseLeave={() => setDialHover(false)}
            onClick={() => setIsDialOpen(!isDialOpen)}
            animate={{ 
              backgroundColor: isDialOpen ? (isLightMode ? '#ea580c' : '#f97316') : 'transparent',
              borderColor: isDialOpen ? 'transparent' : (dialHover ? '#f97316' : (isLightMode ? '#cbd5e1' : '#334155')),
              scale: dialHover ? 1.05 : 1
            }}
            transition={{ duration: 0.3 }}
            className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full border-4 flex items-center justify-center z-30 shadow-2xl ${isDialOpen ? 'text-white' : textPrimary}`}
          >
            {/* Spinning Ring */}
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, ease: "linear", repeat: Infinity }} className="absolute inset-0 rounded-full border-2 border-dashed border-current opacity-30" />
            
            <div className="flex flex-col items-center">
              <CompassIcon isOpen={isDialOpen} />
              <span className="text-xs font-black uppercase tracking-[0.4em] mt-3">
                {isDialOpen ? 'CLOSE' : 'NAVIGATE'}
              </span>
            </div>
          </motion.button>

          {/* Popping Curve Nodes */}
          <AnimatePresence>
            {isDialOpen && (
              <>
                <NavNode id="recent" label="Recent" angle={-135} radius={180} onClick={scrollToSection} />
                <NavNode id="incomings" label="Upcoming" angle={-45} radius={180} onClick={scrollToSection} />
                <NavNode id="all" label="All Projects" angle={-135} radius={300} delay={0.1} onClick={scrollToSection} />
                <NavNode id="faq" label="Queries" angle={-45} radius={300} delay={0.1} onClick={scrollToSection} />
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

// ---------------------------------------------
// HELPER COMPONENTS FOR DIAL NAV
// ---------------------------------------------
function CompassIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <motion.div animate={{ rotate: isOpen ? 45 : 0 }} className="relative w-8 h-8">
      <div className="absolute top-0 left-1/2 -ml-0.5 w-1 h-full bg-current rounded-full" />
      <div className="absolute top-1/2 left-0 -mt-0.5 w-full h-1 bg-current rounded-full" />
    </motion.div>
  );
}

function NavNode({ id, label, angle, radius, delay = 0, onClick }: { id: string, label: string, angle: number, radius: number, delay?: number, onClick: (id: string) => void }) {
  // Calculate X, Y based on Angle & Radius for that curvy pop-out effect
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
      className="absolute top-1/2 left-1/2 -ml-16 -mt-16 w-32 h-32 rounded-full bg-black border border-orange-500/50 flex flex-col items-center justify-center text-white hover:bg-orange-500 hover:text-black transition-colors z-20 shadow-[0_0_30px_rgba(249,115,22,0.3)]"
    >
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      <span className="text-[8px] font-mono opacity-50 mt-1 uppercase">GOTO_ROUTE</span>
    </motion.button>
  );
}