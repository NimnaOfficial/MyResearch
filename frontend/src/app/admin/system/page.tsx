"use client";

import { API_URL } from '@/lib/api';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Activity, MessageSquare, Terminal, Database, 
  ShieldAlert, Zap, Cpu, Server, ShieldCheck, 
  Search, Trash2, MailOpen, Mail, Network, 
  Wifi, HardDrive, Gauge, Globe, Layers, ArrowRight,
  RefreshCw, CheckCircle2, AlertTriangle, Download, Filter
} from 'lucide-react';

import CustomCursor from '@/components/CustomCursor';

// ==========================================
// BACKGROUND: SHARPENED CYBER GRID
// ==========================================
function CommandBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#01030a] overflow-hidden">
      <motion.div 
        animate={{ backgroundPosition: ["0px 0px", "0px 60px"] }} 
        transition={{ duration: 15, ease: "linear", repeat: Infinity }}
        className="absolute inset-0 w-full h-full opacity-15" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.25) 1px, transparent 1px)`, 
          backgroundSize: '50px 50px' 
        }} 
      />
      <motion.div 
        animate={{ top: ['-10%', '110%'] }} 
        transition={{ duration: 10, ease: "linear", repeat: Infinity }}
        className="absolute left-0 right-0 h-[2px] bg-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.6)] z-0" 
      />
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full blur-[160px] bg-blue-900/10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] rounded-full blur-[160px] bg-red-900/10 pointer-events-none" />
    </div>
  );
}

export default function SystemCommandCenter() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INBOX' | 'TOPOLOGY' | 'LOGS'>('OVERVIEW');
  const [currentTime, setCurrentTime] = useState("");
  
  // Data States
  const [messages, setMessages] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Inbox States
  const [activeMessage, setActiveMessage] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [netSpeed, setNetSpeed] = useState({ down: 1240, up: 480 });

  // Logs States
  const [logFilter, setLogFilter] = useState<'ALL' | 'OK' | 'WARN' | 'ERROR'>('ALL');
  const [logSearch, setLogSearch] = useState('');

  // Clock & Network Sim
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
        " | " + 
        now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()
      );
      
      setNetSpeed(prev => ({
        down: Math.max(800, Math.min(1800, prev.down + (Math.random() * 100 - 50))),
        up: Math.max(200, Math.min(800, prev.up + (Math.random() * 40 - 20)))
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hydration Engine
  const fetchSystemData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('matrix_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [fbRes, logRes] = await Promise.all([
        fetch(`${API_URL}/api/feedback`, { headers }).catch(() => null),
        fetch(`${API_URL}/api/admin/logs?limit=50`, { headers }).catch(() => null)
      ]);

      if (fbRes && fbRes.ok) {
        const json = await fbRes.json();
        setMessages(json.data || []);
      }
      if (logRes && logRes.ok) {
        const json = await logRes.json();
        setLogs(json.data || []);
      }
    } catch (e) {
      console.error("Telemetry sync failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  // Handle Feedback Actions
  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to permanently purge this transmission?")) return;
    setActionLoading(`del-${id}`);
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`${API_URL}/api/feedback/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
        if (activeMessage?.id === id) setActiveMessage(null);
      } else {
        alert("Failed to delete transmission.");
      }
    } catch (e) {
      alert("Network failure.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReply = () => {
    if (!activeMessage) return;
    const email = activeMessage.user?.email || '';
    const subject = encodeURIComponent(`Re: [${activeMessage.category}] Feedback - Nima Platform`);
    const body = encodeURIComponent(
      `Hello ${activeMessage.user?.fullName || activeMessage.user?.username || 'Operator'},\n\n` +
      `Regarding your message:\n"${activeMessage.message}"\n\n` +
      `Response from Platform Administration:\n`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleEscalate = () => {
    if (!activeMessage) return;
    alert(`Transmission #${activeMessage.id} prioritized and escalated to root core log.`);
  };

  // Handle Logs Actions
  const handlePurgeLogs = async () => {
    if (!confirm("CRITICAL WARNING: Purge all system activity audit logs? This cannot be undone.")) return;
    setActionLoading('purge_logs');
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`${API_URL}/api/admin/logs`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLogs([]);
        alert("Audit logs successfully purged.");
      } else {
        alert("Failed to purge logs.");
      }
    } catch (e) {
      alert("Network failure.");
    } finally {
      setActionLoading(null);
    }
  };

  const exportLogsCSV = () => {
    if (filteredLogs.length === 0) return alert("No logs match current criteria to export.");
    const headers = ["ID,Action,Status,IP,Timestamp"];
    const rows = filteredLogs.map(l => `${l.id},"${(l.action || '').replace(/"/g, '""')}",${l.status},${l.ip || 'N/A'},${l.createdAt}`);
    const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CSx_System_Logs_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredMessages = useMemo(() => {
    return messages.filter(m => 
      (m.message || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.user?.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.user?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesFilter = logFilter === 'ALL' || l.status === logFilter;
      const matchesSearch = !logSearch || (l.action || '').toLowerCase().includes(logSearch.toLowerCase()) || (l.ip || '').includes(logSearch);
      return matchesFilter && matchesSearch;
    });
  }, [logs, logFilter, logSearch]);

  return (
    <main className="min-h-screen font-sans text-slate-100 flex overflow-hidden bg-[#010205] relative">
      <CustomCursor />
      <CommandBackground />

      {/* ==========================================
          LEFT RAIL: TACTICAL NAVIGATION
          ========================================== */}
      <aside className="w-20 lg:w-72 h-screen bg-[#030712]/95 backdrop-blur-2xl border-r border-blue-900/40 flex flex-col relative z-20 shrink-0 shadow-2xl">
        
        {/* Branding Node */}
        <div className="h-24 border-b border-blue-900/40 flex flex-col justify-center px-6 bg-black relative">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-blue-500/50 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <ShieldCheck size={20} className="text-blue-400" />
            </div>
            <div className="hidden lg:flex flex-col">
              <h1 className="text-lg font-black tracking-widest uppercase text-white">CSX<span className="text-red-500">CORE</span></h1>
              <p className="text-[9px] font-mono text-blue-400 tracking-wider">COMMAND CENTER</p>
            </div>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex-1 py-6 flex flex-col gap-2 px-3">
          {[
            { id: 'OVERVIEW', icon: Activity, label: 'System Overview' },
            { id: 'INBOX', icon: MessageSquare, label: 'Secure Inbox', badge: messages.filter(m => !m.read).length },
            { id: 'TOPOLOGY', icon: Network, label: 'Network Topology' },
            { id: 'LOGS', icon: Terminal, label: 'Activity Logs' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-center lg:justify-start px-4 py-3.5 rounded-xl transition-all relative group text-left ${
                  isActive 
                    ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30 border border-blue-400/50' 
                    : 'bg-[#050b1a]/80 border border-blue-900/30 text-slate-400 hover:text-white hover:bg-blue-950/40 hover:border-blue-700/50'
                }`}
              >
                <tab.icon size={18} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                <span className={`hidden lg:block ml-3.5 text-xs font-mono uppercase tracking-wider ${isActive ? 'text-white' : ''}`}>{tab.label}</span>
                
                {tab.badge ? (
                  <span className={`hidden lg:flex ml-auto items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'text-blue-900 bg-white' : 'text-white bg-red-600 animate-pulse'
                  }`}>
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        {/* Uplink Footer */}
        <div className="p-4 border-t border-blue-900/40 bg-black/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <div className="hidden lg:flex flex-col">
              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">CORE ONLINE</span>
              <span className="text-[9px] font-mono text-slate-500">{currentTime.split(' | ')[0]}</span>
            </div>
          </div>
          <button onClick={fetchSystemData} className="p-2 rounded-lg bg-blue-950/40 border border-blue-900/40 text-blue-400 hover:text-white hover:border-blue-500 transition-colors" title="Sync Data">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </aside>

      {/* ==========================================
          MAIN CANVAS ENGINE
          ========================================== */}
      <section className="flex-1 flex flex-col h-screen relative z-10 overflow-hidden">
        
        {/* HUD Header */}
        <header className="h-20 px-8 border-b border-blue-900/40 flex items-center justify-between bg-[#020617]/90 backdrop-blur-xl shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-widest uppercase text-white flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-3 animate-ping" />
              {activeTab}
            </h2>
            <p className="text-[10px] font-mono text-blue-400 tracking-wider mt-0.5">{currentTime}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.push('/admin')} 
              className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-blue-950/40 hover:bg-blue-900/40 border border-blue-900/50 hover:border-blue-500 px-5 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Dashboard
            </button>
            <button 
              onClick={() => router.push('/projects')} 
              className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400 hover:text-white bg-black hover:bg-blue-950/40 border border-blue-900/50 hover:border-blue-500 px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center"
            >
              <Database size={14} className="mr-2" /> User Portal
            </button>
          </div>
        </header>

        {/* Active Module Render */}
        <div className="flex-1 overflow-hidden relative p-6 lg:p-8">
          <AnimatePresence mode="wait">
            
            {/* -------------------------------------
                TAB 1: SYSTEM OVERVIEW
                ------------------------------------- */}
            {activeTab === 'OVERVIEW' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="h-full overflow-y-auto custom-admin-scroll space-y-6">
                
                {/* Primary Bento Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: 'Active Sessions', value: '42', icon: Activity, color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-950/20' },
                    { label: 'Urgent Transmissions', value: messages.filter(m => !m.read && m.priority === 'URGENT').length, icon: ShieldAlert, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-950/20' },
                    { label: 'Database Health', value: '99.9%', icon: Database, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-950/20' },
                    { label: 'System Memory', value: '64%', icon: Cpu, color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-950/20' },
                  ].map((stat, i) => (
                    <div key={i} className={`p-6 rounded-2xl border ${stat.border} ${stat.bg} backdrop-blur-md flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-opacity-60 transition-all`}>
                       <div className="flex justify-between items-start mb-4 relative z-10">
                         <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
                         <stat.icon size={18} className={stat.color} />
                       </div>
                       <span className={`text-4xl font-black font-mono tracking-tight relative z-10 ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>

                {/* Network Speed & Logs Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Network Live Speedometer */}
                  <div className="rounded-2xl border border-blue-900/40 bg-[#050b1a]/90 backdrop-blur-xl p-6 flex flex-col shadow-xl">
                    <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-blue-400 flex items-center mb-6">
                      <Gauge size={16} className="mr-2"/> Real-Time Bandwidth
                    </h3>
                    
                    <div className="flex-1 flex flex-col justify-center space-y-6">
                       {/* Downlink */}
                       <div className="bg-black/40 border border-blue-900/30 p-4 rounded-xl">
                         <div className="flex justify-between items-end mb-2">
                           <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Downlink (Rx)</span>
                           <span className="text-xl font-black font-mono text-emerald-400">{netSpeed.down.toFixed(0)} <span className="text-[10px] text-emerald-600">MB/s</span></span>
                         </div>
                         <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                           <motion.div animate={{ width: `${(netSpeed.down / 2000) * 100}%` }} className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" transition={{ ease: "linear", duration: 1 }} />
                         </div>
                       </div>

                       {/* Uplink */}
                       <div className="bg-black/40 border border-blue-900/30 p-4 rounded-xl">
                         <div className="flex justify-between items-end mb-2">
                           <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Uplink (Tx)</span>
                           <span className="text-xl font-black font-mono text-amber-400">{netSpeed.up.toFixed(0)} <span className="text-[10px] text-amber-600">MB/s</span></span>
                         </div>
                         <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                           <motion.div animate={{ width: `${(netSpeed.up / 1000) * 100}%` }} className="h-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" transition={{ ease: "linear", duration: 1 }} />
                         </div>
                       </div>
                    </div>
                  </div>

                  {/* Terminal Logs */}
                  <div className="lg:col-span-2 rounded-2xl border border-blue-900/40 bg-black/90 p-6 flex flex-col shadow-xl">
                    <div className="flex items-center justify-between mb-4 border-b border-blue-900/30 pb-3">
                      <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-blue-400 flex items-center">
                        <Terminal size={16} className="mr-2"/> Recent Audit Log Stream
                      </h3>
                      <button onClick={() => setActiveTab('LOGS')} className="text-[10px] font-mono text-blue-400 hover:text-white uppercase tracking-wider">
                        View All ({logs.length}) »
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-admin-scroll font-mono text-xs">
                      {logs.slice(0, 8).map(log => (
                        <div key={log.id} className="flex flex-col md:flex-row md:items-center py-2 px-3 rounded-lg bg-blue-950/20 border border-blue-900/20 hover:border-blue-500/40 transition-colors">
                          <span className="text-blue-400 w-24 shrink-0 text-[11px]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                          <span className={`w-16 shrink-0 font-bold text-[10px] ${log.status === 'ERROR' ? 'text-red-400' : log.status === 'WARN' ? 'text-amber-400' : 'text-emerald-400'}`}>
                            [{log.status}]
                          </span>
                          <span className="text-slate-200 truncate flex-1 text-[11px]">{log.action}</span>
                          <span className="text-slate-500 hidden md:block text-[10px]">| {log.ip || 'SYS'}</span>
                        </div>
                      ))}
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
                <div className="w-1/3 min-w-[340px] h-full flex flex-col">
                  <div className="p-3 mb-3 bg-[#050b1a] border border-blue-900/40 rounded-xl">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                      <input 
                        type="text" placeholder="Search comms, users, categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/60 border border-blue-900/30 rounded-lg py-2 pl-9 pr-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-admin-scroll space-y-2.5 pr-2">
                    {filteredMessages.map(msg => {
                      const isUrgent = msg.priority === 'URGENT';
                      const isSelected = activeMessage?.id === msg.id;
                      
                      return (
                        <div 
                          key={msg.id} onClick={() => setActiveMessage(msg)}
                          className={`p-4 rounded-xl cursor-pointer transition-all border ${
                            isSelected 
                              ? 'bg-blue-950/60 border-blue-500 shadow-md shadow-blue-500/10' 
                              : 'bg-[#050b1a]/90 border-blue-900/30 hover:bg-blue-950/30 hover:border-blue-700/50'
                          } ${!msg.read && isUrgent ? 'border-amber-500/60 bg-amber-950/20' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-2">
                              {!msg.read && <span className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-amber-400 animate-pulse' : 'bg-blue-500'}`} />}
                              <span className={`text-xs font-mono font-bold uppercase tracking-wider truncate max-w-[150px] ${!msg.read ? 'text-white' : 'text-slate-300'}`}>
                                @{msg.user?.username || msg.user?.fullName || 'GUEST'}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{new Date(msg.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 mb-1.5">
                            <span className={`text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                              isUrgent ? 'border-amber-500/40 bg-amber-950/30 text-amber-400' : 'border-blue-500/40 bg-blue-950/30 text-blue-400'
                            }`}>
                              {msg.category}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500">Rating: {msg.rating || 5}/5</span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono line-clamp-2 leading-relaxed">{msg.message}</p>
                        </div>
                      )
                    })}
                    {filteredMessages.length === 0 && (
                      <div className="p-8 text-center text-slate-500 font-mono text-xs uppercase tracking-wider border border-dashed border-blue-900/40 rounded-xl">
                        No transmissions found
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Detail Pane */}
                <div className="flex-1 h-full bg-[#050b1a]/95 border border-blue-900/40 rounded-2xl flex flex-col relative overflow-hidden shadow-2xl">
                  {activeMessage ? (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col">
                      {/* Detail Header */}
                      <div className="p-6 border-b border-blue-900/40 bg-black/50 flex justify-between items-start shrink-0">
                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <span className={`px-3 py-1 rounded-md text-[10px] font-mono font-black uppercase tracking-wider border ${
                              activeMessage.priority === 'URGENT' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-blue-900/30 border-blue-500 text-blue-400'
                            }`}>
                              PRIORITY: {activeMessage.priority}
                            </span>
                            <span className="text-[10px] font-mono text-slate-300 border border-blue-900/50 bg-blue-950/30 px-3 py-1 rounded-md">
                              CATEGORY: {activeMessage.category}
                            </span>
                          </div>
                          <h2 className="text-xl font-black text-white uppercase tracking-wider">Transmission Details</h2>
                          <div className="flex items-center mt-2 text-xs font-mono text-blue-400">
                            <Layers size={14} className="mr-2" /> 
                            Node: {activeMessage.user?.fullName || activeMessage.user?.username || 'Guest Node'} 
                            {activeMessage.user?.email && ` (${activeMessage.user.email})`}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteFeedback(activeMessage.id)} 
                          disabled={actionLoading === `del-${activeMessage.id}`}
                          className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm" 
                          title="Purge transmission"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Detail Body */}
                      <div className="flex-1 p-8 overflow-y-auto custom-admin-scroll">
                         <div className="text-sm font-mono leading-relaxed text-slate-200 whitespace-pre-wrap pl-6 border-l-2 border-blue-500/50 bg-black/30 p-6 rounded-r-xl border border-blue-900/30">
                           {activeMessage.message}
                         </div>
                        
                         {/* Secure Meta Data */}
                         <div className="mt-8 p-6 bg-black/40 border border-blue-900/30 rounded-xl grid grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1">Attached Rating</h4>
                              <p className="text-sm font-mono text-amber-400 font-bold">{activeMessage.rating} / 5 Stars</p>
                            </div>
                            <div>
                              <h4 className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 mb-1">Origin Timestamp</h4>
                              <p className="text-sm font-mono text-slate-300">{new Date(activeMessage.createdAt).toLocaleString()}</p>
                            </div>
                         </div>
                      </div>
                      
                      {/* Action Footer */}
                      <div className="p-6 border-t border-blue-900/40 bg-black/60 shrink-0 flex gap-4">
                         <button 
                           onClick={handleReply} 
                           className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-blue-600/30"
                         >
                           <Mail className="mr-2" size={16} /> Transmit Email Reply
                         </button>
                         {activeMessage.priority === 'URGENT' && (
                           <button 
                             onClick={handleEscalate} 
                             className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center"
                           >
                             <Zap className="mr-2" size={16} /> Escalate to Core Priority
                           </button>
                         )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                      <MailOpen size={56} className="mb-4 text-blue-500/40" />
                      <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Select an incoming transmission to decrypt and inspect payload</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* -------------------------------------
                TAB 3: NETWORK TOPOLOGY
                ------------------------------------- */}
            {activeTab === 'TOPOLOGY' && (
              <motion.div key="topology" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="h-full overflow-y-auto custom-admin-scroll space-y-6">
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="p-8 rounded-2xl border border-blue-900/40 bg-[#050b1a]/90 shadow-xl relative overflow-hidden group">
                      <Globe size={150} className="absolute -right-10 -top-10 text-blue-900/10 pointer-events-none" />
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-blue-400 mb-6 flex items-center relative z-10">
                        <Network size={16} className="mr-3" /> Global Routing Status
                      </h3>
                      <div className="space-y-4 relative z-10">
                        {[ 
                          { region: 'us-east-1 (Edge Array)', status: 'ONLINE', ping: '12ms' }, 
                          { region: 'eu-central-1 (Replica)', status: 'ONLINE', ping: '24ms' }, 
                          { region: 'aws-ap-south-1 (Turso Cloud DB)', status: 'ACTIVE', ping: '4ms' } 
                        ].map(node => (
                           <div key={node.region} className="flex justify-between items-center bg-black/40 border border-blue-900/30 p-3.5 rounded-xl">
                             <div className="flex items-center space-x-3">
                               <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                               <span className="font-mono text-xs text-white">{node.region}</span>
                             </div>
                             <div className="flex items-center space-x-4 font-mono text-[10px]">
                               <span className="text-emerald-400 font-bold">{node.status}</span>
                               <span className="text-blue-400">{node.ping}</span>
                             </div>
                           </div>
                        ))}
                      </div>
                   </div>

                   <div className="p-8 rounded-2xl border border-blue-900/40 bg-[#050b1a]/90 shadow-xl">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 mb-6 flex items-center">
                        <Activity size={16} className="mr-3" /> Core API Latency Matrix
                      </h3>
                      <div className="space-y-5">
                        {[ 
                          { route: '/api/releases (Project Releases)', load: 85, time: '14ms', color: 'bg-emerald-400' }, 
                          { route: '/api/auth/me (Identity Check)', load: 45, time: '22ms', color: 'bg-amber-400' }, 
                          { route: '/api/categories (Taxonomies)', load: 30, time: '18ms', color: 'bg-blue-400' },
                          { route: '/api/showcase (Media Stream)', load: 92, time: '48ms', color: 'bg-purple-400' } 
                        ].map(api => (
                           <div key={api.route} className="bg-black/40 border border-blue-900/30 p-3.5 rounded-xl">
                             <div className="flex justify-between items-end mb-2 font-mono text-[10px] uppercase">
                               <span className="text-slate-300">{api.route}</span>
                               <span className="text-white font-bold">{api.time}</span>
                             </div>
                             <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                               <motion.div initial={{ width: 0 }} animate={{ width: `${api.load}%` }} transition={{ duration: 1 }} className={`h-full ${api.color}`} />
                             </div>
                           </div>
                        ))}
                      </div>
                   </div>
                 </div>

                 {/* Bottom Row: Database & Storage */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 p-8 rounded-2xl border border-blue-900/40 bg-[#050b1a]/90 shadow-xl">
                     <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-blue-400 mb-6 flex items-center">
                       <Database size={16} className="mr-3" /> Turso Cloud libSQL Health
                     </h3>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-black/40 border border-blue-900/30 rounded-xl">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">Connections</p>
                          <p className="text-2xl font-mono text-white font-black">12 / 50</p>
                        </div>
                        <div className="p-4 bg-black/40 border border-blue-900/30 rounded-xl">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">Cache Hit Rate</p>
                          <p className="text-2xl font-mono text-emerald-400 font-black">98.4%</p>
                        </div>
                        <div className="p-4 bg-black/40 border border-blue-900/30 rounded-xl">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">Memory Heap</p>
                          <p className="text-2xl font-mono text-amber-400 font-black">128 MB</p>
                        </div>
                     </div>
                   </div>

                   <div className="p-8 rounded-2xl border border-blue-900/40 bg-[#050b1a]/90 flex flex-col justify-center items-center text-center shadow-xl">
                      <HardDrive size={36} className="text-blue-400 mb-3" />
                      <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 mb-1">Storage Block Volume</h3>
                      <p className="text-3xl font-black font-mono text-blue-400">4.2 <span className="text-sm">TB</span></p>
                      <div className="w-full bg-slate-900 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="w-[34%] h-full bg-blue-500" />
                      </div>
                      <p className="text-[9px] font-mono text-slate-500 mt-2 uppercase">34% Capacity Utilized</p>
                   </div>
                 </div>

              </motion.div>
            )}

            {/* -------------------------------------
                TAB 4: ACTIVITY LOGS
                ------------------------------------- */}
            {activeTab === 'LOGS' && (
              <motion.div key="logs" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="h-full flex flex-col space-y-4">
                 
                 {/* Filter Deck */}
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#050b1a] border border-blue-900/40 p-4 rounded-xl shadow-md">
                   <div className="flex items-center space-x-2 w-full sm:w-auto">
                     <Search size={14} className="text-blue-400 ml-2" />
                     <input 
                       type="text" placeholder="Filter by action or IP..." value={logSearch} onChange={e => setLogSearch(e.target.value)}
                       className="bg-black/60 border border-blue-900/30 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500 w-full sm:w-64"
                     />
                   </div>
                   
                   <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                     <div className="flex bg-black/60 p-1 border border-blue-900/30 rounded-lg">
                       {(['ALL', 'OK', 'WARN', 'ERROR'] as const).map(f => (
                         <button 
                           key={f} onClick={() => setLogFilter(f)}
                           className={`px-3 py-1 text-[10px] font-mono font-bold uppercase rounded transition-colors ${
                             logFilter === f ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                           }`}
                         >
                           {f}
                         </button>
                       ))}
                     </div>
                     <button 
                       onClick={exportLogsCSV} 
                       className="flex items-center px-4 py-2 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-900/40 text-blue-400 hover:text-white rounded-lg text-xs font-mono font-bold transition-colors"
                     >
                       <Download size={13} className="mr-1.5" /> CSV
                     </button>
                     <button 
                       onClick={handlePurgeLogs} 
                       disabled={actionLoading === 'purge_logs'}
                       className="flex items-center px-4 py-2 bg-red-950/30 hover:bg-red-600 border border-red-900/40 text-red-400 hover:text-white rounded-lg text-xs font-mono font-bold transition-colors disabled:opacity-50"
                     >
                       <Trash2 size={13} className="mr-1.5" /> Purge Logs
                     </button>
                   </div>
                 </div>

                 {/* Logs Canvas */}
                 <div className="flex-1 bg-black/90 border border-blue-900/40 rounded-2xl p-6 flex flex-col overflow-hidden shadow-2xl">
                   <div className="mb-4 border-b border-blue-900/40 pb-3 flex justify-between items-center text-xs font-mono text-blue-400">
                     <span>STREAM_TOTAL: {filteredLogs.length} events logged</span>
                     <span>LIVE RETENTION: REAL-TIME</span>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-admin-scroll font-mono text-xs space-y-2 pr-3">
                     {filteredLogs.map((log, i) => (
                       <div key={log.id} className="flex flex-col md:flex-row md:items-center py-2 px-3 rounded-lg bg-blue-950/10 border border-blue-900/20 hover:border-blue-500/30 hover:bg-blue-950/30 transition-colors">
                         <span className="text-slate-500 w-[180px] shrink-0 text-[11px]">[{new Date(log.createdAt).toLocaleString()}]</span>
                         <span className={`w-20 shrink-0 font-bold text-[10px] ${log.status === 'ERROR' ? 'text-red-400' : log.status === 'WARN' ? 'text-amber-400' : 'text-emerald-400'}`}>
                           [{log.status}]
                         </span>
                         <span className="text-slate-200 flex-1 flex items-center text-[11px]">
                           <ArrowRight size={10} className="mr-2 text-blue-600" /> {log.action}
                         </span>
                         <span className="text-blue-400 w-[140px] text-right text-[10px]">{log.ip || 'INTERNAL'}</span>
                       </div>
                     ))}
                     {filteredLogs.length === 0 && (
                       <div className="p-12 text-center text-slate-500 font-mono text-xs uppercase tracking-wider">
                         No activity logs match query
                       </div>
                     )}
                   </div>
                 </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>

      <style jsx global>{`
        .custom-admin-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-admin-scroll::-webkit-scrollbar-track { background: rgba(3, 8, 22, 0.6); }
        .custom-admin-scroll::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.4); border-radius: 4px; }
        .custom-admin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.8); }
      `}</style>
    </main>
  );
}
