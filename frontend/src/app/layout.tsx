import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";

// 🔥 IMPORT THE SECRET GATE
import AdminCipherGate from "@/components/AdminCipherGate";

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
      <body className="bg-[#010205] text-white antialiased overflow-x-hidden selection:bg-orange-500/30 selection:text-orange-500">
        
        {/* THE INVISIBLE ADMIN GATE */}
        <AdminCipherGate />
        
        {/* Main Application Canvas */}
        {children}
        
      </body>
    </html>
  );
}