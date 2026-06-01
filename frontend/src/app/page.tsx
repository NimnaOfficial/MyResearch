"use client";
import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Box, Cylinder, Sphere, TorusKnot, Sparkles, MeshDistortMaterial, PresentationControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { 
  User, Settings, Star, LogOut, LayoutDashboard
} from 'lucide-react'; 
import Link from 'next/link';

import BottomNav from '@/components/BottomNav';
import CustomCursor from '@/components/CustomCursor';
import NextGenButton from '@/components/NextGenButton';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';
import BootSequence from '@/components/BootSequence';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// 1. MASSIVE DIGITAL TECH OBJECTS (RESTORED)
// ==========================================

function DigitalLaptop({ scale }: { scale: number }) {
  return (
    <group scale={scale} position={[0, -0.2, 0]}>
      <Box args={[2.4, 0.08, 1.8]} position={[0, 0, 0]} material={new THREE.MeshPhysicalMaterial({ color: "#020813", metalness: 0.9, roughness: 0.1 })} />
      <Box args={[2.1, 0.081, 0.8]} position={[0, 0, -0.2]} material={new THREE.MeshStandardMaterial({ color: "#000", wireframe: true, emissive: "#0ea5e9", emissiveIntensity: 0.2 })} />
      <Box args={[0.8, 0.082, 0.4]} position={[0, 0, 0.55]} material={new THREE.MeshStandardMaterial({ color: "#0f172a" })} />
      <group position={[0, 0.04, -0.9]} rotation={[-0.2, 0, 0]}>
        <Box args={[2.4, 1.6, 0.05]} position={[0, 0.8, 0.025]} material={new THREE.MeshPhysicalMaterial({ color: "#020813", metalness: 0.9 })} />
        <Box args={[2.3, 1.5, 0.01]} position={[0, 0.8, 0.055]} material={new THREE.MeshStandardMaterial({ color: "#000", emissive: "#00f0ff", emissiveIntensity: 1.5, wireframe: true })} />
      </group>
      <Sparkles count={40} scale={2} size={1.5} color="#00f0ff" position={[0, 0.8, -0.5]} />
    </group>
  );
}

function DigitalFlask({ scale }: { scale: number }) {
  return (
    <group scale={scale} position={[0, -0.8, 0]}>
      <Cylinder args={[0.3, 1.2, 1.8, 32]} position={[0, 0.9, 0]}>
        <MeshTransmissionMaterial backside samples={4} thickness={0.5} chromaticAberration={0.1} color="#0ea5e9" distortionScale={0} temporalDistortion={0} />
      </Cylinder>
      <Cylinder args={[0.3, 0.3, 0.8, 32]} position={[0, 2.2, 0]}>
        <MeshTransmissionMaterial backside samples={4} thickness={0.5} chromaticAberration={0.1} color="#0ea5e9" distortionScale={0} temporalDistortion={0} />
      </Cylinder>
      <Cylinder args={[0.35, 0.35, 0.1, 32]} position={[0, 2.65, 0]} material={new THREE.MeshPhysicalMaterial({ color: "#e2e8f0" })} />
      <Cylinder args={[0.4, 1.15, 1.2, 32]} position={[0, 0.65, 0]} material={new THREE.MeshStandardMaterial({ color: "#000", emissive: "#00f0ff", emissiveIntensity: 2, wireframe: true })} />
      <Sparkles count={50} scale={1.5} size={3} speed={2} color="#ffffff" position={[0, 1.5, 0]} />
    </group>
  );
}

function DataHelix({ scale }: { scale: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => { if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.5; });
  const strands = [];
  for(let i = 0; i < 12; i++) {
    const y = (i - 5.5) * 0.3;
    const rot = i * 0.4;
    strands.push(
      <group key={i} position={[0, y, 0]} rotation={[0, rot, 0]}>
        <Sphere args={[0.15, 16, 16]} position={[0.8, 0, 0]} material={new THREE.MeshStandardMaterial({ color: "#00f0ff", emissive: "#00f0ff", emissiveIntensity: 2 })} />
        <Sphere args={[0.15, 16, 16]} position={[-0.8, 0, 0]} material={new THREE.MeshStandardMaterial({ color: "#4f46e5", emissive: "#4f46e5", emissiveIntensity: 2 })} />
        <Cylinder args={[0.02, 0.02, 1.6]} rotation={[0, 0, Math.PI/2]} material={new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.3 })} />
      </group>
    );
  }
  return <group scale={scale} ref={ref}>{strands}</group>;
}

