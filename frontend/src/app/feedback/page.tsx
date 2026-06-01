"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Float, Sparkles, Icosahedron, Octahedron, PresentationControls, Text } from '@react-three/drei';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, Star, Tag, Send, MessageSquareText, ShieldCheck, 
  Lightbulb, Bug, X, User, Settings, LogOut, Activity, AlertTriangle, TerminalSquare,
  Loader2, CheckCircle2 
} from 'lucide-react';

import CustomCursor from '@/components/CustomCursor';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';

// ==========================================
// MOCK DATABASE & AI PREDICTIONS
// ==========================================
const SEARCHABLE_ITEMS = [
  { id: "P-01", type: "Project", title: "Lanka Washing System" },
  { id: "P-02", type: "Project", title: "AutoHub Platform" },
  { id: "R-01", type: "Research", title: "UML Design Patterns" },
  { id: "R-02", type: "Research", title: "Server Defense Wiki" },
  { id: "R-03", type: "Research", title: "Gen-AI Methodologies" },
];

const PREDICTIONS: Record<string, string> = {
  "system": " architecture needs optimization.",
  "ui": " feels highly intuitive and responsive.",
  "add": " a caching layer to reduce latency.",
  "bug": " detected in the routing logic.",
  "design": " patterns are well implemented.",
  "the": " interface is looking incredibly sharp.",
};

const ultraSmoothSpring = { type: "spring" as const, stiffness: 100, damping: 20, mass: 0.8 };
const formStagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemReveal = { hidden: { opacity: 0, y: 20, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1, transition: ultraSmoothSpring } };

// ==========================================
// 3D DIGITAL SKELETON CORE
// ==========================================
function DigitalSkeletonCore({ rating, isTyping, isLight, lastChar }: { rating: number, isTyping: boolean, isLight: boolean, lastChar: string }) {
  const getCoreColor = () => {
    if (rating <= 2) return "#ef4444"; 
    if (rating === 3) return "#f59e0b"; 
    return "#00f0ff"; 
  };

  const spinSpeed = isTyping ? 5 : (rating <= 2 ? 3 : 1);
  const coreColor = getCoreColor();

  return (
    <group position={[0, 0, -1]}>
      <ambientLight intensity={isLight ? 2 : 1} />
      <directionalLight position={[5, 10, 5]} intensity={isLight ? 3 : 2} color={coreColor} />
      
      <PresentationControls global config={{ mass: 1, tension: 100 }} snap={{ mass: 2, tension: 500 }} rotation={[0, -0.2, 0]}>
        <Float speed={spinSpeed} floatIntensity={1.5} rotationIntensity={2}>
          
          <AnimatePresence>
            {lastChar && isTyping && (
              <Text position={[0, 0, 0]} fontSize={1.8} font="/fonts/Inter-Black.woff" color={coreColor} anchorX="center" anchorY="middle" fillOpacity={0.9}>
                {lastChar.toUpperCase()}
              </Text>
            )}
          </AnimatePresence>

          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.8, 0.01, 16, 100]} />
            <meshBasicMaterial color={coreColor} opacity={0.3} transparent />
          </mesh>

          <mesh rotation={[0, Math.PI / 4, 0]}>
            <torusGeometry args={[2.4, 0.02, 16, 100]} />
            <meshBasicMaterial color={isLight ? "#000" : "#fff"} opacity={0.1} transparent />
          </mesh>

          <Icosahedron args={[1.6, 1]}>
            <meshStandardMaterial color={coreColor} wireframe={true} emissive={coreColor} emissiveIntensity={isTyping ? 1.5 : 0.5} transparent opacity={0.8} />
          </Icosahedron>

          <Octahedron args={[0.8, 0]}>
            <meshStandardMaterial color={coreColor} wireframe={true} emissive={isLight ? "#000" : "#fff"} emissiveIntensity={isTyping ? 1 : 0.2} transparent opacity={0.4} />
          </Octahedron>

        </Float>
      </PresentationControls>
      
      <Sparkles count={150} scale={7} size={2} speed={isTyping ? 1.5 : 0.5} color={coreColor} opacity={0.5} />
    </group>
  );
}

