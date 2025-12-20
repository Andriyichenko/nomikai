import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from 'zod';

const FormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  availableDates: z.array(z.string()).min(1, "Required"),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = FormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues }, { status: 400 });
    }

    const { name, email, availableDates, message } = result.data;

    const reservation = await prisma.reservation.create({
        data: {
            name,
            email,
            availableDates: JSON.stringify(availableDates), // Store as JSON string
            message,
            // @ts-ignore
            userId: session.user.id,
        }
    });

    return NextResponse.json({ success: true, data: reservation });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const isAdminRequest = searchParams.get('admin') === 'true';

  // If Admin AND requesting admin data, return all.
  // @ts-ignore
  if (session.user.role === 'admin' && isAdminRequest) {
      const reservations = await prisma.reservation.findMany({
          orderBy: { createdAt: 'desc' }
      });
      
      const parsed = reservations.map(r => ({
          ...r,
          availableDates: JSON.parse(r.availableDates)
      }));
      return NextResponse.json(parsed);
  } else {
      // Return ALL reservations for the current user (Personal Mode)
      // @ts-ignore
      const reservations = await prisma.reservation.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: 'desc' } // Order newest first
      });

      if (!reservations) return NextResponse.json([]);

      const parsed = reservations.map(r => ({
          ...r,
          availableDates: JSON.parse(r.availableDates)
      }));
      return NextResponse.json(parsed);
  }
}