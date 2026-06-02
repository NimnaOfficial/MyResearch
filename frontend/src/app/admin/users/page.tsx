"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trash2, ShieldCheck, User as UserIcon, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface MatrixUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  _count?: {
    posts: number;
    savedPosts: number;
  };
}

export default function UserRoster() {
  const [users, setUsers] = useState<MatrixUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Tracks which user ID is being updated

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setUsers(data.data);
      } else {
        setError(data.message || 'FAILED TO RETRIEVE NODE ROSTER.');
      }
    } catch (err) {
      setError('FATAL: CORE DATABASE UNREACHABLE.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`WARNING: You are about to change this operator's clearance to [${newRole.toUpperCase()}]. Proceed?`)) return;

    setActionLoading(userId);
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        alert("Action Denied by Server.");
      }
    } catch (err) {
      alert("Network Failure.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTerminateUser = async (userId: string) => {
    if (!confirm("CRITICAL WARNING: This action will permanently delete the operator from the Matrix. This cannot be undone. Proceed?")) return;

    setActionLoading(userId);
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        const data = await res.json();
        alert(data.message || "Termination Denied by Server.");
      }
    } catch (err) {
      alert("Network Failure.");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-blue-500 font-mono tracking-widest uppercase">
        <Loader2 className="animate-spin mb-4 text-red-600" size={32} />
        <p>Scanning Matrix Nodes...</p>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 font-mono selection:bg-red-600 selection:text-white min-h-full relative">
      
      {/* HUD Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 border-b border-red-900/30 pb-6">
        <div className="flex items-center space-x-4 mb-2">
          <ShieldAlert size={28} className="text-red-600" />
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-white">OPERATOR <span className="text-blue-500">ROSTER</span></h1>
        </div>
        <p className="text-[10px] text-slate-500 tracking-[0.3em] uppercase">Global Node Management System</p>
      </motion.div>

      {error && (
        <div className="bg-red-950/30 border-l-2 border-red-600 p-4 mb-8 text-red-500 text-[10px] uppercase tracking-widest font-black flex items-center">
          <AlertTriangle size={16} className="mr-3 shrink-0" /> {error}
        </div>
      )}

      {/* Brutalist Data Table */}
      <div className="w-full overflow-x-auto bg-black border border-blue-900/30 relative">
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-blue-500" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-blue-500" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-blue-500" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-blue-500" />

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-950/20 border-b border-blue-900/50">
              <th className="p-4 text-[10px] text-blue-500 uppercase tracking-widest font-black">Identifier</th>
              <th className="p-4 text-[10px] text-blue-500 uppercase tracking-widest font-black">Clearance</th>
              <th className="p-4 text-[10px] text-blue-500 uppercase tracking-widest font-black">Registration Cycle</th>
              <th className="p-4 text-[10px] text-blue-500 uppercase tracking-widest font-black text-right">Overrides</th>
            </tr>
          </thead>
          <tbody className="text-xs text-slate-300">
            {users.map((user) => (
              <tr key={user.id} className="border-b border-blue-900/10 hover:bg-blue-900/10 transition-colors group">
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{user.fullName || user.username}</span>
                    <span className="text-[10px] text-slate-600 tracking-widest mt-1">{user.email}</span>
                  </div>
                </td>
                <td className="p-4">
                  {user.role === 'admin' ? (
                    <span className="inline-flex items-center px-2 py-1 bg-red-900/20 border border-red-700/50 text-red-500 text-[9px] tracking-widest uppercase">
                      <ShieldCheck size={12} className="mr-1.5" /> LEVEL_5
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 bg-slate-900/50 border border-slate-700 text-slate-400 text-[9px] tracking-widest uppercase">
                      <UserIcon size={12} className="mr-1.5" /> GUEST
                    </span>
                  )}
                </td>
                <td className="p-4 text-[10px] text-slate-500 tracking-widest">
                  {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
                </td>
                <td className="p-4 flex justify-end items-center space-x-3">
                  {actionLoading === user.id ? (
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                  ) : (
                    <>
                      <button 
                        onClick={() => handleRoleChange(user.id, user.role)}
                        className={`text-[9px] uppercase tracking-widest font-black px-3 py-1.5 border transition-all ${user.role === 'admin' ? 'border-red-900/50 text-red-500 hover:bg-red-900/20' : 'border-blue-900/50 text-blue-500 hover:bg-blue-900/20'}`}
                      >
                        {user.role === 'admin' ? 'DEMOTE' : 'ELEVATE'}
                      </button>
                      <button 
                        onClick={() => handleTerminateUser(user.id)}
                        className="text-[9px] uppercase tracking-widest font-black px-3 py-1.5 border border-red-900/30 text-slate-500 hover:text-red-500 hover:border-red-600 hover:bg-red-950/20 transition-all flex items-center"
                      >
                        <Trash2 size={12} className="mr-1.5" /> Terminate
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-600 text-[10px] uppercase tracking-widest">
                  NO EXTERNAL NODES DETECTED.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}