// ==========================================
// ANIMATED CYBER GRID
// ==========================================
function AnimatedCyberGrid({ isLight }: { isLight: boolean }) {
  const bgColor = isLight ? 'bg-slate-50' : 'bg-[#010205]';
  const hexColor = isLight ? 'rgba(0, 240, 255, 0.1)' : 'rgba(0, 240, 255, 0.03)'; 
  
  return (
    <div className={`fixed inset-0 z-0 pointer-events-none transition-colors duration-1000 ${bgColor} overflow-hidden`}>
      <motion.div 
        animate={{ y: [0, -100, 0] }} transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        className="absolute inset-0 w-full h-[200%] opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='103.92304845413264' viewBox='0 0 60 103.92304845413264' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 103.92304845413264L60 86.60254037844386L60 51.96152422706632L30 34.64101615137754L0 51.96152422706632L0 86.60254037844386Z' fill='transparent' stroke='${encodeURIComponent(hexColor)}' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 103.92px'
        }}
      />
      <motion.div animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity }} className={`absolute top-0 left-1/4 w-[40vw] h-[40vw] rounded-full blur-[150px] ${isLight ? 'bg-amber-400/20' : 'bg-[#f59e0b]/10'}`} />
      <motion.div animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.05, 1] }} transition={{ duration: 8, repeat: Infinity }} className={`absolute bottom-0 right-1/4 w-[50vw] h-[50vw] rounded-full blur-[180px] ${isLight ? 'bg-cyan-400/20' : 'bg-[#00f0ff]/10'}`} />
    </div>
  );
}

