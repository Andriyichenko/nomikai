# Nomikai v2 — 飲み会の「お店 × 日程」投票サイト

お店の候補と日程の候補を並べて、メンバーが「行きたいお店」と「行ける日」を選ぶだけ。管理者は票を見て決定し、回答者にメールで通知します。日本語 / 中文 対応。

---

## メンバーの使い方

1. トップの「いま募集中」から会を開く
2. **01 行きたいお店** — カードの「詳細」でメニュー・口コミ・地図を確認し、「選ぶ」（いくつでも）
3. **02 行ける日** — 参加できる日をタップ（いくつでも）
4. **03 ひとこと** — アレルギーや遅刻など（任意）
5. 画面下の **「回答を送る」**。初回だけ Google かメールのリンクでログイン（パスワード不要）。選んだ内容はログイン後もそのまま残ります。

締切までは何度でも変更・取り消しできます。決定すると会のページに日時とお店が表示され、カレンダーに追加できます。

## 管理者の使い方（/admin）

| タブ | できること |
|---|---|
| 会 | 会の作成・編集。候補のお店（並び順）、候補日（期間＋曜日でまとめて追加 → カレンダーで微調整）、締切、公開状態。回答一覧と「決定する」パネル |
| お店 | **食べログ / ホットペッパーのリンクを貼るだけで自動入力**（店名・写真・ロゴ・住所・アクセス・営業時間・予算・評価・口コミ・メニュー/コース）。取り込み後に内容を確認・修正して保存 |
| 標語・お知らせ | 開屏（スプラッシュ）とトップの標語。文字だけ入力すれば同じデザインで表示。複数を「表示中」にすると訪問ごとに切り替え |
| メンバー | 表示名の修正、管理者権限の付け外し |
| アーカイブ | 過去の会の写真と記録 |

> 取り込みは「お店のページ」のURLに対応しています（例: `https://tabelog.com/osaka/A2701/A270101/27125083/`、`https://www.hotpepper.jp/strJ001100031/`）。スマホの共有ボタンでコピーした文章を丸ごと貼っても動きます。口コミは短い抜粋＋掲載元へのリンクとして保存します。

---

## 開発

```bash
npm install
cp .env.example .env.local   # Supabase の URL と anon key を設定
npm run dev                  # http://localhost:3000
npm run typecheck && npm run lint && npm run build
```

### Supabase のセットアップ（初回のみ）

プロジェクト: `https://mqoopfdnnclhzfztdcid.supabase.co`（ダッシュボード: https://supabase.com/dashboard/project/mqoopfdnnclhzfztdcid ）

**1. スキーマ** — SQL Editor で `supabase/migrations/` のファイルを**日付順に**実行:
`20261011000000_init.sql`（済）→ `20261012000000_free_dates.sql`（日程の自由選択）→ `20261013000000_attendees.sql`（参加者・お知らせメール）

**2. 旧データの取り込み** — SQL Editor で `supabase/legacy-import.sql` を実行。
メンバー・過去の回答・アーカイブ・標語・お知らせが入り、`.env` の `ADMIN_EMAIL` のメンバーが管理者になります。
このファイルにはメールアドレスが含まれるため Git には入りません（`.gitignore` 済）。何度実行しても重複しません。

**3. Google ログイン**
- Google Cloud Console → APIs & Services → Credentials → 旧システムで使っていた OAuth クライアント（`.env` の `GOOGLE_CLIENT_ID`）を開き、
  「承認済みのリダイレクト URI」に `https://mqoopfdnnclhzfztdcid.supabase.co/auth/v1/callback` を追加
- Supabase → Authentication → Sign In / Providers → **Google** を ON にし、Client ID と Client Secret（`.env` の `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`）を貼り付け

**4. URL 設定** — Authentication → URL Configuration
- Site URL: 本番のURL（例 `https://nomikai.example.com`。未公開の間は `http://localhost:3000`）
- Redirect URLs に追加: `http://localhost:3000/**` と `https://<本番ドメイン>/**`

