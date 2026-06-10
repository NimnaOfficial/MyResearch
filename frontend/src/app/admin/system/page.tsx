"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Activity, MessageSquare, Terminal, Database, 
  ShieldAlert, Zap, Cpu, Server, ShieldCheck, 
  Search, Trash2, MailOpen, Mail, Network, 
  Wifi, HardDrive, Gauge, Globe, Layers, ArrowRight
} from 'lucide-react';

import CustomCursor from '@/components/CustomCursor';

// ==========================================
// BACKGROUND: SHARPENED CYBER GRID
// ==========================================
function CommandBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#01030a] overflow-hidden">
      {/* High-Contrast Cyber Grid */}
      <motion.div 
        animate={{ backgroundPosition: ["0px 0px", "0px 60px"] }} 
        transition={{ duration: 15, ease: "linear", repeat: Infinity }}
        className="absolute inset-0 w-full h-full opacity-20" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`, 
          backgroundSize: '60px 60px' 
        }} 
      />
      {/* Sweeping Radar Line */}
      <motion.div 
        animate={{ top: ['-10%', '110%'] }} 
        transition={{ duration: 8, ease: "linear", repeat: Infinity }}
        className="absolute left-0 right-0 h-[2px] bg-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.8)] z-0" 
      />
      {/* Core Glows */}
      <motion.div animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.1, 1] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full blur-[150px] bg-blue-700/20" />
      <motion.div animate={{ opacity: [0.02, 0.08, 0.02], scale: [1, 1.2, 1] }} transition={{ duration: 12, repeat: Infinity }} className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] rounded-full blur-[150px] bg-yellow-500/20" />
    </div>
  );
}

// ==========================================
// MOCK DATA (Failsafe Telemetry)
// ==========================================
const MOCK_MESSAGES = [
  { id: 'msg-1', userId: 'usr-992', user: { fullName: 'Lochana', username: 'lochana_dev' }, category: 'SECURITY', priority: 'URGENT', message: 'System breached at node 4. Need immediate reset of the auth matrix. The firewall is throwing 500 errors on the main route!', rating: 1, createdAt: new Date().toISOString(), read: false },
  { id: 'msg-2', userId: 'usr-104', user: { fullName: 'Guest User', username: 'guest_001' }, category: 'BUG', priority: 'HIGH', message: 'The 3D canvas is stuttering on mobile devices. I think the WebGL memory is leaking on the projects page.', rating: 3, createdAt: new Date(Date.now() - 86400000).toISOString(), read: true },
];

const MOCK_LOGS = [
  { id: 'log-1', action: 'DATABASE_SYNC_COMPLETE', status: 'OK', ip: '127.0.0.1', createdAt: new Date().toISOString() },
  { id: 'log-2', action: 'UNAUTHORIZED_PORT_SCAN', status: 'ERROR', ip: '192.168.1.44', createdAt: new Date(Date.now() - 60000).toISOString() },
  { id: 'log-3', action: 'PAYLOAD_INJECTED_NODE_A', status: 'OK', ip: '127.0.0.1', createdAt: new Date(Date.now() - 120000).toISOString() },
  { id: 'log-4', action: 'MEMORY_HEAP_SPIKE', status: 'WARN', ip: 'SERVER_CORE', createdAt: new Date(Date.now() - 300000).toISOString() },
];

const CLIP_PATH = "polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)";
const CLIP_PATH_REVERSE = "polygon(15px 0, 100% 0, 100% 100%, 0 100%, 0 15px)";

// ==========================================
// MAIN COMMAND CENTER
// ==========================================
export default function SystemCommandCenter() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INBOX' | 'TOPOLOGY' | 'LOGS'>('OVERVIEW');
  const [currentTime, setCurrentTime] = useState("");
  
  // Data States
  const [messages, setMessages] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inbox & Topology States
  const [activeMessage, setActiveMessage] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [netSpeed, setNetSpeed] = useState({ down: 1240, up: 480 });

  // Clock & Network Sim
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " | " + now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase());
      
      // Simulate live network speed fluctuations
      setNetSpeed(prev => ({
        down: Math.max(800, Math.min(1800, prev.down + (Math.random() * 100 - 50))),
        up: Math.max(200, Math.min(800, prev.up + (Math.random() * 40 - 20)))
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hydration Engine
  useEffect(() => {
    const fetchSystemData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('matrix_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const [fbRes, logRes] = await Promise.all([
          fetch('http://localhost:5000/api/feedback', { headers }).catch(() => null),
          fetch('http://localhost:5000/api/admin/logs', { headers }).catch(() => null)
        ]);

        const fbData = fbRes && fbRes.ok ? (await fbRes.json()).data : MOCK_MESSAGES;
        const logData = logRes && logRes.ok ? (await logRes.json()).data : MOCK_LOGS;

        setMessages(fbData || MOCK_MESSAGES);
        setLogs(logData || MOCK_LOGS);
      } catch (e) {
        setMessages(MOCK_MESSAGES); setLogs(MOCK_LOGS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSystemData();
  }, []);

  const filteredMessages = useMemo(() => {
    return messages.filter(m => 
      m.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  return (
    <main className="min-h-screen font-sans text-blue-50 selection:bg-yellow-400/30 flex overflow-hidden cursor-none bg-[#010205]">
      <CustomCursor />
      <CommandBackground />

      {/* ==========================================
          LEFT RAIL: TACTICAL NAVIGATION
          ========================================== */}
      <aside className="w-20 lg:w-72 h-screen bg-[#020510]/95 backdrop-blur-2xl border-r border-blue-900/50 flex flex-col relative z-20 shrink-0 shadow-[20px_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Branding Node */}
        <div className="h-28 border-b border-blue-900/50 flex flex-col items-center justify-center lg:items-start lg:px-8 bg-black relative overflow-hidden" style={{ clipPath: CLIP_PATH }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[30px]" />
          <div className="flex items-center">
            <ShieldCheck size={24} className="text-yellow-400 lg:mr-3 shrink-0" />
            <div className="hidden lg:flex flex-col">
              <h1 className="text-xl font-black tracking-[0.2em] uppercase text-white">CSX<span className="text-blue-500">CORE</span></h1>
            </div>
          </div>
          <p className="hidden lg:block text-[9px] font-mono text-yellow-400/80 tracking-[0.3em] uppercase mt-2 border-l-2 border-yellow-400 pl-2">System Auth: Admin</p>
        </div>

        {/* Action Tabs */}
        <div className="flex-1 py-8 flex flex-col gap-3 px-4">
          {[
            { id: 'OVERVIEW', icon: Activity, label: 'System Overview' },
            { id: 'INBOX', icon: MessageSquare, label: 'Secure Inbox', badge: messages.filter(m => !m.read).length },
            { id: 'TOPOLOGY', icon: Network, label: 'Network Topology' }, // 🔥 NEW ADVANCED TAB
            { id: 'LOGS', icon: Terminal, label: 'Activity Logs' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                style={{ clipPath: CLIP_PATH }}
                className={`w-full flex items-center justify-center lg:justify-start p-4 transition-all relative group ${isActive ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-[#050b1a] border border-blue-900/40 text-blue-400 hover:bg-blue-900/30 hover:border-blue-500/50'}`}
              >
                <tab.icon size={18} className={`shrink-0 ${isActive ? 'text-yellow-300' : 'group-hover:text-yellow-400'}`} />
                <span className={`hidden lg:block ml-4 text-xs font-black uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>{tab.label}</span>
                
                {tab.badge ? (
                  <span className={`absolute top-2 right-2 lg:top-1/2 lg:-translate-y-1/2 lg:right-4 w-5 h-5 flex items-center justify-center text-[10px] font-black ${isActive ? 'text-black bg-yellow-400' : 'text-white bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`} style={{ clipPath: "polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)" }}>
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        {/* Uplink Footer */}
        <div className="p-6 border-t border-blue-900/50 bg-[#010205]">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#050b1a] border border-blue-800 flex items-center justify-center relative" style={{ clipPath: "polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)" }}>
               <div className="w-2 h-2 bg-yellow-400 animate-pulse shadow-[0_0_10px_rgba(250,204,21,1)]" />
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Uplink Active</span>
              <span className="text-[9px] font-mono text-slate-500">{currentTime.split(' | ')[1]}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ==========================================
          MAIN CANVAS ENGINE
          ========================================== */}
      <section className="flex-1 flex flex-col h-screen relative z-10">
        
        {/* HUD Header */}
        <header className="h-20 px-8 border-b border-blue-900/30 flex items-center justify-between bg-[#01030a]/80 backdrop-blur-md shrink-0">
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex space-x-1">
               <div className="w-2 h-6 bg-blue-600 transform skew-x-12" />
               <div className="w-2 h-6 bg-blue-800 transform skew-x-12" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-[0.2em] uppercase text-white">{activeTab.replace('_', ' ')}</h2>
              <p className="text-[10px] font-mono text-yellow-400 tracking-widest">{currentTime.split(' | ')[0]} <span className="text-blue-600 ml-2">EST.</span></p>
            </div>
          </div>
          <button onClick={() => router.push('/projects')} className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-black hover:bg-yellow-400 transition-all border border-blue-800 hover:border-yellow-400 px-6 py-3 bg-blue-950/30 flex items-center shadow-[0_0_15px_rgba(59,130,246,0.1)]" style={{ clipPath: CLIP_PATH_REVERSE }}>
            <Database size={14} className="mr-2" /> Disconnect to Matrix
          </button>
        </header>

        {/* Active Module Render */}
        <div className="flex-1 overflow-hidden relative p-6 lg:p-8">
          <AnimatePresence mode="wait">
            
            {/* -------------------------------------
                TAB 1: SYSTEM OVERVIEW
                ------------------------------------- */}
            {activeTab === 'OVERVIEW' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full overflow-y-auto custom-scrollbar space-y-6">
                
                {/* Primary Bento Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Active Sessions', value: '42', icon: Activity, color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-900/20' },
                    { label: 'Unread Urgent', value: messages.filter(m => !m.read && m.priority === 'URGENT').length, icon: ShieldAlert, color: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-900/20' },
                    { label: 'Prisma DB Ops', value: '8.4k/s', icon: Database, color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-900/20' },
                    { label: 'System Memory', value: '64%', icon: Cpu, color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-900/20' },
                  ].map((stat, i) => (
                    <div key={i} className={`p-6 border-b-2 border-r-2 ${stat.border} ${stat.bg} backdrop-blur-md flex flex-col justify-between shadow-2xl relative overflow-hidden group`} style={{ clipPath: CLIP_PATH }}>
                       <div className="absolute -right-6 -top-6 opacity-10 group-hover:opacity-20 transition-opacity"><stat.icon size={100} className={stat.color} /></div>
                       <div className="flex justify-between items-start mb-6 relative z-10">
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{stat.label}</span>
                         <stat.icon size={16} className={stat.color} />
                       </div>
                       <span className={`text-4xl font-black tracking-tighter relative z-10 ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>

                {/* Network Speed & Logs Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[450px]">
                  
                  {/* Network Live Speedometer */}
                  <div className="rounded-none border border-blue-900/50 bg-[#020510]/80 p-6 flex flex-col relative" style={{ clipPath: CLIP_PATH_REVERSE }}>
                    <h3 className="text-xs font-black tracking-widest uppercase text-blue-400 flex items-center mb-8"><Gauge size={14} className="mr-2"/> Real-Time Bandwidth</h3>
                    
                    <div className="flex-1 flex flex-col justify-center space-y-8">
                       {/* Downlink */}
                       <div>
                         <div className="flex justify-between items-end mb-2">
                           <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Downlink (Rx)</span>
                           <span className="text-xl font-black text-emerald-400">{netSpeed.down.toFixed(0)} <span className="text-[10px] text-emerald-600">MB/s</span></span>
                         </div>
                         <div className="w-full bg-blue-950 h-2 overflow-hidden">
                           <motion.div animate={{ width: `${(netSpeed.down / 2000) * 100}%` }} className="h-full bg-emerald-400 shadow-[0_0_10px_#34d399]" transition={{ ease: "linear", duration: 1 }} />
                         </div>
                       </div>

                       {/* Uplink */}
                       <div>
                         <div className="flex justify-between items-end mb-2">
                           <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Uplink (Tx)</span>
                           <span className="text-xl font-black text-yellow-400">{netSpeed.up.toFixed(0)} <span className="text-[10px] text-yellow-600">MB/s</span></span>
                         </div>
                         <div className="w-full bg-blue-950 h-2 overflow-hidden">
                           <motion.div animate={{ width: `${(netSpeed.up / 1000) * 100}%` }} className="h-full bg-yellow-400 shadow-[0_0_10px_#facc15]" transition={{ ease: "linear", duration: 1 }} />
                         </div>
                       </div>
                    </div>
                  </div>

                  {/* Terminal Logs */}
                  <div className="lg:col-span-2 rounded-none border border-blue-900/50 bg-black/90 p-6 flex flex-col relative" style={{ clipPath: CLIP_PATH }}>
                    <div className="flex items-center justify-between mb-6 border-b border-blue-900/50 pb-4">
                      <h3 className="text-xs font-black tracking-widest uppercase text-blue-500 flex items-center"><Terminal size={14} className="mr-2"/> Matrix Log Stream</h3>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-blue-900" />
                        <div className="w-2 h-2 bg-blue-700" />
                        <div className="w-2 h-2 bg-blue-500" />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar font-mono text-xs">
                      {logs.map(log => (
                        <div key={log.id} className="flex flex-col md:flex-row md:items-center py-2 border-b border-blue-900/20 last:border-0">
                          <span className="text-blue-600 w-24 shrink-0">{new Date(log.createdAt).toLocaleTimeString()}</span>
                          <span className={`w-16 shrink-0 font-bold ${log.status === 'ERROR' ? 'text-red-500' : log.status === 'WARN' ? 'text-yellow-400' : 'text-emerald-400'}`}>[{log.status}]</span>
                          <span className="text-blue-100 truncate flex-1">{log.action}</span>
                          <span className="text-blue-800 hidden md:block">| {log.ip}</span>
                        </div>
                      ))}
                      <div className="pt-2 flex items-center text-blue-500">
                         root@csx:~# <motion.div animate={{opacity:[1,0,1]}} transition={{duration:1, repeat:Infinity}} className="w-2 h-4 bg-yellow-400 ml-2" />
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* -------------------------------------
                TAB 2: SECURE INBOX
                ------------------------------------- */}
            {activeTab === 'INBOX' && (
              <motion.div key="inbox" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="h-full flex gap-6">
                
                {/* Message List */}
                <div className="w-1/3 min-w-[320px] h-full flex flex-col">
                  <div className="p-4 mb-4 bg-[#020510]/80 border border-blue-900/50" style={{ clipPath: CLIP_PATH }}>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                      <input 
                        type="text" placeholder="Search comms..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-blue-950/20 border-none py-2 pl-9 pr-3 text-xs font-mono text-blue-100 focus:outline-none transition-colors placeholder-blue-700"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {filteredMessages.map(msg => {
                      const isUrgent = msg.priority === 'URGENT';
                      const isSelected = activeMessage?.id === msg.id;
                      
                      return (
                        <div 
                          key={msg.id} onClick={() => setActiveMessage(msg)}
                          className={`p-5 cursor-pointer transition-all border-l-4 ${isSelected ? 'bg-blue-900/30 border-blue-500 shadow-[inset_2px_0_10px_rgba(59,130,246,0.2)]' : 'bg-[#020510]/80 border-transparent hover:bg-blue-900/20 hover:border-blue-800'} ${!msg.read && isUrgent ? 'border-yellow-400 bg-yellow-900/10' : ''}`}
                          style={{ clipPath: CLIP_PATH }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                              {!msg.read && <div className={`w-2 h-2 ${isUrgent ? 'bg-yellow-400 animate-pulse' : 'bg-blue-500'}`} style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />}
                              <span className={`text-xs font-black uppercase tracking-widest truncate max-w-[140px] ${!msg.read ? 'text-white' : 'text-blue-400'}`}>@{msg.user?.username || 'GUEST'}</span>
                            </div>
                            <span className="text-[9px] font-mono text-blue-600">{new Date(msg.createdAt).toLocaleDateString()}</span>
                          </div>
                          <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isUrgent ? 'text-yellow-400' : 'text-blue-500'}`}>[{msg.category}]</h4>
                          <p className="text-xs text-blue-200/50 font-mono line-clamp-2 leading-relaxed">{msg.message}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Message Detail Pane */}
                <div className="flex-1 h-full bg-[#020510]/90 border border-blue-900/50 flex flex-col relative" style={{ clipPath: CLIP_PATH_REVERSE }}>
                  {activeMessage ? (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col">
                      {/* Detail Header */}
                      <div className="p-8 border-b border-blue-900/50 bg-black/40 flex justify-between items-start shrink-0">
                        <div>
                          <div className="flex items-center space-x-3 mb-4">
                            <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border ${activeMessage.priority === 'URGENT' ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400' : 'bg-blue-900/20 border-blue-500 text-blue-400'}`} style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}>
                              PRIORITY: {activeMessage.priority}
                            </span>
                            <span className="text-[10px] font-mono text-blue-500 border border-blue-900/50 px-3 py-1">
                              CAT: {activeMessage.category}
                            </span>
                          </div>
                          <h2 className="text-2xl font-black text-white uppercase tracking-widest">Comms Decrypted</h2>
                          <div className="flex items-center mt-4 text-xs font-mono text-blue-400">
                            <Layers size={14} className="mr-2" /> Sender Node: {activeMessage.user?.fullName}
                          </div>
                        </div>
                        <button className="p-4 bg-red-950/20 border border-red-900/50 text-red-500 hover:bg-red-600 hover:text-white transition-colors delete-btn-clip" title="Delete message">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Detail Body */}
                      <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                         <div className="text-sm md:text-base font-mono leading-loose text-blue-100/80 whitespace-pre-wrap pl-6 border-l border-blue-800">
                           {activeMessage.message}
                         </div>
                        
                         {/* Secure Meta Data */}
                         <div className="mt-16 p-6 bg-blue-950/10 border border-blue-900/30 grid grid-cols-2 gap-6" style={{ clipPath: CLIP_PATH }}>
                            <div>
                              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">Attached Telemetry</h4>
                              <p className="text-xs font-mono text-white">Rating: {activeMessage.rating} / 5</p>
                            </div>
                            <div>
                              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2">Origin Timestamp</h4>
                              <p className="text-xs font-mono text-white">{new Date(activeMessage.createdAt).toUTCString()}</p>
                            </div>
                         </div>
                      </div>
                      
                      {/* Action Footer */}
                      <div className="p-6 border-t border-blue-900/50 bg-black/40 shrink-0 flex gap-4">
                         <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest py-5 transition-all flex items-center justify-center" style={{ clipPath: CLIP_PATH }}>
                           <Mail className="mr-2" size={16} /> Transmit Reply
                         </button>
                         {activeMessage.priority === 'URGENT' && (
                           <button className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-widest py-5 transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] flex items-center justify-center" style={{ clipPath: CLIP_PATH }}>
                             <Zap className="mr-2" size={16} /> Escalate to Core
                           </button>
                         )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-blue-900">
                      <MailOpen size={64} className="mb-6 opacity-30" />
                      <p className="text-xs font-mono uppercase tracking-[0.3em]">Awaiting node selection for decryption.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* -------------------------------------
                TAB 3: NETWORK TOPOLOGY (NEW!)
                ------------------------------------- */}
            {activeTab === 'TOPOLOGY' && (
              <motion.div key="topology" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="h-full overflow-y-auto custom-scrollbar space-y-6">
                 
                 {/* Top Row: Global Network & Routing Health */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="p-8 border-t-2 border-l-2 border-blue-500/50 bg-[#020510]/90 shadow-2xl relative overflow-hidden group" style={{ clipPath: CLIP_PATH }}>
                      <Globe size={150} className="absolute -right-10 -top-10 text-blue-900/20 group-hover:text-blue-800/30 transition-colors duration-1000" />
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 mb-8 flex items-center relative z-10"><Network size={16} className="mr-3" /> Global Routing Status</h3>
                      <div className="space-y-6 relative z-10">
                        {[ { region: 'us-east-1', status: 'ONLINE', ping: '12ms' }, { region: 'eu-central-1', status: 'ONLINE', ping: '24ms' }, { region: 'ap-south-1 (LK)', status: 'ACTIVE', ping: '4ms' } ].map(node => (
                           <div key={node.region} className="flex justify-between items-center border-b border-blue-900/30 pb-3">
                             <div className="flex items-center space-x-3">
                               <div className="w-1.5 h-1.5 bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                               <span className="font-mono text-xs text-white">{node.region}</span>
                             </div>
                             <div className="flex items-center space-x-4 font-mono text-[10px]">
                               <span className="text-emerald-500">{node.status}</span>
                               <span className="text-blue-400">{node.ping}</span>
                             </div>
                           </div>
                        ))}
                      </div>
                   </div>

                   <div className="p-8 border-b-2 border-r-2 border-yellow-500/50 bg-[#020510]/90 shadow-2xl relative" style={{ clipPath: CLIP_PATH_REVERSE }}>
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400 mb-8 flex items-center"><Activity size={16} className="mr-3" /> Core API Latency Matrix</h3>
                      <div className="space-y-6">
                        {[ 
                          { route: '/api/releases', load: 85, time: '14ms', color: 'bg-emerald-400' }, 
                          { route: '/api/auth/me', load: 45, time: '22ms', color: 'bg-yellow-400' }, 
                          { route: '/api/showcase (Media)', load: 92, time: '48ms', color: 'bg-red-500' } 
                        ].map(api => (
                           <div key={api.route}>
                             <div className="flex justify-between items-end mb-2 font-mono text-[10px] uppercase">
                               <span className="text-blue-300">{api.route}</span>
                               <span className="text-white">{api.time}</span>
                             </div>
                             <div className="w-full bg-blue-950 h-1">
                               <motion.div initial={{ width: 0 }} animate={{ width: `${api.load}%` }} transition={{ duration: 1 }} className={`h-full ${api.color}`} />
                             </div>
                           </div>
                        ))}
                      </div>
                   </div>
                 </div>

                 {/* Bottom Row: Database & Storage */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 p-8 border border-blue-900/50 bg-black/80" style={{ clipPath: CLIP_PATH }}>
                     <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-6 flex items-center"><Database size={16} className="mr-3" /> Prisma Query Engine Health</h3>
                     <div className="grid grid-cols-3 gap-6">
                        <div className="p-4 bg-blue-950/20 border border-blue-900/30">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Active Connections</p>
                          <p className="text-2xl font-mono text-white">12 / 50</p>
                        </div>
                        <div className="p-4 bg-blue-950/20 border border-blue-900/30">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Cache Hit Rate</p>
                          <p className="text-2xl font-mono text-emerald-400">94.2%</p>
                        </div>
                        <div className="p-4 bg-blue-950/20 border border-blue-900/30">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Pool Memory Heap</p>
                          <p className="text-2xl font-mono text-yellow-400">128 MB</p>
                        </div>
                     </div>
                   </div>

                   <div className="p-8 border border-blue-900/50 bg-blue-950/10 flex flex-col justify-center items-center text-center" style={{ clipPath: CLIP_PATH_REVERSE }}>
                      <HardDrive size={32} className="text-blue-500 mb-4" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white mb-2">Storage Block Volume</h3>
                      <p className="text-3xl font-black text-blue-400 tracking-tighter">4.2 <span className="text-sm">TB</span></p>
                      <div className="w-full bg-blue-900/50 h-1 mt-6">
                        <div className="w-[34%] h-full bg-blue-400" />
                      </div>
                      <p className="text-[9px] font-mono text-blue-600 mt-2 uppercase">34% Capacity Reached</p>
                   </div>
                 </div>

              </motion.div>
            )}

            {/* -------------------------------------
                TAB 4: ACTIVITY LOGS
                ------------------------------------- */}
            {activeTab === 'LOGS' && (
              <motion.div key="logs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full flex flex-col">
                 <div className="flex-1 bg-black/90 border-l-2 border-b-2 border-blue-500/50 p-8 flex flex-col overflow-hidden relative shadow-2xl" style={{ clipPath: CLIP_PATH }}>
                   <div className="mb-6 border-b border-blue-900/50 pb-6 flex justify-between items-center">
                     <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 flex items-center"><Terminal size={16} className="mr-3" /> sys_kernel_log.sh</h3>
                     <button className="text-[9px] font-black tracking-[0.2em] uppercase bg-blue-900/30 text-blue-400 px-4 py-2 hover:bg-blue-500 hover:text-white transition-colors" style={{ clipPath: CLIP_PATH }}>Export Logs</button>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs leading-loose space-y-2 pr-4">
                     <p className="text-yellow-400 mb-6">Initializing deep log scan... Matrix Connection Secure.</p>
                     {logs.map((log, i) => (
                       <motion.div initial={{opacity:0, x:-10}} animate={{opacity:1, x:0}} transition={{delay: i*0.1}} key={log.id} className="flex flex-col md:flex-row md:items-center py-1 hover:bg-blue-900/10 px-2 transition-colors">
                         <span className="text-blue-700 w-[200px] shrink-0">[{new Date(log.createdAt).toISOString()}]</span>
                         <span className={`w-20 shrink-0 font-bold ${log.status==='ERROR'?'text-red-500':log.status==='WARN'?'text-yellow-400':'text-emerald-400'}`}>[{log.status}]</span>
                         <span className="text-blue-300 flex-1 flex items-center"><ArrowRight size={10} className="mr-2 text-blue-800" /> <span className="text-white">{log.action}</span></span>
                         <span className="text-blue-500 w-[120px] text-right">{log.ip}</span>
                       </motion.div>
                     ))}
                     <div className="pt-8 flex items-center text-blue-500">
                       <span className="mr-2 font-bold text-white">admin@csx-core:~$</span> 
                       <motion.div animate={{opacity:[1,0,1]}} transition={{duration:1, repeat:Infinity}} className="w-2.5 h-5 bg-yellow-400" />
                     </div>
                   </div>
                 </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>

      {/* Global Scrollbar Styles for Blue Theme */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(3, 8, 22, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.5); border-radius: 0px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(250, 204, 21, 0.8); }
      `}</style>
    </main>
  );
}