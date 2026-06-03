"use client";

import { ReactLenis } from '@studio-freight/react-lenis';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ 
      lerp: 0.05,       // The "smoothness" factor. Lower = more buttery (0.05 is cinematic)
      duration: 1.5,    // How long the momentum lasts
      smoothWheel: true,
      wheelMultiplier: 1.2, // Speeds up the scroll distance slightly
    }}>
      {children}
    </ReactLenis>
  );
}