import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const UpdateSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(16).regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/, "Password must contain both letters and numbers"),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const result = UpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { currentPassword, newPassword } = result.data;
    const email = session.user?.email;

    if (!email) return NextResponse.json({ error: "User email not found" }, { status: 400 });

    // 1. Get User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) return NextResponse.json({ error: "User not found or no password set" }, { status: 400 });

    // 2. Verify Current Password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return NextResponse.json({ error: "現在のパスワードが間違っています" }, { status: 400 });

    // 3. Update Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
