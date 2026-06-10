import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Initialize the native Postgres connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Wrap it in the Prisma 7 Driver Adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to PrismaClient
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Initiating Master Data Core Injection...');

  // ---------------------------------------------------------
  // 1. INJECT PROJECT CORES (RELEASES & FUTURE ARCHITECTURE)
  // ---------------------------------------------------------
  console.log('Injecting Project Cores...');
  
  await prisma.release.create({
    data: {
      projectName: 'AutoHub Premium Web Platform',
      version: 'v2.4.0',
      releaseNotes: 'AutoHub is a premium auto parts e-commerce platform built with high-performance backend logic. It features real-time inventory tracking, secure session management, and live dynamic payment processing via Stripe integration.',
      heroImg: 'from-[#f97316]/30 to-black',
      published: true,
      publishedAt: new Date(),
      advancedData: JSON.stringify({
        architecture: 'Built on a strict MVC architecture utilizing raw PHP 8.2 for the backend controller logic, paired with a highly normalized MySQL relational database. The frontend utilizes Tailwind CSS for rapid styling and responsive geometry.',
        addedFeatures: '\n- Integrated Stripe live payment processing.\n- Added real-time inventory syncing matrix.',
        changedUpdates: '\n- Optimized relational database queries, reducing load time by 40%.',
        fixedBugs: '\n- Fixed session timeout desync during the checkout process.\n- Patched XSS vulnerability in the global search parameters.',
        executiveSummary: 'AutoHub is a premium auto parts e-commerce platform built with high-performance backend logic. It features real-time inventory tracking, secure session management, and live dynamic payment processing via Stripe integration.',
        breakingChanges: '\n- Deprecated legacy PHP 7.x endpoints.\n- Restructured the users table for enhanced cryptographic security.',
        migrationLog: 'Execute the migration_v2.sql script. Ensure Stripe live API keys are rotated and updated in the server environment variables.',
        codeSnippet: '<?php\n// AutoHub Core DB Link\n$conn = new mysqli($matrix_host, $user, $pass, $db);\nif ($conn->connect_error) {\n    die("Matrix Connection Terminated: " . $conn->connect_error);\n}\necho "Secure Node Connected.";\n?>',
        techStack: ['PHP 8.2', 'MySQL', 'Stripe API', 'TailwindCSS', 'JavaScript'],
        codeTrace: [{ path: 'src/controllers/Payment.php', type: 'ADDED' }],
        versionTrack: [{ version: 'v2.0.0', date: '2026-03-15', notes: 'Initial stable launch of the e-commerce core.' }],
        githubUrl: 'https://github.com/nimnaofficial/autohub',
        liveUrl: 'https://autohub.example.com',
        leadDev: 'Nima',
        license: 'Proprietary',
        explorerRating: '4.9',
        explorerViews: '15.2k',
        routing: { targetExplorer: true, targetVault: true, targetUpcoming: false, targetPrototypes: true }
      })
    }
  });

  // --- FUTURE ARCHITECTURE (DRAFTS) ---
  await prisma.release.create({
    data: {
      projectName: 'Integrated Production and Resource Management System',
      version: 'v0.9-BETA',
      releaseNotes: 'A comprehensive management system undergoing final staging. Focuses on seamless resource allocation and strict role-based access control flows.',
      heroImg: 'from-blue-900/40 to-black',
      published: false, // DRAFT STATUS
      advancedData: JSON.stringify({
        executiveSummary: 'A comprehensive management system undergoing final staging. Focuses on seamless resource allocation and strict role-based access control flows.',
        techStack: ['React', 'Node.js', 'PostgreSQL', 'JWT'],
        leadDev: 'Nima',
        routing: { targetExplorer: false, targetVault: false, targetUpcoming: true, targetPrototypes: false } // Routs to VR Cylinder
      })
    }
  });

  await prisma.release.create({
    data: {
      projectName: 'CSx Quantum Matrix Engine',
      version: 'v3.0.0-DRAFT',
      releaseNotes: 'Next-generation 3D spatial portfolio powered by advanced WebGL algorithms. Integrates directly with a custom Express/PostgreSQL DataCore for zero-latency hydration.',
      heroImg: 'from-red-900/40 to-black',
      published: false, // DRAFT STATUS
      advancedData: JSON.stringify({
        executiveSummary: 'Next-generation 3D spatial portfolio powered by advanced WebGL algorithms. Integrates directly with a custom Express/PostgreSQL DataCore for zero-latency hydration.',
        techStack: ['Next.js 14', 'React Three Fiber', 'PostgreSQL', 'Framer Motion'],
        leadDev: 'Nima',
        routing: { targetExplorer: false, targetVault: false, targetUpcoming: true, targetPrototypes: true } // Routs to VR Cylinder & Graph
      })
    }
  });

  // ---------------------------------------------------------
  // 2. INJECT SHOWCASE MEDIA (VIMEO LINKS)
  // ---------------------------------------------------------
  console.log('Injecting Showcase Media...');

  await prisma.showcase.createMany({
    data: [
      {
        title: 'Creative Matrix Feed Alpha',
        videoUrl: 'https://vimeo.com/1198783275?share=copy&fl=sv&fe=ci',
        thumbnailUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000',
        description: 'Testing the high-definition video pipeline integration directly from Vimeo servers into the front-end matrix.'
      },
      {
        title: 'Dynamic UI/UX Render Test',
        videoUrl: 'https://vimeo.com/1198783903?share=copy&fl=sv&fe=ci',
        thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000',
        description: 'Analyzing frame drops and latency issues while rendering complex UI components over cloud-hosted video backgrounds.'
      },
      {
        title: 'Spatial Audio/Visual Prototype',
        videoUrl: 'https://vimeo.com/1198783953?share=copy&fl=sv&fe=ci',
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000',
        description: 'Final execution test of the holographic video carousel mapped directly to third-party streaming infrastructure.'
      }
    ]
  });

  // ---------------------------------------------------------
  // 3. INJECT SYSTEM QUERIES (FAQs)
  // ---------------------------------------------------------
  console.log('Injecting System Queries...');

  await prisma.faq.createMany({
    data: [
      {
        query: 'What database architecture powers the CSx Core?',
        response: 'The system utilizes a highly normalized PostgreSQL relational database. Data manipulation and telemetry injections are handled strictly via Prisma ORM to guarantee type-safety and eliminate injection vulnerabilities.'
      },
      {
        query: 'Who has execution access to the payroll sequence module?',
        response: 'Strictly the HR Manager. Standard Admin access is restricted for this specific architectural flow to maintain data isolation and compliance.'
      },
      {
        query: 'Are the 3D visual elements purely decorative?',
        response: 'No. The WebGL Canvas elements generated via React Three Fiber are actively mapped to the display routing engine. Clicking spatial nodes triggers instantaneous Next.js router pushes to precise data endpoints.'
      },
      {
        query: 'How are media assets handled in the system?',
        response: 'We support direct integration with cloud providers like Vimeo and YouTube for seamless, high-performance streaming, minimizing server-side bandwidth load.'
      },
      {
        query: 'What is the procedure for deploying new UI/UX components?',
        response: 'All components must pass a local staging review ensuring zero-latency rendering and pixel-perfect alignments before being pushed to the live matrix.'
      }
    ]
  });

  console.log('Matrix Data Injection Complete! 🚀');
}

main()
  .catch((e) => {
    console.error(e);
    throw e; // Natively stops the script
  })
  .finally(async () => {
    await prisma.$disconnect();
  });