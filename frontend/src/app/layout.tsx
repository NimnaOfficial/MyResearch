import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";

// 🔥 GLOBAL SYSTEM COMPONENTS
import SmoothScroll from '@/components/SmoothScroll';
import AdminCipherGate from "@/components/AdminCipherGate";
import MobileBlocker from "@/components/MobileBlocker";
import { ThemeProvider } from "@/context/ThemeContext";

// Initialize standard and tech-themed fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "CSx | Matrix Architecture",
  description: "Central System Matrix and Deployment Vault",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${firaCode.variable}`}>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased overflow-x-hidden selection:bg-blue-600/30 selection:text-blue-400 transition-colors duration-300">
      
        {/* ========================================= */}
        {/* THE GLOBAL THEME PROVIDER                 */}
        {/* Synchronizes light/dark mode everywhere   */}
        {/* ========================================= */}
        <ThemeProvider>
          {/* ========================================= */}
          {/* HARDWARE SECURITY FIREWALL                */}
          {/* Blocks mobile agents and small viewports  */}
          {/* ========================================= */}
          <MobileBlocker>
            
            {/* ========================================= */}
            {/* THE INVISIBLE ADMIN GATE                  */}
            {/* Listens globally for the 190436 cipher    */}
            {/* ========================================= */}
            <AdminCipherGate />
            
            {/* ========================================= */}
            {/* THE MOMENTUM SCROLLING ENGINE             */}
            {/* Wraps the entire canvas for buttery scroll*/}
            {/* ========================================= */}
            <SmoothScroll>
              {children}
            </SmoothScroll>

          </MobileBlocker>
        </ThemeProvider>
        
      </body>
    </html>
  );
}
