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
      const reservations = await prisma.reservation.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
              name: true,
              availableDates: true,
              // Intentionally NOT selecting email or message for privacy
          }
      });
      
      const parsed = reservations.map(r => {
          try {
              return {
                  name: r.name,
                  availableDates: JSON.parse(r.availableDates) as string[]
              };
          } catch (e) {
              return { name: r.name, availableDates: [] };
          }
      });

      return NextResponse.json(parsed);
  } catch (error) {
      console.error("Failed to fetch public stats:", error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