function DigitalLedgerBook({ scale }: { scale: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => { if (ref.current) ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2; });
  return (
    <group scale={scale} ref={ref} rotation={[0.4, 0, 0]}>
      <Box args={[1.8, 0.05, 2.4]} position={[-0.9, 0, 0]} rotation={[0, 0, 0.1]} material={new THREE.MeshPhysicalMaterial({ color: "#020617", metalness: 1, roughness: 0.1, clearcoat: 1 })} />
      <Box args={[1.8, 0.05, 2.4]} position={[0.9, 0, 0]} rotation={[0, 0, -0.1]} material={new THREE.MeshPhysicalMaterial({ color: "#020617", metalness: 1, roughness: 0.1, clearcoat: 1 })} />
      <Box args={[1.7, 0.1, 2.3]} position={[-0.85, 0.1, 0]} rotation={[0, 0, 0.1]} material={new THREE.MeshStandardMaterial({ color: "#000", emissive: "#00f0ff", emissiveIntensity: 1.5, wireframe: true })} />
      <Box args={[1.7, 0.1, 2.3]} position={[0.85, 0.1, 0]} rotation={[0, 0, -0.1]} material={new THREE.MeshStandardMaterial({ color: "#000", emissive: "#00f0ff", emissiveIntensity: 1.5, wireframe: true })} />
      <Cylinder args={[0.15, 0.15, 2.4, 16]} rotation={[Math.PI/2, 0, 0]} position={[0, -0.05, 0]} material={new THREE.MeshStandardMaterial({ color: "#0ea5e9" })} />
    </group>
  );
}

function CPUMicrochip({ scale }: { scale: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => { if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.2; });
  return (
    <group scale={scale} ref={ref} rotation={[0.6, 0, 0]}>
      <Box args={[3, 0.1, 3]} material={new THREE.MeshPhysicalMaterial({ color: "#020617", metalness: 0.9, roughness: 0.2 })} />
      <Box args={[1.5, 0.12, 1.5]} material={new THREE.MeshStandardMaterial({ color: "#0f172a" })} />
      <Box args={[1.2, 0.14, 1.2]} material={new THREE.MeshStandardMaterial({ color: "#000", emissive: "#4f46e5", emissiveIntensity: 3, wireframe: true })} />
      <Sparkles count={60} scale={2.5} size={2} color="#00f0ff" position={[0, 0.5, 0]} />
    </group>
  );
}

function QuantumPortal({ scale }: { scale: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => { 
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.3;
      ref.current.rotation.y = state.clock.elapsedTime * 0.4;
    }
  });
  return (
    <group scale={scale} ref={ref}>
      <TorusKnot args={[1, 0.3, 128, 16]} material={new THREE.MeshStandardMaterial({ color: "#000", emissive: "#a855f7", emissiveIntensity: 1.5, wireframe: true })} />
      <Sphere args={[0.6, 32, 32]} material={new THREE.MeshStandardMaterial({ color: "#000", emissive: "#00f0ff", emissiveIntensity: 3, wireframe: true })} />
      <Sparkles count={100} scale={4} size={3} color="#a855f7" />
    </group>
  );
}

// ==========================================
// 2. THEME ENGINE & LIGHTING
// ==========================================

