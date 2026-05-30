"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, Database, User, Settings, Star, LogOut, 
  ArchiveRestore, Download, FileText, Bookmark, 
  Microscope, CheckCircle, FileJson, FileSpreadsheet, Server, ShieldAlert,
  Image as ImageIcon, Maximize2, Terminal as TerminalIcon, Hexagon, Network
} from 'lucide-react';

import CustomCursor from '@/components/CustomCursor';
import ThemeToggle from '@/components/ThemeToggle';
import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';

// ==========================================
// MOCK RESEARCH DATABASE (Metadata Included)
// ==========================================
const RESEARCH_DATABASE: Record<string, any> = {
  "v2.4.0": {
    title: "Spatial DOM Recycling Models",
    field: "Frontend Physics Research",
    status: "PEER REVIEWED",
    date: "MAY 2026",
    heroImg: "from-[#00ff66]/20 to-transparent",
    abstract: "An academic exploration into high-performance, physics-driven user interface architecture. This paper analyzes the methodology of bypassing standard DOM limitations, dropping frame rendering times to near zero utilizing custom mathematical spring models.",
    methodology: "A highly controlled empirical setup was established using Next.js 14 to render 10,000 spatial nodes simultaneously. We bypassed the standard React reconciliation phase by directly mutating DOM node styles via Framer Motion's useMotionValue, sampling frame drops and memory leaks over a 60-minute interaction window. Variables were isolated to test composite layer transformations exclusively.",
    conclusion: "The findings conclusively demonstrate that decoupling spatial animations from the React render cycle eliminates layout thrashing. By relying exclusively on composite layer transformations, we maintained a strict 144fps across 99.8% of the testing duration, proving spatial DOM recycling as a viable architecture for hyper-scale user interfaces.",
    metrics: [
      { label: "Confidence Interval", value: "99.8%", trend: "High" },
      { label: "Sample Size", value: "1.2M", trend: "Valid" },
      { label: "P-Value", value: "< 0.001", trend: "Sig" }
    ],
    figures: [
      { title: "DOM Node Render Graph", hue: "from-emerald-500 to-teal-900" },
      { title: "Garbage Collection Spikes", hue: "from-green-500 to-emerald-900" },
      { title: "Frame Rate Stability Matrix", hue: "from-lime-500 to-green-900" },
      { title: "Memory Allocation Schema", hue: "from-teal-500 to-emerald-900" }
    ],
    dataSources: [
      { name: "DOM Render Telemetry", type: "JSON", size: "2.4 GB", icon: FileJson },
      { name: "Frame Drop Logs", type: "CSV", size: "450 MB", icon: FileSpreadsheet },
      { name: "V8 Garbage Collection Snapshots", type: "LOG", size: "1.2 GB", icon: FileText }
    ],
    metadata: {
      writer: "Nima (Lead Architect)",
      contributors: ["CSx Matrix Systems", "Open Source Algorithms"],
      startDate: "FEB 12, 2026",
      endDate: "MAY 02, 2026",
      topics: ["DOM Traversal", "Physics Animation", "React Reconciliation"]
    }
  },
  "v2.3.5": {
    title: "AI Neural Node Mapping",
    field: "Machine Learning / Systems",
    status: "PUBLISHED",
    date: "MAY 2026",
    heroImg: "from-[#00ff66]/20 to-transparent",
    abstract: "Research detailing the structural inheritance and latency optimization within a 30-class Object-Oriented AI model. The study maps the data sync efficiencies between a localized desktop component and a live cloud server.",
    methodology: "Data was streamed through a multi-layered neural network utilizing cross-entropy loss functions. The desktop client instantiated 30 concurrent JVM threads to process localized visual data, synchronizing with the PHP backend via encrypted payloads. Latency was measured across 500 individual training epochs.",
    conclusion: "Synchronizing localized desktop inference with cloud-based storage reduces overall processing latency by 40% compared to pure cloud-inference models. The 30-class architecture maintained 94.2% data accuracy, proving highly effective for distributed systems.",
    metrics: [
      { label: "Data Accuracy", value: "94.2%", trend: "+2.1%" },
      { label: "Training Epochs", value: "500", trend: "Locked" },
      { label: "Loss Function", value: "0.04", trend: "Min" }
    ],
    figures: [
      { title: "Neural Layer Topology", hue: "from-emerald-500 to-teal-900" },
      { title: "Cross-Entropy Variance", hue: "from-green-500 to-emerald-900" },
      { title: "Latency Sync Distribution", hue: "from-lime-500 to-green-900" }
    ],
    dataSources: [
      { name: "Epoch Training Matrix", type: "CSV", size: "8.1 GB", icon: FileSpreadsheet },
      { name: "Cloud Sync Latency Data", type: "JSON", size: "920 MB", icon: FileJson },
      { name: "Raw Image Datasets", type: "ZIP", size: "50.0 GB", icon: ArchiveRestore }
    ],
    metadata: {
      writer: "Nima (Lead Architect)",
      contributors: ["CSx Matrix Systems"],
      startDate: "JAN 05, 2026",
      endDate: "APR 28, 2026",
      topics: ["Neural Networks", "Data Sync", "Object-Oriented Architecture"]
    }
  },
  "default": {
    title: "Classified Research",
    field: "Encrypted Data",
    status: "LOCKED",
    date: "UNKNOWN",
    heroImg: "from-slate-800 to-black",
    abstract: "The requested academic blueprint requires elevated clearance. The telemetry data for this research has been sanitized for security protocols. Please authenticate to view the full document.",
    methodology: "[REDACTED] This section requires Level 4 clearance.",
    conclusion: "[REDACTED] Findings are classified under institutional security protocols.",
    metrics: [
      { label: "Clearance", value: "Level 4", trend: "Required" },
      { label: "Encryption", value: "AES-256", trend: "Active" }
    ],
    figures: [
      { title: "Classified Schematic A", hue: "from-slate-700 to-slate-900" },
      { title: "Classified Schematic B", hue: "from-gray-700 to-gray-900" }
    ],
    dataSources: [
      { name: "Encrypted Vault", type: "BIN", size: "UNKNOWN", icon: ShieldAlert }
    ],
    metadata: {
      writer: "[REDACTED]",
      contributors: ["[REDACTED]"],
      startDate: "UNKNOWN",
      endDate: "UNKNOWN",
      topics: ["Classified Systems", "Encryption"]
    }
  }
};

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
      <motion.div animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity }} className={`absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full blur-[150px] ${isLight ? 'bg-[#00ff66]/20' : 'bg-[#00ff66]/10'}`} />
      <motion.div animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity }} className={`absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[180px] ${isLight ? 'bg-[#00f0ff]/20' : 'bg-[#00f0ff]/10'}`} />
    </div>
  );
}

