# Builds the two Supabase auth email templates from one layout so they always share the site's look.
# Usage: python3 supabase/templates/_base.py
import pathlib

HERE = pathlib.Path(__file__).parent
def link(kind="email"):
    return "{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=" + kind
SERIF = "'Shippori Mincho','Hiragino Mincho ProN','Yu Mincho','YuMincho','Songti SC',serif"
SANS = "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic','PingFang SC',sans-serif"

def page(eyebrow, title, lead, button, steps, ps, zh, kind="email", code=False):
    LINK = link(kind)
    # one-time code for when the link opens in another browser: typed into the original tab
    CODE = f'''<tr><td style="padding:0 0 30px;">
<div style="font-family:{SANS};font-size:12px;color:#8b867c;letter-spacing:.04em;">別のブラウザが開いたら、元の画面にこのコードを入力</div>
<div style="margin-top:8px;display:inline-block;padding:10px 18px;border:1px dashed #d9d3c7;border-radius:12px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;letter-spacing:.32em;color:#171614;">{{{{ .Token }}}}</div>
</td></tr>''' if code else ""
    rows = "".join(
        f'''<tr><td style="padding:0 0 10px;font-family:{SANS};font-size:13px;line-height:1.8;color:#4a4741;">
<span style="display:inline-block;width:22px;font-family:Georgia,serif;color:#c23a2b;">{i:02d}</span>{s}</td></tr>'''
        for i, s in enumerate(steps, 1)
    )
    return f'''<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>{title.replace("<br>", "")}</title>
</head>
<body style="margin:0;padding:0;background:#f5f2eb;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f2eb;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

<tr><td style="padding:0 4px 28px;font-family:{SERIF};font-size:14px;font-weight:700;letter-spacing:.14em;color:#171614;">
バース人材 <span style="color:#8b867c;font-weight:500;">集まれ！</span></td></tr>

<tr><td style="background:#fbf9f5;border:1px solid #d9d3c7;border-radius:20px;padding:40px 32px 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:0 0 22px;"><div style="width:12px;height:12px;background:#c23a2b;font-size:0;line-height:0;">&nbsp;</div></td></tr>
<tr><td style="padding:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:.24em;color:#8b867c;text-transform:uppercase;">{eyebrow}</td></tr>
<tr><td style="padding:0 0 18px;font-family:{SERIF};font-size:26px;line-height:1.45;font-weight:700;letter-spacing:.06em;color:#171614;">{title}</td></tr>
<tr><td style="padding:0 0 28px;font-family:{SANS};font-size:14px;line-height:1.9;color:#4a4741;">{lead}</td></tr>
<tr><td style="padding:0 0 30px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="#171614" style="border-radius:999px;">
<a href="{LINK}" target="_blank" style="display:inline-block;padding:15px 34px;font-family:{SANS};font-size:15px;font-weight:700;letter-spacing:.08em;color:#f5f2eb;text-decoration:none;border-radius:999px;">{button} &rarr;</a>
</td></tr></table>
</td></tr>
{CODE}
<tr><td style="border-top:1px solid #d9d3c7;padding:22px 0 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">{rows}</table>
</td></tr>
<tr><td style="padding:14px 0 0;font-family:{SANS};font-size:12px;line-height:1.8;color:#8b867c;">{ps}</td></tr>
</table>
</td></tr>

<tr><td style="padding:22px 8px 0;font-family:{SANS};font-size:12px;line-height:1.8;color:#8b867c;">{zh}</td></tr>
<tr><td style="padding:14px 8px 0;font-family:{SANS};font-size:11px;line-height:1.8;color:#a8a296;">
ボタンが押せないときは、このURLをブラウザに貼ってください：<br>
<span style="word-break:break-all;color:#8b867c;">{LINK}</span><br><br>
このメールに心当たりがない場合は、そっと閉じてください。誰かがあなたのアドレスで乾杯しようとしただけです。<br>
&mdash; バース人材 飲み会係</td></tr>

</table>
</td></tr>
</table>
</body>
</html>
'''

magic = page(
    eyebrow="Magic Link",
    title="おかえりなさい。<br>席、あたためておきました。",
    lead="パスワードは要りません。下のボタンを押すだけでログインできます。<br>覚えるのは、乾杯の音頭だけで十分です。",
    button="ログインする",
    steps=[
        "このリンクの賞味期限は<b style=\"color:#171614;\">1時間</b>。ビールの泡より少し長持ちです。",
        "使えるのは1回だけ。おかわりが必要なら、もう一度ログイン画面からどうぞ。",
        "ボタンを押すと、ログインを頼んだ元の画面も自動でログインします。",
        "スマホで別のブラウザが開いてしまったら、上の確認コードを元の画面に入力してください。",
    ],
    ps="※ 確認コードを入力するのは、このサイトのログイン画面だけ。電話やメールでコードを聞かれても教えないでください。聞いてくる人がいたら、たぶん酔っています。",
    zh="【中文】欢迎回来！点上面的按钮就能登录，原来的页面也会自动登录。如果手机打开了别的浏览器，请在原来的页面输入上面的验证码。1 小时内有效，只能用一次。",
    code=True,
)

signup = page(
    eyebrow="Welcome",
    title="はじめまして。<br>乾杯の準備はできています。",
    lead="バース人材の飲み会へようこそ。下のボタンでメールアドレスを確認したら登録完了です。<br>次からは、メールアドレスとパスワードでログインできます。",
    button="登録して入る",
    steps=[
        "リンクの有効期限は<b style=\"color:#171614;\">1時間</b>。冷めないうちにどうぞ。",
        "表示名はマイページでいつでも変えられます。あだ名もOK、本名もOK。",
        "別のブラウザが開いてしまったら、上の確認コードを元の画面に入力してもOK。",
    ],
    ps="※ パスワードを忘れても大丈夫。ログイン画面の「パスワードを忘れた方」から、いつでも再設定できます。",
    zh="【中文】欢迎加入！点上面的按钮确认邮箱即可完成注册（也可以在原来的页面输入上面的验证码）。链接 1 小时内有效。",
    code=True,
)

reset = page(
    eyebrow="Reset Password",
    title="パスワード、<br>忘れちゃいましたか。",
    lead="大丈夫、よくあることです。乾杯の回数を忘れるのと同じくらい。<br>下のボタンから、新しいパスワードを設定してください。",
    button="パスワードを再設定する",
    steps=[
        "このリンクの有効期限は<b style=\"color:#171614;\">1時間</b>。",
        "新しいパスワードは8文字以上でお願いします。",
        "設定が終わると、そのままログインした状態になります。",
    ],
    ps="※ 再設定を頼んだ覚えがない場合は、このメールを無視してください。パスワードは変わりません。",
    zh="【中文】点上面的按钮即可设置新密码（链接 1 小时内有效）。如果不是你本人操作，请忽略这封邮件。",
    kind="recovery",
)

(HERE / "magic-link.html").write_text(magic, encoding="utf-8")
(HERE / "reset-password.html").write_text(reset, encoding="utf-8")
(HERE / "confirm-signup.html").write_text(signup, encoding="utf-8")
print("written")
