import { redirect } from "next/navigation";
import LoginPanel from "@/components/LoginPanel";
import { getDict } from "@/lib/lang";
import { getViewer } from "@/lib/data";

export const metadata = { title: "Login / Sign up" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; mode?: string }> }) {
  const { next, error, mode } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (await getViewer()) redirect(safeNext);
  const { t } = await getDict();
  return (
    <div className="mx-auto max-w-sm px-4 pt-16 md:pt-24">
      <p className="eyebrow">Sign in / Sign up</p>
      <h1 className="mt-3 font-serif text-3xl font-bold tracking-wider">
        {t.login.tabLogin} / {t.login.tabSignup}
      </h1>
      <p className="mt-4 text-sm text-ink-2">{t.login.lead}</p>
      {error && <p className="mt-4 text-sm text-accent">ログインに失敗しました。もう一度お試しください。</p>}
      <div className="mt-10">
        <LoginPanel t={t.login} next={safeNext} initial={mode === "signup" ? "signup" : "login"} />
      </div>
    </div>
  );
}
