"use client";
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ isLight, toggleTheme }: { isLight: boolean, toggleTheme: () => void }) {
  return (
    <div className="fixed top-8 left-12 z-50 pointer-events-auto">
      <motion.button
        onClick={toggleTheme}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center justify-center w-14 h-14 rounded-full backdrop-blur-xl border transition-colors duration-500 shadow-xl ${
          isLight 
            ? 'bg-white/50 border-slate-300 text-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.1)]' 
            : 'bg-[#030b1c]/70 border-cyan-500/30 text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.1)]'
        }`}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isLight ? 180 : 0, scale: isLight ? 0.8 : 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="absolute"
        >
          <Moon size={22} className={isLight ? "opacity-0" : "opacity-100"} />
        </motion.div>
        
        <motion.div
          initial={false}
          animate={{ rotate: isLight ? 0 : -180, scale: isLight ? 1 : 0.8 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="absolute"
        >
          <Sun size={22} className={isLight ? "opacity-100" : "opacity-0"} />
        </motion.div>
      </motion.button>
    </div>
  );
}