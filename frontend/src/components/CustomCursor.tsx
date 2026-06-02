"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useMotionValue, useSpring, useVelocity, useTransform } from 'framer-motion';

export default function CustomCursor() {
  const pathname = usePathname() || '';

  // 1. DYNAMIC CHAMELEON THEME ENGINE
  // Automatically detects the active page and shifts the mechanical LED glow.
  let activeColor = '#00f0ff'; // Default Matrix Cyan
  if (pathname.includes('/projects') || pathname.includes('/releases')) activeColor = '#f97316'; // CSx Orange
  else if (pathname.includes('/research')) activeColor = '#00ff66'; // Classified Green
  else if (pathname.includes('/settings')) activeColor = '#3b82f6'; // Operator Blue
  else if (pathname.includes('/auth')) activeColor = '#a855f7'; // Security Purple

  // 2. ZERO-LATENCY RAW MOTION VALUES (Bypasses React Re-renders)
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Cinematic Fluid Physics Springs
  const smoothX = useSpring(cursorX, { stiffness: 1200, damping: 50, mass: 0.1 });
  const smoothY = useSpring(cursorY, { stiffness: 1200, damping: 50, mass: 0.1 });

  // Velocity Calculation for 3D Banking/Tilting
  const velX = useVelocity(smoothX);
  const velY = useVelocity(smoothY);
  
  const bankX = useTransform(velY, [-1000, 1000], [15, -15]); // Pitch
  const bankY = useTransform(velX, [-1000, 1000], [-15, 15]); // Roll

  // Interactive States
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Direct MotionValue updates = 0 lag.
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
    const handleMouseLeave = () => setIsVisible(false);

    // Scroll Detection Engine
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsScrolling(false), 150);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(scrollTimeout);
    };
  }, [isVisible, cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <>
      {/* ========================================================
          THE MICRO-CORE: Absolute Precision Click Hotspot
          This invisible pixel guarantees you never miss a button.
          ======================================================== */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ x: cursorX, y: cursorY, translateX: "-50%", translateY: "-50%" }}
      >
        <div className={`w-1 h-1 rounded-full transition-all duration-150 ${isClicking ? 'scale-150' : 'scale-100'}`} style={{ backgroundColor: activeColor, boxShadow: `0 0 10px ${activeColor}` }} />
      </motion.div>

      {/* ========================================================
          THE 3D CYBERNETIC MECH HAND
          ======================================================== */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] drop-shadow-2xl"
        style={{ 
          x: smoothX, 
          y: smoothY,
          rotateX: bankX,
          rotateY: bankY,
          // Anchors the SVG so the tip of the index finger hits the exact mouse coordinate
          translateX: "-4px", 
          translateY: "-2px"
        }}
      >
        <motion.div
          animate={{ 
            scale: isClicking ? 0.85 : (isHovering ? 1.05 : 0.95),
            rotateZ: isHovering ? -15 : 0 // Tilts into a "pointing" stance on hover
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* SVG Canvas scaled down for elegance */}
          <svg width="40" height="55" viewBox="0 0 40 55" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: `drop-shadow(0 5px 8px rgba(0,0,0,0.6))` }}>
            
            {/* 3D METALLIC GRADIENTS */}
            <defs>
              <linearGradient id="chassis" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="joint" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <radialGradient id="led" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={activeColor} stopOpacity="1" />
                <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* ==================== WRIST & PALM ==================== */}
            {/* Wrist Servo */}
            <rect x="14" y="42" width="10" height="8" rx="2" fill="url(#joint)" />
            {/* Main Palm Carapace */}
            <motion.path 
              d="M10 24 Q20 20 28 24 L32 42 Q19 46 8 42 Z" 
              fill="url(#chassis)" 
              stroke={activeColor} strokeWidth="0.5" strokeOpacity="0.5"
              animate={{ d: isClicking ? "M12 26 Q20 22 26 26 L30 40 Q19 44 10 40 Z" : "M10 24 Q20 20 28 24 L32 42 Q19 46 8 42 Z" }}
            />
            {/* Palm LED Core */}
            <circle cx="20" cy="34" r="5" fill="url(#led)" />
            <motion.circle 
              cx="20" cy="34" r="1.5" fill="#fff" 
              animate={{ opacity: isClicking ? 1 : 0.4 }} 
            />

            {/* ==================== INDEX FINGER (The Pointer) ==================== */}
            <motion.g style={{ transformOrigin: "12px 24px" }}>
              {/* Proximal Phalanx */}
              <rect x="9" y="12" width="5" height="13" rx="2.5" fill="url(#chassis)" />
              {/* Medial/Distal Phalanx (Bends on click) */}
              <motion.g 
                style={{ transformOrigin: "11.5px 13px" }}
                animate={{ rotateZ: isClicking ? 45 : (isHovering ? -10 : 0) }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <rect x="9" y="2" width="4.5" height="11" rx="2" fill="url(#joint)" />
                {/* Neon Fingertip Sensor */}
                <circle cx="11.25" cy="4" r="1.5" fill={activeColor} />
              </motion.g>
              {/* Knuckle Joint */}
              <circle cx="11.5" cy="24" r="2.5" fill="url(#joint)" />
              <circle cx="11.5" cy="13" r="2" fill="url(#chassis)" />
            </motion.g>

            {/* ==================== MIDDLE FINGER (Reacts to Scrolling) ==================== */}
            <motion.g 
              style={{ transformOrigin: "18px 22px" }}
              animate={{ rotateZ: isHovering ? 5 : 0 }}
            >
              <rect x="15.5" y="8" width="5" height="15" rx="2.5" fill="url(#chassis)" />
              <motion.g 
                style={{ transformOrigin: "18px 9px" }}
                animate={{ 
                  rotateZ: isClicking ? 60 : 0,
                  y: isScrolling ? [0, 4, 0] : 0 // Scrolling Drum Motion
                }}
                transition={{ y: { repeat: isScrolling ? Infinity : 0, duration: 0.3 } }}
              >
                <rect x="16" y="0" width="4" height="9" rx="2" fill="url(#joint)" />
              </motion.g>
              <circle cx="18" cy="22" r="2.5" fill="url(#joint)" />
              <circle cx="18" cy="9" r="2" fill="url(#chassis)" />
            </motion.g>

            {/* ==================== RING FINGER (Reacts to Scrolling) ==================== */}
            <motion.g 
              style={{ transformOrigin: "24px 23px" }}
              animate={{ rotateZ: isHovering ? 10 : 0 }}
            >
              <rect x="22" y="11" width="4.5" height="13" rx="2.25" fill="url(#chassis)" />
              <motion.g 
                style={{ transformOrigin: "24.25px 12px" }}
                animate={{ 
                  rotateZ: isClicking ? 70 : 0,
                  y: isScrolling ? [0, 4, 0] : 0 // Scrolling Drum Motion (Offset)
                }}
                transition={{ y: { repeat: isScrolling ? Infinity : 0, duration: 0.3, delay: 0.1 } }}
              >
                <rect x="22.5" y="4" width="3.5" height="8" rx="1.75" fill="url(#joint)" />
              </motion.g>
              <circle cx="24.25" cy="23" r="2.5" fill="url(#joint)" />
              <circle cx="24.25" cy="12" r="2" fill="url(#chassis)" />
            </motion.g>

            {/* ==================== PINKY FINGER ==================== */}
            <motion.g 
              style={{ transformOrigin: "29px 26px" }}
              animate={{ rotateZ: isHovering ? 15 : 0 }}
            >
              <rect x="27.5" y="16" width="4" height="11" rx="2" fill="url(#chassis)" />
              <motion.g 
                style={{ transformOrigin: "29.5px 17px" }}
                animate={{ rotateZ: isClicking ? 80 : 0 }}
              >
                <rect x="28" y="10" width="3" height="7" rx="1.5" fill="url(#joint)" />
              </motion.g>
              <circle cx="29.5" cy="26" r="2" fill="url(#joint)" />
              <circle cx="29.5" cy="17" r="1.5" fill="url(#chassis)" />
            </motion.g>

            {/* ==================== THUMB (Pinches inward on click) ==================== */}
            <motion.g 
              style={{ transformOrigin: "10px 36px" }}
              animate={{ 
                rotateZ: isClicking ? -40 : (isHovering ? -15 : 0),
                x: isClicking ? 2 : 0 
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <rect x="4" y="26" width="5" height="11" rx="2.5" transform="rotate(-30 6 36)" fill="url(#chassis)" />
              <motion.g 
                style={{ transformOrigin: "3px 28px" }}
                animate={{ rotateZ: isClicking ? -20 : 0 }}
              >
                <rect x="0" y="18" width="4" height="10" rx="2" transform="rotate(-30 2 28)" fill="url(#joint)" />
              </motion.g>
              <circle cx="10" cy="36" r="2.5" fill="url(#joint)" />
            </motion.g>

          </svg>
        </motion.div>
      </motion.div>

      {/* ========================================================
          4. SLEEK CONTEXTUAL HUD (Telemetry Overlay)
          ======================================================== */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9997]"
        style={{ x: smoothX, y: smoothY, translateX: "24px", translateY: "12px" }}
      >
        <div className="flex flex-col">
          <motion.div 
            animate={{ color: isHovering ? activeColor : '#94a3b8' }}
            className="text-[8px] font-mono font-black uppercase tracking-[0.2em] whitespace-nowrap drop-shadow-md"
          >
            {isScrolling ? '» SCROLL_ACTUATOR' : isClicking ? '» ENGAGING_TARGET' : isHovering ? '» TARGET_LOCKED' : '» MECH_IDLE'}
          </motion.div>
          <motion.div 
            animate={{ opacity: isHovering ? 1 : 0 }}
            className="text-[6px] font-mono tracking-widest mt-0.5 uppercase"
            style={{ color: activeColor }}
          >
            SYS_READY // AUTH_VALID
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}