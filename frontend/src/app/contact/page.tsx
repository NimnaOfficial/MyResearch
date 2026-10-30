"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal as TermIcon, Send, User, Mail, GitBranch, Network, Globe, 
  ShieldCheck, Radio, ArrowUpRight, Settings, Star, LogOut, CheckCircle2,
  AlertTriangle, Lock, RefreshCw, Sparkles as SparklesIcon
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, MeshTransmissionMaterial, Torus, Sphere, OrbitControls, Icosahedron } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import Link from 'next/link';

import { API_URL, getToken, handleSafeAdminLogout } from '@/lib/api';
import { sendContactMessage } from '@/lib/protocols';
import BottomNav from '@/components/BottomNav';
import CustomCursor from '@/components/CustomCursor';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import Footer from '@/components/Footer';

// ==========================================
// 1. OPERATOR PUBLIC CONTACT COORDINATES
// ==========================================
const IDENTITY_DATA = [
  { label: "Operator Identity", value: "NIMA", icon: User, link: null }, 
  { label: "Encrypted Mail", value: "sandanimne0@gmail.com", icon: Mail, link: "mailto:sandanimne0@gmail.com" },
  { label: "GitHub Repository", value: "NimnaOfficial", icon: GitBranch, link: "https://github.com/NimnaOfficial/" },
  { label: "LinkedIn Network", value: "sandanimne-k-g-l", icon: Network, link: "https://www.linkedin.com/in/sandanimne-k-g-l-a276aa34a/" },
  { label: "Portfolio Domain", value: "nimnaofficial.github.io/My-Portfolio", icon: Globe, link: "https://nimnaofficial.github.io/My-Portfolio" }
];

// ==========================================
// 2. ADVANCED 3D COMMUNICATION OBJECT
// ==========================================
function QuantumSignalRelay({ isLight }: { isLight: boolean }) {
  const relayRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (relayRef.current) {
      relayRef.current.rotation.y += delta * 0.2;
      relayRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      relayRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (pulseRef.current) {
      const scale = 1 + (state.clock.elapsedTime % 2) * 2; 
      const opacity = Math.max(0, 1 - (state.clock.elapsedTime % 2)); 
      pulseRef.current.scale.set(scale, scale, scale);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * (isLight ? 0.2 : 0.4);
    }
  });

  return (
    <>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      <Float speed={2} rotationIntensity={1} floatIntensity={1} position={[0, 0, -4]}>
        <group ref={relayRef}>
          <Icosahedron args={[1.5, 1]}>
            <MeshTransmissionMaterial backside samples={2} resolution={256} thickness={0.5} roughness={0.1} color={isLight ? "#3b82f6" : "#00f0ff"} distortionScale={0} temporalDistortion={0} />
          </Icosahedron>
          <Torus args={[2.8, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={isLight ? "#2563eb" : "#22d3ee"} />
          </Torus>
          <Torus args={[3.5, 0.01, 16, 100]} rotation={[0, Math.PI / 3, 0]}>
            <meshBasicMaterial color={isLight ? "#94a3b8" : "#818cf8"} />
          </Torus>
          <Torus args={[4.5, 0.03, 16, 100]} rotation={[0, -Math.PI / 4, 0]}>
            <meshBasicMaterial color={isLight ? "#2563eb" : "#22d3ee"} transparent opacity={0.5} />
          </Torus>
          <Sphere ref={pulseRef} args={[2, 32, 32]}>
            <meshBasicMaterial color={isLight ? "#3b82f6" : "#00f0ff"} transparent depthWrite={false} wireframe />
          </Sphere>
        </group>
      </Float>
    </>
  );
}

// ==========================================
// 3. ANIMATION VARIANTS
// ==========================================
const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 120 } } };

interface UserProfile {
  id?: string;
  username: string;
  fullName?: string;
  email: string;
  role: string;
  profilePic?: string;
}

