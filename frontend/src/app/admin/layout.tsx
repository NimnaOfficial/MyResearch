"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Database, Server, Radio, LogOut, Bell, Activity, TerminalSquare, ShieldAlert, Lock } from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';
import CustomCursor from '@/components/CustomCursor';
import AdminPanicEject from '@/components/AdminPanicEject';
import { handleSafeAdminLogout, API_URL } from '@/lib/api';
import { subscribeSecurityStream } from '@/lib/protocols';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [criticalProtocolActive, setCriticalProtocolActive] = useState(false);

  useEffect(() => {
    // Check initial critical status
    fetch(`${API_URL}/api/security/status`)
      .then(res => res.json())
      .then(json => {
        if (json?.data?.lockdown || json?.data?.dbHeld) {
          setCriticalProtocolActive(true);
        }
      })
      .catch(() => {});

    // Subscribe to SSE stream for realtime protocol updates
    const unsubscribe = subscribeSecurityStream((event) => {
      if (event?.state) {
        setCriticalProtocolActive(Boolean(event.state.lockdownEnabled || event.state.dbConnectionHeld));
      }
    });

    return () => unsubscribe();
  }, []);

  const navLinks = [
    { name: 'DASHBOARD', path: '/admin', icon: LayoutDashboard },
    { name: 'NODE_ROSTER', path: '/admin/users', icon: Users },
    { name: 'BLUEPRINTS', path: '/admin/research', icon: Database },
    { name: 'API_VAULT', path: '/admin/projects', icon: Server },
    { name: 'SYS_CONFIG', path: '/admin/system', icon: Radio },
    { name: 'CYBER_DEFENSE', path: '/admin/security', icon: ShieldAlert },
  ];

  const handleLogout = async () => {
    await handleSafeAdminLogout(() => router.push('/auth'));
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#020617] text-slate-300 font-sans flex flex-col overflow-hidden selection:bg-red-900/50 selection:text-white">
      <CustomCursor />
      <AdminPanicEject />
        
        {/* ========================================= */}
        {/* 3D DIGITAL ENVIRONMENT & SCANLINES */}
        {/* ========================================= */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ transform: ['translate(0%, 0%)', 'translate(5%, 10%)', 'translate(-5%, -5%)', 'translate(0%, 0%)'] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-900/10 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ transform: ['translate(0%, 0%)', 'translate(-10%, 5%)', 'translate(10%, -10%)', 'translate(0%, 0%)'] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-red-900/10 rounded-full blur-[150px]" 
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20" />
        </div>

        {/* ========================================= */}
        {/* TOP COMMAND NAVIGATION BAR */}
        {/* ========================================= */}
        <header className="sticky top-0 z-50 h-20 w-full bg-[#050B14]/90 backdrop-blur-md border-b border-blue-900/30 flex items-center justify-between px-6 lg:px-10 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          
          {/* Branding */}
          <Link href="/admin" className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl bg-black border border-red-700 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)]">
              <TerminalSquare size={18} className="text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-[0.2em] uppercase text-white">CSx<span className="text-red-600">CORE</span></h1>
              <div className="flex items-center space-x-2 mt-0.5">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <p className="text-[8px] font-mono text-blue-500 tracking-[0.3em] uppercase">Matrix Linked</p>
              </div>
            </div>
          </Link>

          {/* Central Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link 
                  key={link.name} href={link.path}
                  className={`relative px-5 py-3 group flex items-center text-[11px] font-mono tracking-widest transition-all uppercase rounded-lg ${
                    isActive ? 'text-white bg-blue-950/40 font-bold' : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <link.icon size={15} className={`mr-2.5 ${isActive ? 'text-red-500' : 'opacity-60 group-hover:opacity-100'}`} />
                  {link.name}
                  {isActive && (
                    <motion.div layoutId="activeNav" className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 shadow-[0_-5px_15px_rgba(220,38,38,0.5)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Global Actions & Profile */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/projects" 
              className="text-xs font-mono text-slate-400 hover:text-blue-400 border border-blue-900/40 hover:border-blue-500 px-3 py-1.5 rounded-lg transition-colors hidden sm:inline-block"
            >
              Public Portal »
            </Link>

            <div className="flex items-center border-l border-blue-900/30 pl-4 space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-bold tracking-wider text-white uppercase">MASTER ADMIN</p>
                <p className="text-[8px] font-mono text-blue-400 tracking-wider uppercase">Level 5 Override</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-black border border-blue-500 flex items-center justify-center shadow-sm">
                <span className="text-sm font-black text-blue-400">A</span>
              </div>
              <button 
                onClick={handleLogout} 
                className={`p-2 rounded-xl transition-all ml-1 flex items-center space-x-1 ${
                  criticalProtocolActive 
                    ? 'text-amber-400 bg-amber-950/40 border border-amber-500/40 cursor-not-allowed hover:bg-amber-900/50' 
                    : 'text-slate-400 hover:text-red-400 hover:bg-red-950/30'
                }`}
                title={criticalProtocolActive ? "DISCONNECT PROHIBITED: High-stakes protocol active (Lockdown/DB Held)" : "Disconnect / Logout"}
              >
                {criticalProtocolActive ? <Lock size={16} className="text-amber-400 animate-pulse" /> : <LogOut size={17} />}
              </button>
            </div>
          </div>
        </header>

        {/* ========================================= */}
        {/* MAIN CANVAS */}
        {/* ========================================= */}
        <main className="flex-1 overflow-y-auto relative z-10 custom-admin-scroll p-6 lg:p-10">
          {children}
        </main>
      </div>

      <style jsx global>{`
        .custom-admin-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-admin-scroll::-webkit-scrollbar-track { background: #020617; }
        .custom-admin-scroll::-webkit-scrollbar-thumb { background: #1e3a8a; border-radius: 4px; }
        .custom-admin-scroll::-webkit-scrollbar-thumb:hover { background: #dc2626; }
      `}</style>
    </AdminGuard>
  );
}
