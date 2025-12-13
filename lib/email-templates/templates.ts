export const emailTemplates = [
  {
    id: "welcome",
    name: "新規登録 (Welcome)",
    subject: "【バース人材】登録完了のお知らせ",
    body: `
<div style="font-family: sans-serif; color: #333; line-height: 1.6;">
  <div style="background-color: #1e3820; padding: 20px; text-align: center;">
    <h1 style="color: #fff; margin: 0;">Welcome to Nomikai</h1>
  </div>
  <div style="padding: 30px;">
    <h2>登録ありがとうございます</h2>
    <p>バース人材の飲み会予約システムへようこそ。</p>
    <p>これから開催されるイベントの情報をいち早くお届けします。</p>
    <br>
    <div style="text-align: center;">
      <a href="{{site_url}}/login" style="background-color: #ff0072; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">ログインして確認</a>
    </div>
  </div>
  <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
    &copy; 2025 バース人材
  </div>
</div>
`
  },
  {
    id: "notice",
    name: "一般通知 (General Notice)",
    subject: "【お知らせ】重要なお知らせ",
    body: `
<div style="font-family: sans-serif; color: #333; line-height: 1.6;">
  <div style="border-bottom: 2px solid #1e3820; padding-bottom: 10px; margin-bottom: 20px;">
    <h2 style="color: #1e3820; margin: 0;">お知らせ</h2>
  </div>
  <div style="padding: 10px;">
    <p>いつもご利用ありがとうございます。</p>
    <p>以下のお知らせをご確認ください。</p>
    
    <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #ff0072; margin: 20px 0;">
      <h3>ここにタイトルを入力</h3>
      <p>ここに詳細な内容を入力してください...</p>
    </div>

    <p>今後ともよろしくお願いいたします。</p>
  </div>
  <div style="margin-top: 30px; font-size: 12px; color: #999;">
    バース人材 運営チーム
  </div>
</div>
`
  },
  {
    id: "reminder",
    name: "イベントリマインダー (Reminder)",
    subject: "【リマインダー】明日の飲み会について",
    body: `
<div style="font-family: sans-serif; color: #333;">
  <h2 style="color: #ff0072;">明日は飲み会です！</h2>
  <p>ご参加予定の皆様へ、明日のイベントのリマインダーをお送りします。</p>
  
  <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
    <tr>
      <td style="padding: 10px; background: #eee; width: 100px; font-weight: bold;">日時</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">2025年3月29日 19:00~</td>
    </tr>
    <tr>
      <td style="padding: 10px; background: #eee; width: 100px; font-weight: bold;">場所</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">渋谷区〇〇</td>
    </tr>
  </table>

  <p>遅れる場合はご連絡ください。</p>
  <p>当日お会いできるのを楽しみにしています！</p>
</div>
`
  }
];
