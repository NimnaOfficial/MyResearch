"use client";
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomCursor() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
      
      // Advanced Context Scanner: Detects ANY interactive element on the page
      const target = e.target as HTMLElement;
      const isInteractive = !!target.closest('a, button, input, textarea, select, [role="button"], .cursor-pointer');
      setIsHovering(isInteractive);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  // Format coordinates to always look like a high-tech data string (e.g., "0452")
  const formatCoord = (num: number) => String(num).padStart(4, '0');

  if (!isVisible) return null;

  return (
    <>
      {/* 1. THE CORE: Absolute Zero-Latency Pixel for 100% Reliable Clicking */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center"
        animate={{ x: mousePos.x, y: mousePos.y }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
        style={{ translateX: "-50%", translateY: "-50%" }}
      >
        <div className={`w-1 h-1 bg-[#00f0ff] shadow-[0_0_10px_#00f0ff] transition-all duration-200 ${isClicking ? 'scale-150' : 'scale-100'}`} />
      </motion.div>

      {/* 2. THE TACTICAL BRACKETS: Smart geometry that physically reacts to targets */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] flex items-center justify-center"
        animate={{ 
          x: mousePos.x, 
          y: mousePos.y,
          rotate: isHovering ? 90 : 0,
        }}
        transition={{ 
          x: { type: "spring", stiffness: 600, damping: 35, mass: 0.5 },
          y: { type: "spring", stiffness: 600, damping: 35, mass: 0.5 },
          rotate: { type: "spring", stiffness: 200, damping: 15 }
        }}
        style={{ translateX: "-50%", translateY: "-50%" }}
      >
        {/* Top-Left Bracket */}
        <motion.div 
          className="absolute border-t-[1.5px] border-l-[1.5px] border-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.4)] w-2.5 h-2.5"
          animate={{ 
            x: isClicking ? -4 : (isHovering ? -16 : -8), 
            y: isClicking ? -4 : (isHovering ? -16 : -8) 
          }}
        />
        {/* Top-Right Bracket */}
        <motion.div 
          className="absolute border-t-[1.5px] border-r-[1.5px] border-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.4)] w-2.5 h-2.5"
          animate={{ 
            x: isClicking ? 4 : (isHovering ? 16 : 8), 
            y: isClicking ? -4 : (isHovering ? -16 : -8) 
          }}
        />
        {/* Bottom-Left Bracket */}
        <motion.div 
          className="absolute border-b-[1.5px] border-l-[1.5px] border-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.4)] w-2.5 h-2.5"
          animate={{ 
            x: isClicking ? -4 : (isHovering ? -16 : -8), 
            y: isClicking ? 4 : (isHovering ? 16 : 8) 
          }}
        />
        {/* Bottom-Right Bracket */}
        <motion.div 
          className="absolute border-b-[1.5px] border-r-[1.5px] border-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.4)] w-2.5 h-2.5"
          animate={{ 
            x: isClicking ? 4 : (isHovering ? 16 : 8), 
            y: isClicking ? 4 : (isHovering ? 16 : 8) 
          }}
        />
      </motion.div>

      {/* 3. LIVE HUD DATA STREAM: Unique Operator Information Panel */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9997]"
        animate={{ x: mousePos.x, y: mousePos.y }}
        transition={{ 
          x: { type: "spring", stiffness: 300, damping: 30, mass: 1 },
          y: { type: "spring", stiffness: 300, damping: 30, mass: 1 }
        }}
        style={{ translateX: "16px", translateY: "16px" }}
      >
        <div className="flex flex-col">
          <motion.div 
            animate={{ 
              color: isHovering ? '#34d399' : '#00f0ff', // Turns Emerald green on target lock
              textShadow: isHovering ? '0 0 10px rgba(52,211,153,0.8)' : '0 0 10px rgba(0,240,255,0.5)'
            }}
            className="text-[8px] font-mono font-black uppercase tracking-widest whitespace-nowrap"
          >
            {isHovering ? '> TARGET LOCKED <' : '> SYS_SCAN_ACTIVE'}
          </motion.div>
          
          <AnimatePresence>
            {!isHovering && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 0.6, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[7px] font-mono text-[#00f0ff] tracking-wider mt-0.5"
              >
                POS [X:{formatCoord(mousePos.x)} Y:{formatCoord(mousePos.y)}]
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}