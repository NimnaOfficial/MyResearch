"use client";
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, ValidationError } from '@formspree/react';
import { Terminal as TermIcon, Send, User, Mail, GitBranch, Network, Globe, ShieldCheck, Radio, ArrowUpRight } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, MeshTransmissionMaterial, Torus, Sphere, OrbitControls, Icosahedron } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

import BottomNav from '@/components/BottomNav';
import CustomCursor from '@/components/CustomCursor';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';

// ==========================================
// 1. EXACT USER DATA
// ==========================================
const IDENTITY_DATA = [
  { label: "Operator Identity", value: "KGL SANDANIMNE", icon: User, link: null },
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
    // Radio Wave Pulsing Effect
    if (pulseRef.current) {
      const scale = 1 + (state.clock.elapsedTime % 2) * 2; // Expands from 1 to 3
      const opacity = Math.max(0, 1 - (state.clock.elapsedTime % 2)); // Fades out as it expands
      pulseRef.current.scale.set(scale, scale, scale);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * (isLight ? 0.2 : 0.4);
    }
  });

  return (
    <>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      <Float speed={2} rotationIntensity={1} floatIntensity={1} position={[0, 0, -4]}>
        <group ref={relayRef}>
          {/* The Data Core */}
          <Icosahedron args={[1.5, 1]}>
            <MeshTransmissionMaterial backside thickness={0.5} roughness={0.1} color={isLight ? "#3b82f6" : "#00f0ff"} distortionScale={0} temporalDistortion={0} />
          </Icosahedron>
          
          {/* Orbital Transmission Rings */}
          <Torus args={[2.8, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={isLight ? "#2563eb" : "#22d3ee"} />
          </Torus>
          <Torus args={[3.5, 0.01, 16, 100]} rotation={[0, Math.PI / 3, 0]}>
            <meshBasicMaterial color={isLight ? "#94a3b8" : "#818cf8"} />
          </Torus>
          <Torus args={[4.5, 0.03, 16, 100]} rotation={[0, -Math.PI / 4, 0]}>
            <meshBasicMaterial color={isLight ? "#2563eb" : "#22d3ee"} transparent opacity={0.5} />
          </Torus>

          {/* The Expanding Radio Pulse */}
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

// ==========================================
// 4. MAIN CONTACT COMPONENT
// ==========================================
export default function ContactPage() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [state, handleSubmit] = useForm("xwvzayvy");

  const bgCol = isLightMode ? 'bg-slate-50' : 'bg-[#01030a]';
  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-500" : "text-slate-400";
  const accentText = isLightMode ? "text-blue-600" : "text-cyan-400";
  const glassPanel = isLightMode ? "bg-white/60 border-slate-300 shadow-xl" : "bg-[#030b1c]/80 border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.05)]";
  const inputStyle = isLightMode 
    ? "bg-white/80 border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 placeholder-slate-400" 
    : "bg-[#020712]/80 border-cyan-500/30 text-cyan-50 focus:border-cyan-400 focus:ring-cyan-400/20 placeholder-cyan-900/60";

  return (
    <main className={`relative min-h-screen transition-colors duration-700 font-sans cursor-none overflow-x-hidden ${bgCol}`}>
      <CustomCursor />
      <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />

      {/* 3D CANVAS */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
          <ambientLight intensity={isLightMode ? 0.8 : 0.2} />
          <directionalLight position={[5, 5, 5]} intensity={isLightMode ? 2 : 5} color={isLightMode ? "#3b82f6" : "#00f0ff"} />
          <Sparkles count={300} scale={20} size={1.5} speed={0.4} opacity={isLightMode ? 0.4 : 0.6} color={isLightMode ? "#3b82f6" : "#00f0ff"} />
          <QuantumSignalRelay isLight={isLightMode} />
          <EffectComposer>
            <Bloom luminanceThreshold={isLightMode ? 0.8 : 0.2} mipmapBlur intensity={isLightMode ? 1.0 : 2.5} radius={0.8} />
          </EffectComposer>
        </Canvas>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-40">
        
        {/* SUCCESS STATE OVERLAY */}
        <AnimatePresence>
          {state.succeeded && (
            <motion.div initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
              <div className={`p-12 rounded-3xl border text-center flex flex-col items-center max-w-lg ${glassPanel}`}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: "spring", damping: 15, delay: 0.2 }} className={`p-6 rounded-full mb-6 ${isLightMode ? 'bg-blue-100 text-blue-600' : 'bg-cyan-900/40 text-cyan-400'}`}>
                  <ShieldCheck size={48} />
                </motion.div>
                <h2 className={`text-3xl font-black mb-4 tracking-widest uppercase ${textPrimary}`}>Transmission Secured</h2>
                <p className={`mb-8 ${textSecondary}`}>The message payload has been successfully encrypted and routed to KGL SANDANIMNE.</p>
                <button onClick={() => window.location.reload()} className={`flex items-center px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${isLightMode ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-cyan-950/50 text-cyan-400 border border-cyan-800 hover:bg-cyan-900/50'}`}>
                  Reset Terminal
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER SECTION */}
        <motion.div animate={{ opacity: state.succeeded ? 0 : 1, filter: state.succeeded ? "blur(10px)" : "blur(0px)" }} className="mb-16 text-center md:text-left">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center space-x-2 mb-4 bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-400/30">
            <Radio size={14} className="animate-pulse text-cyan-400" />
            <span className={`text-xs uppercase font-bold tracking-[0.25em] ${accentText}`}>Secure Comm-Link: Online</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`text-5xl md:text-6xl font-black tracking-tight mb-4 ${textPrimary}`}>
            Establish <span className={`${accentText} font-light italic`}>Link.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`text-base font-light max-w-2xl ${textSecondary}`}>
            Access the identity matrix below or initialize a direct message payload to the core system.
          </motion.p>
        </motion.div>

        {/* THE SPLIT ARCHITECTURE (IDENTITY vs MESSAGE) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* LEFT: THE IDENTITY MATRIX (Your Details) */}
          <motion.div variants={containerVariants} initial="hidden" animate={state.succeeded ? "hidden" : "show"} className="flex flex-col space-y-4">
            <h3 className={`text-sm font-bold uppercase tracking-widest mb-2 ${textPrimary}`}>Identity Matrix</h3>
            
            {IDENTITY_DATA.map((item, idx) => {
              const ContentWrapper = item.link ? motion.a : motion.div;
              return (
                <ContentWrapper
                  key={idx}
                  href={item.link || undefined}
                  target={item.link ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, x: 10 }}
                  className={`relative overflow-hidden group flex items-center p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${isLightMode ? 'bg-white/50 border-slate-300 hover:border-blue-500 hover:bg-white/80' : 'bg-[#030b1c]/60 border-cyan-900/50 hover:border-cyan-400 hover:bg-cyan-950/40'} ${item.link ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {/* Laser Hover Effect */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ${isLightMode ? 'bg-blue-600' : 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]'}`} />
                  
                  <div className={`p-3 rounded-xl mr-5 transition-colors ${isLightMode ? 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600' : 'bg-slate-900/50 text-slate-400 group-hover:bg-cyan-950 group-hover:text-cyan-400'}`}>
                    <item.icon size={20} />
                  </div>
                  
                  <div className="flex-grow">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${textSecondary}`}>{item.label}</p>
                    <p className={`font-mono text-sm md:text-base tracking-wide transition-colors ${isLightMode ? 'text-slate-800 group-hover:text-blue-700' : 'text-slate-200 group-hover:text-cyan-300'}`}>{item.value}</p>
                  </div>

                  {item.link && (
                    <ArrowUpRight size={18} className={`opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ${isLightMode ? 'text-blue-600' : 'text-cyan-400'}`} />
                  )}
                </ContentWrapper>
              );
            })}
          </motion.div>

          {/* RIGHT: THE DIRECT MESSAGE FORM (Formspree) */}
          <motion.form 
            variants={containerVariants} initial="hidden" animate={state.succeeded ? "hidden" : "show"} onSubmit={handleSubmit}
            className={`relative p-8 rounded-3xl backdrop-blur-3xl border flex flex-col justify-between h-full ${glassPanel}`}
          >
            {/* Terminal Top Bar */}
            <div className={`absolute top-0 left-0 right-0 h-10 border-b flex items-center px-4 space-x-2 ${isLightMode ? 'border-slate-300 bg-white/40' : 'border-cyan-500/20 bg-cyan-950/20'} rounded-t-3xl`}>
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className={`ml-4 font-mono text-[10px] tracking-widest uppercase ${textSecondary}`}>direct_message.exe</span>
            </div>

            <div className="space-y-6 pt-10">
              {/* NAME INPUT */}
              <motion.div variants={itemVariants} className="relative group">
                <label htmlFor="name" className={`absolute -top-2.5 left-4 px-1 text-[10px] font-black uppercase tracking-widest z-10 ${isLightMode ? 'bg-white text-slate-600' : 'bg-[#050f24] text-cyan-400'}`}>Operator Identity</label>
                <div className="relative flex items-center">
                  <User size={18} className={`absolute left-4 transition-colors ${textSecondary} group-focus-within:${accentText}`} />
                  <input id="name" type="text" name="name" required placeholder="John Doe" className={`w-full pl-12 pr-4 py-4 rounded-xl border focus:outline-none focus:ring-2 transition-all ${inputStyle}`} />
                </div>
              </motion.div>

              {/* EMAIL INPUT */}
              <motion.div variants={itemVariants} className="relative group">
                <label htmlFor="email" className={`absolute -top-2.5 left-4 px-1 text-[10px] font-black uppercase tracking-widest z-10 ${isLightMode ? 'bg-white text-slate-600' : 'bg-[#050f24] text-cyan-400'}`}>Return Address</label>
                <div className="relative flex items-center">
                  <Mail size={18} className={`absolute left-4 transition-colors ${textSecondary} group-focus-within:${accentText}`} />
                  <input id="email" type="email" name="email" required placeholder="john@network.com" className={`w-full pl-12 pr-4 py-4 rounded-xl border focus:outline-none focus:ring-2 transition-all ${inputStyle}`} />
                </div>
                <ValidationError prefix="Email" field="email" errors={state.errors} className="text-red-400 text-xs mt-1 absolute -bottom-5" />
              </motion.div>

              {/* DIRECT MESSAGE */}
              <motion.div variants={itemVariants} className="relative group">
                <label htmlFor="message" className={`absolute -top-2.5 left-4 px-1 text-[10px] font-black uppercase tracking-widest z-10 ${isLightMode ? 'bg-white text-slate-600' : 'bg-[#050f24] text-cyan-400'}`}>Payload Data</label>
                <div className="relative">
                  <TermIcon size={18} className={`absolute left-4 top-5 transition-colors ${textSecondary} group-focus-within:${accentText}`} />
                  <textarea id="message" name="message" required rows={6} placeholder="Inject data sequences here..." className={`w-full pl-12 pr-4 py-4 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none ${inputStyle}`} />
                </div>
                <ValidationError prefix="Message" field="message" errors={state.errors} className="text-red-400 text-xs mt-1 absolute -bottom-5" />
              </motion.div>
            </div>

            {/* SUBMIT BUTTON */}
            <motion.div variants={itemVariants} className="mt-8 flex justify-end">
              <button type="submit" disabled={state.submitting} className={`relative group overflow-hidden flex items-center w-full justify-center md:w-auto px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg ${state.submitting ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : (isLightMode ? 'bg-blue-600 text-white hover:shadow-blue-500/40 hover:-translate-y-1' : 'bg-cyan-400 text-black shadow-[0_0_20px_#22d3ee] hover:shadow-[0_0_30px_#22d3ee] hover:-translate-y-1')}`}>
                <span className={`absolute inset-0 w-full h-full -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] ${isLightMode ? 'bg-gradient-to-r from-transparent via-white/40 to-transparent' : 'bg-gradient-to-r from-transparent via-white/50 to-transparent'}`} />
                <span className="relative z-10 flex items-center">
                  {state.submitting ? 'Encrypting Payload...' : 'Execute Transmission'}
                  {!state.submitting && <Send size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />}
                </span>
              </button>
            </motion.div>
          </motion.form>

        </div>
      </div>
      
      <div className="mt-10">
        <Footer isLight={isLightMode} />
      </div>

      <BottomNav />
    </main>
  );
}