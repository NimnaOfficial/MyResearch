import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create your Admin User and a test Research Post at the same time
  const user = await prisma.user.upsert({
    where: { username: 'nima_admin' },
    update: {}, // If the user exists, do nothing
    create: {
      username: 'nima_admin',
      passwordHash: 'secure_password_hash', // We will add real authentication later
      posts: {
        create: {
          title: 'The Future of AI and UI/UX',
          slug: 'future-of-ai-ui-ux',
          content: '# The Future of AI\n\nThis is a test research publication written in **Markdown**! It will be rendered beautifully on the frontend.',
          type: 'RESEARCH',
          published: true, // Set to true so our API fetches it
        },
      },
    },
  });

  console.log('✅ Seeding complete! Created User & Post:', user.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect(); // Close the database connection
  });