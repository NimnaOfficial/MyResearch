"use client";
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Search, Filter, Star, Eye, Clock, ArrowRight, Database, Code2, Cpu, Hexagon, Terminal as TermIcon, Layers, Lock, Compass, X } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Box, Icosahedron, MeshTransmissionMaterial, OrbitControls, Text } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

import BottomNav from '@/components/BottomNav';
import CustomCursor from '@/components/CustomCursor';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';

// ==========================================
// 1. DATASET
// ==========================================
const EXPLORE_DATABASE = [
  { id: 1, title: 'Quantum Search Algorithm', type: 'Research', category: 'Algorithms', rating: 4.9, views: '12.4k', date: '2026-05-20', preview: 'Analyzing time complexity reduction in high-dimensional spatial grids using quantum superposition techniques.', status: 'Active', icon: Cpu, file: 'quantum_grid.py' },
  { id: 2, title: 'Fluid UI Spatial Engine', type: 'Project', category: 'UI/UX', rating: 5.0, views: '45.1k', date: '2026-05-25', preview: 'A WebGL-based rendering engine that morphs standard DOM elements into physics-based liquid structures.', status: 'Active', icon: Hexagon, file: 'spatial_mesh.tsx' },
  { id: 3, title: 'Neural Net Data Pipeline', type: 'Project', category: 'Data Science', rating: 4.7, views: '8.2k', date: '2026-05-18', preview: 'Automated extraction and classification of unstructured data using a custom-trained transformer model.', status: 'Active', icon: Database, file: 'pipeline_train.py' },
  { id: 4, title: 'Biometric Security Interface', type: 'Project', category: 'Cybersecurity', rating: 0.0, views: '0', date: 'Pending', preview: 'Next-gen cryptographic biometric barrier utilizing decentralized client-side visual handshake validation arrays.', status: 'Incoming', icon: Lock, file: 'biometric_layer.sys' },
  { id: 5, title: 'Cryptographic Hashing Models', type: 'Research', category: 'Cybersecurity', rating: 4.6, views: '5.4k', date: '2026-05-10', preview: 'Evaluating the vulnerability of SHA-256 against theoretical quantum decryption methods.', status: 'Active', icon: Cpu, file: 'crypto_sha.cpp' },
  { id: 6, title: 'Predictive Matrix Forecasting', type: 'Research', category: 'Data Science', rating: 0.0, views: '0', date: 'Pending', preview: 'Hyperspatial structural mapping algorithm engineered to forecast distributed data network congestions.', status: 'Incoming', icon: Layers, file: 'matrix_forecast.m' },
];

const CATEGORIES = ['All', 'UI/UX', 'Algorithms', 'Data Science', 'Cybersecurity'];
const SORTS = ['Recent Updates', 'Most Viewed', 'Top Rated'];

const HIDDEN_NODES = [
  { text: "SECTOR 7G // CLASSIFIED", pos: [4, 3, -3] as [number, number, number] },
  { text: "QUANTUM REGISTRY: ONLINE", pos: [-5, -2, 4] as [number, number, number] },
  { text: "LATENCY: 0.04ms", pos: [2, -4, -2] as [number, number, number] },
  { text: "SYSTEM ARCHITECTURE V9", pos: [-3, 4, -5] as [number, number, number] },
  { text: "OPTICAL LINK STABLE", pos: [6, 1, 1] as [number, number, number] }
];

// ==========================================
// 2. MAGNETIC PHYSICS WRAPPER
// ==========================================
function MagneticWrapper({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.div ref={ref} onMouseMove={handleMouse} onMouseLeave={reset} animate={{ x: position.x, y: position.y }} transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}>
      {children}
    </motion.div>
  );
}

// ==========================================
// 3. EXPLORABLE 3D BACKGROUND
// ==========================================
function DataConstellation({ isLight, exploreMode }: { isLight: boolean, exploreMode: boolean }) {
  const gridRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (gridRef.current && !exploreMode) {
      gridRef.current.rotation.y += delta * 0.02; // Idle spin only when NOT exploring
    }
  });

  return (
    <>
      {/* 🔥 FIX: Zoom and Pan are ONLY enabled when the user clicks 'Enter Explore Mode' */}
      <OrbitControls 
        enableZoom={exploreMode} 
        enablePan={exploreMode} 
        enableRotate={true} 
        maxDistance={25} minDistance={2} dampingFactor={0.03} enableDamping={true} zoomSpeed={0.8}
      />
      
      <group ref={gridRef} position={[0, 0, -4]}>
        <Icosahedron args={[10, 2]} material={new THREE.MeshBasicMaterial({ color: isLight ? "#94a3b8" : "#0ea5e9", wireframe: true, transparent: true, opacity: isLight ? 0.06 : 0.04 })} />
        
        {Array.from({ length: 25 }).map((_, i) => (
          <Float key={i} speed={2} rotationIntensity={1} floatIntensity={2} position={[(Math.random() - 0.5) * 18, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 10]}>
            <Box args={[0.2, 0.2, 0.2]}>
              <MeshTransmissionMaterial backside thickness={0.1} color={isLight ? "#3b82f6" : "#00f0ff"} distortionScale={0.5} temporalDistortion={0} />
            </Box>
          </Float>
        ))}

        {HIDDEN_NODES.map((node, i) => (
          <Float key={`txt-${i}`} speed={1.5} floatIntensity={1} position={node.pos}>
            <Text fontSize={0.4} color={isLight ? "#2563eb" : "#22d3ee"} anchorX="center" anchorY="middle" material-transparent={true} material-opacity={isLight ? 0.4 : 0.6}>
              {node.text}
            </Text>
          </Float>
        ))}
      </group>
    </>
  );
}

