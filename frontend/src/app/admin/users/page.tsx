"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Trash2, ShieldCheck, User as UserIcon, Loader2, AlertTriangle, 
  Search, Download, ShieldAlert, Lock, Ban, Activity, X, Mail, Phone, Calendar, 
  Edit3, Save, History, Radio, Terminal
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
  status?: 'ACTIVE' | 'SUSPENDED'; // Added advanced status
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

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) setUsers(data.data.map((u: any) => ({ ...u, status: 'ACTIVE' })));
      else setError(data.message || 'FAILED TO RETRIEVE NODE ROSTER.');
    } catch (err) {
      setError('FATAL: CORE DATABASE UNREACHABLE.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ==========================================
  // CORE ADMIN ACTIONS (API Hookups)
  // ==========================================
  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Elevate/Demote operator clearance to [${newRole.toUpperCase()}]?`)) return;
    setActionLoading(userId);
    // Simulate API Call for UI/UX
    setTimeout(() => {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      if (inspectUser?.id === userId) setInspectUser({ ...inspectUser, role: newRole });
      setActionLoading(null);
    }, 800);
  };

  const handleTerminateUser = async (userId: string) => {
    if (!confirm("CRITICAL: Permanent Node Termination. Proceed?")) return;
    setActionLoading(userId);
    // Simulate API Call
    setTimeout(() => {
      setUsers(users.filter(u => u.id !== userId));
      if (inspectUser?.id === userId) setInspectUser(null);
      setActionLoading(null);
    }, 800);
  };

  // ==========================================
  // DEEP EDIT & SECURITY OVERRIDES
  // ==========================================
  const saveIdentityChanges = () => {
    if (!inspectUser) return;
    setActionLoading('save_identity');
    // Simulate saving changes to DB
    setTimeout(() => {
      const updatedUser = { ...inspectUser, ...editForm };
      setUsers(users.map(u => u.id === inspectUser.id ? updatedUser as MatrixUser : u));
      setInspectUser(updatedUser as MatrixUser);
      setIsEditing(false);
      setActionLoading(null);
      alert("IDENTITY PARAMETERS UPDATED SUCCESSFULLY.");
    }, 1000);
  };

  const forceCipherOverride = () => {
    if (!newCipher || newCipher.length < 6) return alert("CIPHER MUST BE AT LEAST 6 CHARACTERS.");
    if (!confirm(`WARNING: Overwriting Node Cipher. The operator will be locked out of their old credentials. Proceed?`)) return;
    
    setActionLoading('override_cipher');
    setTimeout(() => {
      setNewCipher('');
      setActionLoading(null);
      alert(`CIPHER OVERRIDE SUCCESSFUL. NEW CODE: [ ${newCipher} ]`);
    }, 1200);
  };

  const toggleNodeSuspension = () => {
    if (!inspectUser) return;
    const newStatus = inspectUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setActionLoading('suspend_node');
    setTimeout(() => {
      const updatedUser = { ...inspectUser, status: newStatus };
      setUsers(users.map(u => u.id === inspectUser.id ? updatedUser as MatrixUser : u));
      setInspectUser(updatedUser as MatrixUser);
      setActionLoading(null);
    }, 800);
  };

  // ==========================================
  // FILTERING LOGIC
  // ==========================================
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.id.includes(searchTerm);
    const matchesRole = filterRole === 'ALL' || user.role.toUpperCase() === filterRole;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-blue-500 font-mono tracking-widest uppercase">
        <Loader2 className="animate-spin mb-4 text-red-600" size={32} />
        <p>Scanning Matrix Nodes...</p>
      </div>
    );
  }

  return (
    <div className="font-sans relative">
      
      {/* HUD Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <div className="w-10 h-10 bg-red-900/20 border border-red-600 flex items-center justify-center [clip-path:polygon(25%_0%,_100%_0%,_75%_100%,_0%_100%)]">
                <Users size={18} className="text-red-500 transform -skew-x-12" />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-white">NODE <span className="text-blue-500">ROSTER</span></h1>
            </div>
            <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase ml-14">God-Mode Identification & Override Hub</p>
          </div>
        </div>

        {/* Command Bar */}
        <div className="flex flex-col lg:flex-row gap-4 bg-[#050A14] border border-blue-900/40 p-4 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500/50" />
            <input 
              type="text" placeholder="QUERY NODE BY IDENTIFIER OR EMAIL..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-blue-900/50 text-white text-[10px] font-mono tracking-widest uppercase py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500 focus:bg-blue-950/20 transition-all placeholder-slate-700"
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex border border-blue-900/50 bg-black">
              {['ALL', 'ADMIN', 'USER'].map(role => (
                <button 
                  key={role} onClick={() => setFilterRole(role as any)}
                  className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-colors ${filterRole === role ? 'bg-blue-900/40 text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:text-white hover:bg-white/[0.02]'}`}
                >
                  {role}
                </button>
              ))}
            </div>
            <button className="flex items-center justify-center px-6 border border-blue-900/50 bg-black text-slate-400 hover:text-white hover:border-blue-500 transition-all">
              <Download size={14} className="mr-2" />
              <span className="text-[9px] font-black uppercase tracking-widest">Extract CSV</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Roster Table */}
      <div className="w-full bg-black border border-blue-900/30 relative shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-blue-500" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-blue-500" />

        <div className="overflow-x-auto custom-admin-scroll">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#020617] border-b border-blue-900/50">
                <th className="p-4 text-[9px] text-blue-500 uppercase tracking-[0.3em] font-mono">Operator_ID</th>
                <th className="p-4 text-[9px] text-blue-500 uppercase tracking-[0.3em] font-mono">Identity</th>
                <th className="p-4 text-[9px] text-blue-500 uppercase tracking-[0.3em] font-mono">Clearance</th>
                <th className="p-4 text-[9px] text-blue-500 uppercase tracking-[0.3em] font-mono">Status</th>
                <th className="p-4 text-[9px] text-blue-500 uppercase tracking-[0.3em] font-mono text-right">Master_Controls</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-300">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-blue-900/10 transition-colors group hover:bg-[#050A14]">
                  <td className="p-4">
                    <span className="text-[10px] font-mono text-slate-600 group-hover:text-blue-500/50 transition-colors">
                      {user.id.substring(0, 8)}...
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setInspectUser(user); setEditForm(user); setIsEditing(false); setActiveTab('IDENTITY'); }}>
                      <div className="w-8 h-8 bg-[#020617] border border-blue-900/50 flex items-center justify-center [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%)]">
                        <UserIcon size={14} className="text-blue-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white tracking-widest uppercase hover:text-blue-400 transition-colors">{user.fullName || user.username}</span>
                        <span className="text-[9px] font-mono text-slate-500 tracking-widest">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center px-2 py-1 bg-red-950/50 border border-red-900/50 text-red-500 text-[9px] tracking-widest font-mono uppercase">
                        <ShieldCheck size={10} className="mr-1.5" /> LVL_5_ADMIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 bg-black border border-slate-800 text-slate-400 text-[9px] tracking-widest font-mono uppercase">
                        <UserIcon size={10} className="mr-1.5" /> GUEST_NODE
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`text-[9px] font-black tracking-widest uppercase flex items-center ${user.status === 'SUSPENDED' ? 'text-orange-500' : 'text-green-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${user.status === 'SUSPENDED' ? 'bg-orange-500 animate-pulse' : 'bg-green-500 shadow-[0_0_5px_#22c55e]'}`} />
                      {user.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end items-center space-x-2">
                    {actionLoading === user.id ? (
                      <Loader2 size={16} className="animate-spin text-blue-500 mr-4" />
                    ) : (
                      <>
                        <button onClick={() => { setInspectUser(user); setEditForm(user); setIsEditing(false); setActiveTab('IDENTITY'); }} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 border border-transparent hover:border-blue-500/30 transition-all group-hover:opacity-100 opacity-50" title="Deep Inspect">
                          <Activity size={14} />
                        </button>
                        <button onClick={() => handleTerminateUser(user.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-900/20 border border-transparent hover:border-red-600/50 transition-all group-hover:opacity-100 opacity-50" title="Terminate Node">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* GOD-MODE DEEP INSPECTION TERMINAL (SLIDE OVER) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {inspectUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectUser(null)} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md cursor-pointer" />
            
            <motion.div 
              initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-[#020617] border-l border-blue-900/50 z-[101] shadow-[-20px_0_50px_rgba(0,0,0,0.9)] flex flex-col cursor-default"
            >
              {/* Terminal Header */}
              <div className="h-24 border-b border-blue-900/40 bg-[#050B14] flex flex-col justify-center px-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-full bg-blue-900/10 transform skew-x-12 translate-x-10" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center text-blue-500 mb-1">
                      <Terminal size={14} className="mr-2" />
                      <span className="text-[10px] font-black tracking-[0.3em] uppercase">Operator Terminal</span>
                    </div>
                    <h2 className="text-xl font-black text-white tracking-widest uppercase">{inspectUser.fullName || inspectUser.username}</h2>
                  </div>
                  <button type="button" title="Close terminal" onClick={() => setInspectUser(null)} className="text-slate-500 hover:text-white transition-colors p-2 bg-black border border-slate-800 hover:border-red-500">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-blue-900/40 bg-black px-8">
                {[
                  { id: 'IDENTITY', icon: UserIcon }, 
                  { id: 'SECURITY', icon: ShieldAlert }, 
                  { id: 'TELEMETRY', icon: Radio }
                ].map(tab => (
                  <button 
                    key={tab.id} onClick={() => { setActiveTab(tab.id as any); setIsEditing(false); }}
                    className={`flex items-center py-4 px-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-900/10' : 'text-slate-600 hover:text-slate-300 hover:bg-white/[0.02]'}`}
                  >
                    <tab.icon size={14} className="mr-2" /> {tab.id}
                  </button>
                ))}
              </div>

              {/* Terminal Content Area */}
              <div className="flex-1 overflow-y-auto p-8 custom-admin-scroll">
                
                {/* ----------------- TAB: IDENTITY ----------------- */}
                {activeTab === 'IDENTITY' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex justify-between items-center mb-4 border-b border-blue-900/30 pb-2">
                      <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-400">Core Parameters</h3>
                      {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="flex items-center text-[9px] text-blue-500 hover:text-blue-400 tracking-widest uppercase font-black">
                          <Edit3 size={12} className="mr-1" /> Override Data
                        </button>
                      ) : (
                        <div className="flex space-x-3">
                          <button onClick={() => setIsEditing(false)} className="text-[9px] text-slate-500 hover:text-white tracking-widest uppercase font-black">Cancel</button>
                          <button onClick={saveIdentityChanges} className="flex items-center text-[9px] bg-blue-600 text-white px-3 py-1 tracking-widest uppercase font-black hover:bg-blue-500">
                            {actionLoading === 'save_identity' ? <Loader2 size={12} className="animate-spin" /> : <><Save size={12} className="mr-1" /> Save</>}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Form Fields */}
                      {[
                        { label: 'Identifier (Full Name)', key: 'fullName', type: 'text', icon: UserIcon },
                        { label: 'Comms Link (Email)', key: 'email', type: 'email', icon: Mail },
                        { label: 'Direct Frequency (Phone)', key: 'phone', type: 'text', icon: Phone },
                        { label: 'Chrono-Index (Age)', key: 'age', type: 'number', icon: Calendar }
                      ].map(field => (
                        <div key={field.key} className="bg-[#050A14] border border-blue-900/30 p-4">
                          <div className="flex items-center mb-2">
                            <field.icon size={12} className="text-blue-500 mr-2 opacity-70" />
                            <label className="text-[9px] text-slate-500 uppercase tracking-widest">{field.label}</label>
                          </div>
                          {isEditing ? (
                            <input 
                              type={field.type} 
                              title={field.label}
                              placeholder={field.label}
                              value={(editForm as any)[field.key] || ''} 
                              onChange={(e) => setEditForm({...editForm, [field.key]: e.target.value})}
                              className="w-full bg-black border border-blue-500/50 text-white text-xs font-mono tracking-wider p-2 focus:outline-none focus:border-blue-400"
                            />
                          ) : (
                            <p className="text-sm text-white font-mono tracking-wider pl-6">{(inspectUser as any)[field.key] || 'NULL_DATA'}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ----------------- TAB: SECURITY ----------------- */}
                {activeTab === 'SECURITY' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    
                    {/* Cipher Override */}
                    <div className="bg-red-950/10 border border-red-900/30 p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-2 h-full bg-red-600" />
                      <h3 className="text-[11px] font-black tracking-[0.2em] uppercase text-red-500 flex items-center mb-2">
                        <Lock size={14} className="mr-2" /> Force Cipher Override
                      </h3>
                      <p className="text-[9px] text-slate-400 font-mono mb-4 leading-relaxed">
                        Master Override: Instantly replace the operator's cryptographic key. The current key will be destroyed. This action cannot be reversed.
                      </p>
                      <div className="flex space-x-2">
                        <input 
                          type="text" placeholder="ENTER NEW CIPHER CODE..." value={newCipher} onChange={(e) => setNewCipher(e.target.value)}
                          className="flex-1 bg-black border border-red-900/50 text-white text-xs font-mono tracking-widest uppercase p-3 focus:outline-none focus:border-red-500"
                        />
                        <button onClick={forceCipherOverride} disabled={actionLoading === 'override_cipher'} className="bg-red-900/40 border border-red-700 text-red-500 hover:bg-red-600 hover:text-white px-6 font-black text-[10px] uppercase tracking-widest transition-colors flex items-center">
                          {actionLoading === 'override_cipher' ? <Loader2 size={14} className="animate-spin" /> : 'EXECUTE'}
                        </button>
                      </div>
                    </div>

                    {/* Node Suspension */}
                    <div className="bg-orange-950/10 border border-orange-900/30 p-6 flex justify-between items-center">
                      <div>
                        <h3 className="text-[11px] font-black tracking-[0.2em] uppercase text-orange-500 flex items-center mb-1">
                          <Ban size={14} className="mr-2" /> Network Suspension
                        </h3>
                        <p className="text-[9px] text-slate-500 font-mono">Temporarily halt all API requests and logins for this node.</p>
                      </div>
                      <button onClick={toggleNodeSuspension} className={`px-6 py-3 font-black text-[10px] uppercase tracking-widest border transition-colors flex items-center ${inspectUser.status === 'SUSPENDED' ? 'bg-green-900/20 border-green-700 text-green-500 hover:bg-green-600 hover:text-white' : 'bg-orange-900/20 border-orange-700 text-orange-500 hover:bg-orange-600 hover:text-white'}`}>
                        {actionLoading === 'suspend_node' ? <Loader2 size={14} className="animate-spin" /> : inspectUser.status === 'SUSPENDED' ? 'RESTORE NODE' : 'SUSPEND NODE'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ----------------- TAB: TELEMETRY ----------------- */}
                {activeTab === 'TELEMETRY' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#050A14] border border-blue-900/30 p-4 text-center">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Last Known IP</p>
                        <p className="text-sm font-mono text-blue-400">192.168.1.{Math.floor(Math.random() * 255)}</p>
                      </div>
                      <div className="bg-[#050A14] border border-blue-900/30 p-4 text-center">
                        <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Total API Requests</p>
                        <p className="text-sm font-mono text-white">{Math.floor(Math.random() * 5000) + 120}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-400 border-b border-blue-900/30 pb-2 mb-4 flex items-center">
                        <History size={12} className="mr-2" /> Recent Activity Log
                      </h3>
                      <div className="space-y-2">
                        {[
                          { action: 'LOGIN_SUCCESS', time: '10 mins ago', ip: '192.168.x.x' },
                          { action: 'DATA_PULL_INIT', time: '2 hours ago', ip: '192.168.x.x' },
                          { action: 'TOKEN_REFRESH', time: '1 day ago', ip: '192.168.x.x' }
                        ].map((log, i) => (
                          <div key={i} className="flex justify-between items-center bg-black border border-slate-800 p-3">
                            <div className="flex items-center">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3" />
                              <span className="text-[10px] font-mono text-white tracking-widest">{log.action}</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-600">{log.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}