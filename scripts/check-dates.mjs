import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Date Check ---');
  try {
    const project = await prisma.reservationItem.findFirst();
    console.log('Project Range:', { start: project?.startDate, end: project?.endDate });

    const reservations = await prisma.reservation.findMany();
    reservations.forEach(r => {
        console.log(`Reservation ${r.id}: Dates=${r.availableDates}`);
    });

    console.log('\nToday:', new Date().toISOString());

  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
