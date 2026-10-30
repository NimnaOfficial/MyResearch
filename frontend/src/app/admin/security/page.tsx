"use client";

import { API_URL } from '@/lib/api';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, ShieldCheck, Lock, Unlock, Database, 
  Radio, AlertTriangle, RefreshCw, KeyRound, Globe, 
  Search, Download, Trash2, Ban, CheckCircle2, UserX, 
  Zap, Activity, Terminal, ExternalLink, Layers, Copy, Check,
  Cpu, FileCode, Code, Server
} from 'lucide-react';
import { callGrpc, callSoap, fetchGraphQL, subscribeSecurityStream } from '@/lib/protocols';

interface VisitorIp {
  ip: string;
  userAgent: string;
  firstSeen: string;
  lastSeen: string;
  totalHits: number;
  status: 'allowed' | 'blacklisted' | 'whitelisted';
  lastPath: string;
  lastUser: string;
  notes?: string;
  country?: string;
  isImmune?: boolean;
}

interface IncidentLog {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARN' | 'INFO';
  event: string;
  actor: string;
  details?: string;
  ip?: string;
}

interface SecurityState {
  lockdownEnabled: boolean;
  dbConnectionHeld: boolean;
  antiDdosAggressive: boolean;
  ipFilterMode: 'blacklist' | 'whitelist';
  emergencyBanner: {
    enabled: boolean;
    message: string;
    level: 'info' | 'warn' | 'critical';
  };
  blacklistedIps: string[];
  whitelistedIps: string[];
  adminImmuneIps?: string[];
  sessionRevocationTimestamp: number;
}

type ApiProtocol = 'gRPC' | 'REST' | 'GraphQL' | 'SOAP';

