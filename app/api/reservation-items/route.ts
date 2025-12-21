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
        const items = await prisma.reservationItem.findMany({
            orderBy: { startDate: 'asc' } // Ensure ascending order
        });
        return NextResponse.json(items);
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { title, date, startDate, endDate, description, isActive, deadline, startTime, location, shopName } = body;

        const item = await prisma.reservationItem.create({
            data: { 
                title, 
                date: date || startDate, 
                startDate: startDate || date,
                endDate: endDate || startDate || date,
                deadline: deadline || "",
                startTime: startTime || "",
                location: location || "",
                shopName: shopName || "",
                description, 
                isActive: isActive ?? true 
            }
        });

        return NextResponse.json(item);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { id, title, date, startDate, endDate, description, isActive, deadline, startTime, location, shopName } = body;

        const item = await prisma.reservationItem.update({
            where: { id },
            data: { 
                title, 
                date,
                startDate,
                endDate,
                deadline,
                startTime,
                location,
                shopName,
                description, 
                isActive 
            }
        });

        return NextResponse.json(item);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
        await prisma.reservationItem.delete({ where: { id } });
    }
    return NextResponse.json({ success: true });
}