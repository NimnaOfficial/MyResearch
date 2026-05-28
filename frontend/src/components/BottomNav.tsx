"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Compass, FlaskConical, Terminal, Mail, 
  MessageSquareText, Users, Lock, Settings
} from 'lucide-react';

// ==========================================
// 1. ADVANCED SECURITY & COLOR THEMES
// ==========================================
export type UserRole = 'guest' | 'user' | 'admin';
type ThemeColor = 'blue' | 'purple' | 'amber' | 'emerald';

const THEME_MAP = {
  blue: {
    text: 'text-[#00f0ff]',
    icon: 'text-[#0088ff]',
    glow: 'drop-shadow-[0_0_20px_rgba(0,136,255,0.8)]',
    beam: 'from-[#0044ff]/0 via-[#0088ff]/30 to-[#00f0ff]/90',
    base: 'bg-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,1)]',
    ring: 'border-[#0088ff] shadow-[0_0_15px_rgba(0,136,255,0.5)]',
    pill: 'bg-[#01030b]/90 border-[#0066ff]/50 shadow-[inset_0_0_20px_rgba(0,136,255,0.4)]',
    dot: 'bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]',
    hover: 'group-hover:text-[#00f0ff]',
    labelBorder: 'border-[#0088ff]/40'
  },
  purple: {
    text: 'text-[#e879f9]',
    icon: 'text-[#c084fc]',
    glow: 'drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]',
    beam: 'from-[#9333ea]/0 via-[#a855f7]/30 to-[#e879f9]/90',
    base: 'bg-[#e879f9] shadow-[0_0_20px_rgba(232,121,249,1)]',
    ring: 'border-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.5)]',
    pill: 'bg-[#01030b]/90 border-[#9333ea]/50 shadow-[inset_0_0_20px_rgba(147,51,234,0.4)]',
    dot: 'bg-[#e879f9] shadow-[0_0_10px_#e879f9]',
    hover: 'group-hover:text-[#e879f9]',
    labelBorder: 'border-[#a855f7]/40'
  },
  amber: {
    text: 'text-[#fbbf24]',
    icon: 'text-[#f59e0b]',
    glow: 'drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]',
    beam: 'from-[#d97706]/0 via-[#f59e0b]/30 to-[#fbbf24]/90',
    base: 'bg-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,1)]',
    ring: 'border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    pill: 'bg-[#01030b]/90 border-[#d97706]/50 shadow-[inset_0_0_20px_rgba(217,119,6,0.4)]',
    dot: 'bg-[#fbbf24] shadow-[0_0_10px_#fbbf24]',
    hover: 'group-hover:text-[#fbbf24]',
    labelBorder: 'border-[#f59e0b]/40'
  },
  emerald: {
    text: 'text-[#34d399]',
    icon: 'text-[#10b981]',
    glow: 'drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]',
    beam: 'from-[#059669]/0 via-[#10b981]/30 to-[#34d399]/90',
    base: 'bg-[#34d399] shadow-[0_0_20px_rgba(52,211,153,1)]',
    ring: 'border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.5)]',
    pill: 'bg-[#01030b]/90 border-[#059669]/50 shadow-[inset_0_0_20px_rgba(5,150,105,0.4)]',
    dot: 'bg-[#34d399] shadow-[0_0_10px_#34d399]',
    hover: 'group-hover:text-[#34d399]',
    labelBorder: 'border-[#10b981]/40'
  }
};

export default function BottomNav({ currentRole = 'guest' }: { currentRole?: UserRole }) {
  const pathname = usePathname();
  const [hoveredPath, setHoveredPath] = useState(pathname);
  const [isNear, setIsNear] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ==========================================
  // 2. THE DYNAMIC ACCESS MATRIX
  // ==========================================
  const NAV_MATRIX = {
    guest: [
      { path: '/', icon: <Home size={22} />, label: 'Home', color: 'blue' },
      { path: '/explore', icon: <Compass size={22} />, label: 'Explore', color: 'blue' },
      { path: '/contact', icon: <Mail size={22} />, label: 'Contact', color: 'blue' },
      { path: '/auth', icon: <Lock size={22} />, label: 'Gateway', color: 'purple' }, // Specific Color
    ],
    user: [
      { path: '/', icon: <Home size={22} />, label: 'Home', color: 'blue' },
      { path: '/research', icon: <FlaskConical size={22} />, label: 'Research', color: 'blue' },
      { path: '/projects', icon: <Terminal size={22} />, label: 'Projects', color: 'blue' },
      { path: '/contact', icon: <Mail size={22} />, label: 'Contact', color: 'blue' },
      { path: '/settings', icon: <Settings size={22} />, label: 'Settings', color: 'emerald' }, // Specific Color
    ],
    admin: [
      { path: '/', icon: <Home size={22} />, label: 'Home', color: 'blue' },
      { path: '/explore', icon: <Compass size={22} />, label: 'Explore', color: 'blue' },
      { path: '/admin/research', icon: <FlaskConical size={22} />, label: 'Research CRUD', color: 'amber' }, // Specific Color
      { path: '/admin/projects', icon: <Terminal size={22} />, label: 'Projects CRUD', color: 'amber' }, // Specific Color
      { path: '/admin/users', icon: <Users size={22} />, label: 'Mgr Users', color: 'amber' }, // Specific Color
      { path: '/settings', icon: <Settings size={22} />, label: 'Settings', color: 'emerald' }, // Specific Color
    ]
  };

  const navItems = NAV_MATRIX[currentRole] || NAV_MATRIX.guest;

  // ==========================================
  // 3. ULTRA-SMOOTH ANIMATION PHYSICS
  // ==========================================
  const containerVariants: Variants = {
    hidden: { y: 120, scale: 0.9, opacity: 0, borderRadius: 100 },
    show: { 
      y: 0, scale: 1, opacity: 1, borderRadius: 50,
      transition: { type: "spring" as const, stiffness: 150, damping: 18, staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0, scale: 0.5 },
    show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 250, damping: 20 } }
  };

  if (!mounted) return null;

  return (
    // THE BUG FIX: The height here is the physical space the nav occupies, 
    // but the actual "Hover Detection" is handled by the invisible div inside.
    <div className="fixed bottom-0 left-0 right-0 z-[150] h-48 flex justify-center items-end pb-8 pointer-events-none cursor-none">
      
      {/* 🚀 THE MASSIVE INVISIBLE HITBOX */}
      {/* This invisible box catches your mouse from much higher up on the screen! */}
      <div 
        className="absolute bottom-0 w-full h-full pointer-events-auto"
        onMouseEnter={() => setIsNear(true)}
        onMouseLeave={() => setIsNear(false)}
      />

      {/* THE STANDBY PULSE (Shows when mouse is away) */}
      <AnimatePresence>
        {!isNear && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 w-20 h-1.5 bg-[#0088ff]/50 rounded-full shadow-[0_0_20px_rgba(0,136,255,0.6)] animate-pulse pointer-events-auto"
            onMouseEnter={() => setIsNear(true)}
          />
        )}
      </AnimatePresence>

      {/* THE MAIN DOCK */}
      <AnimatePresence>
        {isNear && (
          <motion.nav 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="relative z-10 pointer-events-auto flex flex-wrap justify-center items-center p-2 mx-4 bg-[#01030b]/90 backdrop-blur-3xl border border-[#0055ff]/30 shadow-[0_0_60px_rgba(0,100,255,0.2)]"
            onMouseLeave={() => setHoveredPath(pathname)}
          >
            {navItems.map((item) => {
              const isActive = item.path === hoveredPath;
              const isCurrentRoute = item.path === pathname;
              const theme = THEME_MAP[item.color as ThemeColor] || THEME_MAP.blue;

              return (
                <Link key={item.path} href={item.path} passHref>
                  <motion.div 
                    variants={itemVariants}
                    onMouseEnter={() => setHoveredPath(item.path)}
                    className="relative flex items-center justify-center px-4 md:px-5 py-3 md:py-4 cursor-pointer group"
                    style={{ perspective: 1000 }}
                  >
                    
                    {/* 🔥 THE ULTIMATE 3D HOLOGRAM PROJECTION */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.5, rotateX: 90 }}
                          animate={{ opacity: 1, y: -70, scale: 1.5, rotateX: 0 }}
                          exit={{ opacity: 0, y: 10, scale: 0.5, rotateX: 90 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          className="absolute top-0 flex flex-col items-center pointer-events-none z-50"
                        >
                          {/* Floating Icon with 3D Spin */}
                          <motion.div 
                            animate={{ rotateY: 360 }} 
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }} 
                            className={`${theme.text} ${theme.glow} z-20 relative`}
                          >
                            {item.icon}
                          </motion.div>
                          
                          {/* High-Tech Volumetric Light Beam */}
                          <div 
                            className={`w-14 h-20 -mt-8 bg-gradient-to-t ${theme.beam} blur-[3px] z-10`}
                            style={{ clipPath: 'polygon(20% 100%, 80% 100%, 100% 0, 0 0)' }} 
                          />
                          
                          {/* 3D Hologram Base Ring */}
                          <div className={`absolute bottom-0 w-8 h-2 rounded-[100%] border-[1.5px] ${theme.ring} z-0 transform rotate-x-75`} />
                          
                          {/* Base Emitter Core */}
                          <div className={`absolute bottom-0 w-3 h-1 rounded-full ${theme.base} z-10`} />
                          
                          {/* Floating Hover Label */}
                          <div className={`absolute -top-7 px-3 py-1.5 rounded-lg bg-[#01030b] border ${theme.labelBorder} text-[9px] font-black uppercase tracking-widest ${theme.text} whitespace-nowrap shadow-[0_10px_30px_rgba(0,0,0,0.8)]`}>
                            {item.label}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Static Icon (Fades smoothly when hologram activates) */}
                    <div className={`relative z-10 transition-colors duration-500 ${isActive ? 'text-transparent' : (isCurrentRoute ? theme.icon : `text-slate-500 ${theme.hover}`)}`}>
                      {item.icon}
                    </div>

                    {/* Active Route Dot */}
                    {isCurrentRoute && !isActive && (
                      <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                    )}

                    {/* Dynamic Glass Pill Background */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className={`absolute inset-1 rounded-[1.2rem] ${theme.pill}`}
                        transition={{ type: "spring", stiffness: 250, damping: 20 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}