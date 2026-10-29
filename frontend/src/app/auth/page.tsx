"use client";

import { API_URL } from '@/lib/api';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  KeySquare, ShieldCheck, AlertTriangle, ScanFace, ArrowRight, Camera, User, 
  Copy, Check, Mail, Lock, Key, CheckCircle, RefreshCw, ShieldAlert 
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshTransmissionMaterial, Sparkles, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Glitch } from '@react-three/postprocessing';
import { GlitchMode } from 'postprocessing';
import * as THREE from 'three';

import CustomCursor from '@/components/CustomCursor';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import Footer from '@/components/Footer';

// ==========================================
// 1. CINEMATIC 3D VAULT LOGO
// ==========================================
function CinematicCore({ authState, isBooting, isLightMode }: { authState: string, isBooting: boolean, isLightMode: boolean }) {
  const coreRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * (authState === 'scanning' ? 0.8 : 0.1);
      coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      const targetX = isBooting ? 0 : -3.5;
      coreRef.current.position.x = THREE.MathUtils.lerp(coreRef.current.position.x, targetX, 0.05);
    }
  });

  const getCoreColor = () => {
    if (authState === 'error') return "#ef4444"; 
    if (authState === 'success') return "#a855f7"; 
    return isLightMode ? "#0284c7" : "#00f0ff"; 
  };

  return (
    <group ref={coreRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere args={[isBooting ? 2 : 1.5, 36, 36]}>
          <MeshTransmissionMaterial backside thickness={0.6} roughness={0.08} ior={1.3} color={getCoreColor()} distortion={authState === 'scanning' ? 0.6 : 0.05} distortionScale={0.8} temporalDistortion={0} />
        </Sphere>
        {Array.from({ length: 3 }).map((_, i) => (
          <mesh key={i} position={[Math.sin(i * 2) * 2.5, Math.cos(i * 2) * 2.5, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={getCoreColor()} />
          </mesh>
        ))}
      </Float>
    </group>
  );
}

// ==========================================
// 2. MAIN SECURE GATEWAY COMPONENT
// ==========================================
export default function AuthGateway() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  const { isLightMode, toggleTheme } = useTheme();
  const [isBooting, setIsBooting] = useState(true);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-code' | 'emergency-reset'>('login');
  const [authState, setAuthState] = useState<'idle' | 'scanning' | 'error' | 'success'>('idle');
  const [authError, setAuthError] = useState(''); 

  const [secretCode, setSecretCode] = useState('');
  const [regData, setRegData] = useState({ name: '', email: '', phone: '', age: '', backupPass: '', confirmPass: '', avatarPreview: '' });

  // RECOVERY & EMERGENCY RESET STATES
  const [recoveryTab, setRecoveryTab] = useState<'backup-pass' | 'admin-request'>('backup-pass');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryBackupPass, setRecoveryBackupPass] = useState('');
  const [revealedSecretCode, setRevealedSecretCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [adminRequestSent, setAdminRequestSent] = useState(false);
  const [newBackupPass, setNewBackupPass] = useState('');
  const [confirmNewBackupPass, setConfirmNewBackupPass] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => setIsBooting(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return; 
    isSubmittingRef.current = true;
    setIsLoading(true);

    setAuthState('scanning'); 
    setAuthError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretCode })
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('matrix_token', data.token);
        localStorage.setItem('userRole', data.data?.user?.role || 'user');

        if (data.mustChangePassword) {
          setRevealedSecretCode(data.secretCode || secretCode);
          setMode('emergency-reset');
          setAuthState('idle');
          return;
        }

        setAuthState('success');
        setTimeout(() => router.push('/'), 1500);
      } else {
        setAuthState('error'); setAuthError(data.message || 'Invalid Cryptographic Handshake');
        setTimeout(() => setAuthState('idle'), 3000);
      }
    } catch (err) {
      setAuthState('error'); setAuthError('Matrix connection failed. Check server status.');
      setTimeout(() => setAuthState('idle'), 3000);
    } finally {
      setIsLoading(false); 
      setTimeout(() => { isSubmittingRef.current = false; }, 500);
    }
  };

  const handleBackupPassLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    setAuthState('scanning');
    setAuthError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail.trim(), password: recoveryBackupPass })
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('matrix_token', data.token);
        localStorage.setItem('userRole', data.data?.user?.role || 'user');
        setRevealedSecretCode(data.secretCode || data.data?.secretCode || '');
        setAuthState('idle');
        setMode('emergency-reset');
      } else {
        setAuthState('error');
        setAuthError(data.message || 'Emergency access rejected: check your email and backup password.');
        setTimeout(() => setAuthState('idle'), 3500);
      }
    } catch (err) {
      setAuthState('error');
      setAuthError('Matrix connection failed. Check server status.');
      setTimeout(() => setAuthState('idle'), 3500);
    } finally {
      setIsLoading(false);
      setTimeout(() => { isSubmittingRef.current = false; }, 500);
    }
  };

  const handleRequestAdminRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    setAuthState('scanning');
    setAuthError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/request-code-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail.trim() })
      });
      const data = await response.json();

      if (response.ok) {
        setAuthState('idle');
        setAdminRequestSent(true);
      } else {
        setAuthState('error');
        setAuthError(data.message || 'Failed to submit recovery request.');
        setTimeout(() => setAuthState('idle'), 3500);
      }
    } catch (err) {
      setAuthState('error');
      setAuthError('Matrix connection failed. Check server status.');
      setTimeout(() => setAuthState('idle'), 3500);
    } finally {
      setIsLoading(false);
      setTimeout(() => { isSubmittingRef.current = false; }, 500);
    }
  };

  const handleResetBackupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    setAuthState('scanning');
    setAuthError('');

    if (newBackupPass.length < 8) {
      setAuthState('error');
      setAuthError('New backup password must be at least 8 characters.');
      setTimeout(() => setAuthState('idle'), 3000);
      setIsLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    if (newBackupPass !== confirmNewBackupPass) {
      setAuthState('error');
      setAuthError('Backup passwords do not match.');
      setTimeout(() => setAuthState('idle'), 3000);
      setIsLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    try {
      const token = localStorage.getItem('matrix_token');
      const response = await fetch(`${API_URL}/api/auth/reset-backup-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: newBackupPass, confirmPassword: confirmNewBackupPass })
      });
      const data = await response.json();

      if (response.ok) {
        setAuthState('success');
        setResetSuccess(true);
        if (data.token) localStorage.setItem('matrix_token', data.token);
        setTimeout(() => {
          router.push('/research');
        }, 1500);
      } else {
        setAuthState('error');
        setAuthError(data.message || 'Failed to update backup password.');
        setTimeout(() => setAuthState('idle'), 3500);
      }
    } catch (err) {
      setAuthState('error');
      setAuthError('Matrix connection failed.');
      setTimeout(() => setAuthState('idle'), 3500);
    } finally {
      setIsLoading(false);
      setTimeout(() => { isSubmittingRef.current = false; }, 500);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return; 
    isSubmittingRef.current = true;
    setIsLoading(true);

    setAuthState('scanning'); 
    setAuthError('');

    if (regData.backupPass.length < 8) {
      setAuthState('error'); setAuthError('Backup Password must be at least 8 characters.');
      setTimeout(() => setAuthState('idle'), 3000);
      setIsLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    if (regData.backupPass !== regData.confirmPass) {
      setAuthState('error'); setAuthError('Backup Passwords do not match!');
      setTimeout(() => setAuthState('idle'), 3000); 
      setIsLoading(false); 
      isSubmittingRef.current = false;
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regData.email, password: regData.backupPass, fullName: regData.name, age: parseInt(regData.age) || 0, phone: regData.phone, profilePic: regData.avatarPreview || undefined })
      });
      const data = await response.json();

      if (response.ok) {
        setAuthState('success');
      } else {
        setAuthState('error'); setAuthError(data.message || 'Initialization Failed');
        setTimeout(() => setAuthState('idle'), 3000);
      }
    } catch (err) {
      setAuthState('error'); setAuthError('Matrix connection failed. Check server status.');
      setTimeout(() => setAuthState('idle'), 3000);
    } finally {
      setIsLoading(false); 
      setTimeout(() => { isSubmittingRef.current = false; }, 500);
    }
  };

  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const bgPrimary = isLightMode ? "bg-[#f8fafc]" : "bg-[#010309]";
  const inputStyle = `w-full bg-transparent border-b px-2 py-3 focus:outline-none focus:border-[#a855f7] transition-all font-mono tracking-widest ${isLightMode ? 'border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-[#a855f7]/5' : 'border-slate-800 text-white placeholder-slate-600 focus:bg-[#a855f7]/10'}`;

  if (!isMounted) return <div className={`min-h-screen ${bgPrimary}`} />;

  return (
    <main className={`relative min-h-screen flex flex-col font-sans overflow-x-hidden transition-colors duration-1000 ${bgPrimary}`}>
      <CustomCursor />
      <ThemeToggle isLight={isLightMode} toggleTheme={toggleTheme} />

      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 1.5]} gl={{ powerPreference: 'high-performance', antialias: false, stencil: false }}>
          <ambientLight intensity={isLightMode ? 0.6 : 0.2} />
          <directionalLight position={[5, 5, -5]} intensity={isLightMode ? 2.5 : 2} color={isLightMode ? "#0284c7" : "#00f0ff"} />
          <Sparkles count={80} scale={15} size={1} speed={0.2} color={authState === 'success' ? "#a855f7" : (isLightMode ? "#0284c7" : "#00f0ff")} opacity={isLightMode ? 0.15 : 0.3} />
          <CinematicCore authState={authState} isBooting={isBooting} isLightMode={isLightMode} />
          <EffectComposer>
            <Bloom luminanceThreshold={isLightMode ? 0.6 : 0.15} mipmapBlur intensity={isBooting ? 2.0 : 1.2} radius={0.7} />
            <Glitch active={authState === 'error'} delay={new THREE.Vector2(0, 0)} duration={new THREE.Vector2(0.1, 0.3)} strength={new THREE.Vector2(0.2, 0.6)} mode={GlitchMode.CONSTANT_MILD} />
          </EffectComposer>
        </Canvas>
      </div>

      <AnimatePresence>
        {!isBooting && (
          <div className="relative z-10 w-full flex-1 flex flex-col lg:flex-row pointer-events-none min-h-[85vh]">
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} className="hidden lg:flex w-1/2 flex-col justify-center p-16 xl:p-24">
              <div className="text-cyan-500/50 font-mono text-xs tracking-[0.3em] uppercase drop-shadow-md mb-8">System Gateway // Build 9.0.4</div>
              <div>
                <h1 className={`text-5xl xl:text-6xl font-black tracking-tighter mb-4 ${textPrimary}`}>Digital CSxPEDIA<span className="text-cyan-400">.</span></h1>
                <p className={`font-light max-w-sm text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Encrypted biometric spatial matrix. Access requires authorized cryptographic handshake.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, type: 'spring', damping: 20 }} className={`w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 pointer-events-auto transition-colors duration-1000 ${isLightMode ? 'bg-gradient-to-l from-[#f8fafc] via-[#f8fafc]/90 to-transparent' : 'bg-gradient-to-l from-[#010309] via-[#010309]/90 to-transparent'}`}>
              <div className="w-full max-w-md pt-20 lg:pt-0">
                
                <div className="mb-8 text-center lg:text-left">
                  <h2 className={`text-3xl font-bold tracking-wide mb-2 ${textPrimary}`}>
                    {mode === 'login' 
                      ? 'Access Matrix' 
                      : mode === 'register' 
                      ? 'Initialize Identity'
                      : mode === 'forgot-code'
                      ? 'Emergency Recovery'
                      : 'Security Protocol'}
                  </h2>
                  <p className={isLightMode ? 'text-slate-500 text-sm' : 'text-slate-400 text-sm'}>
                    {mode === 'login' 
                      ? 'Enter your 10-character Secret Member Code.' 
                      : mode === 'register' 
                      ? 'Establish your parameters for network access.'
                      : mode === 'forgot-code'
                      ? 'Retrieve your access cipher or utilize emergency backup credentials.'
                      : 'Mandatory single-use password update. Set a new backup password to proceed.'}
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {/* 1. SECRET CODE LOGIN */}
                  {mode === 'login' && (
                    <motion.form key="login" onSubmit={handleLogin} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      <div className="relative group">
                        <KeySquare size={16} className={`absolute right-2 top-1/2 -translate-y-1/2 ${authState === 'error' ? 'text-red-500' : (isLightMode ? 'text-slate-400' : 'text-slate-600')}`} />
                        <input type="text" required maxLength={10} placeholder="Secret Code (e.g. AEX4921B7C)" disabled={authState !== 'idle' || isLoading} value={secretCode} onChange={(e) => setSecretCode(e.target.value.toUpperCase())} className={`${inputStyle} ${authState === 'error' ? 'border-red-500/50 text-red-500 bg-red-500/10' : ''}`} />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot-code');
                            setAuthError('');
                            setAuthState('idle');
                            setRecoveryTab('backup-pass');
                            setAdminRequestSent(false);
                          }}
                          className={`text-xs font-mono tracking-wider transition-colors ${isLightMode ? 'text-cyan-700 hover:text-cyan-900 underline' : 'text-cyan-400 hover:text-cyan-300 underline'}`}
                        >
                          Forgot Code? / Emergency Access &rarr;
                        </button>
                      </div>

                      {authError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center pt-2"><AlertTriangle size={14} className="mr-2" /> {authError}</motion.p>}
                      <button type="submit" disabled={authState !== 'idle' || isLoading} className={`w-full flex items-center justify-center py-4 font-black uppercase tracking-[0.2em] text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl ${authState === 'success' ? 'bg-[#9333ea] text-white shadow-[0_0_30px_rgba(168,85,247,0.6)]' : 'bg-[#a855f7] hover:bg-[#9333ea] text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]'}`}>
                        {authState === 'scanning' ? <ScanFace className="animate-pulse text-white" size={18} /> : authState === 'error' ? 'Access Denied' : authState === 'success' ? 'Link Established' : 'Execute Login'}
                      </button>
                    </motion.form>
                  )}

                  {/* 2. FORGOT CODE / EMERGENCY ACCESS */}
                  {mode === 'forgot-code' && (
                    <motion.div key="forgot-code" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      {/* Tabs */}
                      <div className={`grid grid-cols-2 p-1 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-black/60 border-slate-800'}`}>
                        <button
                          type="button"
                          onClick={() => { setRecoveryTab('backup-pass'); setAuthError(''); }}
                          className={`py-2 px-3 rounded-lg transition-all text-center ${
                            recoveryTab === 'backup-pass'
                              ? 'bg-[#a855f7] text-white shadow-md'
                              : (isLightMode ? 'text-slate-600 hover:text-black' : 'text-slate-400 hover:text-white')
                          }`}
                        >
                          Backup Password
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRecoveryTab('admin-request'); setAuthError(''); }}
                          className={`py-2 px-3 rounded-lg transition-all text-center ${
                            recoveryTab === 'admin-request'
                              ? 'bg-[#a855f7] text-white shadow-md'
                              : (isLightMode ? 'text-slate-600 hover:text-black' : 'text-slate-400 hover:text-white')
                          }`}
                        >
                          Request Admin
                        </button>
                      </div>

                      {/* Tab A: Login with Backup Password */}
                      {recoveryTab === 'backup-pass' && (
                        <form onSubmit={handleBackupPassLogin} className="space-y-5">
                          <div className={`p-3 rounded-xl border text-xs font-mono leading-relaxed ${isLightMode ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/20 border-amber-500/30 text-amber-300'}`}>
                            <strong>Notice:</strong> Emergency backup login gives instant access to reveal your code, but requires setting a new backup password upon entry.
                          </div>

                          <div className="relative group">
                            <Mail size={16} className={`absolute right-2 top-1/2 -translate-y-1/2 ${isLightMode ? 'text-slate-400' : 'text-slate-600'}`} />
                            <input
                              type="email"
                              required
                              placeholder="Registered Email Address"
                              value={recoveryEmail}
                              onChange={(e) => setRecoveryEmail(e.target.value)}
                              disabled={isLoading}
                              className={inputStyle}
                            />
                          </div>

                          <div className="relative group">
                            <Lock size={16} className={`absolute right-2 top-1/2 -translate-y-1/2 ${isLightMode ? 'text-slate-400' : 'text-slate-600'}`} />
                            <input
                              type="password"
                              required
                              placeholder="Backup Password"
                              value={recoveryBackupPass}
                              onChange={(e) => setRecoveryBackupPass(e.target.value)}
                              disabled={isLoading}
                              className={inputStyle}
                            />
                          </div>

                          {authError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center pt-2"><AlertTriangle size={14} className="mr-2" /> {authError}</motion.p>}

                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center py-4 font-black uppercase tracking-[0.2em] text-xs transition-all disabled:opacity-50 rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                          >
                            {isLoading ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Key className="mr-2" size={16} />}
                            Authenticate & Reveal Cipher
                          </button>
                        </form>
                      )}

                      {/* Tab B: Request Admin to Regenerate Code */}
                      {recoveryTab === 'admin-request' && (
                        <div>
                          {!adminRequestSent ? (
                            <form onSubmit={handleRequestAdminRecovery} className="space-y-5">
                              <div className={`p-3 rounded-xl border text-xs font-mono leading-relaxed ${isLightMode ? 'bg-cyan-50 border-cyan-200 text-cyan-800' : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300'}`}>
                                Enter your registered email. A code regeneration alert will be sent to the System Administrator, and your new 10-character code will be emailed to you upon approval.
                              </div>

                              <div className="relative group">
                                <Mail size={16} className={`absolute right-2 top-1/2 -translate-y-1/2 ${isLightMode ? 'text-slate-400' : 'text-slate-600'}`} />
                                <input
                                  type="email"
                                  required
                                  placeholder="Registered Email Address"
                                  value={recoveryEmail}
                                  onChange={(e) => setRecoveryEmail(e.target.value)}
                                  disabled={isLoading}
                                  className={inputStyle}
                                />
                              </div>

                              {authError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center pt-2"><AlertTriangle size={14} className="mr-2" /> {authError}</motion.p>}

                              <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center py-4 font-black uppercase tracking-[0.2em] text-xs transition-all disabled:opacity-50 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                              >
                                {isLoading ? <RefreshCw className="animate-spin mr-2" size={16} /> : <ShieldAlert className="mr-2" size={16} />}
                                Transmit Recovery Request
                              </button>
                            </form>
                          ) : (
                            <div className="text-center py-6 space-y-4">
                              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                <CheckCircle size={32} />
                              </div>
                              <h3 className={`text-xl font-bold uppercase tracking-wider ${textPrimary}`}>Request Transmitted</h3>
                              <p className={`text-xs font-mono leading-relaxed max-w-sm mx-auto ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                A code regeneration alert was logged for the System Administrator. Once reviewed, your new login code will arrive in your email.
                              </p>
                              <button
                                type="button"
                                onClick={() => { setMode('login'); setAdminRequestSent(false); }}
                                className="mt-4 px-6 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white transition-all"
                              >
                                Return to Login
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* 3. MANDATORY EMERGENCY PASSWORD RESET MODAL */}
                  {mode === 'emergency-reset' && (
                    <motion.div key="emergency-reset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      
                      {/* Revealed Code Card */}
                      {revealedSecretCode && (
                        <div className={`p-4 rounded-2xl border text-center space-y-2 ${isLightMode ? 'bg-cyan-50/80 border-cyan-300 shadow-lg' : 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_30px_rgba(0,240,255,0.15)]'}`}>
                          <p className="text-[10px] font-mono tracking-widest uppercase text-cyan-500 font-bold">Your Secret Member Login Code</p>
                          <div className="flex items-center justify-center space-x-3 pt-1">
                            <span className="font-mono text-2xl font-black tracking-widest text-[#00ff66] bg-black/40 px-4 py-1.5 rounded-lg border border-[#00ff66]/30">
                              {revealedSecretCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(revealedSecretCode)}
                              className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-500/30 transition-all"
                              title="Copy code"
                            >
                              {codeCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                          </div>
                          <p className={`text-[10px] font-mono ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                            {codeCopied ? '✅ Code copied to clipboard!' : 'Save this code now. This is your primary access key.'}
                          </p>
                        </div>
                      )}

                      <div className={`p-3 rounded-xl border text-xs font-mono leading-relaxed ${isLightMode ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-950/20 border-amber-500/40 text-amber-300'}`}>
                        <strong>Required Security Step:</strong> You accessed your account using emergency credentials. You must set a new backup password before continuing.
                      </div>

                      <form onSubmit={handleResetBackupPassword} className="space-y-5">
                        <div className="relative group">
                          <Lock size={16} className={`absolute right-2 top-1/2 -translate-y-1/2 ${isLightMode ? 'text-slate-400' : 'text-slate-600'}`} />
                          <input
                            type="password"
                            required
                            placeholder="New Backup Password (min 8 chars)"
                            value={newBackupPass}
                            onChange={(e) => setNewBackupPass(e.target.value)}
                            disabled={isLoading || resetSuccess}
                            className={inputStyle}
                          />
                        </div>

                        <div className="relative group">
                          <Lock size={16} className={`absolute right-2 top-1/2 -translate-y-1/2 ${isLightMode ? 'text-slate-400' : 'text-slate-600'}`} />
                          <input
                            type="password"
                            required
                            placeholder="Confirm New Backup Password"
                            value={confirmNewBackupPass}
                            onChange={(e) => setConfirmNewBackupPass(e.target.value)}
                            disabled={isLoading || resetSuccess}
                            className={inputStyle}
                          />
                        </div>

                        {authError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center pt-2"><AlertTriangle size={14} className="mr-2" /> {authError}</motion.p>}

                        <button
                          type="submit"
                          disabled={isLoading || resetSuccess}
                          className={`w-full flex items-center justify-center py-4 font-black uppercase tracking-[0.2em] text-xs transition-all disabled:opacity-50 rounded-xl ${
                            resetSuccess 
                              ? 'bg-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.6)]' 
                              : 'bg-[#a855f7] hover:bg-[#9333ea] text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                          }`}
                        >
                          {isLoading ? (
                            <RefreshCw className="animate-spin mr-2" size={16} />
                          ) : resetSuccess ? (
                            <CheckCircle className="mr-2" size={16} />
                          ) : (
                            <Key className="mr-2" size={16} />
                          )}
                          {resetSuccess ? 'Password Reset! Entering Matrix...' : 'Update Password & Access Platform'}
                        </button>
                      </form>
                    </motion.div>
                  )}

                  {/* 4. REGISTRATION */}
                  {mode === 'register' && (
                    <motion.form key="register" onSubmit={handleRegister} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                      {/* REAL-TIME AVATAR SETUP */}
                      <div className="flex flex-col items-center justify-center pt-1 pb-2">
                        <div className="relative group cursor-pointer">
                          <input
                            type="file"
                            id="regAvatarInput"
                            className="hidden"
                            accept="image/*"
                            disabled={isLoading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setRegData((prev) => ({ ...prev, avatarPreview: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label
                            htmlFor="regAvatarInput"
                            className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 to-[#a855f7] p-[2px] shadow-[0_0_20px_rgba(168,85,247,0.3)] flex cursor-pointer group-hover:scale-105 transition-all"
                          >
                            <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden relative ${isLightMode ? 'bg-white' : 'bg-[#020613]'}`}>
                              {regData.avatarPreview ? (
                                <img src={regData.avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                                  <Camera size={20} />
                                  <span className="text-[8px] font-mono uppercase tracking-widest mt-1">Photo</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Camera size={18} className="text-cyan-400" />
                              </div>
                            </div>
                          </label>
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-widest mt-2 text-slate-500">
                          {regData.avatarPreview ? 'Avatar Attached' : 'Set Profile Picture (Optional)'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <input type="text" required placeholder="Full Name" className={inputStyle} value={regData.name} onChange={(e) => setRegData({...regData, name: e.target.value})} disabled={isLoading} />
                        <input type="number" required placeholder="Age" className={inputStyle} value={regData.age} onChange={(e) => setRegData({...regData, age: e.target.value})} disabled={isLoading} />
                      </div>
                      <input type="email" required placeholder="Email Address (Required)" className={inputStyle} value={regData.email} onChange={(e) => setRegData({...regData, email: e.target.value})} disabled={isLoading} />
                      <input type="tel" placeholder="Phone Number (Optional)" className={inputStyle} value={regData.phone} onChange={(e) => setRegData({...regData, phone: e.target.value})} disabled={isLoading} />
                      <div className="grid grid-cols-2 gap-6">
                        <input type="password" required placeholder="Backup Password" className={inputStyle} value={regData.backupPass} onChange={(e) => setRegData({...regData, backupPass: e.target.value})} disabled={isLoading} />
                        <input type="password" required placeholder="Confirm Password" className={inputStyle} value={regData.confirmPass} onChange={(e) => setRegData({...regData, confirmPass: e.target.value})} disabled={isLoading} />
                      </div>
                      {authError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center pt-2"><AlertTriangle size={14} className="mr-2" /> {authError}</motion.p>}
                      <button type="submit" disabled={authState !== 'idle' || isLoading} className={`w-full flex items-center justify-center py-4 mt-4 font-black uppercase tracking-[0.2em] text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl ${authState === 'success' ? 'bg-[#9333ea] text-white shadow-[0_0_30px_rgba(168,85,247,0.6)]' : 'bg-[#a855f7] hover:bg-[#9333ea] text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]'}`}>
                        {authState === 'scanning' ? <ScanFace className="animate-pulse text-white" size={18} /> : authState === 'success' ? 'Identity Initialized' : 'Initialize Profile'}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="mt-8 text-center pb-12 lg:pb-0">
                  <button 
                    onClick={() => { 
                      setMode(mode === 'login' ? 'register' : 'login'); 
                      setAuthError(''); 
                      setAuthState('idle');
                      setAdminRequestSent(false);
                    }} 
                    disabled={isLoading} 
                    className={`text-xs uppercase tracking-widest font-bold transition-colors pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed ${isLightMode ? 'text-slate-500 hover:text-slate-900' : 'text-slate-500 hover:text-white'}`}
                  >
                    {mode === 'login' 
                      ? 'Request Network Access (Register)' 
                      : 'Return to Gateway (Login)'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mode === 'register' && authState === 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[60] backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto ${isLightMode ? 'bg-slate-50/90' : 'bg-[#010309]/90'}`}>
            <ShieldCheck size={64} className="text-[#a855f7] mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
            <h2 className={`text-3xl font-black tracking-widest uppercase mb-4 ${textPrimary}`}>Identity Registered</h2>
            <p className={`font-mono text-sm max-w-md text-center mb-8 px-6 leading-relaxed ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>Your cipher code has been transmitted. Please check your email to verify your identity and activate your neural link.</p>
            <p className="text-[#a855f7] text-xs font-mono animate-pulse flex items-center uppercase tracking-widest font-bold">Awaiting Verification <ArrowRight size={14} className="ml-2" /></p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isBooting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }} className="w-full mt-auto flex flex-col">
            <div className="relative z-20 w-full pointer-events-auto border-t border-slate-500/20 bg-black/20 backdrop-blur-md"><Footer isLight={isLightMode} currentRole="guest" /></div>
            <div className="relative z-30 pointer-events-auto"><BottomNav currentRole="guest" /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}