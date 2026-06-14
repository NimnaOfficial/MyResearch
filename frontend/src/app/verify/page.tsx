"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, TorusKnot, Sparkles, Sphere } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ShieldCheck, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// 1. 3D QUANTUM DECRYPTION CORE
// ==========================================
function DecryptionCore({ status }: { status: 'verifying' | 'success' | 'error' }) {
  const coreColor = status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : '#a855f7';
  
  useFrame((state, delta) => {
    // Optional: add global rotation if needed, but Float handles most movement
  });

  return (
    <group>
      <Float speed={4} rotationIntensity={1.5} floatIntensity={2}>
        <TorusKnot args={[1, 0.3, 128, 16]} position={[0, 0, 0]}>
          <MeshTransmissionMaterial 
            backside 
            samples={4} 
            thickness={0.5} 
            chromaticAberration={0.5} 
            color={coreColor} 
            distortionScale={0.5} 
            temporalDistortion={0.2} 
          />
        </TorusKnot>
        <Sphere args={[0.5, 32, 32]}>
          <meshStandardMaterial color="#000" emissive={coreColor} emissiveIntensity={3} wireframe />
        </Sphere>
      </Float>
      <Sparkles count={150} scale={6} size={2} speed={0.8} color={coreColor} />
    </group>
  );
}

// ==========================================
// 2. MAIN LOGIC & UI (Must be wrapped in Suspense)
// ==========================================
function VerifyMatrixContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Decrypting neural token...');

  useEffect(() => {
    const verifyIdentity = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Critical Error: No verification token detected in the transmission link.');
        return;
      }

      try {
        const response = await fetch('https://myresearch-bclz.onrender.com/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Identity Verified. Your cipher is now active.');
          // Auto-redirect to the main gateway after 3 seconds
          setTimeout(() => router.push('/'), 3500);
        } else {
          setStatus('error');
          setMessage(data.message || 'The neural token has expired or is invalid.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network failure: Unable to reach the Matrix Gateway.');
      }
    };

    // Small delay for dramatic UI effect
    const timeoutId = setTimeout(verifyIdentity, 1500);
    return () => clearTimeout(timeoutId);
  }, [searchParams, router]);

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 pointer-events-auto">
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.9 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="w-full max-w-md p-10 rounded-3xl bg-[#020613]/80 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center text-center"
      >
        <AnimatePresence mode="wait">
          {status === 'verifying' && (
            <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center">
              <div className="relative p-6 rounded-full bg-[#a855f7]/10 border border-[#a855f7]/30 mb-6">
                <Loader2 size={48} className="text-[#a855f7] animate-spin" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-2">Decrypting Link</h2>
              <p className="text-[#a855f7] text-sm tracking-widest font-mono uppercase mb-4 animate-pulse">Establishing Secure Handshake...</p>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-2">
                <motion.div animate={{x: ['-100%', '100%']}} transition={{repeat: Infinity, duration: 1, ease: "linear"}} className="w-1/2 h-full bg-[#a855f7]" />
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
              <div className="relative p-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <ShieldCheck size={48} className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-2">Verification Complete</h2>
              <p className="text-emerald-400 text-sm mb-8">{message}</p>
              <button onClick={() => router.push('/')} className="flex items-center justify-center w-full py-4 bg-emerald-500/20 hover:bg-emerald-500 border border-emerald-500 text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                Enter The Matrix <ArrowRight size={16} className="ml-2" />
              </button>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
              <div className="relative p-6 rounded-full bg-red-500/10 border border-red-500/30 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <AlertTriangle size={48} className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-2">Access Denied</h2>
              <p className="text-red-400 text-sm mb-8">{message}</p>
              <button onClick={() => router.push('/')} className="flex items-center justify-center w-full py-4 bg-transparent border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 font-bold uppercase tracking-[0.1em] text-xs rounded-xl transition-colors">
                Return to Gateway
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ==========================================
// 3. MASTER PAGE ASSEMBLY
// ==========================================
export default function VerifyPage() {
  return (
    <main className="relative min-h-screen bg-[#01030a] font-sans overflow-hidden">
      
      {/* 3D BACKGROUND ENGINE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <color attach="background" args={['#01030a']} />
          <ambientLight intensity={0.2} />
          <directionalLight position={[5, 10, 5]} intensity={3} color="#a855f7" />
          <directionalLight position={[-5, -10, -5]} intensity={2} color="#00f0ff" />
          
          <Suspense fallback={null}>
            {/* We pass a generic prop here, but in a real massive app, you might connect this to global state. For now, it defaults to the purple 'verifying' visual. */}
            <DecryptionCore status="verifying" />
          </Suspense>
          
          <EffectComposer>
            <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2} radius={0.9} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* REACT UI LAYER */}
      <Suspense 
        fallback={
          <div className="relative z-10 flex items-center justify-center min-h-screen">
            <Loader2 size={48} className="text-[#a855f7] animate-spin" />
          </div>
        }
      >
        <VerifyMatrixContent />
      </Suspense>

    </main>
  );
}