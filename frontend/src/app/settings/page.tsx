"use client";
import { API_URL, handleSafeAdminLogout } from '@/lib/api';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { 
  User, Shield, Laptop, LogOut, AlertTriangle, CheckCircle2, Lock, Camera, Send, ChevronRight,
  Mail, KeyRound, Bookmark, ArchiveRestore, FileText, ScanFace, Loader2, Type, Hash, Phone,
  X, UploadCloud, ArrowLeft, RotateCw, RotateCcw, Sparkles, Sliders, Wand2, RefreshCw, ZoomIn, ZoomOut
} from 'lucide-react';

import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/utils/cropImage';

import CustomCursor from '@/components/CustomCursor';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import Footer from '@/components/Footer';

// ==========================================
// PRESET CYBERNETIC AVATARS
// ==========================================
const CYBER_PRESET_AVATARS = [
  { id: 'synth-ai', name: 'Neural Core', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop' },
  { id: 'cyber-op', name: 'Cyber Operator', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400&auto=format&fit=crop' },
  { id: 'sentinel', name: 'Sentinel Node', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=400&auto=format&fit=crop' },
  { id: 'matrix-flux', name: 'Quantum Flux', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=400&auto=format&fit=crop' }
];

// ==========================================
// 3D HIGH-TECH INTERACTIVE TOPOGRAPHY
// ==========================================
function ActiveTopography({ isLight }: { isLight: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => { if (meshRef.current) meshRef.current.rotation.z += 0.001; });
  return (
    <group position={[0, -4, -5]} rotation={[-Math.PI / 2.5, 0, 0]}>
      <ambientLight intensity={isLight ? 1 : 0.5} />
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <planeGeometry args={[70, 70, 50, 50]} />
          <MeshDistortMaterial 
            color={isLight ? "#0066ff" : "#001133"} emissive={isLight ? "#00aaff" : "#00f0ff"}
            emissiveIntensity={isLight ? 0.4 : 1.5} wireframe={true} distort={0.4} 
            speed={2} transparent opacity={isLight ? 0.5 : 0.6} roughness={0.2} metalness={0.8}
          />
        </mesh>
      </Float>
    </group>
  );
}

const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }, exit: { opacity: 0, transition: { staggerChildren: 0.05, staggerDirection: -1 } } };
const springItem = { hidden: { opacity: 0, y: 30, scale: 0.95, filter: 'blur(10px)' }, visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { type: "spring" as const, stiffness: 120, damping: 15 } }, exit: { opacity: 0, y: -20, scale: 0.95, filter: 'blur(10px)', transition: { duration: 0.2 } } };

const SETTINGS_TABS = [
  { id: 'account', label: 'Account Data', icon: User, desc: 'Profile & Registration' },
  { id: 'hardware', label: 'Linked Nodes', icon: Laptop, desc: 'Hardware & Devices' },
  { id: 'saved', label: 'Authored Vault', icon: Bookmark, desc: 'Your Saved Research' },
  { id: 'security', label: 'Security', icon: Shield, desc: 'Admin & Encryption' },
];

export default function AdvancedSettingsMatrix() {
  const router = useRouter();
  const { isLightMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('account');
  
  const [isCodeRevealed, setIsCodeRevealed] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  const [userData, setUserData] = useState<any>(null);
  const [userVault, setUserVault] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State mapping exactly to Registration UI
  const [formData, setFormData] = useState({
    fullName: "", age: "", phone: "", password: "", confirmPassword: ""
  });

  // Advanced Cropper & Visual Editor States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [filterStyle, setFilterStyle] = useState<'none' | 'cyber' | 'matrix' | 'mono' | 'vibrant'>('none');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const updateForm = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam && ['account', 'hardware', 'saved', 'security'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  useEffect(() => {
    const fetchMatrixData = async () => {
      const token = localStorage.getItem('matrix_token');
      if (!token) { router.push('/auth'); return; }

      try {
        const userRes = await fetch(`${API_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (userRes.ok) {
          const { data } = await userRes.json();
          setUserData(data);
          
          setFormData(prev => ({ 
            ...prev, 
            fullName: data.fullName || "",
            age: data.age || "",
            phone: data.phone || ""
          }));
          
          // Load both saved research cores and saved project releases
          const posts = (data.savedPosts || []).map((p: any) => ({ ...p, isRelease: false }));
          const releases = (data.savedReleases || []).map((r: any) => ({
            ...r,
            title: r.projectName,
            content: r.releaseNotes,
            type: `PROJECT ${r.version || ''}`.trim(),
            isRelease: true,
          }));
          setUserVault([...posts, ...releases]);
          
        } else {
          router.push('/auth');
        }
      } catch (err) { console.error(err); }
    };
    fetchMatrixData();
  }, [router]);

  const handleSaveAccount = async () => {
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("Encryption Mismatch: Passwords do not match.");
      return;
    }
    if (formData.password && formData.password.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    setIsSaving(true);
    const token = localStorage.getItem('matrix_token');

    try {
      const res = await fetch(`${API_URL}/api/auth/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: formData.fullName, age: formData.age, phone: formData.phone, password: formData.password
        })
      });

      if (res.ok) {
        const result = await res.json();
        // Merge instead of replace: the update response only carries a few fields (keeps avatar, vault, role)
        setUserData((prev: any) => ({ ...prev, ...result.data }));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      } else {
        const errBody = await res.json().catch(() => ({}));
        alert(errBody.message || "Transmission Failed. Data rejected by server.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await handleSafeAdminLogout(() => router.push('/auth'));
  };

  const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [adminRequestText, setAdminRequestText] = useState('');
  
  const handleAdminRequest = () => {
    if (!adminRequestText.trim()) return;
    setRequestStatus('sending');
    // Simulate sending network request
    setTimeout(() => {
      setRequestStatus('sent');
      setAdminRequestText('');
      setTimeout(() => setRequestStatus('idle'), 3000);
    }, 2500);
  };

  useEffect(() => {
    const handleBlur = () => { setIsWindowFocused(false); setIsCodeRevealed(false); };
    const handleFocus = () => { setIsWindowFocused(true); };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.metaKey || e.key === 'Meta' || (e.shiftKey && (e.metaKey || e.ctrlKey))) { setIsCodeRevealed(false); }
    };
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.clipboardData?.setData('text/plain', '[ACCESS DENIED - ENCRYPTED PAYLOAD]');
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
    };
  }, []);

  const bgCore = isLightMode ? "bg-[#f8fafc]" : "bg-[#01030b]";
  const panelGlass = isLightMode ? "bg-white/95 border-slate-200 shadow-2xl text-slate-800" : "bg-[#020512]/70 border-[#0055ff]/30 shadow-[0_0_60px_rgba(0,100,255,0.15)]";
  const innerCard = isLightMode ? "bg-slate-100 border-slate-300 text-slate-900 focus-within:border-blue-500" : "bg-[#01020a]/90 border-[#0044ff]/40 focus-within:border-[#00f0ff] focus-within:shadow-[0_0_30px_rgba(0,240,255,0.2)]";
  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-500" : "text-[#4d88ff]";

  const displayName = userData?.fullName ? userData.fullName.toUpperCase() : "NIMA OPERATOR";
  const secureCode = userData ? userData.username : "••••••••";

  return (
    <main className={`relative min-h-screen font-sans cursor-none overflow-x-hidden selection:bg-[#00f0ff]/30 flex flex-col transition-colors duration-1000 ${bgCore}`}>
      <CustomCursor />
      <style dangerouslySetInnerHTML={{__html: `.video-text-animation { background: linear-gradient(135deg, #00f0ff 0%, #818cf8 50%, #c084fc 100%); -webkit-background-clip: text; background-clip: text; color: transparent; } .secure-code-block { user-select: none !important; -webkit-user-select: none !important; -moz-user-select: none !important; pointer-events: none; } @media print { .secure-code-container { display: none !important; } }`}} />

      <div className="relative z-[100] pointer-events-auto">
        <ThemeToggle isLight={isLightMode} toggleTheme={toggleTheme} />
      </div>

      <div className="fixed inset-0 z-0 overflow-hidden cursor-move">
        <Canvas camera={{ position: [0, 2, 8], fov: 60 }} dpr={[1, 1.5]} gl={{ powerPreference: "high-performance", antialias: false, stencil: false }}>
          <OrbitControls enableZoom={false} enablePan={true} autoRotate={true} autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 4} />
          <ActiveTopography isLight={isLightMode} />
        </Canvas>
        <div className={`absolute inset-0 pointer-events-none ${isLightMode ? 'bg-[radial-gradient(circle_at_top,_transparent_30%,_#f4f7fb_100%)]' : 'bg-[radial-gradient(circle_at_top,_transparent_30%,_#01030b_100%)]'} backdrop-blur-[1px]`} />
      </div>

      <div className="relative z-10 w-full pt-32 pb-40 px-6 lg:px-12 flex-grow flex flex-col items-center pointer-events-none">
        
        <motion.div initial={{ opacity: 0, y: -30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 80 }} className="w-full max-w-7xl mb-12 flex flex-col items-start pointer-events-auto">
          
          {/* SECURE BACK BUTTON NAVIGATION - DYNAMIC HISTORY ROUTING */}
          <button 
            onClick={() => router.back()} 
            className={`group flex items-center space-x-3 px-5 py-2.5 mb-6 rounded-full border font-mono text-[10px] uppercase tracking-widest backdrop-blur-md transition-all cursor-pointer ${isLightMode ? 'bg-white/60 border-slate-300 text-slate-700 hover:bg-white hover:shadow-md' : 'bg-[#01030b]/60 border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]'}`}
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Return to Matrix</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between w-full">
            <div>
              <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter mb-2 ${isLightMode ? 'text-slate-900' : 'video-text-animation drop-shadow-[0_0_20px_rgba(0,240,255,0.3)]'}`}>
                Settings <span className={isLightMode ? 'text-blue-600' : ''}>Matrix</span>
              </h1>
              <p className={`font-mono text-xs md:text-sm tracking-widest uppercase ${textSecondary}`}>Manage Account Registration & Preferences</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-7xl items-start pointer-events-none">
          
          {/* SIDEBAR */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 90, damping: 20 }} className={`lg:col-span-4 xl:col-span-3 rounded-[2.5rem] backdrop-blur-2xl p-6 border pointer-events-auto ${panelGlass}`}>
            <div className="flex flex-col space-y-3">
              {SETTINGS_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id} onClick={() => setActiveTab(tab.id)} whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }}
                    className={`relative p-4 rounded-2xl flex items-center text-left transition-all duration-300 overflow-hidden group cursor-pointer ${isActive ? (isLightMode ? 'text-white' : 'text-black') : (isLightMode ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-[#0044ff]/10 hover:text-white')}`}
                  >
                    {isActive && <motion.div layoutId="activeTabGlow" transition={{ type: "spring", stiffness: 100, damping: 15 }} className="absolute inset-0 bg-gradient-to-r from-[#0066ff] to-[#00f0ff] rounded-2xl z-0 shadow-[0_0_25px_rgba(0,240,255,0.4)]" />}
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
              <motion.button onClick={handleLogout} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center justify-center w-full p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/30 cursor-pointer">
                <LogOut size={18} className="mr-3" /> Sign Out
              </motion.button>
            </div>
          </motion.div>

          {/* MAIN CONTENT */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 90, damping: 20 }} className={`lg:col-span-8 xl:col-span-9 rounded-[3rem] backdrop-blur-2xl p-8 lg:p-12 border min-h-[700px] flex flex-col pointer-events-auto ${panelGlass}`}>
            <AnimatePresence mode="wait">
              
              {/* 1. ACCOUNT DATA */}
              {activeTab === 'account' && (
                <motion.div key="account" variants={staggerContainer} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full">
                  <motion.div variants={springItem} className="flex flex-col md:flex-row items-center md:items-start justify-between w-full mb-12 gap-8">
                    
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                      {/* FILE INPUT TRIGGER & AVATAR BADGE */}
                      <div className="relative group shrink-0 flex flex-col items-center">
                        <input 
                          type="file" 
                          id="profilePicUpload" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedImage(URL.createObjectURL(file));
                              setCrop({ x: 0, y: 0 }); 
                              setZoom(1);
                              setRotation(0);
                              setFilterStyle('none');
                            }
                            e.target.value = ''; 
                          }}
                        />
                        <label htmlFor="profilePicUpload" className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#0044ff] via-[#00f0ff] to-[#00ff66] p-[3px] shadow-[0_0_40px_rgba(0,102,255,0.4)] flex cursor-pointer group-hover:scale-105 transition-transform duration-300">
                          <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden relative ${isLightMode ? 'bg-white' : 'bg-[#01030a]'}`}>
                            {userData?.profilePic ? (
                              <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <User size={50} className={textSecondary} />
                            )}
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Camera size={24} className="text-[#00f0ff] mb-2" />
                              <span className="text-[10px] font-bold text-white tracking-widest uppercase">Upload</span>
                            </div>
                          </div>
                        </label>
                      </div>

                      <div className="text-center md:text-left mt-2 flex flex-col items-center md:items-start">
                        <h2 className={`text-3xl md:text-5xl font-black uppercase tracking-tighter ${textPrimary}`}>{displayName}</h2>
                        
                        {/* ADVANCED AVATAR CONTROLS */}
                        <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                          {userData?.profilePic && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImage(userData.profilePic);
                                setCrop({ x: 0, y: 0 });
                                setZoom(1);
                                setRotation(0);
                                setFilterStyle('none');
                              }}
                              className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono uppercase tracking-wider font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                                isLightMode 
                                  ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100' 
                                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                              }`}
                            >
                              <Wand2 size={13} />
                              <span>Re-Edit Current</span>
                            </button>
                          )}

                          <label
                            htmlFor="profilePicUpload"
                            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono uppercase tracking-wider font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                              isLightMode 
                                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' 
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <Camera size={13} />
                            <span>{userData?.profilePic ? 'Upload New' : 'Choose Photo'}</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => setShowPresets(!showPresets)}
                            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono uppercase tracking-wider font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                              isLightMode 
                                ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' 
                                : 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                            }`}
                          >
                            <Sparkles size={13} />
                            <span>Presets</span>
                          </button>

                          {userData?.profilePic && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm("Remove current profile picture and revert to system default?")) return;
                                const token = localStorage.getItem('matrix_token');
                                try {
                                  const res = await fetch(`${API_URL}/api/auth/update`, {
                                    method: 'PUT',
                                    headers: {
                                      'Authorization': `Bearer ${token}`,
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ profilePic: null })
                                  });
                                  if (res.ok) {
                                    setUserData((prev: any) => ({ ...prev, profilePic: null }));
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl border border-red-500/20 text-[11px] font-mono uppercase tracking-wider text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center space-x-1"
                            >
                              <X size={12} />
                              <span>Reset</span>
                            </button>
                          )}
                        </div>

                        {/* CYBERNETIC PRESETS DRAWER */}
                        <AnimatePresence>
                          {showPresets && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 p-3 rounded-2xl border bg-black/40 border-[#00f0ff]/20 flex flex-wrap gap-3 items-center"
                            >
                              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00f0ff] w-full">Select Cybernetic Preset:</span>
                              {CYBER_PRESET_AVATARS.map((preset) => (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedImage(preset.url);
                                    setCrop({ x: 0, y: 0 });
                                    setZoom(1);
                                    setRotation(0);
                                    setFilterStyle('none');
                                    setShowPresets(false);
                                  }}
                                  className="group flex flex-col items-center space-y-1 p-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                  <div className="w-12 h-12 rounded-full border border-cyan-400/40 overflow-hidden group-hover:scale-110 group-hover:border-cyan-400 transition-all">
                                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-400 group-hover:text-cyan-400">{preset.name}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className={`secure-code-container p-5 md:p-6 rounded-3xl border flex flex-col items-center justify-center shrink-0 shadow-inner relative overflow-hidden transition-colors ${isLightMode ? 'bg-red-50 border-red-200' : 'bg-[#010206] border-red-500/30'}`}>
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,0,0,0.03)_10px,rgba(255,0,0,0.03)_20px)] pointer-events-none" />
                      <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 flex items-center z-10 ${isLightMode ? 'text-red-600' : 'text-red-500'}`}><Shield size={12} className="mr-2"/> Secure Access Code</span>
                      <div className="relative z-10 cursor-crosshair px-4 py-2 bg-black/20 rounded-xl border border-red-500/20" onPointerDown={() => setIsCodeRevealed(true)} onPointerUp={() => setIsCodeRevealed(false)} onPointerLeave={() => setIsCodeRevealed(false)} onContextMenu={(e) => e.preventDefault()}>
                        <div className={`secure-code-block font-mono text-2xl md:text-3xl font-black tracking-[0.2em] transition-all duration-100 ${isCodeRevealed && isWindowFocused ? 'filter-none opacity-100' : 'filter blur-[10px] opacity-40'} ${isLightMode ? 'text-slate-800' : 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]'}`}>
                          {secureCode}
                        </div>
                        <div className="absolute inset-0 z-20" />
                      </div>
                      <span className={`text-[8px] mt-3 uppercase tracking-widest font-bold z-10 flex items-center ${isCodeRevealed ? 'text-red-500' : (isLightMode ? 'text-slate-500' : 'text-slate-400')}`}>
                        {isCodeRevealed ? <AlertTriangle size={10} className="mr-1 animate-pulse" /> : <ScanFace size={10} className="mr-1" />}
                        {isCodeRevealed ? 'ACTIVE SCAN' : 'Click & Hold to Reveal'}
                      </span>
                    </div>

                  </motion.div>

                  <motion.h3 variants={springItem} className={`text-xl font-black tracking-wide mb-8 ${textPrimary}`}>Personal Information</motion.h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                    <div className="space-y-6">
                      <motion.div variants={springItem} whileHover={{ scale: 1.02 }} className="space-y-2 group">
                        <label className={`text-xs font-bold uppercase tracking-widest ml-2 ${textSecondary}`}>Display Name</label>
                        <div className="relative">
                          <input type="text" placeholder="Enter Full Name" value={formData.fullName} onChange={(e) => updateForm('fullName', e.target.value)} className={`w-full p-4 pl-12 rounded-2xl border outline-none font-medium transition-all ${innerCard} ${textPrimary}`} />
                          <Type size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#00f0ff] ${isLightMode ? 'text-blue-500' : 'text-[#0066ff]'}`} />
                        </div>
                      </motion.div>
                      <motion.div variants={springItem} whileHover={{ scale: 1.02 }} className="space-y-2 group">
                        <label className={`text-xs font-bold uppercase tracking-widest ml-2 ${textSecondary}`}>Phone Number</label>
                        <div className="relative">
                          <input type="text" placeholder="Enter Phone Number" value={formData.phone} onChange={(e) => updateForm('phone', e.target.value)} className={`w-full p-4 pl-12 rounded-2xl border outline-none font-medium transition-all ${innerCard} ${textPrimary}`} />
                          <Phone size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#00f0ff] ${isLightMode ? 'text-blue-500' : 'text-[#0066ff]'}`} />
                        </div>
                      </motion.div>
                      <motion.div variants={springItem} whileHover={{ scale: 1.02 }} className="space-y-2 group">
                        <label className={`text-xs font-bold uppercase tracking-widest ml-2 ${textSecondary}`}>New Password</label>
                        <div className="relative">
                          <input type="password" placeholder="Leave blank to keep current" value={formData.password} onChange={(e) => updateForm('password', e.target.value)} className={`w-full p-4 pl-12 rounded-2xl border outline-none font-medium transition-all ${innerCard} ${textPrimary}`} />
                          <KeyRound size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#00f0ff] ${isLightMode ? 'text-blue-500' : 'text-[#0066ff]'}`} />
                        </div>
                      </motion.div>
                    </div>

                    <div className="space-y-6">
                      <motion.div variants={springItem} className="space-y-2 group">
                        <label className={`text-xs font-bold uppercase tracking-widest ml-2 ${textSecondary}`}>Registered Email</label>
                        <div className="relative">
                          <input type="email" readOnly title="Registered Email" placeholder="Registered Email" value={userData ? userData.email : ""} className={`w-full p-4 pl-12 rounded-2xl border outline-none font-medium transition-all cursor-not-allowed ${isLightMode ? 'bg-slate-200 border-slate-300 text-slate-500' : 'bg-[#001133]/40 border-[#00f0ff]/10 text-slate-400'}`} />
                          <Lock size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLightMode ? 'text-slate-400' : 'text-[#00f0ff]/50'}`} />
                        </div>
                      </motion.div>
                      <motion.div variants={springItem} whileHover={{ scale: 1.02 }} className="space-y-2 group">
                        <label className={`text-xs font-bold uppercase tracking-widest ml-2 ${textSecondary}`}>Age</label>
                        <div className="relative">
                          <input type="text" placeholder="Enter Age" value={formData.age} onChange={(e) => updateForm('age', e.target.value)} className={`w-full p-4 pl-12 rounded-2xl border outline-none font-medium transition-all ${innerCard} ${textPrimary}`} />
                          <Hash size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#00f0ff] ${isLightMode ? 'text-blue-500' : 'text-[#0066ff]'}`} />
                        </div>
                      </motion.div>
                      <motion.div variants={springItem} whileHover={{ scale: 1.02 }} className="space-y-2 group">
                        <label className={`text-xs font-bold uppercase tracking-widest ml-2 ${textSecondary}`}>Confirm Password</label>
                        <div className="relative">
                          <input type="password" placeholder="Confirm new password" value={formData.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)} className={`w-full p-4 pl-12 rounded-2xl border outline-none font-medium transition-all ${innerCard} ${textPrimary}`} />
                          <KeyRound size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#00f0ff] ${isLightMode ? 'text-blue-500' : 'text-[#0066ff]'}`} />
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  <motion.button 
                    variants={springItem} onClick={handleSaveAccount} disabled={isSaving}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0, 240, 255, 0.6)" }} whileTap={{ scale: 0.95 }} 
                    className={`mt-10 ml-auto px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center transition-all cursor-pointer ${saveSuccess ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(0,255,100,0.4)]' : 'text-black bg-gradient-to-r from-[#0066ff] to-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.4)]'}`}
                  >
                    {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : saveSuccess ? <CheckCircle2 className="mr-2" size={16} /> : null}
                    {isSaving ? 'Encrypting Payload...' : saveSuccess ? 'Data Synchronized' : 'Save Account Changes'}
                  </motion.button>
                </motion.div>
              )}

              {/* 2. LINKED HARDWARE */}
              {activeTab === 'hardware' && (
                <motion.div key="hardware" variants={staggerContainer} initial="hidden" animate="visible" exit="exit">
                   <motion.h2 variants={springItem} className={`text-3xl font-black uppercase tracking-wide mb-10 ${textPrimary}`}>Linked Hardware</motion.h2>
                   <div className="space-y-6">
                     <motion.div variants={springItem} whileHover={{ scale: 1.02, y: -5 }} className={`p-8 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between transition-all ${innerCard}`}>
                       <div className="flex items-center space-x-6 mb-4 md:mb-0">
                         <div className={`p-5 rounded-2xl shadow-inner ${isLightMode ? 'bg-blue-100 text-blue-600' : 'bg-[#00f0ff]/10 text-[#00f0ff] shadow-[inset_0_0_20px_rgba(0,240,255,0.2)]'}`}><Laptop size={36} /></div>
                         <div>
                           <h4 className={`font-black text-2xl tracking-wide ${textPrimary}`}>Current Active Node</h4>
                           <p className={`text-sm mt-1 ${textSecondary}`}>Web Gateway</p>
                         </div>
                       </div>
                       <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/30 px-6 py-3 rounded-xl text-green-500 w-fit">
                         <CheckCircle2 size={18} /> <span className="text-sm font-bold uppercase tracking-widest">Active Sync</span>
                       </div>
                     </motion.div>
                   </div>
                </motion.div>
              )}

              {/* 3. AUTHORED VAULT (SAVED PROJECTS) */}
              {activeTab === 'saved' && (
                <motion.div key="saved" variants={staggerContainer} initial="hidden" animate="visible" exit="exit">
                  <motion.h2 variants={springItem} className={`text-3xl font-black uppercase tracking-wide mb-10 ${textPrimary}`}>Authored Vault</motion.h2>
                  
                  {userVault.length === 0 ? (
                     <motion.div variants={springItem} className={`p-12 text-center rounded-3xl border flex flex-col items-center justify-center ${innerCard}`}>
                       <ArchiveRestore size={48} className={`mb-4 opacity-50 ${textSecondary}`} />
                       <p className={`font-mono text-sm tracking-widest uppercase ${textSecondary}`}>Vault is currently empty. No contributions detected.</p>
                     </motion.div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {userVault.map((item, i) => (
                         <motion.div 
                           key={i} variants={springItem} whileHover={{ scale: 1.02 }} 
                           onClick={() => router.push(item.isRelease ? `/projects/${item.id}` : `/research/${item.id}`)}
                           className={`p-6 rounded-3xl border flex flex-col transition-all cursor-pointer ${innerCard}`}
                         >
                           <div className="flex justify-between items-start mb-4">
                             <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${isLightMode ? 'bg-blue-100 text-blue-600' : 'bg-[#00f0ff]/10 text-[#00f0ff]'}`}>
                               {item.type || 'DOCUMENT'}
                             </div>
                             <span className={`text-[10px] font-mono uppercase font-bold tracking-widest ${item.published ? 'text-green-500' : 'text-yellow-500'}`}>
                               {item.published ? 'VERIFIED' : 'DRAFT'}
                             </span>
                           </div>
                           <h3 className={`text-xl font-bold mb-2 truncate ${textPrimary}`}>{item.title}</h3>
                           <p className={`text-xs font-mono mb-6 line-clamp-2 leading-relaxed ${textSecondary}`}>{item.content || 'Encrypted payload...'}</p>
                           <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                             <span className={`text-[10px] font-mono ${textSecondary}`}>
                               {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                             </span>
                             <ChevronRight size={14} className={textSecondary} />
                           </div>
                         </motion.div>
                       ))}
                     </div>
                  )}
                </motion.div>
              )}

              {/* 4. SECURITY & ADMIN REQUEST */}
              {activeTab === 'security' && (
                <motion.div key="security" variants={staggerContainer} initial="hidden" animate="visible" exit="exit" className="flex flex-col h-full">
                  <motion.h2 variants={springItem} className={`text-3xl font-black uppercase tracking-wide mb-10 ${textPrimary}`}>Security & Access</motion.h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 flex-grow">
                    
                    {/* Standard Security Toggles (Visual Immersion) */}
                    <motion.div variants={springItem} className={`p-8 rounded-3xl border flex flex-col ${innerCard}`}>
                      <div className={`flex items-center mb-6 ${isLightMode ? 'text-blue-600' : 'text-[#00f0ff]'}`}>
                        <Shield size={24} className="mr-3" />
                        <h3 className={`text-lg font-bold uppercase tracking-widest ${textPrimary}`}>Encryption Settings</h3>
                      </div>
                      <div className="space-y-6 mt-4">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>AES-256 Storage Sync</span>
                          <div className={`w-10 h-5 rounded-full relative ${isLightMode ? 'bg-blue-500' : 'bg-[#00f0ff]'}`}>
                            <div className={`absolute right-1 top-1 w-3 h-3 rounded-full ${isLightMode ? 'bg-white' : 'bg-black'}`} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Biometric Handshake</span>
                          <div className={`w-10 h-5 rounded-full relative ${isLightMode ? 'bg-slate-300' : 'bg-slate-700'}`}>
                            <div className={`absolute left-1 top-1 w-3 h-3 rounded-full ${isLightMode ? 'bg-white' : 'bg-slate-400'}`} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Strict IP Tracking</span>
                          <div className={`w-10 h-5 rounded-full relative ${isLightMode ? 'bg-blue-500' : 'bg-[#00f0ff]'}`}>
                            <div className={`absolute right-1 top-1 w-3 h-3 rounded-full ${isLightMode ? 'bg-white' : 'bg-black'}`} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-auto pt-6 border-t border-white/5">
                        <p className={`text-[10px] font-mono leading-relaxed ${textSecondary}`}>
                          System protocols are strictly managed by CSxPEDIA automated security policies.
                        </p>
                      </div>
                    </motion.div>

                    {/* Admin Urgent Request Pipeline */}
                    <motion.div variants={springItem} className={`p-8 rounded-3xl border relative overflow-hidden flex flex-col ${isLightMode ? 'bg-red-50 border-red-200' : 'bg-[#1a0505] border-red-500/30'}`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full pointer-events-none" />
                      <div className="flex items-center mb-4 text-red-500 relative z-10">
                        <AlertTriangle size={24} className="mr-3" />
                        <h3 className={`text-lg font-bold uppercase tracking-widest ${isLightMode ? 'text-red-700' : 'text-red-400'}`}>Urgent Admin Request</h3>
                      </div>
                      <p className={`text-xs mb-6 font-mono leading-relaxed relative z-10 ${isLightMode ? 'text-slate-600' : 'text-red-300/70'}`}>
                        Initiate a direct, encrypted priority request to the System Administrator. Use only for critical access overrides, secure data retrieval, or immediate system escalations.
                      </p>
                      <div className="mt-auto relative z-10">
                        <textarea 
                          value={adminRequestText}
                          onChange={(e) => setAdminRequestText(e.target.value)}
                          className={`w-full p-4 rounded-2xl text-xs font-mono border resize-none mb-4 outline-none transition-colors shadow-inner ${isLightMode ? 'bg-white border-red-200 text-slate-800 focus:border-red-400' : 'bg-black/60 border-red-500/20 text-red-100 focus:border-red-500/50'} placeholder-red-500/30`} 
                          rows={3} 
                          placeholder="Type your encrypted transmission here..."
                        ></textarea>
                        <button 
                          onClick={handleAdminRequest}
                          disabled={requestStatus !== 'idle' || !adminRequestText.trim()}
                          className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer ${
                            requestStatus === 'sent' ? 'bg-green-500 text-white' : 
                            requestStatus === 'sending' ? 'bg-red-500/50 text-white cursor-wait' : 
                            'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                          }`}
                        >
                          {requestStatus === 'idle' && <><Send size={14} className="mr-2" /> Transmit Priority Request</>}
                          {requestStatus === 'sending' && <><Loader2 size={14} className="mr-2 animate-spin" /> Establishing Secure Link...</>}
                          {requestStatus === 'sent' && <><CheckCircle2 size={14} className="mr-2" /> Transmission Verified</>}
                        </button>
                      </div>
                    </motion.div>

                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      
      {/* ========================================== */}
      {/* ADVANCED MODERN AVATAR STUDIO MODAL */}
      {/* ========================================== */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 pointer-events-auto cursor-default overflow-y-auto`}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-xl p-6 md:p-8 rounded-[2.5rem] border ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#01020a] border-[#00f0ff]/30'} shadow-2xl overflow-hidden my-8`}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <Sliders size={18} className="text-[#00f0ff]" />
                    <h3 className={`text-xl font-black uppercase tracking-widest ${isLightMode ? 'text-slate-800' : 'text-white'}`}>Avatar Studio</h3>
                  </div>
                  <p className={`text-[10px] font-mono tracking-widest ${textSecondary}`}>Rotate, zoom, apply cyber filters & crop your matrix projection.</p>
                </div>
                <button onClick={() => setSelectedImage(null)} title="Close image cropper" className="p-2.5 rounded-2xl hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-red-500 transition-all cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              
              {/* CROPPER CANVAS CONTAINER */}
              <div className="relative w-full h-[320px] sm:h-[360px] bg-black rounded-3xl overflow-hidden mb-6 border border-slate-800 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                  style={{
                    containerStyle: { 
                      background: '#050505', 
                      borderRadius: '1.5rem',
                      filter: filterStyle === 'cyber' ? 'contrast(120%) saturate(140%) hue-rotate(185deg)' :
                              filterStyle === 'matrix' ? 'contrast(130%) saturate(160%) hue-rotate(90deg)' :
                              filterStyle === 'mono' ? 'grayscale(100%) contrast(125%)' :
                              filterStyle === 'vibrant' ? 'saturate(150%) contrast(110%)' : 'none'
                    },
                    cropAreaStyle: { border: '2px solid #00f0ff', boxShadow: '0 0 0 9999em rgba(0,0,0,0.8), 0 0 25px rgba(0,240,255,0.6)' }
                  }}
                />
              </div>

              {/* TOOLBAR: ROTATION & ZOOM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-3 rounded-2xl border bg-black/20 border-white/5">
                {/* ROTATION BUTTONS */}
                <div className="flex items-center justify-between px-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${textSecondary}`}>Rotate:</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      title="Rotate Counter-Clockwise"
                      onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                      className="px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-mono flex items-center space-x-1"
                    >
                      <RotateCcw size={13} /> <span>-90°</span>
                    </button>
                    <button
                      type="button"
                      title="Rotate Clockwise"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-mono flex items-center space-x-1"
                    >
                      <RotateCw size={13} /> <span>+90°</span>
                    </button>
                    <button
                      type="button"
                      title="Reset Rotation"
                      onClick={() => setRotation(0)}
                      className="px-2 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white text-xs font-mono"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </div>

                {/* ZOOM CONTROLS */}
                <div className="flex items-center space-x-2 px-2">
                  <button type="button" onClick={() => setZoom(z => Math.max(1, z - 0.2))} className="p-1 rounded text-slate-400 hover:text-white">
                    <ZoomOut size={14} />
                  </button>
                  <input 
                    type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-[#00f0ff] h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer"
                    title="Zoom Level"
                    aria-label="Zoom Level"
                  />
                  <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1 rounded text-slate-400 hover:text-white">
                    <ZoomIn size={14} />
                  </button>
                  <span className={`text-[10px] font-mono shrink-0 ${textSecondary}`}>{zoom.toFixed(1)}x</span>
                </div>
              </div>

              {/* VISUAL FILTER PRESETS */}
              <div className="mb-6">
                <label className={`text-[10px] font-bold uppercase tracking-widest block mb-2 font-mono ${textSecondary}`}>Color Filter Presets:</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'none', label: 'Raw' },
                    { id: 'cyber', label: 'Cyber' },
                    { id: 'matrix', label: 'Matrix' },
                    { id: 'mono', label: 'Mono' },
                    { id: 'vibrant', label: 'Vivid' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setFilterStyle(filter.id as any)}
                      className={`py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg border transition-all ${
                        filterStyle === filter.id 
                          ? 'bg-[#00f0ff] text-black border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.4)]' 
                          : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex space-x-4">
                <button 
                  onClick={() => setSelectedImage(null)} disabled={isUploading}
                  className={`flex-1 py-4 rounded-xl font-bold uppercase tracking-widest text-xs border transition-all cursor-pointer ${isLightMode ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200' : 'bg-transparent text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'}`}
                >
                  Cancel
                </button>
                <button 
                  disabled={isUploading}
                  onClick={async () => {
                    setIsUploading(true);
                    try {
                      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels, rotation, filterStyle);
                      if (!croppedBlob) throw new Error("Image crop failed");

                      const uploadFormData = new FormData();
                      uploadFormData.append('profilePic', croppedBlob, 'profile.jpg');

                      const token = localStorage.getItem('matrix_token');
                      const res = await fetch(`${API_URL}/api/auth/upload-pic`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: uploadFormData
                      });

                      if (res.ok) {
                        const result = await res.json();
                        setUserData((prev: any) => ({ ...prev, profilePic: result.data.profilePic }));
                        setSelectedImage(null);
                      }
                    } catch (error) {
                      console.error(error);
                      alert("Avatar upload failed. Please try a valid JPG, PNG, or WEBP image.");
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                  className="flex-[2] flex items-center justify-center py-4 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#00f0ff] text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? <Loader2 className="animate-spin mr-2" size={18} /> : <UploadCloud className="mr-2" size={18} />}
                  {isUploading ? 'Transmitting...' : 'Apply & Save Avatar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative z-10 w-full mt-auto pointer-events-auto">
        <Footer isLight={isLightMode} currentRole="user" />
      </div>

      <BottomNav currentRole="user" />
    </main>
  );
}