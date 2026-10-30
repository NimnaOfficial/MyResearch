import express, { Request, Response } from 'express';
import { buildSchema, graphql } from 'graphql';
import prisma from '../config/prisma';
import { securityManager } from '../config/securityState';
import { optionalAuth } from '../middleware/auth.middleware';

const router = express.Router();

// Define Comprehensive Multi-Domain GraphQL Schema
const schema = buildSchema(`
  type Query {
    # Research Archive
    researchArticles(category: String, search: String, sortBy: String, limit: Int): [ResearchArticle!]!
    article(id: String!): ResearchArticle
    categories: [ArticleCategory!]!

    # Project Vault
    projects(publishedOnly: Boolean): [ProjectRelease!]!
    project(id: String!): ProjectRelease

    # Cyber Defense & Security Telemetry
    securityStatus: SecurityStatus!
    visitorIps(status: String, search: String): [VisitorIpRecord!]!
    incidentLogs(limit: Int): [IncidentLog!]!
    systemHealth: SystemHealth!
  }

  type Mutation {
    # Emergency Security Directives
    toggleLockdown(enabled: Boolean!, reason: String): SecurityStatus!
    toggleDbHold(held: Boolean!, reason: String): SecurityStatus!
    setPerimeterRule(ip: String!, status: String!, notes: String): VisitorIpRecord!
    purgeAllSessions: Boolean!
    publishEmergencyBanner(enabled: Boolean!, message: String!, level: String!): SecurityStatus!
  }

  type ResearchArticle {
    id: ID!
    title: String!
    slug: String!
    content: String
    type: String
    published: Boolean!
    createdAt: String!
    categoryName: String
    categorySlug: String
  }

  type ArticleCategory {
    id: ID!
    name: String!
    slug: String!
    count: Int
  }

  type ProjectRelease {
    id: ID!
    projectName: String!
    version: String!
    releaseNotes: String!
    downloadUrl: String
    published: Boolean!
    createdAt: String!
  }

  type SecurityStatus {
    lockdownEnabled: Boolean!
    dbConnectionHeld: Boolean!
    antiDdosAggressive: Boolean!
    ipFilterMode: String!
    defconLevel: Int!
    threatStatus: String!
    emergencyBannerMessage: String
    emergencyBannerEnabled: Boolean!
    emergencyBannerLevel: String
  }

  type VisitorIpRecord {
    ip: String!
    status: String!
    totalHits: Int!
    firstSeen: String!
    lastSeen: String!
    lastUser: String!
    userAgent: String
    country: String
    notes: String
  }

  type IncidentLog {
    id: ID!
    timestamp: String!
    severity: String!
    event: String!
    actor: String!
    details: String
    ip: String
  }

  type SystemHealth {
    status: String!
    uptimeSeconds: Float!
    memoryRssMb: Float!
    defconLevel: Int!
    timestamp: String!
  }
`);