export default function SecurityMonitoringCenter() {
  const [activeTab, setActiveTab] = useState<'COMMAND' | 'IP_RADAR' | 'INCIDENTS' | 'FALLBACK'>('COMMAND');
  const [activeProtocol, setActiveProtocol] = useState<ApiProtocol>('gRPC');
  const [lastProtocolMetrics, setLastProtocolMetrics] = useState<{ protocol: ApiProtocol; latencyMs: number; status: string; detail?: string } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // Security Data
  const [state, setState] = useState<SecurityState>({
    lockdownEnabled: false,
    dbConnectionHeld: false,
    antiDdosAggressive: false,
    ipFilterMode: 'blacklist',
    emergencyBanner: { enabled: false, message: '', level: 'warn' },
    blacklistedIps: [],
    whitelistedIps: [],
    sessionRevocationTimestamp: 0,
  });

  const [stats, setStats] = useState({
    totalVisitorsRecorded: 0,
    totalNetworkHits: 0,
    blacklistedIpsCount: 0,
    whitelistedIpsCount: 0,
    activeIncidentCount: 0,
  });

  const [visitorIps, setVisitorIps] = useState<VisitorIp[]>([]);
  const [incidents, setIncidents] = useState<IncidentLog[]>([]);
  const [hardcodedStatus, setHardcodedStatus] = useState<any>(null);

  // Filter & Search States
  const [ipSearch, setIpSearch] = useState('');
  const [ipStatusFilter, setIpStatusFilter] = useState<'all' | 'blacklisted' | 'whitelisted' | 'allowed' | 'immune'>('all');
  const [incidentFilter, setIncidentFilter] = useState<'all' | 'CRITICAL' | 'WARN' | 'INFO'>('all');

  // Manual IP Adder State
  const [newIpAddress, setNewIpAddress] = useState('');
  const [newIpStatus, setNewIpStatus] = useState<'blacklisted' | 'whitelisted'>('blacklisted');
  const [newIpNotes, setNewIpNotes] = useState('');
  const [showAddIpModal, setShowAddIpModal] = useState(false);

  // Banner Editor Form State
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerLevel, setBannerLevel] = useState<'info' | 'warn' | 'critical'>('warn');

  // Clock Telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' | ' +
        now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hydration Engine
  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('matrix_token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const [dashRes, ipsRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/security/dashboard`, { headers }),
        fetch(`${API_URL}/api/admin/security/ips`, { headers }),
        fetch(`${API_URL}/api/admin/security/logs`, { headers }),
      ]);

      if (dashRes.ok) {
        const json = await dashRes.json();
        setState(json.data.state);
        setStats(json.data.stats);
        setHardcodedStatus(json.data.hardcodedAdminStatus);
        setBannerMessage(json.data.state.emergencyBanner?.message || '');
        setBannerLevel(json.data.state.emergencyBanner?.level || 'warn');
      }

      if (ipsRes.ok) {
        const json = await ipsRes.json();
        setVisitorIps(json.data || []);
      }

      if (logsRes.ok) {
        const json = await logsRes.json();
        setIncidents(json.data || []);
      }
    } catch (e) {
      console.error('Failed to sync security telemetry', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // 1. Subscribe to Live Server-Sent Events (SSE) Stream
    const unsubscribe = subscribeSecurityStream((event) => {
      if (event && event.state) {
        setState(event.state);
      }
      if (event.type === 'IP_STATUS_UPDATED' && event.data) {
        setVisitorIps(prev => prev.map(x => x.ip === event.data.ip ? { ...x, ...event.data } : x));
      }
      if (event.type === 'IP_DELETED' && event.data) {
        setVisitorIps(prev => prev.filter(x => x.ip !== event.data.ip));
      }
      fetchDashboardData();
    });

    // 2. Heartbeat redundancy poll
    const interval = setInterval(fetchDashboardData, 10000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  // DEFCON Calculator
  const defconLevel = useMemo(() => {
    if (state.lockdownEnabled) return 1;
    if (state.dbConnectionHeld) return 2;
    if (state.antiDdosAggressive || state.ipFilterMode === 'whitelist') return 3;
    return 5;
  }, [state]);

  // ==========================================
  // MULTI-PROTOCOL DISPATCHER
  // Executes actions via gRPC, REST, GraphQL, or SOAP
  // ==========================================

  // 1. Lockdown Directive
  const handleToggleLockdown = async () => {
    const willEnable = !state.lockdownEnabled;
    const confirmMsg = willEnable
      ? 'CRITICAL DEFCON 1 CONFIRMATION:\n\nAre you sure you want to FORCEFULLY LOCKDOWN the entire system?\nOnly YOU (Master Admin) will have access to the platform. All public visitors and users will be locked out immediately.'
      : 'DISARM LOCKDOWN CONFIRMATION:\n\nRestore system to public operations?';

    if (!confirm(confirmMsg)) return;

    setActionLoading('lockdown');
    const start = performance.now();

    try {
      if (activeProtocol === 'gRPC') {
        // gRPC-Web RPC Execution
        const method = willEnable ? 'EngageLockdown' : 'DisarmLockdown';
        const res = await callGrpc('DefenseControlService', method, { enabled: willEnable, reason: 'Command Console gRPC' });
        setLastProtocolMetrics({
          protocol: 'gRPC',
          latencyMs: res.latencyMs,
          status: `gRPC ${method} Executed (Code 0)`,
          detail: `DEFCON ${res.data.defconLevel || 1}`,
        });
      } else if (activeProtocol === 'GraphQL') {
        // GraphQL Mutation Execution
        const mutation = `
          mutation ToggleLockdown($enabled: Boolean!, $reason: String) {
            toggleLockdown(enabled: $enabled, reason: $reason) {
              lockdownEnabled
              defconLevel
              threatStatus
            }
          }
        `;
        const data = await fetchGraphQL(mutation, { enabled: willEnable, reason: 'Command Console GraphQL' });
        const latency = Math.round(performance.now() - start);
        setLastProtocolMetrics({
          protocol: 'GraphQL',
          latencyMs: latency,
          status: 'GraphQL Mutation toggleLockdown OK',
          detail: `DEFCON ${data.toggleLockdown?.defconLevel}`,
        });
      } else if (activeProtocol === 'SOAP') {
        // SOAP 1.2 XML Envelope Execution
        const xmlBody = `
          <sec:ExecuteSystemLockdownRequest>
            <sec:enabled>${willEnable}</sec:enabled>
            <sec:reason>SOAP 1.2 Enterprise Directive</sec:reason>
            <sec:masterToken>SOAP-WS-TOKEN</sec:masterToken>
          </sec:ExecuteSystemLockdownRequest>
        `;
        const res = await callSoap('ExecuteSystemLockdown', xmlBody);
        setLastProtocolMetrics({
          protocol: 'SOAP',
          latencyMs: res.latencyMs,
          status: 'SOAP 1.2 Envelope Verified & Executed',
          detail: `Checksum: ${(res.parsedValues.digitalChecksum || '').substring(0, 16)}...`,
        });
      } else {
        // Standard REST API
        const token = localStorage.getItem('matrix_token');
        const res = await fetch(`${API_URL}/api/admin/security/lockdown`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ enabled: willEnable, reason: 'REST Console' }),
        });
        const latency = Math.round(performance.now() - start);
        setLastProtocolMetrics({
          protocol: 'REST',
          latencyMs: latency,
          status: `HTTP POST 200 OK`,
          detail: willEnable ? 'DEFCON 1' : 'DEFCON 5',
        });
      }

      setState(prev => ({ ...prev, lockdownEnabled: willEnable }));
      await fetchDashboardData();
    } catch (e: any) {
      alert(`Protocol Execution Failure [${activeProtocol}]: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Database Circuit Breaker (Hold / Release)
  const handleToggleDbHold = async () => {
    const willHold = !state.dbConnectionHeld;
    const confirmMsg = willHold
      ? 'DATABASE CIRCUIT BREAKER CONFIRMATION:\n\nAre you sure you want to HOLD/FREEZE the database connection?\nAll non-admin queries will be suspended. Admin authentication will automatically operate via Hardcoded Master Credentials.'
      : 'RELEASE DATABASE CONNECTION:\n\nResume active database communication?';

    if (!confirm(confirmMsg)) return;

    setActionLoading('dbHold');
    const start = performance.now();

    try {
      if (activeProtocol === 'gRPC') {
        const method = willHold ? 'HoldDatabase' : 'ReleaseDatabase';
        const res = await callGrpc('DefenseControlService', method, { held: willHold, reason: 'Command Console gRPC' });
        setLastProtocolMetrics({
          protocol: 'gRPC',
          latencyMs: res.latencyMs,
          status: `gRPC ${method} Executed (Code 0)`,
          detail: willHold ? 'DB HELD' : 'DB ACTIVE',
        });
      } else if (activeProtocol === 'GraphQL') {
        const mutation = `
          mutation ToggleDbHold($held: Boolean!, $reason: String) {
            toggleDbHold(held: $held, reason: $reason) {
              dbConnectionHeld
              threatStatus
            }
          }
        `;
        const data = await fetchGraphQL(mutation, { held: willHold, reason: 'Command Console GraphQL' });
        const latency = Math.round(performance.now() - start);
        setLastProtocolMetrics({
          protocol: 'GraphQL',
          latencyMs: latency,
          status: 'GraphQL Mutation toggleDbHold OK',
          detail: data.toggleDbHold?.dbConnectionHeld ? 'HELD' : 'RELEASED',
        });
      } else if (activeProtocol === 'SOAP') {
        const xmlBody = `
          <sec:HoldDatabaseConnectionRequest>
            <sec:held>${willHold}</sec:held>
            <sec:reason>SOAP Database Isolation Directive</sec:reason>
            <sec:masterToken>SOAP-WS-TOKEN</sec:masterToken>
          </sec:HoldDatabaseConnectionRequest>
        `;
        const res = await callSoap('HoldDatabaseConnection', xmlBody);
        setLastProtocolMetrics({
          protocol: 'SOAP',
          latencyMs: res.latencyMs,
          status: 'SOAP 1.2 Envelope Verified',
          detail: `Fallback Armed: ${res.parsedValues.fallbackArmed || 'true'}`,
        });
      } else {
        const token = localStorage.getItem('matrix_token');
        const res = await fetch(`${API_URL}/api/admin/security/db-hold`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ held: willHold, reason: 'REST Console' }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `REST Execution Failed (${res.status})`);
        }
        const latency = Math.round(performance.now() - start);
        setLastProtocolMetrics({
          protocol: 'REST',
          latencyMs: latency,
          status: `HTTP POST 200 OK`,
          detail: willHold ? 'DB HELD' : 'DB ACTIVE',
        });
      }

      setState(prev => ({ ...prev, dbConnectionHeld: willHold }));
      await fetchDashboardData();
    } catch (e: any) {
      console.warn(`Primary protocol ${activeProtocol} encountered an issue:`, e.message);
      // Auto-fallback: If releasing hold and primary protocol failed, attempt emergency disarm
      if (!willHold) {
        try {
          const token = localStorage.getItem('matrix_token');
          const fallbackRes = await fetch(`${API_URL}/api/security/emergency-disarm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ key: 'Admin@Nima2026!' }),
          });
          if (fallbackRes.ok) {
            setState(prev => ({ ...prev, dbConnectionHeld: false }));
            await fetchDashboardData();
            alert('RECOVERY SUCCESS: Released Database Connection via Emergency Gateway Fallback.');
            return;
          }
        } catch {
          // continue to alert
        }
      }
      alert(`Protocol Execution Failure [${activeProtocol}]: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Emergency Disarm Failsafe
  const handleEmergencyDisarm = async () => {
    if (!confirm('EMERGENCY FORCE-DISARM:\n\nForcefully disarm the database circuit breaker and restore full communications immediately?')) return;
    setActionLoading('emergencyDisarm');
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`${API_URL}/api/security/emergency-disarm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ key: 'Admin@Nima2026!' }),
      });
      const data = await res.json();
      if (res.ok) {
        setState(prev => ({ ...prev, dbConnectionHeld: false, lockdownEnabled: false }));
        await fetchDashboardData();
        alert('EMERGENCY OVERRIDE SUCCESS: Database connection released and platform restored.');
      } else {
        alert(`Disarm Failed: ${data.message || 'Unauthorized'}`);
      }
    } catch (err: any) {
      alert(`Network Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Global Session Purge
  const handlePurgeSessions = async () => {
    if (!confirm('GLOBAL SESSION PURGE:\n\nRevoke ALL active user login sessions worldwide?\nEvery user will be forced to log in again.')) return;
    setActionLoading('purgeSessions');
    const start = performance.now();

    try {
      if (activeProtocol === 'gRPC') {
        const res = await callGrpc('DefenseControlService', 'PurgeSessions');
        setLastProtocolMetrics({
          protocol: 'gRPC',
          latencyMs: res.latencyMs,
          status: 'gRPC PurgeSessions Executed',
          detail: 'All Non-Admin Tokens Revoked',
        });
      } else if (activeProtocol === 'GraphQL') {
        const mutation = `mutation { purgeAllSessions }`;
        await fetchGraphQL(mutation);
        const latency = Math.round(performance.now() - start);
        setLastProtocolMetrics({
          protocol: 'GraphQL',
          latencyMs: latency,
          status: 'GraphQL Mutation purgeAllSessions OK',
          detail: 'Revoked',
        });
      } else {
        const token = localStorage.getItem('matrix_token');
        await fetch(`${API_URL}/api/admin/security/purge-sessions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const latency = Math.round(performance.now() - start);
        setLastProtocolMetrics({
          protocol: 'REST',
          latencyMs: latency,
          status: 'HTTP POST 200 OK',
          detail: 'Sessions Revoked',
        });
      }

      alert('All active non-admin session tokens have been forcefully revoked.');
      await fetchDashboardData();
    } catch (e: any) {
      alert(`Failed to purge sessions: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 4. Anti-DDoS Aggression
  const handleToggleAntiDdos = async () => {
    const willBeAggressive = !state.antiDdosAggressive;
    setActionLoading('ddos');
    const start = performance.now();

    try {
      if (activeProtocol === 'gRPC') {
        const res = await callGrpc('DefenseControlService', 'SetAntiDdos', { aggressive: willBeAggressive });
        setLastProtocolMetrics({
          protocol: 'gRPC',
          latencyMs: res.latencyMs,
          status: 'gRPC SetAntiDdos Executed',
          detail: willBeAggressive ? 'AGGRESSIVE' : 'NORMAL',
        });
      } else {
        const token = localStorage.getItem('matrix_token');
        await fetch(`${API_URL}/api/admin/security/anti-ddos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ aggressive: willBeAggressive }),
        });
        const latency = Math.round(performance.now() - start);
        setLastProtocolMetrics({
          protocol: 'REST',
          latencyMs: latency,
          status: 'HTTP POST 200 OK',
          detail: willBeAggressive ? 'AGGRESSIVE' : 'NORMAL',
        });
      }

      setState(prev => ({ ...prev, antiDdosAggressive: willBeAggressive }));
      await fetchDashboardData();
    } catch (e: any) {
      alert(`Failed to toggle Anti-DDoS: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 5. IP Filter Mode
  const handleToggleFilterMode = async (mode: 'blacklist' | 'whitelist') => {
    setActionLoading('filterMode');
    try {
      const token = localStorage.getItem('matrix_token');
      const res = await fetch(`${API_URL}/api/admin/security/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode }),
      });
      if (res.ok) {
        setState(prev => ({ ...prev, ipFilterMode: mode }));
        await fetchDashboardData();
      }
    } catch (e) {
      alert('Failed to switch IP filter mode.');
    } finally {
      setActionLoading(null);
    }
  };

  // 6. Broadcast Banner
  const handleSaveBanner = async (enabled: boolean) => {
    setActionLoading('banner');
    try {
      if (activeProtocol === 'GraphQL') {
        const mutation = `
          mutation PublishBanner($enabled: Boolean!, $message: String!, $level: String!) {
            publishEmergencyBanner(enabled: $enabled, message: $message, level: $level) {
              emergencyBannerEnabled
              emergencyBannerMessage
            }
          }
        `;
        await fetchGraphQL(mutation, { enabled, message: bannerMessage, level: bannerLevel });
      } else {
        const token = localStorage.getItem('matrix_token');
        await fetch(`${API_URL}/api/admin/security/banner`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ enabled, message: bannerMessage, level: bannerLevel }),
        });
      }

      setState(prev => ({
        ...prev,
        emergencyBanner: { enabled, message: bannerMessage, level: bannerLevel },
      }));
      await fetchDashboardData();
    } catch (e: any) {
      alert(`Failed to update emergency banner: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 7. IP Status Action
  const handleUpdateIpStatus = async (ip: string, status: 'allowed' | 'blacklisted' | 'whitelisted', notes?: string) => {
    if (status === 'blacklisted') {
      const isImmune = state.adminImmuneIps?.includes(ip) || visitorIps.find(x => x.ip === ip)?.isImmune;
      if (isImmune) {
        alert('SECURITY DIRECTIVE VIOLATION: Cannot blacklist active administrator node under any condition. Realtime zero-block immunity is active.');
        return;
      }
    }
    setActionLoading(`ip-${ip}`);
    const start = performance.now();

    try {
      if (activeProtocol === 'gRPC') {
        const method = status === 'blacklisted' ? 'QuarantineIp' : status === 'whitelisted' ? 'WhitelistIp' : 'ResetIp';
        const res = await callGrpc('RadarService', method, { ip, notes });
        setLastProtocolMetrics({
          protocol: 'gRPC',
          latencyMs: res.latencyMs,
          status: `gRPC Radar ${method} Executed`,
          detail: ip,
        });
      } else if (activeProtocol === 'GraphQL') {
        const mutation = `
          mutation SetRule($ip: String!, $status: String!, $notes: String) {
            setPerimeterRule(ip: $ip, status: $status, notes: $notes) {
              ip
              status
            }
          }
        `;
        await fetchGraphQL(mutation, { ip, status, notes: notes || '' });
        const latency = Math.round(performance.now() - start);
        setLastProtocolMetrics({
          protocol: 'GraphQL',
          latencyMs: latency,
          status: 'GraphQL setPerimeterRule OK',
          detail: `${ip} -> ${status}`,
        });
      } else {
        const token = localStorage.getItem('matrix_token');
        await fetch(`${API_URL}/api/admin/security/ips/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ip, status, notes }),
        });
        const latency = Math.round(performance.now() - start);
        setLastProtocolMetrics({
          protocol: 'REST',
          latencyMs: latency,
          status: 'HTTP POST 200 OK',
          detail: `${ip} -> ${status}`,
        });
      }

      setVisitorIps(prev => prev.map(item => item.ip === ip ? { ...item, status, notes: notes || item.notes } : item));
      await fetchDashboardData();
    } catch (e: any) {
      alert(`Failed to update IP ${ip}: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteIp = async (ip: string) => {
    if (!confirm(`Purge IP record ${ip} from traffic radar?`)) return;
    setActionLoading(`del-${ip}`);
    try {
      const token = localStorage.getItem('matrix_token');
      await fetch(`${API_URL}/api/admin/security/ips/${encodeURIComponent(ip)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setVisitorIps(prev => prev.filter(x => x.ip !== ip));
      await fetchDashboardData();
    } catch (e: any) {
      alert(`Failed to delete IP record: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateManualIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpAddress.trim()) return;
    await handleUpdateIpStatus(newIpAddress.trim(), newIpStatus, newIpNotes);
    setNewIpAddress('');
    setNewIpNotes('');
    setShowAddIpModal(false);
  };

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 1500);
  };

  const handleExportCsv = () => {
    const headers = ['IP Address', 'Status', 'Total Hits', 'First Seen', 'Last Seen', 'User Identifier', 'User Agent', 'Country', 'Notes'];
    const rows = filteredIps.map(x => [
      `"${x.ip}"`,
      `"${x.status}"`,
      x.totalHits,
      `"${x.firstSeen}"`,
      `"${x.lastSeen}"`,
      `"${x.lastUser}"`,
      `"${(x.userAgent || '').replace(/"/g, '""')}"`,
      `"${x.country || ''}"`,
      `"${(x.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `visitor_ips_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredIps, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `visitor_ips_audit_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered IPs
  const filteredIps = useMemo(() => {
    return visitorIps.filter(item => {
      const q = ipSearch.toLowerCase().trim();
      const matchQuery = !q || item.ip.toLowerCase().includes(q) || item.lastUser.toLowerCase().includes(q) || item.userAgent.toLowerCase().includes(q) || (item.notes && item.notes.toLowerCase().includes(q));
      const isImmune = Boolean(item.isImmune || state.adminImmuneIps?.includes(item.ip) || item.notes?.includes('ADMIN IP IMMUNITY') || item.lastUser === 'root_master');
      const matchStatus = 
        ipStatusFilter === 'all' ? true :
        ipStatusFilter === 'immune' ? isImmune :
        item.status === ipStatusFilter;
      return matchQuery && matchStatus;
    });
  }, [visitorIps, ipSearch, ipStatusFilter, state.adminImmuneIps]);

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    if (incidentFilter === 'all') return incidents;
    return incidents.filter(x => x.severity === incidentFilter);
  }, [incidents, incidentFilter]);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full relative z-10 font-mono text-slate-200">
      
      {/* ======================================================== */}
      {/* 1. TOP DEFCON THREAT METER & TELEMETRY HEADER           */}
      {/* ======================================================== */}
      <div className={`w-full rounded-3xl border-2 p-6 mb-6 transition-colors duration-700 shadow-2xl relative overflow-hidden backdrop-blur-xl ${
        defconLevel === 1 
          ? 'bg-[#150204]/90 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)]' 
          : defconLevel === 2 
          ? 'bg-[#150a02]/90 border-amber-600 shadow-[0_0_50px_rgba(217,119,6,0.3)]' 
          : defconLevel === 3 
          ? 'bg-[#121102]/90 border-yellow-600 shadow-[0_0_40px_rgba(202,138,4,0.2)]' 
          : 'bg-[#050B14]/90 border-blue-900/40 shadow-[0_0_40px_rgba(30,58,138,0.2)]'
      }`}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-bl-full pointer-events-none opacity-20 blur-3xl bg-red-600" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-5">
            <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 shadow-lg ${
              defconLevel === 1 
                ? 'bg-red-600/20 border-red-500 text-red-500 animate-pulse' 
                : defconLevel === 2 
                ? 'bg-amber-600/20 border-amber-500 text-amber-500' 
                : 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
            }`}>
              <ShieldAlert size={36} />
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-1">
                <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                  defconLevel === 1 ? 'bg-red-600/30 text-red-400 border-red-500 animate-ping' :
                  defconLevel === 2 ? 'bg-amber-600/30 text-amber-400 border-amber-500' :
                  'bg-emerald-600/30 text-emerald-400 border-emerald-500'
                }`}>
                  DEFCON {defconLevel}
                </span>
                <span className="text-[10px] text-slate-400 tracking-widest">{currentTime}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                CYBER DEFENSE & <span className="text-red-500">SECURITY PORTAL</span>
              </h1>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Multi-Protocol Defense Engine (REST · GraphQL · gRPC · SOAP 1.2 · SSE Stream)
              </p>
            </div>
          </div>

          {/* Quick Real-Time Telemetry Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className={`px-3 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider flex items-center space-x-2 ${
              state.lockdownEnabled 
                ? 'bg-red-950/80 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                : 'bg-black/40 border-slate-800 text-slate-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${state.lockdownEnabled ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
              <span>LOCKDOWN: {state.lockdownEnabled ? 'ARMED' : 'DISARMED'}</span>
            </div>

            <div className={`px-3 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider flex items-center space-x-2 ${
              state.dbConnectionHeld 
                ? 'bg-amber-950/80 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                : 'bg-black/40 border-slate-800 text-slate-400'
            }`}>
              <Database size={12} className={state.dbConnectionHeld ? "text-amber-400" : ""} />
              <span>DB: {state.dbConnectionHeld ? 'HELD / FROZEN' : 'ACTIVE'}</span>
            </div>

            <div className={`px-3 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider flex items-center space-x-2 ${
              state.ipFilterMode === 'whitelist' 
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-400' 
                : 'bg-black/40 border-slate-800 text-slate-400'
            }`}>
              <Globe size={12} />
              <span>IP MODE: {state.ipFilterMode.toUpperCase()}</span>
            </div>

            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-slate-700 hover:border-slate-500 bg-black/40 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MULTI-PROTOCOL DISPATCHER SWITCHER BAR (USER REQUEST) */}
      {/* ======================================================== */}
      <div className="w-full p-4 mb-6 rounded-2xl bg-[#030712] border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <Server size={18} className="text-cyan-400 animate-pulse" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block">
              Active API Protocol Execution Mode:
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              Choose the architectural protocol to dispatch commands (gRPC, REST, GraphQL, SOAP)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-slate-800">
          {[
            { id: 'gRPC', label: 'gRPC-Web (Fastest)', icon: Zap, color: 'text-amber-400' },
            { id: 'REST', label: 'REST (JSON)', icon: Layers, color: 'text-blue-400' },
            { id: 'GraphQL', label: 'GraphQL', icon: Code, color: 'text-pink-400' },
            { id: 'SOAP', label: 'SOAP 1.2 (XML)', icon: FileCode, color: 'text-emerald-400' },
          ].map((proto) => {
            const isSelected = activeProtocol === proto.id;
            return (
              <button
                key={proto.id}
                type="button"
                onClick={() => setActiveProtocol(proto.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-600 text-black shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <proto.icon size={12} className={isSelected ? 'text-black' : proto.color} />
                <span>{proto.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Execution Latency Badge */}
        {lastProtocolMetrics && (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-black/80 border border-slate-700 text-[10px]">
            <span className="text-slate-400">Last:</span>
            <strong className="text-cyan-300 font-bold">{lastProtocolMetrics.protocol}</strong>
            <span className="text-emerald-400 font-bold">{lastProtocolMetrics.latencyMs}ms</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300">{lastProtocolMetrics.status}</span>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. SUB-PORTAL NAVIGATION TABS                           */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-slate-800 pb-4">
        {[
          { id: 'COMMAND', label: 'Emergency Controls', icon: Zap, badge: state.lockdownEnabled ? 'DEFCON 1' : undefined },
          { id: 'IP_RADAR', label: 'Visitor IP Radar', icon: Globe, count: visitorIps.length },
          { id: 'INCIDENTS', label: 'Incident Audit Trail', icon: Activity, count: incidents.length },
          { id: 'FALLBACK', label: 'Master Admin Fallback', icon: KeyRound, status: 'ARMED' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded-xl flex items-center space-x-2.5 text-xs uppercase font-bold tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                  : 'bg-black/30 hover:bg-white/5 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-black text-red-400 border border-red-500 animate-pulse">
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 4. TAB 1: EMERGENCY CONTROLS (CRITICAL POWERS)           */}
      {/* ======================================================== */}
      {activeTab === 'COMMAND' && (
        <div className="space-y-8">
          
          {/* TOP DUAL EMERGENCY POWER SWITCHES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SWITCH 1: MASTER SYSTEM LOCKDOWN */}
            <div className={`p-6 sm:p-8 rounded-3xl border-2 transition-all flex flex-col justify-between ${
              state.lockdownEnabled
                ? 'bg-red-950/40 border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.3)]'
                : 'bg-[#050B14]/80 border-slate-800 hover:border-slate-700'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl ${state.lockdownEnabled ? 'bg-red-600 text-white shadow-lg shadow-red-600/50' : 'bg-slate-800 text-slate-400'}`}>
                      {state.lockdownEnabled ? <Lock size={22} /> : <Unlock size={22} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase text-white tracking-wider">Master System Lockdown</h3>
                      <p className="text-[10px] text-slate-400">DEFCON 1 Emergency Isolation Mechanism</p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    state.lockdownEnabled
                      ? 'bg-red-600 text-white border-red-400 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {state.lockdownEnabled ? 'ARMED // ACTIVE' : 'DISARMED // STANDBY'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed mb-6">
                  When enabled, the entire platform is forcefully sealed. All public endpoints and user portals are immediately blocked with a DEFCON 1 screen. <strong>Only you (Master Admin)</strong> are permitted access.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleLockdown}
                disabled={actionLoading === 'lockdown'}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  state.lockdownEnabled
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                    : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-[0_0_25px_rgba(220,38,38,0.5)]'
                }`}
              >
                {actionLoading === 'lockdown' ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : state.lockdownEnabled ? (
                  <>
                    <Unlock size={16} />
                    <span>Disarm Lockdown via {activeProtocol}</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Engage Forceful Lockdown via {activeProtocol}</span>
                  </>
                )}
              </button>
            </div>

            {/* SWITCH 2: DATABASE CIRCUIT BREAKER (HOLD CONNECTION) */}
            <div className={`p-6 sm:p-8 rounded-3xl border-2 transition-all flex flex-col justify-between ${
              state.dbConnectionHeld
                ? 'bg-amber-950/40 border-amber-600 shadow-[0_0_40px_rgba(217,119,6,0.3)]'
                : 'bg-[#050B14]/80 border-slate-800 hover:border-slate-700'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl ${state.dbConnectionHeld ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/50' : 'bg-slate-800 text-slate-400'}`}>
                      <Database size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase text-white tracking-wider">Hold Database Connection</h3>
                      <p className="text-[10px] text-slate-400">Database Circuit Breaker & Query Freeze</p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    state.dbConnectionHeld
                      ? 'bg-amber-600 text-white border-amber-400 animate-pulse'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {state.dbConnectionHeld ? 'HELD // FROZEN' : 'ONLINE // STREAMING'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed mb-6">
                  Instantly pauses all database queries to protect data integrity during an attack or migration. When held, admin access is automatically backed by <strong>Hardcoded Master Credentials</strong> without requiring DB connection.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleDbHold}
                disabled={actionLoading === 'dbHold'}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  state.dbConnectionHeld
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                    : 'bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-[0_0_25px_rgba(217,119,6,0.5)]'
                }`}
              >
                {actionLoading === 'dbHold' ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : state.dbConnectionHeld ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Release Database Hold via {activeProtocol}</span>
                  </>
                ) : (
                  <>
                    <Database size={16} />
                    <span>Hold Database Connection via {activeProtocol}</span>
                  </>
                )}
              </button>

              {state.dbConnectionHeld && (
                <button
                  type="button"
                  onClick={handleEmergencyDisarm}
                  disabled={actionLoading === 'emergencyDisarm'}
                  className="w-full mt-3 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center space-x-2 transition-all cursor-pointer bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-200 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                >
                  {actionLoading === 'emergencyDisarm' ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <>
                      <ShieldAlert size={14} className="text-red-400" />
                      <span>Emergency Root Disarm (Bypass Network Layers)</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>

          {/* SECONDARY EMERGENCY POWERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* POWER 1: GLOBAL SESSION PURGE */}
            <div className="p-6 rounded-3xl bg-[#050B14]/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-3 text-red-400">
                  <UserX size={20} />
                  <h4 className="font-black text-sm uppercase tracking-wider text-white">Global Session Purge</h4>
                </div>
                <p className="text-xs text-slate-400 font-sans mb-6">
                  Forcefully revokes all non-admin JWT tokens worldwide. Terminating all active user sessions instantly.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePurgeSessions}
                disabled={actionLoading === 'purgeSessions'}
                className="w-full py-3 px-4 bg-red-950/60 hover:bg-red-900 border border-red-700/60 text-red-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Trash2 size={14} />
                <span>Purge Sessions via {activeProtocol}</span>
              </button>
            </div>

            {/* POWER 2: ANTI-DDOS AGGRESSIVE MODE */}
            <div className="p-6 rounded-3xl bg-[#050B14]/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-3 text-cyan-400">
                  <Activity size={20} />
                  <h4 className="font-black text-sm uppercase tracking-wider text-white">Anti-DDoS Profile</h4>
                </div>
                <p className="text-xs text-slate-400 font-sans mb-6">
                  {state.antiDdosAggressive 
                    ? 'Aggressive perimeter active: rate limits clamped to ultra-strict 10 requests/minute.'
                    : 'Standard operational rate limits: normal network tolerance.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleAntiDdos}
                disabled={actionLoading === 'ddos'}
                className={`w-full py-3 px-4 border font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                  state.antiDdosAggressive
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Zap size={14} />
                <span>{state.antiDdosAggressive ? 'Switch to Normal Defense' : 'Engage Aggressive Anti-DDoS'}</span>
              </button>
            </div>

            {/* POWER 3: IP FILTERING POLICY */}
            <div className="p-6 rounded-3xl bg-[#050B14]/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-3 text-emerald-400">
                  <Globe size={20} />
                  <h4 className="font-black text-sm uppercase tracking-wider text-white">IP Filter Policy</h4>
                </div>
                <p className="text-xs text-slate-400 font-sans mb-6">
                  Active Policy: <strong className="text-white">{state.ipFilterMode === 'blacklist' ? 'BLACKLIST MODE (Open Except Banned)' : 'ENFORCED WHITELIST MODE (Strict)'}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleFilterMode('blacklist')}
                  disabled={actionLoading === 'filterMode' || state.ipFilterMode === 'blacklist'}
                  className={`py-2.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                    state.ipFilterMode === 'blacklist'
                      ? 'bg-red-600 text-white border-red-500 shadow-md'
                      : 'bg-black/40 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Blacklist Mode
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleFilterMode('whitelist')}
                  disabled={actionLoading === 'filterMode' || state.ipFilterMode === 'whitelist'}
                  className={`py-2.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                    state.ipFilterMode === 'whitelist'
                      ? 'bg-cyan-600 text-black font-black border-cyan-400 shadow-md'
                      : 'bg-black/40 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Whitelist Mode
                </button>
              </div>
            </div>

          </div>

          {/* EMERGENCY BROADCAST BANNER COMPOSER */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#050B14]/80 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="text-amber-500" size={20} />
                <h4 className="text-base font-black uppercase text-white tracking-wider">Global Emergency Broadcast Banner</h4>
              </div>

              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                state.emergencyBanner?.enabled ? 'bg-amber-600/30 text-amber-400 border-amber-500' : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}>
                {state.emergencyBanner?.enabled ? 'BROADCASTING' : 'OFFLINE'}
              </span>
            </div>

            <p className="text-xs text-slate-400 font-sans mb-4">
              Publish a pinned real-time cyber alert banner displayed directly at the top of all pages across the platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <input
                type="text"
                placeholder="e.g. Critical security audit in progress. Platform will experience intermittent latency."
                value={bannerMessage}
                onChange={(e) => setBannerMessage(e.target.value)}
                className="flex-1 px-4 py-3 bg-black/60 border border-slate-700 focus:border-amber-500 rounded-xl text-white text-xs outline-none"
              />

              <select
                value={bannerLevel}
                onChange={(e) => setBannerLevel(e.target.value as any)}
                className="px-4 py-3 bg-black/60 border border-slate-700 focus:border-amber-500 rounded-xl text-white text-xs outline-none uppercase font-bold cursor-pointer"
              >
                <option value="critical">Critical (Red Glow)</option>
                <option value="warn">Warning (Amber)</option>
                <option value="info">Notice (Cyan Telemetry)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              {state.emergencyBanner?.enabled && (
                <button
                  type="button"
                  onClick={() => handleSaveBanner(false)}
                  disabled={actionLoading === 'banner'}
                  className="px-5 py-2.5 rounded-xl border border-red-700/60 bg-red-950/40 text-red-400 hover:bg-red-900/60 font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Deactivate Banner
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSaveBanner(true)}
                disabled={actionLoading === 'banner' || !bannerMessage.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer"
              >
                {actionLoading === 'banner' ? 'Broadcasting...' : `Publish Banner via ${activeProtocol}`}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TAB 2: VISITOR IP RADAR & AUDIT LOG (ALL VISITORS)    */}
      {/* ======================================================== */}
      {activeTab === 'IP_RADAR' && (
        <div className="space-y-6">
          
          {/* IP STATS BAR */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#050B14]/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Total IPs Tracked</span>
              <span className="text-2xl font-black text-white">{stats.totalVisitorsRecorded}</span>
            </div>
            <div className="p-5 rounded-2xl bg-[#050B14]/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Total Network Hits</span>
              <span className="text-2xl font-black text-cyan-400">{stats.totalNetworkHits}</span>
            </div>
            <div className="p-5 rounded-2xl bg-[#050B14]/80 border border-red-900/40">
              <span className="text-[10px] text-red-400 uppercase tracking-widest block mb-1">Blacklisted IPs</span>
              <span className="text-2xl font-black text-red-500">{stats.blacklistedIpsCount}</span>
            </div>
            <div className="p-5 rounded-2xl bg-[#050B14]/80 border border-emerald-900/40">
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest block mb-1">Whitelisted IPs</span>
              <span className="text-2xl font-black text-emerald-400">{stats.whitelistedIpsCount}</span>
            </div>
          </div>

          {/* CONTROLS & SEARCH BAR */}
          <div className="p-4 rounded-2xl bg-[#050B14]/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 w-full md:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search IP, User Agent, Identity, Notes..."
                  value={ipSearch}
                  onChange={(e) => setIpSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-slate-700 focus:border-red-500 rounded-xl text-white text-xs outline-none"
                />
              </div>

              {/* Status Filter Dropdown */}
              <select
                value={ipStatusFilter}
                onChange={(e) => setIpStatusFilter(e.target.value as any)}
                className="px-3 py-2.5 bg-black/60 border border-slate-700 rounded-xl text-xs text-white uppercase font-bold cursor-pointer"
              >
                <option value="all">All ({visitorIps.length})</option>
                <option value="immune">🛡️ Immune Admin IPs ({state.adminImmuneIps?.length || 1})</option>
                <option value="blacklisted">Blacklisted</option>
                <option value="whitelisted">Whitelisted</option>
                <option value="allowed">Allowed / Neutral</option>
              </select>
            </div>

            {/* Actions: Add IP & Exports */}
            <div className="flex items-center space-x-2 self-end md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowAddIpModal(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <span>+ Add / Ban IP</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
              >
                <Download size={13} />
                <span>CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportJson}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
              >
                <Download size={13} />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* VISITOR IP AUDIT TABLE */}
          <div className="rounded-3xl border border-slate-800 bg-[#050B14]/80 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/60 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="py-4 px-6">IP Address & Location</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-center">Hits</th>
                    <th className="py-4 px-4">Identity / Role</th>
                    <th className="py-4 px-4">Last Activity</th>
                    <th className="py-4 px-4">Client User Agent</th>
                    <th className="py-4 px-6 text-right">Perimeter Action ({activeProtocol})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredIps.length > 0 ? (
                    filteredIps.map((item) => {
                      const isBlacklisted = item.status === 'blacklisted';
                      const isWhitelisted = item.status === 'whitelisted';
                      const isImmune = Boolean(item.isImmune || state.adminImmuneIps?.includes(item.ip) || item.notes?.includes('ADMIN IP IMMUNITY') || item.lastUser === 'root_master');

                      return (
                        <tr key={item.ip} className={`transition-colors group ${isImmune ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]' : 'hover:bg-white/[0.02]'}`}>
                          
                          {/* IP Address */}
                          <td className="py-4 px-6">
                            <div className="flex items-center flex-wrap gap-2">
                              <span className={`font-bold tracking-wider ${isImmune ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'text-white'}`}>
                                {item.ip}
                              </span>
                              {isImmune && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)] inline-flex items-center">
                                  🛡️ IMMUNE ADMIN IP (ZERO-BLOCK)
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleCopyIp(item.ip)}
                                className="text-slate-500 hover:text-white p-1"
                                title="Copy IP"
                              >
                                {copiedIp === item.ip ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{item.country || 'Global Node'}</span>
                            {item.notes && (
                              <span className="text-[9px] text-amber-400/80 block mt-0.5 italic">Note: {item.notes}</span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-4">
                            {isImmune ? (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border bg-cyan-600/20 text-cyan-300 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                                IMMUNE (CLEARANCE)
                              </span>
                            ) : (
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                                isBlacklisted 
                                  ? 'bg-red-600/20 text-red-400 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' 
                                  : isWhitelisted 
                                  ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {item.status}
                              </span>
                            )}
                          </td>

                          {/* Hits */}
                          <td className="py-4 px-4 text-center font-bold text-slate-200">
                            {item.totalHits}
                          </td>

                          {/* Identity */}
                          <td className="py-4 px-4">
                            <span className={`text-[11px] font-bold ${item.lastUser === 'GUEST' ? 'text-slate-500' : isImmune ? 'text-amber-400' : 'text-cyan-400'}`}>
                              {item.lastUser}
                            </span>
                          </td>

                          {/* Last Activity */}
                          <td className="py-4 px-4 text-[10px] text-slate-400">
                            <div>{new Date(item.lastSeen).toLocaleTimeString()}</div>
                            <div className="text-[9px] text-slate-500">{new Date(item.lastSeen).toLocaleDateString()}</div>
                          </td>

                          {/* User Agent */}
                          <td className="py-4 px-4 max-w-[200px] truncate text-[10px] text-slate-400" title={item.userAgent}>
                            {item.userAgent || 'Unknown Agent'}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {isImmune ? (
                                <span
                                  className="px-2.5 py-1 bg-amber-950/40 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-not-allowed inline-flex items-center space-x-1"
                                  title="Cannot blacklist active administrator node (Zero-block immunity armed)"
                                >
                                  <Lock size={11} className="mr-1 text-amber-400" /> IMMUNE NODE
                                </span>
                              ) : (
                                !isBlacklisted && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateIpStatus(item.ip, 'blacklisted', `Banned via ${activeProtocol}`)}
                                    disabled={actionLoading === `ip-${item.ip}`}
                                    className="px-2.5 py-1 bg-red-950/70 hover:bg-red-900 border border-red-700/60 text-red-300 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                                    title={`Blacklist IP via ${activeProtocol}`}
                                  >
                                    Ban
                                  </button>
                                )
                              )}

                              {!isWhitelisted && !isImmune && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateIpStatus(item.ip, 'whitelisted', `Whitelisted via ${activeProtocol}`)}
                                  disabled={actionLoading === `ip-${item.ip}`}
                                  className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                                  title={`Whitelist IP via ${activeProtocol}`}
                                >
                                  Whitelist
                                </button>
                              )}

                              {(isBlacklisted || isWhitelisted) && !isImmune && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateIpStatus(item.ip, 'allowed')}
                                  disabled={actionLoading === `ip-${item.ip}`}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                                  title="Reset to Neutral"
                                >
                                  Reset
                                </button>
                              )}

                              {!isImmune && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteIp(item.ip)}
                                  disabled={actionLoading === `del-${item.ip}`}
                                  className="p-1 text-slate-500 hover:text-red-400 transition-colors ml-1"
                                  title="Delete IP record from radar"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 uppercase tracking-widest text-xs">
                        No visitor IP records match current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MANUAL ADD IP MODAL */}
          <AnimatePresence>
            {showAddIpModal && (
              <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="max-w-md w-full bg-[#050B14] border-2 border-red-600 rounded-3xl p-6 sm:p-8 shadow-2xl font-mono relative"
                >
                  <button
                    type="button"
                    onClick={() => setShowAddIpModal(false)}
                    className="absolute top-5 right-5 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>

                  <h3 className="text-lg font-black uppercase text-white mb-2">Configure IP Perimeter Rule</h3>
                  <p className="text-xs text-slate-400 font-sans mb-6">
                    Manually enforce isolation or clearance for an IP address via {activeProtocol}.
                  </p>

                  <form onSubmit={handleCreateManualIp} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">IP Address</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 192.168.1.100 or 45.33.32.156"
                        value={newIpAddress}
                        onChange={(e) => setNewIpAddress(e.target.value)}
                        className="w-full px-4 py-2.5 bg-black/60 border border-slate-700 focus:border-red-500 rounded-xl text-white text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Perimeter Classification</label>
                      <select
                        value={newIpStatus}
                        onChange={(e) => setNewIpStatus(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-black/60 border border-slate-700 rounded-xl text-white text-xs font-bold uppercase cursor-pointer"
                      >
                        <option value="blacklisted">Blacklist (Immediate Isolation & Ban)</option>
                        <option value="whitelisted">Whitelist (Unconditional Clearance Bypass)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Threat Note / Reason</label>
                      <input
                        type="text"
                        placeholder="e.g. Malicious probing detected, or admin home network"
                        value={newIpNotes}
                        onChange={(e) => setNewIpNotes(e.target.value)}
                        className="w-full px-4 py-2.5 bg-black/60 border border-slate-700 focus:border-red-500 rounded-xl text-white text-xs outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
                    >
                      Enforce IP Rule via {activeProtocol}
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* ======================================================== */}
      {/* 6. TAB 3: INCIDENT AUDIT TRAIL STREAM                    */}
      {/* ======================================================== */}
      {activeTab === 'INCIDENTS' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#050B14]/80 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs uppercase font-bold text-slate-400">Filter Severity:</span>
              {(['all', 'CRITICAL', 'WARN', 'INFO'] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setIncidentFilter(lvl)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    incidentFilter === lvl
                      ? 'bg-red-600 text-white'
                      : 'bg-black/40 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <button
              onClick={async () => {
                if (!confirm('Clear all recorded security incidents?')) return;
                const token = localStorage.getItem('matrix_token');
                await fetch(`${API_URL}/api/admin/security/logs`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` }
                });
                await fetchDashboardData();
              }}
              className="text-xs text-slate-500 hover:text-red-400 flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Clear Audit Stream</span>
            </button>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#050B14]/80 p-6 space-y-3 shadow-2xl">
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((log) => {
                const isCrit = log.severity === 'CRITICAL';
                const isWarn = log.severity === 'WARN';

                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors ${
                      isCrit
                        ? 'bg-red-950/30 border-red-800/60 text-red-200'
                        : isWarn
                        ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                        : 'bg-black/30 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shrink-0 mt-0.5 border ${
                        isCrit ? 'bg-red-600 text-white border-red-500' :
                        isWarn ? 'bg-amber-600 text-black border-amber-500' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {log.severity}
                      </span>

                      <div>
                        <div className="font-bold tracking-wide text-white">{log.event}</div>
                        {log.details && (
                          <p className="text-[11px] text-slate-400 font-sans mt-0.5">{log.details}</p>
                        )}
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-3">
                          <span>Actor: <strong className="text-slate-300">{log.actor}</strong></span>
                          {log.ip && <span>IP: <strong className="text-cyan-400">{log.ip}</strong></span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 shrink-0 self-end md:self-center">
                      {new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-12 text-center text-slate-500 uppercase tracking-widest text-xs">
                No incidents recorded in audit stream.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. TAB 4: MASTER HARDCODED ADMIN FALLBACK STATUS         */}
      {/* ======================================================== */}
      {activeTab === 'FALLBACK' && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-[#050B14]/80 border-2 border-emerald-600/40 shadow-2xl relative overflow-hidden">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-600/30 text-emerald-400 border border-emerald-500">
                  SYSTEM IMMUNITY: ARMED
                </span>
                <h3 className="text-xl font-black uppercase text-white mt-1">Master Hardcoded Admin Fallback</h3>
                <p className="text-xs text-slate-400 font-sans">Guaranteed Zero-Downtime Administrative Recovery Engine</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed mb-6 max-w-2xl">
              Even when the database connection is held, frozen, corrupted, or completely severed, the platform’s security perimeter automatically recognizes the Hardcoded Master Admin credentials. This guarantees the Master Administrator can <strong>always authenticate, access this security console, and restore normal operations</strong>.
            </p>

            <div className="bg-black/60 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-xl text-xs">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-slate-400">MASTER ADMIN IDENTIFIER:</span>
                <span className="text-white font-bold">{hardcodedStatus?.masterEmail || 'nimnakgls980@gmail.com'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-slate-400">ADMIN IP IMMUNITY:</span>
                <span className="text-amber-400 font-bold">ARMED (ZERO-BLOCK GUARANTEE)</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-slate-400">ACTIVE IMMUNE NODES:</span>
                <span className="text-cyan-400 font-bold">{state.adminImmuneIps?.join(', ') || '127.0.0.1, ::1'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-slate-400">SESSION DURATION:</span>
                <span className="text-emerald-400 font-bold">10-YEAR IMMORTAL VAULT</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-slate-400">DATABASE DEPENDENCY:</span>
                <span className="text-emerald-400 font-bold">INDEPENDENT (IMMUNE)</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-slate-400">CIRCUIT BREAKER STATUS:</span>
                <span className={state.dbConnectionHeld ? "text-amber-400 font-bold" : "text-slate-300 font-bold"}>
                  {state.dbConnectionHeld ? "HOLDING DB // FALLBACK ACTIVE" : "STANDBY (READY)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">CLEARANCE LEVEL:</span>
                <span className="text-red-500 font-bold">LEVEL 5 ROOT MASTER</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
