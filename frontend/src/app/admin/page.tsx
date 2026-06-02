"use client";

import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Cpu, Database, Server, Terminal, Zap, Crosshair } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [countdown, setCountdown] = useState({ h: 14, m: 32, s: 59 });

  // Simulation of the Hero Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        if (s > 0) s--;
        else { s = 59; if (m > 0) m--; else { m = 59; h--; } }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 font-sans">
      
      {/* ========================================================= */}
      {/* LEFT COLUMN: IDENTITY & STATUS HUB (3 Columns Wide)       */}
      {/* ========================================================= */}
      <div className="xl:col-span-3 space-y-6">
        
        {/* Profile Operator Card */}
        <motion.div variants={itemVariants} className="bg-[#050A14] border border-blue-900/40 p-6 relative group [clip-path:polygon(0_0,100%_0,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%)] shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 blur-[40px] pointer-events-none" />
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-black border border-blue-500/50 flex items-center justify-center [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)] relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-900/20" />
              <img src="/avatar-placeholder.png" alt="Nima" className="w-full h-full object-cover opacity-80 mix-blend-luminosity hidden" />
              <span className="text-2xl font-black text-blue-500 relative z-10">N</span>
            </div>
            <div>
              <h2 className="text-white font-bold tracking-widest uppercase">NIMA_CORE</h2>
              <p className="text-[10px] text-red-500 font-mono tracking-[0.2em] uppercase mt-1">Master Override</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[9px] font-mono tracking-widest text-slate-500 mb-1 uppercase">
                <span>Network Integrity</span>
                <span className="text-blue-400">98.2%</span>
              </div>
              <div className="h-1 bg-[#020617] w-full relative">
                <div className="absolute top-0 left-0 h-full bg-blue-500 w-[98%]" />
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-blue-900 to-black border border-blue-500/50 text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 py-3 hover:from-red-900 hover:border-red-500 hover:text-white transition-all [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)] flex items-center justify-center">
              <Zap size={14} className="mr-2" /> Execute Override
            </button>
          </div>
        </motion.div>

        {/* Framework Environments */}
        <motion.div variants={itemVariants} className="bg-[#050A14] border border-blue-900/40 p-6 relative shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]">
          <div className="flex justify-between items-center border-b border-blue-900/30 pb-4 mb-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">[ ENVIRONMENTS ]</h3>
            <span className="text-[9px] font-mono text-slate-500">3 ACTIVE</span>
          </div>
          <div className="space-y-1">
            {['Next.js Frontend', 'Node.js Backend', 'Prisma ORM'].map((env, i) => (
              <div key={i} className="flex justify-between items-center p-3 border border-transparent hover:border-blue-900/50 hover:bg-blue-900/10 transition-colors group cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-black border border-blue-500/30 flex items-center justify-center">
                    <Server size={10} className="text-blue-400" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 tracking-wider group-hover:text-blue-400 transition-colors">{env}</span>
                </div>
                <div className="w-1.5 h-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* CENTER COLUMN: MAIN DATA CANVAS (6 Columns Wide)          */}
      {/* ========================================================= */}
      <div className="xl:col-span-6 space-y-6">
        
        {/* Massive 3D Hero Banner */}
        <motion.div variants={itemVariants} className="h-64 bg-black relative overflow-hidden border border-red-900/50 [clip-path:polygon(0_0,100%_0,100%_calc(100%-30px),calc(100%-30px)_100%,0_100%)] shadow-[0_15px_40px_rgba(220,38,38,0.15)] group">
          {/* Abstract Geometry Background simulating 3D */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#050A14] to-transparent z-10" />
          <div className="absolute right-0 top-0 w-3/4 h-full bg-red-900/20 transform skew-x-12 translate-x-10 group-hover:bg-red-900/30 transition-colors duration-700" />
          <div className="absolute right-10 top-0 w-1/2 h-full border-l-4 border-red-600 transform skew-x-12 translate-x-20 z-0 opacity-50" />
          
          <div className="relative z-20 p-8 flex flex-col justify-between h-full">
            <div>
              <div className="inline-block px-3 py-1 bg-red-950 border border-red-500/30 text-red-500 text-[9px] font-mono tracking-widest uppercase mb-4">
                SYS_BACKUP_SCHEDULED
              </div>
              <h2 className="text-4xl font-black text-white tracking-[0.2em] uppercase">Data<span className="text-red-600">Core</span> #9</h2>
            </div>
            
            <div className="flex items-end justify-between">
              <div className="flex space-x-4">
                {Object.entries(countdown).map(([unit, val]) => (
                  <div key={unit} className="flex flex-col">
                    <span className="text-3xl font-black text-white font-mono leading-none tracking-tighter">
                      {val.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-red-500 font-mono uppercase tracking-[0.2em]">{unit}</span>
                  </div>
                ))}
              </div>
              <button className="bg-red-600 text-[10px] font-black uppercase tracking-[0.3em] text-white px-8 py-3 [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)] hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                Initiate Sequence
              </button>
            </div>
          </div>
        </motion.div>

        {/* Node Roster Table Component */}
        <motion.div variants={itemVariants} className="bg-[#050A14] border border-blue-900/40 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] p-1">
          <div className="flex items-center space-x-1 border-b border-blue-900/40 p-3 bg-black">
            <button className="bg-blue-900/30 border border-blue-500/50 text-blue-400 text-[10px] font-black uppercase tracking-widest px-6 py-2 [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]">
              Active Nodes
            </button>
            <button className="bg-transparent border border-transparent text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 transition-colors">
              Terminated
            </button>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-blue-900/20 bg-[#020617]">
                <th className="p-4 text-[9px] text-blue-500 font-mono uppercase tracking-[0.3em]">ID</th>
                <th className="p-4 text-[9px] text-blue-500 font-mono uppercase tracking-[0.3em]">Identifier</th>
                <th className="p-4 text-[9px] text-blue-500 font-mono uppercase tracking-[0.3em]">Auth_Level</th>
                <th className="p-4 text-[9px] text-blue-500 font-mono uppercase tracking-[0.3em] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-300">
              {[1, 2, 3].map((row) => (
                <tr key={row} className="border-b border-blue-900/10 hover:bg-blue-900/10 transition-colors group">
                  <td className="p-4 font-mono text-[10px] text-slate-500">00{row}</td>
                  <td className="p-4">
                    <span className="font-bold text-white tracking-widest">Operator_{row}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-[9px] font-mono tracking-widest px-2 py-1 bg-black border border-slate-700 text-slate-400">GUEST</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-[9px] font-black tracking-widest text-green-500 uppercase">Connected</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 bg-black border-t border-blue-900/40 text-center">
             <button className="text-[10px] font-mono text-blue-500 hover:text-white tracking-widest uppercase transition-colors">Load Remaining Nodes »</button>
          </div>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT COLUMN: ANALYTICS & DIAGNOSTICS (3 Columns Wide)    */}
      {/* ========================================================= */}
      <div className="xl:col-span-3 space-y-6">
        
        {/* Traffic Leaderboard */}
        <motion.div variants={itemVariants} className="bg-[#050A14] border border-blue-900/40 p-6 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]">
          <div className="flex justify-between items-center border-b border-blue-900/30 pb-4 mb-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">[ API_TRAFFIC ]</h3>
            <Crosshair size={14} className="text-red-500" />
          </div>
          <div className="space-y-4">
            {[ { id: 'IP_192.168.1.1', load: 8400 }, { id: 'NODE_AUTH', load: 3200 }, { id: 'DB_QUERY', load: 1450 } ].map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-mono text-slate-600">0{i+1}</span>
                  <span className="text-[10px] font-bold text-slate-300 tracking-wider uppercase">{item.id}</span>
                </div>
                <span className="text-[10px] font-mono text-blue-400">{item.load} req</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Resource Allocation */}
        <motion.div variants={itemVariants} className="bg-[#050A14] border border-blue-900/40 p-6 relative shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] [clip-path:polygon(0_0,100%_0,100%_100%,20px_100%,0_calc(100%-20px))]">
          <div className="flex justify-between items-center border-b border-blue-900/30 pb-4 mb-6">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">[ SYSTEM_LOAD ]</h3>
            <Activity size={14} className="text-blue-500" />
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[10px] font-mono text-white mb-2 uppercase tracking-widest">
                <span>CPU Usage</span>
                <span className="text-red-500">88%</span>
              </div>
              <div className="h-2 bg-[#020617] border border-blue-900/30 relative">
                <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} transition={{ duration: 1.5, delay: 0.5 }} className="absolute top-0 left-0 h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-white mb-2 uppercase tracking-widest">
                <span>Memory (RAM)</span>
                <span className="text-blue-400">4.2 / 8 GB</span>
              </div>
              <div className="h-2 bg-[#020617] border border-blue-900/30 relative">
                <motion.div initial={{ width: 0 }} animate={{ width: '52%' }} transition={{ duration: 1.5, delay: 0.7 }} className="absolute top-0 left-0 h-full bg-blue-500" />
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}