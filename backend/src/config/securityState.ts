import fs from 'fs';
import path from 'path';

export interface VisitorIpRecord {
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
}

export interface SecurityIncidentLog {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARN' | 'INFO';
  event: string;
  ip?: string;
  actor: string;
  details?: string;
}

export interface SecuritySystemState {
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
  sessionRevocationTimestamp: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'security_state.json');
const IP_FILE = path.join(DATA_DIR, 'visitor_ips.json');
const LOGS_FILE = path.join(DATA_DIR, 'security_incidents.json');

// Master Hardcoded Admin Credentials Fallback (Immune to DB outages)
export const MASTER_ADMIN_CREDENTIALS = {
  id: 'master-root-admin-001',
  email: (process.env.ADMIN_EMAIL || 'nimnakgls980@gmail.com').trim().toLowerCase(),
  password: process.env.ADMIN_PASSWORD || 'Admin@Nima2026!',
  username: 'root_master',
  fullName: 'Master Administrator (Root Override)',
  role: 'admin',
};

class SecurityManager {
  private state: SecuritySystemState = {
    lockdownEnabled: false,
    dbConnectionHeld: false,
    antiDdosAggressive: false,
    ipFilterMode: 'blacklist',
    emergencyBanner: {
      enabled: false,
      message: 'System is operating under heightened telemetry security protocols.',
      level: 'warn',
    },
    blacklistedIps: [],
    whitelistedIps: ['127.0.0.1', '::1', 'localhost'],
    sessionRevocationTimestamp: 0,
  };

  private visitorIps: Map<string, VisitorIpRecord> = new Map();
  private incidentLogs: SecurityIncidentLog[] = [];

  constructor() {
    this.ensureDataDirectory();
    this.loadState();
    this.loadVisitorIps();
    this.loadIncidentLogs();
  }

