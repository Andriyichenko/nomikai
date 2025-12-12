// scripts/make-admin.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const targetEmail = process.env.ADMIN_EMAIL || 'itoukojiro2@gmail.com';

async function main() {
  console.log(`Checking user: ${targetEmail}...`);
  
  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!user) {
    console.error(`User ${targetEmail} not found! Please login first to create the account.`);
    return;
  }

  console.log(`Current role: ${user.role}`);

  if (user.role !== 'admin') {
    await prisma.user.update({
      where: { email: targetEmail },
      data: { role: 'admin' },
    });
    console.log(`✅ Successfully updated ${targetEmail} to ADMIN role.`);
  } else {
    console.log(`User is already an ADMIN.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