// ==========================================
// RIGHT RAIL: INTERACTIVE SVG NODE GRAPH
// ==========================================
function CitationNodeGraph({ isLight }: { isLight: boolean }) {
  const [nodes, setNodes] = useState<{ id: number; cx: number; cy: number; connections: number[] }[]>([]);
  
  useEffect(() => {
    const generatedNodes = Array.from({ length: 35 }).map((_, i) => ({
      id: i, cx: 10 + Math.random() * 80, cy: 10 + Math.random() * 80, connections: [] as number[]
    }));

    generatedNodes.forEach(node1 => {
      generatedNodes.forEach(node2 => {
        if (node1.id !== node2.id) {
          const dist = Math.hypot(node1.cx - node2.cx, node1.cy - node2.cy);
          if (dist < 22 && Math.random() > 0.6) node1.connections.push(node2.id);
        }
      });
    });
    setNodes(generatedNodes);
  }, []);

  return (
    <motion.div 
      drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.15}
      whileHover={{ scale: 1.02, y: -5, rotateX: 2, rotateY: -2, zIndex: 50, boxShadow: "0 20px 40px rgba(0,255,102,0.15)" }}
      className={`w-full h-full min-h-[350px] rounded-[2rem] border flex items-center justify-center relative overflow-hidden group transition-colors duration-500 cursor-grab active:cursor-grabbing hover:border-[#00ff66]/50 ${isLight ? 'bg-white/50 border-slate-300 shadow-sm' : 'bg-[#050b14]/80 backdrop-blur-xl border-[#00ff66]/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]'}`}
    >
      <div className="absolute top-6 left-6 flex items-center space-x-2 z-10 bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/5">
        <Network size={14} className="text-[#00ff66]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff66]">Citation Network</span>
      </div>

      <svg className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,102,0.6))' }}>
        {nodes.map(node => 
          node.connections.map(targetId => {
            const target = nodes[targetId];
            if (!target) return null;
            return (
              <motion.line 
                key={`${node.id}-${targetId}`} 
                x1={`${node.cx}%`} y1={`${node.cy}%`} x2={`${target.cx}%`} y2={`${target.cy}%`} 
                stroke={isLight ? "rgba(0,255,102,0.3)" : "rgba(0,255,102,0.4)"} strokeWidth="1" 
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut" }}
              />
            );
          })
        )}
        {nodes.map(node => (
          <motion.circle key={node.id} cx={`${node.cx}%`} cy={`${node.cy}%`} r={node.connections.length > 2 ? "3" : "1.5"} fill={node.connections.length > 2 ? "#00ff66" : "#fff"} animate={{ r: [1.5, 3, 1.5], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2 + Math.random() * 2, repeat: Infinity }} className="cursor-crosshair hover:fill-white" />
        ))}
      </svg>
    </motion.div>
  );
}

