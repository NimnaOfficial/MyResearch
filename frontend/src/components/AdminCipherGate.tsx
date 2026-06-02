"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminCipherGate() {
  const router = useRouter();
  const pathname = usePathname();
  
  const secretCipher = "190436";
  const [keySequence, setKeySequence] = useState("");

  useEffect(() => {
    // Only arm the keylogger on the /auth page
    if (pathname !== '/auth') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      setKeySequence((prev) => {
        // Append the new key and keep only the last 6 characters
        const newSeq = (prev + e.key).slice(-6); 
        
        // If the last 6 keys exactly match your code
        if (newSeq === secretCipher) {
          console.log("🔓 [CIPHER ACCEPTED] Initiating Command Core Override...");
          router.push('/auth/admin'); 
        }
        
        return newSeq;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, pathname]);

  return null; // 100% Invisible
}