import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { getViewer } from "@/lib/data";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/admin");
  if (!viewer.profile?.is_admin) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-24 text-center">
        <p className="eyebrow">403</p>
        <p className="mt-4 text-ink-2">管理者のみアクセスできます。</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 md:px-8 md:pt-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Studio</p>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-[0.12em]">管理</h1>
        </div>
        <AdminNav />
      </div>
      <div className="mt-10">{children}</div>
    </div>
  );
}
