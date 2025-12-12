import { NextAuthOptions, DefaultSession } from "next-auth"; // Added DefaultSession
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: profile.email === process.env.ADMIN_EMAIL ? 'admin' : 'user',
          isSubscribed: true, 
        }
      }
    }),
    CredentialsProvider({
        name: "Credentials",
        credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
            code: { label: "Code", type: "text" }
        },
        async authorize(credentials) {
            if (!credentials?.email) return null;
            if (credentials.code) {
                const otpRecord = await prisma.otp.findFirst({
                    where: { email: credentials.email, code: credentials.code, expires: { gt: new Date() } }
                });
                if (!otpRecord) throw new Error("Invalid or expired code");
                await prisma.otp.delete({ where: { id: otpRecord.id } });
                let user = await prisma.user.findUnique({ where: { email: credentials.email } });
                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            email: credentials.email,
                            name: credentials.email.split('@')[0],
                            role: credentials.email === process.env.ADMIN_EMAIL ? 'admin' : 'user',
                            isSubscribed: true
                        }
                    });
                }
                return user;
            }
            if (credentials.password) {
                const user = await prisma.user.findUnique({ where: { email: credentials.email } });
                if (!user || !user.password) throw new Error("Invalid credentials");
                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) throw new Error("Invalid credentials");
                
                return user;
            }
            return null;
        }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
        if (user) {
             token.id = user.id;
             // @ts-ignore
             token.role = user.role;
             token.picture = user.image;
             // Add isSubscribed to token
             // @ts-ignore
             token.isSubscribed = user.isSubscribed;
        }

        if (token.email) {
            const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
            if (dbUser) {
                token.role = dbUser.role;
                token.picture = dbUser.image;
                // Update isSubscribed in token from DB
                token.isSubscribed = dbUser.isSubscribed;
            }
        }
        return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        // @ts-ignore
        session.user.id = token.id as string;
        // @ts-ignore
        session.user.role = token.role;
        session.user.image = token.picture;
        // Expose isSubscribed to client session
        // @ts-ignore
        session.user.isSubscribed = token.isSubscribed;
      }
      return session;
    }
  },
  session: {
      strategy: "jwt"
  },
  pages: {
    signIn: '/login',
  },
};

// Extend Session and JWT types for TypeScript
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
      isSubscribed?: boolean; // Add isSubscribed
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    isSubscribed?: boolean; // Add isSubscribed
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    isSubscribed?: boolean; // Add isSubscribed
  }
}