"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  KeySquare, Fingerprint, ShieldAlert, ShieldCheck, 
  User, Mail, Phone, Calendar, Lock, ArrowRight, ScanFace 
} from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sphere, MeshTransmissionMaterial, Sparkles, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Glitch } from '@react-three/postprocessing';
import { GlitchMode } from 'postprocessing';
import * as THREE from 'three';

import CustomCursor from '@/components/CustomCursor';
import BottomNav from '@/components/BottomNav';

// ==========================================
// 1. CINEMATIC 3D VAULT LOGO
// ==========================================
function CinematicCore({ authState, isBooting }: { authState: string, isBooting: boolean }) {
  const coreRef = useRef<THREE.Group>(null);

  // Cinematic Camera Dolly Effect
  useFrame((state, delta) => {
    if (coreRef.current) {
      // Idle spin and scanning hyper-spin
      coreRef.current.rotation.y += delta * (authState === 'scanning' ? 0.8 : 0.1);
      coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      
      // Shift the 3D object to the left when boot sequence finishes
      const targetX = isBooting ? 0 : -3.5;
      coreRef.current.position.x = THREE.MathUtils.lerp(coreRef.current.position.x, targetX, 0.05);
    }
  });

  const getCoreColor = () => {
    if (authState === 'error') return "#ef4444"; // Breach Red
    if (authState === 'success') return "#a855f7"; // Dark Cyber Purple (Matches Nav)
    return "#00f0ff"; // Cinematic Cyan
  };

  return (
    <group ref={coreRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        {/* Core Geometric Anomaly */}
        <Sphere args={[isBooting ? 2 : 1.5, 64, 64]}>
          <MeshTransmissionMaterial 
            backside thickness={0.8} roughness={0.05} ior={1.5}
            color={getCoreColor()} 
            distortion={authState === 'scanning' ? 0.8 : 0.1}
            distortionScale={1}
            temporalDistortion={0}
          />
        </Sphere>
        {/* Abstract Orbiting Nodes */}
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
// 2. MAIN GATEWAY COMPONENT
// ==========================================
export default function AuthGateway() {
  const router = useRouter();
  
  // States
  const [isBooting, setIsBooting] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [authState, setAuthState] = useState<'idle' | 'scanning' | 'error' | 'success'>('idle');

  // Login Form
  const [secretCode, setSecretCode] = useState('');

  // Register Form (Identity Initialization)
  const [regData, setRegData] = useState({
    name: '', email: '', phone: '', age: '', backupPass: '', confirmPass: ''
  });

  // Cinematic Boot Sequence
  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Handle Secret Code Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState('scanning');
    setTimeout(() => {
      // Mock Authentication
      if (secretCode.length === 10) {
        setAuthState('success');
        setTimeout(() => router.push('/'), 1500);
      } else {
        setAuthState('error');
        setTimeout(() => setAuthState('idle'), 2500);
      }
    }, 2000);
  };

  // Handle Identity Initialization (Registration)
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState('scanning');
    setTimeout(() => {
      // Simulate generating the unique 10-char code and routing directly to Dashboard
      setAuthState('success');
      setTimeout(() => router.push('/'), 2500);
    }, 2000);
  };

  // Common Input Style (Now with Tech Purple focus states)
  const inputStyle = "w-full bg-transparent border-b border-slate-800 text-white px-2 py-3 focus:outline-none focus:border-[#a855f7] focus:bg-[#a855f7]/10 transition-all font-mono tracking-widest placeholder-slate-600";

  return (
    <main className="relative min-h-screen bg-[#010309] font-sans cursor-none overflow-hidden flex">
      <CustomCursor />

      {/* 🔥 3D BACKGROUND LAYER (Now Moveable & Flexible) 🔥 */}
      {/* We use pointer-events-auto so the user can drag the 3D Vault! */}
      <div className="absolute inset-0 z-0 pointer-events-auto cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <OrbitControls enableZoom={true} enablePan={true} dampingFactor={0.05} />
          <ambientLight intensity={0.1} />
          <directionalLight position={[5, 5, -5]} intensity={2} color="#00f0ff" />
          <Sparkles count={200} scale={15} size={1} speed={0.2} color={authState === 'success' ? "#a855f7" : "#00f0ff"} opacity={0.3} />
          <CinematicCore authState={authState} isBooting={isBooting} />
          <EffectComposer>
            <Bloom luminanceThreshold={0.1} mipmapBlur intensity={isBooting ? 3.0 : 1.5} radius={0.8} />
            <Glitch 
              active={authState === 'error'} 
              delay={new THREE.Vector2(0, 0)} duration={new THREE.Vector2(0.1, 0.3)} 
              strength={new THREE.Vector2(0.2, 0.6)} mode={GlitchMode.CONSTANT_MILD} 
            />
          </EffectComposer>
        </Canvas>
      </div>

      {/* FOREGROUND UI LAYER (SPLIT SCREEN) */}
      <AnimatePresence>
        {!isBooting && (
          // The container is pointer-events-none so it doesn't block the 3D background behind it
          <div className="relative z-10 w-full flex flex-col lg:flex-row h-screen pointer-events-none">
            
            {/* Left Side (Empty space for the 3D Logo, contains branding) */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}
              className="hidden lg:flex w-1/2 flex-col justify-between p-16"
            >
              <div className="text-cyan-500/50 font-mono text-xs tracking-[0.3em] uppercase">
                System Gateway // Build 9.0.4
              </div>
              <div>
                <h1 className="text-6xl font-black text-white tracking-tighter mb-2">
                  Digit CSxPEDIA<span className="text-cyan-400">.</span>
                </h1>
                <p className="text-slate-500 font-light max-w-sm">
                  Encrypted biometric spatial matrix. Access requires authorized cryptographic handshake.
                </p>
              </div>
            </motion.div>

            {/* Right Side (The Minimalist Login/Register Form) */}
            {/* We add pointer-events-auto ONLY to this panel so the form is clickable */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, type: 'spring', damping: 20 }}
              className="w-full lg:w-1/2 h-full flex items-center justify-center p-8 lg:p-24 bg-gradient-to-l from-[#010309] via-[#010309]/90 to-transparent pointer-events-auto"
            >
              <div className="w-full max-w-md">
                
                {/* Form Header */}
                <div className="mb-12 text-center lg:text-left">
                  <h2 className="text-3xl font-bold text-white tracking-wide mb-2">
                    {mode === 'login' ? 'Access CSxPEDIA' : 'Initialize Identity'}
                  </h2>
                  <p className="text-slate-500 text-sm">
                    {mode === 'login' 
                      ? 'Enter your 10-character Secret Member Code.' 
                      : 'Establish your parameters for network access.'}
                  </p>
                </div>

                {/* FORM TOGGLE ANIMATION */}
                <AnimatePresence mode="wait">
                  
                  {/* ===================== LOGIN MODE ===================== */}
                  {mode === 'login' && (
                    <motion.form 
                      key="login" onSubmit={handleLogin}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <div className="relative group">
                        <KeySquare size={16} className={`absolute right-2 top-1/2 -translate-y-1/2 ${authState === 'error' ? 'text-red-500' : 'text-slate-600'}`} />
                        <input 
                          type="text" required maxLength={10} placeholder="Secret Code (e.g. AEX4921B7C)" 
                          disabled={authState !== 'idle'} value={secretCode} onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                          className={`${inputStyle} ${authState === 'error' ? 'border-red-500/50 text-red-400 bg-red-950/10' : ''}`} 
                        />
                      </div>

                      {/* DARK PURPLE SUCCESS BUTTON */}
                      {/* TECH PURPLE LOGIN BUTTON */}
                      <button 
                        type="submit" disabled={authState !== 'idle'}
                        className={`w-full flex items-center justify-center py-4 font-black uppercase tracking-[0.2em] text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          authState === 'success' 
                            ? 'bg-[#9333ea] text-white shadow-[0_0_30px_rgba(168,85,247,0.6)]' 
                            : 'bg-[#a855f7] hover:bg-[#9333ea] text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]'
                        }`}
                      >
                        {authState === 'scanning' ? <ScanFace className="animate-pulse text-white" size={18} /> : authState === 'error' ? 'Access Denied' : authState === 'success' ? 'Link Established' : 'Execute Login'}
                      </button>
                    </motion.form>
                  )}

                  {/* ===================== REGISTER MODE ===================== */}
                  {mode === 'register' && (
                    <motion.form 
                      key="register" onSubmit={handleRegister}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-2 gap-6">
                        <input type="text" required placeholder="Full Name" className={inputStyle} value={regData.name} onChange={(e) => setRegData({...regData, name: e.target.value})} />
                        <input type="number" required placeholder="Age" className={inputStyle} value={regData.age} onChange={(e) => setRegData({...regData, age: e.target.value})} />
                      </div>
                      
                      <input type="email" required placeholder="Email Address (Verification Required)" className={inputStyle} value={regData.email} onChange={(e) => setRegData({...regData, email: e.target.value})} />
                      <input type="tel" placeholder="Phone Number (Optional)" className={inputStyle} value={regData.phone} onChange={(e) => setRegData({...regData, phone: e.target.value})} />
                      
                      <div className="grid grid-cols-2 gap-6">
                        <input type="password" required placeholder="Backup Password" className={inputStyle} value={regData.backupPass} onChange={(e) => setRegData({...regData, backupPass: e.target.value})} />
                        <input type="password" required placeholder="Confirm Password" className={inputStyle} value={regData.confirmPass} onChange={(e) => setRegData({...regData, confirmPass: e.target.value})} />
                      </div>

                      {/* Code Logic Hint (Now with Tech Purple Icon) */}
                      <div className="p-4 bg-cyan-950/20 border border-cyan-900/30 rounded-lg flex items-start space-x-3 mt-4">
                        <Fingerprint size={16} className="text-[#a855f7] mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-cyan-200/60 font-mono leading-relaxed">
                          Your Secret Member Code will be cryptographically generated upon initialization using partials of your Name, Phone, and Backup Hash.
                        </p>
                      </div>

                      {/* TECH PURPLE REGISTER BUTTON */}
                      <button 
                        type="submit" disabled={authState !== 'idle'}
                        className={`w-full flex items-center justify-center py-4 font-black uppercase tracking-[0.2em] text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          authState === 'success' 
                            ? 'bg-[#9333ea] text-white shadow-[0_0_30px_rgba(168,85,247,0.6)]' 
                            : 'bg-[#a855f7] hover:bg-[#9333ea] text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]'
                        }`}
                      >
                        {authState === 'scanning' ? <ScanFace className="animate-pulse text-white" size={18} /> : authState === 'success' ? 'Identity Initialized' : 'Initialize Profile'}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Form Mode Toggle */}
                <div className="mt-8 text-center">
                  <button 
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
                  >
                    {mode === 'login' ? 'Request Network Access (Register)' : 'Return to Gateway (Login)'}
                  </button>
                </div>

              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* Full Screen Scanning / Success Overlay for Registration (DARK PURPLE THEME) */}
      <AnimatePresence>
        {mode === 'register' && authState === 'success' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-[#010309]/90 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto"
          >
            <ShieldCheck size={64} className="text-[#a855f7] mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
            <h2 className="text-2xl font-bold text-white tracking-widest uppercase mb-2">Identity Registered</h2>
            <p className="text-slate-400 font-mono mb-8 text-sm">Awaiting cryptographic email verification.</p>
            
            <p className="text-[#a855f7] text-xs font-mono animate-pulse flex items-center">
              Routing to Secure Sector <ArrowRight size={14} className="ml-2" />
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restored Navigation Matrix */}
      <BottomNav currentRole="guest" />
    </main>
  );
}