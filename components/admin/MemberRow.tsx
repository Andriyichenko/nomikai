"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { renameMember, setMemberAdmin } from "@/app/admin/actions";
import type { Profile } from "@/lib/types";
import Avatar from "../Avatar";
import { Msg, useAction } from "./useAction";

export default function MemberRow({ p, linked, responses, isSelf }: { p: Profile; linked: boolean; responses: number; isSelf: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(p.display_name);
  const { pending, msg, run } = useAction();
  return (
    <li className="grid items-center gap-3 py-4 md:grid-cols-[1fr_auto_auto]">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={p.display_name} src={p.avatar_url} size={36} />
        <div className="min-w-0 flex-1">
          <input
            className="w-full border-b border-transparent bg-transparent font-medium focus:border-ink focus:outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== p.display_name && run(() => renameMember(p.id, name), "保存しました")}
          />
          <p className="truncate text-xs text-muted">
            {p.email ?? "—"}
            {!linked && " ・ 未ログイン（旧システムから移行）"}
          </p>
        </div>
      </div>
      <span className="text-xs text-muted">{responses}件回答</span>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={p.is_admin}
            disabled={pending || isSelf}
            onChange={(e) => run(() => setMemberAdmin(p.id, e.target.checked), undefined, () => router.refresh())}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          管理者
        </label>
        <Msg msg={msg} />
      </div>
    </li>
  );
}
