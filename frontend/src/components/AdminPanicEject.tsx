"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPanicEject() {
  const router = useRouter();

  useEffect(() => {
    const handlePhantomEject = (e: KeyboardEvent) => {
      // Listen for Ctrl + N (or Command + N on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault(); // Stop the browser from opening a new window!
        
        // 1. Instantly burn the security tokens
        localStorage.removeItem('matrix_token');
        localStorage.removeItem('userRole');
        
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