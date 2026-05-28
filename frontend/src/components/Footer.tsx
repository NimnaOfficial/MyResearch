"use client";
import { motion } from 'framer-motion';
import { Mail, ChevronRight, Hexagon, Terminal, Network, Globe } from 'lucide-react';

interface FooterProps {
  isLight?: boolean;
}

export default function Footer({ isLight = false }: FooterProps) {
  const textPrimary = isLight ? "text-slate-900" : "text-white";
  const textSecondary = isLight ? "text-slate-600" : "text-slate-400";
  const borderCol = isLight ? "border-slate-300" : "border-cyan-900/40";
  const glowLine = isLight ? "from-blue-500/0 via-blue-500 to-blue-500/0" : "from-cyan-500/0 via-cyan-400 to-cyan-500/0";
  const bgCol = isLight ? "bg-white/40" : "bg-[#01030a]/80";

  const links = ['Home', 'Explore', 'Research', 'Projects', 'Contact'];

  return (
    <footer className={`relative z-10 w-full pt-20 pb-40 backdrop-blur-2xl border-t ${borderCol} ${bgCol} transition-colors duration-700`}>
      
      {/* Top Glowing Horizon Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] w-full flex justify-center">
        <div className={`w-3/4 h-[1px] bg-gradient-to-r ${glowLine} opacity-50`} />
      </div>

      <div className="max-w-7xl mx-auto px-10 md:px-16 grid grid-cols-1 md:grid-cols-12 gap-12 pointer-events-auto">
        
        {/* BRAND COLUMN */}
        <div className="md:col-span-5 flex flex-col space-y-6">
          <div className="flex items-center space-x-3">
            <Hexagon size={28} className={isLight ? "text-blue-600" : "text-cyan-400"} />
            <h2 className={`text-2xl font-black tracking-widest uppercase ${textPrimary}`}>
              Nima.<span className={isLight ? "text-blue-600" : "text-cyan-400"}>Dev</span>
            </h2>
          </div>
          <p className={`font-light leading-relaxed max-w-sm ${textSecondary}`}>
            A quantum-engineered repository for data science, algorithmic structures, and high-performance spatial web deployments.
          </p>
          <div className="flex items-center space-x-2 pt-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLight ? 'bg-blue-400' : 'bg-cyan-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isLight ? 'bg-blue-500' : 'bg-cyan-500'}`}></span>
            </span>
            <span className={`text-xs uppercase tracking-widest font-bold ${isLight ? 'text-blue-600' : 'text-cyan-400'}`}>
              System Online // Secure
            </span>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="md:col-span-3 flex flex-col space-y-6">
          <h3 className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>Directory</h3>
          <ul className="space-y-4">
            {links.map((link) => (
              <li key={link}>
                <motion.a 
                  href={`${link.toLowerCase()}`}
                  whileHover={{ x: 5 }}
                  className={`flex items-center space-x-2 text-sm font-light uppercase tracking-wider cursor-pointer group ${textSecondary}`}
                >
                  <ChevronRight size={14} className={`opacity-0 -ml-4 transition-all duration-300 group-hover:opacity-100 group-hover:ml-0 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
                  <span className={`transition-colors duration-300 group-hover:${isLight ? 'text-blue-600' : 'text-cyan-400'}`}>
                    {link}
                  </span>
                </motion.a>
              </li>
            ))}
          </ul>
        </div>

        {/* SOCIAL / CONTACT */}
        <div className="md:col-span-4 flex flex-col space-y-6">
          <h3 className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>Transmission Log</h3>
          <p className={`font-light text-sm ${textSecondary}`}>
            Establish a direct secure link across global networks.
          </p>
          <div className="flex space-x-4 pt-2">
            {/* 🔥 FIX: Replaced removed brand icons with Cyber-themed System Icons */}
            {[Terminal, Network, Globe, Mail].map((Icon, idx) => (
              <motion.a
                key={idx}
                whileHover={{ y: -5, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-3 rounded-xl border backdrop-blur-md transition-colors duration-300 cursor-pointer ${
                  isLight 
                    ? 'border-slate-300 bg-white hover:border-blue-500 hover:text-blue-600 text-slate-500 shadow-sm' 
                    : 'border-cyan-900/50 bg-[#030b1c]/50 hover:border-cyan-400 hover:text-cyan-400 text-slate-400 shadow-[0_0_15px_rgba(34,211,238,0.05)]'
                }`}
              >
                <Icon size={20} />
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      {/* COPYRIGHT BOTTOM BAR */}
      <div className={`max-w-7xl mx-auto px-10 md:px-16 mt-20 pt-8 border-t flex flex-col md:flex-row justify-between items-center ${isLight ? 'border-slate-300' : 'border-cyan-900/30'}`}>
        <p className={`text-xs tracking-wider font-light uppercase ${textSecondary}`}>
          © {new Date().getFullYear()} Nima.Dev. All sequences preserved.
        </p>
        <p className={`text-xs tracking-wider font-light mt-4 md:mt-0 uppercase ${textSecondary}`}>
          Engineered with <span className={isLight ? 'text-blue-600' : 'text-cyan-400'}>Next.js & Three.js</span>
        </p>
      </div>
    </footer>
  );
}