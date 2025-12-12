import { NextResponse } from 'next/server';
import { createUser } from '@/lib/auth-db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    try {
        const newUser = createUser(username, password);
        return NextResponse.json({ success: true, user: { username: newUser.username } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
