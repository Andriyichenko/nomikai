import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Static Events Data (Mirroring what's in /archive/[eventId]/page.tsx)
const events = [
  { id: "2025-01", title: "2025年 新年会 (New Year Party)", content: "新年あけましておめでとうございます！" },
  { id: "2025-03", title: "2025年 春の飲み会 (Spring Gathering)", content: "春の訪れと共に、みんなで乾杯！" }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
      return NextResponse.json([]);
  }

  const session = await getServerSession(authOptions);
  // @ts-ignore
  const isAdmin = session?.user?.role === 'admin';

  try {
      const results: any[] = [];
      const lowerQ = q.toLowerCase();

      // 1. Search Static Events (Archive)
      events.forEach(e => {
          if (e.title.toLowerCase().includes(lowerQ) || e.content.toLowerCase().includes(lowerQ)) {
              results.push({ 
                  type: 'event', 
                  id: e.id, 
                  title: e.title, 
                  sub: 'Event Archive', 
                  href: `/archive/${e.id}` 
              });
          }
      });

      // 2. Search Notices (Public)
      const notices = await prisma.notice.findMany({
          where: {
              OR: [
                  { title: { contains: q } },
                  { content: { contains: q } }
              ]
          },
          take: 5
      });
      notices.forEach(n => results.push({ type: 'notice', id: n.id, title: n.title, sub: 'Notice', href: '/notice' }));

      // 3. Admin Only Searches
      if (isAdmin) {
          // Users
          const users = await prisma.user.findMany({
              where: {
                  OR: [
                      { name: { contains: q } },
                      { email: { contains: q } }
                  ]
              },
              take: 5
          });
          users.forEach(u => results.push({ 
              type: 'user', 
              id: u.id, 
              title: u.name || 'User', 
              sub: u.email || 'No Email', 
              href: '/admin' // Or specific user detail page if exists
          }));

          // Reservations
          const reservations = await prisma.reservation.findMany({
              where: {
                  OR: [
                      { name: { contains: q } },
                      { message: { contains: q } }
                  ]
              },
              take: 5
          });
          reservations.forEach(r => results.push({ 
              type: 'reservation', 
              id: r.id, 
              title: r.name, 
              sub: r.message || 'No message', 
              href: '/admin' 
          }));
      }

      return NextResponse.json(results);
  } catch (error) {
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}