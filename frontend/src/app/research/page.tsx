"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link'; 
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshReflectorMaterial, Text, OrbitControls, Sparkles, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Search, BrainCircuit, Shield, Database, ArrowRight, 
  SlidersHorizontal, Library, User, LayoutTemplate, Star, LogOut, Settings, Link as LinkIcon, FileText, Hexagon, ArrowUpRight, Clock
} from 'lucide-react';

import CustomCursor from '@/components/CustomCursor';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';

// ==========================================
// DATA INJECTIONS
// ==========================================
const RECENT_RESEARCH = [
  { id: 101, title: "System Architecture Docs", label: "Documentation", desc: "Comprehensive guides detailing entity relationships and structural frameworks for enterprise systems." },
  { id: 102, title: "Database Optimization", label: "Research Paper", desc: "Academic sources and methodologies on normalizing schemas to minimize latency on heavy queries." },
  { id: 103, title: "UML Design Patterns", label: "Resource Link", desc: "A curated collection of 30-class architectural blueprints and sequence mapping references." },
];

const UPCOMING_TOPICS = [
  { id: 1, title: "Gen-AI Methodologies", tech: "Whitepaper", angle: 0 },
  { id: 2, title: "Neural Media Synthesis", tech: "Case Study", angle: Math.PI / 2 },
  { id: 3, title: "Advanced Prompting", tech: "Guide", angle: Math.PI },
  { id: 4, title: "Cyber Defense Protocols", tech: "Security Log", angle: (3 * Math.PI) / 2 },
];

// NEW: RADIAL CAROUSEL DATA (Based on your video inspiration)
const RADIAL_CONCEPTS = [
  { id: "R1", letter: "V", title: "Visual Synthesis", subtitle: "GEN-AI MEDIA" },
  { id: "R2", letter: "U", title: "UI/UX Dynamics", subtitle: "MOTION PHYSICS" },
  { id: "R3", letter: "M", title: "Matrix Core", subtitle: "SYSTEM ARCHITECTURE" },
  { id: "R4", letter: "S", title: "Spatial Compute", subtitle: "3D RENDERING" },
  { id: "R5", letter: "Q", title: "Quantum Logic", subtitle: "ALGORITHMS" },
];

const ALL_RESOURCES = [
  { id: 201, title: "PAYROLL_LOGIC_MAPPING", tech: "PDF / Flowchart", status: "VERIFIED", desc: "Detailed chronological sequence mapping of payroll initialization." },
  { id: 202, title: "REACT_LIFECYCLE_GUIDES", tech: "Web Resource", status: "ACTIVE", desc: "External links to efficient component rendering and state management." },
  { id: 203, title: "SERVER_DEFENSE_WIKI", tech: "Internal Wiki", status: "AUDIT", desc: "Information on localized server node defenses and threat mitigation." },
  { id: 204, title: "FREEDB_INTEGRATION", tech: "API Docs", status: "STABLE", desc: "External documentation on structural modeling and API endpoints." }
];

const FILTERS = [
  { id: "all", label: "All Resources", icon: Library },
  { id: "docs", label: "Documentation", icon: FileText },
  { id: "ai", label: "AI Research", icon: BrainCircuit },
  { id: "sec", label: "Security Logs", icon: Shield },
  { id: "db", label: "Databases", icon: Database },
];

