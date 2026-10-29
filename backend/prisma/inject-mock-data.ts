import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma';

async function injectMasterMockData() {
  console.log('⚡ [CSx MATRIX DATA INJECTOR] Initiating comprehensive database hydration...');

  // ==========================================
  // 1. MASTER ADMIN & TEST IDENTITIES
  // ==========================================
  console.log('👤 [1/7] Injecting Master Admin and Operator Identities...');
  
  const adminPasswordHash = await bcrypt.hash('Admin@Nima2026!', 12);
  const userPasswordHash = await bcrypt.hash('UserSecurePass123!', 12);

  // Master Admin
  const admin = await prisma.user.upsert({
    where: { email: 'nimnakgls980@gmail.com' },
    update: {
      role: 'admin',
      passwordHash: adminPasswordHash,
      isVerified: true,
      status: 'ACTIVE',
      fullName: 'Nima (Master Architect)',
      username: 'nima_core',
      phone: '+94 77 123 4567',
      age: '24',
      profilePic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600',
    },
    create: {
      username: 'nima_core',
      fullName: 'Nima (Master Architect)',
      email: 'nimnakgls980@gmail.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isVerified: true,
      status: 'ACTIVE',
      phone: '+94 77 123 4567',
      age: '24',
      profilePic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600',
    },
  });

  // Operator 1: Sarah Chen (Active verified user)
  const user1 = await prisma.user.upsert({
    where: { email: 'sarah.chen@matrix.local' },
    update: { isVerified: true, role: 'user', status: 'ACTIVE' },
    create: {
      username: '98C4F1A02E',
      fullName: 'Sarah Chen',
      email: 'sarah.chen@matrix.local',
      passwordHash: userPasswordHash,
      role: 'user',
      isVerified: true,
      status: 'ACTIVE',
      phone: '+1 555-0192',
      age: '28',
      profilePic: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600',
    },
  });

  // Operator 2: Marcus Vance (Active verified user)
  const user2 = await prisma.user.upsert({
    where: { email: 'marcus.vance@matrix.local' },
    update: { isVerified: true, role: 'user', status: 'ACTIVE' },
    create: {
      username: '4B71D829A3',
      fullName: 'Marcus Vance',
      email: 'marcus.vance@matrix.local',
      passwordHash: userPasswordHash,
      role: 'user',
      isVerified: true,
      status: 'ACTIVE',
      phone: '+1 555-0847',
      age: '32',
      profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600',
    },
  });

  // Operator 3: Elena Rostova (Active verified user)
  const user3 = await prisma.user.upsert({
    where: { email: 'elena.rostova@matrix.local' },
    update: { isVerified: true, role: 'user', status: 'ACTIVE' },
    create: {
      username: 'E350AC791F',
      fullName: 'Elena Rostova',
      email: 'elena.rostova@matrix.local',
      passwordHash: userPasswordHash,
      role: 'user',
      isVerified: true,
      status: 'ACTIVE',
      phone: '+1 555-0319',
      age: '26',
      profilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600',
    },
  });

  // Operator 4: Alex Hunt (Unverified Cadet)
  await prisma.user.upsert({
    where: { email: 'alex.hunt@matrix.local' },
    update: { isVerified: false, role: 'user', status: 'ACTIVE' },
    create: {
      username: '11DF8B9230',
      fullName: 'Alex Hunt (Unverified)',
      email: 'alex.hunt@matrix.local',
      passwordHash: userPasswordHash,
      role: 'user',
      isVerified: false,
      status: 'ACTIVE',
      phone: '+1 555-0771',
      age: '21',
    },
  });

  // Operator 5: Shadow Agent (Suspended Account)
  await prisma.user.upsert({
    where: { email: 'shadow.agent@matrix.local' },
    update: { isVerified: true, status: 'SUSPENDED' },
    create: {
      username: 'FF992200AA',
      fullName: 'Suspended Node Agent',
      email: 'shadow.agent@matrix.local',
      passwordHash: userPasswordHash,
      role: 'user',
      isVerified: true,
      status: 'SUSPENDED',
      phone: '+1 555-0000',
      age: '35',
    },
  });

  // ==========================================
  // 2. RESEARCH CATEGORIES
  // ==========================================
  console.log('🏷️ [2/7] Injecting Research Matrix Categories...');
  
  const catAI = await prisma.category.upsert({
    where: { slug: 'ai-neural' },
    update: { name: 'AI & Neural Systems' },
    create: { name: 'AI & Neural Systems', slug: 'ai-neural' },
  });

  const catCrypto = await prisma.category.upsert({
    where: { slug: 'quantum-crypto' },
    update: { name: 'Quantum Cryptography' },
    create: { name: 'Quantum Cryptography', slug: 'quantum-crypto' },
  });

  const catSpatial = await prisma.category.upsert({
    where: { slug: 'spatial-webgl' },
    update: { name: 'WebGL & 3D Spatial Systems' },
    create: { name: 'WebGL & 3D Spatial Systems', slug: 'spatial-webgl' },
  });

  const catCloud = await prisma.category.upsert({
    where: { slug: 'cloud-edge' },
    update: { name: 'Distributed Cloud & Edge' },
    create: { name: 'Distributed Cloud & Edge', slug: 'cloud-edge' },
  });

  // ==========================================
  // 3. RESEARCH POSTS (PUBLISHED & UPCOMING)
  // ==========================================
  console.log('📑 [3/7] Injecting Research Papers & DataCore Articles...');

  const post1 = await prisma.post.upsert({
    where: { slug: 'sub-millisecond-neural-inference-webgpu' },
    update: { published: true },
    create: {
      title: 'Sub-Millisecond Neural Inference via WebAssembly & WebGPU',
      slug: 'sub-millisecond-neural-inference-webgpu',
      type: 'AI Research',
      published: true,
      heroImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200',
      content: `## Executive Summary
This paper outlines an architectural breakthrough achieving sub-millisecond tensor evaluations directly in browser runtimes. By compiling custom Rust kernels to WebAssembly targeting WebGPU compute shaders, matrix multiplications are executed directly on the client's discrete hardware.

### Key Breakthroughs
- **Zero-Copy Tensor Buffers**: Direct memory mapping between JavaScript Float32 arrays and GPU compute pipeline storage.
- **Hardware Acceleration**: Automatic fallback across Metal, DirectX 12, and Vulkan backends.
- **Latency Benchmark**: 0.42ms average inference time on FP16 weights.`,
      advancedData: JSON.stringify({
        readingTime: '5 min read',
        authorName: 'Nima',
        tags: ['WebGPU', 'WebAssembly', 'Rust', 'Deep Learning'],
        views: 1840,
        stars: 142,
      }),
      categoryId: catAI.id,
      authorId: admin.id,
    },
  });

  const post2 = await prisma.post.upsert({
    where: { slug: 'zk-proofs-quantum-resistant-decryption' },
    update: { published: true },
    create: {
      title: 'Zero-Knowledge Proofs for Quantum-Resistant Session Decryption',
      slug: 'zk-proofs-quantum-resistant-decryption',
      type: 'Security Logs',
      published: true,
      heroImg: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200',
      content: `## Abstract
As quantum supremacy approaches practical cryptanalysis thresholds, traditional RSA and ECC key exchanges face critical vulnerability. This protocol introduces non-interactive zero-knowledge proofs (zk-SNARKs) based on module learning with errors (M-LWE).

### Protocol Architecture
1. **Lattice Formulation**: High-dimensional lattice polynomials generate ephemeral blinding vectors.
2. **Zero-Knowledge Challenge**: Client generates proof without disclosing private session credentials.
3. **Instant Verification**: Gatekeeper verifies in O(1) arithmetic operations.`,
      advancedData: JSON.stringify({
        readingTime: '8 min read',
        authorName: 'Nima',
        tags: ['Zero Knowledge', 'Cryptography', 'Post-Quantum', 'Security'],
        views: 2950,
        stars: 231,
      }),
      categoryId: catCrypto.id,
      authorId: admin.id,
    },
  });

  const post3 = await prisma.post.upsert({
    where: { slug: 'reactive-geometry-mesh-instancing-threejs' },
    update: { published: true },
    create: {
      title: 'Reactive Geometry & Memory-Efficient Mesh Instancing in Three.js',
      slug: 'reactive-geometry-mesh-instancing-threejs',
      type: 'Documentation',
      published: true,
      heroImg: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1200',
      content: `## Overview
Rendering complex spatial geometry in WebGL often hits draw-call bottlenecks. By converting individual mesh objects into InstancedMesh structures and modulating their matrix transformations via vertex shaders, CSx CORE maintains rock-solid 60 FPS under 50,000 active nodes.

### Implementation Checklist
- Single draw-call geometry bundling
- Custom GLSL matrix rotation shaders
- Frustum culling and spatial octree optimization`,
      advancedData: JSON.stringify({
        readingTime: '6 min read',
        authorName: 'Nima',
        tags: ['Three.js', 'WebGL', 'React Three Fiber', 'GLSL'],
        views: 3120,
        stars: 388,
      }),
      categoryId: catSpatial.id,
      authorId: admin.id,
    },
  });

  const post4 = await prisma.post.upsert({
    where: { slug: 'edge-state-synchronization-libsql' },
    update: { published: true },
    create: {
      title: 'Distributed Edge Synchronization: LibSQL WAL Replication Matrix',
      slug: 'edge-state-synchronization-libsql',
      type: 'Databases',
      published: true,
      heroImg: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200',
      content: `## Architecture Breakdown
Moving application databases closer to the user requires low-latency read replication. This architectural survey evaluates Turso libSQL embedded SQLite replicas with automatic WAL streaming to AWS edge locations.`,
      advancedData: JSON.stringify({
        readingTime: '7 min read',
        authorName: 'Nima',
        tags: ['Turso', 'libSQL', 'SQLite', 'Edge Architecture'],
        views: 2410,
        stars: 195,
      }),
      categoryId: catCloud.id,
      authorId: admin.id,
    },
  });

  // Upcoming Draft Posts (Shown in 3D orbit on /research)
  await prisma.post.upsert({
    where: { slug: 'holographic-neural-transceiver-v4' },
    update: { published: false },
    create: {
      title: 'Holographic Neural Transceiver Protocols (CSx V4)',
      slug: 'holographic-neural-transceiver-v4',
      type: 'AI Research',
      published: false,
      heroImg: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200',
      content: 'Under active R&D. Investigating multi-agent spatial coordination lattices.',
      categoryId: catAI.id,
      authorId: admin.id,
    },
  });

  await prisma.post.upsert({
    where: { slug: 'autonomous-swarm-consensus-arrays' },
    update: { published: false },
    create: {
      title: 'Autonomous Swarm Consensus in High-Latency Topologies',
      slug: 'autonomous-swarm-consensus-arrays',
      type: 'Security Logs',
      published: false,
      heroImg: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200',
      content: 'Investigating Byzantine fault tolerance in decentralized mobile sensor meshes.',
      categoryId: catCrypto.id,
      authorId: admin.id,
    },
  });

  // ==========================================
  // 4. ARCHITECTURE VAULT & EXPLORE RELEASES
  // ==========================================
  console.log('🚀 [4/7] Injecting Architecture Vault & Spatial Releases...');

  const rel1 = await prisma.release.create({
    data: {
      projectName: 'AutoHub Premium Web Platform',
      version: 'v2.4.0',
      releaseNotes: 'AutoHub is an enterprise auto parts e-commerce ecosystem built with high-performance controller logic. Features real-time inventory tracking, multi-tier user sessions, and Stripe live checkout integration.',
      downloadUrl: 'https://github.com/nimnaofficial/autohub/archive/refs/heads/main.zip',
      heroImg: 'from-[#f97316]/30 to-black',
      published: true,
      advancedData: JSON.stringify({
        architecture: 'Strict MVC design utilizing PHP 8.2 backend, paired with an optimized relational schema and dynamic Tailwind CSS frontend geometry.',
        techStack: ['PHP 8.2', 'MySQL', 'Stripe API', 'TailwindCSS', 'JavaScript'],
        leadDev: 'Nima',
        githubUrl: 'https://github.com/nimnaofficial/autohub',
        liveUrl: 'https://autohub.example.com',
        explorerRating: '4.9',
        explorerViews: '18.4k',
        routing: { targetExplorer: true, targetVault: true, targetUpcoming: false, targetPrototypes: true },
      }),
    },
  });

  const rel2 = await prisma.release.create({
    data: {
      projectName: 'CSx Quantum Spatial Matrix Engine',
      version: 'v3.0.0',
      releaseNotes: 'Next-generation 3D spatial portfolio and command terminal powered by WebGL and React Three Fiber. Integrated with Turso Cloud libSQL DataCore for instantaneous edge hydration.',
      downloadUrl: 'https://github.com/nimnaofficial/csx-core/archive/refs/heads/main.zip',
      heroImg: 'from-cyan-900/40 to-black',
      published: true,
      advancedData: JSON.stringify({
        architecture: 'Full-stack Next.js 14 App Router paired with Express Node.js and Turso libSQL Cloud DataCore.',
        techStack: ['Next.js 14', 'React Three Fiber', 'Turso libSQL', 'TailwindCSS', 'Framer Motion'],
        leadDev: 'Nima',
        githubUrl: 'https://github.com/nimnaofficial/csx-core',
        liveUrl: 'http://localhost:3000',
        explorerRating: '5.0',
        explorerViews: '24.9k',
        routing: { targetExplorer: true, targetVault: true, targetUpcoming: false, targetPrototypes: true },
      }),
    },
  });

  const rel3 = await prisma.release.create({
    data: {
      projectName: 'CyberShield Zero-Trust Gateway',
      version: 'v1.8.2',
      releaseNotes: 'Kernel-level high-throughput proxy intercepting unauthorized network egress. Implements eBPF filters and microsegmentation policies for enterprise clusters.',
      heroImg: 'from-red-900/40 to-black',
      published: true,
      advancedData: JSON.stringify({
        architecture: 'Engineered in Rust with eBPF Linux kernel hooks for zero-overhead packet filtering.',
        techStack: ['Rust', 'eBPF', 'gRPC', 'Docker', 'Linux Kernel'],
        leadDev: 'Nima',
        githubUrl: 'https://github.com/nimnaofficial/cybershield',
        liveUrl: 'https://cybershield.example.com',
        explorerRating: '4.8',
        explorerViews: '12.1k',
        routing: { targetExplorer: true, targetVault: true, targetUpcoming: false, targetPrototypes: false },
      }),
    },
  });

  const rel4 = await prisma.release.create({
    data: {
      projectName: 'Solaria Decentralized Asset Vault',
      version: 'v2.1.0',
      releaseNotes: 'Non-custodial cryptographic vault for ERC-20 staking, multi-signature governance, and automated liquidity yield routing.',
      heroImg: 'from-amber-900/40 to-black',
      published: true,
      advancedData: JSON.stringify({
        architecture: 'Solidity smart contracts audited and deployed on EVM, connected via Ethers.js and React frontend.',
        techStack: ['Solidity', 'Ethers.js', 'Hardhat', 'React', 'IPFS'],
        leadDev: 'Nima',
        githubUrl: 'https://github.com/nimnaofficial/solaria-vault',
        liveUrl: 'https://solaria.example.com',
        explorerRating: '4.9',
        explorerViews: '15.7k',
        routing: { targetExplorer: true, targetVault: true, targetUpcoming: false, targetPrototypes: true },
      }),
    },
  });

  // Upcoming Prototype Releases (VR Cylinder targets)
  await prisma.release.create({
    data: {
      projectName: 'AeroSim Real-Time Flight Telemetry Engine',
      version: 'v0.9-BETA',
      releaseNotes: 'Physics simulation engine processing 6-DOF aerodynamic vectors at 120 FPS via WebAssembly compilation.',
      heroImg: 'from-blue-900/40 to-black',
      published: false, // DRAFT
      advancedData: JSON.stringify({
        techStack: ['WebAssembly', 'C++', 'WebGL2', 'WebSocket', 'GLSL'],
        leadDev: 'Nima',
        routing: { targetExplorer: false, targetVault: false, targetUpcoming: true, targetPrototypes: true },
      }),
    },
  });

  await prisma.release.create({
    data: {
      projectName: 'NeuralMesh Distributed Training Protocol',
      version: 'v0.5-ALPHA',
      releaseNotes: 'Decentralized compute scheduler allocating model gradient synchronization across heterogeneous GPU clusters.',
      heroImg: 'from-purple-900/40 to-black',
      published: false, // DRAFT
      advancedData: JSON.stringify({
        techStack: ['Python', 'PyTorch', 'CUDA', 'Ray Distributed', 'gRPC'],
        leadDev: 'Nima',
        routing: { targetExplorer: false, targetVault: false, targetUpcoming: true, targetPrototypes: false },
      }),
    },
  });

  // ==========================================
  // 5. COMMUNITY FEEDBACK
  // ==========================================
  console.log('💬 [5/7] Injecting Community Feedback Submissions...');

  await prisma.feedback.createMany({
    data: [
      {
        userId: user1.id,
        rating: 5,
        category: 'UI/UX Geometry',
        priority: 'Normal',
        tags: 'WebGL, 3D, Performance',
        recommend: true,
        message: 'The 3D interactive cylinder in the Explore section is breathtaking! Smooth 60 FPS transitions, crystal-clear typography, and buttery momentum scrolling on desktop.',
      },
      {
        userId: user2.id,
        rating: 5,
        category: 'API Performance',
        priority: 'Normal',
        tags: 'Turso, Edge, Latency',
        recommend: true,
        message: 'Sub-50ms API response times across all endpoints. The migration to Turso libSQL cloud edge database reduced telemetry latency dramatically.',
      },
      {
        userId: user3.id,
        rating: 4,
        category: 'Feature Request',
        priority: 'Medium',
        tags: 'Dashboard, Themes, UI',
        recommend: true,
        message: 'Would love to see custom cyberpunk neon theme presets inside the user dashboard settings. Otherwise the aesthetic is absolutely unmatched!',
      },
      {
        userId: user1.id,
        rating: 5,
        category: 'Security Audit',
        priority: 'Critical',
        tags: 'Security, JWT, RoleAuth',
        recommend: true,
        message: 'The Level 5 cipher gate is impenetrable. Verified JWT purpose claim separation and strict admin role restrictions across all sensitive write routes.',
      },
      {
        rating: 5,
        category: 'General Review',
        priority: 'Normal',
        tags: 'Telemetry, Frontend, Three.js',
        recommend: true,
        message: 'Incredible engineering showcase. The seamless fusion of high-throughput backend APIs with cinematic 3D visualizers sets a new bar for modern software portfolios.',
      },
    ],
  });

  // ==========================================
  // 6. SYSTEM AUDIT & ACTIVITY LOGS
  // ==========================================
  console.log('📡 [6/7] Injecting System Audit & Telemetry Logs...');

  const sampleLogs = [
    { action: 'AUTH_ADMIN_SESSION_INITIALIZED', status: 'OK', ip: '127.0.0.1' },
    { action: 'SECURITY_FIREWALL_DESKTOP_VERIFIED', status: 'OK', ip: '127.0.0.1' },
    { action: 'PROJECT_RELEASE_PUBLISHED: AutoHub v2.4.0', status: 'OK', ip: '127.0.0.1' },
    { action: 'MOBILE_VIEWPORT_SEVERED: Screen width < 1024px', status: 'WARN', ip: '198.51.100.42' },
    { action: 'DATABASE_SCHEMA_SYNCHRONIZED_TURSO', status: 'OK', ip: '127.0.0.1' },
    { action: 'CIPHER_CHALLENGE_SOLVED: Level-5 Access Granted', status: 'OK', ip: '127.0.0.1' },
    { action: 'RATE_LIMIT_CHECK_PASSED', status: 'OK', ip: '127.0.0.1' },
    { action: 'SUSPICIOUS_UNAUTHORIZED_PROBE: Blocked', status: 'ERROR', ip: '203.0.113.88' },
    { action: 'USER_ACCOUNT_VERIFIED: sarah.chen@matrix.local', status: 'OK', ip: '127.0.0.1' },
    { action: 'MEDIA_ASSETS_PIPELINE_MOUNTED', status: 'OK', ip: '127.0.0.1' },
    { action: 'TELEMETRY_RADAR_STREAM_ACTIVE', status: 'OK', ip: '127.0.0.1' },
  ];

  for (const log of sampleLogs) {
    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: log.action,
        status: log.status,
        ip: log.ip,
      },
    });
  }

  // ==========================================
  // 7. USER BOOKMARKS & SAVED VAULT CORES
  // ==========================================
  console.log('💾 [7/7] Connecting Saved Projects & Bookmarks to Admin Dashboard...');

  try {
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        savedPosts: {
          connect: [{ id: post1.id }, { id: post2.id }],
        },
        savedReleases: {
          connect: [{ id: rel1.id }, { id: rel2.id }, { id: rel4.id }],
        },
      },
    });
  } catch (err: any) {
    console.warn('[WARNING] Saved relations connection:', err?.message || err);
  }

  console.log('\n=============================================');
  console.log('✅ ALL MOCK DATA SUCCESSFULLY INJECTED!');
  console.log('=============================================');
  console.log('Master Admin Credentials:');
  console.log('  Email    : nimnakgls980@gmail.com');
  console.log('  Password : Admin@Nima2026!');
  console.log('  Cipher   : 190436 (type on /auth to unlock admin door)');
  console.log('  Portal   : http://localhost:3000/auth/admin');
  console.log('=============================================\n');
}

injectMasterMockData()
  .catch((e) => {
    console.error('❌ Injection Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
