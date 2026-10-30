"use client";

import { API_URL, handleSafeAdminLogout } from '@/lib/api';
import { fetchGraphQL } from '@/lib/protocols';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link'; 
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshReflectorMaterial, Text, OrbitControls, Sparkles, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Search, BrainCircuit, Shield, Database, ArrowRight, 
  SlidersHorizontal, Library, User, LayoutTemplate, LogOut, Settings, Hexagon, ArrowUpRight, Clock, FileText,
  ArrowUpDown, X, Code2
} from 'lucide-react';

import CustomCursor from '@/components/CustomCursor';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import Footer from '@/components/Footer';

// ==========================================
// FALLBACK DUMMY DATA
// ==========================================
const FALLBACK_RESEARCH = [{ id: "101", title: "Synchronizing...", label: "SYSTEM", desc: "Establishing secure link to database..." }];
const FILTERS = [
  { id: "all", label: "All Resources", icon: Library },
  { id: "ai", label: "AI Research", icon: BrainCircuit },
  { id: "sec", label: "Security Logs", icon: Shield },
  { id: "db", label: "Databases & Data", icon: Database },
  { id: "docs", label: "Documentation", icon: FileText },
  { id: "math", label: "Math Models", icon: Code2 },
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
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};

const ultraSmoothSpring = { type: "spring" as const, stiffness: 120, damping: 20, mass: 0.8 };