// ==========================================
// 4. MAIN EXPLORE COMPONENT
// ==========================================
export default function ExplorePage() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [exploreMode, setExploreMode] = useState(false); // 🔥 NEW STATE FOR EXPLORE MODE
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSort, setActiveSort] = useState('Recent Updates');

  const { scrollYProgress, scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 500], [0, -100]);
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0.2]);

  // 🔥 Lock the page scroll when Explore Mode is active
  useEffect(() => {
    if (exploreMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [exploreMode]);

  const bgCol = isLightMode ? 'bg-slate-50' : 'bg-[#01030a]';
  const textPrimary = isLightMode ? "text-slate-900" : "text-white";
  const textSecondary = isLightMode ? "text-slate-500" : "text-slate-400";
  const accentText = isLightMode ? "text-blue-600" : "text-cyan-400";
  const borderTheme = isLightMode ? "border-slate-200" : "border-cyan-500/20";
  const cardBg = isLightMode ? "bg-white/70 border-slate-300 shadow-xl" : "bg-[#020712]/90 border-cyan-500/15 shadow-[0_20px_50px_rgba(0,0,0,0.3)]";

  const filteredData = useMemo(() => {
    let result = EXPLORE_DATABASE;
    if (searchQuery) result = result.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.preview.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeCategory !== 'All') result = result.filter(item => item.category === activeCategory);
    result = [...result].sort((a, b) => {
      if (activeSort === 'Top Rated') return b.rating - a.rating;
      if (activeSort === 'Most Viewed') return parseFloat(b.views) - parseFloat(a.views);
      return b.status === 'Incoming' ? 1 : a.status === 'Incoming' ? -1 : a.id - b.id;
    });
    return result;
  }, [searchQuery, activeCategory, activeSort]);

  return (
    <main className={`relative min-h-screen transition-colors duration-700 font-sans cursor-none overflow-x-hidden ${bgCol}`}>
      <CustomCursor />
      <ThemeToggle isLight={isLightMode} toggleTheme={() => setIsLightMode(!isLightMode)} />

      <motion.div style={{ scaleX: scrollYProgress }} className={`fixed top-0 left-0 right-0 h-1 origin-left z-[100] ${isLightMode ? 'bg-blue-600 shadow-[0_0_10px_#2563eb]' : 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]'}`} />

      {/* 3D CANVAS */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
          <color attach="background" args={[isLightMode ? '#f8fafc' : '#01030a']} />
          <ambientLight intensity={isLightMode ? 0.7 : 0.15} />
          <directionalLight position={[6, 12, 6]} intensity={isLightMode ? 2 : 5} color={isLightMode ? "#2563eb" : "#00f0ff"} />
          <Sparkles count={500} scale={25} size={1.5} speed={0.3} opacity={isLightMode ? 0.3 : 0.6} color={isLightMode ? "#3b82f6" : "#00f0ff"} />
          <DataConstellation isLight={isLightMode} exploreMode={exploreMode} />
          <EffectComposer>
            <Bloom luminanceThreshold={isLightMode ? 0.8 : 0.1} mipmapBlur intensity={isLightMode ? 1.0 : 2.5} radius={0.9} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* 🔥 THE EXIT EXPLORE MODE OVERLAY BUTTON */}
      <AnimatePresence>
        {exploreMode && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[999]">
            <button onClick={() => setExploreMode(false)} className="flex items-center px-8 py-4 bg-red-500/10 text-red-400 border border-red-500/40 rounded-full backdrop-blur-xl shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:bg-red-500/20 hover:scale-105 transition-all cursor-pointer font-bold tracking-widest uppercase text-xs">
              <X size={18} className="mr-3" /> Terminate Explore Mode
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔥 UI WRAPPER: Fades and blurs out when Explore Mode is active */}
      <motion.div 
        animate={{ opacity: exploreMode ? 0 : 1, filter: exploreMode ? "blur(20px)" : "blur(0px)" }} 
        style={{ pointerEvents: exploreMode ? "none" : "auto" }} 
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-32">
          
          <motion.div style={{ y: headerY, opacity: headerOpacity }} initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, type: "spring" }} className="mb-14 text-center md:text-left">
            
            {/* 🔥 THE NEW EXPLORE MODE TRIGGER BUTTON */}
            <motion.button 
              whileHover={{ scale: 1.05 }} onClick={() => setExploreMode(true)}
              className={`inline-flex items-center space-x-2 mb-3 px-4 py-1.5 rounded-full border cursor-pointer transition-colors ${isLightMode ? 'bg-blue-500/10 border-blue-400/30 text-blue-600 hover:bg-blue-500/20' : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/20'}`}
            >
              <Compass size={14} className="animate-pulse" />
              <span className="text-xs uppercase font-bold tracking-[0.25em]">Enter Spatial Explore Mode</span>
            </motion.button>
            
            <h1 className={`text-5xl md:text-6xl font-black tracking-tight mb-4 transition-colors ${textPrimary}`}>
              Data <span className={`${accentText} font-light italic`}>Nexus.</span>
            </h1>
            <p className={`text-base font-light max-w-2xl transition-colors ${textSecondary}`}>
              Query central indices. Orbit the 3D space to uncover hidden sectors. Toggle localized matrices, and trace pipeline modules.
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", delay: 0.1 }} className={`flex-grow flex items-center px-6 py-4 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${isLightMode ? 'bg-white/80 border-slate-300 shadow-md focus-within:ring-4 focus-within:ring-blue-500/20' : 'bg-[#030b1c]/80 border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.05)] focus-within:border-cyan-400 focus-within:shadow-[0_0_25px_rgba(34,211,238,0.2)] focus-within:scale-[1.01]'}`}>
              <Search size={20} className={`${textSecondary} mr-4`} />
              <input type="text" placeholder="Access code pipelines, matrix models, or systems..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full bg-transparent border-none outline-none font-medium placeholder-opacity-40 tracking-wide text-sm transition-all ${textPrimary}`} />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", delay: 0.2 }} className={`flex items-center p-1.5 rounded-2xl backdrop-blur-xl border transition-all ${isLightMode ? 'bg-white/80 border-slate-300' : 'bg-[#030b1c]/80 border-cyan-500/30'}`}>
              {SORTS.map(sort => (
                <MagneticWrapper key={sort}>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveSort(sort)} className={`relative px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 overflow-hidden group`}>
                    {activeSort === sort && <motion.div layoutId="activeSortPill" transition={{ type: "spring", stiffness: 300, damping: 20 }} className={`absolute inset-0 z-0 rounded-xl ${isLightMode ? 'bg-blue-600' : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(34,211,238,0.4)]'}`} />}
                    <span className={`relative z-10 transition-colors duration-300 ${activeSort === sort ? 'text-white' : `${textSecondary} group-hover:text-white`}`}>{sort}</span>
                  </motion.button>
                </MagneticWrapper>
              ))}
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", delay: 0.3 }} className="flex flex-wrap items-center gap-3 mb-16">
            <Filter size={16} className={`${textSecondary} mr-1`} />
            {CATEGORIES.map(category => (
              <MagneticWrapper key={category}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setActiveCategory(category)} className={`px-5 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all duration-300 relative group`}>
                  <span className={`relative z-10 transition-colors duration-300 ${activeCategory === category ? (isLightMode ? 'text-white' : 'text-cyan-400') : textSecondary}`}>{category}</span>
                  {activeCategory === category ? (
                    <motion.div layoutId="activeCatBorder" className={`absolute inset-0 border rounded-xl z-0 ${isLightMode ? 'border-blue-600 bg-blue-500/5' : 'border-cyan-400 bg-cyan-400/5 shadow-[inset_0_0_10px_rgba(34,211,238,0.2)]'}`} />
                  ) : (
                    <div className={`absolute inset-0 border rounded-xl z-0 transition-colors duration-300 ${isLightMode ? 'border-slate-300 group-hover:border-slate-400 group-hover:bg-slate-100' : 'border-slate-800 group-hover:border-cyan-500/40 group-hover:bg-cyan-900/20'}`} />
                  )}
                </motion.button>
              </MagneticWrapper>
            ))}
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredData.length > 0 ? filteredData.map((item, index) => (
                <motion.div layout initial={{ opacity: 0, y: 50, rotateX: -10, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }} viewport={{ once: true, margin: "-50px" }} exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }} whileHover={{ y: -8, rotateX: 3, rotateY: -2, scale: 1.02 }} style={{ transformStyle: 'preserve-3d', perspective: 1000 }} transition={{ type: "spring", stiffness: 180, damping: 18, delay: index * 0.05 }} key={item.id} className={`group relative flex flex-col p-6 rounded-2xl backdrop-blur-3xl border transition-colors duration-500 overflow-hidden ${cardBg}`}>
                  <div className={`flex items-center justify-between pb-4 mb-5 border-b ${borderTheme} opacity-80`}>
                    <div className="flex space-x-1.5">
                      <motion.span whileHover={{ scale: 1.5 }} className="w-3 h-3 rounded-full bg-red-500/70 block shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                      <motion.span whileHover={{ scale: 1.5 }} className="w-3 h-3 rounded-full bg-yellow-500/70 block" />
                      <motion.span whileHover={{ scale: 1.5 }} className="w-3 h-3 rounded-full bg-green-500/70 block" />
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 tracking-wider flex items-center"><Code2 size={12} className="mr-1.5 text-cyan-500/70" />{item.file}</span>
                  </div>
                  {item.status === 'Incoming' ? (
                    <div className="flex-grow flex flex-col justify-between relative">
                      <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute left-0 right-0 h-[2px] bg-purple-500 shadow-[0_0_20px_#a855f7] z-50 pointer-events-none opacity-60" />
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }} className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] relative overflow-hidden"><item.icon size={22} className="animate-pulse" /></motion.div>
                          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="px-3 py-1 rounded-md text-[10px] font-black tracking-[0.2em] uppercase border border-purple-500/40 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">Incoming // Soon</motion.span>
                        </div>
                        <h3 className={`text-xl font-bold mb-3 tracking-tight transition-colors line-through decoration-purple-500/50 ${textPrimary}`}>{item.title}</h3>
                        <p className="text-xs leading-relaxed font-mono text-purple-400/60 tracking-tight select-none opacity-50 blur-[0.5px]">[ENCRYPTED STRUCT MATRIX] 0x7F3A9B2C System parameters restricted pending build phase completion.</p>
                      </div>
                      <div className={`mt-8 pt-4 border-t ${borderTheme} flex items-center justify-between text-purple-400/40 font-mono text-[10px] tracking-widest`}><span>SECURE_NODE_LOCKED</span><Lock size={12} className="animate-bounce" /></div>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <motion.div whileHover={{ scale: 1.1, rotate: -10 }} className={`p-3 rounded-xl ${isLightMode ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]'}`}><item.icon size={22} /></motion.div>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase border ${isLightMode ? 'border-slate-300 text-slate-500 bg-slate-100' : 'border-slate-800 text-slate-400 bg-slate-900/50'}`}>{item.type}</span>
                        </div>
                        <h3 className={`text-xl font-bold mb-3 tracking-tight transition-colors ${textPrimary}`}>{item.title}</h3>
                        <p className={`text-xs leading-relaxed transition-colors tracking-wide ${textSecondary}`}>{item.preview}</p>
                      </div>
                      <div className="mt-8">
                        <div className={`flex items-center justify-between pt-4 border-t ${borderTheme}`}>
                          <div className="flex space-x-4">
                            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center space-x-1 text-amber-500 cursor-help"><Star size={13} className="fill-current" /><span className="text-xs font-black">{item.rating}</span></motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} className={`flex items-center space-x-1 font-mono text-[11px] cursor-help ${textSecondary}`}><Eye size={12} /><span>{item.views}</span></motion.div>
                          </div>
                          <div className={`flex items-center space-x-1 font-mono text-[11px] ${textSecondary}`}><Clock size={12} /><span>{item.date}</span></div>
                        </div>
                      </div>
                      <motion.button whileHover={{ x: 5 }} whileTap={{ scale: 0.9 }} className={`absolute bottom-5 right-5 p-2.5 rounded-xl opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ${isLightMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-cyan-400 text-black shadow-[0_0_20px_#22d3ee]'}`}><ArrowRight size={16} /></motion.button>
                    </div>
                  )}
                </motion.div>
              )) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="col-span-full py-24 text-center border border-dashed border-slate-800 rounded-3xl backdrop-blur-sm">
                  <p className={`text-base tracking-widest font-mono ${textSecondary}`}>[!] QUERY RUN RETURNED 0 RESPONSES</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="mt-36 relative z-10">
          <Footer isLight={isLightMode} />
        </div>
      </motion.div>

      {/* Hide Bottom Nav during explore mode to give full screen access */}
      <motion.div animate={{ opacity: exploreMode ? 0 : 1, pointerEvents: exploreMode ? "none" : "auto" }}>
        <BottomNav />
      </motion.div>
    </main>
  );
}