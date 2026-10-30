"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isCriticalSecurityActive } from '@/lib/api';

export default function AdminPanicEject() {
  const router = useRouter();

  useEffect(() => {
    const handlePhantomEject = async (e: KeyboardEvent) => {
      // Listen for Ctrl + Q (or Command + Q on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault();

        // Check if high-stakes operation is active
        const check = await isCriticalSecurityActive();
        if (check.active) {
          alert(`🚨 PANIC EJECT REJECTED:\n\n${check.reason}\n\nCommand Rule: Master Administrator cannot terminate session or burn tokens while high-priority defense protocols are active. Disarm protocol first.`);
          return;
        }
        
        // 1. Instantly burn the security tokens
        localStorage.removeItem('matrix_token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('matrix_admin_vault');
        document.cookie = 'matrix_admin_vault=; path=/; max-age=0';
        
        // 2. Silently warp to the Guest Gateway
        router.push('/auth');
      }
    };

    // Attach the listener globally
    window.addEventListener('keydown', handlePhantomEject);

    // Cleanup the listener if the component unmounts
    return () => window.removeEventListener('keydown', handlePhantomEject);
  }, [router]);

  // This component renders absolutely nothing. It is a ghost.
  return null; 
}
