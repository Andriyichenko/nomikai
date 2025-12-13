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
        let config = await prisma.siteConfig.findUnique({ where: { id: "default" } });
        
        // Initialize if missing
        if (!config) {
            config = await prisma.siteConfig.create({
                data: {
                    id: "default",
                    primaryColor: "#1e3820",
                    accentColor: "#ff0072",
                    fontFamily: "sans",
                    layout: "sidebar",
                    mainTitle: "バース人材",
                    subTitle: "飲み会",
                    heroTitle: "25年3月29日に飲み会",
                    heroSubtitle: "決定",
                    heroText: "一緒に素敵な思い出作りませんか？\n25年3月29日にお待ちしております",
                    heroTitleCn: "25年3月干饭大事预约",
                    heroSubtitleCn: "开搞",
                    heroTextCn: "青春不散场,有你就够了\n25年3月29日不见不散"
                }
            });
        }
        return NextResponse.json(config);
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    return handleSave(request);
}

export async function POST(request: Request) {
    return handleSave(request);
}

async function handleSave(request: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        console.log("Saving config:", body);

        // Allow partial updates but ensure we don't send undefined for required fields
        const { 
            primaryColor, accentColor, fontFamily, layout, mainTitle, subTitle, 
            heroTitle, heroSubtitle, heroText, heroTitleCn, heroSubtitleCn, heroTextCn 
        } = body;

        const dataToSave = {
            primaryColor: primaryColor || "#1e3820",
            accentColor: accentColor || "#ff0072",
            fontFamily: fontFamily || "sans",
            layout: layout || "sidebar",
            mainTitle: mainTitle || "バース人材",
            subTitle: subTitle || "飲み会",
            heroTitle: heroTitle || "",
            heroSubtitle: heroSubtitle || "",
            heroText: heroText || "",
            heroTitleCn: heroTitleCn || "",
            heroSubtitleCn: heroSubtitleCn || "",
            heroTextCn: heroTextCn || ""
        };

        const config = await prisma.siteConfig.upsert({
            where: { id: "default" },
            update: dataToSave,
            create: { 
                id: "default", 
                ...dataToSave
            }
        });

        return NextResponse.json(config);
    } catch (e: any) {
        console.error("Config save error:", e);
        return NextResponse.json({ error: e.message || "Failed to save config" }, { status: 500 });
    }
}
