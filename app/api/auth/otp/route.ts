import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import { randomInt } from 'crypto';

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
        from: {
            name: "バース人材の飲み会予約システム",
            address: process.env.EMAIL_FROM as string
        },
        to: email,
        subject: "【認証コード】メールアドレスの確認 - バース人材の飲み会予約システム",
        text: `バース人材の飲み会予約システムをご利用いただき、ありがとうございます。

お客様の本人確認を行うため、以下の認証コードを入力してください。

認証コード：
${code}

※このコードの有効期限は10分間です。
※本メールにお心当たりがない場合は、破棄していただきますようお願いいたします。

--------------------------------------------------
バース人材の飲み会予約システム
--------------------------------------------------`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: 0 auto;">
                <p>バース人材の飲み会予約システムをご利用いただき、ありがとうございます。</p>
                <p>お客様の本人確認を行うため、以下の認証コードを入力してください。</p>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 5px;">認証コード</div>
                    <div style="font-size: 28px; font-weight: bold; color: #1e3820; letter-spacing: 6px;">${code}</div>
                </div>

                <p style="font-size: 13px; color: #666; line-height: 1.6;">
                    ※このコードの有効期限は10分間です。<br/>
                    ※本メールにお心当たりがない場合は、破棄していただきますようお願いいたします。
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="font-size: 12px; color: #999; text-align: center;">バース人材の飲み会予約システム</p>
            </div>
        `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
