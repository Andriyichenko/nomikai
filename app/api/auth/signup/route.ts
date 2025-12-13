import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(16, "Password must be at most 16 characters")
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/, "Password must contain both letters and numbers"),
  code: z.string().length(6, "Code must be 6 digits"),
  isSubscribed: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = SignupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email, password, code, isSubscribed } = result.data;

    // 1. Verify OTP
    const otpRecord = await prisma.otp.findFirst({
        where: {
            email,
            code,
            expires: { gt: new Date() }
        }
    });

    if (!otpRecord) {
        return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    // 2. Check existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 3. Delete used OTP
    await prisma.otp.delete({ where: { id: otpRecord.id } });

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create user
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: email.split('@')[0],
            role: email === process.env.ADMIN_EMAIL ? 'admin' : 'user',
            emailVerified: new Date(),
            isSubscribed: isSubscribed || false, // Default false if not provided
        }
    });

    return NextResponse.json({ success: true, user: { email: user.email } });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
