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
  const fuzziness = searchParams.get('fuzziness') || 'medium'; // Low, Medium, High

  if (!q || q.trim().length < 1) {
      return NextResponse.json([]);
  }

  const session = await getServerSession(authOptions);
  // @ts-ignore
  const isAdmin = session?.user?.role === 'admin';

  try {
      const results: any[] = [];
      const lowerQ = q.toLowerCase();

      // Helper to push with score
      const addResult = (item: any, score: number) => {
          results.push({ ...item, score });
      };

      // 1. Search Static Events (Archive)
      events.forEach((e, index) => {
          let score = 0;
          if (e.title.toLowerCase().includes(lowerQ)) score = 15;
          else if (e.content.toLowerCase().includes(lowerQ)) score = 5;
          
          if (score > 0) {
              addResult({ 
                  type: 'event', 
                  id: e.id, 
                  title: e.title, 
                  sub: '過去のイベント', 
                  href: `/archive/${index}` 
              }, score);
          }
      });

      // 2. Search Active Projects (Reservation Items)
      const projects = await prisma.reservationItem.findMany({
          where: {
              OR: [
                  { title: { contains: q, mode: 'insensitive' } },
                  { shopName: { contains: q, mode: 'insensitive' } },
                  { description: { contains: q, mode: 'insensitive' } }
              ]
          },
          take: 10
      });
      projects.forEach(p => {
          const score = p.title.toLowerCase().includes(lowerQ) ? 20 : 10;
          addResult({ 
              type: 'reservation', 
              id: p.id, 
              title: p.title, 
              sub: p.shopName || '予約受付中', 
              href: '/reserve' 
          }, score);
      });

      // 3. Search Notices
      const notices = await prisma.notice.findMany({
          where: {
              OR: [
                  { title: { contains: q, mode: 'insensitive' } },
                  { content: { contains: q, mode: 'insensitive' } }
              ]
          },
          take: 10
      });
      notices.forEach(n => {
          const score = n.title.toLowerCase().includes(lowerQ) ? 12 : 6;
          addResult({ 
              type: 'notice', 
              id: n.id, 
              title: n.title, 
              sub: 'お知らせ', 
              href: '/notice' 
          }, score);
      });

      // Final sort and deduplicate
      const sortedResults = results
          .sort((a, b) => b.score - a.score)
          .filter((v, i, a) => a.findIndex(t => (t.id === v.id && t.type === v.type)) === i)
          .slice(0, 15)
          .map(({ score, ...rest }) => rest);

      return NextResponse.json(sortedResults);
  } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Search logic error" }, { status: 500 });
  }
}