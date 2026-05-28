"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

export default function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isExpanded) inputRef.current?.focus(); }, [isExpanded]);

  return (
    <div className="fixed top-8 right-12 z-50 pointer-events-auto flex justify-end">
      <motion.div 
        layout
        initial={{ borderRadius: 50 }}
        animate={{ 
          width: isExpanded ? 400 : 56,
          backgroundColor: isExpanded ? "rgba(15, 23, 42, 0.7)" : "rgba(15, 23, 42, 0.4)",
          borderColor: isExpanded ? "rgba(56, 189, 248, 0.5)" : "rgba(51, 65, 85, 0.5)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative flex items-center h-14 backdrop-blur-2xl border shadow-lg overflow-hidden"
      >
        <button 
          onClick={() => setIsExpanded(true)}
          aria-label="Search Repository"
          className="min-w-[56px] h-full flex items-center justify-center text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <Search size={20} className={isExpanded ? "opacity-40" : ""} />
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.input
              ref={inputRef}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search research papers or algorithms..."
              className="flex-grow bg-transparent border-none outline-none text-white placeholder-slate-400 font-sans text-sm pr-12"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isExpanded && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
              onClick={() => { setIsExpanded(false); setQuery(''); }}
              aria-label="Close Search"
              className="absolute right-3 p-2 text-slate-400 hover:text-white rounded-full transition-colors"
            >
              <X size={18} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}