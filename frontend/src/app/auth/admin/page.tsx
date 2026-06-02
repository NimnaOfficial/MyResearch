"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Key, Loader2, Terminal, Server } from 'lucide-react';
import CustomCursor from '@/components/CustomCursor';

export default function SecretAdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // Verify Admin Clearance
        if (data.data.user.role === 'admin') {
          localStorage.setItem('matrix_token', data.token);
          localStorage.setItem('userRole', 'admin');
          router.push('/admin'); // Enter the Command Core
        } else {
          // If a normal user somehow found this page and tried to log in
          setError('Clearance Denied: Elevated privileges required.');
        }
      } else {
        setError(data.message || 'Authentication sequence failed.');
      }
    } catch (err) {
      setError('Matrix connection lost. Server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black font-mono flex items-center justify-center relative overflow-hidden selection:bg-red-600 selection:text-white">
  {/* <CustomCursor /> removed */}
      
      {/* Deep Blood Red & General Blue Background Glows */}
      <div className="absolute top-0 left-0 w-[50vw] h-[50vw] bg-red-900/20 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[180px] pointer-events-none" />

      {/* Cybernetic Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="relative z-10 w-full max-w-md p-8 sm:p-12 bg-[#050b14]/90 backdrop-blur-3xl border border-red-900/50 shadow-[0_0_80px_rgba(153,27,27,0.2)] rounded-[2.5rem]"
      >
        <div className="flex flex-col items-center justify-center text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-900 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(220,38,38,0.5)]">
            <ShieldAlert size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-white">Level <span className="text-red-600">5</span> Access</h1>
          <p className="text-xs text-blue-500 font-mono tracking-widest uppercase mt-2">Matrix Command Core Authentication</p>
        </div>

        <form onSubmit={handleAdminLogin} className="flex flex-col space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Terminal size={18} className="text-blue-500" />
            </div>
            <input 
              type="email" 
              required
              placeholder="OPERATOR_EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-blue-900/30 text-white text-sm font-mono tracking-widest rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-red-600 focus:bg-red-950/10 transition-colors placeholder-slate-600"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Key size={18} className="text-blue-500" />
            </div>
            <input 
              type="password" 
              required
              placeholder="ENCRYPTION_KEY"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-blue-900/30 text-white text-sm font-mono tracking-widest rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-red-600 focus:bg-red-950/10 transition-colors placeholder-slate-600"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-[10px] font-mono font-black uppercase tracking-widest text-center bg-red-500/10 border border-red-500/20 py-3 rounded-xl"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            disabled={isLoading}
            className="relative w-full h-14 bg-gradient-to-r from-red-700 to-red-900 rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-[0.3em] text-white hover:from-red-600 hover:to-red-800 transition-all overflow-hidden group shadow-[0_0_30px_rgba(220,38,38,0.3)] disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin text-white" />
            ) : (
              <>
                <span className="relative z-10 flex items-center">
                  Initialize Override <Server size={16} className="ml-3" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex justify-center border-t border-red-900/30 pt-6">
          <button 
            type="button" 
            onClick={() => router.push('/auth')} 
            className="text-[10px] font-mono text-slate-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
          >
            [ ABORT SEQUENCE & RETURN ]
          </button>
        </div>
      </motion.div>
    </main>
  );
}