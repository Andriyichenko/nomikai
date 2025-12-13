import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const password = 'admin123';
  const email = 'admin@example.com'; // Default email for admin

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!existingUser) {
    console.log(`Creating default admin user: ${username}`);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        name: 'Admin',
        role: 'admin',
        isSubscribed: true
      },
    });
    console.log(`✅ Default admin created.`);
  } else {
    console.log(`User ${username} already exists.`);
    if (existingUser.role !== 'admin') {
        await prisma.user.update({
            where: { id: existingUser.id },
            data: { role: 'admin' }
        });
        console.log(`✅ Updated ${username} to admin role.`);
    }
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
