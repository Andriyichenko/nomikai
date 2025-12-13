# Nomikai - Event Reservation Platform

## Architecture Overview

This is a bilingual (Japanese/Chinese) event reservation platform built with Next.js 14 (App Router), NextAuth.js, Prisma, and SQLite. Users can reserve spots for multiple event dates through an interactive calendar interface.

**Key Components:**
- **Authentication**: NextAuth.js with Google OAuth + email/password + OTP magic links
- **Database**: SQLite via Prisma ORM with JSON serialization for arrays (`availableDates`, `images`)
- **Internationalization**: Path-based routing (`/cn` prefix for Chinese, default Japanese)
- **UI**: Client-side React with GSAP animations, react-hook-form + Zod validation, Tailwind CSS v4

## Critical Database Patterns

### JSON Serialization
Prisma schema uses `String` fields to store JSON arrays. Always serialize/deserialize:

```typescript
// Events API (app/api/events/route.ts)
const event = await prisma.event.create({
  data: { images: JSON.stringify(images || []) }
});
// Return to client
return NextResponse.json({ ...event, images: JSON.parse(event.images) });

// Reservations (app/api/reserve/route.ts)
const reservation = await prisma.reservation.create({
  data: { availableDates: JSON.stringify(availableDates) }
});
```

**Affected fields:**
- `Event.images`: `string[]` of image URLs
- `Reservation.availableDates`: `string[]` of ISO date strings (YYYY-MM-DD)

## Authentication System

### Multi-Provider Setup (`lib/auth.ts`)
- **Google OAuth**: Auto-creates users, checks `ADMIN_EMAIL` for admin role
- **Credentials**: Supports both password login AND OTP magic links (same provider)
- **OTP Flow**: Email code → verify against `Otp` table → auto-create user if new

### Admin Authorization Pattern
```typescript
// Used in all admin API routes (events, notice, etc.)
async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}
```

### Making Users Admin
Run: `node scripts/make-admin.mjs` (checks `ADMIN_EMAIL` from `.env`)

## Internationalization (i18n)

**No library used** - custom hook-based solution:

```typescript
// hooks/useTranslation.ts
const pathname = usePathname();
const lang: Language = pathname?.startsWith("/cn") ? "cn" : "ja";
return { t: translations[lang], lang };
```

**Usage in components:**
```tsx
const { t, lang } = useTranslation();
<h1>{t.nav.notice}</h1>
```

**Routing:**
- `/` → Japanese (default)
- `/cn` → Chinese version of homepage
- All other routes auto-detect from path prefix

## Development Workflow

### Setup
```bash
npm install
# Configure .env with DATABASE_URL, NEXTAUTH_SECRET, OAuth credentials
npx prisma generate  # Generate Prisma client
npx prisma db push   # Sync schema to SQLite (no migrations in dev)
npm run dev
```

### Database Changes
1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` (SQLite - no migration files needed)
3. Run `npx prisma generate` to update client types

### Key Scripts
- `npm run dev` - Development server (port 3000)
- `npm run build` - Production build
- `node scripts/make-admin.mjs` - Promote user to admin

## Project-Specific Conventions

### API Route Structure
All API routes use server-side session checks:
```typescript
// app/api/*/route.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ... rest
}
```

### Client-Side State Management
- **No Redux/Zustand** - uses React state + useEffect for data fetching
- **Toast notifications**: `react-hot-toast` configured in `app/providers.tsx`
- **Form handling**: `react-hook-form` + `@hookform/resolvers/zod`

### Date Handling
- **Storage**: ISO strings (YYYY-MM-DD) in `availableDates` JSON arrays
- **Display**: `date-fns` with locale support (`ja`, `zhCN`)
- **Validation**: Range checks with `isBefore`, `isAfter`, `startOfDay` from date-fns

### File Organization
```
app/
  api/           # API routes (NextAuth in [...nextauth])
  [feature]/     # Page routes (events, reserve, admin, etc.)
  providers.tsx  # SessionProvider + Toaster wrapper
  layout.tsx     # Root layout with splash screen + fonts
components/      # Shared UI (no /ui except calendar & PasswordInput)
lib/
  auth.ts        # NextAuth config + type extensions
  i18n/          # Translation dictionary
hooks/           # useTranslation custom hook
prisma/          # Database schema
scripts/         # Admin utilities (make-admin.mjs)
```

### TypeScript Patterns
- Frequent use of `// @ts-ignore` for NextAuth session/user type extensions (see `lib/auth.ts` bottom for type declarations)
- Zod schemas for API validation (`z.object()` → `safeParse()`)
- Type inference from Prisma: `import { PrismaClient } from "@prisma/client"`

## Common Pitfalls

1. **Forgot to JSON.parse images/dates** when returning from DB → Client receives string instead of array
2. **Missing `await params`** in dynamic routes (Next.js 15 requirement): `const { id } = await params;`
3. **OTP expiration** not checked → Use `expires: { gt: new Date() }` in Prisma query
4. **Admin check bypassed** → Always use `isAdmin()` helper in protected routes
5. **i18n path mismatch** → Ensure `/cn` prefix is consistent (check `usePathname()` logic)

## Environment Variables

Required in `.env`:
```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<random-string>"
GOOGLE_CLIENT_ID="<oauth-id>"
GOOGLE_CLIENT_SECRET="<oauth-secret>"
EMAIL_SERVER_HOST="smtp.gmail.com"  # For OTP emails
EMAIL_SERVER_PASSWORD="<app-password>"
ADMIN_EMAIL="<your-admin-email>"
```

## External Dependencies

- **Nodemailer**: Sends OTP codes (configured in email provider, not used in codebase directly)
- **GSAP**: Animations in `SplashScreen`, `HeroSection`, `HomeRevealWrapper`
- **Recharts**: Admin dashboard analytics (`AdminDashboard.tsx`)
- **lucide-react**: Icon library (e.g., `Calendar`, `Loader2`, `CheckCircle2`)

## Testing & Debugging

- **No test suite** currently in project
- Use `npx prisma studio` to inspect SQLite database visually
- Check `app/providers.tsx` for toast configuration (errors display 5s, success 3s)
- Admin panel at `/admin` shows reservation aggregations and user management