**5. メールログインの設定**
- Authentication → Emails → **SMTP Settings** で Custom SMTP を ON（標準の送信は1時間に数通までしか送れません）
  - Host `smtp.gmail.com` / Port `587` / Username・Password は `.env` の `EMAIL_SERVER_USER`・`EMAIL_SERVER_PASSWORD`（Gmail のアプリパスワード）/ Sender は `EMAIL_FROM`
- Authentication → Emails → **Templates** で次の2つを設定（スマホのメールアプリ内ブラウザで開いてもログインできるリンク形式になっています）

  | テンプレート | Subject | Body（ファイルの中身を丸ごと貼り付け） |
  |---|---|---|
  | Magic Link | `【バース人材】ログインリンク — 乾杯まであと1クリック` | `supabase/templates/magic-link.html` |
  | Confirm signup | `【バース人材】ようこそ！登録まであと1クリック` | `supabase/templates/confirm-signup.html` |
  | Reset Password | `【バース人材】パスワードの再設定` | `supabase/templates/reset-password.html` |

- Authentication → Sign In / Providers → **Email** が ON（パスワード登録とメールのリンク、どちらも使えます）。「Confirm email」も ON 推奨（登録時に確認メールが届きます）

  ログインと登録のメールには確認コード（`{{ .Token }}`）も入っています。スマホでリンクが別のブラウザで開いてしまっても、元の画面にコードを入れればそのままログインできます。テンプレートを更新したら、この2つを貼り直してください。

  文面を変えたいときは `supabase/templates/_base.py` を編集して `python3 supabase/templates/_base.py` で2つを再生成します（デザインは共通）。

**6. 最初の管理者** — 手順2を実行していれば、`ADMIN_EMAIL` のアドレスでログインするだけで「管理」メニューが出ます。
旧データを使わない場合は、一度ログインしてから SQL Editor で:

```sql
update public.profiles set is_admin = true where email = 'you@example.com';
```

**7. 環境変数** — ローカルは `.env.local`（`.env.example` 参照）。ホスティング先（Vercel / Amplify など）にも同じ値を設定し、
`NEXT_PUBLIC_SITE_URL` は本番URLにします。

**8. お知らせメール** — `.env.local`（本番も同じ）に `SUPABASE_SERVICE_ROLE_KEY`・`EMAIL_LINK_SECRET`・`CRON_SECRET` を設定（`.env.example` 参照）。
- 回答したとき → 本人に「回答受付」メール
- 管理画面で「決定」→ その日に◯をつけた人へ「決定」メール（自動で参加者に登録）、それ以外の回答者へ「お誘い」メール（ボタンひとつで参加／見送り、ログイン不要）
- 当日の朝 8:00 → 参加者へ「本日」メール。`.github/workflows/day-of-reminder.yml` が `/api/cron/day-of` を呼びます。GitHub の Secrets に `SITE_URL`（公開URL）と `CRON_SECRET` を登録してください
- 手動で確認: `curl -H "Authorization: Bearer $CRON_SECRET" "$SITE_URL/api/cron/day-of?dry=1"`（送信せずに対象だけ表示）

**9. 自動停止の防止** — 無料プランは7日間アクセスがないと一時停止します。`.github/workflows/supabase-keepalive.yml` が毎日 9:17（JST）に1回データベースへ問い合わせます。
- GitHub → リポジトリ → Settings → Secrets and variables → Actions に
  `SUPABASE_URL`（`https://mqoopfdnnclhzfztdcid.supabase.co`）と `SUPABASE_ANON_KEY`（`.env.local` の `NEXT_PUBLIC_SUPABASE_ANON_KEY`）を登録
- スケジュール実行は **デフォルトブランチ（main）にあるワークフローだけ** が動きます。マージ後、Actions タブから「Run workflow」で一度手動実行して成功を確認
- 失敗するとGitHubからメールが届きます（多くはプロジェクトが既に停止している状態 → ダッシュボードで Restore）
- GitHub はリポジトリに60日間コミットがないとスケジュール実行を止めます。止まった場合は Actions タブで再度有効化してください

### 旧システム（v1）からのデータ移行（参考）

`scripts/legacy-to-sql.mjs` が v1 のエクスポートJSON（`scripts/export-legacy.mjs`）を v2 用のSQLに変換します。旧メンバーは同じメールアドレスでログインすると、過去の回答ごと自動で引き継がれます。
