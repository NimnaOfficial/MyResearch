import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import prisma from './src/config/prisma';

/**
 * Creates (or upgrades) the master admin account.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' npm run seed:admin
 *
 * Credentials come from the environment so they are never committed to git.
 */
async function injectMasterAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || '';

  if (!adminEmail || adminPassword.length < 8) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD (min 8 characters) must be set in the environment.');
    process.exit(1);
  }

  console.log('Initiating Master Admin Injection Protocol...');

  try {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Upsert: an existing account with this e-mail is upgraded to admin, otherwise it is created
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: 'admin',
        passwordHash: hashedPassword,
        isVerified: true,
        status: 'ACTIVE',
      },
      create: {
        username: 'nima_core',
        fullName: 'Nima (Master Admin)',
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'admin',
        isVerified: true,
      },
    });

    console.log('\n=============================================');
    console.log('PROTOCOL SUCCESS: MASTER ADMIN INSTALLED');
    console.log('=============================================');
    console.log(`IDENTIFIER : ${admin.email}`);
    console.log('CLEARANCE  : LEVEL 5 (ADMIN)');
    console.log('=============================================\n');
  } catch (error) {
    console.error('FATAL ERROR: Matrix injection failed.', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

injectMasterAdmin();