// ==========================================
// MAIN FEEDBACK PAGE
// ==========================================
export default function MasterFeedbackVault() {
  const router = useRouter();
  const [isLightMode, setIsLightMode] = useState(false);
  const [timeState, setTimeState] = useState({ time: "", date: "" });
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  
  // DYNAMIC USER DATA
  const [userData, setUserData] = useState<any>(null);

  // Form State
  const [rating, setRating] = useState(3); 
  const [feedbackType, setFeedbackType] = useState('Feature Request');
  const [priority, setPriority] = useState('Medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [taggedItems, setTaggedItems] = useState<typeof SEARCHABLE_ITEMS>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recommend, setRecommend] = useState(true);
  const [message, setMessage] = useState('');
  
  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Chat & AI State
  const [isTyping, setIsTyping] = useState(false);
  const [prediction, setPrediction] = useState('');
  const lastChar = message.length > 0 ? message.slice(-1) : '';

  const formRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [4, -4]); 
  const rotateY = useTransform(mouseX, [-300, 300], [-4, 4]);

  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-600" : "text-slate-400";
  const glassBg = isLightMode ? "bg-white/90 border-slate-200 shadow-2xl" : "bg-[#010308]/90 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]";
  const inputBg = isLightMode ? "bg-slate-100 border-slate-300 focus:border-cyan-500" : "bg-black/40 border-white/10 focus:border-white/30";

  const activeAccent = rating <= 2 ? '#ef4444' : rating === 3 ? '#f59e0b' : '#00f0ff';
  const activeAccentGlow = rating <= 2 ? 'rgba(239,68,68,0.3)' : rating === 3 ? 'rgba(245,158,11,0.3)' : 'rgba(0,240,255,0.3)';

  // LIVE DATABASE HYDRATION
  useEffect(() => {
    const fetchMatrixData = async () => {
      const token = localStorage.getItem('matrix_token');
      if (!token) return;

      try {
        const userRes = await fetch('http://localhost:5000/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (userRes.ok) {
          const { data } = await userRes.json();
          setUserData(data);
        }
      } catch (err) { console.error(err); }
    };
    fetchMatrixData();
  }, []);

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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);
    
    if (val.length > 0) {
      setIsTyping(true);
      const timeout = setTimeout(() => setIsTyping(false), 800);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }

    setPrediction('');
    const words = val.toLowerCase().trim().split(/\s+/);
    const lastWord = words[words.length - 1];
    
    if (val.endsWith(' ') && PREDICTIONS[lastWord]) {
      setPrediction(PREDICTIONS[lastWord]);
    }
  };

  const acceptPrediction = () => {
    if (prediction) {
      setMessage(prev => prev.trim() + " " + prediction.trim() + " ");
      setPrediction('');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!formRef.current) return;
    const rect = formRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleTagItem = (item: typeof SEARCHABLE_ITEMS[0]) => {
    if (!taggedItems.find(t => t.id === item.id)) {
      setTaggedItems([...taggedItems, item]);
    }
    setSearchQuery('');
    setIsSearching(false);
  };

  const removeTag = (id: string) => {
    setTaggedItems(taggedItems.filter(t => t.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem('matrix_token');
    localStorage.removeItem('userRole');
    router.push('/auth');
  };

  const filteredSearch = SEARCHABLE_ITEMS.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const feedbackTypes = [
    { id: 'General', icon: MessageSquareText },
    { id: 'Feature Request', icon: Lightbulb },
    { id: 'Bug Report', icon: Bug }
  ];

  const priorityLevels = [
    { id: 'Low', color: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]/10', border: 'border-[#00f0ff]/30' },
    { id: 'Medium', color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10', border: 'border-[#f59e0b]/30' },
    { id: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  ];

  // 🔥 FIRST-PARTY LOCAL DATABASE SUBMISSION 🔥
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('matrix_token');

    try {
      const res = await fetch("http://localhost:5000/api/feedback/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          rating,
          category: feedbackType,
          priority,
          recommend,
          tags: taggedItems.map(t => `${t.id} (${t.title})`).join(', '),
          message,
        }),
      });
      
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setMessage('');
          setTaggedItems([]);
          setRating(3);
          setPriority('Medium');
          setFeedbackType('Feature Request');
        }, 3000);
      } else {
        alert("Telemetry submission failed. Ensure you are authorized.");
      }
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = userData?.fullName ? userData.fullName.toUpperCase() : "GUEST";

  return (
    <main className={`relative min-h-screen font-sans cursor-none overflow-x-hidden selection:bg-[${activeAccent}]/30 flex flex-col transition-colors duration-1000 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
      <CustomCursor />
      
      <AnimatedCyberGrid isLight={isLightMode} />

      <div className="fixed top-24 left-6 lg:left-12 z-[100] pointer-events-auto">
        <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />
      </div>

      <div className="fixed top-0 left-0 right-0 z-50 pt-6 px-6 lg:px-12 flex justify-between items-start pointer-events-none">
        
        <div className="flex items-center space-x-3 pointer-events-auto mt-20">
          <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-[#f59e0b] to-[#00f0ff] rounded-lg flex items-center justify-center text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Activity size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className={`text-xl font-black tracking-widest uppercase ${textPrimary}`}>CSx<span className="text-[#f59e0b]">FEEDBACK</span></h1>
            <p className="text-[10px] font-mono text-[#00f0ff] tracking-[0.2em] uppercase">Data Telemetry</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 pointer-events-auto">
          <div className="relative" onMouseEnter={() => setIsProfileHovered(true)} onMouseLeave={() => setIsProfileHovered(false)}>
            <div className={`flex items-center space-x-4 px-6 py-2.5 rounded-full backdrop-blur-xl cursor-pointer transition-colors duration-700 ${glassBg}`}>
              <span className={`text-[${activeAccent}] font-mono text-xs tracking-widest hidden sm:block transition-colors duration-500`} style={{ color: activeAccent }}>
                {timeState.date} <span className={textSecondary}>|</span> {timeState.time}
              </span>
              <div className={`w-px h-4 hidden sm:block ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`} />
              <div className="flex items-center space-x-3 group">
                
                {/* 🔥 DYNAMIC PROFILE PICTURE UPGRADE 🔥 */}
                <div className={`w-7 h-7 rounded-full bg-gradient-to-tr from-[${activeAccent}] to-[#00f0ff] p-[1.5px] transition-all duration-500 shrink-0 overflow-hidden`} style={{ backgroundImage: `linear-gradient(to top right, ${activeAccent}, #00f0ff)` }}>
                  <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${isLightMode ? 'bg-white' : 'bg-[#010205]'}`}>
                    {userData?.profilePic ? (
                      <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={12} className={textPrimary} />
                    )}
                  </div>
                </div>

                <span className={`text-xs font-black uppercase tracking-widest transition-colors ${textPrimary}`} style={{ color: isProfileHovered ? activeAccent : undefined }}>
                  {displayName}
                </span>

              </div>
            </div>

            <AnimatePresence>
              {isProfileHovered && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }} exit={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} transition={ultraSmoothSpring}
                  className={`absolute right-0 mt-3 w-56 rounded-2xl backdrop-blur-2xl p-2 flex flex-col transform-gpu shadow-2xl ${glassBg}`}
                >
                  <Link href="/settings" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}>
                    <Settings size={14} className="mr-3 text-[#f59e0b]" /> Settings
                  </Link>
                  <div className={`h-px w-full my-1 ${isLightMode ? 'bg-slate-200' : 'bg-slate-800/50'}`} />
                  <button onClick={handleLogout} type="button" aria-label="Terminate Link" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 rounded-xl transition-all group ${isLightMode ? 'hover:bg-red-50' : 'hover:bg-red-500/10'}`}>
                    <LogOut size={14} className="mr-3 text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> Terminate Link
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full min-h-screen pt-32 pb-48 px-6 lg:px-12 flex flex-col lg:flex-row gap-8 flex-grow">
        
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center lg:items-start min-h-[500px] relative">
          
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={ultraSmoothSpring} className="relative z-10 text-center lg:text-left mb-8 pointer-events-none drop-shadow-2xl">
            <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter mb-4 leading-none">
              Transmit <br/>
              <span className={`text-transparent bg-clip-text bg-gradient-to-r transition-all duration-500`} style={{ backgroundImage: `linear-gradient(to right, ${activeAccent}, #00f0ff)` }}>
                Telemetry
              </span>
            </h2>
            <p className={`text-sm lg:text-base max-w-md font-mono tracking-wide ${textSecondary}`}>
              Communicate directly with the architecture matrix. The digital skeleton actively responds to your inputs and system ratings.
            </p>
            <div className="mt-6 flex items-center space-x-2 justify-center lg:justify-start">
              <span className={`text-[10px] uppercase tracking-widest font-bold border px-3 py-1 rounded-full transition-colors duration-500 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-black/40 border-white/20'}`} style={{ color: activeAccent, borderColor: activeAccent }}>
                [ Matrix is Interactive ]
              </span>
            </div>
          </motion.div>

          <div className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing">
             <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                <DigitalSkeletonCore rating={rating} isTyping={isTyping} isLight={isLightMode} lastChar={lastChar} />
             </Canvas>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end items-center pb-20 [perspective:2000px]">
          <motion.div 
            ref={formRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial="hidden" animate="visible" variants={formStagger}
            className={`w-full max-w-2xl rounded-[2.5rem] p-8 lg:p-10 backdrop-blur-3xl border overflow-hidden relative transition-shadow duration-700 ${glassBg}`}
            style={{ 
              rotateX, 
              rotateY, 
              boxShadow: `0 30px 80px ${activeAccentGlow}, inset 0 0 20px rgba(255,255,255,0.02)` 
            }}
          >
            <form onSubmit={handleFormSubmit} className="flex flex-col space-y-8 pointer-events-auto relative z-10">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div variants={itemReveal}>
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-3 ${textSecondary}`}>Category</label>
                  <div className="flex space-x-2">
                    {feedbackTypes.map((type) => (
                      <button
                        key={type.id} type="button" aria-label={`Select ${type.id}`} onClick={() => setFeedbackType(type.id)}
                        className={`flex-1 flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                          feedbackType === type.id 
                            ? (isLightMode ? `bg-[${activeAccent}]/10 shadow-sm` : 'bg-black/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]')
                            : (isLightMode ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/20')
                        }`}
                        style={feedbackType === type.id ? { borderColor: activeAccent, color: activeAccent } : {}}
                      >
                        <type.icon size={18} className="mb-2" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-center">{type.id}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={itemReveal}>
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-3 ${textSecondary}`}>System Rating</label>
                  <div className={`h-[82px] flex items-center justify-center rounded-2xl border transition-colors duration-500 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/5'}`}>
                    <div className="flex space-x-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star} type="button" aria-label={`Rate ${star} stars`} title={`Rate ${star} stars`} onClick={() => setRating(star)}
                          whileHover={{ scale: 1.2, rotate: 10 }}
                          whileTap={{ scale: 0.9 }}
                          className="relative"
                        >
                          <Star 
                            size={32} 
                            className={`transition-all duration-500 ${
                              rating >= star 
                                ? 'drop-shadow-lg'
                                : (isLightMode ? 'text-slate-300' : 'text-slate-700')
                            }`} 
                            style={{ color: rating >= star ? activeAccent : undefined, fill: rating >= star ? activeAccent : 'transparent' }}
                          />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div variants={itemReveal} className="md:col-span-2 relative z-50">
                  <label className={`block text-xs font-bold uppercase tracking-widest mb-3 ${textSecondary}`}>Target Link (Optional)</label>
                  <div className={`relative flex items-center rounded-xl border transition-all shadow-inner ${inputBg}`} style={{ borderColor: isSearching ? activeAccent : undefined, boxShadow: isSearching ? `0 0 0 1px ${activeAccent}` : undefined }}>
                    <Search size={16} className={`ml-4 ${textSecondary}`} />
                    <input 
                      type="text" placeholder="Search Projects or Research..." 
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearching(true)} onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                      className="w-full bg-transparent border-none py-4 px-3 text-sm font-mono focus:outline-none placeholder-slate-500"
                    />
                  </div>

                  <AnimatePresence>
                    {isSearching && searchQuery && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className={`absolute top-[75px] left-0 right-0 rounded-xl border backdrop-blur-2xl overflow-hidden shadow-2xl ${glassBg}`}
                      >
                        {filteredSearch.length > 0 ? (
                          filteredSearch.map((item) => (
                            <div 
                              key={item.id} onClick={() => handleTagItem(item)}
                              className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${isLightMode ? 'hover:bg-slate-100' : 'hover:bg-white/10'}`}
                            >
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest mr-3" style={{ color: activeAccent }}>[{item.type}]</span>
                                <span className="text-sm font-bold">{item.title}</span>
                              </div>
                              <span className={`text-xs font-mono ${textSecondary}`}>{item.id}</span>
                            </div>
                          ))
                        ) : (
                          <div className={`px-4 py-3 text-sm font-mono ${textSecondary}`}>No matching systems found.</div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <AnimatePresence>
                      {taggedItems.map((tag) => (
                        <motion.div 
                          key={tag.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          className={`flex items-center px-3 py-1.5 rounded-lg border text-xs font-mono ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-black/40 border-white/20'}`}
                          style={{ color: activeAccent }}
                        >
                          <Tag size={12} className="mr-2" />
                          {tag.title}
                          <button type="button" aria-label={`Remove tag ${tag.title}`} title={`Remove tag ${tag.title}`} onClick={() => removeTag(tag.id)} className="ml-2 hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>

                <motion.div variants={itemReveal}>
                   <label className={`block text-xs font-bold uppercase tracking-widest mb-3 ${textSecondary}`}>Priority</label>
                   <div className="flex flex-col space-y-2">
                      {priorityLevels.map((level) => (
                        <button
                          key={level.id} type="button" aria-label={`Set priority to ${level.id}`} onClick={() => setPriority(level.id)}
                          className={`flex items-center justify-center py-2.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${
                            priority === level.id 
                              ? `${level.bg} ${level.border} ${level.color} shadow-[inset_0_0_10px_currentColor]` 
                              : (isLightMode ? 'bg-white border-slate-200 text-slate-400' : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/20')
                          }`}
                        >
                          {priority === level.id && <AlertTriangle size={12} className="mr-2" />}
                          {level.id}
                        </button>
                      ))}
                   </div>
                </motion.div>
              </div>

              <motion.div variants={itemReveal} className="relative">
                <div className="flex justify-between items-end mb-3">
                  <label className={`block text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Telemetry Log</label>
                  
                  <div className="flex items-end space-x-1 h-4">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <motion.div 
                        key={bar}
                        animate={isTyping ? { height: ['20%', '100%', '20%'] } : { height: '20%' }}
                        transition={{ duration: 0.4, repeat: isTyping ? Infinity : 0, delay: bar * 0.1 }}
                        className="w-1 rounded-full"
                        style={{ backgroundColor: activeAccent }}
                      />
                    ))}
                    <span className={`text-[9px] font-mono ml-2 uppercase tracking-widest ${textSecondary}`} style={{ color: isTyping ? activeAccent : undefined }}>
                      {isTyping ? 'ANALYZING...' : 'STANDBY'}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <textarea 
                    required rows={5} placeholder="Input your architectural analysis or feedback..."
                    value={message} onChange={handleTextChange} disabled={isSubmitting || isSuccess}
                    className={`w-full rounded-2xl py-4 px-5 text-sm font-mono focus:outline-none transition-all shadow-inner resize-none ${inputBg} ${textPrimary} placeholder-slate-500 relative z-10 disabled:opacity-50`}
                    style={{ borderColor: isTyping ? activeAccent : undefined }}
                  />
                  
                  <AnimatePresence>
                    {prediction && !isSubmitting && !isSuccess && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute bottom-4 right-4 z-20 flex items-center space-x-2"
                      >
                        <div 
                          className={`px-3 py-1.5 rounded-lg border text-xs font-mono shadow-lg backdrop-blur-md flex items-center cursor-pointer hover:scale-105 transition-transform ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-black/80 border-white/20'}`} 
                          style={{ color: activeAccent }}
                          onClick={acceptPrediction}
                        >
                          <TerminalSquare size={12} className="mr-2" />
                          <span className="opacity-70 mr-2">Suggest:</span> {prediction} 
                          <span className="ml-2 font-black opacity-50">[CLICK]</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.div variants={itemReveal} className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/10 gap-6">
                
                <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => !isSubmitting && !isSuccess && setRecommend(!recommend)}>
                  <button 
                    type="button"
                    disabled={isSubmitting || isSuccess}
                    aria-label="Toggle Recommendation"
                    title="Toggle Recommendation"
                    className={`w-14 h-7 rounded-full p-1 transition-colors duration-500 ${recommend ? 'bg-amber-500' : (isLightMode ? 'bg-slate-300' : 'bg-slate-700')} disabled:opacity-50`}
                    style={{ backgroundColor: recommend ? activeAccent : undefined }}
                  >
                    <motion.div 
                      layout transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`w-5 h-5 rounded-full shadow-md ${isLightMode ? 'bg-white' : 'bg-black'}`}
                      style={{ marginLeft: recommend ? '28px' : '0px' }}
                    />
                  </button>
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold uppercase tracking-widest flex items-center ${recommend ? textPrimary : textSecondary}`}>
                      Recommend this System?
                    </span>
                    <span className={`text-[10px] font-mono mt-0.5 ${textSecondary}`}>Public Endorsement</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || isSuccess}
                  className={`w-full sm:w-auto flex items-center justify-center px-10 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 overflow-hidden relative group ${
                    isSuccess 
                      ? 'bg-[#00ff66] text-black shadow-[0_0_30px_rgba(0,255,102,0.4)]' 
                      : (isLightMode ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-black')
                  } ${isSubmitting && 'opacity-80 cursor-wait'}`}
                >
                  {!isSuccess && !isSubmitting && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ backgroundColor: activeAccent }} />
                  )}
                  
                  <span className={`relative z-10 flex items-center transition-colors ${!isSuccess && !isSubmitting && 'group-hover:text-white'}`}>
                    {isSubmitting ? (
                      <Loader2 size={18} className="mr-3 animate-spin" />
                    ) : isSuccess ? (
                      <CheckCircle2 size={18} className="mr-3" />
                    ) : (
                      <Send size={18} className="mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    )}
                    
                    {isSubmitting ? 'Transmitting...' : isSuccess ? 'Telemetry Sent' : 'Transmit Data'}
                  </span>
                </button>

              </motion.div>

            </form>
          </motion.div>
        </div>
      </div>
      
      <div className="relative z-20 pointer-events-auto">
        <Footer isLight={isLightMode} currentRole="user" />
      </div>
      
      <BottomNav currentRole="user" />
    </main>
  );
}