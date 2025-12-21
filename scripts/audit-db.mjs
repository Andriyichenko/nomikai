import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Detailed Data Audit ---');
  try {
    const projects = await prisma.reservationItem.findMany();
    console.log(`\nProjects Found (${projects.length}):`);
    projects.forEach(p => console.log(`- ID: ${p.id}, Title: ${p.title}`));

    const reservations = await prisma.reservation.findMany();
    console.log(`\nReservations Found (${reservations.length}):`);
    reservations.forEach(r => {
        console.log(`- ID: ${r.id}, Name: ${r.name}, ItemID: ${r.reservationItemId}, UserID: ${r.userId}`);
    });

    const users = await prisma.user.findMany();
    console.log(`\nUsers Found (${users.length}):`);
    users.forEach(u => console.log(`- ID: ${u.id}, Name: ${u.name}, Role: ${u.role}`));

  } catch (error) {
    console.error('Audit Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
