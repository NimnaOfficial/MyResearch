"use client";
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { 
  User, Shield, Laptop, Smartphone, Palette, 
  LogOut, AlertTriangle, CheckCircle2, Lock, Camera, Send, ChevronRight,
  Mail, Phone, KeyRound, Type
} from 'lucide-react';

import CustomCursor from '@/components/CustomCursor';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';

// ==========================================
// 3D HIGH-TECH INTERACTIVE TOPOGRAPHY
// ==========================================
function ActiveTopography({ isLight }: { isLight: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Add a very slow idle rotation to keep the landscape feeling alive 
      // even when the user isn't dragging it.
      meshRef.current.rotation.z += 0.001;
    }
  });

  return (
    <group position={[0, -4, -5]} rotation={[-Math.PI / 2.5, 0, 0]}>
      <ambientLight intensity={isLight ? 1 : 0.5} />
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          {/* High vertex count plane for smooth, complex mathematical distortions */}
          <planeGeometry args={[70, 70, 150, 150]} />
          <MeshDistortMaterial 
            color={isLight ? "#0066ff" : "#001133"} 
            emissive={isLight ? "#00aaff" : "#00f0ff"}
            emissiveIntensity={isLight ? 0.4 : 1.5} 
            wireframe={true} 
            distort={0.4} 
            speed={2} 
            transparent
            opacity={isLight ? 0.5 : 0.6}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </Float>
    </group>
  );
}

// ==========================================
// ADVANCED ANIMATION VARIANTS (Bug-Free TS)
// ==========================================
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  },
  exit: {
    opacity: 0,
    transition: { staggerChildren: 0.05, staggerDirection: -1 }
  }
};

const springItem = {
  hidden: { opacity: 0, y: 30, scale: 0.95, filter: 'blur(10px)' },
  visible: { 
    opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
    transition: { type: "spring" as const, stiffness: 120, damping: 15 } 
  },
  exit: { opacity: 0, y: -20, scale: 0.95, filter: 'blur(10px)', transition: { duration: 0.2 } }
};

