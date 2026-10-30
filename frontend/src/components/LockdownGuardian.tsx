"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, Lock, AlertTriangle, KeyRound, Terminal, 
  RefreshCw, Radio, CheckCircle2, X, ExternalLink 
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import { subscribeSecurityStream } from '@/lib/protocols';

interface SecurityStatus {
  lockdown: boolean;
  dbHeld: boolean;
  antiDdos: boolean;
  ipFilterMode: 'blacklist' | 'whitelist';
  emergencyBanner?: {
    enabled: boolean;
    message: string;
    level: 'info' | 'warn' | 'critical';
  };
  defconLevel: number;
  threatStatus: string;
}

export default function LockdownGuardian({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  
  // Override Login Form States
  const [overrideEmail, setOverrideEmail] = useState('');
  const [overridePassword, setOverridePassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overrideError, setOverrideError] = useState('');
  const [isProbing, setIsProbing] = useState(false);

  const checkIdentity = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('matrix_token');
    const adminCheck = role === 'admin' && Boolean(token);
    setIsAdmin(adminCheck);
    return adminCheck;
  }, []);

  const fetchSecurityStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/security/status`);
      if (res.ok) {
        const json = await res.json();
        setStatus(json.data);
      }
    } catch (e) {
      // Network error or backend offline
    }
  }, []);

  useEffect(() => {
    checkIdentity();
    fetchSecurityStatus();

    // 1. Instant Real-Time Push Stream (SSE)
    const unsubscribe = subscribeSecurityStream((event) => {
      if (event && event.state) {
        const s = event.state;
        const defcon = s.lockdownEnabled ? 1 : s.dbConnectionHeld ? 2 : 5;
        setStatus({
          lockdown: s.lockdownEnabled,
          dbHeld: s.dbConnectionHeld,
          antiDdos: s.antiDdosAggressive,
          ipFilterMode: s.ipFilterMode,
          emergencyBanner: s.emergencyBanner,
          defconLevel: defcon,
          threatStatus: defcon === 1 ? 'DEFCON 1' : 'DEFCON 5',
        });
      }
    });

    // 2. Fallback polling for maximum network redundancy
    const interval = setInterval(() => {
      checkIdentity();
      fetchSecurityStatus();
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [checkIdentity, fetchSecurityStatus]);

  const handleManualProbe = async () => {
    setIsProbing(true);
    checkIdentity();
    await fetchSecurityStatus();
    setTimeout(() => setIsProbing(false), 800);
  };

  const handleAdminOverrideLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOverrideError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: overrideEmail.trim(),
          password: overridePassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('matrix_token', data.token);
        localStorage.setItem('userRole', 'admin');
        setIsAdmin(true);
        setIsOverrideModalOpen(false);
        setOverrideEmail('');
        setOverridePassword('');
        // Refresh status
        await fetchSecurityStatus();
        router.push('/admin/security');
      } else {
        setOverrideError(data.message || 'Authentication Failed: Invalid Master Credentials.');
      }
    } catch (err) {
      setOverrideError('Network Failure: Unable to establish handshake with authentication gateway.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLockdownActive = status?.lockdown === true;
  const isBlockedByLockdown = isLockdownActive && !isAdmin;

  return (
    <>
      {/* 1. DEFCON 1 SYSTEM LOCKDOWN FULL-SCREEN ISOLATION (NON-ADMINS) */}
      <AnimatePresence>
        {isBlockedByLockdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-[#020104] text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden font-mono"
          >
            {/* Ambient Red Security Scanlines & Radial Pulse */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.18)_0%,transparent_75%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,0,0.04)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
            
            {/* Scanning Laser Beam */}
            <motion.div
              animate={{ top: ['-10%', '110%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-red-600 shadow-[0_0_30px_rgba(255,0,0,0.8)] pointer-events-none"
            />

            {/* Central Isolation Terminal */}
            <div className="relative z-10 max-w-xl w-full bg-[#0a0204]/90 border-2 border-red-600 rounded-3xl p-6 sm:p-10 shadow-[0_0_80px_rgba(220,38,38,0.4)] backdrop-blur-2xl text-center flex flex-col items-center">
              
              {/* Flashing Warning Badge */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-600/10 border-2 border-red-500 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(220,38,38,0.5)] mb-6 animate-pulse">
                <ShieldAlert size={40} />
              </div>

              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold tracking-widest uppercase mb-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>DEFCON 1 PROTOCOL ARMED</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mb-3">
                SYSTEM <span className="text-red-500">LOCKDOWN</span>
              </h1>

              <p className="text-xs sm:text-sm text-red-200/80 leading-relaxed max-w-md mb-6 font-sans">
                The platform perimeter has been sealed by the Master System Administrator for emergency defense and maintenance. All public routes and non-admin nodes are suspended.
              </p>

              {/* Real-time Status Card */}
              <div className="w-full bg-black/60 border border-red-900/50 rounded-2xl p-4 mb-6 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>SECURITY POSTURE:</span>
                  <span className="text-red-400 font-bold">TOTAL SECLUSION</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>PUBLIC CLEARANCE:</span>
                  <span className="text-red-500 font-bold">LEVEL 0 (REVOKED)</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>DATABASE CIRCUIT:</span>
                  <span className={status?.dbHeld ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                    {status?.dbHeld ? "HELD / FROZEN" : "STANDBY"}
                  </span>
                </div>
              </div>

              {/* Actions: Re-probe & Admin Override */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  type="button"
                  onClick={handleManualProbe}
                  disabled={isProbing}
                  className="flex-1 py-3 px-4 rounded-xl border border-red-700/60 bg-red-950/30 hover:bg-red-900/40 text-red-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <RefreshCw size={14} className={isProbing ? "animate-spin" : ""} />
                  <span>{isProbing ? 'Probing...' : 'Probe Perimeter'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all cursor-pointer"
                >
                  <KeyRound size={14} />
                  <span>Admin Override</span>
                </button>
              </div>
            </div>

            {/* Bottom Telemetry Footer */}
            <div className="absolute bottom-6 text-[10px] text-slate-500 uppercase tracking-widest flex items-center space-x-2">
              <Radio size={12} className="text-red-500 animate-pulse" />
              <span>Nima Cyber Command Defense Engine v4.8</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ADMIN OVERRIDE LOGIN MODAL */}
      <AnimatePresence>
        {isOverrideModalOpen && (
          <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="max-w-md w-full bg-[#050B14] border-2 border-red-600 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(220,38,38,0.6)] font-mono relative"
            >
              <button
                type="button"
                onClick={() => setIsOverrideModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-2"
              >
                <X size={18} />
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <Terminal className="text-red-500" size={24} />
                <h3 className="text-lg font-black uppercase text-white tracking-wider">Master Override Link</h3>
              </div>

              <p className="text-xs text-slate-400 mb-6 font-sans">
                Enter Master Administrator root credentials to pierce the perimeter and restore administrative control.
              </p>

              {overrideError && (
                <div className="mb-4 p-3 bg-red-950/60 border border-red-600 rounded-xl text-red-300 text-xs flex items-center space-x-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{overrideError}</span>
                </div>
              )}

              <form onSubmit={handleAdminOverrideLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                    Master Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@csx.matrix"
                    value={overrideEmail}
                    onChange={(e) => setOverrideEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-black/60 border border-slate-700 focus:border-red-500 rounded-xl text-white text-xs outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                    Master Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={overridePassword}
                    onChange={(e) => setOverridePassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black/60 border border-slate-700 focus:border-red-500 rounded-xl text-white text-xs outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Authenticating Root...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Pierce Lockdown & Login</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. ADMIN-ONLY WARNING PINNED BAR (WHEN VISITING UNDER LOCKDOWN) */}
      {isLockdownActive && isAdmin && (
        <div className="sticky top-0 z-[9999] w-full bg-red-950/95 border-b-2 border-red-600 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-[0_4px_20px_rgba(220,38,38,0.5)] font-mono text-xs text-white backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="font-black text-red-300 uppercase tracking-widest">
              [ DEFCON 1 SYSTEM LOCKDOWN ACTIVE ]
            </span>
            <span className="text-slate-300 hidden md:inline">
              Public access is completely sealed. Only you (Master Admin) are authorized.
            </span>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => router.push('/admin/security')}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <span>Security Command Center</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}

      {/* 3B. DB CIRCUIT BREAKER PINNED BAR (WHEN DB IS HELD) */}
      {status?.dbHeld && (
        <div className="sticky top-0 z-[9998] w-full bg-amber-950/95 border-b-2 border-amber-500 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.5)] font-mono text-xs text-white backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="font-black text-amber-300 uppercase tracking-widest">
              [ DEFCON 2: DATABASE CIRCUIT BREAKER ACTIVE ]
            </span>
            <span className="text-amber-100/80 hidden md:inline">
              Database connection is held. Non-admin operations paused.
            </span>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={async () => {
                const token = typeof window !== 'undefined' ? localStorage.getItem('matrix_token') : null;
                try {
                  const res = await fetch(`${API_URL}/api/security/emergency-disarm`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ key: 'Admin@Nima2026!' }),
                  });
                  if (res.ok) {
                    await fetchSecurityStatus();
                    alert('CIRCUIT BREAKER DISARMED: Normal database connectivity restored.');
                    window.location.reload();
                  } else {
                    router.push('/admin/security');
                  }
                } catch {
                  router.push('/admin/security');
                }
              }}
              className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1 cursor-pointer transition-colors shadow-md"
            >
              <span>Disarm DB Circuit Breaker</span>
            </button>
            <button
              onClick={() => router.push('/admin/security')}
              className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <span>Security Center</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}

      {/* 4. EMERGENCY BROADCAST BANNER (WHEN ACTIVE) */}
      {status?.emergencyBanner?.enabled && (
        <div className={`w-full px-4 py-2 flex items-center justify-center space-x-3 text-xs font-mono font-bold tracking-wider z-[9990] transition-colors ${
          status.emergencyBanner.level === 'critical'
            ? 'bg-red-900/90 text-white border-b border-red-500 shadow-[0_2px_15px_rgba(239,68,68,0.4)]'
            : status.emergencyBanner.level === 'warn'
            ? 'bg-amber-900/90 text-amber-100 border-b border-amber-500 shadow-[0_2px_15px_rgba(245,158,11,0.3)]'
            : 'bg-cyan-900/90 text-cyan-100 border-b border-cyan-500 shadow-[0_2px_15px_rgba(6,182,212,0.3)]'
        }`}>
          <AlertTriangle size={15} className="shrink-0 animate-bounce" />
          <span>{status.emergencyBanner.message}</span>
        </div>
      )}

      {/* Main Platform Canvas */}
      {children}
    </>
  );
}
