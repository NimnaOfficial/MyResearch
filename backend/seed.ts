import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initiating Matrix Data Hydration...');

  // ==========================================
  // 0. SYSTEM CLEANUP (Prevents Duplicate Errors)
  // ==========================================
  await prisma.post.deleteMany({});
  await prisma.release.deleteMany({});
  console.log('🧹 Old data cores cleared...');

  // ==========================================
  // 1. CREATE GHOST AUTHOR
  // ==========================================
  const ghostUser = await prisma.user.upsert({
    where: { email: 'ghost@matrix.com' },
    update: {},
    create: {
      username: 'SYS_ARCHITECT',
      email: 'ghost@matrix.com',
      passwordHash: 'encrypted_null',
      isVerified: true,
    },
  });

  // ==========================================
  // 2. INJECT RESEARCH DATA
  // ==========================================
  await prisma.post.create({
    data: {
      title: 'Quantum Search Algorithm',
      slug: 'quantum-search-algorithm',
      type: 'RESEARCH', 
      content: 'Analyzing time complexity reduction in high-dimensional spatial grids using quantum superposition techniques. This research explores the boundaries of standard binary limitations.',
      authorId: ghostUser.id,
      published: true
    }
  });

  await prisma.post.create({
    data: {
      title: 'Predictive Matrix Forecasting',
      slug: 'predictive-matrix-forecasting',
      type: 'RESEARCH', 
      content: 'Hyperspatial structural mapping algorithm engineered to forecast distributed data network congestions before they occur in real-time environments.',
      authorId: ghostUser.id,
      published: true
    }
  });

  // ==========================================
  // 3. INJECT PROJECT RELEASES
  // ==========================================
  await prisma.release.create({
    data: {
      projectName: 'Fluid UI Spatial Engine',
      version: '9.0.4',
      releaseNotes: 'A WebGL-based rendering engine that morphs standard DOM elements into physics-based liquid structures.',
      downloadUrl: 'https://github.com/nima/fluid-ui'
    }
  });

  await prisma.release.create({
    data: {
      projectName: 'Biometric Security Interface',
      version: '1.2.0',
      releaseNotes: 'Next-gen cryptographic biometric barrier utilizing decentralized client-side visual handshake validation arrays.',
      downloadUrl: 'https://github.com/nima/biometric-sec'
    }
  });

  console.log('✅ Data Cores and Pipelines Successfully Seeded!');
}

main()
  .catch((e) => {
    console.error('Data Injection Failed:', e);
    throw e; 
  })
  .finally(async () => {
    await prisma.$disconnect();
  });