const spatialReveal = {
  hidden: { opacity: 0, y: 80, rotateX: 15, scale: 0.9 },
  visible: { 
    opacity: 1, y: 0, rotateX: 0, scale: 1, 
    transition: { type: "spring" as const, stiffness: 70, damping: 20, mass: 1 } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const ultraSmoothSpring = { type: "spring" as const, stiffness: 120, damping: 20, mass: 0.8 };

// ==========================================
// BACKGROUND: ACTIVE THEME-AWARE NODES
// ==========================================
function ActiveDataBackground({ isLight }: { isLight: boolean }) {
  const nodes = Array.from({ length: 20 });
  const gridColor = isLight ? 'rgba(0,255,102,0.1)' : 'rgba(0,255,102,0.03)';
  const gridColor2 = isLight ? 'rgba(0,240,255,0.1)' : 'rgba(0,240,255,0.03)';
  const bgColor = isLight ? 'bg-slate-50' : 'bg-[#010205]';

  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-1000 ${bgColor}`}>
      {/* Dynamic 3D Grid */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" 
        style={{
          backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor2} 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />
      
      {/* Floating 3D Hexagons */}
      {nodes.map((_, i) => {
        const size = Math.random() * 30 + 10;
        const isCyan = i % 2 === 0;
        return (
          <motion.div
            key={i}
            className={`absolute flex items-center justify-center opacity-30 ${isCyan ? 'text-[#00f0ff]' : 'text-[#00ff66]'}`}
            style={{ left: `${Math.random() * 100}vw`, top: `${Math.random() * 100}vh` }}
            animate={{
              y: [0, Math.random() * -150 - 50, 0],
              x: [0, Math.random() * 50 - 25, 0],
              rotateZ: [0, Math.random() * 180, 360],
              rotateX: [0, 180, 360], 
              scale: [1, Math.random() * 0.5 + 1, 1],
              opacity: [0.1, 0.5, 0.1]
            }}
            transition={{ duration: Math.random() * 25 + 15, repeat: Infinity, ease: "linear" }}
          >
            <Hexagon size={size} strokeWidth={1.5} />
          </motion.div>
        );
      })}

      {/* Atmospheric Theme Glows */}
      <motion.div animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity }} className={`absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full blur-[150px] ${isLight ? 'bg-[#00ff66]/20' : 'bg-[#00ff66]/10'}`} />
      <motion.div animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity }} className={`absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[180px] ${isLight ? 'bg-[#00f0ff]/20' : 'bg-[#00f0ff]/10'}`} />
    </div>
  );
}

// ==========================================
// ARTWORK 5: 3D THEME-AWARE CYLINDER
// ==========================================
function SpatialUpcomingCarousel({ isLight }: { isLight: boolean }) {
  return (
    <group position={[0, -0.5, 0]}>
      <ambientLight intensity={isLight ? 1 : 0.5} />
      <directionalLight position={[0, 10, 5]} intensity={isLight ? 3 : 2} color="#00ff66" />
      <directionalLight position={[-5, 5, -5]} intensity={isLight ? 3 : 2} color="#00f0ff" />
      
      {/* Theme Aware Reflective Floor */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[300, 100]} resolution={1024} mixBlur={1} mixStrength={isLight ? 30 : 60} roughness={isLight ? 0.2 : 0.7}
          depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.4}
          color={isLight ? "#e2e8f0" : "#010205"} metalness={isLight ? 0.3 : 0.8} mirror={1}
        />
      </mesh>

      {UPCOMING_TOPICS.map((topic, i) => (
        <Float key={i} speed={2} floatIntensity={0.5} rotationIntensity={0.2}>
          <group position={[Math.sin(topic.angle) * 3.5, 0, Math.cos(topic.angle) * 3.5]} rotation={[0, topic.angle, 0]}>
            <RoundedBox args={[3, 4, 0.05]} radius={0.1} smoothness={4}>
              <meshPhysicalMaterial 
                color={isLight ? "#ffffff" : "#000510"} 
                metalness={isLight ? 0.1 : 0.9} 
                roughness={0.2} transmission={0.9} thickness={0.5} 
                emissive="#00f0ff" emissiveIntensity={isLight ? 0.1 : 0.05} 
              />
            </RoundedBox>
            <RoundedBox args={[3.02, 4.02, 0.02]} radius={0.1} smoothness={4}>
              <meshBasicMaterial color="#00ff66" wireframe opacity={isLight ? 0.8 : 0.5} transparent />
            </RoundedBox>
            <Text position={[0, 0.6, 0.1]} fontSize={0.25} color={isLight ? "#0f172a" : "#ffffff"} font="/fonts/Inter-Black.woff" anchorX="center" anchorY="middle" maxWidth={2.5} textAlign="center">
              {topic.title}
            </Text>
            <Text position={[0, -0.4, 0.1]} fontSize={0.14} color={isLight ? "#0284c7" : "#00f0ff"} font="/fonts/Inter-Bold.woff" anchorX="center" anchorY="middle">
              [ {topic.tech} ]
            </Text>
          </group>
        </Float>
      ))}
      <Sparkles count={150} scale={10} size={2} speed={0.2} color={isLight ? "#0284c7" : "#00f0ff"} opacity={isLight ? 0.8 : 0.4} />
    </group>
  );
}

// ==========================================
// MASTER RESEARCH VAULT
// ==========================================
export default function MasterResearchVault() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchFocused, setSearchFocused] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [timeState, setTimeState] = useState({ time: "", date: "" });
  
  const [activeRecent, setActiveRecent] = useState(101);
  const [isHoveringRecent, setIsHoveringRecent] = useState(false);
  
  // State for the NEW Radial Carousel
  const [activeRadial, setActiveRadial] = useState(2);

  // Dynamic Theme Variables
  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-600" : "text-slate-400";
  const glassBg = isLightMode ? "bg-white/80 border-slate-200 shadow-xl" : "bg-[#010308]/80 border-[#00f0ff]/10 shadow-2xl";
  const cardBg = isLightMode ? "bg-white border-slate-200 shadow-md" : "bg-black/20 border-white/5";

  // Live Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeState({
        time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      });
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Smooth Auto-Accordion
  useEffect(() => {
    if (isHoveringRecent) return;
    const interval = setInterval(() => {
      setActiveRecent(prev => {
        const currentIndex = RECENT_RESEARCH.findIndex(p => p.id === prev);
        const nextIndex = (currentIndex + 1) % RECENT_RESEARCH.length;
        return RECENT_RESEARCH[nextIndex].id;
      });
    }, 6000); 
    return () => clearInterval(interval);
  }, [isHoveringRecent]);

  return (
    <main className={`relative min-h-screen font-sans cursor-none overflow-x-hidden selection:bg-[#00ff66]/30 flex transition-colors duration-1000 ${isLightMode ? 'bg-slate-50' : 'bg-[#010205]'}`}>
      <CustomCursor />
      
      <div className="relative z-[100]">
        <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />
      </div>

      {/* DYNAMIC BACKGROUND */}
      <ActiveDataBackground isLight={isLightMode} />

      {/* ==========================================
          SIDEBAR: SPATIAL 3D REVEAL
          ========================================== */}
      <motion.aside 
        onMouseEnter={() => setIsSidebarHovered(true)} onMouseLeave={() => setIsSidebarHovered(false)}
        initial={false} animate={{ width: isSidebarHovered ? 280 : 88 }} transition={ultraSmoothSpring}
        className={`fixed left-0 top-0 h-screen border-r flex flex-col pt-32 pb-8 z-50 shrink-0 overflow-hidden backdrop-blur-3xl transition-colors duration-700 ${isLightMode ? 'bg-white/90 border-slate-200 shadow-[20px_0_50px_rgba(0,0,0,0.05)]' : 'bg-[#010308]/90 border-[#00f0ff]/10 shadow-[20px_0_50px_rgba(0,0,0,0.5)]'}`}
      >
        <div className="px-6 flex items-center justify-start mb-12 whitespace-nowrap">
          <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-[#00ff66] to-[#00f0ff] rounded-lg flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,255,102,0.3)] mr-4">
            <Library size={20} className="animate-pulse" />
          </div>
          <motion.div animate={{ opacity: isSidebarHovered ? 1 : 0 }} transition={{ duration: 0.3 }} className="flex flex-col">
            <h1 className={`text-xl font-black tracking-widest uppercase ${textPrimary}`}>CSx<span className="text-[#00f0ff]">PEDIA</span></h1>
            <p className="text-[10px] font-mono text-[#00ff66] tracking-[0.2em] uppercase">Data Matrix</p>
          </motion.div>
        </div>

        <motion.div animate={{ opacity: isSidebarHovered ? 1 : 0 }} className="px-6 flex items-center space-x-2 mb-6 whitespace-nowrap">
          <SlidersHorizontal size={14} className={isLightMode ? "text-slate-400" : "text-[#00f0ff]/50"} />
          <span className={`text-xs font-bold uppercase tracking-widest ${isLightMode ? "text-slate-400" : "text-[#00f0ff]/50"}`}>Query Parameters</span>
        </motion.div>

        <div className="flex flex-col space-y-2 flex-grow px-4">
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id} onClick={() => setActiveFilter(filter.id)}
                className={`relative p-4 rounded-xl flex items-center text-xs font-bold uppercase tracking-widest transition-all duration-300 overflow-hidden group whitespace-nowrap ${
                  isActive ? (isLightMode ? 'text-white' : 'text-black') : (isLightMode ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5')
                } ${!isSidebarHovered && 'justify-center'}`}
              >
                {isActive && (
                  <motion.div layoutId="activeFilterBg" className="absolute inset-0 bg-gradient-to-r from-[#00ff66] to-[#00f0ff] rounded-xl z-0 shadow-[0_0_15px_rgba(0,240,255,0.3)]" />
                )}
                <span className="relative z-10 flex items-center w-full">
                  <filter.icon size={18} className={`shrink-0 ${isSidebarHovered ? 'mr-4' : 'mr-0'} ${isActive ? (isLightMode ? 'text-white' : 'text-black') : (isLightMode ? 'text-slate-400 group-hover:text-[#00f0ff]' : 'text-[#00f0ff]/50 group-hover:text-[#00ff66]')}`} />
                  <motion.span animate={{ opacity: isSidebarHovered ? 1 : 0, width: isSidebarHovered ? "auto" : 0 }} className="overflow-hidden">
                    {filter.label}
                  </motion.span>
                </span>
              </button>
            );
          })}
        </div>
      </motion.aside>

      {/* ==========================================
          MAIN SPATIAL CONTENT AREA 
          ========================================== */}
      <div className="ml-[88px] flex-1 overflow-y-auto overflow-x-hidden pb-40 custom-scrollbar relative z-10">
        
        {/* FLOATING HEADER: 3D DROP-IN */}
        <motion.div initial={{ opacity: 0, y: -50, rotateX: 45 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={ultraSmoothSpring} className="sticky top-0 z-50 pt-6 px-6 lg:px-12 flex justify-end pointer-events-none">
          <div className="relative pointer-events-auto" onMouseEnter={() => setIsProfileHovered(true)} onMouseLeave={() => setIsProfileHovered(false)}>
            <div className={`flex items-center space-x-4 px-6 py-2.5 rounded-full backdrop-blur-xl cursor-pointer transition-colors duration-700 ${glassBg}`}>
              <span className="text-[#00ff66] font-mono text-xs tracking-widest hidden sm:block">
                {timeState.date} <span className={textSecondary}>|</span> {timeState.time}
              </span>
              <div className={`w-px h-4 hidden sm:block ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`}></div>
              <div className="flex items-center space-x-3 group">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#00ff66] to-[#00f0ff] p-[1.5px]">
                  <div className={`w-full h-full rounded-full flex items-center justify-center ${isLightMode ? 'bg-white' : 'bg-[#010205]'}`}>
                    <User size={12} className={textPrimary} />
                  </div>
                </div>
                <span className={`text-xs font-black uppercase tracking-widest transition-colors ${textPrimary} group-hover:text-[#00f0ff]`}>Nima</span>
              </div>
            </div>

            <AnimatePresence>
              {isProfileHovered && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }} exit={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} transition={ultraSmoothSpring}
                  className={`absolute right-0 mt-3 w-56 rounded-2xl backdrop-blur-2xl p-2 flex flex-col transform-gpu ${glassBg}`}
                >
                  <Link href="/settings" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}>
                    <Settings size={14} className="mr-3 text-[#00f0ff]" /> Settings
                  </Link>
                  <button className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-yellow-500 rounded-xl transition-all group ${isLightMode ? 'hover:bg-yellow-50' : 'hover:bg-yellow-500/10'}`}>
                    <Star size={14} className="mr-3 text-yellow-400 group-hover:drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" /> Saved Links
                  </button>
                  <div className={`h-px w-full my-1 ${isLightMode ? 'bg-slate-200' : 'bg-slate-800/50'}`} />
                  <button className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 rounded-xl transition-all group ${isLightMode ? 'hover:bg-red-50' : 'hover:bg-red-500/10'}`}>
                    <LogOut size={14} className="mr-3 text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> Terminate Link
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="px-6 lg:px-12 pt-8">
          
          {/* SEARCH BAR (SPRING ANIMATION) */}
          <motion.div initial="hidden" animate="visible" variants={spatialReveal} className="mb-20 flex justify-center">
            <motion.div 
              layout initial={{ width: "60%" }} animate={{ width: searchFocused ? "100%" : "60%" }} transition={ultraSmoothSpring}
              className={`relative flex items-center backdrop-blur-xl rounded-full overflow-hidden transition-all duration-500 ${glassBg} ${searchFocused ? 'ring-2 ring-[#00ff66] shadow-[0_0_40px_rgba(0,255,102,0.2)]' : 'hover:border-[#00f0ff]/40'}`}
            >
              <div className={`p-4 pl-6 ${searchFocused ? 'text-[#00ff66]' : 'text-[#00f0ff]'}`}>
                <Search size={20} />
              </div>
              <input 
                type="text" placeholder="Search the research matrix..." 
                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                className={`bg-transparent border-none font-mono text-sm py-4 pr-8 w-full focus:outline-none ${textPrimary} placeholder-slate-400`}
              />
            </motion.div>
          </motion.div>

          {/* ==========================================
              ARTWORK 4: RECENT RESEARCH (DYNAMIC FLEX-FILL SPINES)
              BUG FIX: Swapped fixed width for fixed max-width so it dynamically fills perfectly!
              ========================================== */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={spatialReveal} className="mb-32">
            <div className="flex items-center space-x-3 mb-8">
              <Clock className="text-[#00ff66]" size={24} />
              <h2 className="text-3xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00ff66] to-[#00f0ff]">Recent Insights</h2>
            </div>
            
            {/* Added w-full to dynamically push against margins, creating a flawless fit */}
            <div className="flex flex-col md:flex-row h-[420px] gap-4 lg:gap-6 w-full justify-center [perspective:2000px]" onMouseEnter={() => setIsHoveringRecent(true)} onMouseLeave={() => setIsHoveringRecent(false)}>
              {RECENT_RESEARCH.map((item) => {
                const isActive = activeRecent === item.id;
                return (
                  <motion.div
                    key={item.id} layout transition={ultraSmoothSpring} onMouseEnter={() => setActiveRecent(item.id)}
                    animate={{
                      rotateY: isActive ? 0 : -12, // 3D Book Tilt
                      z: isActive ? 0 : -40,       // Deep push back when inactive
                      scale: isActive ? 1 : 0.95,
                    }}
                    whileHover={{ scale: isActive ? 1.01 : 1.03 }} // Tactile 3D pop on hover
                    className={`relative overflow-hidden rounded-[2.5rem] cursor-pointer border transition-colors duration-500 origin-left ${
                      isActive 
                        // Strict width for active state
                        ? (isLightMode ? 'bg-white shadow-[0_30px_60px_rgba(0,255,102,0.15)] border-[#00ff66]/40 w-full md:w-[450px] lg:w-[750px] shrink-0' : 'bg-[#02050a] border-[#00ff66]/50 shadow-[0_0_50px_rgba(0,255,102,0.2)] w-full md:w-[450px] lg:w-[750px] shrink-0')
                        : (isLightMode ? 'bg-slate-200 border-slate-300 w-[60px] lg:w-[90px] shrink-0 opacity-70 hover:opacity-100 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.1)]' : 'bg-[#050b14] border-[#00f0ff]/10 w-[60px] lg:w-[90px] shrink-0 opacity-70 hover:opacity-100 hover:border-[#00f0ff]/40 shadow-[inset_-15px_0_30px_rgba(0,0,0,0.8)]')
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-t from-[#00ff66]/10 to-transparent opacity-0 transition-opacity duration-700 ${isActive ? 'opacity-100' : ''}`} />

                    <motion.div layout transition={ultraSmoothSpring} className={`relative z-10 flex flex-col h-full ${isActive ? 'p-8 justify-end' : 'py-8 items-center justify-start'}`}>
                      <motion.div layout transition={ultraSmoothSpring} className={`flex items-center justify-center rounded-xl transition-colors shrink-0 ${isActive ? 'w-14 h-14 bg-gradient-to-br from-[#00ff66] to-[#00f0ff] text-black mb-auto' : (isLightMode ? 'w-10 h-10 bg-slate-300 text-slate-600 mb-8' : 'w-10 h-10 bg-[#010205] border border-[#00f0ff]/20 text-[#00f0ff]/70 mb-8')}`}>
                        <FileText size={isActive ? 24 : 18} />
                      </motion.div>
                      
                      <div className={`flex flex-col justify-end flex-grow ${isActive ? 'w-full' : 'items-center overflow-hidden w-full'}`}>
                        {isActive ? (
                          <motion.h2 layoutId={`title-${item.id}`} transition={ultraSmoothSpring} className={`font-black text-3xl lg:text-4xl mb-4 tracking-tighter ${textPrimary}`}>
                            {item.title}
                          </motion.h2>
                        ) : (
                          <motion.div layoutId={`title-${item.id}`} transition={ultraSmoothSpring} className="flex-1 flex items-center justify-center overflow-hidden w-full">
                            <span className={`text-sm font-black tracking-[0.25em] whitespace-nowrap uppercase [writing-mode:vertical-rl] rotate-180 ${textSecondary}`}>{item.title}</span>
                          </motion.div>
                        )}
                        
                        <AnimatePresence>
                          {isActive && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ delay: 0.1, ...ultraSmoothSpring }}>
                              <span className="text-xs font-mono text-[#00f0ff] mb-4 block tracking-widest uppercase">{item.label}</span>
                              <p className={`text-base mb-8 max-w-lg leading-relaxed font-light ${textSecondary}`}>{item.desc}</p>
                              <button className={`flex items-center text-xs font-bold uppercase tracking-widest transition-all px-6 py-3 rounded-lg group ${isLightMode ? 'bg-[#00ff66]/20 text-[#00a843] hover:bg-[#00ff66] hover:text-black' : 'bg-transparent border border-[#00ff66]/50 text-[#00ff66] hover:bg-[#00ff66] hover:text-black'}`}>
                                Access Resource <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* ARTWORK 5: UPCOMING TOPICS (VR SPATIAL CANVAS) */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={spatialReveal} className="mb-32 relative">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center space-x-3">
                <BrainCircuit className="text-[#00f0ff]" size={24} />
                <h2 className={`text-3xl font-black uppercase tracking-widest ${textPrimary}`}>Upcoming Topics</h2>
              </div>
              <div className={`text-[10px] uppercase tracking-widest font-mono border px-4 py-2 rounded-full hidden sm:block animate-pulse ${isLightMode ? 'bg-cyan-50 border-cyan-200 text-cyan-600' : 'border-[#00ff66]/30 bg-[#00ff66]/5 text-[#00ff66]'}`}>
                [ Rotate Spatial Matrix ]
              </div>
            </div>
            
            <div className={`w-full h-[550px] rounded-[3rem] border overflow-hidden relative ${isLightMode ? 'bg-slate-100 border-slate-200 shadow-inner' : 'bg-[#010308] border-[#00f0ff]/20 shadow-[0_0_50px_rgba(0,240,255,0.05)]'} cursor-grab active:cursor-grabbing`}>
              <Canvas camera={{ position: [0, 1.5, 7], fov: 60 }}>
                <OrbitControls enableZoom={false} enablePan={false} autoRotate={true} autoRotateSpeed={0.8} maxPolarAngle={Math.PI / 2 + 0.1} minPolarAngle={Math.PI / 3} />
                <SpatialUpcomingCarousel isLight={isLightMode} />
              </Canvas>
              <div className={`absolute inset-0 pointer-events-none ${isLightMode ? 'bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#f8fafc_100%)]' : 'bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#010205_100%)]'}`} />
            </div>
          </motion.section>

          {/* ARTWORK 6: RADIAL UI CONCEPTS (HOVER TO SPIN) */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={spatialReveal} className="mb-32 relative z-10">
            <div className="flex items-center space-x-3 mb-8">
              <LayoutTemplate className="text-[#00ff66]" size={24} />
              <h2 className={`text-3xl font-black uppercase tracking-widest ${textPrimary}`}>Interface Prototypes</h2>
            </div>
            
            <div className={`relative w-full h-[500px] overflow-hidden rounded-[3rem] border ${isLightMode ? 'bg-slate-100 border-slate-200 shadow-inner' : 'bg-[#010205] border-[#00f0ff]/20 shadow-[inset_0_0_80px_rgba(0,240,255,0.03)]'} flex justify-center pt-16 [perspective:2000px]`}>
              <div className={`absolute bottom-[-200px] w-[600px] h-[600px] rounded-full blur-[100px] opacity-30 ${isLightMode ? 'bg-cyan-300' : 'bg-[#00f0ff]/20'} pointer-events-none`} />
              
              {RADIAL_CONCEPTS.map((item, i) => {
                const isActive = activeRadial === i;
                const angleStep = 22; 
                const rotation = (i - activeRadial) * angleStep;
                
                return (
                  <motion.div
                    key={item.id}
                    onClick={() => setActiveRadial(i)}
                    onMouseEnter={() => setActiveRadial(i)}
                    animate={{
                      rotateZ: rotation,
                      y: isActive ? -30 : 0,
                      scale: isActive ? 1.05 : 0.9,
                      zIndex: 50 - Math.abs(i - activeRadial) * 10
                    }}
                    transition={{ type: "spring", stiffness: 250, damping: 25, mass: 0.8 }}
                    className="absolute top-12 cursor-pointer origin-[center_600px]" 
                  >
                     <div className={`w-[260px] h-[380px] rounded-3xl border-2 flex flex-col justify-between p-6 overflow-hidden transition-colors duration-500 ${
                       isActive 
                         ? (isLightMode ? 'bg-white border-[#00ff66]/50 shadow-[0_20px_50px_rgba(0,255,102,0.2)]' : 'bg-[#02050a] border-[#00ff66] shadow-[0_0_40px_rgba(0,255,102,0.3)]')
                         : (isLightMode ? 'bg-slate-200/80 border-slate-300 opacity-60 hover:opacity-100' : 'bg-[#050b14]/80 border-[#00f0ff]/20 opacity-50 hover:opacity-100 hover:border-[#00f0ff]/50')
                     }`}>
                       <div className="flex justify-between items-start">
                         <span className={`text-[10px] font-mono font-bold tracking-widest ${isActive ? 'text-[#00ff66]' : textSecondary}`}>{item.id}</span>
                         <ArrowUpRight size={16} className={isActive ? 'text-[#00f0ff]' : textSecondary} />
                       </div>
                       
                       <div className={`text-9xl font-black text-center tracking-tighter ${isActive ? textPrimary : textSecondary}`}>
                         {item.letter}
                       </div>
                       
                       <div>
                          <h3 className={`font-black uppercase tracking-wide mb-1 ${isActive ? textPrimary : textSecondary}`}>{item.title}</h3>
                          <p className={`text-[9px] font-mono tracking-widest uppercase ${isActive ? 'text-[#00f0ff]' : textSecondary}`}>{item.subtitle}</p>
                       </div>
                     </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.section>

          {/* ARTWORK 1: ALL RESOURCES (STAGGERED 3D REVEAL) */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="mb-20">
            <div className="flex items-center space-x-3 mb-8">
              <Database className="text-[#00ff66]" size={24} />
              <h2 className={`text-3xl font-black uppercase tracking-widest ${textPrimary}`}>Research Directory</h2>
            </div>

            <div className="flex flex-col space-y-4">
              {ALL_RESOURCES.map((res) => (
                <motion.div 
                  key={res.id} variants={spatialReveal}
                  className={`group relative w-full h-28 rounded-2xl overflow-hidden border transition-colors duration-500 cursor-pointer ${cardBg} hover:border-[#00ff66]/50`}
                >
                  <div className="absolute inset-0 flex items-center justify-between px-6 lg:px-10 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-full">
                    <h3 className={`text-xl md:text-2xl font-black tracking-widest uppercase whitespace-nowrap ${textSecondary}`}>
                      {res.title}
                    </h3>
                    <div className="hidden md:flex">
                       <span className={`text-[10px] uppercase font-mono tracking-widest px-3 py-1 rounded ${isLightMode ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>{res.tech}</span>
                    </div>
                  </div>

                  <div className={`absolute inset-0 flex items-center justify-between px-6 lg:px-10 translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0 ${isLightMode ? 'bg-green-50' : 'bg-[#00ff66]/5'}`}>
                    <div className="flex items-center space-x-8 w-full">
                      <h3 className={`text-lg md:text-xl font-black tracking-tighter uppercase whitespace-nowrap min-w-[250px] ${isLightMode ? 'text-green-600' : 'text-[#00ff66]'}`}>
                        {res.title}
                      </h3>
                      <div className={`hidden lg:block w-px h-10 ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`}></div>
                      <p className={`hidden lg:block text-xs font-mono max-w-lg truncate ${textSecondary}`}>{res.desc}</p>
                      
                      <div className="flex space-x-3 ml-auto shrink-0">
                        <span className={`text-[10px] uppercase font-bold tracking-widest border px-3 py-1.5 rounded ${isLightMode ? 'border-cyan-300 text-cyan-600 bg-cyan-50' : 'border-[#00f0ff]/30 text-[#00f0ff] bg-[#00f0ff]/10'}`}>
                          {res.status}
                        </span>
                      </div>
                    </div>

                    <div className={`hidden md:flex ml-6 shrink-0 w-10 h-10 rounded-full border items-center justify-center transition-all duration-300 ${isLightMode ? 'border-green-500 text-green-500 group-hover:bg-green-500 group-hover:text-white' : 'border-[#00ff66] text-[#00ff66] group-hover:bg-[#00ff66] group-hover:text-black'}`}>
                      <ArrowUpRight size={16} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

        </div>
        <Footer isLight={isLightMode} currentRole="user" />
      </div>
      
      <BottomNav currentRole="user" />
    </main>
  );
}