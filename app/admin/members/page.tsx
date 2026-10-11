import MemberRow from "@/components/admin/MemberRow";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/data";
import type { Profile } from "@/lib/types";

export default async function AdminMembers() {
  const supabase = await createClient();
  const viewer = await getViewer();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_url, is_admin, auth_user_id, responses(count)")
    .order("created_at");
  const members = (data ?? []) as (Profile & { auth_user_id: string | null; responses: { count: number }[] })[];
  return (
    <section>
      <h2 className="eyebrow mb-2">メンバー（{members.length}）</h2>
      <p className="mb-6 text-sm text-muted">
        メンバーはGoogleかメールで初めてログインした時に自動で登録されます。旧システムのメンバーは、同じメールアドレスでログインすると過去の回答ごと引き継がれます。
      </p>
      <ul className="divide-y divide-line border-y border-line">
        {members.map((m) => (
          <MemberRow key={m.id} p={m} linked={Boolean(m.auth_user_id)} responses={m.responses?.[0]?.count ?? 0} isSelf={m.id === viewer?.profile?.id} />
        ))}
      </ul>
    </section>
  );
}
