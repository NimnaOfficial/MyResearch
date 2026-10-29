"use client";

import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Trash2, ShieldCheck, User as UserIcon, Loader2, AlertTriangle, 
  Search, Download, ShieldAlert, Lock, Ban, Activity, X, Mail, Phone, Calendar, 
  Edit3, Save, History, Radio, Cpu, Network, CheckCircle, Key, Terminal, Copy, Check,
  UserPlus, Bookmark, BookOpen, Layers, RefreshCw
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
  _count?: {
    savedPosts: number;
    savedReleases: number;
    feedbacks: number;
  };
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
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'SECURITY' | 'VAULT' | 'TELEMETRY'>('IDENTITY');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<MatrixUser>>({});
  const [newCipher, setNewCipher] = useState('');
  const [regeneratedCode, setRegeneratedCode] = useState<string | null>(null);
  
  // Vault Data State
  const [userVault, setUserVault] = useState<{ savedPosts: any[]; savedReleases: any[] } | null>(null);
  const [loadingVault, setLoadingVault] = useState(false);

  // Provisioning Modal State
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
    age: '',
    isVerified: true
  });
  const [provisionResult, setProvisionResult] = useState<any | null>(null);

  // COPY TO CLIPBOARD STATE
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ==========================================
  // FETCH FULL ROSTER
  // ==========================================
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`${API_URL}/api/admin/users`, {
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

  // Fetch Vault Data when user inspects VAULT tab
  const fetchVault = async (userId: string) => {
    setLoadingVault(true);
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/vault`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUserVault(data.data);
      }
    } catch (err) {
      console.error("Failed to load user vault", err);
    } finally {
      setLoadingVault(false);
    }
  };

  useEffect(() => {
    if (inspectUser && activeTab === 'VAULT') {
      fetchVault(inspectUser.id);
    }
  }, [inspectUser, activeTab]);

  // ==========================================
  // LIVE DATABASE: SYSTEM ACTIONS
  // ==========================================
  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Elevate/Demote operator clearance to [${newRole.toUpperCase()}]?`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
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
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('matrix_token')}` }
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        if (inspectUser?.id === userId) setInspectUser(null);
      } else alert("Termination Denied by Server.");
    } catch (err) { alert("Network Failure."); } finally { setActionLoading(null); }
  };

  const handleBatchPurge = async () => {
    if (selectedNodes.length === 0) return;
    if (!confirm(`CRITICAL: Permanently purge ${selectedNodes.length} selected node(s)? This action cannot be undone.`)) return;
    setActionLoading('batch_purge');
    try {
      const token = localStorage.getItem('matrix_token');
      for (const id of selectedNodes) {
        await fetch(`${API_URL}/api/admin/users/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setUsers(prev => prev.filter(u => !selectedNodes.includes(u.id)));
      setSelectedNodes([]);
      alert("Purge operation concluded successfully.");
    } catch (e) {
      alert("Failed during batch purge.");
    } finally {
      setActionLoading(null);
    }
  };

  const saveIdentityChanges = async () => {
    if (!inspectUser) return;
    setActionLoading('save_identity');
    try {
      const token = localStorage.getItem('matrix_token');
      
      const res = await fetch(`${API_URL}/api/admin/users/${inspectUser.id}/identity`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (editForm.password) {
        if (editForm.password.length < 8) {
          alert("CIPHER MUST BE AT LEAST 8 CHARACTERS.");
        } else {
          await fetch(`${API_URL}/api/admin/users/${inspectUser.id}/cipher`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ newCipher: editForm.password })
          });
        }
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

  const handleRegenerateSecretCode = async () => {
    if (!inspectUser) return;
    if (!confirm("Regenerate fresh 10-character secret cipher code for this user? Previous code will become invalid.")) return;
    setActionLoading('regen_code');
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`${API_URL}/api/admin/users/${inspectUser.id}/regenerate-code`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRegeneratedCode(data.secretCode);
        alert(`New Secret Code Generated: ${data.secretCode}`);
      } else {
        alert(data.message || "Failed to regenerate secret code.");
      }
    } catch (e) {
      alert("Network failure.");
    } finally {
      setActionLoading(null);
    }
  };

  const forceCipherOverride = async () => {
    if (!newCipher || newCipher.length < 8) return alert("CIPHER MUST BE AT LEAST 8 CHARACTERS.");
    if (!confirm(`WARNING: Overwriting Node Cipher. Proceed?`)) return;
    setActionLoading('override_cipher');
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${inspectUser!.id}/cipher`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('matrix_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ newCipher })
      });
      if (res.ok) {
        setNewCipher('');
        alert(`CIPHER OVERRIDE SUCCESSFUL.`);
      } else {
        const errBody = await res.json().catch(() => ({}));
        alert(errBody.message || "Override Denied by Server.");
      }
    } catch (err) { alert("Network Failure."); } finally { setActionLoading(null); }
  };

  const toggleNodeSuspension = async () => {
    if (!inspectUser) return;
    const newStatus = inspectUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setActionLoading('suspend_node');
    
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${inspectUser.id}/status`, {
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

  // PROVISION OPERATOR SUBMIT
  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionForm.fullName || !provisionForm.email || !provisionForm.password) {
      return alert("Full Name, Email, and Password/Cipher are required.");
    }
    setActionLoading('provision');
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...provisionForm,
          age: provisionForm.age ? parseInt(provisionForm.age) : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setProvisionResult(data.data);
        setUsers(prev => [data.data, ...prev]);
        setProvisionForm({
          fullName: '',
          username: '',
          email: '',
          password: '',
          role: 'user',
          phone: '',
          age: '',
          isVerified: true
        });
      } else {
        alert(data.message || "Failed to provision operator.");
      }
    } catch (e) {
      alert("Network failure.");
    } finally {
      setActionLoading(null);
    }
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
                          (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <div className="font-sans relative min-h-screen text-slate-100">
      
      {/* HEADER & CONTROL DECK */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-blue-900/40 pb-6">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-500/50 shadow-md shadow-blue-500/20">
                <Network size={20} className="text-blue-400" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-wider text-white">
                Global Node <span className="text-blue-500">Roster</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center ml-13">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2" /> Live Database Synchronization | {users.length} Registered Operators
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => { setProvisionResult(null); setIsProvisionOpen(true); }}
              className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30"
            >
              <UserPlus size={15} className="mr-2" /> Provision Operator
            </button>
            <button 
              onClick={fetchUsers} 
              className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-900/50 text-blue-400 hover:text-white hover:border-blue-500 transition-colors"
              title="Refresh Roster"
            >
              <RefreshCw size={15} className={actionLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col xl:flex-row gap-3 bg-[#050A14] border border-blue-900/40 p-3 rounded-2xl shadow-xl">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
            <input 
              type="text" placeholder="Locate by identifier, username, email, or system id..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/60 border border-blue-900/30 rounded-xl text-white text-xs font-mono tracking-wider py-3 pl-11 pr-4 focus:outline-none focus:border-blue-500 transition-all placeholder-slate-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex bg-black/60 p-1 rounded-xl border border-blue-900/30">
              {['ALL', 'ADMIN', 'USER'].map(role => (
                <button 
                  key={role} onClick={() => setFilterRole(role as any)} 
                  className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
                    filterRole === role ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <button 
              onClick={extractCSV} 
              className="flex items-center px-4 py-2.5 bg-blue-950/40 border border-blue-900/50 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-mono font-bold transition-all"
            >
              <Download size={14} className="mr-1.5" /> Extract CSV
            </button>
          </div>
        </div>

        {/* BATCH ACTION BAR */}
        <AnimatePresence>
          {selectedNodes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-3 flex items-center justify-between bg-red-950/40 border border-red-500/50 p-3 rounded-xl backdrop-blur-md">
              <span className="text-xs text-red-300 font-mono tracking-wider font-bold">
                [{selectedNodes.length} NODE(S) TARGETED]
              </span>
              <button 
                onClick={handleBatchPurge}
                disabled={actionLoading === 'batch_purge'}
                className="text-xs bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg uppercase tracking-wider font-mono font-bold transition-colors flex items-center shadow-lg shadow-red-600/30 disabled:opacity-50"
              >
                {actionLoading === 'batch_purge' ? <Loader2 size={13} className="animate-spin mr-2" /> : <Trash2 size={13} className="mr-2" />} 
                Execute Batch Purge
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* FLOATING DATA-GRID */}
      <div className="w-full relative z-10">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 mb-2 bg-[#050A14] border border-blue-900/40 rounded-xl text-[10px] text-blue-400 font-mono tracking-wider uppercase font-bold">
          <div className="col-span-1 flex items-center justify-center">
            <input type="checkbox" title="Select all users" checked={selectedNodes.length === filteredUsers.length && filteredUsers.length > 0} onChange={toggleSelectAll} className="accent-blue-600 w-3.5 h-3.5 cursor-pointer rounded" />
          </div>
          <div className="col-span-2">SYS_ID</div>
          <div className="col-span-3">IDENTIFIER MATRIX</div>
          <div className="col-span-2">CLEARANCE</div>
          <div className="col-span-2">NETWORK STATUS</div>
          <div className="col-span-2 text-right">COMMAND OVERRIDES</div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2.5 pb-24">
          <AnimatePresence>
            {filteredUsers.map((user) => (
              <motion.div 
                layout variants={rowVariants} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.95 }} 
                key={user.id} 
                className={`grid grid-cols-1 lg:grid-cols-12 gap-4 items-center p-4 bg-[#050A14]/90 backdrop-blur-md rounded-2xl border transition-all duration-200 group ${
                  selectedNodes.includes(user.id) ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-blue-900/30 hover:border-blue-500/50 hover:bg-[#0A1224]'
                }`}
              >
                <div className="col-span-1 flex items-center justify-center">
                  <input type="checkbox" title="Select user" checked={selectedNodes.includes(user.id)} onChange={() => toggleSelectNode(user.id)} className="accent-blue-600 w-4 h-4 cursor-pointer rounded" />
                </div>
                <div className="col-span-2 flex items-center">
                  <Cpu size={14} className="text-slate-500 mr-2 opacity-60" />
                  <span className="text-xs font-mono text-slate-400">#{user.id.substring(0, 8)}...</span>
                </div>
                <div 
                  className="col-span-3 flex items-center space-x-3.5 cursor-pointer" 
                  onClick={() => { setInspectUser(user); setEditForm(user); setIsEditing(false); setActiveTab('IDENTITY'); setRegeneratedCode(null); }}
                >
                  <div className="w-10 h-10 rounded-xl bg-black border border-blue-900/50 group-hover:border-blue-500 flex items-center justify-center transition-colors shrink-0">
                    <UserIcon size={18} className="text-blue-400" />
                  </div>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-bold text-white tracking-wide uppercase group-hover:text-blue-400 transition-colors truncate">
                      {user.fullName || user.username}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center truncate">
                      <Mail size={10} className="mr-1 opacity-60" /> {user.email}
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  {user.role === 'admin' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-red-950/40 border border-red-600/50 text-red-400 text-[10px] tracking-wider font-mono font-bold uppercase shadow-sm">
                      <ShieldCheck size={12} className="mr-1.5" /> MASTER ADMIN
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-300 text-[10px] tracking-wider font-mono font-bold uppercase">
                      <UserIcon size={12} className="mr-1.5" /> STANDARD
                    </span>
                  )}
                </div>
                <div className="col-span-2 flex flex-col items-start space-y-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[9px] font-mono font-bold tracking-wider uppercase ${
                    user.status === 'SUSPENDED' ? 'bg-amber-950/30 border-amber-900/50 text-amber-400' : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status === 'SUSPENDED' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    {user.status || 'ACTIVE'}
                  </span>
                  {!user.isVerified && (
                    <span className="inline-flex items-center text-[9px] font-mono tracking-wider text-amber-400 opacity-80">
                      <AlertTriangle size={10} className="mr-1" /> UNVERIFIED
                    </span>
                  )}
                </div>
                <div className="col-span-2 flex justify-end items-center space-x-1 pr-2">
                  {actionLoading === user.id ? (
                    <Loader2 size={18} className="animate-spin text-blue-500 mr-4" />
                  ) : (
                    <>
                      <button 
                        onClick={() => { setInspectUser(user); setEditForm(user); setIsEditing(false); setActiveTab('IDENTITY'); setRegeneratedCode(null); }} 
                        className="p-2 text-slate-400 hover:text-white hover:bg-blue-900/30 rounded-lg transition-all" 
                        title="Inspect Node"
                      >
                        <Activity size={16} />
                      </button>
                      <button 
                        onClick={() => handleRoleChange(user.id, user.role)} 
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-900/30 rounded-lg transition-all" 
                        title="Toggle Clearance"
                      >
                        <ShieldAlert size={16} />
                      </button>
                      <button 
                        onClick={() => handleTerminateUser(user.id)} 
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-all" 
                        title="Terminate Node"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredUsers.length === 0 && (
            <div className="p-16 flex flex-col items-center justify-center border border-dashed border-blue-900/40 rounded-2xl bg-[#050A14]/50">
              <Search size={32} className="text-slate-600 mb-4" />
              <p className="text-slate-400 text-xs uppercase tracking-wider font-mono">No nodes match current query criteria.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* PROVISION NEW OPERATOR MODAL */}
      <AnimatePresence>
        {isProvisionOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProvisionOpen(false)} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md cursor-pointer" />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#050A14] border border-blue-500/50 w-full max-w-xl shadow-2xl rounded-2xl pointer-events-auto overflow-hidden">
                <div className="flex justify-between items-center bg-blue-950/40 p-5 border-b border-blue-900/50">
                  <div className="flex items-center text-blue-400 font-bold uppercase text-sm tracking-wider">
                    <UserPlus size={18} className="mr-2" /> Provision New Operator
                  </div>
                  <button type="button" onClick={() => setIsProvisionOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                </div>
                
                <form onSubmit={handleProvisionSubmit} className="p-6 space-y-4">
                  {provisionResult ? (
                    <div className="bg-emerald-950/40 border border-emerald-500/50 p-5 rounded-xl space-y-3">
                      <div className="flex items-center text-emerald-400 font-bold text-sm">
                        <CheckCircle size={18} className="mr-2" /> Operator Successfully Provisioned!
                      </div>
                      <p className="text-xs text-slate-300 font-mono">
                        User ID: #{provisionResult.id.substring(0, 8)}...
                      </p>
                      {provisionResult.secretCode && (
                        <div className="bg-black/60 p-3 rounded-lg border border-emerald-500/30 flex justify-between items-center">
                          <div>
                            <p className="text-[10px] text-slate-400 font-mono uppercase">User Secret Login Cipher:</p>
                            <p className="text-base font-black font-mono text-emerald-400 tracking-widest">{provisionResult.secretCode}</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleCopy(provisionResult.secretCode, 'new_user_code')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-bold"
                          >
                            {copiedField === 'new_user_code' ? 'Copied!' : 'Copy Key'}
                          </button>
                        </div>
                      )}
                      <button 
                        type="button" 
                        onClick={() => { setProvisionResult(null); setIsProvisionOpen(false); }}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase py-3 rounded-xl transition-all"
                      >
                        Close Window
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Full Name *</label>
                          <input 
                            type="text" required value={provisionForm.fullName} onChange={e => setProvisionForm({...provisionForm, fullName: e.target.value})}
                            placeholder="John Doe" className="w-full bg-black/60 border border-blue-900/40 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Username (Optional)</label>
                          <input 
                            type="text" value={provisionForm.username} onChange={e => setProvisionForm({...provisionForm, username: e.target.value})}
                            placeholder="johndoe_ops" className="w-full bg-black/60 border border-blue-900/40 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Email Comms *</label>
                          <input 
                            type="email" required value={provisionForm.email} onChange={e => setProvisionForm({...provisionForm, email: e.target.value})}
                            placeholder="operator@nima.io" className="w-full bg-black/60 border border-blue-900/40 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Cipher / Password *</label>
                          <input 
                            type="text" required minLength={8} value={provisionForm.password} onChange={e => setProvisionForm({...provisionForm, password: e.target.value})}
                            placeholder="Min 8 characters" className="w-full bg-black/60 border border-blue-900/40 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Clearance Level</label>
                          <select 
                            value={provisionForm.role} onChange={e => setProvisionForm({...provisionForm, role: e.target.value})}
                            className="w-full bg-black/60 border border-blue-900/40 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="user">User (Standard)</option>
                            <option value="admin">Admin (Level 5)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Frequency Phone</label>
                          <input 
                            type="text" value={provisionForm.phone} onChange={e => setProvisionForm({...provisionForm, phone: e.target.value})}
                            placeholder="+1 555-0199" className="w-full bg-black/60 border border-blue-900/40 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 block">Age Index</label>
                          <input 
                            type="number" value={provisionForm.age} onChange={e => setProvisionForm({...provisionForm, age: e.target.value})}
                            placeholder="28" className="w-full bg-black/60 border border-blue-900/40 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <input 
                          type="checkbox" id="verify_new" checked={provisionForm.isVerified} onChange={e => setProvisionForm({...provisionForm, isVerified: e.target.checked})}
                          className="accent-blue-600 rounded"
                        />
                        <label htmlFor="verify_new" className="text-xs font-mono text-slate-300">Mark operator as immediately verified</label>
                      </div>

                      <div className="pt-4 flex space-x-3">
                        <button 
                          type="button" onClick={() => setIsProvisionOpen(false)}
                          className="flex-1 bg-black/60 border border-slate-800 text-slate-400 hover:text-white py-3 rounded-xl font-mono text-xs font-bold uppercase transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" disabled={actionLoading === 'provision'}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-mono text-xs font-bold uppercase transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center disabled:opacity-50"
                        >
                          {actionLoading === 'provision' ? <Loader2 size={16} className="animate-spin" /> : 'Provision Operator'}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* TACTICAL HUD TERMINAL */}
      <AnimatePresence>
        {inspectUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInspectUser(null)} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md cursor-pointer" />
            
            <motion.div initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-[#050A14] border-l border-blue-900/50 z-[101] shadow-2xl flex flex-col">
              
              <div className="h-28 border-b border-blue-900/50 bg-black/60 flex items-center justify-between p-6 shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-950/80 border border-blue-500/50 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="text-2xl font-black text-blue-400">
                      {inspectUser.fullName ? inspectUser.fullName.charAt(0).toUpperCase() : inspectUser.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-wider uppercase">{inspectUser.fullName || inspectUser.username}</h2>
                    <p className="text-[10px] font-mono text-blue-400 mt-0.5">SYS_ID: #{inspectUser.id.substring(0, 12)}</p>
                  </div>
                </div>
                <button onClick={() => setInspectUser(null)} title="Close profile" className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg bg-black/50 border border-slate-800">
                  <X size={18} />
                </button>
              </div>

              {/* TABS */}
              <div className="flex border-b border-blue-900/40 bg-[#020617] px-6">
                {[
                  { id: 'IDENTITY', icon: UserIcon, label: 'Identity' },
                  { id: 'SECURITY', icon: ShieldAlert, label: 'Security' },
                  { id: 'VAULT', icon: Bookmark, label: 'Saved Vault' },
                  { id: 'TELEMETRY', icon: Radio, label: 'Telemetry' }
                ].map(tab => (
                  <button 
                    key={tab.id} type="button" 
                    onClick={() => { setActiveTab(tab.id as any); setIsEditing(false); }} 
                    className={`flex items-center py-4 px-4 text-xs font-mono font-bold uppercase tracking-wider transition-all relative ${
                      activeTab === tab.id ? 'text-blue-400 bg-blue-950/20' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <tab.icon size={14} className="mr-2" /> {tab.label}
                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_#3b82f6]" />}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT */}
              <div className="flex-1 overflow-y-auto p-6 custom-admin-scroll relative">
                <AnimatePresence mode="wait">
                  
                  {/* IDENTITY TAB */}
                  {activeTab === 'IDENTITY' && (
                    <motion.div key="identity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-blue-400">Node Parameters</h3>
                        {!isEditing ? (
                          <button onClick={() => setIsEditing(true)} className="flex items-center text-xs bg-blue-950/40 border border-blue-900 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg font-mono font-bold uppercase transition-all">
                            <Edit3 size={13} className="mr-1.5" /> Edit Parameters
                          </button>
                        ) : (
                          <div className="flex space-x-2">
                            <button onClick={() => setIsEditing(false)} className="text-xs bg-black/60 border border-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-lg font-mono font-bold uppercase">
                              Abort
                            </button>
                            <button onClick={saveIdentityChanges} className="flex items-center text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-mono font-bold uppercase hover:bg-blue-500 shadow-lg shadow-blue-600/30">
                              {actionLoading === 'save_identity' ? <Loader2 size={13} className="animate-spin" /> : <><Save size={13} className="mr-1.5" /> Save Changes</>}
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
                          <div key={field.key} className="bg-black/50 border border-blue-900/30 p-4 rounded-xl">
                            <div className="flex items-center mb-2">
                              <field.icon size={13} className="text-blue-400 mr-2 opacity-70" />
                              <label className="text-[10px] font-mono text-slate-400 uppercase">{field.label}</label>
                            </div>
                            {isEditing ? (
                              <input 
                                type={field.type} value={(editForm as any)[field.key] || ''} onChange={(e) => setEditForm({...editForm, [field.key]: e.target.value})} 
                                className="w-full bg-[#020617] border border-blue-900/50 rounded p-2 text-white text-xs font-mono focus:outline-none focus:border-blue-500" 
                              />
                            ) : (
                              <p className="text-sm text-white font-mono font-bold">{(inspectUser as any)[field.key] || <span className="text-slate-600">NOT_PROVIDED</span>}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-900/30">
                        <div className="bg-black/50 border border-blue-900/30 p-4 rounded-xl">
                          <label className="text-[10px] font-mono text-slate-400 uppercase mb-2 block">Verification Status</label>
                          {isEditing ? (
                            <select 
                              value={editForm.isVerified !== undefined ? String(editForm.isVerified) : String(inspectUser.isVerified)} 
                              onChange={(e) => setEditForm({...editForm, isVerified: e.target.value === 'true'})} 
                              className="w-full bg-[#020617] border border-blue-900/50 rounded p-2 text-white text-xs font-mono"
                            >
                              <option value="true">VERIFIED</option>
                              <option value="false">PENDING</option>
                            </select>
                          ) : (
                            <p className={`text-xs font-mono font-bold uppercase ${inspectUser.isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {inspectUser.isVerified ? 'VERIFIED' : 'PENDING'}
                            </p>
                          )}
                        </div>

                        <div className="bg-black/50 border border-blue-900/30 p-4 rounded-xl">
                          <label className="text-[10px] font-mono text-slate-400 uppercase mb-2 block">Clearance Level</label>
                          <p className="text-xs font-mono font-bold text-white uppercase">{inspectUser.role}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SECURITY TAB */}
                  {activeTab === 'SECURITY' && (
                    <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      
                      {/* SECRET CODE REGENERATION */}
                      <div className="bg-[#050b1a] border border-blue-900/40 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center text-blue-400 font-bold text-xs uppercase tracking-wider">
                          <Key size={16} className="mr-2" /> 10-Character Secret Code Protocol
                        </div>
                        <p className="text-xs text-slate-300 font-mono leading-relaxed">
                          Admins can regenerate a fresh cryptographic cipher code for the user to authenticate through the secret key login path.
                        </p>

                        {regeneratedCode && (
                          <div className="bg-black/60 p-4 rounded-xl border border-emerald-500/40 flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-mono text-slate-400 uppercase">Newly Generated Cipher Code:</p>
                              <p className="text-lg font-black font-mono text-emerald-400 tracking-widest">{regeneratedCode}</p>
                            </div>
                            <button 
                              onClick={() => handleCopy(regeneratedCode, 'regen_key')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold"
                            >
                              {copiedField === 'regen_key' ? 'Copied!' : 'Copy Code'}
                            </button>
                          </div>
                        )}

                        <button 
                          onClick={handleRegenerateSecretCode} 
                          disabled={actionLoading === 'regen_code'}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs uppercase px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center disabled:opacity-50"
                        >
                          {actionLoading === 'regen_code' ? <Loader2 size={14} className="animate-spin mr-2" /> : <RefreshCw size={14} className="mr-2" />} 
                          Regenerate Secret Code
                        </button>
                      </div>

                      {/* NETWORK SUSPENSION */}
                      <div className="bg-amber-950/20 border border-amber-900/40 p-6 rounded-2xl">
                        <h3 className="text-xs font-mono font-bold uppercase text-amber-400 flex items-center mb-2">
                          <Ban size={16} className="mr-2" /> Network Access Suspension
                        </h3>
                        <p className="text-xs text-slate-300 font-mono mb-4 leading-relaxed">
                          Sever or restore API access and authentication pathways for this node.
                        </p>
                        <button 
                          onClick={toggleNodeSuspension} 
                          className={`px-6 py-3 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all ${
                            inspectUser.status === 'SUSPENDED' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30' : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                          }`}
                        >
                          {actionLoading === 'suspend_node' ? <Loader2 size={14} className="animate-spin" /> : inspectUser.status === 'SUSPENDED' ? 'Restore Node Access' : 'Sever Node Access'}
                        </button>
                      </div>

                      {/* FORCE CIPHER OVERRIDE */}
                      <div className="bg-red-950/20 border border-red-900/40 p-6 rounded-2xl">
                        <h3 className="text-xs font-mono font-bold uppercase text-red-400 flex items-center mb-2">
                          <Lock size={16} className="mr-2" /> Force Master Password Override
                        </h3>
                        <p className="text-xs text-slate-300 font-mono mb-4 leading-relaxed">
                          Instantly reset the operator password. Current credentials will be destroyed.
                        </p>
                        <div className="flex gap-3">
                          <input 
                            type="text" placeholder="Enter new password (min 8 chars)..." value={newCipher} onChange={(e) => setNewCipher(e.target.value)} 
                            className="flex-1 bg-black/60 border border-red-900/50 text-white text-xs font-mono p-3 rounded-xl focus:outline-none focus:border-red-500" 
                          />
                          <button 
                            onClick={forceCipherOverride} disabled={actionLoading === 'override_cipher'} 
                            className="bg-red-600 hover:bg-red-500 text-white px-6 font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-600/30 disabled:opacity-50"
                          >
                            {actionLoading === 'override_cipher' ? <Loader2 size={14} className="animate-spin" /> : 'Override'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SAVED VAULT TAB */}
                  {activeTab === 'VAULT' && (
                    <motion.div key="vault" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div className="flex items-center justify-between border-b border-blue-900/30 pb-3">
                        <h3 className="text-xs font-mono font-bold uppercase text-blue-400 flex items-center">
                          <Bookmark size={16} className="mr-2" /> Operator Vault Inspection
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400">
                          Bookmarks & Saved Intelligence
                        </span>
                      </div>

                      {loadingVault ? (
                        <div className="py-12 flex flex-col items-center justify-center text-blue-400 font-mono text-xs">
                          <Loader2 size={24} className="animate-spin mb-3" />
                          <span>Decrypting User Vault...</span>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Saved Research Blueprints */}
                          <div>
                            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 mb-3 flex items-center">
                              <BookOpen size={14} className="mr-2 text-blue-400" /> Saved Research Blueprints ({userVault?.savedPosts?.length || 0})
                            </h4>
                            <div className="space-y-2">
                              {userVault?.savedPosts && userVault.savedPosts.length > 0 ? (
                                userVault.savedPosts.map((item: any) => (
                                  <div key={item.id} className="p-3 bg-black/50 border border-blue-900/30 rounded-xl flex justify-between items-center">
                                    <div>
                                      <p className="text-xs font-mono font-bold text-white">{item.post?.title || 'Unknown Post'}</p>
                                      <p className="text-[10px] font-mono text-slate-500">Type: {item.post?.type} | Saved on {new Date(item.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/40">
                                      BOOKMARKED
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs font-mono text-slate-500 italic p-3 bg-black/30 rounded-lg">No research blueprints saved by operator.</p>
                              )}
                            </div>
                          </div>

                          {/* Saved Project Releases */}
                          <div>
                            <h4 className="text-xs font-mono font-bold uppercase text-slate-300 mb-3 flex items-center">
                              <Layers size={14} className="mr-2 text-amber-400" /> Saved Project Releases ({userVault?.savedReleases?.length || 0})
                            </h4>
                            <div className="space-y-2">
                              {userVault?.savedReleases && userVault.savedReleases.length > 0 ? (
                                userVault.savedReleases.map((item: any) => (
                                  <div key={item.id} className="p-3 bg-black/50 border border-blue-900/30 rounded-xl flex justify-between items-center">
                                    <div>
                                      <p className="text-xs font-mono font-bold text-white">{item.release?.projectName || 'Unknown Release'}</p>
                                      <p className="text-[10px] font-mono text-slate-500">Version: {item.release?.version} | Saved on {new Date(item.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-900/40">
                                      RELEASE
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs font-mono text-slate-500 italic p-3 bg-black/30 rounded-lg">No project releases saved by operator.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TELEMETRY TAB */}
                  {activeTab === 'TELEMETRY' && (
                    <motion.div key="telemetry" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/50 border border-blue-900/30 p-4 rounded-xl">
                          <p className="text-[10px] font-mono text-slate-400 uppercase mb-1">System Hash ID</p>
                          <p className="text-sm font-mono font-bold text-blue-400">#{inspectUser.id.substring(0, 16)}</p>
                        </div>
                        <div className="bg-black/50 border border-blue-900/30 p-4 rounded-xl">
                          <p className="text-[10px] font-mono text-slate-400 uppercase mb-1">Node Stability</p>
                          <p className={`text-sm font-mono font-bold ${inspectUser.status === 'SUSPENDED' ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {inspectUser.status === 'SUSPENDED' ? 'SEVERED' : 'OPERATIONAL'}
                          </p>
                        </div>
                      </div>

                      <div className="bg-black/50 border border-blue-900/30 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[10px] font-mono text-slate-400 uppercase flex items-center">
                            <Network size={12} className="mr-1.5 text-blue-400" /> Network Origin (Last Known IP)
                          </p>
                          <button onClick={() => handleCopy(inspectUser.lastIp || '127.0.0.1', 'ip')} className="text-xs text-blue-400 hover:text-white">
                            {copiedField === 'ip' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-sm font-mono font-bold text-white">{inspectUser.lastIp || '127.0.0.1'}</p>
                      </div>

                      <div className="bg-black/50 border border-blue-900/30 p-4 rounded-xl">
                        <p className="text-[10px] font-mono text-slate-400 uppercase mb-1 flex items-center">
                          <Cpu size={12} className="mr-1.5 text-blue-400" /> Hardware Client Signature
                        </p>
                        <p className="text-xs font-mono text-slate-300 leading-relaxed">{inspectUser.lastDevice || 'Mozilla/5.0 WebClient Core'}</p>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-admin-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-admin-scroll::-webkit-scrollbar-track { background: rgba(3, 8, 22, 0.6); }
        .custom-admin-scroll::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.4); border-radius: 4px; }
        .custom-admin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.8); }
      `}</style>
    </div>
  );
}
