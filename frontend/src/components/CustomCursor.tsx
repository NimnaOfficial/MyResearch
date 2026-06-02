"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useMotionValue, useSpring, useVelocity, useTransform } from 'framer-motion';

export default function CustomCursor() {
  const pathname = usePathname() || '';
  const [isMounted, setIsMounted] = useState(false);

  // 1. DYNAMIC CHAMELEON THEME ENGINE
  let activeColor = '#00f0ff'; // Default Matrix Cyan
  if (pathname.includes('/projects') || pathname.includes('/releases')) activeColor = '#f97316'; // CSx Orange
  else if (pathname.includes('/research')) activeColor = '#00ff66'; // Classified Green
  else if (pathname.includes('/admin/users')) activeColor = '#dc2626'; // Blood Red (Roster)
  else if (pathname.includes('/admin')) activeColor = '#3b82f6'; // General Blue (Command Core)
  else if (pathname.includes('/auth')) activeColor = '#a855f7'; // Security Purple

  // 2. ZERO-LATENCY KINEMATICS ENGINE
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Ultra-light springs for 1:1 instant tracking (no drag on the actual pointer)
  const pointerX = useSpring(cursorX, { stiffness: 2000, damping: 40, mass: 0.02 });
  const pointerY = useSpring(cursorY, { stiffness: 2000, damping: 40, mass: 0.02 });

  // Heavier springs for the visual hand to create cinematic "weight" and drag
  const smoothX = useSpring(cursorX, { stiffness: 800, damping: 50, mass: 0.15 });
  const smoothY = useSpring(cursorY, { stiffness: 800, damping: 50, mass: 0.15 });

  // Velocity Calculation for 3D Banking/Tilting
  const velX = useVelocity(smoothX);
  const velY = useVelocity(smoothY);
  
  const bankX = useTransform(velY, [-2000, 2000], [25, -25]); // Pitch (Up/Down drag)
  const bankY = useTransform(velX, [-2000, 2000], [-25, 25]); // Roll (Left/Right drag)

  // Interactive States
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [scrollDelta, setScrollDelta] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
      
      const target = e.target as HTMLElement;
      const isInteractive = !!target.closest('a, button, input, textarea, select, [role="button"], .cursor-pointer');
      setIsHovering(isInteractive);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
   

    // Advanced Wheel Detection for realistic finger drumming
    let scrollTimeout: NodeJS.Timeout;
    const handleWheel = (e: WheelEvent) => {
      setScrollDelta(e.deltaY);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setScrollDelta(0), 150);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: true });
    

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      
      clearTimeout(scrollTimeout);
    };
  }, [isVisible, cursorX, cursorY]);

  if (!isMounted || !isVisible) return null;

  return (
    <>
      {/* ========================================================
          THE MICRO-CORE: Absolute Precision Click Hotspot
          This guarantees the click happens exactly at the coordinate
          ======================================================== */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[99999]"
        style={{ x: pointerX, y: pointerY, translateX: "-50%", translateY: "-50%" }}
      >
        <div 
          className={`w-1.5 h-1.5 rounded-full transition-all duration-100 ${isClicking ? 'scale-150' : 'scale-100'}`} 
          style={{ backgroundColor: activeColor, boxShadow: `0 0 15px ${activeColor}, 0 0 5px #fff` }} 
        />
      </motion.div>

      {/* ========================================================
          THE 3D CYBERNETIC MECH HAND (Advanced Geometry)
          ======================================================== */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[99998] drop-shadow-2xl"
        style={{ 
          x: smoothX, 
          y: smoothY,
          rotateX: bankX,
          rotateY: bankY,
          // Anchors the SVG exactly so the index fingertip aligns with the Micro-Core
          translateX: "-4px", 
          translateY: "-2px" 
        }}
      >
        <motion.div
          animate={{ 
            scale: isClicking ? 0.9 : (isHovering ? 1.05 : 1),
            rotateZ: isHovering ? -15 : 0,
            y: isHovering ? 0 : [0, 2, 0] // Subtle idle breathing animation
          }}
          transition={{ 
            scale: { type: "spring", stiffness: 500, damping: 25 },
            rotateZ: { type: "spring", stiffness: 400, damping: 30 },
            y: { repeat: Infinity, duration: 3, ease: "easeInOut" }
          }}
        >
          {/* Razor-sharp vector architecture */}
          <svg width="45" height="60" viewBox="0 0 45 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: `drop-shadow(0 8px 12px rgba(0,0,0,0.8))` }}>
            
            <defs>
              <linearGradient id="armor-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="50%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              <linearGradient id="armor-light" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <radialGradient id="energy-core" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={activeColor} stopOpacity="1" />
                <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* ==================== WRIST & PALM ==================== */}
            <rect x="16" y="46" width="12" height="10" fill="url(#armor-light)" clipPath="polygon(10% 0, 90% 0, 100% 100%, 0 100%)" />
            
            {/* Main Sharp Palm Carapace */}
            <motion.path 
              d="M10 26 L22 20 L32 26 L36 46 L22 52 L8 46 Z" 
              fill="url(#armor-dark)" 
              stroke={activeColor} strokeWidth="1" strokeOpacity="0.6"
              animate={{ d: isClicking ? "M12 28 L22 24 L30 28 L34 44 L22 48 L10 44 Z" : "M10 26 L22 20 L32 26 L36 46 L22 52 L8 46 Z" }}
              transition={{ type: "spring", stiffness: 600, damping: 25 }}
            />
            
            {/* Palm Energy Core */}
            <circle cx="22" cy="36" r="6" fill="url(#energy-core)" />
            <motion.path d="M22 32 L25 38 L19 38 Z" fill="#fff" animate={{ opacity: isClicking ? 1 : 0.3 }} />

            {/* ==================== INDEX FINGER (Primary Actuator) ==================== */}
            <motion.g style={{ transformOrigin: "14px 26px" }}>
              <rect x="11" y="14" width="6" height="14" fill="url(#armor-dark)" clipPath="polygon(0 0, 100% 0, 80% 100%, 20% 100%)" />
              
              <motion.g 
                style={{ transformOrigin: "14px 14px" }}
                animate={{ rotateZ: isClicking ? 45 : (isHovering ? -5 : 0) }}
                transition={{ type: "spring", stiffness: 600, damping: 25 }}
              >
                <rect x="12" y="3" width="4" height="12" fill="url(#armor-light)" clipPath="polygon(20% 0, 80% 0, 100% 100%, 0 100%)" />
                {/* Glowing Fingertip connecting to the Micro-Core */}
                <circle cx="14" cy="4" r="2" fill={activeColor} />
                <path d="M14 0 L16 4 L12 4 Z" fill="#fff" />
              </motion.g>
              
              {/* Knuckle Hardware */}
              <circle cx="14" cy="26" r="3" fill="url(#armor-light)" />
              <circle cx="14" cy="26" r="1" fill="#000" />
            </motion.g>

            {/* ==================== MIDDLE FINGER (Scroll Actuator) ==================== */}
            <motion.g 
              style={{ transformOrigin: "21px 24px" }}
              animate={{ rotateZ: isHovering ? 5 : 0 }}
            >
              <rect x="18" y="9" width="6" height="16" fill="url(#armor-dark)" />
              <motion.g 
                style={{ transformOrigin: "21px 9px" }}
                animate={{ 
                  rotateZ: isClicking ? 65 : 0,
                  y: scrollDelta !== 0 ? (scrollDelta > 0 ? 5 : -2) : 0
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <rect x="19" y="-2" width="4" height="12" fill="url(#armor-light)" />
              </motion.g>
              <circle cx="21" cy="24" r="3" fill="url(#armor-light)" />
            </motion.g>

            {/* ==================== RING FINGER ==================== */}
            <motion.g 
              style={{ transformOrigin: "28px 25px" }}
              animate={{ rotateZ: isHovering ? 10 : 0 }}
            >
              <rect x="25" y="12" width="5" height="14" fill="url(#armor-dark)" />
              <motion.g 
                style={{ transformOrigin: "27.5px 12px" }}
                animate={{ 
                  rotateZ: isClicking ? 75 : 0,
                  y: scrollDelta !== 0 ? (scrollDelta > 0 ? -2 : 5) : 0 // Alternating scroll drum
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <rect x="26" y="3" width="3.5" height="10" fill="url(#armor-light)" />
              </motion.g>
              <circle cx="27.5" cy="25" r="2.5" fill="url(#armor-light)" />
            </motion.g>

            {/* ==================== PINKY FINGER ==================== */}
            <motion.g 
              style={{ transformOrigin: "33px 28px" }}
              animate={{ rotateZ: isHovering ? 15 : 0 }}
            >
              <rect x="31" y="18" width="4" height="12" fill="url(#armor-dark)" />
              <motion.g 
                style={{ transformOrigin: "33px 18px" }}
                animate={{ rotateZ: isClicking ? 85 : 0 }}
              >
                <rect x="31.5" y="10" width="3" height="9" fill="url(#armor-light)" />
              </motion.g>
              <circle cx="33" cy="28" r="2" fill="url(#armor-light)" />
            </motion.g>

            {/* ==================== THUMB (Pinch Mechanics) ==================== */}
            <motion.g 
              style={{ transformOrigin: "9px 38px" }}
              animate={{ 
                rotateZ: isClicking ? -35 : (isHovering ? -15 : 0),
                x: isClicking ? 4 : 0 
              }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <rect x="2" y="28" width="6" height="12" transform="rotate(-30 5 38)" fill="url(#armor-dark)" />
              <motion.g 
                style={{ transformOrigin: "2px 28px" }}
                animate={{ rotateZ: isClicking ? -25 : 0 }}
              >
                <rect x="-1" y="18" width="5" height="11" transform="rotate(-30 1.5 28)" fill="url(#armor-light)" />
              </motion.g>
              <circle cx="8" cy="38" r="3" fill="url(#armor-light)" />
            </motion.g>

          </svg>
        </motion.div>
      </motion.div>

      {/* ========================================================
          4. SLEEK CONTEXTUAL HUD (Telemetry Overlay)
          Anchors to the right side of the hand
          ======================================================== */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[99997]"
        style={{ x: smoothX, y: smoothY, translateX: "32px", translateY: "16px" }}
      >
        <div className="flex flex-col bg-black/40 backdrop-blur-sm border-l-2 pl-2 py-1" style={{ borderColor: activeColor }}>
          <motion.div 
            animate={{ color: isHovering ? activeColor : '#94a3b8' }}
            className="text-[9px] font-mono font-black uppercase tracking-[0.2em] whitespace-nowrap drop-shadow-[0_0_5px_rgba(0,0,0,1)]"
          >
            {scrollDelta !== 0 ? '» SCROLL_ACTUATOR' : isClicking ? '» ENGAGING_TARGET' : isHovering ? '» TARGET_LOCKED' : '» MECH_IDLE'}
          </motion.div>
          <motion.div 
            animate={{ opacity: isHovering ? 1 : 0.6 }}
            className="text-[7px] font-mono tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(0,0,0,1)]"
            style={{ color: activeColor }}
          >
            X: {Math.round(cursorX.get())} Y: {Math.round(cursorY.get())}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}