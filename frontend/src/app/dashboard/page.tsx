"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Icosahedron, MeshTransmissionMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { User, Mail, Fingerprint, ShieldCheck, LogOut, Clock, Activity, Lock } from 'lucide-react';

import CustomCursor from '@/components/CustomCursor';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';

// ==========================================
// 1. 3D PERSONAL DATA CORE
// ==========================================
function DataCore({ isLightMode }: { isLightMode: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.2;
      coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Icosahedron ref={coreRef} args={[1.5, 0]} position={[0, 0, 0]}>
        <MeshTransmissionMaterial 
          backside 
          thickness={0.5} 
          roughness={0.1} 
          ior={1.2}
          distortionScale={0}
          temporalDistortion={0}
          color={isLightMode ? "#0ea5e9" : "#a855f7"} 
          wireframe={true}
        />
      </Icosahedron>
      <Icosahedron args={[1.2, 1]} position={[0, 0, 0]}>
        <meshBasicMaterial color={isLightMode ? "#38bdf8" : "#00f0ff"} wireframe opacity={0.2} transparent />
      </Icosahedron>
    </Float>
  );
}

interface UserData {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
}

// ==========================================
// 2. MAIN DASHBOARD COMPONENT
// ==========================================
export default function UserDashboard() {
  const router = useRouter();
  
  const [isLightMode, setIsLightMode] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // AUTHENTICATION HYDRATION
  useEffect(() => {
    const fetchIdentity = async () => {
      const token = localStorage.getItem('matrix_token');
      if (!token) {
        router.push('/auth');
        return;
      }
      try {
        const response = await fetch('https://myresearch-bclz.onrender.com/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const result = await response.json();
        if (response.ok) {
          setUserData(result.data);
          setLoading(false);
        } else {
          localStorage.removeItem('matrix_token');
          router.push('/auth');
        }
      } catch (err) {
        localStorage.removeItem('matrix_token');
        router.push('/auth');
      }
    };
    fetchIdentity();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('matrix_token');
    localStorage.removeItem('userRole');
    router.push('/auth');
  };

  const bgPrimary = isLightMode ? "bg-slate-50" : "bg-[#010309]";
  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const glassPanel = isLightMode ? "bg-white/60 border-slate-200 shadow-xl" : "bg-[#030b1c]/80 border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.05)]";

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgPrimary}`}>
        <Activity size={48} className="text-[#a855f7] animate-pulse" />
      </div>
    );
  }

  return (
    <main className={`relative min-h-screen flex flex-col font-sans overflow-x-hidden transition-colors duration-1000 ${bgPrimary}`}>
      <CustomCursor />
      <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />

      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <ambientLight intensity={isLightMode ? 0.8 : 0.2} />
          <directionalLight position={[5, 5, 5]} intensity={isLightMode ? 2 : 1} color={isLightMode ? "#0ea5e9" : "#a855f7"} />
          <Sparkles count={100} scale={10} size={1} speed={0.4} color={isLightMode ? "#0ea5e9" : "#00f0ff"} opacity={0.3} />
          <DataCore isLightMode={isLightMode} />
        </Canvas>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-24 pb-32 flex-1 pointer-events-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 flex justify-between items-end">
          <div>
            <h1 className={`text-4xl font-black tracking-tight mb-2 ${textPrimary}`}>Personal Matrix</h1>
            <p className={`font-mono text-xs tracking-widest ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>SECURE CONNECTION ESTABLISHED</p>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors">
            <LogOut size={16} /> <span className="hidden sm:inline">Terminate Link</span>
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={`col-span-1 p-8 rounded-3xl backdrop-blur-xl border ${glassPanel}`}>
            <div className="flex items-center space-x-4 mb-8 pb-8 border-b border-slate-500/20">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#a855f7] to-[#00f0ff] p-1">
                <div className={`w-full h-full rounded-full flex items-center justify-center ${isLightMode ? 'bg-white' : 'bg-[#020613]'}`}>
                  <User size={24} className={textPrimary} />
                </div>
              </div>
              <div>
                <h2 className={`text-xl font-black tracking-widest ${textPrimary}`}>{userData?.username}</h2>
                <div className="flex items-center mt-1 space-x-2">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Operator Verified</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center mb-1"><Fingerprint size={12} className="mr-2" /> Cipher Code</label>
                <p className={`font-mono tracking-[0.2em] ${textPrimary}`}>{userData?.username}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center mb-1"><Mail size={12} className="mr-2" /> Encrypted Comm Link</label>
                <p className={`font-mono text-sm ${textPrimary}`}>{userData?.email}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center mb-1"><Clock size={12} className="mr-2" /> Initialized On</label>
                <p className={`font-mono text-sm ${textPrimary}`}>{userData ? new Date(userData.createdAt).toLocaleDateString() : ''}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="col-span-1 lg:col-span-2 space-y-8">
            <div className={`p-8 rounded-3xl backdrop-blur-xl border flex flex-col justify-center h-48 ${glassPanel}`}>
              <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>System Access Granted</h3>
              <p className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>Your neural link is active. You now have full clearance to access the architectural pipelines and compiled data repositories.</p>
              <div className="mt-6 flex space-x-4">
                {/* 🔥 BUG FIX: WIRED TO /PROJECTS 🔥 */}
                <button onClick={() => router.push('/projects')} className="px-6 py-3 bg-[#a855f7] hover:bg-[#9333ea] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                  Access Projects
                </button>
                {/* 🔥 BUG FIX: WIRED TO /RESEARCH 🔥 */}
                <button onClick={() => router.push('/research')} className="px-6 py-3 border border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10 text-xs font-black uppercase tracking-widest rounded-xl transition-all">
                  Access Research Cores
                </button>
              </div>
            </div>

            <div className={`p-8 rounded-3xl backdrop-blur-xl border ${glassPanel}`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest flex items-center mb-6 ${textPrimary}`}><Lock size={16} className="mr-2 text-cyan-500" /> Security Log</h3>
              <div className={`p-4 rounded-xl font-mono text-xs space-y-3 ${isLightMode ? 'bg-slate-100 text-slate-600' : 'bg-black/30 text-slate-400'}`}>
                <p><span className="text-emerald-500">[SUCCESS]</span> JWT Decryption successful.</p>
                <p><span className="text-emerald-500">[SUCCESS]</span> User Matrix Payload injected.</p>
                <p><span className="text-cyan-500">[INFO]</span> Awaiting new commands...</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative z-20 w-full pointer-events-auto border-t border-slate-500/20 bg-black/20 backdrop-blur-md mt-auto">
        <Footer isLight={isLightMode} currentRole="user" />
      </div>
      <div className="relative z-30 pointer-events-auto">
        <BottomNav currentRole="user" />
      </div>
    </main>
  );
}