import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Data Migration & Repair ---');
  try {
    // 1. Get the first available project
    const firstProject = await prisma.reservationItem.findFirst();
    
    if (!firstProject) {
        console.log('No projects found. Please create a project first in Admin Dashboard.');
        return;
    }

    console.log(`Target Project: ${firstProject.title} (ID: ${firstProject.id})`);

    // 2. Update all reservations that have no reservationItemId
    const result = await prisma.reservation.updateMany({
        where: { reservationItemId: null },
        data: { reservationItemId: firstProject.id }
    });

    console.log(`Updated ${result.count} existing reservations to link to this project.`);

    // 3. Ensure users have firstName/lastName if missing (optional but good for consistency)
    const users = await prisma.user.findMany({
        where: { OR: [{ firstName: null }, { lastName: null }] }
    });

    console.log(`Found ${users.length} users with missing names. Repairing...`);
    for (const user of users) {
        const nameParts = (user.name || 'User').split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || 'Name';
        await prisma.user.update({
            where: { id: user.id },
            data: { firstName, lastName }
        });
    }
    console.log('User names repaired.');

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
