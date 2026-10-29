"use client";

import { ReactLenis } from '@studio-freight/react-lenis';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ 
      lerp: 0.1,        // Snappy, buttery smooth without lag
      duration: 1.0,    // Natural responsive momentum
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    }}>
      {children}
    </ReactLenis>
  );
}