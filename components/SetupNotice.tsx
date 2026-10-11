export default function SetupNotice() {
  return (
    <div className="mb-10 rounded-xl border border-dashed border-accent p-4 text-sm text-ink-2">
      Supabase が未設定です。<code>.env.local</code> に <code>NEXT_PUBLIC_SUPABASE_URL</code> と{" "}
      <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> を設定してください。
    </div>
  );
}
