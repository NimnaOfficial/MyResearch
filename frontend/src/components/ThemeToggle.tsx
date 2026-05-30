"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, GripHorizontal } from 'lucide-react';

export default function ThemeToggle({ isLight, toggleTheme }: { isLight: boolean, toggleTheme: () => void }) {
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed z-[100] flex items-center p-1.5 rounded-full backdrop-blur-2xl shadow-2xl border cursor-grab active:cursor-grabbing pointer-events-auto"
      style={{
        top: '2rem',
        left: '2rem',
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.7)' : 'rgba(1, 2, 5, 0.7)',
        borderColor: isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(0, 231, 255, 0.8)',
        boxShadow: isLight ? '0 10px 40px rgba(0,0,0,0.1)' : '0 10px 40px rgba(0, 255, 102, 0.2)'
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Draggable Grip Handle */}
      <div className="pl-3 pr-2 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity pointer-events-none">
        <GripHorizontal size={18} className={isLight ? "text-slate-500" : "text-[#3a6ed6]"} />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevents drag from immediately triggering click
          toggleTheme();
        }}
        aria-label="Toggle Theme"
        className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-500 pointer-events-auto ${
          isLight ? 'bg-white shadow-sm text-slate-800' : 'bg-[#00ff66]/10 text-[#2b2bff] border border-[#00ff66]/30'
        }`}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isLight ? 180 : 0, scale: isLight ? 0 : 1, opacity: isLight ? 0 : 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="absolute"
        >
          <Moon size={18} />
        </motion.div>
        
        <motion.div
          initial={false}
          animate={{ rotate: isLight ? 0 : -180, scale: isLight ? 1 : 0, opacity: isLight ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="absolute"
        >
          <Sun size={18} />
        </motion.div>
      </button>
    </motion.div>
  );
}