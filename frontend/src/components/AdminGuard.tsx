"use client";

import { API_URL, getToken } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyClearance = async () => {
      const token = getToken();
      if (!token) {
        router.push('/auth');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (res.ok && data?.data?.role === 'admin') {
          setIsAuthorized(true); // Clearance Granted
        } else if (res.status === 503 || data?.error === 'DB_CONNECTION_HELD') {
          // Database connection held: preserve admin access so admin can access the security control console to release hold
          const storedRole = localStorage.getItem('userRole');
          if (storedRole === 'admin') {
            setIsAuthorized(true);
          } else {
            router.push('/projects');
          }
        } else {
          // Normal user trying to access admin
          router.push('/projects');
        }
      } catch (error) {
        const storedRole = localStorage.getItem('userRole');
        if (storedRole === 'admin') {
          setIsAuthorized(true);
        } else {
          router.push('/auth');
        }
      } finally {
        setIsChecking(false);
      }
    };

    verifyClearance();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#010205] text-red-600 flex flex-col items-center justify-center font-mono uppercase tracking-widest">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p>Verifying Elevated Clearance...</p>
      </div>
    );
  }

  if (!isAuthorized) return null; // Prevent flash of content before redirect

  return <>{children}</>;
}
