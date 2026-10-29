"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLightMode } = useTheme();

  useEffect(() => { 
    if (isExpanded) inputRef.current?.focus(); 
  }, [isExpanded]);

  return (
    <div className="fixed top-8 right-12 z-50 pointer-events-auto flex justify-end">
      <motion.div 
        layout
        initial={{ borderRadius: 50 }}
        animate={{ 
          width: isExpanded ? 400 : 56,
          backgroundColor: isExpanded 
            ? (isLightMode ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 23, 42, 0.7)")
            : (isLightMode ? "rgba(255, 255, 255, 0.85)" : "rgba(15, 23, 42, 0.4)"),
          borderColor: isExpanded 
            ? (isLightMode ? "rgba(37, 99, 235, 0.6)" : "rgba(56, 189, 248, 0.5)")
            : (isLightMode ? "rgba(203, 213, 225, 0.8)" : "rgba(51, 65, 85, 0.5)"),
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`relative flex items-center h-14 backdrop-blur-2xl border overflow-hidden ${
          isLightMode ? 'shadow-[0_10px_30px_rgba(0,0,0,0.08)]' : 'shadow-lg'
        }`}
      >
        <button 
          onClick={() => setIsExpanded(true)}
          aria-label="Search Repository"
          className={`min-w-[56px] h-full flex items-center justify-center transition-colors ${
            isLightMode 
              ? 'text-slate-600 hover:text-blue-600' 
              : 'text-slate-300 hover:text-cyan-400'
          }`}
        >
          <Search size={20} className={isExpanded ? "opacity-40" : ""} />
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.input
              ref={inputRef}
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search research papers or algorithms..."
              className={`flex-grow bg-transparent border-none outline-none font-sans text-sm pr-12 ${
                isLightMode 
                  ? 'text-slate-900 placeholder-slate-400' 
                  : 'text-white placeholder-slate-400'
              }`}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isExpanded && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => { setIsExpanded(false); setQuery(''); }}
              aria-label="Close Search"
              className={`absolute right-3 p-2 rounded-full transition-colors ${
                isLightMode 
                  ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' 
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <X size={18} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
