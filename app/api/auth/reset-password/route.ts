import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ResetSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8).max(16).regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/, "Password must contain both letters and numbers"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = ResetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email, code, newPassword } = result.data;

    // 1. Verify OTP
    const otpRecord = await prisma.otp.findFirst({
        where: { email, code, expires: { gt: new Date() } }
    });

    if (!otpRecord) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });

    // 2. Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update User
    await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
    });

    // 4. Cleanup OTP
    await prisma.otp.delete({ where: { id: otpRecord.id } });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