function SceneLighting({ isLight }: { isLight: boolean }) {
  useFrame((state, delta) => {
    const targetBg = new THREE.Color(isLight ? '#f8fafc' : '#01030a');
    if (state.scene.background instanceof THREE.Color) {
      state.scene.background.lerp(targetBg, 4 * delta);
    }
  });

  return (
    <>
      <ambientLight intensity={isLight ? 0.8 : 0.2} />
      <directionalLight position={[5, 10, 5]} intensity={isLight ? 2 : 4} color={isLight ? "#3b82f6" : "#00f0ff"} />
      <directionalLight position={[-5, -10, -5]} intensity={2} color={isLight ? "#94a3b8" : "#4f46e5"} />
    </>
  );
}

function SystemEngine({ scrollData }: { scrollData: { section: number, velocity: number } }) {
  const engineGroup = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const [idleState, setIdleState] = useState(0);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scrollData.section === 0) {
      interval = setInterval(() => setIdleState(prev => (prev + 1) % 3), 4000);
    }
    return () => clearInterval(interval);
  }, [scrollData.section]);

  useFrame((state, delta) => {
    if (engineGroup.current) {
      const targetY = scrollData.section === 0 ? 0.8 : 0;
      let targetX = 0;
      if (scrollData.section === 1) targetX = -2.5;
      if (scrollData.section === 2) targetX = 2.5;
      if (scrollData.section === 3) targetX = -2.5;
      
      const smoothSpeed = 4.0; 
      engineGroup.current.position.y = THREE.MathUtils.damp(engineGroup.current.position.y, targetY, smoothSpeed, delta);
      engineGroup.current.position.x = THREE.MathUtils.damp(engineGroup.current.position.x, targetX, smoothSpeed, delta);

      const mouseX = (state.pointer.x * Math.PI) / 6;
      const mouseY = (state.pointer.y * Math.PI) / 6;
      engineGroup.current.rotation.y = THREE.MathUtils.damp(engineGroup.current.rotation.y, mouseX + Math.sin(state.clock.elapsedTime * 0.3) * 0.1, smoothSpeed, delta);
      engineGroup.current.rotation.x = THREE.MathUtils.damp(engineGroup.current.rotation.x, -mouseY, smoothSpeed, delta);
    }

    if (liquidRef.current) {
      const isScrolling = Math.abs(scrollData.velocity) > 5;
      const targetStretchY = isScrolling ? 2.5 + Math.abs(scrollData.velocity * 0.08) : 1;
      liquidRef.current.scale.y = THREE.MathUtils.damp(liquidRef.current.scale.y, targetStretchY, 5, delta);
    }
  });

  const isScrolling = Math.abs(scrollData.velocity) > 5;
  const isIdle = scrollData.section === 0 && !isScrolling;
  
  const baseScale = 8.5; 
  const transitionSpeed = 0.08; 

  const s0 = THREE.MathUtils.lerp(0, isIdle && idleState === 0 ? baseScale : 0, transitionSpeed);
  const s1 = THREE.MathUtils.lerp(0, isIdle && idleState === 1 ? baseScale : 0, transitionSpeed);
  const s2 = THREE.MathUtils.lerp(0, isIdle && idleState === 2 ? baseScale : 0, transitionSpeed);
  
  const researchScale = THREE.MathUtils.lerp(0, scrollData.section === 1 && !isScrolling ? baseScale : 0, transitionSpeed);
  const projectScale = THREE.MathUtils.lerp(0, scrollData.section === 2 && !isScrolling ? baseScale : 0, transitionSpeed);
  const contactScale = THREE.MathUtils.lerp(0, scrollData.section === 3 && !isScrolling ? baseScale : 0, transitionSpeed); 

  const liquidScale = THREE.MathUtils.lerp(0, isScrolling ? baseScale * 1.5 : 0, transitionSpeed);

  return (
    <PresentationControls global config={{ mass: 2, tension: 300 }} snap={{ mass: 4, tension: 800 }} rotation={[0, 0, 0]} polar={[-0.4, 0.4]} azimuth={[-1, 1]}>
      <group ref={engineGroup}>
        <mesh ref={liquidRef} scale={liquidScale} position={[0, isScrolling ? 0 : 0.5, 0]}>
          <sphereGeometry args={[1, 128, 128]} />
          <MeshDistortMaterial color="#000" emissive="#0ea5e9" emissiveIntensity={3} distort={0.8} speed={5} wireframe={true} />
        </mesh>
        <DigitalLaptop scale={s0} />
        <DigitalFlask scale={s1} />
        <DataHelix scale={s2} />
        <DigitalLedgerBook scale={researchScale} />
        <CPUMicrochip scale={projectScale} />
        <QuantumPortal scale={contactScale} />
      </group>
    </PresentationControls>
  );
}

