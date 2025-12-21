import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from 'zod';
import nodemailer from "nodemailer";
import { format } from "date-fns";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

const FormSchema = z.object({
  reservationItemId: z.string().min(1),
  availableDates: z.array(z.string()).min(1),
  message: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

function safeParseDates(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch { return []; }
}

async function sendConfirmationEmail(email: string, name: string, dates: string[], message: string, project: any) {
    try {
        const dateList = dates.sort().join(', ');
        const isUpdate = !!project.isUpdate;
        const projectTitle = project.title || "イベント";
        
        const footer = `ご不明点や不具合がございましたら、下記サイトよりお問い合わせください。https://contact.andreyis.com
※当サイトからお客様のパスワードや認証コード等の機密情報をお伺いすることはありません。
※不審なメール／SMS／URLにはアクセスせず、上記の正規窓口までご連絡ください。
※個人情報はプライバシーポリシーに基づき適切に取り扱います。`;

        await transporter.sendMail({
            from: { name: "バース人材の飲み会予約システム", address: process.env.EMAIL_FROM as string },
            to: email,
            subject: `【予約${isUpdate ? '更新' : '完了'}】${projectTitle} - ${name}様`,
            text: `${name} 様

バース人材の飲み会予約システムをご利用いただき、ありがとうございます。
以下の内容で予約を${isUpdate ? '更新' : '受け付け'}いたしました。

■ イベント: ${projectTitle}
■ 店名: ${project.shopName || '-'}
■ 地点: ${project.location || '-'}
■ 活動開始時間: ${project.startTime || '-'}
■ 予約日程: ${dateList}
■ メッセージ: ${message || 'なし'}
■ 予約締め切り日: ${project.deadline || '-'}

イベントの締め切り日以降に、最終確定のご案内を改めてお送りいたします。

--------------------------------------------------
${footer}
--------------------------------------------------`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #1e3820; border-bottom: 2px solid #ff0072; padding-bottom: 10px;">予約${isUpdate ? '更新' : '完了'}のお知らせ</h2>
                    <p>${name} 様</p>
                    <p>バース人材の飲み会予約システムをご利用いただき、ありがとうございます。<br/>以下の内容で予約を${isUpdate ? '更新' : '受け付け'}いたしました。</p>
                    
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 8px 0; color: #666; width: 120px;">イベント</td><td style="padding: 8px 0; font-weight: bold;">${projectTitle}</td></tr>
                            <tr><td style="padding: 8px 0; color: #666;">店名</td><td style="padding: 8px 0; font-weight: bold;">${project.shopName || '-'}</td></tr>
                            <tr><td style="padding: 8px 0; color: #666;">地点</td><td style="padding: 8px 0;">${project.location || '-'}</td></tr>
                            <tr><td style="padding: 8px 0; color: #666;">開始時間</td><td style="padding: 8px 0;">${project.startTime || '-'}</td></tr>
                            <tr><td style="padding: 8px 0; color: #666;">予約日程</td><td style="padding: 8px 0; font-weight: bold; color: #ff0072;">${dateList}</td></tr>
                            <tr><td style="padding: 8px 0; color: #666;">メッセージ</td><td style="padding: 8px 0;">${message || '-'}</td></tr>
                            <tr><td style="padding: 8px 0; color: #666;">締め切り日</td><td style="padding: 8px 0;">${project.deadline || '-'}</td></tr>
                        </table>
                    </div>

                    <p style="font-size: 14px; color: #666;">※ イベントの締め切り日以降に、最終確定のご案内を改めてお送りいたします。</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    
                    <div style="font-size: 12px; color: #999; line-height: 1.6; white-space: pre-wrap;">
${footer}
                    </div>
                </div>
            `
        });
    } catch (e) {
        console.error("Failed to send confirmation email:", e);
    }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const isAdminRequest = searchParams.get('admin') === 'true';

  // @ts-ignore
  const userId: string = session.user.id;

  // Get current user's profile to ensure name is ALWAYS up-to-date
  const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, firstName: true, lastName: true, email: true }
  });

  if (isAdminRequest) {
      // @ts-ignore
      if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const reservations = await prisma.reservation.findMany({ include: { user: true } });
      return NextResponse.json(reservations.map(r => ({
          ...r,
          name: r.user?.name || r.name,
          availableDates: safeParseDates(r.availableDates),
          reservationItemId: r.reservationItemId // Ensure this is included
      })));
  }

  const reservations = await prisma.reservation.findMany({ where: { userId } });
  
  // Get update count for today
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const activity = userId ? await prisma.userActivity.findUnique({
      where: { userId_date: { userId, date: todayStr } }
  }) : null;
  const remainingUpdates = Math.max(0, 5 - (activity?.updateCount || 0));

  return NextResponse.json({
      user: currentUser,
      remainingUpdates,
      reservations: reservations.map(r => ({
          ...r,
          name: currentUser?.name || r.name, // Force current database name
          availableDates: safeParseDates(r.availableDates),
          reservationItemId: r.reservationItemId
      }))
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { reservationItemId, availableDates, message, firstName, lastName } = FormSchema.parse(body);
    // @ts-ignore
    const userId: string = session.user.id;

    // Check modification limit (5 per day)
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const existingActivity = userId ? await prisma.userActivity.findUnique({
        where: { userId_date: { userId, date: todayStr } }
    }) : null;

    if (existingActivity && existingActivity.updateCount >= 5) {
        return NextResponse.json({ 
            error: "本日の変更制限（5回）に達しました。明日再度お試しください。" 
        }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // If name is missing and provided in body, update user profile
    if ((!user?.firstName || !user?.lastName) && firstName && lastName) {
        await prisma.user.update({
            where: { id: userId },
            data: { 
                firstName, 
                lastName, 
                name: `${firstName} ${lastName}` 
            }
        });
    }

    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    const project = await prisma.reservationItem.findUnique({ where: { id: reservationItemId } });

    // Find existing by item ID
    const existing = await prisma.reservation.findFirst({
        where: { userId, reservationItemId }
    });

    const finalRes = await prisma.reservation.upsert({
        where: { id: existing?.id || 'dummy-id' },
        create: {
            userId,
            reservationItemId,
            name: updatedUser?.name || "User",
            email: updatedUser?.email || "",
            availableDates: JSON.stringify(availableDates),
            message
        },
        update: {
            availableDates: JSON.stringify(availableDates),
            message,
            name: updatedUser?.name || "User"
        }
    });

    // Increment Activity Count
    await prisma.userActivity.upsert({
        where: { userId_date: { userId, date: todayStr } },
        create: { userId, date: todayStr, updateCount: 1 },
        update: { updateCount: { increment: 1 } }
    });

    await sendConfirmationEmail(updatedUser?.email || "", updatedUser?.name || "", availableDates, message || "", {
        ...project,
        isUpdate: !!existing
    });

    return NextResponse.json({ success: true, data: finalRes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const reservationItemId = searchParams.get('itemId');
    // @ts-ignore
    const userId = session.user.id;

    if (reservationItemId) {
        await prisma.reservation.deleteMany({ where: { userId, reservationItemId } });
    }
    return NextResponse.json({ success: true });
}
