import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function isAdmin() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    return session?.user?.role === 'admin';
}

export async function GET() {
    try {
        const events = await prisma.event.findMany({
            orderBy: { date: 'desc' }
        });
        
        const parsed = events.map(e => ({
            ...e,
            images: JSON.parse(e.images)
        }));

        return NextResponse.json(parsed);
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { title, date, location, description, images, status } = body;

        const event = await prisma.event.create({
            data: {
                title,
                date,
                location,
                description,
                images: JSON.stringify(images || []),
                status: status || 'published'
            }
        });

        return NextResponse.json(event);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}