// Root Resolvers implementation
const rootResolvers = {
  // --- Research Archive Queries ---
  researchArticles: async (args: { category?: string; search?: string; sortBy?: string; limit?: number }) => {
    // If DB is held, return safe fallback
    if (securityManager.getState().dbConnectionHeld) {
      return [];
    }

    try {
      const posts = await prisma.post.findMany({
        where: { published: true },
        include: { Category: true },
        orderBy: args.sortBy === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' },
        take: args.limit || 50,
      });

      let results = posts.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        content: p.content,
        type: p.type || 'Research',
        published: p.published,
        createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
        categoryName: p.Category?.name || p.type || 'General',
        categorySlug: p.Category?.slug || 'general',
      }));

      if (args.search) {
        const q = args.search.toLowerCase();
        results = results.filter(r => 
          r.title.toLowerCase().includes(q) || 
          (r.content && r.content.toLowerCase().includes(q)) ||
          r.type.toLowerCase().includes(q)
        );
      }

      if (args.category && args.category !== 'all') {
        const c = args.category.toLowerCase();
        results = results.filter(r => 
          r.categorySlug.toLowerCase().includes(c) || 
          r.categoryName.toLowerCase().includes(c) ||
          r.type.toLowerCase().includes(c)
        );
      }

      return results;
    } catch (err) {
      console.warn('[GRAPHQL] Database query failed (fallback to empty list):', err);
      return [];
    }
  },

  article: async (args: { id: string }) => {
    if (securityManager.getState().dbConnectionHeld) return null;
    try {
      const p = await prisma.post.findUnique({
        where: { id: args.id },
        include: { Category: true },
      });
      if (!p) return null;
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        content: p.content,
        type: p.type || 'Research',
        published: p.published,
        createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
        categoryName: p.Category?.name || 'General',
        categorySlug: p.Category?.slug || 'general',
      };
    } catch {
      return null;
    }
  },

  categories: async () => {
    if (securityManager.getState().dbConnectionHeld) return [];
    try {
      const cats = await prisma.category.findMany({ include: { _count: { select: { posts: true } } } });
      return cats.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: c._count.posts,
      }));
    } catch {
      return [];
    }
  },

  projects: async (args: { publishedOnly?: boolean }) => {
    if (securityManager.getState().dbConnectionHeld) return [];
    try {
      const releases = await prisma.release.findMany({
        where: args.publishedOnly ? { published: true } : undefined,
        orderBy: { publishedAt: 'desc' },
      });
      return releases.map(r => ({
        id: r.id,
        projectName: r.projectName,
        version: r.version,
        releaseNotes: r.releaseNotes,
        downloadUrl: r.downloadUrl,
        published: r.published,
        createdAt: r.publishedAt ? r.publishedAt.toISOString() : new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  },

  project: async (args: { id: string }) => {
    if (securityManager.getState().dbConnectionHeld) return null;
    try {
      const r = await prisma.release.findUnique({ where: { id: args.id } });
      if (!r) return null;
      return {
        id: r.id,
        projectName: r.projectName,
        version: r.version,
        releaseNotes: r.releaseNotes,
        downloadUrl: r.downloadUrl,
        published: r.published,
        createdAt: r.publishedAt ? r.publishedAt.toISOString() : new Date().toISOString(),
      };
    } catch {
      return null;
    }
  },

  // --- Security Telemetry Queries ---
  securityStatus: () => {
    const s = securityManager.getState();
    let defcon = 5;
    if (s.lockdownEnabled) defcon = 1;
    else if (s.dbConnectionHeld) defcon = 2;
    else if (s.antiDdosAggressive || s.ipFilterMode === 'whitelist') defcon = 3;

    return {
      lockdownEnabled: s.lockdownEnabled,
      dbConnectionHeld: s.dbConnectionHeld,
      antiDdosAggressive: s.antiDdosAggressive,
      ipFilterMode: s.ipFilterMode,
      defconLevel: defcon,
      threatStatus: defcon === 1 ? 'DEFCON 1 (LOCKDOWN)' : defcon === 2 ? 'DEFCON 2 (DB HELD)' : defcon === 3 ? 'DEFCON 3 (ELEVATED)' : 'DEFCON 5 (SECURE)',
      emergencyBannerMessage: s.emergencyBanner?.message || '',
      emergencyBannerEnabled: s.emergencyBanner?.enabled || false,
      emergencyBannerLevel: s.emergencyBanner?.level || 'warn',
    };
  },

  visitorIps: (args: { status?: string; search?: string }) => {
    let list = securityManager.getVisitorIps();
    if (args.status && args.status !== 'all') {
      list = list.filter(x => x.status === args.status);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      list = list.filter(x => x.ip.includes(q) || x.lastUser.toLowerCase().includes(q) || x.userAgent.toLowerCase().includes(q));
    }
    return list;
  },

  incidentLogs: (args: { limit?: number }) => {
    const logs = securityManager.getIncidentLogs();
    return args.limit ? logs.slice(0, args.limit) : logs;
  },

  systemHealth: () => {
    const s = securityManager.getState();
    const mem = process.memoryUsage();
    return {
      status: s.lockdownEnabled ? 'LOCKED_DOWN' : s.dbConnectionHeld ? 'DB_HELD' : 'HEALTHY',
      uptimeSeconds: process.uptime(),
      memoryRssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
      defconLevel: s.lockdownEnabled ? 1 : s.dbConnectionHeld ? 2 : 5,
      timestamp: new Date().toISOString(),
    };
  },

  // --- Security Directive Mutations ---
  toggleLockdown: (args: { enabled: boolean; reason?: string }, context: any) => {
    if (context.user?.role !== 'admin') {
      throw new Error('ACCESS_DENIED: Master Admin clearance required for GraphQL Lockdown Mutation.');
    }
    const actor = context.user?.username || 'GraphQL Admin';
    securityManager.setLockdown(args.enabled, actor);
    return rootResolvers.securityStatus();
  },

  toggleDbHold: (args: { held: boolean; reason?: string }, context: any) => {
    if (context.user?.role !== 'admin') {
      throw new Error('ACCESS_DENIED: Master Admin clearance required for GraphQL DB Hold Mutation.');
    }
    const actor = context.user?.username || 'GraphQL Admin';
    securityManager.setDbConnectionHeld(args.held, actor);
    return rootResolvers.securityStatus();
  },

  setPerimeterRule: (args: { ip: string; status: 'allowed' | 'blacklisted' | 'whitelisted'; notes?: string }, context: any) => {
    if (context.user?.role !== 'admin') {
      throw new Error('ACCESS_DENIED: Admin clearance required to set IP rules.');
    }
    const actor = context.user?.username || 'GraphQL Admin';
    return securityManager.setIpStatus(args.ip, args.status, args.notes, actor);
  },

  purgeAllSessions: (_args: any, context: any) => {
    if (context.user?.role !== 'admin') {
      throw new Error('ACCESS_DENIED: Admin clearance required to purge sessions.');
    }
    const actor = context.user?.username || 'GraphQL Admin';
    securityManager.purgeAllUserSessions(actor);
    return true;
  },

  publishEmergencyBanner: (args: { enabled: boolean; message: string; level: 'info' | 'warn' | 'critical' }, context: any) => {
    if (context.user?.role !== 'admin') {
      throw new Error('ACCESS_DENIED: Admin clearance required to publish emergency banner.');
    }
    const actor = context.user?.username || 'GraphQL Admin';
    securityManager.setEmergencyBanner({ enabled: args.enabled, message: args.message, level: args.level }, actor);
    return rootResolvers.securityStatus();
  },
};

// Mount GraphQL Controller
router.use('/', optionalAuth, async (req: Request, res: Response) => {
  const query = req.body?.query || req.query?.query;
  const variables = req.body?.variables || (req.query?.variables ? JSON.parse(String(req.query.variables)) : undefined);
  const operationName = req.body?.operationName || req.query?.operationName;

  if (!query) {
    return res.status(400).json({
      errors: [{ message: 'GraphQL Protocol Error: Missing query string in payload.' }],
    });
  }

  try {
    const result = await graphql({
      schema,
      source: String(query),
      rootValue: rootResolvers,
      contextValue: { user: req.user, ip: req.ip },
      variableValues: variables,
      operationName: operationName ? String(operationName) : undefined,
    });

    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({ errors: [{ message: err.message || 'GraphQL Execution Engine Exception.' }] });
  }
});

export default router;
