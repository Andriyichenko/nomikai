import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Diagnostic ---');
  try {
    const userCount = await prisma.user.count();
    const reservationCount = await prisma.reservation.count();
    const itemCount = await prisma.reservationItem.count();
    const eventCount = await prisma.event.count();

    console.log(`Users: ${userCount}`);
    console.log(`Reservations: ${reservationCount}`);
    console.log(`ReservationItems (Projects): ${itemCount}`);
    console.log(`Events (Archive): ${eventCount}`);
    
    if (userCount > 0) {
        const sampleUser = await prisma.user.findFirst();
        console.log('Sample User:', { id: sampleUser?.id, email: sampleUser?.email, name: sampleUser?.name });
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
