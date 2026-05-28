"use client";
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function NextGenButton({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) {
  return (
    <motion.button
      whileHover="hover"
      initial="initial"
      onClick={onClick}
      className="relative flex items-center space-x-3 text-cyan-400 font-medium tracking-widest uppercase text-sm group pointer-events-auto"
    >
      <span className="relative z-10 transition-colors group-hover:text-white">{children}</span>
      
      <motion.div 
        variants={{
          initial: { x: 0, opacity: 0.5 },
          hover: { x: 5, opacity: 1 }
        }}
        className="text-cyan-500 group-hover:text-cyan-300"
      >
        <ArrowRight size={18} />
      </motion.div>

      {/* Glowing Animated Underline */}
      <motion.div 
        variants={{
          initial: { width: "30%", opacity: 0.5 },
          hover: { width: "100%", opacity: 1 }
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="absolute -bottom-2 left-0 h-[2px] bg-gradient-to-r from-cyan-400 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.8)]"
      />
    </motion.button>
  );
}