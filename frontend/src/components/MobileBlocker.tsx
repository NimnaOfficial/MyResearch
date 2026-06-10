"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Smartphone, Terminal, Monitor, Lock, AlertTriangle } from 'lucide-react';

export default function MobileBlocker({ children }: { children: React.ReactNode }) {
  const [isBlocked, setIsBlocked] = useState<boolean | null>(null);
  const [blockReason, setBlockReason] = useState<string>('');

  useEffect(() => {
    const enforceHardwareSecurity = () => {
      if (typeof window === 'undefined') return;

      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const screenWidth = window.innerWidth;

      if (isMobileAgent) {
        setBlockReason('UNAUTHORIZED OS: MOBILE_AGENT_DETECTED');
        setIsBlocked(true);
      } else if (screenWidth < 1024) {
        setBlockReason(`INSUFFICIENT GEOMETRY: ${screenWidth}px (MIN_REQ: 1024px)`);
        setIsBlocked(true);
      } else {
        setIsBlocked(false);
      }
    };

    enforceHardwareSecurity();
    
    // Listen for resize attempts to bypass
    window.addEventListener('resize', enforceHardwareSecurity);
    return () => window.removeEventListener('resize', enforceHardwareSecurity);
  }, []);

  // Prevent flash of content before JS evaluates
  if (isBlocked === null) return <div className="min-h-screen bg-[#010205]" />;

  if (isBlocked) {
    return (
      <main className="fixed inset-0 z-[9999] bg-[#010205] flex items-center justify-center font-sans overflow-hidden cursor-crosshair selection:bg-red-500/30">
        
        {/* Background Threat Grid */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
             style={{ backgroundImage: `linear-gradient(rgba(220, 38, 38, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(220, 38, 38, 0.2) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        
        <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-red-900/20 blur-[150px] rounded-full pointer-events-none" />

        {/* Security Blockade UI */}
        <div className="relative z-10 w-full max-w-2xl px-6">
          <div className="border border-red-900/50 bg-[#050000]/90 backdrop-blur-xl p-8 md:p-12 shadow-[0_0_50px_rgba(220,38,38,0.15)] [clip-path:polygon(0_0,100%_0,100%_calc(100%-30px),calc(100%-30px)_100%,0_100%)]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-red-900/50 pb-6 mb-8">
              <div className="flex items-center text-red-500">
                <motion.div animate={{ rotate: [0, 90, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                  <ShieldAlert size={32} className="mr-4" />
                </motion.div>
                <div>
                  <h1 className="text-xl md:text-2xl font-black uppercase tracking-[0.3em]">System Lockdown</h1>
                  <p className="text-[10px] font-mono text-red-400 tracking-widest mt-1">ACCESS DENIED • ERROR 403</p>
                </div>
              </div>
              <Lock size={24} className="text-red-900/50" />
            </div>

            {/* Explanation */}
            <div className="space-y-6">
              <div className="bg-red-950/20 border border-red-900/30 p-6 [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]">
                <div className="flex items-center mb-4 text-red-400">
                  <Smartphone size={18} className="mr-3" />
                  <h2 className="text-xs font-black tracking-[0.2em] uppercase">Hardware Incompatible</h2>
                </div>
                <p className="text-sm font-mono text-slate-400 leading-relaxed">
                  The CSx Core Architecture is a high-performance environment engineered strictly for desktop workstations. Mobile devices and constrained viewports lack the necessary rendering geometry and processing capabilities.
                </p>
              </div>

              {/* Terminal Output */}
              <div className="bg-[#020000] border border-red-900/40 p-4 font-mono text-[10px] md:text-xs">
                <div className="flex items-center space-x-2 border-b border-red-900/30 pb-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-slate-600 uppercase tracking-widest">security_daemon.sh</span>
                </div>
                <div className="space-y-2 text-red-400/80">
                  <p>{'>'} Analyzing handshake parameters...</p>
                  <p>{'>'} Viewport & Agent scan complete.</p>
                  <p className="text-red-500 font-bold">{'>'} [FATAL] {blockReason}</p>
                  <p>{'>'} Severing connection to Matrix.</p>
                  <p className="text-red-600 animate-pulse mt-4">_ TERMINAL DISCONNECTED</p>
                </div>
              </div>
            </div>

            {/* Resolution Requirements */}
            <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span className="flex items-center"><Monitor size={12} className="mr-2" /> Requires PC / Mac</span>
              <span>Min Res: 1024 x 768</span>
            </div>
            
          </div>
        </div>
      </main>
    );
  }

  // If the hardware passes all checks, render the Matrix normally
  return <>{children}</>;
}