// ==========================================
// 3. MASTER PAGE ASSEMBLY
// ==========================================

export default function WelcomePage() {
  const router = useRouter(); 
  const [scrollData, setScrollData] = useState({ section: 0, velocity: 0 });
  const [isLightMode, setIsLightMode] = useState(false);
  const lastScrollY = useRef(0);

  // 🔹 AUTHENTICATION STATE
  const [hasToken, setHasToken] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [timeState, setTimeState] = useState({ time: "", date: "" });

  const [isSystemBooting, setIsSystemBooting] = useState(false); 
  
  useEffect(() => {
    // Check Auth
    setHasToken(!!localStorage.getItem('matrix_token'));

    // Boot Logic
    const hasBooted = sessionStorage.getItem('csxpedia_booted');
    if (!hasBooted) {
      setIsSystemBooting(true); 
      const failsafe = setTimeout(() => {
        setIsSystemBooting(false);
        sessionStorage.setItem('csxpedia_booted', 'true');
      }, 5500); 
      return () => clearTimeout(failsafe);
    }
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeState({ time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), date: now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) });
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBootComplete = () => {
    setIsSystemBooting(false);
    sessionStorage.setItem('csxpedia_booted', 'true');
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('matrix_token');
    setHasToken(false);
    router.push('/auth');
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const windowHeight = window.innerHeight;
      const section = Math.round(currentScroll / windowHeight);
      const velocity = currentScroll - lastScrollY.current;
      setScrollData({ section, velocity });
      lastScrollY.current = currentScroll;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-600" : "text-slate-400";
  const accentText = isLightMode ? "text-blue-600" : "text-cyan-400";
  const glassBg = isLightMode ? "bg-white/90 border-slate-200 shadow-2xl" : "bg-[#010308]/90 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]";
  
  const cardCyan = isLightMode ? "bg-white/60 border-white/50 shadow-[0_20px_60px_rgba(0,0,0,0.08)]" : "bg-[#030b1c]/80 border-cyan-500/50 shadow-[0_0_60px_rgba(34,211,238,0.2)]";
  const cardIndigo = isLightMode ? "bg-white/60 border-white/50 shadow-[0_20px_60px_rgba(0,0,0,0.08)]" : "bg-[#030b1c]/80 border-indigo-500/50 shadow-[0_0_60px_rgba(79,70,229,0.2)]";
  const cardPurple = isLightMode ? "bg-white/60 border-white/50 shadow-[0_20px_60px_rgba(0,0,0,0.08)]" : "bg-[#030b1c]/80 border-purple-500/50 shadow-[0_0_60px_rgba(168,85,247,0.2)]";

  return (
    <main className={`relative transition-colors duration-700 font-sans cursor-none overflow-x-hidden ${isLightMode ? 'bg-slate-50' : 'bg-[#01030a]'}`}>
      
      <AnimatePresence>
        {isSystemBooting && <BootSequence onComplete={handleBootComplete} />}
      </AnimatePresence>
      
      <CustomCursor />
      <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />

      {/* ==========================================
          HEADER (RESTORED PROFILE ICON FOR AUTHENTICATED USERS)
          ========================================== */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-6 px-6 lg:px-12 flex justify-end items-start pointer-events-none">
        {hasToken && (
          <div className="flex items-center space-x-4 pointer-events-auto">
            <div className="relative" onMouseEnter={() => setIsProfileHovered(true)} onMouseLeave={() => setIsProfileHovered(false)}>
              <div className={`flex items-center space-x-4 px-6 py-2.5 rounded-full backdrop-blur-xl cursor-pointer transition-colors duration-700 ${glassBg}`}>
                <span className={`font-mono text-xs tracking-widest hidden sm:block transition-colors duration-500 text-cyan-400`}>
                  {timeState.date} <span className={textSecondary}>|</span> {timeState.time}
                </span>
                <div className={`w-px h-4 hidden sm:block ${isLightMode ? 'bg-slate-300' : 'bg-slate-800'}`} />
                <div className="flex items-center space-x-3 group">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-[1.5px] transition-all duration-500">
                    <div className={`w-full h-full rounded-full flex items-center justify-center ${isLightMode ? 'bg-white' : 'bg-[#010205]'}`}>
                      <User size={12} className={textPrimary} />
                    </div>
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest transition-colors ${textPrimary} group-hover:text-cyan-400`}>Nima</span>
                </div>
              </div>

              <AnimatePresence>
                {isProfileHovered && (
                  <motion.div initial={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }} exit={{ opacity: 0, y: 15, scale: 0.9, rotateX: -20 }} transition={{ type: "spring", stiffness: 100, damping: 20 }} className={`absolute right-0 mt-3 w-56 rounded-2xl backdrop-blur-2xl p-2 flex flex-col transform-gpu shadow-2xl ${glassBg}`}>
                    <Link href="/dashboard" className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${isLightMode ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/5'}`}>
                      <LayoutDashboard size={14} className="mr-3 text-cyan-400" /> Personal Matrix
                    </Link>
                    <div className={`h-px w-full my-1 ${isLightMode ? 'bg-slate-200' : 'bg-slate-800/50'}`} />
                    <button type="button" aria-label="Terminate Link" onClick={handleLogout} className={`flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 rounded-xl transition-all group ${isLightMode ? 'hover:bg-red-50' : 'hover:bg-red-500/10'}`}>
                      <LogOut size={14} className="mr-3 text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" /> Terminate Link
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <div className={`fixed inset-0 z-0 pointer-events-none transition-all duration-1000`}>
        <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
          <color attach="background" args={['#01030a']} />
          <SceneLighting isLight={isLightMode} />
          <Sparkles count={600} scale={20} size={1.5} speed={0.4} opacity={isLightMode ? 0.2 : 0.6} color={isLightMode ? "#3b82f6" : "#00f0ff"} />
          <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
            <SystemEngine scrollData={scrollData} />
          </Float>
          <EffectComposer>
            <Bloom luminanceThreshold={isLightMode ? 0.8 : 0.1} mipmapBlur intensity={isLightMode ? 1.0 : 3} radius={0.9} />
          </EffectComposer>
        </Canvas>
      </div>

      <div className={`relative z-10 transition-all duration-1000 pointer-events-none`}>
        {/* SEC. 0: Added pb-40 to prevent collision with the bottom nav bar */}
        <section className="h-screen flex flex-col items-center justify-end pb-40 px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5, delay: 0.5 }} className="max-w-4xl text-center">
            <h1 className={`text-4xl md:text-5xl font-black tracking-tight mb-3 transition-colors duration-500 ${textPrimary} drop-shadow-[0_0_40px_rgba(34,211,238,0.3)]`}>
              Engineering <span className={`${accentText} font-light italic`}>Intelligence.</span>
            </h1>
            <p className={`text-sm md:text-base font-light tracking-wide max-w-lg mx-auto mb-10 transition-colors duration-500 ${textSecondary}`}>
              A comprehensive repository of data science research, algorithmic structures, and advanced spatial web integrations.
            </p>
            <div className="flex flex-col items-center space-y-3 opacity-70">
              <span className={`text-[10px] uppercase tracking-[0.4em] font-bold transition-colors duration-500 ${accentText}`}>Initialize Sequence</span>
              <motion.div animate={{ y: [0, 15, 0], opacity: [0.2, 1, 0.2] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className={`w-[2px] h-12 bg-gradient-to-b ${isLightMode ? 'from-blue-500' : 'from-cyan-400'} to-transparent shadow-[0_0_20px_rgba(34,211,238,1)]`} />
            </div>
          </motion.div>
        </section>

        {/* SEC. 1: DYNAMIC RESEARCH/EXPLORE ACCESS */}
        <section className="h-screen flex flex-col items-end justify-center px-10 md:px-32">
          <motion.div initial={{ opacity: 0, x: 100, rotateY: 10 }} whileInView={{ opacity: 1, x: 0, rotateY: 0 }} viewport={{ once: false, amount: 0.4 }} transition={{ type: "spring", stiffness: 100, damping: 20 }} className={`max-w-xl text-right pointer-events-auto backdrop-blur-2xl p-12 rounded-3xl border transition-all duration-500 ${cardCyan}`}>
            <h2 className={`text-4xl font-bold mb-6 transition-colors duration-500 ${textPrimary}`}>
              {hasToken ? 'Research & Data Cores' : 'Public Exploration'}
            </h2>
            <p className={`font-light leading-relaxed mb-10 text-lg transition-colors duration-500 ${textSecondary}`}>
              {hasToken 
                ? 'Access your highly classified data science research and analytical models.' 
                : 'Explore publicly available algorithmic structures. Advanced data access requires authorization.'}
            </p>
            <div className="flex justify-end pointer-events-auto" onClick={() => router.push(hasToken ? '/research' : '/explore')}>
              <NextGenButton>{hasToken ? 'Access Research Hub' : 'Explore Public Data'}</NextGenButton>
            </div>
          </motion.div>
        </section>

        {/* SEC. 2: PROTECTED PROJECTS ACCESS */}
        <section className="h-screen flex flex-col items-start justify-center px-10 md:px-32">
          <motion.div initial={{ opacity: 0, x: -100, rotateY: -10 }} whileInView={{ opacity: 1, x: 0, rotateY: 0 }} viewport={{ once: false, amount: 0.4 }} transition={{ type: "spring", stiffness: 100, damping: 20 }} className={`max-w-xl text-left pointer-events-auto backdrop-blur-2xl p-12 rounded-3xl border transition-all duration-500 ${cardIndigo}`}>
            <h2 className={`text-4xl font-bold mb-6 transition-colors duration-500 ${textPrimary}`}>Project Pipelines</h2>
            <p className={`font-light leading-relaxed mb-10 text-lg transition-colors duration-500 ${textSecondary}`}>
              Analyze deployed architectures and active system nodes. Available strictly for authorized architectural review and system monitoring.
            </p>
            <div className="pointer-events-auto" onClick={() => router.push(hasToken ? '/projects' : '/auth')}>
              <NextGenButton>{hasToken ? 'View Architectures' : 'Authenticate for Access'}</NextGenButton>
            </div>
          </motion.div>
        </section>

        {/* SEC. 3: CONTACT ACCESS */}
        <section className="h-[100vh] flex flex-col items-end justify-center px-10 md:px-32 pb-32">
          <motion.div initial={{ opacity: 0, x: 100, rotateY: 10 }} whileInView={{ opacity: 1, x: 0, rotateY: 0 }} viewport={{ once: false, amount: 0.4 }} transition={{ type: "spring", stiffness: 100, damping: 20 }} className={`max-w-xl text-right pointer-events-auto backdrop-blur-2xl p-12 rounded-3xl border transition-all duration-500 ${cardPurple}`}>
            <h2 className={`text-4xl font-bold mb-6 transition-colors duration-500 ${textPrimary}`}>Transmission</h2>
            <p className={`font-light leading-relaxed mb-10 text-lg transition-colors duration-500 ${textSecondary}`}>
              Open a secure channel to initiate system collaborations, data integrations, or secure API access. Awaiting incoming signals.
            </p>
            <div className="flex justify-end pointer-events-auto">
              <Link href="/contact">
                <NextGenButton>Establish Link</NextGenButton>
              </Link>
            </div>
          </motion.div>
        </section>
      </div>

      <div className="pointer-events-auto relative z-20">
        <Footer isLight={isLightMode} currentRole={hasToken ? "user" : "guest"} />
      </div>
      <BottomNav currentRole={hasToken ? "user" : "guest"} />
    </main>
  );
}