  private ensureDataDirectory() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      console.error('[SECURITY] Failed to initialize data directory:', err);
    }
  }

  private loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.state = { ...this.state, ...parsed };
      }
    } catch (e) {
      console.warn('[SECURITY] Could not read security state file, using defaults');
    }
  }

  private saveState() {
    try {
      this.ensureDataDirectory();
      fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (e) {
      console.error('[SECURITY] Failed to persist security state:', e);
    }
  }

  private loadVisitorIps() {
    try {
      if (fs.existsSync(IP_FILE)) {
        const raw = fs.readFileSync(IP_FILE, 'utf8');
        const list: VisitorIpRecord[] = JSON.parse(raw);
        for (const item of list) {
          this.visitorIps.set(item.ip, item);
        }
      }
    } catch (e) {
      console.warn('[SECURITY] Could not load visitor IPs from file');
    }
  }

  private saveVisitorIps() {
    try {
      this.ensureDataDirectory();
      const list = Array.from(this.visitorIps.values());
      fs.writeFileSync(IP_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      console.error('[SECURITY] Failed to persist visitor IPs:', e);
    }
  }

  private loadIncidentLogs() {
    try {
      if (fs.existsSync(LOGS_FILE)) {
        const raw = fs.readFileSync(LOGS_FILE, 'utf8');
        this.incidentLogs = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[SECURITY] Could not load security incidents log');
    }
  }

  private saveIncidentLogs() {
    try {
      this.ensureDataDirectory();
      // Keep most recent 500 logs
      if (this.incidentLogs.length > 500) {
        this.incidentLogs = this.incidentLogs.slice(0, 500);
      }
      fs.writeFileSync(LOGS_FILE, JSON.stringify(this.incidentLogs, null, 2), 'utf8');
    } catch (e) {
      console.error('[SECURITY] Failed to persist security incidents:', e);
    }
  }

  public logIncident(severity: 'CRITICAL' | 'WARN' | 'INFO', event: string, actor: string, details?: string, ip?: string) {
    const entry: SecurityIncidentLog = {
      id: `INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      severity,
      event,
      actor,
      details,
      ip,
    };
    this.incidentLogs.unshift(entry);
    this.saveIncidentLogs();
  }

  // --- State Getters & Mutators ---
  public getState(): SecuritySystemState {
    return { ...this.state };
  }

  public setLockdown(enabled: boolean, actor: string = 'Master Admin'): boolean {
    this.state.lockdownEnabled = enabled;
    this.saveState();
    this.logIncident(
      enabled ? 'CRITICAL' : 'INFO',
      enabled ? 'DEFCON 1: SYSTEM LOCKDOWN ENGAGED' : 'DEFCON 5: SYSTEM LOCKDOWN DISARMED',
      actor,
      enabled ? 'All public and non-admin routes have been sealed.' : 'Platform restored to public operations.'
    );
    return this.state.lockdownEnabled;
  }

  public setDbConnectionHeld(held: boolean, actor: string = 'Master Admin'): boolean {
    this.state.dbConnectionHeld = held;
    this.saveState();
    this.logIncident(
      held ? 'CRITICAL' : 'INFO',
      held ? 'DATABASE CIRCUIT BREAKER: CONNECTION HELD' : 'DATABASE CIRCUIT BREAKER: CONNECTION RESTORED',
      actor,
      held ? 'Database transactions suspended. Admin authentication operating via Hardcoded Master Credentials.' : 'Normal database querying resumed.'
    );
    return this.state.dbConnectionHeld;
  }

  public setAntiDdos(aggressive: boolean, actor: string = 'Master Admin'): boolean {
    this.state.antiDdosAggressive = aggressive;
    this.saveState();
    this.logIncident(
      aggressive ? 'WARN' : 'INFO',
      aggressive ? 'EXTREME ANTI-DDOS AGGRESSION ACTIVATED' : 'ANTI-DDOS STANDBY (NORMAL)',
      actor,
      aggressive ? 'Rate limiters set to maximum defense profile.' : 'Standard traffic tolerance restored.'
    );
    return this.state.antiDdosAggressive;
  }

  public setIpFilterMode(mode: 'blacklist' | 'whitelist', actor: string = 'Master Admin'): string {
    this.state.ipFilterMode = mode;
    this.saveState();
    this.logIncident('WARN', `IP FILTERING MODE SWITCHED TO: ${mode.toUpperCase()}`, actor);
    return this.state.ipFilterMode;
  }

  public setEmergencyBanner(banner: { enabled: boolean; message: string; level: 'info' | 'warn' | 'critical' }, actor: string = 'Master Admin') {
    this.state.emergencyBanner = banner;
    this.saveState();
    this.logIncident('INFO', `EMERGENCY BANNER ${banner.enabled ? 'PUBLISHED' : 'DISABLED'}`, actor, banner.message);
    return this.state.emergencyBanner;
  }

  public purgeAllUserSessions(actor: string = 'Master Admin'): number {
    this.state.sessionRevocationTimestamp = Date.now();
    this.saveState();
    this.logIncident('CRITICAL', 'GLOBAL SESSION PURGE EXECUTED', actor, 'All non-admin JWT credentials revoked immediately.');
    return this.state.sessionRevocationTimestamp;
  }

  // --- Visitor IP Management ---
  public recordTraffic(rawIp: string, userAgent: string = 'UNKNOWN', path: string = '/', userIdentifier: string = 'GUEST'): { allowed: boolean; reason?: string } {
    const ip = this.cleanIp(rawIp);
    const now = new Date().toISOString();

    let record = this.visitorIps.get(ip);
    if (!record) {
      // Auto-assign status based on blacklist/whitelist
      let status: 'allowed' | 'blacklisted' | 'whitelisted' = 'allowed';
      if (this.state.blacklistedIps.includes(ip)) {
        status = 'blacklisted';
      } else if (this.state.whitelistedIps.includes(ip)) {
        status = 'whitelisted';
      }

      record = {
        ip,
        userAgent: userAgent.substring(0, 150),
        firstSeen: now,
        lastSeen: now,
        totalHits: 1,
        status,
        lastPath: path,
        lastUser: userIdentifier,
        country: this.inferGeo(ip),
      };
      this.visitorIps.set(ip, record);
    } else {
      record.lastSeen = now;
      record.totalHits += 1;
      record.lastPath = path;
      if (userAgent && userAgent !== 'UNKNOWN') record.userAgent = userAgent.substring(0, 150);
      if (userIdentifier !== 'GUEST') record.lastUser = userIdentifier;
    }

    // Periodically persist IPs (e.g. every 10 hits or new IP)
    if (record.totalHits % 10 === 0 || record.totalHits === 1) {
      this.saveVisitorIps();
    }

    // Check filter rules
    if (this.state.ipFilterMode === 'whitelist') {
      const isWhitelisted = record.status === 'whitelisted' || this.state.whitelistedIps.includes(ip);
      if (!isWhitelisted) {
        return { allowed: false, reason: 'IP_NOT_ON_WHITELIST' };
      }
    } else {
      const isBlacklisted = record.status === 'blacklisted' || this.state.blacklistedIps.includes(ip);
      if (isBlacklisted) {
        return { allowed: false, reason: 'IP_BLACKLISTED' };
      }
    }

    return { allowed: true };
  }

  public getVisitorIps(): VisitorIpRecord[] {
    return Array.from(this.visitorIps.values()).sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
  }

  public setIpStatus(rawIp: string, status: 'allowed' | 'blacklisted' | 'whitelisted', notes?: string, actor: string = 'Master Admin') {
    const ip = this.cleanIp(rawIp);
    let record = this.visitorIps.get(ip);
    const now = new Date().toISOString();

    if (!record) {
      record = {
        ip,
        userAgent: 'Manual Entry / Admin Rule',
        firstSeen: now,
        lastSeen: now,
        totalHits: 0,
        status,
        lastPath: '/',
        lastUser: 'MANUAL',
        notes: notes || '',
        country: this.inferGeo(ip),
      };
      this.visitorIps.set(ip, record);
    } else {
      record.status = status;
      if (notes) record.notes = notes;
    }

    // Update blacklist / whitelist state arrays
    if (status === 'blacklisted') {
      if (!this.state.blacklistedIps.includes(ip)) this.state.blacklistedIps.push(ip);
      this.state.whitelistedIps = this.state.whitelistedIps.filter(x => x !== ip);
      this.logIncident('CRITICAL', `IP BLACKLISTED: ${ip}`, actor, notes || 'Isolated by administrator.');
    } else if (status === 'whitelisted') {
      if (!this.state.whitelistedIps.includes(ip)) this.state.whitelistedIps.push(ip);
      this.state.blacklistedIps = this.state.blacklistedIps.filter(x => x !== ip);
      this.logIncident('INFO', `IP WHITELISTED: ${ip}`, actor, notes || 'Granted perimeter bypass.');
    } else {
      this.state.blacklistedIps = this.state.blacklistedIps.filter(x => x !== ip);
      this.state.whitelistedIps = this.state.whitelistedIps.filter(x => x !== ip);
      this.logIncident('INFO', `IP RESTORED TO NEUTRAL: ${ip}`, actor);
    }

    this.saveState();
    this.saveVisitorIps();
    return record;
  }

  public deleteIpRecord(rawIp: string, actor: string = 'Master Admin'): boolean {
    const ip = this.cleanIp(rawIp);
    const deleted = this.visitorIps.delete(ip);
    this.state.blacklistedIps = this.state.blacklistedIps.filter(x => x !== ip);
    this.state.whitelistedIps = this.state.whitelistedIps.filter(x => x !== ip);
    this.saveState();
    this.saveVisitorIps();
    this.logIncident('INFO', `IP RECORD PURGED: ${ip}`, actor);
    return deleted;
  }

  public getIncidentLogs(): SecurityIncidentLog[] {
    return this.incidentLogs;
  }

  public clearIncidentLogs(actor: string = 'Master Admin') {
    this.incidentLogs = [];
    this.saveIncidentLogs();
    this.logIncident('WARN', 'INCIDENT AUDIT LOGS PURGED', actor);
  }

  private cleanIp(ip: string): string {
    if (!ip) return '127.0.0.1';
    // Remove IPv6 prefix if mapped IPv4 (::ffff:127.0.0.1)
    if (ip.startsWith('::ffff:')) {
      return ip.substring(7);
    }
    return ip.trim();
  }

  private inferGeo(ip: string): string {
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
      return 'Localhost / Private Gateway';
    }
    return 'Global Public Node';
  }
}

export const securityManager = new SecurityManager();
