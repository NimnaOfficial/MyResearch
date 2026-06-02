"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Loader2 } from 'lucide-react';
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
        if (data.data.user.role === 'admin') {
          localStorage.setItem('matrix_token', data.token);
          localStorage.setItem('userRole', 'admin');
          router.push('/admin'); // Warp to the Command Core Layout
        } else {
          setError('ERR_CLEARANCE_DENIED: ELEVATED PRIVILEGES REQUIRED.');
        }
      } else {
        setError(`ERR_AUTH_FAILED: ${data.message || 'SEQUENCE REJECTED'}`);
      }
    } catch (err) {
      setError('FATAL: MATRIX CONNECTION SEVERED. SERVER UNREACHABLE.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black font-mono flex items-center justify-center relative overflow-hidden selection:bg-red-600 selection:text-white cursor-none">
      <CustomCursor />
      
      {/* Harsh Scanline & Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50" />
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-0 opacity-50" />

      {/* Dimmed, ominous background ambient lights */}
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-red-900/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg p-10 bg-black border border-red-900/50 shadow-[0_0_50px_rgba(153,27,27,0.15)] rounded-none"
      >
        {/* Brutalist Decorative Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-600" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-600" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-600" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-600" />

        {/* Header Block */}
        <div className="flex flex-col items-center justify-center text-center mb-10 border-b border-red-900/30 pb-8">
          <ShieldAlert size={48} strokeWidth={1} className="text-red-600 mb-6" />
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-[0.2em] text-white leading-none">
            LEVEL <span className="text-red-600">5</span>
          </h1>
          <p className="text-[10px] text-blue-500 tracking-[0.4em] uppercase mt-4">
            Restricted Command Core
          </p>
          <div className="flex items-center space-x-2 mt-4">
            <div className="w-1.5 h-1.5 bg-red-600 animate-pulse" />
            <span className="text-[8px] text-slate-500 tracking-widest">AWAITING_INPUT</span>
          </div>
        </div>

        <form onSubmit={handleAdminLogin} className="flex flex-col space-y-6">
          
          {/* Email Input */}
          <div className="flex flex-col space-y-2 group">
            <label className="text-[9px] text-blue-500 tracking-[0.3em] uppercase group-focus-within:text-red-500 transition-colors">
              [ IDENTIFIER ]
            </label>
            <div className="relative flex">
              <div className="w-2 bg-blue-900/30 group-focus-within:bg-red-600 transition-colors" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-black border border-blue-900/30 border-l-0 text-white text-xs py-4 px-4 focus:outline-none focus:border-red-600 focus:bg-red-950/20 transition-colors rounded-none placeholder-slate-800 tracking-widest uppercase"
                placeholder="OPERATOR_EMAIL"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col space-y-2 group">
            <label className="text-[9px] text-blue-500 tracking-[0.3em] uppercase group-focus-within:text-red-500 transition-colors">
              [ ENCRYPTION_KEY ]
            </label>
            <div className="relative flex">
              <div className="w-2 bg-blue-900/30 group-focus-within:bg-red-600 transition-colors" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-black border border-blue-900/30 border-l-0 text-white text-xs py-4 px-4 focus:outline-none focus:border-red-600 focus:bg-red-950/20 transition-colors rounded-none placeholder-slate-800 tracking-widest"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {/* Error Output */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-[10px] font-black uppercase tracking-widest text-left bg-red-950/30 border-l-2 border-red-600 py-3 px-4 rounded-none"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="relative w-full h-14 bg-red-900/20 border border-red-700 flex items-center justify-center font-black text-[11px] uppercase tracking-[0.4em] text-red-500 hover:bg-red-600 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-none mt-4 group"
          >
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <Loader2 size={16} className="animate-spin text-white" />
                <span className="text-white">AUTHENTICATING...</span>
              </div>
            ) : (
              <span className="relative z-10 flex items-center">
                INITIALIZE_OVERRIDE
                <span className="ml-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">»</span>
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 flex justify-between items-center border-t border-red-900/30 pt-6">
          <span className="text-[8px] text-slate-600 tracking-widest uppercase">
            SEC_PROTOCOL: ACTIVE
          </span>
          <button 
            type="button" 
            onClick={() => router.push('/auth')} 
            className="text-[9px] text-slate-500 uppercase tracking-widest hover:text-blue-500 transition-colors cursor-pointer"
          >
            [ ABORT SEQUENCE ]
          </button>
        </div>
      </motion.div>
    </main>
  );
}