"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Server, Database, Radio, LogOut, ShieldCheck } from 'lucide-react';
import AdminGuard from '@/components/AdminGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Command Core', path: '/admin', icon: ShieldCheck },
    { name: 'User Roster', path: '/admin/users', icon: Users },
    { name: 'Research & Blueprints', path: '/admin/posts', icon: Database },
    { name: 'Deployment Vault', path: '/admin/releases', icon: Server },
    { name: 'Secure Comms', path: '/admin/comms', icon: Radio },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#020617] text-slate-300 font-sans flex overflow-hidden selection:bg-red-900 selection:text-white">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-72 bg-[#050b14] border-r border-red-900/30 flex flex-col z-20 shadow-[5px_0_30px_rgba(153,27,27,0.1)]">
          <div className="h-24 flex items-center px-8 border-b border-red-900/30">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-900 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)]">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div className="ml-4">
              <h1 className="text-lg font-black tracking-widest uppercase text-white">CSx <span className="text-red-600">ADMIN</span></h1>
              <p className="text-[9px] font-mono text-blue-500 tracking-widest uppercase mt-1">Level 5 Clearance</p>
            </div>
          </div>

          <nav className="flex-1 py-8 px-4 flex flex-col space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link 
                  key={link.name} href={link.path}
                  className={`flex items-center px-4 py-4 rounded-2xl transition-all font-bold tracking-widest uppercase text-xs ${
                    isActive 
                      ? 'bg-red-600/10 text-red-500 border border-red-500/30' 
                      : 'text-slate-500 hover:bg-blue-900/20 hover:text-blue-400 border border-transparent'
                  }`}
                >
                  <link.icon size={18} className={`mr-4 ${isActive ? 'text-red-500' : 'opacity-70'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-red-900/30">
            <Link 
              href="/projects"
              className="flex items-center justify-center w-full px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-950 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-md"
            >
              <LogOut size={16} className="mr-3" /> Return to Matrix
            </Link>
          </div>
        </aside>

        {/* MAIN CANVAS */}
        <main className="flex-1 flex flex-col h-screen overflow-y-auto relative custom-admin-scroll">
          {/* Subtle Background Glows */}
          <div className="fixed top-0 right-0 w-[40vw] h-[40vw] bg-red-900/10 rounded-full blur-[150px] pointer-events-none z-0" />
          <div className="fixed bottom-0 left-[20vw] w-[30vw] h-[30vw] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none z-0" />
          
          <div className="relative z-10 flex-1">
            {children}
          </div>
        </main>
      </div>

      {/* Global Scrollbar Override for Admin Path */}
      <style jsx global>{`
        .custom-admin-scroll::-webkit-scrollbar { width: 6px; }
        .custom-admin-scroll::-webkit-scrollbar-track { background: #020617; }
        .custom-admin-scroll::-webkit-scrollbar-thumb { background: rgba(220, 38, 38, 0.4); border-radius: 10px; }
        .custom-admin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(220, 38, 38, 0.8); }
      `}</style>
    </AdminGuard>
  );
}