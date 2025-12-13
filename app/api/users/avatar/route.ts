import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Create unique filename
    const filename = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
    
    // Save to public/uploads
    // Note: In production (Vercel), this won't persist. Use S3/Cloudinary instead.
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    
    // Ensure dir exists (though we made it)
    // await mkdir(uploadDir, { recursive: true }); 
    
    await writeFile(path.join(uploadDir, filename), buffer);

    const imageUrl = `/uploads/${filename}`;

    // Update User in DB
    // @ts-ignore
    await prisma.user.update({
        // @ts-ignore
        where: { id: session.user.id },
        data: { image: imageUrl }
    });

    return NextResponse.json({ success: true, imageUrl });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
