"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Database, Server, Radio, LogOut, Bell, Activity, TerminalSquare } from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';
import CustomCursor from '@/components/CustomCursor';
import AdminPanicEject from '@/components/AdminPanicEject';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { name: 'DASHBOARD', path: '/admin', icon: LayoutDashboard },
    { name: 'NODE_ROSTER', path: '/admin/users', icon: Users },
    { name: 'BLUEPRINTS', path: '/admin/research', icon: Database },
    { name: 'API_VAULT', path: '/admin/releases', icon: Server },
    { name: 'SYS_CONFIG', path: '/admin/comms', icon: Radio },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#020617] text-slate-300 font-sans flex flex-col overflow-hidden selection:bg-red-900/50 selection:text-white">
      <CustomCursor />
      <AdminPanicEject />
        
        {/* ========================================= */}
        {/* 3D DIGITAL ENVIRONMENT & SCANLINES */}
        {/* ========================================= */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Deep Abstract Glows */}
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
          {/* Isometric Grid Overlays */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20" />
        </div>

        {/* ========================================= */}
        {/* TOP COMMAND NAVIGATION BAR */}
        {/* ========================================= */}
        <header className="sticky top-0 z-50 h-20 w-full bg-[#050B14]/90 backdrop-blur-md border-b border-blue-900/30 flex items-center justify-between px-6 lg:px-10 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          
          {/* Branding */}
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-black border border-red-700 flex items-center justify-center [clip-path:polygon(25%_0%,_100%_0%,_75%_100%,_0%_100%)] shadow-[0_0_15px_rgba(220,38,38,0.4)]">
              <TerminalSquare size={18} className="text-red-500 transform -skew-x-12" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-[0.2em] uppercase text-white">CSx<span className="text-red-600">CORE</span></h1>
              <div className="flex items-center space-x-2 mt-0.5">
                <div className="w-1.5 h-1.5 bg-blue-500 animate-pulse" />
                <p className="text-[8px] font-mono text-blue-500 tracking-[0.3em] uppercase">Matrix Linked</p>
              </div>
            </div>
          </div>

          {/* Central Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link 
                  key={link.name} href={link.path}
                  className={`relative px-5 py-3 group flex items-center text-[10px] font-mono tracking-widest transition-all uppercase ${
                    isActive ? 'text-white' : 'text-slate-500 hover:text-blue-400'
                  }`}
                >
                  <link.icon size={14} className={`mr-2.5 ${isActive ? 'text-red-500' : 'opacity-50 group-hover:opacity-100'}`} />
                  {link.name}
                  {/* Sharp Active Indicator */}
                  {isActive && (
                    <motion.div layoutId="activeNav" className="absolute bottom-0 left-0 w-full h-[2px] bg-red-600 shadow-[0_-5px_15px_rgba(220,38,38,0.5)]" />
                  )}
                  {/* Hover brackets */}
                  <span className="absolute left-1 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity">]</span>
                  <span className="absolute right-1 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity">[</span>
                </Link>
              );
            })}
          </nav>

          {/* Global Actions & Profile */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4 border-r border-blue-900/30 pr-6">
              <button className="relative text-slate-500 hover:text-white transition-colors" title="Activity Status">
                <Activity size={18} />
              </button>
              <button className="relative text-slate-500 hover:text-red-500 transition-colors" title="Notifications">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 border border-black rounded-none animate-pulse" />
              </button>
            </div>
            
            <div className="flex items-center cursor-pointer group">
              <div className="text-right mr-4 hidden sm:block">
                <p className="text-[11px] font-black tracking-widest text-white uppercase group-hover:text-red-500 transition-colors">NIMA</p>
                <p className="text-[8px] font-mono text-slate-500 tracking-[0.2em] uppercase">Lvl_5_Master</p>
              </div>
              <div className="w-10 h-10 bg-black border border-blue-500 flex items-center justify-center [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)] group-hover:border-red-500 transition-colors">
                <span className="text-sm font-black text-blue-500 group-hover:text-red-500 transition-colors">N</span>
              </div>
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
        .custom-admin-scroll::-webkit-scrollbar { width: 4px; }
        .custom-admin-scroll::-webkit-scrollbar-track { background: #020617; }
        .custom-admin-scroll::-webkit-scrollbar-thumb { background: #1e3a8a; border-radius: 0; }
        .custom-admin-scroll::-webkit-scrollbar-thumb:hover { background: #dc2626; }
      `}</style>
    </AdminGuard>
  );
}