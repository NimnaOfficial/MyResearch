"use client";

import { API_URL } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, ShieldAlert, Cpu, Server, Zap, Crosshair, 
  Loader2, X, Terminal, Database, CheckCircle2, AlertTriangle, 
  RefreshCw, Bell, ShieldCheck, User as UserIcon, ArrowRight
} from 'lucide-react';
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
  const [liveTraffic, setLiveTraffic] = useState<{id: string, time: string, endpoint: string, status: string}[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [envData, setEnvData] = useState({ status: 'PENDING', ping: '...', dbPing: '...' });
  
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState({ h: 14, m: 32, s: 59 });

  // REAL-TIME HISTORY STATES (Pre-filled to establish graph base)
  const [hardwareHistory, setHardwareHistory] = useState<{cpu: number, ram: number}[]>(
    Array(15).fill(0).map(() => ({ cpu: 0, ram: 0 }))
  );

  // POPUP PANEL STATES
  const [activeModal, setActiveModal] = useState<'NONE' | 'OVERRIDE' | 'ENVIRONMENTS' | 'NOTIFICATIONS'>('NONE');
  const [isExecuting, setIsExecuting] = useState(false);
  const [overrideFeedback, setOverrideFeedback] = useState<string | null>(null);

  // 1. NEURAL LINK (LIVE POLLING ENGINE)
  const fetchMatrixData = async () => {
    const token = localStorage.getItem('matrix_token');
    if (!token) return router.push('/auth');

    try {
      if (!adminProfile) {
        const meRes = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).catch(()=>null);
        if (meRes && meRes.ok) setAdminProfile((await meRes.json()).data);
      }

      // Parallel Fetch for Absolute Zero Latency
      const startPing = Date.now();
      const [statsRes, logsRes, fbRes, healthRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch(`${API_URL}/api/admin/logs?limit=5`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch(`${API_URL}/api/feedback`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch(`${API_URL}/api/health`).catch(() => null)
      ]);
      const endPing = Date.now();

      // A. Update Environments & Latency
      if (healthRes && healthRes.ok) {
         setEnvData({ status: 'ONLINE', ping: `${endPing - startPing}ms`, dbPing: `${Math.max(1, (endPing - startPing) - 2)}ms` });
      } else {
         setEnvData({ status: 'OFFLINE', ping: 'ERR', dbPing: 'ERR' });
      }

      // B. Update Dashboard Stats & Hardware Graphs
      if (statsRes && statsRes.ok) {
        const data = (await statsRes.json()).data;
        setDashData(data);
        
        setHardwareHistory(prev => {
          const newHistory = [...prev.slice(1), { cpu: data.hardware.cpuUsage, ram: parseFloat(data.hardware.memory.percent) }];
          return newHistory;
        });
      }

      // C. Update API Traffic (System Logs)
      if (logsRes && logsRes.ok) {
        const logsData = (await logsRes.json()).data;
        const formattedTraffic = logsData.slice(0, 5).map((log: any) => ({
          id: log.ip || 'SYS_CORE',
          time: new Date(log.createdAt).toLocaleTimeString(),
          endpoint: log.action,
          status: log.status
        }));
        setLiveTraffic(formattedTraffic);
      }

      // D. Update Notifications (Secure Feedback Inbox)
      if (fbRes && fbRes.ok) {
        const fbData = (await fbRes.json()).data;
        setNotifications(fbData);
      }

    } catch (error) { 
      console.error("Telemetry Link Failed", error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    fetchMatrixData(); // Initial Fetch
    const pollInterval = setInterval(fetchMatrixData, 4000); // Polling every 4 seconds

    // Visual Countdown
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

  // REAL SYSTEM OVERRIDE
  const executeSystemOverride = async () => {
    setIsExecuting(true);
    setOverrideFeedback(null);
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`${API_URL}/api/admin/system/override`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setOverrideFeedback(data.message || 'Cache purged and node cluster force-synchronized.');
        setHardwareHistory(Array(15).fill(0).map(() => ({ cpu: 0, ram: 0 })));
        await fetchMatrixData();
        setTimeout(() => {
          setActiveModal('NONE');
          setOverrideFeedback(null);
        }, 1500);
      } else {
        alert(data.message || 'System override command was rejected.');
      }
    } catch (e) {
      alert('Network failure during override execution.');
    } finally {
      setIsExecuting(false);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center relative overflow-hidden bg-[#010205]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0,transparent_50%)]" />
        <Loader2 className="animate-spin text-blue-500 mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" size={48} />
        <span className="font-mono text-xs text-blue-400 tracking-[0.4em] uppercase animate-pulse">Synchronizing Core Telemetry...</span>
      </div>
    );
  }

  return (
    <div className="relative font-sans min-h-screen bg-[#010205]">
      
      {/* TOP BAR ACTIONS */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-blue-900/30">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-3 animate-ping" />
            System Operations Core
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">Live telemetry, node cluster analytics, and hardware monitors.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchMatrixData} 
            className="flex items-center px-4 py-2.5 rounded-xl bg-blue-950/40 border border-blue-900/50 text-blue-400 hover:text-white hover:border-blue-500 transition-all text-xs font-mono font-bold"
            title="Refresh Core Data"
          >
            <RefreshCw size={14} className="mr-2" /> Refresh
          </button>
          
          <button 
            onClick={() => setActiveModal('NOTIFICATIONS')} 
            className="relative p-2.5 bg-blue-950/40 border border-blue-900/50 rounded-xl text-blue-400 hover:text-white hover:border-blue-500 transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            {notifications.some(n => n.priority === 'URGENT') && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FLOATING ACTION PANELS (MODALS) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {activeModal !== 'NONE' && (
          <>
            {/* Dark Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal('NONE')} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md cursor-pointer" />
            
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              
              {/* MODAL 1: SYSTEM OVERRIDE */}
              {activeModal === 'OVERRIDE' && (
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#050A14] border border-red-500/50 w-full max-w-md shadow-2xl rounded-2xl pointer-events-auto overflow-hidden">
                  <div className="flex justify-between items-center bg-red-950/40 p-5 border-b border-red-900/50">
                    <div className="flex items-center text-red-400 font-bold tracking-wider uppercase text-sm">
                      <Zap size={18} className="mr-2.5 text-red-500" /> System Override Protocol
                    </div>
                    <button type="button" onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-white transition-colors" title="Close modal">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <p className="text-xs text-slate-300 font-mono leading-relaxed bg-black/50 p-4 rounded-xl border border-red-900/30">
                      WARNING: Executing a system override flushes active cache arrays, force-syncs all database connections, and writes an administrative audit log.
                    </p>
                    
                    {overrideFeedback && (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-mono flex items-center">
                        <CheckCircle2 size={16} className="mr-2 shrink-0" />
                        {overrideFeedback}
                      </div>
                    )}

                    <div className="space-y-3">
                      <button 
                        type="button" 
                        onClick={executeSystemOverride} 
                        disabled={isExecuting} 
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-red-600/30 disabled:opacity-50"
                      >
                        {isExecuting ? <Loader2 size={16} className="animate-spin" /> : 'CONFIRM PURGE & FORCE SYNC'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setActiveModal('NONE')} 
                        disabled={isExecuting} 
                        className="w-full bg-black/60 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all"
                      >
                        ABORT PROTOCOL
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* MODAL 2: ENVIRONMENTS */}
              {activeModal === 'ENVIRONMENTS' && (
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#050A14] border border-blue-500/50 w-full max-w-lg shadow-2xl rounded-2xl pointer-events-auto overflow-hidden">
                  <div className="flex justify-between items-center bg-blue-950/40 p-5 border-b border-blue-900/50">
                    <div className="flex items-center text-blue-400 font-bold tracking-wider uppercase text-sm">
                      <Server size={18} className="mr-2.5" /> Environment Status
                    </div>
                    <button type="button" onClick={() => setActiveModal('NONE')} className="text-slate-400 hover:text-white transition-colors" title="Close modal">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-6 grid gap-4">
                    {[
                      { name: 'Next.js Frontend Edge', status: 'ONLINE', ping: '0ms', icon: Activity },
                      { name: 'Node.js Core Backend', status: envData.status, ping: envData.ping, icon: Terminal },
                      { name: 'Turso Cloud libSQL Database', status: envData.status, ping: envData.dbPing, icon: Database },
                    ].map((env, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-black/60 border border-blue-900/30 p-4 rounded-xl">
                        <div className="flex items-center space-x-3.5">
                          <env.icon size={18} className="text-blue-400 opacity-80" />
                          <div>
                            <p className="text-xs font-bold text-white tracking-wider uppercase">{env.name}</p>
                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">Latency: {env.ping}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-black font-mono tracking-wider ${env.status === 'ONLINE' ? 'text-emerald-400' : 'text-red-400'}`}>{env.status}</span>
                          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${env.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* MODAL 3: LIVE NOTIFICATIONS */}
              {activeModal === 'NOTIFICATIONS' && (
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute right-0 top-0 h-full w-full max-w-md bg-[#050A14] border-l border-blue-900/50 shadow-2xl flex flex-col pointer-events-auto">
                  <div className="h-20 border-b border-blue-900/50 bg-black/60 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center text-blue-400 font-bold">
                      <Bell size={18} className="mr-2.5" />
                      <h2 className="text-base font-black text-white uppercase tracking-wider">System Alerts ({notifications.length})</h2>
                    </div>
                    <button type="button" onClick={() => setActiveModal('NONE')} title="Close notifications" className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg bg-black/50 border border-slate-800">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-admin-scroll">
                    {notifications.length > 0 ? notifications.map(notif => {
                      const isUrgent = notif.priority === 'URGENT';
                      const isHigh = notif.priority === 'HIGH';
                      const styles = isUrgent 
                        ? { bg: 'bg-red-950/20', border: 'border-red-900/50', text: 'text-red-400', icon: AlertTriangle }
                        : isHigh 
                        ? { bg: 'bg-amber-950/20', border: 'border-amber-900/50', text: 'text-amber-400', icon: ShieldAlert }
                        : { bg: 'bg-blue-950/20', border: 'border-blue-900/50', text: 'text-blue-400', icon: ShieldCheck };

                      return (
                        <div key={notif.id} className={`${styles.bg} border ${styles.border} p-4 rounded-xl relative`}>
                          <div className="flex items-center mb-1.5">
                            <styles.icon size={13} className={`${styles.text} mr-2`} />
                            <span className={`text-[10px] font-black ${styles.text} font-mono tracking-wider uppercase`}>{notif.category} ALERT</span>
                          </div>
                          <p className="text-xs text-slate-200 font-mono leading-relaxed">{notif.message}</p>
                          <p className="text-[9px] text-slate-500 mt-2 font-mono uppercase">FROM: {notif.user?.username || notif.user?.fullName || 'GUEST_NODE'} | {new Date(notif.createdAt).toLocaleTimeString()}</p>
                        </div>
                      );
                    }) : (
                      <div className="text-center text-slate-500 text-xs font-mono uppercase tracking-wider pt-10">NO SYSTEM ALERTS</div>
                    )}
                  </div>
                </motion.div>
              )}

            </div>
          </>
        )}
      </AnimatePresence>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10 pb-12">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: IDENTITY & STATUS HUB */}
        {/* ========================================================= */}
        <div className="xl:col-span-3 space-y-6">
          
          <motion.div variants={itemVariants} className="bg-[#050A14] border border-blue-900/40 rounded-2xl p-6 relative group shadow-xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-black border border-blue-500/50 flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20">
                {adminProfile?.profilePic ? (
                  <img src={adminProfile.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-blue-400">{adminProfile?.fullName ? adminProfile.fullName.charAt(0).toUpperCase() : 'A'}</span>
                )}
              </div>
              <div className="truncate">
                <h2 className="text-white font-bold tracking-wide uppercase truncate text-sm">{adminProfile?.fullName || adminProfile?.username || 'SYS_ADMIN'}</h2>
                <p className="text-[10px] text-red-400 font-mono tracking-wider uppercase mt-1 flex items-center">
                  <ShieldAlert size={12} className="mr-1" /> Master Administrator
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-mono tracking-wider text-slate-400 mb-2 uppercase">
                  <span>Network Integrity</span>
                  <span className="text-blue-400 font-bold">{dashData?.networkIntegrity || '99.9'}%</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded-full w-full relative overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${dashData?.networkIntegrity || 99.9}%` }} transition={{ duration: 1 }} className="absolute top-0 left-0 h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                </div>
              </div>
              
              <button 
                onClick={() => setActiveModal('OVERRIDE')} 
                className="w-full bg-red-950/40 border border-red-900/50 hover:border-red-500 text-xs font-mono font-bold uppercase tracking-wider text-red-400 hover:text-white py-3.5 rounded-xl hover:bg-red-900/40 transition-all flex items-center justify-center shadow-lg shadow-red-950/30"
              >
                <Zap size={14} className="mr-2" /> Execute System Override
              </button>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants} 
            onClick={() => setActiveModal('ENVIRONMENTS')} 
            className="bg-[#050A14] border border-blue-900/40 rounded-2xl p-6 shadow-xl cursor-pointer hover:border-blue-500/50 transition-all group"
          >
            <div className="flex justify-between items-center border-b border-blue-900/30 pb-4 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-blue-400 transition-colors">Infrastructure Nodes</h3>
              <span className={`text-[10px] font-mono font-bold flex items-center ${envData.status === 'ONLINE' ? 'text-emerald-400' : 'text-red-400'}`}>
                <span className="w-2 h-2 rounded-full mr-1.5 bg-emerald-500 animate-pulse" /> {envData.status}
              </span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Next.js Frontend Edge', ping: '0ms' },
                { name: 'Node.js Core Backend', ping: envData.ping },
                { name: 'Turso Cloud libSQL', ping: envData.dbPing },
              ].map((env, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-black/40 border border-blue-900/20 group-hover:border-blue-900/40 transition-colors">
                  <div className="flex items-center space-x-2.5">
                    <Server size={14} className="text-blue-400 opacity-80" />
                    <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wide">{env.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-blue-400">{env.ping}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ========================================================= */}
        {/* CENTER COLUMN: HERO & ROSTER */}
        {/* ========================================================= */}
        <div className="xl:col-span-6 space-y-6">
          <motion.div variants={itemVariants} className="h-60 bg-gradient-to-br from-black via-[#0a0510] to-[#150a0a] rounded-2xl relative overflow-hidden border border-red-900/40 shadow-2xl p-8 flex flex-col justify-between">
            <div className="relative z-20">
              <span className="inline-block px-3 py-1 bg-red-950/60 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold tracking-widest uppercase mb-3 rounded-md">
                SCHEDULED MAINTENANCE CYCLE
              </span>
              <h2 className="text-3xl font-black text-white tracking-wide uppercase">Core Node Cluster <span className="text-red-500">Sync #9</span></h2>
            </div>
            
            <div className="flex items-end justify-between relative z-20">
              <div className="flex space-x-4">
                {Object.entries(countdown).map(([unit, val]) => (
                  <div key={unit} className="flex flex-col">
                    <span className="text-3xl font-black text-white font-mono leading-none">{val.toString().padStart(2, '0')}</span>
                    <span className="text-[9px] text-red-400 font-mono uppercase tracking-widest mt-1">{unit}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => router.push('/admin/system')} 
                className="bg-red-600 hover:bg-red-500 text-xs font-mono font-bold uppercase tracking-wider text-white px-6 py-3 rounded-xl transition-colors shadow-lg shadow-red-600/30 flex items-center"
              >
                Inspect Telemetry <ArrowRight size={14} className="ml-2" />
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-[#050A14] border border-blue-900/40 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-blue-900/40 p-4 bg-black/60">
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">Active Registered Nodes</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Total: <strong className="text-blue-400 ml-1">{dashData?.totalNodes || 0}</strong>
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-blue-900/30 bg-[#020617] text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    <th className="p-3.5 pl-5">Node_ID</th>
                    <th className="p-3.5">Identifier</th>
                    <th className="p-3.5">Clearance</th>
                    <th className="p-3.5 text-right pr-5">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-300 font-mono">
                  {dashData?.nodes && dashData.nodes.length > 0 ? (
                    dashData.nodes.map((node: any) => (
                      <tr 
                        key={node.id} 
                        className="border-b border-blue-900/20 hover:bg-blue-950/20 transition-colors group cursor-pointer" 
                        onClick={() => router.push('/admin/users')}
                      >
                        <td className="p-3.5 pl-5 text-[11px] text-slate-500">#{node.id.substring(0, 8)}...</td>
                        <td className="p-3.5">
                          <span className="font-bold text-white tracking-wide uppercase group-hover:text-blue-400 transition-colors">
                            {node.fullName || node.username}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-mono tracking-wider px-2.5 py-1 rounded-md border ${node.role === 'admin' ? 'border-red-500/50 bg-red-950/30 text-red-400' : 'border-slate-800 bg-black text-slate-400'}`}>
                            {node.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 text-right pr-5">
                          <span className={`text-[10px] font-bold tracking-wider uppercase inline-flex items-center ${node.status === 'SUSPENDED' ? 'text-amber-400' : (node.isVerified ? 'text-emerald-400' : 'text-slate-400')}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${node.status === 'SUSPENDED' ? 'bg-amber-400' : (node.isVerified ? 'bg-emerald-400' : 'bg-slate-400')}`} />
                            {node.status === 'SUSPENDED' ? 'SUSPENDED' : (node.isVerified ? 'VERIFIED' : 'PENDING')}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500 text-xs font-mono uppercase tracking-wider">NO NODES DETECTED</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-3 bg-black/60 border-t border-blue-900/40 text-center">
               <button onClick={() => router.push('/admin/users')} className="text-xs font-mono font-bold text-blue-400 hover:text-white tracking-wider uppercase transition-colors py-1">
                 Manage Full Node Roster »
               </button>
            </div>
          </motion.div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: ANALYTICS & LIVE GRAPHS */}
        {/* ========================================================= */}
        <div className="xl:col-span-3 space-y-6">
          
          <motion.div variants={itemVariants} className="bg-[#050A14] border border-blue-900/40 rounded-2xl p-6 shadow-xl h-64 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b border-blue-900/30 pb-3 mb-3 shrink-0">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live API Traffic</h3>
              <Crosshair size={14} className="text-blue-400 animate-spin" />
            </div>
            <div className="space-y-2.5 overflow-hidden flex-1 font-mono">
              <AnimatePresence>
                {liveTraffic.length > 0 ? liveTraffic.map((item, i) => (
                  <motion.div key={item.id + item.time + i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex justify-between items-center bg-black/40 border border-blue-900/20 p-2.5 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'ERROR' ? 'bg-red-400 animate-pulse' : 'bg-blue-400'}`} />
                      <div>
                        <p className="text-[10px] font-bold text-slate-300 truncate max-w-[110px]">{item.endpoint}</p>
                        <p className="text-[9px] text-slate-500">{item.id}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-blue-400">{item.time}</span>
                  </motion.div>
                )) : (
                  <div className="text-center text-slate-500 text-xs font-mono pt-8 uppercase tracking-wider">AWAITING PACKETS...</div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-[#050A14] border border-blue-900/40 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-blue-900/30 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Hardware Load</h3>
              <Activity size={14} className="text-blue-400 animate-pulse" />
            </div>
            
            {/* CPU GRAPH */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-2 uppercase">
                <span className="flex items-center"><Cpu size={12} className="mr-1.5 text-red-400" /> CPU Core Load</span>
                <span className="text-red-400 font-bold">{dashData?.hardware.cpuUsage || 0}%</span>
              </div>
              <div className="h-16 w-full bg-black/60 rounded-xl border border-red-900/30 relative overflow-hidden flex items-end">
                 <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full relative z-10">
                   <defs>
                     <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="rgba(239,68,68,0.5)" />
                       <stop offset="100%" stopColor="rgba(239,68,68,0)" />
                     </linearGradient>
                   </defs>
                   <path d={createGraphPath(hardwareHistory.map(h => h.cpu), 100)} fill="url(#redGradient)" stroke="none" />
                   <path d={createGraphPath(hardwareHistory.map(h => h.cpu), 100).replace(/M 0,100 L | L 100,100/g, '')} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
                 </svg>
              </div>
            </div>

            {/* RAM GRAPH */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-2 uppercase">
                <span className="flex items-center"><Database size={12} className="mr-1.5 text-blue-400" /> RAM Memory Heap</span>
                <span className="text-blue-400 font-bold">{dashData?.hardware.memory.usedGB || '0.00'} GB</span>
              </div>
              <div className="h-16 w-full bg-black/60 rounded-xl border border-blue-900/30 relative overflow-hidden flex items-end">
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
          </motion.div>

        </div>
      </motion.div>

      <style jsx global>{`
        .custom-admin-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-admin-scroll::-webkit-scrollbar-track { background: rgba(3, 8, 22, 0.6); }
        .custom-admin-scroll::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.4); border-radius: 4px; }
        .custom-admin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.8); }
      `}</style>
    </div>
  );
}
