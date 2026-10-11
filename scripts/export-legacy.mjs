// One-off: dump the legacy (Neon/Prisma) data to JSON for the v2 Supabase migration.
// Usage: node scripts/export-legacy.mjs <out.json>
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'node:fs';

const prisma = new PrismaClient();
const out = process.argv[2];
if (!out) { console.error('usage: export-legacy.mjs <out.json>'); process.exit(1); }

const data = {
  users: await prisma.user.findMany({ select: { id: true, name: true, firstName: true, lastName: true, username: true, email: true, image: true, role: true, createdAt: true } }),
  reservationItems: await prisma.reservationItem.findMany(),
  reservations: await prisma.reservation.findMany(),
  events: await prisma.event.findMany(),
  notices: await prisma.notice.findMany(),
  siteConfig: await prisma.siteConfig.findMany(),
};
writeFileSync(out, JSON.stringify(data, null, 2));
console.log(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])));
await prisma.$disconnect();
