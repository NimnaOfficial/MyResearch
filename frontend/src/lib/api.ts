/**
 * Single source of truth for the backend base URL.
 *
 * - Local dev:   set NEXT_PUBLIC_API_URL=http://localhost:5000 in frontend/.env.local
 * - Production:  set NEXT_PUBLIC_API_URL in Vercel (falls back to the live Render API if unset)
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

/** Helper to parse a cookie value */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/** 
 * Reads stored session token with multi-tier vault recovery.
 * Survives window close, browser restart, and system reboots.
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  let token = localStorage.getItem('matrix_token');
  if (!token) {
    // Restore from persistent admin backup vault
    token = localStorage.getItem('matrix_admin_vault') || getCookie('matrix_admin_vault');
    if (token) {
      localStorage.setItem('matrix_token', token);
      localStorage.setItem('userRole', 'admin');
    }
  }
  return token;
};

/** Permanently preserves administrator session across window closes & reboots */
export const persistAdminSession = (token: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('matrix_token', token);
  localStorage.setItem('userRole', 'admin');
  localStorage.setItem('matrix_admin_vault', token);
  // Multi-tier redundancy: 10-year persistent cookie
  document.cookie = `matrix_admin_vault=${encodeURIComponent(token)}; path=/; max-age=315360000; SameSite=Lax`;
};

/** Checks if a critical high-priority operation is active (Lockdown, DB Hold) */
export const isCriticalSecurityActive = async (): Promise<{ active: boolean; reason?: string }> => {
  try {
    const res = await fetch(`${API_URL}/api/security/status`);
    if (res.ok) {
      const { data } = await res.json();
      if (data?.lockdown) {
        return { 
          active: true, 
          reason: 'DEFCON 1 SYSTEM LOCKDOWN IS CURRENTLY ENGAGED.\nPublic access is sealed.' 
        };
      }
      if (data?.dbHeld) {
        return { 
          active: true, 
          reason: 'DATABASE CIRCUIT BREAKER IS CURRENTLY ACTIVE.\nDatabase transactions are frozen.' 
        };
      }
    }
  } catch {}
  return { active: false };
};

/** 
 * Enforces security protocol: Prevents admin from logging out or abandoning 
 * the terminal during critical high-priority operations.
 */
export const handleSafeAdminLogout = async (onSuccess: () => void): Promise<boolean> => {
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  
  if (role === 'admin') {
    const check = await isCriticalSecurityActive();
    if (check.active) {
      alert(
        `🚨 PROTOCOL DISCONNECT REJECTED — COMMAND ABANDONMENT PROHIBITED:\n\n${check.reason}\n\nSecurity Directive: An Administrator cannot log out while the platform is operating under an emergency defense protocol.\n\nYou MUST disarm the protocol in Cyber Defense before terminating your session.`
      );
      return false;
    }
  }

  if (!confirm('TERMINATE SESSION:\n\nAre you sure you want to disconnect and log out of the console?')) {
    return false;
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('matrix_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('matrix_admin_vault');
    document.cookie = 'matrix_admin_vault=; path=/; max-age=0';
  }
  
  onSuccess();
  return true;
};

/** Builds an Authorization header object when a token exists. */
export const authHeaders = (token: string | null = getToken()): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};
