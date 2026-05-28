"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const bootLogs = [
  "SYSTEM KERNEL INITIALIZED...",
  "MOUNTING SPATIAL GEOMETRY [OK]",
  "INJECTING OPTICAL GLASS PHYSICS...",
  "ESTABLISHING QUANTUM TRANSMISSION LINK...",
  "LOADING NEURAL DATA MODELS: [100%]",
  "ACCESS GRANTED."
];

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [currentLog, setCurrentLog] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Rapidly stream the terminal logs
    const logInterval = setInterval(() => {
      setCurrentLog((prev) => (prev < bootLogs.length - 1 ? prev + 1 : prev));
    }, 350); // Streams a new line every 350ms

    // Smoothly fill the progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 6;
      });
    }, 100);

    // Complete the boot sequence right as the 3D liquid starts morphing (~2.2 seconds)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      // Cinematic shatter exit: fades out, scales up slightly, and blurs away
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }} 
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-[#01030a] flex flex-col items-center justify-center font-mono cursor-none"
    >
      <div className="w-full max-w-2xl px-8 flex flex-col">
        
        {/* Terminal Header */}
        <div className="flex items-center space-x-4 mb-8 opacity-80">
          <div className="w-4 h-4 bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
          <span className="text-cyan-400 tracking-widest text-sm font-bold uppercase">Nima.Dev // Sys_Boot</span>
        </div>

        {/* Dynamic Log Stream */}
        <div className="h-48 flex flex-col justify-end space-y-3 mb-8 overflow-hidden">
          <AnimatePresence>
            {bootLogs.slice(0, currentLog + 1).map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-sm md:text-base tracking-wider ${
                  i === bootLogs.length - 1 ? "text-cyan-300 font-bold" : "text-slate-500"
                }`}
              >
                {/* 🔥 FIX: Wrap the greater-than sign in quotes and braces */}
                {">"} {log}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Glowing Progress Bar */}
        <div className="w-full h-[2px] bg-slate-800 relative overflow-hidden rounded-full">
          <motion.div
            className="absolute top-0 left-0 h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-4 text-xs text-slate-500 tracking-[0.2em]">
          <span>LOADING_CORE_ASSETS</span>
          <span className="text-cyan-500 font-bold">{progress}%</span>
        </div>

      </div>
    </motion.div>
  );
}