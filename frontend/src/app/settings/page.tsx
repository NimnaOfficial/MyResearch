"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { 
  User, Shield, Laptop, LogOut, AlertTriangle, CheckCircle2, Lock, Camera, Send, ChevronRight,
  Mail, KeyRound, Bookmark, ArchiveRestore, FileText, ScanFace, Loader2, Type, Hash, Phone,
  X, UploadCloud, ArrowLeft 
} from 'lucide-react';

import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/utils/cropImage';

import CustomCursor from '@/components/CustomCursor';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';

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
          <planeGeometry args={[70, 70, 150, 150]} />
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
  { id: 'saved', label: 'Authored Vault', icon: Bookmark, desc: 'Your Contributions' },
  { id: 'security', label: 'Security', icon: Shield, desc: 'Admin & Encryption' },
];

export default function AdvancedSettingsMatrix() {
  const router = useRouter();
  const [isLightMode, setIsLightMode] = useState(false);
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

  // Advanced Cropper States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const updateForm = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const fetchMatrixData = async () => {
      const token = localStorage.getItem('matrix_token');
      if (!token) { router.push('/auth'); return; }

      try {
        const userRes = await fetch('http://localhost:5000/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (userRes.ok) {
          const { data } = await userRes.json();
          setUserData(data);
          
          setFormData(prev => ({ 
            ...prev, 
            fullName: data.fullName || "",
            age: data.age || "",
            phone: data.phone || ""
          }));
          
          const postsRes = await fetch('http://localhost:5000/api/posts');
          if (postsRes.ok) {
            const postsJson = await postsRes.json();
            const myPosts = (postsJson.data || []).filter((p: any) => p.authorId === data.id);
            setUserVault(myPosts);
          }
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
    setIsSaving(true);
    const token = localStorage.getItem('matrix_token');

    try {
      const res = await fetch('http://localhost:5000/api/auth/update', {
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
        setUserData(result.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      } else {
        alert("Transmission Failed. Data rejected by server.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('matrix_token');
    localStorage.removeItem('userRole');
    router.push('/auth');
  };

  const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const handleAdminRequest = () => {
    setRequestStatus('sending');
    setTimeout(() => setRequestStatus('sent'), 2500);
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

  const bgCore = isLightMode ? "bg-[#f4f7fb]" : "bg-[#01030b]";
  const panelGlass = isLightMode ? "bg-white/80 border-slate-200 shadow-2xl" : "bg-[#020512]/70 border-[#0055ff]/30 shadow-[0_0_60px_rgba(0,100,255,0.15)]";
  const innerCard = isLightMode ? "bg-slate-50 border-slate-200 focus-within:border-blue-500" : "bg-[#01020a]/90 border-[#0044ff]/40 focus-within:border-[#00f0ff] focus-within:shadow-[0_0_30px_rgba(0,240,255,0.2)]";
  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-500" : "text-[#4d88ff]";

  const displayName = userData?.fullName ? userData.fullName.toUpperCase() : "NIMA OPERATOR";
  const secureCode = userData ? userData.username : "••••••••";

  return (
    <main className={`relative min-h-screen font-sans cursor-none overflow-x-hidden selection:bg-[#00f0ff]/30 flex flex-col transition-colors duration-1000 ${bgCore}`}>
      <CustomCursor />
      <style dangerouslySetInnerHTML={{__html: `@keyframes textAnimation { 0% { background-position: 0 0; } 100% { background-position: 2000px 0; } } .video-text-animation { color: rgba(225, 225, 255, 0.05); background-image: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'); background-repeat: repeat-x; background-clip: text; -webkit-background-clip: text; background-size: cover; animation: textAnimation 25s linear infinite; } .secure-code-block { user-select: none !important; -webkit-user-select: none !important; -moz-user-select: none !important; pointer-events: none; } @media print { .secure-code-container { display: none !important; } }`}} />

      <div className="relative z-[100] pointer-events-auto">
        <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />
      </div>

      <div className="fixed inset-0 z-0 overflow-hidden cursor-move">
        <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
          <OrbitControls enableZoom={false} enablePan={true} autoRotate={true} autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 4} />
          <ActiveTopography isLight={isLightMode} />
        </Canvas>
        <div className={`absolute inset-0 pointer-events-none ${isLightMode ? 'bg-[radial-gradient(circle_at_top,_transparent_30%,_#f4f7fb_100%)]' : 'bg-[radial-gradient(circle_at_top,_transparent_30%,_#01030b_100%)]'} backdrop-blur-[1px]`} />
      </div>

      <div className="relative z-10 w-full pt-32 pb-40 px-6 lg:px-12 flex-grow flex flex-col items-center pointer-events-none">
        
        <motion.div initial={{ opacity: 0, y: -30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 80 }} className="w-full max-w-7xl mb-12 flex flex-col items-start pointer-events-auto">
          
          {/* SECURE BACK BUTTON NAVIGATION */}
          <button 
            onClick={() => router.push('/research')} 
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
                      {/* FILE INPUT TRIGGER */}
                      <motion.div whileHover={{ scale: 1.05, rotate: 5 }} whileTap={{ scale: 0.95 }} className="relative group cursor-pointer shrink-0">
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
                            }
                            e.target.value = ''; 
                          }}
                        />
                        <label htmlFor="profilePicUpload" className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#0044ff] to-[#00f0ff] p-[3px] shadow-[0_0_40px_rgba(0,102,255,0.4)] flex cursor-pointer">
                          <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden relative ${isLightMode ? 'bg-white' : 'bg-[#01030a]'}`}>
                            {userData?.profilePic ? (
                              <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <User size={50} className={textSecondary} />
                            )}
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Camera size={24} className="text-[#00f0ff] mb-2" />
                              <span className="text-[10px] font-bold text-white tracking-widest">Update</span>
                            </div>
                          </div>
                        </label>
                      </motion.div>
                      <div className="text-center md:text-left mt-4 md:mt-2">
                        <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-tighter ${textPrimary}`}>{displayName}</h2>
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

              {/* ... (Other Tabs Remain Exactly The Same) ... */}
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
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      
      {/* ========================================== */}
      {/* ADVANCED CROPPER MODAL (ROOT LEVEL PROJECTION) */}
      {/* ========================================== */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 pointer-events-auto cursor-default`}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-lg p-6 rounded-[2.5rem] border ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#01020a] border-[#00f0ff]/30'} shadow-2xl overflow-hidden`}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className={`text-xl font-black uppercase tracking-widest ${isLightMode ? 'text-slate-800' : 'text-white'}`}>Adjust Avatar</h3>
                  <p className={`text-[10px] font-mono tracking-widest ${textSecondary}`}>Pinch & drag to align matrix projection.</p>
                </div>
                <button onClick={() => setSelectedImage(null)} title="Close image cropper" className="p-3 rounded-2xl hover:bg-red-500/10 border border-transparent hover:border-red-500/30 text-red-500 transition-all cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              
              <div className="relative w-full h-[350px] sm:h-[400px] bg-black rounded-3xl overflow-hidden mb-8 border border-slate-800 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                  style={{
                    containerStyle: { background: '#050505', borderRadius: '1.5rem' },
                    cropAreaStyle: { border: '2px solid #00f0ff', boxShadow: '0 0 0 9999em rgba(0,0,0,0.8), 0 0 20px rgba(0,240,255,0.5)' }
                  }}
                />
              </div>

              <div className="mb-8 px-2">
                <div className="flex justify-between items-center mb-2">
                  <label className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>Zoom Level</label>
                  <span className={`text-[10px] font-mono ${textSecondary}`}>{zoom.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[#00f0ff] h-1 bg-slate-800 rounded-full appearance-none cursor-pointer"
                  title="Zoom Level"
                  aria-label="Zoom Level"
                />
              </div>

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
                      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
                      if (!croppedBlob) throw new Error("Image crop failed");

                      const uploadFormData = new FormData();
                      uploadFormData.append('profilePic', croppedBlob, 'profile.jpg');

                      const token = localStorage.getItem('matrix_token');
                      const res = await fetch('http://localhost:5000/api/auth/upload-pic', {
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
                      alert("Transmission Failed. Ensure Cloudinary is configured.");
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                  className="flex-[2] flex items-center justify-center py-4 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#00f0ff] text-black font-black uppercase tracking-widest text-xs hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? <Loader2 className="animate-spin mr-2" size={18} /> : <UploadCloud className="mr-2" size={18} />}
                  {isUploading ? 'Transmitting...' : 'Confirm & Upload'}
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