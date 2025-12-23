import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
      // 1. Fetch all reservations ordered by newest first
      const allReservations = await prisma.reservation.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
              id: true,
              userId: true,
              name: true,
              availableDates: true,
              reservationItemId: true,
              user: {
                select: {
                  name: true,
                  username: true,
                  image: true,
                  firstName: true,
                  lastName: true
                }
              }
          }
      });

      // 2. Filter: Only keep the latest record per user per project
      const latestReservationsMap = new Map<string, any>();
      allReservations.forEach(r => {
          const key = `${r.userId || 'anon'}-${r.reservationItemId || 'default'}`;
          if (!latestReservationsMap.has(key)) {
              latestReservationsMap.set(key, r);
          }
      });

      const uniqueReservations = Array.from(latestReservationsMap.values());
      
      const parsed = uniqueReservations.map(r => {
          try {
              return {
                  name: r.user?.name || r.user?.username || r.name,
                  image: r.user?.image || null,
                  firstName: r.user?.firstName || "",
                  availableDates: JSON.parse(r.availableDates) as string[],
                  reservationItemId: r.reservationItemId
              };
          } catch (e) {
              return { 
                  name: r.user?.name || r.user?.username || r.name, 
                  image: r.user?.image || null,
                  firstName: r.user?.firstName || "",
                  availableDates: [],
                  reservationItemId: r.reservationItemId
              };
          }
      });

      return NextResponse.json(parsed);
  } catch (error) {
      console.error("Failed to fetch public stats:", error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}