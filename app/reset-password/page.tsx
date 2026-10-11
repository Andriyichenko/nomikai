import ResetPasswordForm from "@/components/ResetPasswordForm";
import { getDict } from "@/lib/lang";
import { getViewer } from "@/lib/data";

export const metadata = { title: "Reset password" };

/** Lands here from the recovery mail (via /auth/callback, which signs the user in). */
export default async function ResetPasswordPage() {
  const [{ t }, viewer] = await Promise.all([getDict(), getViewer()]);
  return (
    <div className="mx-auto max-w-sm px-4 pt-16 md:pt-24">
      <p className="eyebrow">Reset password</p>
      <h1 className="mt-3 font-serif text-3xl font-bold tracking-wider">{t.login.resetTitle}</h1>
      {viewer ? (
        <>
          <p className="mt-4 text-sm text-ink-2">{t.login.resetLead}</p>
          <div className="mt-10">
            <ResetPasswordForm t={t.login} />
          </div>
        </>
      ) : (
        <div className="mt-6 space-y-6">
          <p className="rounded-xl border border-line bg-paper-2 p-4 text-sm leading-relaxed">{t.login.resetNoSession}</p>
          <a href="/login" className="btn btn-ghost w-full">{t.login.backToLogin}</a>
        </div>
      )}
    </div>
  );
}
