"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, GripHorizontal } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  isLight?: boolean;
  toggleTheme?: () => void;
}

export default function ThemeToggle({
  isLight: propIsLight,
  toggleTheme: propToggleTheme
}: ThemeToggleProps = {}) {
  const [mounted, setMounted] = useState(false);
  const themeCtx = useTheme();

  // If props are passed, use them; otherwise use the global ThemeContext
  const isLight = propIsLight !== undefined ? propIsLight : themeCtx.isLightMode;
  const toggleTheme = propToggleTheme !== undefined ? propToggleTheme : themeCtx.toggleTheme;

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed z-[100] flex items-center p-1.5 rounded-full backdrop-blur-2xl shadow-2xl border cursor-grab active:cursor-grabbing pointer-events-auto transition-colors duration-500"
      style={{
        top: '2rem',
        left: '2rem',
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(1, 2, 5, 0.75)',
        borderColor: isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(0, 231, 255, 0.8)',
        boxShadow: isLight ? '0 10px 40px rgba(0,0,0,0.12)' : '0 10px 40px rgba(0, 255, 102, 0.2)'
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Draggable Grip Handle */}
      <div className="pl-3 pr-2 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity pointer-events-none">
        <GripHorizontal size={18} className={isLight ? "text-slate-600" : "text-[#3a6ed6]"} />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // Prevents drag from immediately triggering click
          toggleTheme();
        }}
        aria-label="Toggle Theme"
        className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-colors duration-500 pointer-events-auto ${
          isLight 
            ? 'bg-amber-50 text-amber-600 border border-amber-300 shadow-sm hover:bg-amber-100' 
            : 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30 hover:bg-[#00ff66]/20'
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
