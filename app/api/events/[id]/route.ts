import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function isAdmin() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    return session?.user?.role === 'admin';
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const event = await prisma.event.findUnique({ where: { id } });
        if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        
        return NextResponse.json({
            ...event,
            images: JSON.parse(event.images)
        });
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    try {
        const body = await request.json();
        const { title, date, location, description, images, status } = body;

        const event = await prisma.event.update({
            where: { id },
            data: {
                title,
                date,
                location,
                description,
                images: JSON.stringify(images),
                status
            }
        });

        return NextResponse.json(event);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    try {
        await prisma.event.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}