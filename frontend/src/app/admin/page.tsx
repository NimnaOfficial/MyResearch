"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldAlert, Cpu, Server, Zap, Crosshair, Loader2, X, Terminal, Database, CheckCircle2, AlertTriangle, RefreshCw, Bell, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardData {
  networkIntegrity: number;
  totalNodes: number;
  nodes: any[];
  hardware: {
    cpuUsage: number;
    memory: { percent: string; usedGB: string; totalGB: string; };
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  
  // LIVE DATA STATES
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState({ h: 14, m: 32, s: 59 });

  // REAL-TIME HISTORY STATES (Pre-filled so graphs look alive instantly)
  const [hardwareHistory, setHardwareHistory] = useState<{cpu: number, ram: number}[]>(
    Array(15).fill(0).map(() => ({ cpu: 20 + Math.random() * 10, ram: 45 + Math.random() * 5 }))
  );
  const [liveTraffic, setLiveTraffic] = useState<{id: string, req: number, endpoint: string}[]>([]);

  // POPUP PANEL STATES
  const [activeModal, setActiveModal] = useState<'NONE' | 'OVERRIDE' | 'ENVIRONMENTS' | 'NOTIFICATIONS'>('NONE');
  const [isExecuting, setIsExecuting] = useState(false);

  // GLOBAL NOTIFICATION LISTENER
  useEffect(() => {
    const triggerNotif = () => setActiveModal(prev => prev === 'NOTIFICATIONS' ? 'NONE' : 'NOTIFICATIONS');
    window.addEventListener('open-notifications', triggerNotif);
    return () => window.removeEventListener('open-notifications', triggerNotif);
  }, []);

  // 1. NEURAL LINK (LIVE POLLING ENGINE)
  useEffect(() => {
    const fetchMatrixData = async () => {
      const token = localStorage.getItem('matrix_token');
      if (!token) return router.push('/auth');

      try {
        if (!adminProfile) {
          const meRes = await fetch('http://localhost:5000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
          if (meRes.ok) setAdminProfile((await meRes.json()).data);
        }

        // 🔥 THE FIX: Corrected the endpoint URL to exactly match your backend router!
        const statsRes = await fetch('http://localhost:5000/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
        
        if (statsRes.ok) {
          const data = (await statsRes.json()).data;
          setDashData(data);
          
          // Update Hardware History Graph
          setHardwareHistory(prev => {
            const newHistory = [...prev.slice(1), { cpu: data.hardware.cpuUsage, ram: parseFloat(data.hardware.memory.percent) }];
            return newHistory;
          });

          // Generate Dynamic Traffic based on real nodes
          if (data.nodes && data.nodes.length > 0) {
            setLiveTraffic(prev => {
              const randomNode = data.nodes[Math.floor(Math.random() * data.nodes.length)];
              const endpoints = ['/api/auth/verify', '/api/users/sync', '/api/data/pull', '/api/system/ping'];
              const newLog = { 
                id: `NODE_${randomNode.id.substring(0,6).toUpperCase()}`, 
                req: Math.floor(Math.random() * 50) + 10,
                endpoint: endpoints[Math.floor(Math.random() * endpoints.length)]
              };
              return [newLog, ...prev].slice(0, 5); 
            });
          }
        } else {
          console.error("Dashboard Fetch Failed:", await statsRes.text());
        }
      } catch (error) { 
        console.error("Telemetry Link Failed", error); 
      } finally { 
        setIsLoading(false); 
      }
    };

    fetchMatrixData(); // Initial Fetch
    const pollInterval = setInterval(fetchMatrixData, 4000); // Background Polling every 4s

    const timer = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        if (s > 0) s--; else { s = 59; if (m > 0) m--; else { m = 59; h--; } }
        return { h, m, s };
      });
    }, 1000);

    return () => { clearInterval(pollInterval); clearInterval(timer); };
  }, [router, adminProfile]);

  // SVG GRAPH BUILDER
  const createGraphPath = (data: number[], height: number) => {
    if (data.length === 0) return '';
    const points = data.map((val, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = height - (val / 100) * height;
      return `${x},${y}`;
    });
    return `M 0,${height} L ${points.join(' L ')} L 100,${height}`;
  };

  const executeSystemOverride = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setActiveModal('NONE');
      setHardwareHistory(Array(15).fill({cpu: 0, ram: 0}));
    }, 2000);
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0,transparent_50%)]" />
        <Loader2 className="animate-spin text-blue-500 mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" size={48} />
        <span className="font-mono text-xs text-blue-400 tracking-[0.4em] uppercase animate-pulse">Synchronizing Core Telemetry...</span>
      </div>
    );
  }

  return (
    <div className="relative font-sans min-h-screen">
      
      {/* ========================================================= */}
      {/* FLOATING ACTION PANELS (MODALS) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {activeModal !== 'NONE' && (
          <>
            {/* Dark Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal('NONE')} className="fixed inset-0 z-[100] bg-[#010205]/80 backdrop-blur-md cursor-pointer" />
            
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              
              {/* MODAL 1: SYSTEM OVERRIDE */}
              {activeModal === 'OVERRIDE' && (
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#050A14] border-2 border-red-600/50 w-full max-w-md shadow-[0_0_50px_rgba(220,38,38,0.2)] [clip-path:polygon(0_0,100%_0,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%)] pointer-events-auto">
                  <div className="flex justify-between items-center bg-red-950/40 p-4 border-b border-red-900/50">
                    <div className="flex items-center text-red-500"><Zap size={18} className="mr-3" /><h3 className="font-black tracking-[0.3em] uppercase text-xs">System Override</h3></div>
                    <button type="button" onClick={() => setActiveModal('NONE')} className="text-red-500/50 hover:text-red-400 transition-colors" title="Close modal"><X size={18} /></button>
                  </div>
                  <div className="p-6 space-y-6">
                    <p className="text-[10px] text-red-400/80 font-mono leading-relaxed border-l-2 border-red-600/50 pl-4">
                      WARNING: Executing a system override will flush the active cache array, terminate ghost sessions, and force-sync all database nodes.
                    </p>
                    <div className="space-y-3">
                      <button type="button" onClick={executeSystemOverride} disabled={isExecuting} className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest py-4 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50">
                        {isExecuting ? <Loader2 size={16} className="animate-spin" /> : 'CONFIRM PURGE & RESTART'}
                      </button>
                      <button type="button" onClick={() => setActiveModal('NONE')} disabled={isExecuting} className="w-full bg-black border border-red-900/30 hover:border-red-500 text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest py-4 transition-all">
                        ABORT PROTOCOL
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* MODAL 2: ENVIRONMENTS */}
              {activeModal === 'ENVIRONMENTS' && (
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#050A14] border border-blue-500/50 w-full max-w-lg shadow-[0_0_50px_rgba(59,130,246,0.1)] pointer-events-auto">
                  <div className="flex justify-between items-center bg-blue-950/20 p-4 border-b border-blue-900/50">
                    <div className="flex items-center text-blue-400"><Server size={18} className="mr-3" /><h3 className="font-black tracking-[0.3em] uppercase text-xs">Environment Status</h3></div>
                    <button type="button" onClick={() => setActiveModal('NONE')} className="text-slate-500 hover:text-white transition-colors" title="Close modal"><X size={18} /></button>
                  </div>
                  <div className="p-6 grid gap-4">
                    {[
                      { name: 'Next.js Frontend Edge', status: 'ONLINE', ping: '12ms', icon: Activity },
                      { name: 'Node.js Core Backend', status: 'ONLINE', ping: '8ms', icon: Terminal },
                      { name: 'MySQL Master Database', status: 'SYNCED', ping: '4ms', icon: Database },
                    ].map((env, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-black border border-blue-900/30 p-4">
                        <div className="flex items-center space-x-4">
                          <env.icon size={16} className="text-blue-500 opacity-70" />
                          <div>
                            <p className="text-[10px] font-bold text-white tracking-widest uppercase">{env.name}</p>
                            <p className="text-[9px] font-mono text-slate-500 mt-1">Latency: {env.ping}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] font-black tracking-widest text-green-500">{env.status}</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* MODAL 3: NOTIFICATION CENTER (SLIDE OUT FROM RIGHT) */}
              {activeModal === 'NOTIFICATIONS' && (
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute right-0 top-0 h-full w-full max-w-md bg-[#050A14] border-l border-blue-500/50 shadow-[-30px_0_60px_rgba(0,0,0,0.9)] flex flex-col pointer-events-auto">
                  <div className="h-24 border-b border-blue-900/50 bg-black flex items-center justify-between px-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
                    <div className="flex items-center text-blue-500">
                      <Bell size={20} className="mr-3" />
                      <h2 className="text-xl font-black text-white tracking-[0.2em] uppercase">System Alerts</h2>
                    </div>
                    <button type="button" onClick={() => window.dispatchEvent(new Event('open-notifications'))} title="Close notifications" className="text-slate-500 hover:text-red-500 transition-colors p-2 bg-black border border-slate-800"><X size={18} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-admin-scroll">
                    
                    <div className="bg-red-950/20 border border-red-900/50 p-4">
                      <div className="flex items-center mb-2"><AlertTriangle size={12} className="text-red-500 mr-2" /><span className="text-[9px] font-black text-red-500 tracking-widest uppercase">CRITICAL ALERT</span></div>
                      <p className="text-[10px] text-white font-mono tracking-wider">Unrecognized connection attempt blocked from IP 192.168.1.44.</p>
                      <p className="text-[8px] text-slate-500 mt-2 font-mono">10 MINS AGO</p>
                    </div>

                    <div className="bg-blue-950/20 border border-blue-900/50 p-4">
                      <div className="flex items-center mb-2"><ShieldCheck size={12} className="text-blue-500 mr-2" /><span className="text-[9px] font-black text-blue-500 tracking-widest uppercase">SYSTEM UPDATE</span></div>
                      <p className="text-[10px] text-white font-mono tracking-wider">DataCore #9 synchronized perfectly across all 3 environments.</p>
                      <p className="text-[8px] text-slate-500 mt-2 font-mono">2 HOURS AGO</p>
                    </div>

                    <div className="bg-green-950/20 border border-green-900/50 p-4">
                      <div className="flex items-center mb-2"><UserIcon size={12} className="text-green-500 mr-2" /><span className="text-[9px] font-black text-green-500 tracking-widest uppercase">NODE VERIFIED</span></div>
                      <p className="text-[10px] text-white font-mono tracking-wider">Node LOCHANA successfully verified identity cryptographic link.</p>
                      <p className="text-[8px] text-slate-500 mt-2 font-mono">1 DAY AGO</p>
                    </div>

                  </div>
                </motion.div>
              )}

            </div>
          </>
        )}
      </AnimatePresence>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10 pt-6">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: IDENTITY & STATUS HUB */}
        {/* ========================================================= */}
        <div className="xl:col-span-3 space-y-6">
          
          <motion.div variants={itemVariants} className="bg-[#050A14] border border-blue-900/40 p-6 relative group [clip-path:polygon(0_0,100%_0,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%)] shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 blur-[40px] pointer-events-none" />
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-black border border-blue-500/50 flex items-center justify-center [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)] overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                {adminProfile?.profilePic ? (
                  <img src={adminProfile.profilePic} alt="Profile" className="w-full h-full object-cover opacity-90 mix-blend-luminosity hover:mix-blend-normal transition-all" />
                ) : (
                  <span className="text-2xl font-black text-blue-500">{adminProfile?.fullName ? adminProfile.fullName.charAt(0).toUpperCase() : 'A'}</span>
                )}
              </div>
              <div>
                <h2 className="text-white font-bold tracking-widest uppercase truncate max-w-[150px]">{adminProfile?.fullName || adminProfile?.username || 'SYS_ADMIN'}</h2>
                <p className="text-[9px] text-red-500 font-mono tracking-[0.2em] uppercase mt-1 flex items-center"><ShieldAlert size={10} className="mr-1" /> Level 5 Override</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[9px] font-mono tracking-widest text-slate-500 mb-2 uppercase">
                  <span>Network Integrity</span>
                  <span className="text-blue-400">{dashData?.networkIntegrity || '99.9'}%</span>
                </div>
                <div className="h-1 bg-[#020617] w-full relative">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${dashData?.networkIntegrity || 99.9}%` }} transition={{ duration: 1 }} className="absolute top-0 left-0 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                </div>
              </div>
              <button onClick={() => setActiveModal('OVERRIDE')} className="w-full bg-gradient-to-r from-red-950 to-black border border-red-900/50 text-[10px] font-black uppercase tracking-[0.3em] text-red-500 py-4 hover:bg-red-900/40 hover:text-white transition-all [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)] flex items-center justify-center group shadow-[0_0_15px_rgba(220,38,38,0.1)]">
                <Zap size={14} className="mr-2 group-hover:animate-pulse" /> Execute Override
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} onClick={() => setActiveModal('ENVIRONMENTS')} className="bg-[#050A14] border border-blue-900/40 p-6 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] cursor-pointer hover:border-blue-500/50 transition-colors group">
            <div className="flex justify-between items-center border-b border-blue-900/30 pb-4 mb-4">
              <h3 className="text-xs font-black text-white uppercase tracking-widest group-hover:text-blue-400 transition-colors">[ ENVIRONMENTS ]</h3>
              <span className="text-[9px] font-mono text-green-500 flex items-center"><RefreshCw size={10} className="mr-1 animate-spin" /> LIVE</span>
            </div>
            <div className="space-y-2">
              {['Next.js Frontend', 'Node.js Backend', 'MySQL Database'].map((env, i) => (
                <div key={i} className="flex justify-between items-center p-2 group-hover:bg-blue-900/10 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Server size={12} className="text-blue-500 opacity-70" />
                    <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">{env}</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ========================================================= */}
        {/* CENTER COLUMN: HERO & ROSTER */}
        {/* ========================================================= */}
        <div className="xl:col-span-6 space-y-6">
          <motion.div variants={itemVariants} className="h-64 bg-black relative overflow-hidden border border-red-900/50 [clip-path:polygon(0_0,100%_0,100%_calc(100%-30px),calc(100%-30px)_100%,0_100%)] shadow-[0_15px_40px_rgba(220,38,38,0.15)] group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.2),transparent_60%)] pointer-events-none" />
            <div className="absolute right-0 top-0 w-3/4 h-full bg-red-900/10 transform skew-x-12 translate-x-10 group-hover:bg-red-900/20 transition-colors duration-700 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            <div className="relative z-20 p-8 flex flex-col justify-between h-full">
              <div>
                <div className="inline-block px-3 py-1 bg-red-950 border border-red-500/30 text-red-500 text-[9px] font-mono tracking-widest uppercase mb-4 shadow-[0_0_10px_rgba(220,38,38,0.2)]">
                  SYS_BACKUP_SCHEDULED
                </div>
                <h2 className="text-4xl font-black text-white tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">Data<span className="text-red-600">Core</span> #9</h2>
              </div>
              
              <div className="flex items-end justify-between">
                <div className="flex space-x-4">
                  {Object.entries(countdown).map(([unit, val]) => (
                    <div key={unit} className="flex flex-col">
                      <span className="text-3xl font-black text-white font-mono leading-none tracking-tighter">{val.toString().padStart(2, '0')}</span>
                      <span className="text-[9px] text-red-500 font-mono uppercase tracking-[0.2em] mt-1">{unit}</span>
                    </div>
                  ))}
                </div>
                <button className="bg-red-600 text-[10px] font-black uppercase tracking-[0.3em] text-white px-8 py-3 [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)] hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                  Initiate Sequence
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-[#050A14] border border-blue-900/40 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] p-1">
            <div className="flex items-center justify-between border-b border-blue-900/40 p-3 bg-black">
              <div className="flex space-x-1">
                <button className="bg-blue-900/30 border border-blue-500/50 text-blue-400 text-[10px] font-black uppercase tracking-widest px-6 py-2 [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)] flex items-center">
                  <CheckCircle2 size={12} className="mr-2 text-green-500" /> Active Nodes
                </button>
              </div>
              <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest px-4 flex items-center">
                Total Population: <span className="text-white ml-2 text-xs font-bold">{dashData?.totalNodes || 0}</span>
              </span>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-blue-900/20 bg-[#020617]">
                  <th className="p-4 text-[9px] text-blue-500 font-mono uppercase tracking-[0.3em]">Node_ID</th>
                  <th className="p-4 text-[9px] text-blue-500 font-mono uppercase tracking-[0.3em]">Identifier</th>
                  <th className="p-4 text-[9px] text-blue-500 font-mono uppercase tracking-[0.3em]">Clearance</th>
                  <th className="p-4 text-[9px] text-blue-500 font-mono uppercase tracking-[0.3em] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-300">
                {dashData?.nodes && dashData.nodes.length > 0 ? (
                  dashData.nodes.map((node: any) => (
                    <tr key={node.id} className="border-b border-blue-900/10 hover:bg-[#0A1224] transition-colors group cursor-pointer" onClick={() => router.push('/admin/users')}>
                      <td className="p-4 font-mono text-[10px] text-slate-500">...{node.id.substring(node.id.length - 6)}</td>
                      <td className="p-4"><span className="font-bold text-white tracking-widest uppercase group-hover:text-blue-400 transition-colors">{node.fullName || node.username}</span></td>
                      <td className="p-4">
                        <span className={`text-[9px] font-mono tracking-widest px-2 py-1 bg-black border ${node.role === 'admin' ? 'border-red-500/50 text-red-500' : 'border-slate-700 text-slate-400'}`}>
                          {node.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`text-[9px] font-black tracking-widest uppercase flex items-center justify-end ${node.status === 'SUSPENDED' ? 'text-orange-500' : (node.isVerified ? 'text-green-500' : 'text-slate-400')}`}>
                          <span className={`w-1.5 h-1.5 rounded-none mr-2 ${node.status === 'SUSPENDED' ? 'bg-orange-500 animate-pulse' : (node.isVerified ? 'bg-green-500' : 'bg-slate-500')}`} />
                          {node.status === 'SUSPENDED' ? 'SUSPENDED' : (node.isVerified ? 'VERIFIED' : 'PENDING')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-600 text-[10px] font-mono tracking-[0.3em] uppercase">NO NODES DETECTED IN MATRIX</td></tr>
                )}
              </tbody>
            </table>
            <div className="p-3 bg-black border-t border-blue-900/40 text-center">
               <button onClick={() => router.push('/admin/users')} className="text-[9px] font-black text-blue-500 hover:text-white tracking-[0.3em] uppercase transition-colors p-2">Access Full Roster »</button>
            </div>
          </motion.div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: ANALYTICS & LIVE GRAPHS */}
        {/* ========================================================= */}
        <div className="xl:col-span-3 space-y-6">
          
          <motion.div variants={itemVariants} className="bg-[#050A14] border border-blue-900/40 p-6 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] h-64 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b border-blue-900/30 pb-4 mb-4 shrink-0">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">[ API_TRAFFIC ]</h3>
              <Crosshair size={14} className="text-red-500 animate-[spin_3s_linear_infinite]" />
            </div>
            <div className="space-y-3 overflow-hidden flex-1">
              <AnimatePresence>
                {liveTraffic.length > 0 ? liveTraffic.map((item, i) => (
                  <motion.div key={i + item.id + item.req} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex justify-between items-center bg-black border border-blue-900/20 p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-none animate-ping" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-300 tracking-wider uppercase">{item.id}</p>
                        <p className="text-[8px] font-mono text-slate-600">{item.endpoint}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-blue-400">{item.req}ms</span>
                  </motion.div>
                )) : (
                  <div className="text-center text-slate-600 text-[10px] font-mono pt-8 tracking-[0.3em] uppercase">AWAITING PACKETS...</div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-[#050A14] border border-blue-900/40 p-6 relative shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] [clip-path:polygon(0_0,100%_0,100%_100%,20px_100%,0_calc(100%-20px))]">
            <div className="flex justify-between items-center border-b border-blue-900/30 pb-4 mb-6">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">[ LIVE_HARDWARE ]</h3>
              <Activity size={14} className="text-blue-500 animate-pulse" />
            </div>
            
            <div className="space-y-8">
              {/* CPU GRAPH */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-white mb-2 uppercase tracking-widest">
                  <span className="flex items-center"><Cpu size={10} className="mr-2 text-red-500" /> Core Array</span>
                  <span className="text-red-500 font-black">{dashData?.hardware.cpuUsage || 0}%</span>
                </div>
                <div className="h-16 w-full bg-[#010205] border border-red-900/30 relative overflow-hidden flex items-end">
                   <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
                   <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full relative z-10">
                     <defs>
                       <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor="rgba(220,38,38,0.5)" />
                         <stop offset="100%" stopColor="rgba(220,38,38,0)" />
                       </linearGradient>
                     </defs>
                     <path d={createGraphPath(hardwareHistory.map(h => h.cpu), 100)} fill="url(#redGradient)" stroke="none" />
                     <path d={createGraphPath(hardwareHistory.map(h => h.cpu), 100).replace(/M 0,100 L | L 100,100/g, '')} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
                   </svg>
                </div>
              </div>

              {/* RAM GRAPH */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-white mb-2 uppercase tracking-widest">
                  <span className="flex items-center"><Database size={10} className="mr-2 text-blue-500" /> Memory Matrix</span>
                  <span className="text-blue-400 font-black">{dashData?.hardware.memory.usedGB || '0.00'} GB</span>
                </div>
                <div className="h-16 w-full bg-[#010205] border border-blue-900/30 relative overflow-hidden flex items-end">
                   <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:10px_10px]" />
                   <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full relative z-10">
                     <defs>
                       <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor="rgba(59,130,246,0.5)" />
                         <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                       </linearGradient>
                     </defs>
                     <path d={createGraphPath(hardwareHistory.map(h => h.ram), 100)} fill="url(#blueGradient)" stroke="none" />
                     <path d={createGraphPath(hardwareHistory.map(h => h.ram), 100).replace(/M 0,100 L | L 100,100/g, '')} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
                   </svg>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}