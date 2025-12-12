import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode('your-secret-key-should-be-complex'); // In prod, use env var

export async function signSession(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (e) {
    return null;
  }
}

export async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return await verifySession(token);
}
