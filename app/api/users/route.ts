import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function checkAdmin() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || session.user.role !== 'admin') {
        return false;
    }
    return true;
}

export async function GET() {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isSubscribed: true,
                createdAt: true,
            }
        });
        
        // Map to frontend interface
        const formattedUsers = users.map(u => ({
            id: u.id,
            username: u.name || u.email?.split('@')[0] || "No Name", // Use name, fallback to email prefix
            email: u.email,
            role: u.role,
            isSubscribed: u.isSubscribed,
            createdAt: u.createdAt
        }));

        return NextResponse.json(formattedUsers);
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    try {
        const { username, password, role } = await request.json();
        const email = username.includes('@') ? username : `${username}@example.com`;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: {
                email,
                name: username, // Save username as name
                password: hashedPassword,
                role: role || 'user'
            }
        });
        
        return NextResponse.json(newUser);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(request: Request) {
    if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { id, isSubscribed } = body;

        // @ts-ignore
        const isSelf = session.user.id === id;
        // @ts-ignore
        const isAdmin = session.user.role === 'admin';

        if (!isSelf && !isAdmin) {
             return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isSubscribed }
        });

        return NextResponse.json(updatedUser);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}