// ==========================================
// RIGHT RAIL: DATA SOURCES REPOSITORY
// ==========================================
function DataSourcesRepository({ data, isLight }: { data: any, isLight: boolean }) {
  return (
    <motion.div 
      drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.1}
      whileHover={{ scale: 1.02, y: -5, rotateX: 2, rotateY: 2, zIndex: 50, boxShadow: "0 20px 40px rgba(0,255,102,0.15)" }}
      className={`w-full rounded-[2rem] border flex flex-col p-6 md:p-8 transition-colors duration-500 cursor-grab active:cursor-grabbing hover:border-[#00ff66]/50 ${isLight ? 'bg-white/50 border-slate-300 shadow-sm' : 'bg-[#050b14]/80 backdrop-blur-xl border-[#00ff66]/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]'}`}
    >
      <div className="flex items-center space-x-3 mb-6 md:mb-8">
        <Database size={16} className="text-[#00ff66]" />
        <span className="text-xs font-black uppercase tracking-widest text-[#00ff66]">Data Sources & Assets</span>
      </div>

      <div className="flex flex-col gap-3 md:gap-4">
        {data.dataSources.map((source: any, index: number) => (
          <motion.div 
            key={index}
            whileHover={{ scale: 1.02, x: 5 }}
            className={`p-3 md:p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${isLight ? 'bg-white border-slate-200 hover:border-[#00ff66]' : 'bg-[#010308] border-white/5 hover:border-[#00ff66]/50 hover:bg-[#00ff66]/5'}`}
          >
            <div className="flex items-center space-x-3 md:space-x-4 overflow-hidden">
              <div className={`p-2.5 rounded-xl shrink-0 ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-[#00ff66]'}`}>
                 <source.icon size={16} />
              </div>
              <div className="flex flex-col truncate pr-2">
                <span className={`text-[10px] md:text-xs font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{source.name}</span>
                <span className="text-[9px] md:text-[10px] font-mono text-slate-500 tracking-widest mt-1">{source.size}</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-md text-[9px] md:text-[10px] font-black tracking-widest shrink-0 ${isLight ? 'bg-slate-200 text-slate-600' : 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20'}`}>
              {source.type}
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/10">
         <p className="text-[9px] md:text-[10px] font-mono text-slate-500 leading-relaxed uppercase tracking-widest text-center">
           Datasets are sanitized and peer-reviewed for integrity.
         </p>
      </div>
    </motion.div>
  );
}

// ==========================================
// KINETIC FIGURE ACCORDION (Visual Schematics)
// ==========================================
function FigureAccordion({ figures, isLight }: { figures: any[], isLight: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="w-full flex flex-col md:flex-row gap-4 min-h-[400px] h-[50vh] max-h-[600px]">
      {figures.map((fig, index) => {
        const isActive = activeIndex === index;
        return (
          <motion.div
            key={index}
            onMouseEnter={() => setActiveIndex(index)}
            animate={{ flex: isActive ? 4 : 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className={`relative rounded-[2rem] border overflow-hidden cursor-crosshair group flex items-end p-4 md:p-6 ${
              isLight ? 'border-slate-300 shadow-md' : 'border-[#00ff66]/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${fig.hue} opacity-80 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_1px,transparent_1px)]" style={{ backgroundSize: '10px 10px' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />

            <div className={`relative z-10 flex flex-col items-start w-full transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 hidden md:flex'}`}>
              <div className="flex items-center space-x-2 mb-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                <ImageIcon size={14} className="text-[#00ff66]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff66] whitespace-nowrap">Figure 0{index + 1}</span>
              </div>
              <h4 className="text-white font-black text-lg md:text-2xl uppercase tracking-tight leading-tight truncate w-full">{fig.title}</h4>
              <button aria-label="Expand Figure" className="mt-4 p-2 bg-white/10 hover:bg-[#00ff66] hover:text-black text-white rounded-full transition-colors backdrop-blur-md">
                 <Maximize2 size={14} />
              </button>
            </div>

            <div className={`absolute top-0 bottom-0 left-0 w-full flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isActive ? 'opacity-0' : 'opacity-100 hidden md:flex'}`}>
               <span className="text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] -rotate-90 whitespace-nowrap opacity-60">Figure 0{index + 1}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ==========================================
// MAIN RESEARCH DETAIL PAGE
// ==========================================
export default function ResearchDetailPage() {
  const router = useRouter();
  const params = useParams();
  
  let rawId = params?.id as string;
  if (rawId === '%5Bid%5D' || !rawId) rawId = 'v2.4.0'; 
  const researchId = decodeURIComponent(rawId);
  
  const data = RESEARCH_DATABASE[researchId] || RESEARCH_DATABASE["default"];

  const [isLightMode, setIsLightMode] = useState(false);
  const [timeState, setTimeState] = useState({ time: "", date: "" });
  const [activeTab, setActiveTab] = useState('Abstract');
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
  const borderCol = isLightMode ? "border-slate-300" : "border-[#00ff66]/10";

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 20 } } };

  return (
    <main className={`relative min-h-screen font-sans cursor-none flex flex-col transition-colors duration-1000 w-full overflow-x-hidden ${isLightMode ? 'text-slate-900 bg-slate-50' : 'text-white bg-[#010205]'}`}>
      <CustomCursor />
      <ActiveDataBackground isLight={isLightMode} />

      {/* ==========================================
          HEADER (100% Transparent, Fixed Order)
          ========================================== */}
      <header className={`fixed top-0 left-0 right-0 h-24 w-full flex items-center justify-between px-4 sm:px-6 lg:px-12 z-50 pointer-events-none bg-transparent border-none`}>
        
        {/* Left Side: Theme, Back, & Title */}
        <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6 pointer-events-auto h-full pl-2">
          
          <div className="relative flex items-center justify-center shrink-0">
             <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            aria-label="Go back to research directory"
            onClick={() => router.push('/research')} 
            className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl border transition-all hover:bg-[#00ff66] hover:text-black hover:border-[#00ff66] shadow-sm shrink-0 ${isLightMode ? 'border-slate-300 text-slate-700 bg-white/80 backdrop-blur-md' : 'border-white/20 text-slate-300 bg-white/5 backdrop-blur-md'}`}
          >
            <ArrowLeft size={20} />
          </motion.button>

          <div className="flex items-center space-x-3 md:space-x-4">
            <ArchiveRestore size={20} className="text-[#00ff66] hidden sm:block shrink-0" />
            <div className="flex flex-col justify-center overflow-hidden">
               <h1 className={`text-xs sm:text-sm md:text-lg font-black tracking-[0.1em] sm:tracking-[0.2em] uppercase leading-tight truncate ${textPrimary}`}>{data.title}</h1>
               <p className="text-[8px] sm:text-[10px] font-mono text-[#00ff66] tracking-[0.1em] sm:tracking-[0.2em] uppercase mt-1">Research Directory</p>
            </div>
          </div>
        </div>

        {/* Right Side: Profile HUD */}
        <div className="flex items-center space-x-4 pointer-events-auto h-full shrink-0 relative">
           {isAuthenticated && (
              <div className="relative" onMouseEnter={() => setIsProfileHovered(true)} onMouseLeave={() => setIsProfileHovered(false)}>
                <div className={`flex items-center space-x-3 md:space-x-4 px-3 sm:px-4 py-2 md:px-6 md:py-3 rounded-full border cursor-pointer transition-colors duration-500 backdrop-blur-md ${isLightMode ? 'bg-white/80 border-slate-300 shadow-sm' : 'bg-black/40 border-white/10 hover:border-[#00ff66]/50'}`}>
                  <span className={`font-mono text-[9px] md:text-xs tracking-widest hidden lg:block text-[#00ff66]`}>
                    {timeState.date} <span className={textSecondary}>|</span> {timeState.time}
                  </span>
                  <div className={`w-px h-4 hidden lg:block ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`} />
                  <div className="flex items-center space-x-2 md:space-x-3 group">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-tr from-[#00ff66] to-[#00f0ff] p-[1.5px] transition-all duration-500 shrink-0">
                      <div className={`w-full h-full rounded-full flex items-center justify-center ${isLightMode ? 'bg-white' : 'bg-[#010205]'}`}>
                        <User size={14} className={textPrimary} />
                      </div>
                    </div>
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors hidden sm:block ${textPrimary} group-hover:text-[#00ff66]`}>Nima</span>
                  </div>
                </div>

                <AnimatePresence>
                  {isProfileHovered && (
                    <motion.div initial={{ opacity: 0, y: 15, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.9 }} transition={{ type: "spring", stiffness: 120, damping: 20 }} className={`absolute right-0 mt-3 w-56 rounded-3xl p-3 flex flex-col transform-gpu shadow-2xl border ${isLightMode ? 'bg-white/90 border-slate-200 backdrop-blur-xl' : 'bg-[#050b14]/95 backdrop-blur-3xl border-white/10'}`}>
                      <Link href="/settings" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all ${isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}>
                        <Settings size={14} className="mr-3 text-[#00ff66]" /> Settings
                      </Link>
                      
                      <button type="button" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#00ff66] rounded-2xl transition-all group ${isLightMode ? 'hover:bg-green-50' : 'hover:bg-[#00ff66]/10'}`}>
                        <Bookmark size={14} className="mr-3 text-[#00ff66] group-hover:drop-shadow-[0_0_8px_rgba(0,255,102,0.8)]" /> Saved Research
                      </button>

                      <div className={`h-px w-full my-1 ${isLightMode ? 'bg-slate-200' : 'bg-slate-800/50'}`} />
                      <button type="button" onClick={() => { localStorage.removeItem('userRole'); setCurrentUserRole('guest'); setIsAuthenticated(false); }} className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 rounded-2xl transition-all group ${isLightMode ? 'hover:bg-red-50' : 'hover:bg-red-500/10'}`}>
                        <LogOut size={14} className="mr-3 text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> Terminate Link
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
           )}
        </div>
      </header>

      {/* ==========================================
          FLOATING NAVIGATION PILL
          ========================================== */}
      <div className="sticky top-28 z-40 w-full flex justify-center px-4 md:px-6 pointer-events-auto mt-32 mb-10">
        <div className={`flex flex-wrap items-center justify-center gap-2 p-1.5 md:p-2 rounded-[2rem] md:rounded-full border shadow-2xl backdrop-blur-xl ${isLightMode ? 'bg-white/80 border-slate-300' : 'bg-black/40 border-[#00ff66]/30'}`}>
          {['Abstract', 'Methodology', 'Visual Schematics', 'Conclusion'].map(tab => (
            <button 
              key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-[#00ff66] text-slate-900 shadow-[0_0_15px_rgba(0,255,102,0.4)]' 
                  : `${isLightMode ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:bg-white/5'} border border-transparent`
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ==========================================
          THE FLUID RESEARCH GRID (Native Scroll Enabled)
          ========================================== */}
      <div className="flex-1 w-full max-w-[1500px] mx-auto pb-10 px-4 md:px-6 lg:px-12 relative z-10 flex flex-col xl:flex-row items-start gap-6 md:gap-8 pointer-events-auto">
        
        {/* CENTER CONSOLE */}
        <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} className={`flex-1 flex flex-col gap-6 md:gap-8 min-w-0`}>
          
          {/* Hero Banner */}
          <motion.div 
            variants={itemVariants} 
            drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.05}
            whileHover={{ scale: 1.01, y: -5, rotateX: 1, rotateY: -1, zIndex: 50, boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}
            className={`w-full min-h-[350px] h-auto rounded-[2rem] md:rounded-[3rem] border relative overflow-hidden flex flex-col justify-between p-6 sm:p-8 md:p-14 shadow-2xl group transition-all duration-500 cursor-grab active:cursor-grabbing hover:border-[#00ff66]/50 ${borderCol} ${isLightMode ? 'bg-white/80 backdrop-blur-xl' : 'bg-[#050b14]/60 backdrop-blur-3xl'}`}
          >
             <div className={`absolute inset-0 bg-gradient-to-br ${data.heroImg} opacity-20 group-hover:opacity-40 transition-opacity duration-700`} />
             <div className={`absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,${isLightMode ? 'rgba(255,255,255,0.9)' : 'rgba(5,11,20,0.8)'}_100%)]`} />
             
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
                <div className="inline-flex items-center space-x-2 px-4 md:px-5 py-2 md:py-2.5 bg-[#00ff66]/10 backdrop-blur-md rounded-xl border border-[#00ff66]/30">
                   <Server size={14} className="text-[#00ff66]" />
                   <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#00ff66]">{data.field}</span>
                </div>
                
                <div className="flex items-center space-x-3 pointer-events-auto">
                   <motion.button 
                     aria-label={isSaved ? "Remove Bookmark" : "Save Research"}
                     onClick={() => setIsSaved(!isSaved)}
                     whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                     className={`flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border transition-all ${isSaved ? 'bg-[#00ff66]/20 border-[#00ff66] text-[#00ff66]' : `${isLightMode ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-black/50 border-white/20 text-slate-300 hover:border-[#00ff66]'}`}`}
                   >
                     <Bookmark size={18} fill={isSaved ? "#00ff66" : "none"} className={isSaved ? 'text-[#00ff66]' : ''} />
                   </motion.button>

                   <motion.button 
                     aria-label="Download Research as PDF"
                     whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                     className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl border transition-all shadow-[0_0_20px_rgba(0,255,102,0.15)] hover:shadow-[0_0_30px_rgba(0,255,102,0.4)] ${isLightMode ? 'bg-[#00ff66] text-slate-900 border-[#00ff66]' : 'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]/50 hover:bg-[#00ff66] hover:text-black'}`}
                   >
                     <Download size={16} />
                     <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Download PDF</span>
                   </motion.button>
                </div>
             </div>

             <div className="relative z-10 mt-12 md:mt-16">
                <h2 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-none mb-4 md:mb-6 break-words ${textPrimary}`}>{data.title}</h2>
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                  <p className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-[#00ff66] bg-[#00ff66]/10 px-3 md:px-4 py-1.5 rounded-lg border border-[#00ff66]/30">Status: {data.status}</p>
                  <p className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-slate-500">Published: {data.date}</p>
                  <p className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-cyan-500 bg-cyan-500/10 px-3 md:px-4 py-1.5 rounded-lg border border-cyan-500/20">DOI: {researchId}</p>
                </div>
             </div>
          </motion.div>

          {/* Asymmetrical Abstract & Metrics Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
            <motion.div 
              variants={itemVariants} 
              drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.1}
              whileHover={{ scale: 1.02, y: -5, rotateX: 2, rotateY: 2, zIndex: 50, boxShadow: "0 20px 40px rgba(0,255,102,0.15)", borderColor: '#00ff66' }} 
              className={`xl:col-span-7 p-6 sm:p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] border transition-colors duration-300 relative overflow-hidden cursor-grab active:cursor-grabbing ${isLightMode ? 'bg-white/80 backdrop-blur-xl border-slate-300 shadow-lg' : 'bg-black/20 backdrop-blur-3xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'}`}
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff66]/5 rounded-bl-[100px]" />
               <div className="flex items-center space-x-3 mb-6 md:mb-8 relative z-10">
                 <FileText size={20} className="text-[#00ff66]" />
                 <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${textSecondary}`}>Executive Summary</h3>
               </div>
               <p className={`text-sm md:text-base leading-relaxed font-medium relative z-10 ${textPrimary}`}>{data.abstract}</p>
            </motion.div>

            <div className="xl:col-span-5 flex flex-col gap-4">
              {data.metrics.map((metric: any, i: number) => (
                <motion.div 
                  variants={itemVariants} key={i} 
                  drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.1}
                  whileHover={{ scale: 1.02, x: -5, zIndex: 50, borderColor: '#00ff66', boxShadow: "0 10px 20px rgba(0,255,102,0.1)" }} 
                  className={`px-6 md:px-8 py-5 md:py-6 rounded-2xl md:rounded-[2rem] border flex items-center justify-between transition-all flex-1 cursor-grab active:cursor-grabbing ${isLightMode ? 'bg-white/80 backdrop-blur-xl border-slate-300' : 'bg-black/20 backdrop-blur-3xl border-white/5'}`}
                >
                  <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] ${textSecondary}`}>{metric.label}</span>
                  <div className="flex items-center space-x-4 md:space-x-6">
                    <span className={`font-mono text-lg md:text-xl ${textPrimary}`}>{metric.value}</span>
                    <span className="text-[9px] md:text-[10px] font-black tracking-widest text-[#00ff66] bg-[#00ff66]/10 border border-[#00ff66]/30 px-2 md:px-3 py-1 rounded-md">{metric.trend}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Visual Schematics Accordion */}
          <motion.div variants={itemVariants} className="w-full flex flex-col mt-4 mb-4">
            <div className="flex items-center space-x-3 mb-6 px-4">
               <ImageIcon size={18} className="text-[#00ff66]" />
               <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${textSecondary}`}>Visual Schematics & Figures</h3>
            </div>
            <FigureAccordion figures={data.figures} isLight={isLightMode} />
          </motion.div>

          {/* Methodology */}
          <motion.div 
            variants={itemVariants} 
            drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.05}
            whileHover={{ scale: 1.01, y: -5, rotateX: 1, rotateY: 1, zIndex: 50, boxShadow: "0 20px 50px rgba(0,0,0,0.6)", borderColor: '#00ff66' }} 
            className={`w-full p-6 sm:p-8 md:p-14 rounded-[2rem] md:rounded-[3rem] border transition-colors duration-300 relative overflow-hidden cursor-grab active:cursor-grabbing ${isLightMode ? 'bg-white/80 backdrop-blur-xl border-slate-300 shadow-lg' : 'bg-black/20 backdrop-blur-3xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'}`}
          >
             <div className="flex items-center space-x-3 mb-6 md:mb-8 relative z-10">
               <Microscope size={22} className="text-[#00ff66]" />
               <h3 className={`text-xs md:text-sm font-black uppercase tracking-[0.2em] ${textSecondary}`}>Methodology & Framework</h3>
             </div>
             <p className={`text-base md:text-lg leading-relaxed font-medium relative z-10 ${textPrimary}`}>{data.methodology}</p>
          </motion.div>

          {/* Conclusion */}
          <motion.div 
            variants={itemVariants} 
            drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.05}
            whileHover={{ scale: 1.01, y: -5, rotateX: 1, rotateY: -1, zIndex: 50, boxShadow: "0 20px 50px rgba(0,255,102,0.15)", borderColor: '#00ff66' }} 
            className={`w-full p-6 sm:p-8 md:p-14 rounded-[2rem] md:rounded-[3rem] border transition-colors duration-300 relative overflow-hidden cursor-grab active:cursor-grabbing ${isLightMode ? 'bg-white/80 backdrop-blur-xl border-slate-300 shadow-lg' : 'bg-black/20 backdrop-blur-3xl border-[#00ff66]/20 shadow-[0_0_40px_rgba(0,255,102,0.1)]'}`}
          >
             <div className="absolute -top-20 -left-20 w-48 md:w-64 h-48 md:h-64 bg-[#00ff66]/10 rounded-full blur-[80px]" />
             <div className="flex items-center space-x-3 mb-6 md:mb-8 relative z-10">
               <CheckCircle size={22} className="text-[#00ff66]" />
               <h3 className={`text-xs md:text-sm font-black uppercase tracking-[0.2em] ${textSecondary}`}>Research Conclusion</h3>
             </div>
             <p className={`text-base md:text-lg leading-relaxed font-medium relative z-10 ${textPrimary}`}>{data.conclusion}</p>
          </motion.div>

        </motion.div>

        {/* RIGHT RAIL: Data Sources & Node Graph */}
        <motion.div 
          variants={containerVariants} initial="hidden" animate="show" 
          className={`xl:w-[400px] w-full shrink-0 flex flex-col gap-6 md:gap-8 xl:sticky xl:top-32 px-1`}
        >
           <motion.div variants={itemVariants} className="w-full h-auto min-h-[300px]">
             <DataSourcesRepository data={data} isLight={isLightMode} />
           </motion.div>
           <motion.div variants={itemVariants} className="w-full flex-1 min-h-[350px] lg:min-h-[400px]">
             <CitationNodeGraph isLight={isLightMode} />
           </motion.div>
        </motion.div>
      </div>

      {/* ==========================================
          LINUX TERMINAL METADATA MODULE 
          ========================================== */}
      <div className="w-full max-w-[1500px] mx-auto px-4 md:px-6 lg:px-12 mb-20 relative z-10 pointer-events-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ type: "spring", stiffness: 100 }}
          drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.05}
          whileHover={{ scale: 1.01, y: -5, rotateX: 1, rotateY: -1, zIndex: 50, boxShadow: "0 20px 50px rgba(0,0,0,0.8)" }} 
          className={`w-full rounded-[2rem] border overflow-hidden shadow-2xl h-auto cursor-grab active:cursor-grabbing ${isLightMode ? 'bg-slate-900 border-slate-700' : 'bg-[#02050a]/90 backdrop-blur-xl border-[#00ff66]/20 shadow-[0_10px_50px_rgba(0,0,0,0.8)]'}`}
        >
          {/* Authentic Linux Header */}
          <div className="h-10 md:h-12 border-b border-[#00ff66]/20 bg-black/40 flex items-center px-4 justify-between relative">
            <div className="flex items-center space-x-2 relative z-10">
              <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-red-500/80 hover:bg-red-500 cursor-pointer" />
              <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-yellow-500/80 hover:bg-yellow-500 cursor-pointer" />
              <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-green-500/80 hover:bg-green-500 cursor-pointer" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-mono text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-bold">nima@research-matrix:~</span>
            </div>
          </div>
          
          {/* Linux Terminal Body */}
          <div className="p-6 md:p-8 lg:p-12 font-mono text-[10px] sm:text-xs md:text-sm leading-loose bg-[#02050a] h-auto overflow-x-auto custom-scrollbar cursor-text">
            <div className="text-[#00ff66] mb-4 md:mb-6 whitespace-pre-wrap">
              <span className="text-[#00ff66] font-bold">nima@research-matrix</span><span className="text-white">:</span><span className="text-[#00f0ff]">~</span>$ cat metadata.json
            </div>
            
            <div className="pl-3 md:pl-4 border-l border-white/10">
               <div className="text-slate-300">{"{"}</div>
               <div className="pl-4 sm:pl-8">
                  <p className="mb-2"><span className="text-[#00f0ff]">"Writer"</span>: <span className="text-[#00ff66]">"{data.metadata.writer}"</span>,</p>
                  
                  <p className="mb-2"><span className="text-[#00f0ff]">"Contributors"</span>: [</p>
                  <div className="pl-4 sm:pl-8">
                    {data.metadata.contributors.map((c: string, i: number) => (
                      <p key={i} className="text-[#00ff66] break-words md:whitespace-nowrap">"{c}"{i !== data.metadata.contributors.length - 1 ? ',' : ''}</p>
                    ))}
                  </div>
                  <p className="mb-2">],</p>

                  <p className="mb-2"><span className="text-[#00f0ff]">"Timeline"</span>: {"{"}</p>
                  <div className="pl-4 sm:pl-8">
                     <p className="mb-1"><span className="text-yellow-400">"start_date"</span>: <span className="text-[#00ff66]">"{data.metadata.startDate}"</span>,</p>
                     <p className="mb-1"><span className="text-yellow-400">"end_date"</span>: <span className="text-[#00ff66]">"{data.metadata.endDate}"</span></p>
                  </div>
                  <p className="mb-2">{"},"}</p>

                  <p className="mb-2"><span className="text-[#00f0ff]">"Topics"</span>: [</p>
                  <div className="pl-4 sm:pl-8 flex flex-col md:flex-row md:flex-wrap gap-x-2 gap-y-1">
                    {data.metadata.topics.map((t: string, i: number) => (
                      <span key={i} className="text-[#00ff66]">"{t}"{i !== data.metadata.topics.length - 1 ? ',' : ''}</span>
                    ))}
                  </div>
                  <p className="mb-2">]</p>
               </div>
               <div className="text-slate-300">{"}"}</div>
            </div>

            <div className="mt-6 md:mt-8 flex items-center space-x-2 text-[#00ff66]">
              <span className="text-[#00ff66] font-bold">nima@research-matrix</span><span className="text-white">:</span><span className="text-[#00f0ff]">~</span>$ 
              <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 md:w-2.5 h-4 md:h-5 bg-[#00ff66] shrink-0" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-20 pointer-events-auto mt-auto border-t border-white/10 bg-black/40 backdrop-blur-2xl">
        <Footer isLight={isLightMode} currentRole={currentUserRole as any} />
      </div>
      <BottomNav currentRole={currentUserRole as any} />

      {/* Global CSS to fix scrollbars and ensure layout fits seamlessly */}
      <style jsx global>{`
        body { overflow-x: hidden; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 255, 102, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 255, 102, 0.8); }
      `}</style>
    </main>
  );
}