"use client";
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, FlaskConical, Terminal, Mail } from 'lucide-react';
import { useState } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const [hoveredPath, setHoveredPath] = useState(pathname);
  const [isNear, setIsNear] = useState(false);

  const navItems = [
    { path: '/', icon: <Home size={22} />, label: 'Home' },
    { path: '/explore', icon: <Compass size={22} />, label: 'Explore' },
    { path: '/research', icon: <FlaskConical size={22} />, label: 'Research' },
    { path: '/projects', icon: <Terminal size={22} />, label: 'Projects' },
    { path: '/contact', icon: <Mail size={22} />, label: 'Contact' },
  ];

  const containerVariants = {
    hidden: { y: 100, width: "10%", opacity: 0, borderRadius: 100 },
    show: { 
      y: 0, width: "auto", opacity: 1, borderRadius: 50,
      transition: { type: "spring" as const, stiffness: 200, damping: 20, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.5 },
    show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 20 } }
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 h-32 flex justify-center items-end pb-8 cursor-none"
      onMouseEnter={() => setIsNear(true)}
      onMouseLeave={() => setIsNear(false)}
    >
      <AnimatePresence>
        {isNear && (
          <motion.nav 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            /* 🔥 FIX: Removed 'overflow-hidden' from this class list so the hologram can escape the box 🔥 */
            className="pointer-events-auto flex items-center p-2 bg-[#020813]/95 backdrop-blur-3xl border border-cyan-500/30 shadow-[0_0_50px_rgba(34,211,238,0.2)]"
            onMouseLeave={() => setHoveredPath(pathname)}
          >
            {navItems.map((item) => {
              const isActive = item.path === hoveredPath;
              return (
                <Link key={item.path} href={item.path} passHref>
                  <motion.div 
                    variants={itemVariants}
                    onMouseEnter={() => setHoveredPath(item.path)}
                    className="relative flex items-center justify-center px-6 py-4 cursor-pointer group"
                    style={{ perspective: 1000 }}
                  >
                    {/* The Ultimate Hologram Projection */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 0, scale: 0.2, rotateX: 90 }}
                          animate={{ opacity: 1, y: -65, scale: 1.4, rotateX: 0 }}
                          exit={{ opacity: 0, y: 0, scale: 0.2, rotateX: 90 }}
                          transition={{ type: "spring", stiffness: 250, damping: 15 }}
                          className="absolute top-0 flex flex-col items-center pointer-events-none z-50"
                        >
                          <motion.div animate={{ rotateY: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,1)] z-10">
                            {item.icon}
                          </motion.div>
                          {/* Volumetric Light Beam */}
                          <div className="w-12 h-16 -mt-6 bg-gradient-to-t from-cyan-500/0 via-cyan-400/20 to-cyan-300/80 blur-[2px]" style={{ clipPath: 'polygon(20% 100%, 80% 100%, 100% 0, 0 0)' }} />
                          {/* Base Emitter */}
                          <div className="w-6 h-1 bg-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,1)]" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-transparent' : 'text-slate-400 group-hover:text-cyan-200'}`}>
                      {item.icon}
                    </div>

                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute inset-1 bg-cyan-950/80 border border-cyan-400/50 rounded-full shadow-[inset_0_0_15px_rgba(34,211,238,0.3)]"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
      
      {/* Standby Pulse when Nav is hidden */}
      <AnimatePresence>
        {!isNear && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute bottom-6 w-16 h-1.5 bg-cyan-500/50 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.5)] animate-pulse"
          />
        )}
      </AnimatePresence>
    </div>
  );
}