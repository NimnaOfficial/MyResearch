"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 w-4 h-4 pointer-events-none z-[100] mix-blend-difference flex items-center justify-center"
      animate={{ x: mousePos.x - 8, y: mousePos.y - 8 }}
      transition={{ type: "tween", ease: "linear", duration: 0 }}
    >
      <div className="w-2 h-2 bg-white rotate-45 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
    </motion.div>
  );
}