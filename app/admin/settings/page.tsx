import TaglineManager from "@/components/admin/TaglineManager";
import SettingsForm from "@/components/admin/SettingsForm";
import { getSettings, getTaglines } from "@/lib/data";

export default async function AdminSettings() {
  const [taglines, settings] = await Promise.all([getTaglines(false), getSettings()]);
  return (
    <div className="space-y-16">
      <section>
        <header className="mb-6">
          <h2 className="font-serif text-lg font-bold tracking-[0.1em]">開屏の標語</h2>
          <p className="mt-1 text-sm text-muted">文字だけを変えれば、デザインはすべて同じスタイルで表示されます。表示中が複数ある場合は訪問ごとに切り替わります。</p>
        </header>
        <TaglineManager items={taglines} />
      </section>
      <section>
        <header className="mb-6">
          <h2 className="font-serif text-lg font-bold tracking-[0.1em]">サイト設定・お知らせ</h2>
        </header>
        <SettingsForm initial={settings} />
      </section>
    </div>
  );
}
