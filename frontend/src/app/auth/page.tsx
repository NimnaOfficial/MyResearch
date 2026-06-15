"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { KeySquare, ShieldCheck, AlertTriangle, ScanFace, ArrowRight } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshTransmissionMaterial, Sparkles, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Glitch } from '@react-three/postprocessing';
import { GlitchMode } from 'postprocessing';
import * as THREE from 'three';

import CustomCursor from '@/components/CustomCursor';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
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
        <Sphere args={[isBooting ? 2 : 1.5, 64, 64]}>
          <MeshTransmissionMaterial backside thickness={0.8} roughness={0.05} ior={1.5} color={getCoreColor()} distortion={authState === 'scanning' ? 0.8 : 0.1} distortionScale={1} temporalDistortion={0} />
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
  
  const [isLightMode, setIsLightMode] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [authState, setAuthState] = useState<'idle' | 'scanning' | 'error' | 'success'>('idle');
  const [authError, setAuthError] = useState(''); 

  const [secretCode, setSecretCode] = useState('');
  const [regData, setRegData] = useState({ name: '', email: '', phone: '', age: '', backupPass: '', confirmPass: '' });

  // 🔥 THE UI VISUAL LOCK
  const [isLoading, setIsLoading] = useState(false);
  // 🔥 THE INSTANT SYNCHRONOUS HARD-LOCK (Prevents 409 Ghost Submissions)
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => setIsBooting(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Instant Hard Lock
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);

    setAuthState('scanning'); 
    setAuthError('');

    try {
      const response = await fetch('https://myresearch-bclz.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretCode })
      });
      const data = await response.json();

      if (response.ok) {
        setAuthState('success');
        localStorage.setItem('matrix_token', data.token);
        localStorage.setItem('userRole', 'user');
        setTimeout(() => router.push('/'), 1500);
      } else {
        setAuthState('error'); 
        setAuthError(data.message || 'Invalid Cryptographic Handshake');
        setTimeout(() => setAuthState('idle'), 3000);
      }
    } catch (err) {
      setAuthState('error'); 
      setAuthError('Matrix connection failed. Check server status.');
      setTimeout(() => setAuthState('idle'), 3000);
    } finally {
      setIsLoading(false);
      // Wait 500ms before releasing the hard lock to prevent bounce clicks
      setTimeout(() => { isSubmittingRef.current = false; }, 500);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Instant Hard Lock
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);

    setAuthState('scanning'); 
    setAuthError('');

    if (regData.backupPass !== regData.confirmPass) {
      setAuthState('error'); 
      setAuthError('Backup Passwords do not match!');
      setTimeout(() => setAuthState('idle'), 3000); 
      setIsLoading(false);
      isSubmittingRef.current = false; // Release lock early
      return;
    }

    try {
      const response = await fetch('https://myresearch-bclz.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regData.email, password: regData.backupPass, fullName: regData.name, age: parseInt(regData.age) || 0, phone: regData.phone })
      });
      const data = await response.json();

      if (response.ok) {
        setAuthState('success');
      } else {
        setAuthState('error'); 
        setAuthError(data.message || 'Initialization Failed');
        setTimeout(() => setAuthState('idle'), 3000);
      }
    } catch (err) {
      setAuthState('error'); 
      setAuthError('Matrix connection failed. Check server status.');
      setTimeout(() => setAuthState('idle'), 3000);
    } finally {
      setIsLoading(false);
      setTimeout(() => { isSubmittingRef.current = false; }, 500);
    }
  };

  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const bgPrimary = isLightMode ? "bg-slate-50" : "bg-[#010309]";
  const inputStyle = `w-full bg-transparent border-b px-2 py-3 focus:outline-none focus:border-[#a855f7] transition-all font-mono tracking-widest ${isLightMode ? 'border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-[#a855f7]/5' : 'border-slate-800 text-white placeholder-slate-600 focus:bg-[#a855f7]/10'}`;

  if (!isMounted) return <div className={`min-h-screen ${bgPrimary}`} />;

  return (
    <main className={`relative min-h-screen flex flex-col font-sans overflow-x-hidden transition-colors duration-1000 ${bgPrimary}`}>
      <CustomCursor />
      <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />

      {/* 3D BACKGROUND LAYER */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} dampingFactor={0.05} />
          <ambientLight intensity={isLightMode ? 0.5 : 0.1} />
          <directionalLight position={[5, 5, -5]} intensity={isLightMode ? 3 : 2} color={isLightMode ? "#0284c7" : "#00f0ff"} />
          <Sparkles count={200} scale={15} size={1} speed={0.2} color={authState === 'success' ? "#a855f7" : (isLightMode ? "#0284c7" : "#00f0ff")} opacity={isLightMode ? 0.15 : 0.3} />
          <CinematicCore authState={authState} isBooting={isBooting} isLightMode={isLightMode} />
          <EffectComposer>
            <Bloom luminanceThreshold={isLightMode ? 0.5 : 0.1} mipmapBlur intensity={isBooting ? 3.0 : 1.5} radius={0.8} />
            <Glitch active={authState === 'error'} delay={new THREE.Vector2(0, 0)} duration={new THREE.Vector2(0.1, 0.3)} strength={new THREE.Vector2(0.2, 0.6)} mode={GlitchMode.CONSTANT_MILD} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* FOREGROUND UI LAYER */}
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

            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, type: 'spring', damping: 20 }} className={`w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 pointer-events-auto transition-colors duration-1000 ${isLightMode ? 'bg-gradient-to-l from-slate-50 via-slate-50/90 to-transparent' : 'bg-gradient-to-l from-[#010309] via-[#010309]/90 to-transparent'}`}>
              <div className="w-full max-w-md pt-20 lg:pt-0">
                
                <div className="mb-10 text-center lg:text-left">
                  <h2 className={`text-3xl font-bold tracking-wide mb-2 ${textPrimary}`}>{mode === 'login' ? 'Access Matrix' : 'Initialize Identity'}</h2>
                  <p className={isLightMode ? 'text-slate-500 text-sm' : 'text-slate-400 text-sm'}>{mode === 'login' ? 'Enter your 10-character Secret Member Code.' : 'Establish your parameters for network access.'}</p>
                </div>

                <AnimatePresence mode="wait">
                  {mode === 'login' && (
                    <motion.form key="login" onSubmit={handleLogin} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                      <div className="relative group">
                        <KeySquare size={16} className={`absolute right-2 top-1/2 -translate-y-1/2 ${authState === 'error' ? 'text-red-500' : (isLightMode ? 'text-slate-400' : 'text-slate-600')}`} />
                        <input type="text" required maxLength={10} placeholder="Secret Code (e.g. AEX4921B7C)" disabled={authState !== 'idle' || isLoading} value={secretCode} onChange={(e) => setSecretCode(e.target.value.toUpperCase())} className={`${inputStyle} ${authState === 'error' ? 'border-red-500/50 text-red-500 bg-red-500/10' : ''}`} />
                      </div>
                      {authError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center pt-2"><AlertTriangle size={14} className="mr-2" /> {authError}</motion.p>}
                      <button type="submit" disabled={authState !== 'idle' || isLoading} className={`w-full flex items-center justify-center py-4 font-black uppercase tracking-[0.2em] text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl ${authState === 'success' ? 'bg-[#9333ea] text-white shadow-[0_0_30px_rgba(168,85,247,0.6)]' : 'bg-[#a855f7] hover:bg-[#9333ea] text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]'}`}>
                        {authState === 'scanning' ? <ScanFace className="animate-pulse text-white" size={18} /> : authState === 'error' ? 'Access Denied' : authState === 'success' ? 'Link Established' : 'Execute Login'}
                      </button>
                    </motion.form>
                  )}

                  {mode === 'register' && (
                    <motion.form key="register" onSubmit={handleRegister} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
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
                  <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setAuthError(''); setAuthState('idle'); }} disabled={isLoading} className={`text-xs uppercase tracking-widest font-bold transition-colors pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed ${isLightMode ? 'text-slate-500 hover:text-slate-900' : 'text-slate-500 hover:text-white'}`}>
                    {mode === 'login' ? 'Request Network Access (Register)' : 'Return to Gateway (Login)'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY FOR SUCCESSFUL REGISTRATION */}
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