// 🔥 THE FIX: Syntax Sanitizer to prevent raw markdown/HTML in preview cards
const stripMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Remove markdown links but keep text
    .replace(/([*~_`#])/g, '') // Remove formatting chars
    .replace(/\n/g, ' ') // Remove newlines
    .trim();
};

// ==========================================
// BACKGROUND: HIGH-PERFORMANCE AMBIENT MATRIX
// ==========================================
function ActiveDataBackground({ isLight }: { isLight: boolean }) {
  const gridColor = isLight ? 'rgba(0,255,102,0.08)' : 'rgba(0,255,102,0.03)';
  const gridColor2 = isLight ? 'rgba(0,240,255,0.08)' : 'rgba(0,240,255,0.03)';
  const bgColor = isLight ? 'bg-[#f8fafc]' : 'bg-[#010205]';

  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-700 ${bgColor}`}>
      <div 
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)]" 
        style={{ backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor2} 1px, transparent 1px)`, backgroundSize: '80px 80px' }}
      />
      {/* Compositor-layer ambient glow fields (hardware accelerated, zero CPU load) */}
      <div className={`absolute -top-[15%] -left-[10%] w-[45vw] h-[45vw] rounded-full blur-[100px] pointer-events-none transform-gpu ${isLight ? 'bg-[#00ff66]/10' : 'bg-[#00ff66]/5'}`} />
      <div className={`absolute -bottom-[15%] -right-[10%] w-[50vw] h-[50vw] rounded-full blur-[120px] pointer-events-none transform-gpu ${isLight ? 'bg-[#00f0ff]/10' : 'bg-[#00f0ff]/5'}`} />
    </div>
  );
}

// ==========================================
// ARTWORK 5: 3D THEME-AWARE CYLINDER (60+ FPS OPTIMIZED)
// ==========================================
function SpatialUpcomingCarousel({ isLight, topics }: { isLight: boolean, topics: any[] }) {
  return (
    <group position={[0, -0.5, 0]}>
      <ambientLight intensity={isLight ? 1 : 0.6} />
      <directionalLight position={[0, 10, 5]} intensity={isLight ? 2.5 : 1.8} color="#00ff66" />
      <directionalLight position={[-5, 5, -5]} intensity={isLight ? 2.5 : 1.8} color="#00f0ff" />
      
      {/* High-Performance Cyber Grid Floor (replaces laggy 1024x1024 multi-pass reflector) */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color={isLight ? "#e2e8f0" : "#020617"}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>
      <gridHelper args={[50, 25, isLight ? "#94a3b8" : "#00f0ff", isLight ? "#cbd5e1" : "#00ff66"]} position={[0, -1.98, 0]} />

      {topics.map((topic, i) => (
        <Float key={i} speed={1.5} floatIntensity={0.4} rotationIntensity={0.2}>
          <group position={[Math.sin(topic.angle) * 3.5, 0, Math.cos(topic.angle) * 3.5]} rotation={[0, topic.angle, 0]}>
            <RoundedBox args={[3, 4, 0.05]} radius={0.1} smoothness={3}>
              <meshPhysicalMaterial color={isLight ? "#ffffff" : "#000510"} metalness={isLight ? 0.1 : 0.9} roughness={0.2} transmission={0.7} thickness={0.3} emissive="#00f0ff" emissiveIntensity={isLight ? 0.08 : 0.05} />
            </RoundedBox>
            <RoundedBox args={[3.02, 4.02, 0.02]} radius={0.1} smoothness={3}>
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
      <Sparkles count={60} scale={10} size={2} speed={0.2} color={isLight ? "#0284c7" : "#00f0ff"} opacity={isLight ? 0.6 : 0.3} />
    </group>
  );
}

// ==========================================
// MASTER RESEARCH VAULT
// ==========================================
export default function MasterResearchVault() {
  const router = useRouter();
  const { isLightMode, toggleTheme } = useTheme();
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'az'>('latest');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [timeState, setTimeState] = useState({ time: "", date: "" });
  
  const [activeRecent, setActiveRecent] = useState<any>(null);
  const [isHoveringRecent, setIsHoveringRecent] = useState(false);
  const [activeRadial, setActiveRadial] = useState(2);

  // ==========================================
  // LIVE DATABASE HYDRATION STATES
  // ==========================================
  const [userData, setUserData] = useState<any>(null);
  const [recentResearch, setRecentResearch] = useState<any[]>(FALLBACK_RESEARCH);
  const [upcomingTopics, setUpcomingTopics] = useState<any[]>([{ id: 'load', title: "Loading...", tech: "SYS", angle: 0 }]);
  const [radialConcepts, setRadialConcepts] = useState<any[]>([{ id: 'R1', letter: "O", title: "Loading Prototypes", subtitle: "SYS" }]);
  const [allResources, setAllResources] = useState<any[]>([]);

  // ==========================================
  // FETCH IDENTITY & RULE-BASED DATA MAPPING
  // ==========================================
  useEffect(() => {
    const hydrateMatrix = async () => {
      const token = localStorage.getItem('matrix_token');
      if (!token) {
        router.push('/auth');
        return;
      }

      try {
        const authRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (authRes.ok) {
          const { data } = await authRes.json();
          setUserData(data);
        } else {
          router.push('/auth');
          return;
        }

        const authHeader = { headers: { 'Authorization': `Bearer ${token}` } };
        
        // Multi-Protocol Architecture: Fetch research catalog via GraphQL with zero overfetching, releases via REST
        let publishedPosts: any[] = [];
        let draftPosts: any[] = [];
        let releases: any[] = [];

        try {
          const [gqlData, releasesRes] = await Promise.all([
            fetchGraphQL<{ researchArticles: any[] }>(`
              query GetResearchArticles {
                researchArticles(limit: 50) {
                  id
                  title
                  slug
                  content
                  type
                  published
                  createdAt
                  categoryName
                  categorySlug
                }
              }
            `),
            fetch(`${API_URL}/api/releases`, authHeader).then(r => r.json()).catch(() => ({ data: [] }))
          ]);

          if (gqlData?.researchArticles && gqlData.researchArticles.length > 0) {
            publishedPosts = gqlData.researchArticles;
          }
          releases = releasesRes.data || [];
        } catch {
          // Fallback to standard REST API
          const [postsRes, releasesRes] = await Promise.all([
            fetch(`${API_URL}/api/posts`, authHeader),
            fetch(`${API_URL}/api/releases`, authHeader)
          ]);
          const postsData = await postsRes.json();
          const releasesData = await releasesRes.json();
          const posts = postsData.data || [];
          releases = releasesData.data || [];
          publishedPosts = posts.filter((p: any) => p.published === true);
          draftPosts = posts.filter((p: any) => p.published === false);
        }

        const mappedRecent = publishedPosts.slice(0, 5).map((p: any) => ({
          id: p.id,
          title: p.title,
          label: p.type || 'RESEARCH',
          desc: stripMarkdown(p.content).substring(0, 120) + '...' // 🔥 Sanitized Preview
        }));
        setRecentResearch(mappedRecent.length > 0 ? mappedRecent : []);
        if (mappedRecent.length > 0) setActiveRecent(mappedRecent[0].id);

        const mappedUpcoming = draftPosts.slice(0, 4).map((r: any, i: number, arr: any[]) => ({
          id: r.id,
          title: r.title,
          tech: r.type || 'UPCOMING',
          angle: i * ((Math.PI * 2) / arr.length)
        }));
        setUpcomingTopics(mappedUpcoming.length > 0 ? mappedUpcoming : [{ id: 'empty', title: "NO UPCOMING DATA", tech: "STANDBY", angle: 0 }]);

        const mappedRadial = releases.slice(0, 5).map((m: any) => ({
          id: `V${m.version}`,
          letter: m.projectName.charAt(0).toUpperCase(),
          title: m.projectName.substring(0, 20),
          subtitle: 'UPLOADING...'
        }));
        setRadialConcepts(mappedRadial.length > 0 ? mappedRadial : [{ id: "R1", letter: "O", title: "AWAITING PROTOTYPES", subtitle: "SYSTEM IDLE" }]);

        const mappedAll = publishedPosts.map((p: any) => ({
          id: p.id,
          title: p.title,
          tech: p.type || p.Category?.name || 'RESEARCH',
          categoryName: p.Category?.name || p.type || 'General',
          categorySlug: p.Category?.slug || (p.type ? p.type.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'general'),
          status: 'STABLE',
          createdAt: p.createdAt ? new Date(p.createdAt).getTime() : 0,
          createdDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
          desc: stripMarkdown(p.content || '').substring(0, 160) + '...'
        }));
        setAllResources(mappedAll);

      } catch (error) {
        console.error("Matrix Hydration Failed", error);
      }
    };

    hydrateMatrix();
  }, [router]);

  // ==========================================
  // BULLETPROOF CATEGORY MATCHER & FILTERING
  // ==========================================
  const isMatchCategory = (item: any, filterId: string) => {
    if (filterId === 'all') return true;
    const slug = (item.categorySlug || '').toLowerCase();
    const name = (item.categoryName || '').toLowerCase();
    const tech = (item.tech || '').toLowerCase();
    const all = `${slug} ${name} ${tech}`;

    if (filterId === 'ai') {
      return slug === 'ai-research' || (all.includes('ai') && !slug.includes('math')) || all.includes('neural') || all.includes('nlp');
    }
    if (filterId === 'sec') {
      return slug.includes('sec') || all.includes('security') || all.includes('auth') || all.includes('cipher');
    }
    if (filterId === 'db') {
      return slug.includes('data') || all.includes('database') || all.includes('data engineering') || all.includes('pipeline');
    }
    if (filterId === 'docs') {
      return slug.includes('doc') || all.includes('documentation') || all.includes('standard');
    }
    if (filterId === 'math') {
      return slug.includes('math') || all.includes('mathematical') || all.includes('symbolic');
    }
    return false;
  };

  // Dynamic live count for each category pill
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allResources.length,
      ai: 0,
      sec: 0,
      db: 0,
      docs: 0,
      math: 0,
    };
    for (const item of allResources) {
      if (isMatchCategory(item, 'ai')) counts.ai++;
      if (isMatchCategory(item, 'sec')) counts.sec++;
      if (isMatchCategory(item, 'db')) counts.db++;
      if (isMatchCategory(item, 'docs')) counts.docs++;
      if (isMatchCategory(item, 'math')) counts.math++;
    }
    return counts;
  }, [allResources]);

  const filteredResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = allResources.filter(item => {
      const matchesSearch = !query || 
        item.title.toLowerCase().includes(query) || 
        item.desc.toLowerCase().includes(query) ||
        item.tech.toLowerCase().includes(query) ||
        item.categoryName.toLowerCase().includes(query);
      
      const matchesCat = isMatchCategory(item, activeFilter);
      return matchesSearch && matchesCat;
    });

    if (sortBy === 'latest') {
      list = list.slice().sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'oldest') {
      list = list.slice().sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortBy === 'az') {
      list = list.slice().sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [allResources, searchQuery, activeFilter, sortBy]);

  // Stable showcase for Recent Insights
  const showcaseRecent = useMemo(() => {
    return recentResearch.slice(0, 5);
  }, [recentResearch]);

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

  // Smooth Auto-Accordion Logic
  useEffect(() => {
    if (isHoveringRecent || showcaseRecent.length <= 1) return;
    const interval = setInterval(() => {
      setActiveRecent((prev: any) => {
        const currentIndex = showcaseRecent.findIndex(p => p.id === prev);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % showcaseRecent.length;
        return showcaseRecent[nextIndex]?.id || null;
      });
    }, 6000); 
    return () => clearInterval(interval);
  }, [isHoveringRecent, showcaseRecent]);

  // Auto-Select first item on Search / Filter change
  useEffect(() => {
    if (showcaseRecent.length > 0) {
      if (!showcaseRecent.some(i => i.id === activeRecent)) {
        setActiveRecent(showcaseRecent[0].id);
      }
    } else {
      setActiveRecent(null);
    }
  }, [showcaseRecent, activeRecent]);

  const handleLogout = async () => {
    await handleSafeAdminLogout(() => {
      localStorage.removeItem('userRole');
      router.push('/auth');
    });
  };

  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-600" : "text-slate-400";
  const glassBg = isLightMode ? "bg-white/95 border-slate-200 shadow-xl" : "bg-[#010308]/80 border-[#00f0ff]/10 shadow-2xl";
  const cardBg = isLightMode ? "bg-white/95 border-slate-200 shadow-md text-slate-800" : "bg-black/20 border-white/5";

  return (
    <main className={`relative min-h-screen font-sans cursor-none overflow-x-hidden selection:bg-[#00ff66]/30 flex flex-col transition-colors duration-1000 ${isLightMode ? 'bg-[#f8fafc]' : 'bg-[#010205]'}`}>
      <CustomCursor />
      
      <div className="relative z-[100]">
        <ThemeToggle isLight={isLightMode} toggleTheme={toggleTheme} />
      </div>

      <ActiveDataBackground isLight={isLightMode} />

      {/* BALANCED TOP NAVIGATION HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={ultraSmoothSpring}
        className="sticky top-0 z-50 pt-6 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto flex items-center justify-between pointer-events-none"
      >
        {/* Brand Anchor */}
        <div className="pointer-events-auto flex items-center space-x-3.5 group cursor-pointer" onClick={() => router.push('/research')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ff66] to-[#00f0ff] flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,255,102,0.35)] group-hover:scale-105 transition-transform">
            <Library size={20} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h1 className={`text-lg font-black tracking-widest uppercase ${textPrimary}`}>CSx<span className="text-[#00f0ff]">PEDIA</span></h1>
            <p className="text-[9px] font-mono text-[#00ff66] tracking-[0.25em] uppercase">Research Archive</p>
          </div>
        </div>

        {/* User Pill & Telemetry Time */}
        <div className="relative pointer-events-auto" onMouseEnter={() => setIsProfileHovered(true)} onMouseLeave={() => setIsProfileHovered(false)}>
          <div className={`flex items-center space-x-4 px-6 py-2.5 rounded-full backdrop-blur-xl cursor-pointer transition-colors duration-700 ${glassBg}`}>
            <span className="text-[#00ff66] font-mono text-xs tracking-widest hidden sm:block">
              {timeState.date} <span className={textSecondary}>|</span> {timeState.time}
            </span>
            <div className={`w-px h-4 hidden sm:block ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`}></div>
            <div className="flex items-center space-x-3 group">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#00ff66] to-[#00f0ff] p-[1.5px] shrink-0 overflow-hidden">
                <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${isLightMode ? 'bg-white' : 'bg-[#010205]'}`}>
                  {userData?.profilePic ? (
                    <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={12} className={textPrimary} />
                  )}
                </div>
              </div>
              <span className={`text-xs font-black uppercase tracking-widest transition-colors ${textPrimary} group-hover:text-[#00f0ff]`}>
                {userData ? (userData.fullName || 'OPERATOR') : 'GUEST'}
              </span>
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
                
                <div className={`h-px w-full my-1 ${isLightMode ? 'bg-slate-200' : 'bg-slate-800/50'}`} />
                
                <button onClick={handleLogout} className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 rounded-xl transition-all group ${isLightMode ? 'hover:bg-red-50' : 'hover:bg-red-500/10'}`}>
                  <LogOut size={14} className="mr-3 text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> Terminate Link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* MAIN VAULT SCROLL CONTAINER (SYMMETRICAL, NO ASYMMETRIC SIDEBAR) */}
      <div className="w-full flex-1 overflow-y-auto overflow-x-hidden pb-40 custom-scrollbar relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

          {/* TOP COMMAND DECK: SEARCH MATRIX BAR */}
          <motion.div initial="hidden" animate="visible" variants={spatialReveal} className="mb-20 flex flex-col items-center">
            
            {/* Search Input Bar */}
            <div className="w-full max-w-3xl flex justify-center">
              <motion.div 
                layout initial={{ width: "90%" }} animate={{ width: searchFocused ? "100%" : "90%" }} transition={ultraSmoothSpring}
                className={`relative flex items-center backdrop-blur-xl rounded-full overflow-hidden transition-all duration-500 ${glassBg} ${searchFocused ? 'ring-2 ring-[#00ff66] shadow-[0_0_40px_rgba(0,255,102,0.2)]' : 'hover:border-[#00f0ff]/40'}`}
              >
                <div className={`p-4 pl-6 ${searchFocused ? 'text-[#00ff66]' : 'text-[#00f0ff]'}`}><Search size={20} /></div>
                <input 
                  type="text" placeholder="Search research matrix, algorithms, papers, security logs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                  className={`bg-transparent border-none font-mono text-sm py-4 pr-12 w-full focus:outline-none ${textPrimary} placeholder-slate-400`}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-3 mr-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <X size={16} />
                  </button>
                )}
              </motion.div>
            </div>

            {/* Subtext info */}
            <div className="mt-3 flex items-center space-x-3 text-[11px] font-mono">
              <span className={textSecondary}>ARCHIVE STATUS: <strong className="text-[#00ff66]">ONLINE</strong></span>
              <span className={textSecondary}>|</span>
              <span className={textSecondary}>TOTAL ARTIFACTS: <strong className={textPrimary}>{allResources.length}</strong></span>
              {searchQuery && (
                <>
                  <span className={textSecondary}>|</span>
                  <span className="text-cyan-400 font-mono">Filter: &quot;{searchQuery}&quot;</span>
                </>
              )}
            </div>

          </motion.div>

          {/* ARTWORK 4: RECENT RESEARCH */}
          <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={spatialReveal} className="mb-32">
            <div className="flex items-center space-x-3 mb-8">
              <Clock className="text-[#00ff66]" size={24} />
              <h2 className="text-3xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00ff66] to-[#00f0ff]">Recent Insights</h2>
            </div>
            
            <div className="flex flex-col md:flex-row h-[420px] gap-4 lg:gap-6 w-full justify-center [perspective:2000px]" onMouseEnter={() => setIsHoveringRecent(true)} onMouseLeave={() => setIsHoveringRecent(false)}>
              {showcaseRecent.length > 0 ? showcaseRecent.map((item: any) => {
                const isActive = activeRecent === item.id;
                return (
                  <motion.div
                    key={item.id} layout transition={ultraSmoothSpring} onMouseEnter={() => setActiveRecent(item.id)}
                    animate={{ rotateY: isActive ? 0 : -12, z: isActive ? 0 : -40, scale: isActive ? 1 : 0.95 }} whileHover={{ scale: isActive ? 1.01 : 1.03 }} 
                    className={`relative overflow-hidden rounded-[2.5rem] cursor-pointer border transition-colors duration-500 origin-left ${isActive ? (isLightMode ? 'bg-white shadow-[0_30px_60px_rgba(0,255,102,0.15)] border-[#00ff66]/40 w-full md:w-[450px] lg:w-[750px] shrink-0' : 'bg-[#02050a] border-[#00ff66]/50 shadow-[0_0_50px_rgba(0,255,102,0.2)] w-full md:w-[450px] lg:w-[750px] shrink-0') : (isLightMode ? 'bg-slate-200 border-slate-300 w-[60px] lg:w-[90px] shrink-0 opacity-70 hover:opacity-100 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.1)]' : 'bg-[#050b14] border-[#00f0ff]/10 w-[60px] lg:w-[90px] shrink-0 opacity-70 hover:opacity-100 hover:border-[#00f0ff]/40 shadow-[inset_-15px_0_30px_rgba(0,0,0,0.8)]')}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-t from-[#00ff66]/10 to-transparent opacity-0 transition-opacity duration-700 ${isActive ? 'opacity-100' : ''}`} />

                    <motion.div layout transition={ultraSmoothSpring} className={`relative z-10 flex flex-col h-full ${isActive ? 'p-8 justify-end' : 'py-8 items-center justify-start'}`}>
                      <motion.div layout transition={ultraSmoothSpring} className={`flex items-center justify-center rounded-xl transition-colors shrink-0 ${isActive ? 'w-14 h-14 bg-gradient-to-br from-[#00ff66] to-[#00f0ff] text-black mb-auto' : (isLightMode ? 'w-10 h-10 bg-slate-300 text-slate-600 mb-8' : 'w-10 h-10 bg-[#010205] border border-[#00f0ff]/20 text-[#00f0ff]/70 mb-8')}`}>
                        <FileText size={isActive ? 24 : 18} />
                      </motion.div>
                      
                      <div className={`flex flex-col justify-end flex-grow ${isActive ? 'w-full' : 'items-center overflow-hidden w-full'}`}>
                        {isActive ? (
                          <motion.h2 layoutId={`title-${item.id}`} transition={ultraSmoothSpring} className={`font-black text-3xl lg:text-4xl mb-4 tracking-tighter ${textPrimary}`}>{item.title}</motion.h2>
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
                              
                              <button 
                                onClick={() => router.push(`/research/${item.id}`)} 
                                className={`flex items-center text-xs font-bold uppercase tracking-widest transition-all px-6 py-3 rounded-lg group cursor-pointer ${isLightMode ? 'bg-[#00ff66]/20 text-[#00a843] hover:bg-[#00ff66] hover:text-black' : 'bg-transparent border border-[#00ff66]/50 text-[#00ff66] hover:bg-[#00ff66] hover:text-black'}`}
                              >
                                Access Resource <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              }) : (
                <div className={`w-full flex items-center justify-center rounded-3xl border border-dashed ${isLightMode ? 'border-slate-300' : 'border-slate-800'}`}>
                  <p className={`font-mono text-sm tracking-widest ${textSecondary}`}>NO MATCHING INSIGHTS FOUND.</p>
                </div>
              )}
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
              <Canvas camera={{ position: [0, 1.5, 7], fov: 60 }} dpr={[1, 1.5]} gl={{ powerPreference: 'high-performance', antialias: false, stencil: false }}>
                <OrbitControls enableZoom={false} enablePan={false} autoRotate={true} autoRotateSpeed={0.8} maxPolarAngle={Math.PI / 2 + 0.1} minPolarAngle={Math.PI / 3} />
                <SpatialUpcomingCarousel isLight={isLightMode} topics={upcomingTopics} />
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
              
              {radialConcepts.map((item, i) => {
                const isActive = activeRadial === i;
                const angleStep = 22; 
                const rotation = (i - activeRadial) * angleStep;
                
                return (
                  <motion.div
                    key={item.id} onClick={() => setActiveRadial(i)} onMouseEnter={() => setActiveRadial(i)}
                    animate={{ rotateZ: rotation, y: isActive ? -30 : 0, scale: isActive ? 1.05 : 0.9, zIndex: 50 - Math.abs(i - activeRadial) * 10 }}
                    transition={{ type: "spring", stiffness: 250, damping: 25, mass: 0.8 }}
                    className="absolute top-12 cursor-pointer origin-[center_600px]" 
                  >
                     <div className={`w-[260px] h-[380px] rounded-3xl border-2 flex flex-col justify-between p-6 overflow-hidden transition-colors duration-500 ${isActive ? (isLightMode ? 'bg-white border-[#00ff66]/50 shadow-[0_20px_50px_rgba(0,255,102,0.2)]' : 'bg-[#02050a] border-[#00ff66] shadow-[0_0_40px_rgba(0,255,102,0.3)]') : (isLightMode ? 'bg-slate-200/80 border-slate-300 opacity-60 hover:opacity-100' : 'bg-[#050b14]/80 border-[#00f0ff]/20 opacity-50 hover:opacity-100 hover:border-[#00f0ff]/50')}`}>
                       <div className="flex justify-between items-start">
                         <span className={`text-[10px] font-mono font-bold tracking-widest ${isActive ? 'text-[#00ff66]' : textSecondary}`}>{item.id}</span>
                         <ArrowUpRight size={16} className={isActive ? 'text-[#00f0ff]' : textSecondary} />
                       </div>
                       <div className={`text-9xl font-black text-center tracking-tighter ${isActive ? textPrimary : textSecondary}`}>{item.letter}</div>
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

          {/* ARTWORK 1: RESEARCH DIRECTORY (WITH DIRECT FILTER & SORT CONTROLS) */}
          <section className="mb-24 relative z-20">
            {/* Header with Title and Active Count */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <Database className="text-[#00ff66]" size={26} />
                <h2 className={`text-3xl font-black uppercase tracking-widest ${textPrimary}`}>Research Directory</h2>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30">
                  {filteredResources.length} {filteredResources.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {/* Sorting & Reset Actions */}
              <div className="flex items-center space-x-3 shrink-0">
                <div className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border font-mono text-xs font-bold uppercase tracking-wider shadow-sm ${isLightMode ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900/90 border-slate-700 text-slate-200'}`}>
                  <ArrowUpDown size={14} className="text-[#00ff66]" />
                  <span className={textSecondary}>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className={`bg-transparent focus:outline-none cursor-pointer font-bold uppercase ${textPrimary}`}
                  >
                    <option value="latest" className={isLightMode ? "bg-white text-black" : "bg-[#050b14] text-white"}>Latest</option>
                    <option value="oldest" className={isLightMode ? "bg-white text-black" : "bg-[#050b14] text-white"}>Oldest</option>
                    <option value="az" className={isLightMode ? "bg-white text-black" : "bg-[#050b14] text-white"}>Title (A-Z)</option>
                  </select>
                </div>

                {(searchQuery || activeFilter !== 'all') && (
                  <button
                    onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer ${isLightMode ? 'border-slate-300 text-slate-600 hover:bg-slate-100' : 'border-slate-800 text-slate-300 hover:bg-white/5'}`}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* CATEGORY FILTER PILLS DECK - DIRECTLY ABOVE DIRECTORY */}
            <div className={`w-full p-2.5 mb-6 rounded-2xl backdrop-blur-xl border flex flex-wrap items-center gap-2 transition-colors ${isLightMode ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-black/40 border-white/10 shadow-xl'}`}>
              {FILTERS.map((filter) => {
                const isActive = activeFilter === filter.id;
                const count = filterCounts[filter.id] ?? 0;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveFilter(filter.id)}
                    className={`relative px-4 py-2.5 rounded-xl flex items-center text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 group overflow-hidden cursor-pointer ${
                      isActive 
                        ? (isLightMode ? 'text-black shadow-md font-black' : 'text-black shadow-[0_0_20px_rgba(0,255,102,0.4)] font-black')
                        : (isLightMode ? 'text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/90 border border-slate-200' : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800')
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeFilterPillDirectory"
                        className="absolute inset-0 bg-gradient-to-r from-[#00ff66] to-[#00f0ff] rounded-xl z-0"
                        transition={ultraSmoothSpring}
                      />
                    )}
                    <span className="relative z-10 flex items-center space-x-2">
                      <filter.icon size={15} className={`shrink-0 ${isActive ? 'text-black' : (isLightMode ? 'text-slate-500 group-hover:text-cyan-600' : 'text-cyan-400 group-hover:text-emerald-400')}`} />
                      <span>{filter.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        isActive
                          ? 'bg-black/20 text-black font-black'
                          : (isLightMode ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300')
                      }`}>
                        {count}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* DIRECTORY ITEMS LIST WITH SMOOTH ANIMATEPRESENCE (NO OPACITY 0 FREEZE) */}
            <div className="flex flex-col space-y-4 min-h-[200px]">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredResources.length > 0 ? (
                  filteredResources.map((res) => (
                    <motion.div 
                      key={res.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      onClick={() => router.push(`/research/${res.id}`)} 
                      className={`group relative w-full h-28 rounded-2xl overflow-hidden border transition-colors duration-500 cursor-pointer ${cardBg} hover:border-[#00ff66]/50`}
                    >
                      <div className="absolute inset-0 flex items-center justify-between px-6 lg:px-10 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-full">
                        <div className="flex flex-col justify-center max-w-[70%]">
                          <h3 className={`text-lg md:text-xl font-black tracking-wider uppercase truncate ${textPrimary}`}>{res.title}</h3>
                          <span className="text-[10px] font-mono text-[#00ff66] tracking-widest uppercase mt-1">{res.createdDate ? `Published: ${res.createdDate}` : 'Archive Indexed'}</span>
                        </div>
                        <div className="hidden md:flex">
                           <span className={`text-[10px] uppercase font-mono tracking-widest px-3 py-1 rounded ${isLightMode ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>{res.tech}</span>
                        </div>
                      </div>

                      <div className={`absolute inset-0 flex items-center justify-between px-6 lg:px-10 translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0 ${isLightMode ? 'bg-green-50' : 'bg-[#00ff66]/5'}`}>
                        <div className="flex items-center space-x-6 w-full">
                          <h3 className={`text-base md:text-lg font-black tracking-tight uppercase whitespace-nowrap min-w-[240px] max-w-[320px] truncate ${isLightMode ? 'text-green-700' : 'text-[#00ff66]'}`}>{res.title}</h3>
                          <div className={`hidden lg:block w-px h-10 ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`}></div>
                          <p className={`hidden lg:block text-xs font-mono max-w-lg truncate ${textSecondary}`}>{res.desc}</p>
                          <div className="flex space-x-3 ml-auto shrink-0">
                            <span className={`text-[10px] uppercase font-bold tracking-widest border px-3 py-1.5 rounded ${isLightMode ? 'border-cyan-300 text-cyan-600 bg-cyan-50' : 'border-[#00f0ff]/30 text-[#00f0ff] bg-[#00f0ff]/10'}`}>
                              {res.status}
                            </span>
                          </div>
                        </div>
                        <div className={`hidden md:flex ml-6 shrink-0 w-10 h-10 rounded-full border items-center justify-center transition-all duration-300 ${isLightMode ? 'border-green-600 text-green-600 group-hover:bg-green-600 group-hover:text-white' : 'border-[#00ff66] text-[#00ff66] group-hover:bg-[#00ff66] group-hover:text-black'}`}>
                          <ArrowUpRight size={16} />
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className={`w-full py-16 flex flex-col items-center justify-center rounded-3xl border border-dashed gap-3 ${isLightMode ? 'border-slate-300 bg-slate-50' : 'border-slate-800 bg-black/20'}`}
                  >
                    <p className={`font-mono text-sm tracking-widest uppercase ${textSecondary}`}>NO RESOURCES MATCH YOUR QUERY IN THIS CATEGORY.</p>
                    <button
                      onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                      className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-[#00ff66] to-[#00f0ff] text-black shadow-md hover:scale-105 transition-transform cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

        </div>
        <Footer isLight={isLightMode} currentRole="user" />
      </div>
      <BottomNav currentRole="user" />
    </main>
  );
}