const smoothTransition = { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

// ==========================================
// SETTINGS DATA ARCHITECTURE
// ==========================================
const SETTINGS_TABS = [
  { id: 'account', label: 'Account Data', icon: User, desc: 'Profile & Registration' },
  { id: 'hardware', label: 'Linked Nodes', icon: Laptop, desc: 'Hardware & Devices' },
  { id: 'interface', label: 'Visual Interface', icon: Palette, desc: 'Theme & Rendering' },
  { id: 'security', label: 'Security', icon: Shield, desc: 'Admin & Encryption' },
];

export default function AdvancedSettingsMatrix() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  
  // Standardized Registration Form State
  const [formData, setFormData] = useState({
    fullName: "Nimna",
    username: "Nima",
    email: "operator@nima.dev",
    phone: "+94 77 XXX XXXX",
    password: "••••••••••••",
    confirmPassword: "••••••••••••"
  });

  const updateForm = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleAdminRequest = () => {
    setRequestStatus('sending');
    setTimeout(() => setRequestStatus('sent'), 2500);
  };

  const bgCore = isLightMode ? "bg-[#f4f7fb]" : "bg-[#01030b]";
  const panelGlass = isLightMode ? "bg-white/80 border-slate-200 shadow-2xl" : "bg-[#020512]/70 border-[#0055ff]/30 shadow-[0_0_60px_rgba(0,100,255,0.15)]";
  const innerCard = isLightMode ? "bg-slate-50 border-slate-200 focus-within:border-blue-500" : "bg-[#01020a]/90 border-[#0044ff]/40 focus-within:border-[#00f0ff] focus-within:shadow-[0_0_30px_rgba(0,240,255,0.2)]";
  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-500" : "text-[#4d88ff]";

  return (
    <main className={`relative min-h-screen font-sans cursor-none overflow-x-hidden selection:bg-[#00f0ff]/30 flex flex-col transition-colors duration-1000 ${bgCore}`}>
      <CustomCursor />
      
      {/* CINEMATIC TEXT ANIMATION */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes textAnimation {
          0% { background-position: 0 0; }
          100% { background-position: 2000px 0; }
        }
        .video-text-animation {
          color: rgba(225, 225, 255, 0.05);
          background-image: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');
          background-repeat: repeat-x;
          background-clip: text;
          -webkit-background-clip: text;
          background-size: cover;
          animation: textAnimation 25s linear infinite;
        }
      `}} />

      {/* THEME TOGGLE (Protective Layer) */}
      <div className="relative z-[100] pointer-events-auto">
        <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />
      </div>

      {/* 3D INTERACTIVE BACKGROUND */}
      {/* BUG FIX: Removed pointer-events-none so the user can interact with the 3D Canvas */}
      <div className="fixed inset-0 z-0 overflow-hidden cursor-move">
        <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
          {/* Enables Dragging, Rotating, and Panning of the Background! */}
          <OrbitControls enableZoom={false} enablePan={true} autoRotate={true} autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 4} />
          <ActiveTopography isLight={isLightMode} />
        </Canvas>
        <div className={`absolute inset-0 pointer-events-none ${isLightMode ? 'bg-[radial-gradient(circle_at_top,_transparent_30%,_#f4f7fb_100%)]' : 'bg-[radial-gradient(circle_at_top,_transparent_30%,_#01030b_100%)]'} backdrop-blur-[1px]`} />
      </div>

      {/* MAIN CONTENT AREA - CLICK THROUGH MATRIX */}
      {/* BUG FIX: Added pointer-events-none to the wrapper, so clicks pass through to the Canvas... */}
      <div className="relative z-10 w-full pt-32 pb-40 px-6 lg:px-12 flex-grow flex flex-col items-center pointer-events-none">
        
        {/* ...but we re-enable pointer-events-auto for actual UI elements! */}
        <motion.div initial={{ opacity: 0, y: -30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 80 }} className="w-full max-w-7xl mb-12 flex flex-col md:flex-row md:items-end justify-between pointer-events-auto">
          <div>
            <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter mb-2 ${isLightMode ? 'text-slate-900' : 'video-text-animation drop-shadow-[0_0_20px_rgba(0,240,255,0.3)]'}`}>
              Settings <span className={isLightMode ? 'text-blue-600' : ''}>Matrix</span>
            </h1>
            <p className={`font-mono text-xs md:text-sm tracking-widest uppercase ${textSecondary}`}>
              Manage Account Registration & Preferences
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-3 px-5 py-2.5 rounded-full border font-mono text-[10px] uppercase tracking-widest backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.2)] bg-[#01030b]/60 border-[#00f0ff]/40 text-[#00f0ff]">
            <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            <span>Interactive Node Active</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-7xl items-start pointer-events-none">
          
          {/* LEFT: NAVIGATION DOCK */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 90, damping: 20 }}
            className={`lg:col-span-4 xl:col-span-3 rounded-[2.5rem] backdrop-blur-2xl p-6 border pointer-events-auto ${panelGlass}`}
          >
            <div className="flex flex-col space-y-3">
              {SETTINGS_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id} onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }}
                    className={`relative p-4 rounded-2xl flex items-center text-left transition-all duration-300 overflow-hidden group ${
                      isActive ? (isLightMode ? 'text-white' : 'text-black') : (isLightMode ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-[#0044ff]/10 hover:text-white')
                    }`}
                  >
                    {isActive && (
                      <motion.div layoutId="activeTabGlow" transition={{ type: "spring", stiffness: 100, damping: 15 }} className="absolute inset-0 bg-gradient-to-r from-[#0066ff] to-[#00f0ff] rounded-2xl z-0 shadow-[0_0_25px_rgba(0,240,255,0.4)]" />
                    )}
                    <div className="relative z-10 flex items-center w-full">
                      <div className={`p-3 rounded-xl mr-4 transition-colors ${isActive ? (isLightMode ? 'bg-white/20' : 'bg-black/20') : 'bg-transparent group-hover:bg-[#0066ff]/20'}`}>
                        <tab.icon size={22} className={isActive ? (isLightMode ? 'text-white' : 'text-black') : 'text-[#0088ff] group-hover:text-[#00f0ff]'} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-wide">{tab.label}</span>
                        <span className={`text-[10px] font-mono mt-0.5 ${isActive ? (isLightMode ? 'text-blue-100' : 'text-[#01030b]') : textSecondary}`}>{tab.desc}</span>
                      </div>
                      <ChevronRight size={18} className={`ml-auto transition-transform ${isActive ? 'translate-x-0' : '-translate-x-3 opacity-0 group-hover:opacity-100'}`} />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className={`mt-10 pt-8 border-t ${isLightMode ? 'border-slate-200' : 'border-[#0055ff]/30'}`}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center justify-center w-full p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/30">
                <LogOut size={18} className="mr-3" /> Sign Out
              </motion.button>
            </div>
          </motion.div>

          {/* RIGHT: DYNAMIC CONTENT PANELS */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 90, damping: 20 }}
            className={`lg:col-span-8 xl:col-span-9 rounded-[3rem] backdrop-blur-2xl p-8 lg:p-12 border min-h-[700px] flex flex-col pointer-events-auto ${panelGlass}`}
          >
            <AnimatePresence mode="wait">
              
              {/* 1. ACCOUNT DATA */}
              {activeTab === 'account' && (
                <motion.div key="account" variants={staggerContainer} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full">
                  
                  <motion.div variants={springItem} className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 mb-12">
                    <motion.div whileHover={{ scale: 1.05, rotate: 5 }} whileTap={{ scale: 0.95 }} className="relative group cursor-pointer shrink-0">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#0044ff] to-[#00f0ff] p-[3px] shadow-[0_0_40px_rgba(0,102,255,0.4)]">
                        <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden relative ${isLightMode ? 'bg-white' : 'bg-[#01030a]'}`}>
                          <User size={50} className={textSecondary} />
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Camera size={24} className="text-[#00f0ff] mb-2" />
                            <span className="text-[10px] font-bold text-white tracking-widest">Update</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    <div className="text-center md:text-left">
                      <h2 className={`text-4xl font-black uppercase tracking-tighter ${textPrimary}`}>{formData.fullName}</h2>
                      <p className={`text-sm font-mono mt-2 ${textSecondary}`}>@{formData.username}</p>
                    </div>
                  </motion.div>

                  <motion.h3 variants={springItem} className={`text-xl font-black tracking-wide mb-8 ${textPrimary}`}>Personal Information</motion.h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                    <div className="space-y-6">
                      <motion.div variants={springItem} whileHover={{ scale: 1.02 }} className="space-y-2 group">
                        <label htmlFor="fullName" className={`text-xs font-bold uppercase tracking-widest ml-2 ${textSecondary}`}>Full Name</label>
                        <div className="relative">
                          <input id="fullName" type="text" placeholder="Enter Full Name" value={formData.fullName} onChange={(e) => updateForm('fullName', e.target.value)} className={`w-full p-4 pl-12 rounded-2xl border outline-none font-medium transition-all ${innerCard} ${textPrimary}`} />
                          <Type size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#00f0ff] ${isLightMode ? 'text-blue-500' : 'text-[#0066ff]'}`} />
                        </div>
                      </motion.div>

                      <motion.div variants={springItem} whileHover={{ scale: 1.02 }} className="space-y-2 group">
                        <label htmlFor="email" className={`text-xs font-bold uppercase tracking-widest ml-2 ${textSecondary}`}>Email Address</label>
                        <div className="relative">
                          <input id="email" type="email" placeholder="Enter Email" value={formData.email} onChange={(e) => updateForm('email', e.target.value)} className={`w-full p-4 pl-12 rounded-2xl border outline-none font-medium transition-all ${innerCard} ${textPrimary}`} />
                          <Mail size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#00f0ff] ${isLightMode ? 'text-blue-500' : 'text-[#0066ff]'}`} />
                        </div>
                      </motion.div>

                      <motion.div variants={springItem} whileHover={{ scale: 1.02 }} className="space-y-2 group">
                        <label htmlFor="password" className={`text-xs font-bold uppercase tracking-widest ml-2 ${textSecondary}`}>Password</label>
                        <div className="relative">
                          <input id="password" type="password" placeholder="Enter Password" value={formData.password} onChange={(e) => updateForm('password', e.target.value)} className={`w-full p-4 pl-12 rounded-2xl border outline-none font-medium transition-all ${innerCard} ${textPrimary}`} />
                          <KeyRound size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#00f0ff] ${isLightMode ? 'text-blue-500' : 'text-[#0066ff]'}`} />
                        </div>
                      </motion.div>
                    </div>

                    <div className="space-y-6">
                      <motion.div variants={springItem} whileHover={{ scale: 1.02 }} className="space-y-2 group">
                        <label htmlFor="username" className={`text-xs font-bold uppercase tracking-widest ml-2 ${textSecondary}`}>Username</label>
                        <div className="relative">
                          <input id="username" type="text" placeholder="Enter Username" value={formData.username} onChange={(e) => updateForm('username', e.target.value)} className={`w-full p-4 pl-12 rounded-2xl border outline-none font-medium transition-all ${innerCard} ${textPrimary}`} />
                          <User size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#00f0ff] ${isLightMode ? 'text-blue-500' : 'text-[#0066ff]'}`} />
                        </div>
                      </motion.div>

                      <motion.div variants={springItem} whileHover={{ scale: 1.02 }} className="space-y-2 group">
                        <label htmlFor="phone" className={`text-xs font-bold uppercase tracking-widest ml-2 ${textSecondary}`}>Phone Number</label>
                        <div className="relative">
                          <input id="phone" type="text" placeholder="Enter Phone Number" value={formData.phone} onChange={(e) => updateForm('phone', e.target.value)} className={`w-full p-4 pl-12 rounded-2xl border outline-none font-medium transition-all ${innerCard} ${textPrimary}`} />
                          <Phone size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#00f0ff] ${isLightMode ? 'text-blue-500' : 'text-[#0066ff]'}`} />
                        </div>
                      </motion.div>

                      <motion.div variants={springItem} whileHover={{ scale: 1.02 }} className="space-y-2 group">
                        <label htmlFor="confirmPassword" className={`text-xs font-bold uppercase tracking-widest ml-2 ${textSecondary}`}>Confirm Password</label>
                        <div className="relative">
                          <input id="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)} className={`w-full p-4 pl-12 rounded-2xl border outline-none font-medium transition-all ${innerCard} ${textPrimary}`} />
                          <KeyRound size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#00f0ff] ${isLightMode ? 'text-blue-500' : 'text-[#0066ff]'}`} />
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  <motion.button variants={springItem} whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0, 240, 255, 0.6)" }} whileTap={{ scale: 0.95 }} className="mt-10 ml-auto px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs text-black bg-gradient-to-r from-[#0066ff] to-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all">
                    Save Account Changes
                  </motion.button>
                </motion.div>
              )}

              {/* 2. HARDWARE NODES */}
              {activeTab === 'hardware' && (
                <motion.div key="hardware" variants={staggerContainer} initial="hidden" animate="visible" exit="exit">
                  <motion.h2 variants={springItem} className={`text-3xl font-black uppercase tracking-wide mb-10 ${textPrimary}`}>Linked Hardware</motion.h2>
                  
                  <div className="space-y-6">
                    <motion.div variants={springItem} whileHover={{ scale: 1.02, y: -5 }} className={`p-8 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between transition-all ${innerCard}`}>
                      <div className="flex items-center space-x-6 mb-4 md:mb-0">
                        <div className={`p-5 rounded-2xl shadow-inner ${isLightMode ? 'bg-blue-100 text-blue-600' : 'bg-[#00f0ff]/10 text-[#00f0ff] shadow-[inset_0_0_20px_rgba(0,240,255,0.2)]'}`}>
                          <Laptop size={36} />
                        </div>
                        <div>
                          <h4 className={`font-black text-2xl tracking-wide ${textPrimary}`}>Lenovo LOQ ARP15</h4>
                          <p className={`text-sm mt-1 ${textSecondary}`}>Primary Development Node</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/30 px-6 py-3 rounded-xl text-green-500 w-fit">
                        <CheckCircle2 size={18} />
                        <span className="text-sm font-bold uppercase tracking-widest">Active Sync</span>
                      </div>
                    </motion.div>

                    <motion.div variants={springItem} whileHover={{ scale: 1.02, y: -5 }} className={`p-8 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between transition-all ${innerCard}`}>
                      <div className="flex items-center space-x-6 mb-4 md:mb-0">
                        <div className={`p-5 rounded-2xl shadow-inner ${isLightMode ? 'bg-slate-200 text-slate-600' : 'bg-[#010206] text-slate-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]'}`}>
                          <Smartphone size={36} />
                        </div>
                        <div>
                          <h4 className={`font-black text-2xl tracking-wide ${textPrimary}`}>Samsung Mobile Device</h4>
                          <p className={`text-sm mt-1 ${textSecondary}`}>Remote Sync Node</p>
                        </div>
                      </div>
                      <div className={`flex items-center space-x-2 border px-6 py-3 rounded-xl w-fit ${isLightMode ? 'bg-slate-100 border-slate-300 text-slate-500' : 'bg-[#010206] border-[#0044ff]/20 text-[#6699ff]'}`}>
                        <span className="text-sm font-bold uppercase tracking-widest">Offline Mode</span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* 3. INTERFACE */}
              {activeTab === 'interface' && (
                <motion.div key="interface" variants={staggerContainer} initial="hidden" animate="visible" exit="exit">
                  <motion.h2 variants={springItem} className={`text-3xl font-black uppercase tracking-wide mb-6 ${textPrimary}`}>Visual Interface</motion.h2>
                  <motion.p variants={springItem} className={`text-base leading-relaxed mb-12 max-w-2xl ${textSecondary}`}>
                    Global theme parameters dictate the spatial rendering environment, flexible 3D wave patterns, and lighting arrays across all application sectors.
                  </motion.p>

                  <motion.div variants={springItem} whileHover={{ scale: 1.02, y: -5 }} className={`p-10 rounded-[2.5rem] border flex items-center space-x-8 ${innerCard}`}>
                    <div className={`p-8 rounded-3xl ${isLightMode ? 'bg-blue-100 shadow-inner' : 'bg-[#00f0ff]/10 shadow-[inset_0_0_30px_rgba(0,240,255,0.2)]'}`}>
                      <Palette size={56} className={isLightMode ? 'text-blue-600' : 'text-[#00f0ff]'} />
                    </div>
                    <div>
                      <h4 className={`font-black text-3xl mb-4 tracking-wide ${textPrimary}`}>Current Environment</h4>
                      <p className={`text-sm font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl inline-block border shadow-md ${isLightMode ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-[#0044ff]/20 text-[#00f0ff] border-[#00f0ff]/40'}`}>
                        Status: {isLightMode ? 'Daylight UI Protocol' : 'Dark Mode Protocol'}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* 4. SECURITY & ADMIN */}
              {activeTab === 'security' && (
                <motion.div key="security" variants={staggerContainer} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full">
                  <motion.h2 variants={springItem} className={`text-3xl font-black uppercase tracking-wide mb-10 flex items-center ${textPrimary}`}>
                    Core Security <Shield className="ml-4 text-[#00f0ff]" size={36}/>
                  </motion.h2>
                  
                  <motion.div variants={springItem} className={`p-12 rounded-[2.5rem] border relative overflow-hidden mb-8 shadow-2xl ${isLightMode ? 'bg-red-50 border-red-200' : 'bg-red-500/5 border-red-500/30'}`}>
                    <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(45deg,transparent,transparent_15px,#ff0000_15px,#ff0000_30px)] pointer-events-none" />
                    
                    <h3 className="text-xl font-black uppercase tracking-widest text-red-500 flex items-center mb-6">
                      <Lock size={28} className="mr-4" /> Core Architecture Restricted
                    </h3>
                    <p className={`text-base leading-relaxed mb-10 max-w-2xl ${isLightMode ? 'text-red-700/80' : 'text-red-200/70'}`}>
                      System source code and root operational logic are cryptographically locked. Any modifications to the core application structure require Root Admin clearance from the central server.
                    </p>
                    
                    <motion.button 
                      whileHover={{ scale: requestStatus === 'idle' ? 1.05 : 1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAdminRequest}
                      disabled={requestStatus !== 'idle'}
                      className={`w-full md:w-auto px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg ${
                        requestStatus === 'idle' ? 'bg-red-500/10 text-red-500 border border-red-500/40 hover:bg-red-500 hover:text-white hover:shadow-[0_0_30px_rgba(255,0,0,0.5)]' :
                        requestStatus === 'sending' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 shadow-[0_0_30px_rgba(255,200,0,0.3)]' :
                        'bg-green-500/20 text-green-500 border border-green-500/50 shadow-[0_0_30px_rgba(0,255,100,0.3)]'
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {requestStatus === 'idle' && <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center"><AlertTriangle size={20} className="mr-3" /> Request Modification Access</motion.span>}
                        {requestStatus === 'sending' && <motion.span key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center animate-pulse"><Send size={20} className="mr-3" /> Transmitting Protocol...</motion.span>}
                        {requestStatus === 'sent' && <motion.span key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center"><CheckCircle2 size={20} className="mr-3" /> Clearance Request Logged</motion.span>}
                      </AnimatePresence>
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

        </div>
      </div>
      
      {/* FOOTER (Protective Layer) */}
      <div className="relative z-10 w-full mt-auto pointer-events-auto">
        <Footer isLight={isLightMode} currentRole="user" />
      </div>

      <BottomNav currentRole="user" />
    </main>
  );
}