export default function ContactPage() {
  const { isLightMode, toggleTheme } = useTheme();
  
  // Real Identity Telemetry States
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Profile Header States
  const [timeState, setTimeState] = useState({ time: "", date: "" });
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<{ messageId: string; email: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch Real User Identity (Zero Dummy Data)
  useEffect(() => {
    const hydrateIdentity = async () => {
      const token = getToken();
      if (!token) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsLoadingAuth(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const json = await res.json();
          const user = json.data as UserProfile;
          setCurrentUser(user);
          setIsAuthenticated(true);
          setFormData(prev => ({
            ...prev,
            name: user.fullName || user.username,
            email: user.email,
          }));
        } else {
          // Token invalid or expired for normal user
          const storedRole = localStorage.getItem('userRole');
          if (storedRole === 'admin') {
            const fallbackAdmin: UserProfile = {
              username: 'root_master',
              fullName: 'Master Administrator',
              email: 'nimnakgls980@gmail.com',
              role: 'admin',
            };
            setCurrentUser(fallbackAdmin);
            setIsAuthenticated(true);
            setFormData(prev => ({
              ...prev,
              name: fallbackAdmin.fullName || 'Master Administrator',
              email: fallbackAdmin.email,
            }));
          } else {
            setIsAuthenticated(false);
            setCurrentUser(null);
          }
        }
      } catch (err) {
        const storedRole = localStorage.getItem('userRole');
        if (storedRole === 'admin') {
          setIsAuthenticated(true);
          setCurrentUser({
            username: 'root_master',
            fullName: 'Master Administrator',
            email: 'nimnakgls980@gmail.com',
            role: 'admin',
          });
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } finally {
        setIsLoadingAuth(false);
      }
    };

    hydrateIdentity();
  }, []);

  // Clock Logic
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

  const handleLogout = async () => {
    await handleSafeAdminLogout(() => {
      localStorage.removeItem('userRole');
      setIsAuthenticated(false);
      setCurrentUser(null);
      window.location.href = '/auth';
    });
  };

  // Form Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const messageTrimmed = formData.message.trim();
    if (!messageTrimmed) {
      setErrorMessage("Please enter a transmission message.");
      return;
    }

    // Determine target name and email
    const senderName = isAuthenticated && currentUser
      ? (currentUser.fullName || currentUser.username)
      : formData.name.trim();

    const senderEmail = isAuthenticated && currentUser
      ? currentUser.email
      : formData.email.trim().toLowerCase();

    if (!senderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      setErrorMessage("A valid email address is required to establish communication.");
      return;
    }

    if (!senderName) {
      setErrorMessage("Please specify your operator identity or name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await sendContactMessage({
        name: senderName,
        email: senderEmail,
        subject: formData.subject,
        message: messageTrimmed,
      });

      if (result.success) {
        setIsSubmitted(true);
        setSubmissionReceipt({
          messageId: result.messageId,
          email: senderEmail,
        });
        setFormData(prev => ({
          ...prev,
          message: '',
          subject: 'General Inquiry',
        }));
      } else {
        setErrorMessage("Transmission could not be established. Please retry shortly.");
      }
    } catch (err: any) {
      console.error("[CONTACT ERROR]", err);
      setErrorMessage(err.message || "Network exception during transmission dispatch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Theme Variables
  const bgCol = isLightMode ? 'bg-[#f8fafc]' : 'bg-[#01030a]';
  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-500" : "text-slate-400";
  const accentText = isLightMode ? "text-blue-600" : "text-cyan-400";
  
  const techPurple = isLightMode ? "text-[#9333ea]" : "text-[#a855f7]";
  const techPurpleHex = isLightMode ? "#9333ea" : "#a855f7";
  const glassPanel = isLightMode ? "bg-white/90 border-slate-200 shadow-xl text-slate-800" : "bg-[#030b1c]/80 border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.05)]";
  
  const inputStyle = isLightMode 
    ? "bg-white/80 border-slate-300 text-slate-900 focus:border-[#9333ea] focus:ring-[#9333ea]/20 placeholder-slate-400" 
    : "bg-[#020712]/80 border-cyan-500/30 text-cyan-50 focus:border-[#a855f7] focus:ring-[#a855f7]/20 placeholder-cyan-900/60";

  return (
    <main className={`relative min-h-screen transition-colors duration-700 font-sans cursor-none overflow-x-hidden ${bgCol}`}>
      <CustomCursor />
      
      {/* THEME TOGGLE */}
      <div className="fixed top-24 left-6 lg:left-12 z-[100] pointer-events-auto">
        <ThemeToggle isLight={isLightMode} toggleTheme={toggleTheme} />
      </div>

      {/* ==========================================
          HEADER (LOGO & AUTHENTICATED PROFILE HUD)
          ========================================== */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-6 px-6 lg:px-12 flex justify-between items-start pointer-events-none">
        
        {/* LOGO */}
        <div className="flex items-center space-x-3 pointer-events-auto mt-20">
          <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-[#9333ea] to-[#00f0ff] rounded-lg flex items-center justify-center text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]">
            <Radio size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className={`text-xl font-black tracking-widest uppercase ${textPrimary}`}>CSx<span className={techPurple}>CONTACT</span></h1>
            <p className={`text-[10px] font-mono ${accentText} tracking-[0.2em] uppercase`}>Comm-Link</p>
          </div>
        </div>

        {/* PROFILE HUD */}
        <div className="flex items-center space-x-4 pointer-events-auto mt-20">
          {isAuthenticated && currentUser ? (
            <div className="relative" onMouseEnter={() => setIsProfileHovered(true)} onMouseLeave={() => setIsProfileHovered(false)}>
              <div className={`flex items-center space-x-3 sm:space-x-4 px-4 sm:px-6 py-2.5 rounded-full backdrop-blur-xl cursor-pointer transition-colors duration-700 ${glassPanel}`}>
                <span className={`${techPurple} font-mono text-xs tracking-widest hidden sm:block transition-colors duration-500`}>
                  {timeState.date} <span className={textSecondary}>|</span> {timeState.time}
                </span>
                <div className={`w-px h-4 hidden sm:block ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`} />
                <div className="flex items-center space-x-2.5 group">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#a855f7] to-[#00f0ff] p-[1.5px] transition-all duration-500">
                    <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${isLightMode ? 'bg-white' : 'bg-[#010205]'}`}>
                      {currentUser.profilePic ? (
                        <img src={currentUser.profilePic} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-black text-white">
                          {(currentUser.fullName || currentUser.username).slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className={`text-xs font-black uppercase tracking-wider transition-colors ${textPrimary}`}>
                      {currentUser.fullName || currentUser.username}
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400 uppercase -mt-0.5">
                      {currentUser.role === 'admin' ? '🛡️ ROOT ADMIN' : 'CONNECTED NODE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileHovered && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} 
                    animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }} 
                    exit={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} 
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className={`absolute right-0 mt-3 w-56 rounded-2xl backdrop-blur-2xl p-2 flex flex-col transform-gpu shadow-2xl ${glassPanel}`}
                  >
                    <div className="px-4 py-2 border-b border-slate-700/50 mb-1">
                      <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                    </div>
                    {currentUser.role === 'admin' && (
                      <Link href="/admin" className={`flex items-center px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-amber-400 rounded-xl transition-all ${isLightMode ? 'hover:bg-amber-50' : 'hover:bg-amber-500/10'}`}>
                        <ShieldCheck size={14} className="mr-3 text-amber-400" /> Admin Command
                      </Link>
                    )}
                    <Link href="/dashboard" className={`flex items-center px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}>
                      <User size={14} className={`mr-3 ${techPurple}`} /> Personal Matrix
                    </Link>
                    <Link href="/settings" className={`flex items-center px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}>
                      <Settings size={14} className={`mr-3 ${techPurple}`} /> Settings
                    </Link>
                    <div className={`h-px w-full my-1 ${isLightMode ? 'bg-slate-200' : 'bg-slate-800/50'}`} />
                    <button type="button" aria-label="Terminate Link" onClick={handleLogout} className={`flex items-center px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-red-500 rounded-xl transition-all group ${isLightMode ? 'hover:bg-red-50' : 'hover:bg-red-500/10'}`}>
                      <LogOut size={14} className="mr-3 text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> Disconnect Node
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-full backdrop-blur-xl ${glassPanel}`}>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                GUEST OPERATOR
              </span>
              <Link
                href="/auth"
                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black transition-all"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 3D CANVAS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }} dpr={[1, 1.5]} gl={{ powerPreference: "high-performance", antialias: false, stencil: false }}>
          <ambientLight intensity={isLightMode ? 0.8 : 0.2} />
          <directionalLight position={[5, 5, 5]} intensity={isLightMode ? 2 : 5} color={isLightMode ? "#3b82f6" : "#00f0ff"} />
          <Sparkles count={100} scale={20} size={1.5} speed={0.4} opacity={isLightMode ? 0.4 : 0.6} color={isLightMode ? "#3b82f6" : "#00f0ff"} />
          <QuantumSignalRelay isLight={isLightMode} />
          <EffectComposer>
            <Bloom luminanceThreshold={isLightMode ? 0.8 : 0.2} mipmapBlur intensity={isLightMode ? 1.0 : 2.5} radius={0.8} />
          </EffectComposer>
        </Canvas>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-36 pb-40">
        
        {/* SUCCESS CONFIRMATION OVERLAY */}
        <AnimatePresence>
          {isSubmitted && (
            <motion.div initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
              <div className={`p-8 sm:p-12 rounded-3xl border text-center flex flex-col items-center max-w-lg ${glassPanel} border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)]`}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: "spring", damping: 15, delay: 0.2 }} className="p-5 rounded-full mb-6 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                  <CheckCircle2 size={48} />
                </motion.div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mb-3">
                  Delivered in Real-Time
                </span>
                <h2 className={`text-2xl sm:text-3xl font-black mb-3 tracking-widest uppercase ${textPrimary}`}>Transmission Delivered</h2>
                <p className={`text-xs sm:text-sm mb-6 ${textSecondary} leading-relaxed`}>
                  Your message has been intercepted and safely routed to the Command Matrix. A confirmation receipt has been dispatched to <strong className="text-emerald-400 font-mono">{submissionReceipt?.email}</strong>.
                </p>
                <div className="w-full bg-black/40 border border-slate-800 rounded-xl p-3 mb-6 font-mono text-[10px] text-slate-400 flex justify-between">
                  <span>DISPATCH ID:</span>
                  <span className="text-cyan-400">{submissionReceipt?.messageId}</span>
                </div>
                
                <button 
                  type="button" 
                  onClick={() => setIsSubmitted(false)} 
                  className="flex items-center px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
                >
                  Send Another Transmission
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER SECTION */}
        <div className="mb-14 text-center md:text-left mt-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center space-x-2 mb-4 bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-400/30">
            <Radio size={14} className="animate-pulse text-cyan-400" />
            <span className={`text-xs uppercase font-bold tracking-[0.25em] ${accentText}`}>Direct Comm-Link: High-Speed Active</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`text-4xl md:text-6xl font-black tracking-tight mb-4 ${textPrimary}`}>
            Establish <span className={`${accentText} font-light italic`}>Link.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`text-sm md:text-base font-light max-w-2xl ${textSecondary}`}>
            Access the identity matrix below or transmit an encrypted payload directly to the core engineering matrix.
          </motion.p>
        </div>

        {/* THE SPLIT ARCHITECTURE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start">
          
          {/* LEFT: THE IDENTITY MATRIX (NIMA's Verified Coordinates) */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-xs font-bold uppercase tracking-widest ${textPrimary}`}>Operator Coordinates</h3>
              <span className="text-[10px] font-mono text-cyan-400">STATUS: BROADCASTING</span>
            </div>
            
            {IDENTITY_DATA.map((item, idx) => {
              const ContentWrapper = item.link ? motion.a : motion.div;
              return (
                <ContentWrapper
                  key={idx}
                  href={item.link || undefined}
                  target={item.link ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, x: 8 }}
                  className={`relative overflow-hidden group flex items-center p-4 sm:p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${isLightMode ? 'bg-white/60 border-slate-300 hover:border-blue-500 hover:bg-white/90' : 'bg-[#030b1c]/60 border-cyan-900/50 hover:border-cyan-400 hover:bg-cyan-950/40'} ${item.link ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ${isLightMode ? 'bg-blue-600' : 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]'}`} />
                  
                  <div className={`p-3 rounded-xl mr-4 sm:mr-5 shrink-0 transition-colors ${isLightMode ? 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600' : 'bg-slate-900/50 text-slate-400 group-hover:bg-cyan-950 group-hover:text-cyan-400'}`}>
                    <item.icon size={18} />
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${textSecondary}`}>{item.label}</p>
                    <p className={`font-mono text-xs sm:text-sm tracking-wide truncate transition-colors ${isLightMode ? 'text-slate-800 group-hover:text-blue-700' : 'text-slate-200 group-hover:text-cyan-300'}`}>{item.value}</p>
                  </div>

                  {item.link && (
                    <ArrowUpRight size={16} className={`opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0 ${isLightMode ? 'text-blue-600' : 'text-cyan-400'}`} />
                  )}
                </ContentWrapper>
              );
            })}

            {/* Response Time Guarantee Card */}
            <div className={`p-5 rounded-2xl border ${isLightMode ? 'bg-purple-50/60 border-purple-200' : 'bg-purple-950/20 border-purple-800/30'} flex items-start space-x-3 mt-4`}>
              <SparklesIcon size={18} className="text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? 'text-purple-900' : 'text-purple-300'}`}>
                  Real-Time Notification Pipeline
                </h4>
                <p className={`text-[11px] mt-1 ${isLightMode ? 'text-purple-700' : 'text-purple-200/70'} leading-relaxed`}>
                  All comm-link payloads trigger direct real-time SMTP dispatch to Nima with instant cryptographic delivery confirmation to your email.
                </p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: THE HIGH-SPEED DIRECT MESSAGE TRANSMISSION FORM */}
          <motion.form 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            onSubmit={handleFormSubmit}
            className={`relative p-6 sm:p-8 rounded-3xl backdrop-blur-3xl border flex flex-col justify-between ${glassPanel}`}
          >
            {/* Terminal Top Bar */}
            <div className={`absolute top-0 left-0 right-0 h-10 border-b flex items-center justify-between px-4 ${isLightMode ? 'border-slate-300 bg-white/40' : 'border-cyan-500/20 bg-cyan-950/20'} rounded-t-3xl`}>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className={`ml-3 font-mono text-[10px] tracking-widest uppercase ${textSecondary}`}>comm_link_relay.exe</span>
              </div>
              <span className="text-[9px] font-mono text-cyan-400 hidden sm:inline">HIGH-SPEED PROTOCOL (gRPC · REST)</span>
            </div>

            <div className="space-y-5 pt-8">

              {/* AUTHENTICATED USER SENDER IDENTITY CARD */}
              {isAuthenticated && currentUser ? (
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold border border-cyan-500/40 shrink-0">
                      {currentUser.profilePic ? (
                        <img src={currentUser.profilePic} alt="avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {currentUser.fullName || currentUser.username}
                        </span>
                        <span className="px-2 py-0.5 text-[8px] font-black rounded-full bg-emerald-500 text-black uppercase">
                          Verified Sender
                        </span>
                      </div>
                      <p className="text-[11px] text-cyan-300 font-mono mt-0.5">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="text-[9px] text-slate-400 font-mono block">AUTOMATIC NODE BINDING</span>
                    <span className="text-[9px] text-emerald-400 font-bold uppercase">No Manual Input Needed</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* GUEST: NAME INPUT */}
                  <motion.div variants={itemVariants} className="relative group">
                    <label htmlFor="name" className={`absolute -top-2.5 left-4 px-1 text-[10px] font-black uppercase tracking-widest z-10 ${isLightMode ? 'bg-white text-slate-600' : 'bg-[#050f24] text-cyan-400 group-focus-within:text-[#a855f7]'}`}>
                      Operator Identity / Name
                    </label>
                    <div className="relative flex items-center">
                      <User size={18} className={`absolute left-4 transition-colors ${textSecondary} group-focus-within:${techPurple}`} />
                      <input 
                        id="name" 
                        type="text" 
                        name="name" 
                        required 
                        placeholder="Your full name or callsign" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:outline-none focus:ring-2 transition-all text-xs font-mono ${inputStyle}`} 
                      />
                    </div>
                  </motion.div>

                  {/* GUEST: RETURN EMAIL INPUT */}
                  <motion.div variants={itemVariants} className="relative group">
                    <label htmlFor="email" className={`absolute -top-2.5 left-4 px-1 text-[10px] font-black uppercase tracking-widest z-10 ${isLightMode ? 'bg-white text-slate-600' : 'bg-[#050f24] text-cyan-400 group-focus-within:text-[#a855f7]'}`}>
                      Return Frequency / Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail size={18} className={`absolute left-4 transition-colors ${textSecondary} group-focus-within:${techPurple}`} />
                      <input 
                        id="email" 
                        type="email" 
                        name="email" 
                        required 
                        placeholder="your.email@domain.com" 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:outline-none focus:ring-2 transition-all text-xs font-mono ${inputStyle}`} 
                      />
                    </div>
                  </motion.div>
                </>
              )}

              {/* INQUIRY TOPIC / SUBJECT */}
              <motion.div variants={itemVariants} className="relative group">
                <label htmlFor="subject" className={`absolute -top-2.5 left-4 px-1 text-[10px] font-black uppercase tracking-widest z-10 ${isLightMode ? 'bg-white text-slate-600' : 'bg-[#050f24] text-cyan-400 group-focus-within:text-[#a855f7]'}`}>
                  Transmission Subject
                </label>
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className={`w-full px-4 py-3.5 rounded-xl border focus:outline-none focus:ring-2 transition-all text-xs font-mono font-bold uppercase cursor-pointer ${inputStyle}`}
                >
                  <option value="General Inquiry">General Inquiry / Collaboration</option>
                  <option value="Research & Engineering Consultation">Research & Engineering Consultation</option>
                  <option value="Architecture & Code Review">Architecture & Code Review</option>
                  <option value="Security Vulnerability Disclosure">Security Vulnerability Disclosure</option>
                  <option value="Custom Software Directive">Custom Software Directive</option>
                </select>
              </motion.div>

              {/* MESSAGE PAYLOAD */}
              <motion.div variants={itemVariants} className="relative group">
                <label htmlFor="message" className={`absolute -top-2.5 left-4 px-1 text-[10px] font-black uppercase tracking-widest z-10 ${isLightMode ? 'bg-white text-slate-600' : 'bg-[#050f24] text-cyan-400 group-focus-within:text-[#a855f7]'}`}>
                  Payload Message Data
                </label>
                <div className="relative">
                  <TermIcon size={18} className={`absolute left-4 top-4 transition-colors ${textSecondary} group-focus-within:${techPurple}`} />
                  <textarea 
                    id="message" 
                    name="message" 
                    required 
                    rows={5} 
                    placeholder="Type your message, inquiry, or specifications here..." 
                    value={formData.message} 
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none text-xs leading-relaxed font-sans ${inputStyle}`} 
                  />
                </div>
              </motion.div>

              {/* ERROR ALERT */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center space-x-2">
                  <AlertTriangle size={15} className="text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <motion.div variants={itemVariants} className="mt-6 flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting} 
                aria-label="Execute Transmission"
                className={`relative group overflow-hidden flex items-center w-full justify-center md:w-auto px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg cursor-pointer ${
                  isSubmitting 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                    : (isLightMode 
                        ? 'bg-[#9333ea] hover:bg-[#a855f7] text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:-translate-y-0.5' 
                        : 'bg-[#a855f7] hover:bg-[#9333ea] text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:-translate-y-0.5'
                      )
                }`}
              >
                <span className={`absolute inset-0 w-full h-full -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] ${isLightMode ? 'bg-gradient-to-r from-transparent via-white/40 to-transparent' : 'bg-gradient-to-r from-transparent via-white/50 to-transparent'}`} />
                <span className="relative z-10 flex items-center space-x-2">
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin mr-2" />
                      <span>Encrypting & Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <span>Transmit Message</span>
                      <Send size={15} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </motion.div>
          </motion.form>

        </div>
      </div>
      
      <div className="relative z-20 mt-10">
        <Footer isLight={isLightMode} currentRole={(currentUser?.role || 'guest') as any} />
      </div>

      <BottomNav currentRole={(currentUser?.role || 'guest') as any} />
    </main>
  );
}
