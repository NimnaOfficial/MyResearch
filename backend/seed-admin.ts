// ✅ ADD THIS INSTEAD:
import { PrismaClient } from '@prisma/client';
import prisma from './src/config/prisma';
import bcrypt from 'bcryptjs';


async function injectMasterAdmin() {
  // ---------------------------------------------------------
  // ⚙️ CONFIGURE YOUR MASTER CREDENTIALS HERE
  // ---------------------------------------------------------
  const adminEmail = 'nima@csx.com';
  const adminPassword = 'matrix-override'; 
  // ---------------------------------------------------------

  console.log('⏳ Initiating Master Admin Injection Protocol...');

  try {
    // Encrypt the password using 10 salt rounds to match your auth system
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Upsert ensures that if the email already exists, it just upgrades it to Admin.
    // If it doesn't exist, it creates the brand new entity.
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: 'admin',
        passwordHash: hashedPassword, // <--- CHANGED FROM 'password'
      },
      create: {
        username: 'nima_core',
        fullName: 'Nima (Master Admin)',
        email: adminEmail,
        passwordHash: hashedPassword, // <--- CHANGED FROM 'password'
        role: 'admin',
      },
    });

    console.log('\n=============================================');
    console.log('✅ PROTOCOL SUCCESS: MASTER ADMIN INSTALLED');
    console.log('=============================================');
    console.log(`IDENTIFIER : ${admin.email}`);
    console.log(`CLEARANCE  : LEVEL 5 (ADMIN)`);
    console.log('=============================================\n');

  } catch (error) {
    console.error('❌ FATAL ERROR: Matrix injection failed.', error);
  } finally {
    await prisma.$disconnect();
  }
}

injectMasterAdmin();