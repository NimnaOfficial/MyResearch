"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Trash2, ShieldCheck, User as UserIcon, Loader2, AlertTriangle, 
  Search, Download, ShieldAlert, Lock, Ban, Activity, X, Mail, Phone, Calendar, 
  Edit3, Save, History, Radio, Cpu, Network, CheckCircle, Key, Terminal, Copy, Check
} from 'lucide-react';

interface MatrixUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  age?: number;
  phone?: string;
  isVerified: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  password?: string; 
  lastIp?: string;
  lastDevice?: string;
  lastLogin?: string;
}

export default function UltimateUserRoster() {
  const [users, setUsers] = useState<MatrixUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Advanced UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  
  // Inspection & Editing States
  const [inspectUser, setInspectUser] = useState<MatrixUser | null>(null);
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'SECURITY' | 'TELEMETRY'>('IDENTITY');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<MatrixUser>>({});
  const [newCipher, setNewCipher] = useState('');
  
  // COPY TO CLIPBOARD STATE
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ==========================================
  // FETCH FULL ROSTER
  // ==========================================
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) setUsers(data.data.map((u: any) => ({ ...u, status: u.status || 'ACTIVE' })));
      else setError(data.message || 'FAILED TO RETRIEVE NODE ROSTER.');
    } catch (err) {
      setError('FATAL: CORE DATABASE UNREACHABLE.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ==========================================
  // LIVE DATABASE: SYSTEM ACTIONS
  // ==========================================
  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Elevate/Demote operator clearance to [${newRole.toUpperCase()}]?`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('matrix_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        if (inspectUser?.id === userId) setInspectUser({ ...inspectUser, role: newRole });
      } else alert("Action Denied by Server.");
    } catch (err) { alert("Network Failure."); } finally { setActionLoading(null); }
  };

  const handleTerminateUser = async (userId: string) => {
    if (!confirm("CRITICAL: Permanent Node Termination. Proceed?")) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('matrix_token')}` }
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        if (inspectUser?.id === userId) setInspectUser(null);
      } else alert("Termination Denied by Server.");
    } catch (err) { alert("Network Failure."); } finally { setActionLoading(null); }
  };

  const saveIdentityChanges = async () => {
    if (!inspectUser) return;
    setActionLoading('save_identity');
    try {
      const token = localStorage.getItem('matrix_token');
      
      const res = await fetch(`http://localhost:5000/api/admin/users/${inspectUser.id}/identity`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (editForm.password && editForm.password.length >= 6) {
        await fetch(`http://localhost:5000/api/admin/users/${inspectUser.id}/cipher`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ newCipher: editForm.password })
        });
      }

      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...inspectUser, ...data.data, isVerified: editForm.isVerified ?? inspectUser.isVerified };
        setUsers(users.map(u => u.id === inspectUser.id ? updatedUser as MatrixUser : u));
        setInspectUser(updatedUser as MatrixUser);
        setIsEditing(false);
        setEditForm({}); 
      } else alert(data.message || "Failed to update identity.");
    } catch (err) { alert("Network Failure."); } finally { setActionLoading(null); }
  };

  const forceCipherOverride = async () => {
    if (!newCipher || newCipher.length < 6) return alert("CIPHER MUST BE AT LEAST 6 CHARACTERS.");
    if (!confirm(`WARNING: Overwriting Node Cipher. Proceed?`)) return;
    setActionLoading('override_cipher');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${inspectUser!.id}/cipher`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('matrix_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ newCipher })
      });
      if (res.ok) {
        setNewCipher('');
        alert(`CIPHER OVERRIDE SUCCESSFUL.`);
      } else alert("Override Denied by Server.");
    } catch (err) { alert("Network Failure."); } finally { setActionLoading(null); }
  };

  const toggleNodeSuspension = async () => {
    if (!inspectUser) return;
    const newStatus = inspectUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setActionLoading('suspend_node');
    
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${inspectUser.id}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('matrix_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json(); 
      if (res.ok) {
        const updatedUser = { ...inspectUser, status: newStatus };
        setUsers(users.map(u => u.id === inspectUser.id ? updatedUser as MatrixUser : u));
        setInspectUser(updatedUser as MatrixUser);
      } else {
        alert(`SERVER ERROR: ${data.message || "Status Toggle Failed"}`);
      }
    } catch (err) { alert("CRITICAL: Network Failure."); } finally { setActionLoading(null); }
  };

  const handleCopy = (text: string, field: string) => {
    if (!text || text === 'NO_RECORD') return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const extractCSV = () => {
    if (filteredUsers.length === 0) return alert("NO DATA TO EXTRACT.");
    const headers = ["Operator_ID,Identifier,Email,Clearance,Verification,Status,Creation_Cycle"];
    const rows = filteredUsers.map(u => {
      const cleanName = (u.fullName || u.username || 'UNKNOWN').replace(/,/g, ''); 
      return `${u.id},${cleanName},${u.email},${u.role},${u.isVerified ? 'VERIFIED' : 'PENDING'},${u.status},${new Date(u.createdAt).toISOString()}`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CSx_Node_Extract_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.id.includes(searchTerm);
    const matchesRole = filterRole === 'ALL' || user.role.toUpperCase() === filterRole;
    return matchesSearch && matchesRole;
  });

  const toggleSelectNode = (id: string) => setSelectedNodes(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedNodes(selectedNodes.length === filteredUsers.length ? [] : filteredUsers.map(u => u.id));

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const rowVariants = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } };

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-blue-500 font-mono tracking-widest uppercase relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0,transparent_50%)]" />
        <Loader2 className="animate-spin mb-6 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]" size={48} />
        <p className="animate-pulse">Accessing Global Node Registry...</p>
      </div>
    );
  }

  return (
    <div className="font-sans relative min-h-screen">
      
      {/* HEADER & CONTROL DECK */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 border-b border-blue-900/30 pb-6">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <div className="relative flex items-center justify-center w-12 h-12 bg-[#050A14] border border-blue-500/50 [clip-path:polygon(30%_0%,_100%_0%,_70%_100%,_0%_100%)] shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <Network size={20} className="text-blue-500" />
              </div>
              <h1 className="text-4xl font-black uppercase tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                NODE <span className="text-blue-500">ROSTER</span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-500 tracking-[0.4em] uppercase ml-16 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2" /> Live Database Synchronization
            </p>
          </div>
          <AnimatePresence>
            {selectedNodes.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="flex items-center space-x-4 bg-red-950/40 border border-red-500/50 p-2 backdrop-blur-md">
                <span className="text-[10px] text-red-400 font-mono tracking-[0.2em] px-3">[{selectedNodes.length} TARGETS LOCKED]</span>
                <button className="text-[9px] bg-red-600 text-white px-6 py-2.5 uppercase tracking-widest font-black hover:bg-red-500 transition-colors flex items-center shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                  <Trash2 size={12} className="mr-2" /> Execute Purge
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 bg-[#050A14]/80 backdrop-blur-xl border border-blue-900/40 p-2 shadow-[inset_0_0_30px_rgba(59,130,246,0.05)] [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" />
            <input 
              type="text" placeholder="LOCATE BY IDENTIFIER, EMAIL, OR SYSTEM ID..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border-none text-white text-[11px] font-mono tracking-[0.2em] uppercase py-4 pl-14 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
            />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-blue-500/50 to-transparent" />
          </div>
          <div className="flex items-center space-x-2 px-2">
            <div className="flex bg-black/50 p-1 border border-slate-800">
              {['ALL', 'ADMIN', 'USER'].map(role => (
                <button key={role} onClick={() => setFilterRole(role as any)} className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all ${filterRole === role ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-500 hover:text-white'}`}>
                  {role}
                </button>
              ))}
            </div>
            <button onClick={extractCSV} className="flex items-center justify-center px-6 py-3.5 bg-blue-950/30 border border-blue-900/50 text-blue-400 hover:bg-blue-600 hover:text-white transition-all group">
              <Download size={14} className="mr-2 group-hover:animate-bounce" />
              <span className="text-[9px] font-black uppercase tracking-widest">Extract</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* FLOATING DATA-GRID */}
      <div className="w-full relative z-10">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 mb-4 border-b border-blue-900/30 text-[9px] text-blue-500 font-mono tracking-[0.3em] uppercase">
          <div className="col-span-1 flex items-center justify-center">
            <input type="checkbox" title="Select all users" checked={selectedNodes.length === filteredUsers.length && filteredUsers.length > 0} onChange={toggleSelectAll} className="accent-blue-600 w-3 h-3 cursor-pointer" />
          </div>
          <div className="col-span-2">SYS_ID</div>
          <div className="col-span-3">IDENTIFIER_MATRIX</div>
          <div className="col-span-2">CLEARANCE_LEVEL</div>
          <div className="col-span-2">NETWORK_STATUS</div>
          <div className="col-span-2 text-right">COMMAND_OVERRIDES</div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3 pb-24">
          <AnimatePresence>
            {filteredUsers.map((user) => (
              <motion.div layout variants={rowVariants} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.95 }} key={user.id} className={`grid grid-cols-1 lg:grid-cols-12 gap-4 items-center p-4 bg-[#050A14]/90 backdrop-blur-md border transition-all duration-300 group ${selectedNodes.includes(user.id) ? 'border-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.2)]' : 'border-blue-900/30 hover:border-blue-500/50 hover:bg-[#0A1224]'}`}>
                <div className="col-span-1 flex items-center justify-center">
                  <input type="checkbox" title="Select user" checked={selectedNodes.includes(user.id)} onChange={() => toggleSelectNode(user.id)} className="accent-blue-600 w-4 h-4 cursor-pointer" />
                </div>
                <div className="col-span-2 flex items-center">
                  <Cpu size={12} className="text-slate-600 mr-2 opacity-50" />
                  <span className="text-[10px] font-mono text-slate-500 tracking-wider">{user.id.substring(0, 8)}<span className="text-slate-700">...</span></span>
                </div>
                <div className="col-span-3 flex items-center space-x-4 cursor-pointer" onClick={() => { setInspectUser(user); setEditForm(user); setIsEditing(false); setActiveTab('IDENTITY'); }}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-[10px] opacity-0 group-hover:opacity-30 transition-opacity" />
                    <div className="w-10 h-10 bg-black border border-slate-800 group-hover:border-blue-500 flex items-center justify-center [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)] transition-colors relative z-10">
                      <UserIcon size={16} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-widest uppercase group-hover:text-blue-400 transition-colors">{user.fullName || user.username}</span>
                    <span className="text-[9px] font-mono text-slate-500 tracking-widest mt-0.5 flex items-center"><Mail size={10} className="mr-1 opacity-50" /> {user.email}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  {user.role === 'admin' ? (
                    <span className="inline-flex items-center px-3 py-1.5 bg-red-950/40 border-l-2 border-red-600 text-red-500 text-[9px] tracking-[0.2em] font-black font-mono uppercase shadow-[0_0_10px_rgba(220,38,38,0.1)]"><ShieldCheck size={12} className="mr-2" /> LEVEL_5</span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 bg-slate-900/50 border-l-2 border-slate-600 text-slate-400 text-[9px] tracking-[0.2em] font-black font-mono uppercase"><UserIcon size={12} className="mr-2" /> GUEST</span>
                  )}
                </div>
                <div className="col-span-2 flex flex-col items-start space-y-1.5">
                  <div className={`inline-flex items-center px-3 py-1 border text-[8px] font-black tracking-[0.2em] uppercase ${user.status === 'SUSPENDED' ? 'bg-orange-950/20 border-orange-900/50 text-orange-500' : 'bg-green-950/20 border-green-900/50 text-green-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-none mr-2 ${user.status === 'SUSPENDED' ? 'bg-orange-500 animate-pulse' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`} />{user.status || 'ACTIVE'}
                  </div>
                  {!user.isVerified && <div className="inline-flex items-center text-[8px] font-mono tracking-widest text-orange-500 opacity-70"><AlertTriangle size={10} className="mr-1" /> UNVERIFIED</div>}
                </div>
                <div className="col-span-2 flex justify-end items-center space-x-1 pr-2">
                  {actionLoading === user.id ? (
                    <Loader2 size={18} className="animate-spin text-blue-500 mr-4" />
                  ) : (
                    <>
                      <button onClick={() => { setInspectUser(user); setEditForm(user); setIsEditing(false); setActiveTab('IDENTITY'); }} className="p-2.5 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 border border-transparent hover:border-blue-500/50 transition-all opacity-0 group-hover:opacity-100" title="Inspect Node"><Activity size={16} /></button>
                      <button onClick={() => handleRoleChange(user.id, user.role)} className="p-2.5 text-slate-500 hover:text-orange-400 hover:bg-orange-900/20 border border-transparent hover:border-orange-500/50 transition-all opacity-0 group-hover:opacity-100" title="Toggle Clearance"><ShieldAlert size={16} /></button>
                      <button onClick={() => handleTerminateUser(user.id)} className="p-2.5 text-slate-500 hover:text-white hover:bg-red-600 border border-transparent hover:border-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-[0_0_15px_rgba(220,38,38,0)] hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]" title="Terminate Node"><Trash2 size={16} /></button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredUsers.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-16 flex flex-col items-center justify-center border border-dashed border-blue-900/50 bg-[#050A14]/50">
              <Search size={32} className="text-slate-600 mb-4" />
              <p className="text-slate-500 text-[11px] uppercase tracking-[0.4em] font-mono">NO DATA CORES MATCH QUERY.</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* TACTICAL HUD TERMINAL */}
      <AnimatePresence>
        {inspectUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectUser(null)} className="fixed inset-0 z-[100] bg-[#020617]/90 backdrop-blur-md cursor-pointer">
               <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            </motion.div>
            <motion.div initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-[#050A14] border-l border-blue-500/50 z-[101] shadow-[-30px_0_60px_rgba(0,0,0,0.9)] flex flex-col cursor-default">
              
              <div className="h-32 border-b border-blue-900/50 bg-black flex flex-col justify-end p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-[#020617] border border-blue-500 flex items-center justify-center [clip-path:polygon(15px_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%,0_15px)] shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                      <span className="text-3xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">{inspectUser.fullName ? inspectUser.fullName.charAt(0).toUpperCase() : inspectUser.username?.charAt(0).toUpperCase() || 'U'}</span>
                    </div>
                    <div>
                      <div className="flex items-center text-blue-500 mb-1">
                        <Terminal size={12} className="mr-2" />
                        <span className="text-[9px] font-black tracking-[0.4em] uppercase">Target Profile Acquired</span>
                      </div>
                      <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase">{inspectUser.fullName || inspectUser.username}</h2>
                    </div>
                  </div>
                  <button onClick={() => setInspectUser(null)} title="Close profile" className="text-slate-500 hover:text-red-500 transition-colors p-2 border border-transparent hover:border-red-900/50 bg-black"><X size={20} /></button>
                </div>
              </div>

              <div className="flex border-b border-blue-900/40 bg-[#020617] px-8">
                {[{ id: 'IDENTITY', icon: UserIcon }, { id: 'SECURITY', icon: ShieldAlert }, { id: 'TELEMETRY', icon: Radio }].map(tab => (
                  <button key={tab.id} type="button" onClick={() => { setActiveTab(tab.id as any); setIsEditing(false); }} className={`flex items-center py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id ? 'text-blue-400 bg-blue-900/10' : 'text-slate-600 hover:text-slate-300 hover:bg-white/[0.02]'}`}>
                    <tab.icon size={14} className="mr-2" /> {tab.id}
                    {activeTab === tab.id && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_-5px_10px_rgba(59,130,246,0.5)]" />}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-admin-scroll relative">
                <AnimatePresence mode="wait">
                  {/* IDENTITY TAB */}
                  {activeTab === 'IDENTITY' && (
                    <motion.div key="identity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[11px] font-black tracking-[0.3em] uppercase text-blue-500">Node Parameters</h3>
                        {!isEditing ? (
                          <button onClick={() => setIsEditing(true)} className="flex items-center text-[9px] bg-blue-950/30 border border-blue-900 text-blue-400 hover:bg-blue-900 hover:text-white px-4 py-2 tracking-widest uppercase font-black transition-colors"><Edit3 size={12} className="mr-2" /> Execute Override</button>
                        ) : (
                          <div className="flex space-x-2">
                            <button onClick={() => setIsEditing(false)} className="text-[9px] bg-black border border-slate-800 text-slate-400 hover:text-white px-4 py-2 tracking-widest uppercase font-black">Abort</button>
                            <button onClick={saveIdentityChanges} className="flex items-center text-[9px] bg-blue-600 text-white px-4 py-2 tracking-widest uppercase font-black hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                              {actionLoading === 'save_identity' ? <Loader2 size={12} className="animate-spin" /> : <><Save size={12} className="mr-2" /> Inject Data</>}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Identifier (Name)', key: 'fullName', type: 'text', icon: UserIcon },
                          { label: 'Comms Link (Email)', key: 'email', type: 'email', icon: Mail },
                          { label: 'Frequency (Phone)', key: 'phone', type: 'text', icon: Phone },
                          { label: 'Chrono-Index (Age)', key: 'age', type: 'number', icon: Calendar }
                        ].map(field => (
                          <div key={field.key} className={`bg-black border ${isEditing ? 'border-blue-500/50 shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]' : 'border-blue-900/30'} p-5 relative [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)] transition-all`}>
                            <div className="flex items-center mb-3">
                              <field.icon size={12} className="text-blue-500 mr-2 opacity-70" />
                              <label className="text-[8px] text-slate-500 uppercase tracking-[0.2em]">{field.label}</label>
                            </div>
                            {isEditing ? (
                              <input type={field.type} value={(editForm as any)[field.key] || ''} onChange={(e) => setEditForm({...editForm, [field.key]: e.target.value})} className="w-full bg-[#020617] border-b border-blue-500 text-white text-sm font-mono tracking-wider p-2 focus:outline-none focus:bg-blue-950/20" placeholder="ENTER_DATA" />
                            ) : (
                              <p className="text-sm text-white font-mono tracking-wider">{(inspectUser as any)[field.key] || <span className="text-slate-600">NOT_PROVIDED</span>}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-900/30">
                        <div className={`bg-black border ${isEditing ? 'border-blue-500/50' : 'border-blue-900/30'} p-5`}>
                          <div className="flex items-center mb-3">
                            <CheckCircle size={12} className="text-blue-500 mr-2 opacity-70" />
                            <label className="text-[8px] text-slate-500 uppercase tracking-[0.2em]">Verification Status</label>
                          </div>
                          {isEditing ? (
                            <select aria-label="Verification Status" value={editForm.isVerified !== undefined ? String(editForm.isVerified) : String(inspectUser.isVerified)} onChange={(e) => setEditForm({...editForm, isVerified: e.target.value === 'true'})} className="w-full bg-[#020617] border border-slate-800 text-white text-xs font-mono tracking-widest p-2 focus:outline-none focus:border-blue-500 cursor-pointer">
                              <option value="true">VERIFIED</option>
                              <option value="false">PENDING</option>
                            </select>
                          ) : (
                            <p className={`text-xs font-black tracking-widest uppercase ${inspectUser.isVerified ? 'text-green-500' : 'text-orange-500'}`}>{inspectUser.isVerified ? 'VERIFIED' : 'PENDING'}</p>
                          )}
                        </div>
                        <div className={`bg-black border ${isEditing ? 'border-red-500/50 shadow-[inset_0_0_15px_rgba(220,38,38,0.1)]' : 'border-blue-900/30'} p-5`}>
                          <div className="flex items-center mb-3">
                            <Key size={12} className={`${isEditing ? 'text-red-500' : 'text-blue-500'} mr-2 opacity-70 transition-colors`} />
                            <label className="text-[8px] text-slate-500 uppercase tracking-[0.2em]">Security Cipher</label>
                          </div>
                          {isEditing ? (
                            <input type="text" placeholder="ENTER NEW CIPHER..." value={editForm.password || ''} onChange={(e) => setEditForm({...editForm, password: e.target.value})} className="w-full bg-red-950/20 border-b border-red-500 text-red-400 text-xs font-mono tracking-widest p-2 focus:outline-none placeholder-red-900" />
                          ) : (
                            <p className="text-sm text-slate-600 font-mono tracking-widest">ENCRYPTED_***</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SECURITY TAB */}
                  {activeTab === 'SECURITY' && (
                    <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div className="bg-orange-950/10 border border-orange-900/40 p-8 relative [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                        <div className="absolute top-0 right-0 w-3 h-full bg-orange-500" />
                        <h3 className="text-[12px] font-black tracking-[0.2em] uppercase text-orange-500 flex items-center mb-3"><Ban size={16} className="mr-3" /> Network Suspension</h3>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <p className="text-[10px] text-orange-400/70 font-mono border-l-2 border-orange-900/50 pl-3 max-w-sm">Sever API access and authentication pathways for this specific node.</p>
                          <button onClick={toggleNodeSuspension} className={`px-8 py-4 font-black text-[10px] uppercase tracking-widest transition-all flex items-center ${inspectUser.status === 'SUSPENDED' ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:bg-orange-500'}`}>
                            {actionLoading === 'suspend_node' ? <Loader2 size={16} className="animate-spin" /> : inspectUser.status === 'SUSPENDED' ? 'RESTORE ACCESS' : 'SEVER ACCESS'}
                          </button>
                        </div>
                      </div>
                      <div className="bg-red-950/10 border border-red-900/40 p-8 relative overflow-hidden [clip-path:polygon(0_0,100%_0,100%_calc(100%-15px),calc(100%-15px)_100%,0_100%)]">
                        <div className="absolute top-0 right-0 w-3 h-full bg-red-600" />
                        <h3 className="text-[12px] font-black tracking-[0.2em] uppercase text-red-500 flex items-center mb-3"><Lock size={16} className="mr-3" /> Force Cipher Override</h3>
                        <p className="text-[10px] text-red-400/70 font-mono mb-6 leading-relaxed border-l-2 border-red-900/50 pl-3">Master Protocol: Instantly overwrite the operator's cryptographic key. The current key will be destroyed. This action is irreversible.</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input type="text" placeholder="ENTER NEW SECURE CIPHER..." value={newCipher} onChange={(e) => setNewCipher(e.target.value)} className="flex-1 bg-black border border-red-900/50 text-white text-xs font-mono tracking-[0.3em] uppercase p-4 focus:outline-none focus:border-red-500 focus:bg-red-950/20" />
                          <button onClick={forceCipherOverride} disabled={actionLoading === 'override_cipher'} className="bg-red-600 hover:bg-red-500 text-white px-8 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50">
                            {actionLoading === 'override_cipher' ? <Loader2 size={16} className="animate-spin" /> : 'EXECUTE'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 🚀 FIXED 4-CARD TELEMETRY TAB */}
                  {activeTab === 'TELEMETRY' && (
                    <motion.div key="telemetry" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Card 1: System ID Hash */}
                        <div className="bg-[#050A14] border border-blue-900/30 p-5 relative group flex flex-col justify-center items-center text-center overflow-hidden">
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:10px_10px] opacity-20 pointer-events-none" />
                          <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] mb-2 relative z-10">System ID Hash</p>
                          <p className="text-xl font-black font-mono text-blue-400 relative z-10">#{inspectUser.id.split('-')[0]}</p>
                        </div>

                        {/* Card 2: Node Stability */}
                        <div className="bg-[#050A14] border border-blue-900/30 p-5 relative group flex flex-col justify-center items-center text-center overflow-hidden">
                           <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-900/20 to-transparent pointer-events-none" />
                           <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] mb-2 relative z-10">Node Stability</p>
                           <p className={`text-xl font-black font-mono relative z-10 ${inspectUser.status === 'SUSPENDED' || !inspectUser.isVerified ? 'text-orange-500 animate-pulse' : 'text-green-500'}`}>
                             {inspectUser.status === 'SUSPENDED' || !inspectUser.isVerified ? 'UNSTABLE' : 'STABLE'}
                           </p>
                        </div>

                        {/* Card 3: Network Origin (IP) Card */}
                        <div className="bg-[#050A14] border border-blue-900/30 p-5 relative group flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-4 relative z-10">
                             <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] flex items-center">
                               <Network size={12} className="mr-2 text-blue-500" /> Network Origin
                             </p>
                             <button onClick={() => handleCopy(inspectUser.lastIp || 'NO_RECORD', 'ip')} title="Copy IP" className="p-1 hover:bg-blue-900/30 transition-colors rounded z-20">
                               {copiedField === 'ip' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-blue-500 opacity-50 group-hover:opacity-100" />}
                             </button>
                          </div>
                          <p className="text-lg font-black font-mono text-blue-400 relative z-10 truncate" title={inspectUser.lastIp || 'NO_RECORD'}>
                            {inspectUser.lastIp || 'NO_RECORD'}
                          </p>
                          <p className="text-[8px] text-slate-600 mt-2 tracking-widest uppercase relative z-10">
                            Sync: {inspectUser.lastLogin ? new Date(inspectUser.lastLogin).toLocaleString() : 'N/A'}
                          </p>
                        </div>

                        {/* Card 4: Hardware Signature (Device) Card */}
                        <div className="bg-[#050A14] border border-blue-900/30 p-5 relative group flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-4 relative z-10">
                             <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] flex items-center">
                               <Cpu size={12} className="mr-2 text-blue-500" /> Hardware Signature
                             </p>
                             <button onClick={() => handleCopy(inspectUser.lastDevice || 'NO_RECORD', 'device')} title="Copy Device Signature" className="p-1 hover:bg-blue-900/30 transition-colors rounded z-20">
                               {copiedField === 'device' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-blue-500 opacity-50 group-hover:opacity-100" />}
                             </button>
                          </div>
                          <p className="text-[9px] font-bold font-mono text-white line-clamp-2 leading-relaxed relative z-10" title={inspectUser.lastDevice || 'NO_RECORD'}>
                            {inspectUser.lastDevice || 'NO_RECORD'}
                          </p>
                          <p className="text-[8px] text-slate-600 mt-2 tracking-widest uppercase relative z-10">
                            Latest Client
                          </p>
                        </div>

                      </div>

                      <div className="bg-[#050A14] border border-blue-900/30 p-6">
                        <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-500 border-b border-blue-900/50 pb-3 mb-4 flex items-center"><History size={14} className="mr-2" /> Database Event Log</h3>
                        <div className="space-y-3">
                          {[
                            { action: inspectUser.status === 'SUSPENDED' ? 'NETWORK_SEVERED' : 'NETWORK_ACTIVE', time: 'CURRENT_STATE', status: inspectUser.status === 'SUSPENDED' ? 'WARN' : 'OK' },
                            { action: inspectUser.role === 'admin' ? 'ELEVATED_CLEARANCE' : 'GUEST_CLEARANCE', time: 'DB_SYNC', status: 'OK' },
                            { action: inspectUser.isVerified ? 'COMMS_LINK_VERIFIED' : 'VERIFICATION_PENDING', time: 'DB_SYNC', status: inspectUser.isVerified ? 'OK' : 'WARN' },
                            { action: 'IDENTITY_FORGED', time: new Date(inspectUser.createdAt).toLocaleDateString(), status: 'OK' }
                          ].map((log, i) => (
                            <div key={i} className="flex justify-between items-center bg-black border border-slate-800 p-4 hover:border-blue-900/50 transition-colors">
                              <div className="flex items-center"><div className={`w-2 h-2 rounded-none mr-4 ${log.status === 'WARN' ? 'bg-orange-500' : 'bg-blue-500'}`} /><span className="text-[10px] font-mono font-bold text-white tracking-widest">{log.action}</span></div>
                              <span className="text-[9px] font-mono text-slate-500">{log.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}