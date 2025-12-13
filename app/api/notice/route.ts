import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    // Get the latest notice
    const notice = await prisma.notice.findFirst({
        orderBy: { updatedAt: 'desc' }
    });
    
    // Default content if none exists
    if (!notice) {
        return NextResponse.json({
            title: "飲み会のお知らせ",
            content: "現在、新しいお知らせはありません。\n詳細は後日更新されます。"
        });
    }

    return NextResponse.json(notice);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notice" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  // @ts-ignore
  if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, content } = await request.json();
    
    // We only keep one notice for simplicity, or just update the latest one.
    // Let's create a new one every time to keep history, or update logic.
    // For this use case, upserting a single record or just creating new is fine.
    // Let's create new so we have history, but GET only fetches latest.
    
    const notice = await prisma.notice.create({
        data: { title, content }
    });

    return NextResponse.json(notice);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notice" }, { status: 500 });
  }
}
