import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { randomInt } from 'crypto';

const prisma = new PrismaClient();

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Generate 6 digit code
    const code = randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB (Delete old codes for this email first)
    await prisma.otp.deleteMany({ where: { email } });
    await prisma.otp.create({
        data: { email, code, expires }
    });

    // Send Email
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Your Login Code: ${code}`,
        text: `Your verification code is: ${code}\nIt expires in 10 minutes.`, // Corrected newline escape
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2>Login Verification</h2>
                <p>Your code is:</p>
                <h1 style="color: #1e3820; letter-spacing: 4px;">${code}</h1>
                <p>This code expires in 10 minutes.</p>
            </div>
        `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
