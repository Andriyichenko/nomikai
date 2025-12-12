import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  // @ts-ignore
  if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { target, subject, content, specificEmails } = await request.json();
    
    let recipients: string[] = [];

    if (target === 'all') {
        const users = await prisma.user.findMany({ select: { email: true } });
        recipients = users.map(u => u.email).filter(Boolean) as string[];
    } else if (target === 'subscribed') {
        const users = await prisma.user.findMany({ 
            where: { isSubscribed: true },
            select: { email: true } 
        });
        recipients = users.map(u => u.email).filter(Boolean) as string[];
    } else if (target === 'specific' && Array.isArray(specificEmails)) {
        recipients = specificEmails;
    }

    if (recipients.length === 0) {
        return NextResponse.json({ message: "No recipients found" });
    }

    // Send emails (using BCC for privacy)
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        bcc: recipients,
        subject: subject,
        text: content,
        html: `<div style="white-space: pre-wrap;">${content}</div>`
    });

    return NextResponse.json({ success: true, count: recipients.length });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 });
  }
}
