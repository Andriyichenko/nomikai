export const translations = {
  ja: {
    // Navigation
    nav: {
      notice: "お知らせ",
      contact: "連絡先",
      myPage: "マイページ (My Page)",
      admin: "管理画面 (Admin)",
      logout: "ログアウト",
      login: "ログイン / 新規登録",
      loginMsg: "ログインして予約を管理",
      archiveEvents: "過去のイベント" // New
    },
    // Form
    form: {
      name: "お名前",
      email: "メールアドレス",
      dates: "参加可能な日程 (複数選択可)",
      datesPlaceholder: "左側のカレンダーから参加可能な日付をタップしてください",
      message: "メッセージ (任意)",
      messagePlaceholder: "ご質問やアレルギー等ございましたらご記入ください",
      submit: "予約内容を保存する",
      submitting: "送信中...",
      successTitle: "送信完了！",
      successMsg: "予約情報が更新されました。",
      checkBtn: "内容を確認・修正",
      homeBtn: "トップへ戻る",
      error: "エラーが発生しました。",
      nameReq: "お名前は必須です",
      emailReq: "有効なメールアドレスを入力してください",
      datesReq: "参加可能な日程を少なくとも1つ選択してください",
      selectEventDate: "日程を選択" // New
    },
    // Auth
    auth: {
      loginTitle: "ログイン",
      registerTitle: "新規アカウント登録",
      welcomeBack: "Welcome Back",
      createNew: "Create New Account",
      googleLogin: "Googleでログイン",
      or: "または",
      password: "パスワード",
      passwordConfirm: "パスワード (確認)",
      forgotPass: "パスワードを忘れた方",
      sendCode: "認証コードを送信",
      codeSent: "認証コードを送信しました",
      loginBtn: "ログイン",
      registerBtn: "登録してログイン",
      haveAccount: "すでにアカウントをお持ちの方は",
      noAccount: "アカウントをお持ちでない方は",
      toLogin: "ログイン",
      toRegister: "新規登録",
      code: "認証コード (6桁)",
      invalidCode: "無効な認証コード", // New
      loginError: "ログインに失敗しました", // New
      passMismatch: "パスワードが一致しません", // New
      passTooShort: "パスワードは8文字以上必要です", // New
      passWeak: "パスワードの要件を満たしていません", // New
      regFailed: "登録に失敗しました", // New
      userExists: "ユーザーはすでに存在します", // New
    },
    // Admin (Partial - to be fully translated if needed)
    admin: {
      management: "管理",
      reservations: "予約",
      users: "ユーザー",
      notice: "お知らせ",
      email: "メール",
      design: "デザイン",
      archive: "過去ログ",
      projects: "予約管理", // New
    }
  },
  cn: {
    // Navigation
    nav: {
      notice: "活动公告",
      contact: "联系我们",
      myPage: "我的主页",
      admin: "管理后台",
      logout: "退出登录",
      login: "登录 / 注册",
      loginMsg: "登录以管理预约",
      archiveEvents: "往期活动"
    },
    // Form
    form: {
      name: "姓名",
      email: "电子邮箱",
      dates: "参加日期 (可多选)",
      datesPlaceholder: "请点击左侧日历选择您方便的日期",
      message: "留言 (可选)",
      messagePlaceholder: "如有忌口或问题请在此留言...",
      submit: "保存预约信息",
      submitting: "提交中...",
      successTitle: "提交成功！",
      successMsg: "预约信息已更新。",
      checkBtn: "查看/修改内容",
      homeBtn: "返回首页",
      error: "发生错误，请重试。",
      nameReq: "请输入姓名",
      emailReq: "请输入有效的邮箱地址",
      datesReq: "请至少选择一个日期",
      selectEventDate: "选择活动日期"
    },
    // Auth
    auth: {
      loginTitle: "登录",
      registerTitle: "注册新账号",
      welcomeBack: "欢迎回来",
      createNew: "创建新账号",
      googleLogin: "使用 Google 登录",
      or: "或",
      password: "密码",
      passwordConfirm: "确认密码",
      forgotPass: "忘记密码？",
      sendCode: "发送验证码",
      codeSent: "验证码已发送",
      loginBtn: "登录",
      registerBtn: "注册并登录",
      haveAccount: "已有账号？",
      noAccount: "还没有账号？",
      toLogin: "去登录",
      toRegister: "去注册",
      code: "验证码 (6位)",
      invalidCode: "验证码无效或已过期",
      loginError: "登录失败",
      passMismatch: "两次密码不一致",
      passTooShort: "密码至少8个字符",
      passWeak: "密码需包含字母和数字，8-16位",
      regFailed: "注册失败",
      userExists: "用户已存在",
    },
    // Admin
    admin: {
      management: "管理",
      reservations: "预约",
      users: "用户",
      notice: "公告",
      email: "邮件",
      design: "设计",
      archive: "往期活动",
      projects: "预约项目",
    }
  }
};

export type Language = "ja" | "cn";
export type Translation = typeof translations.ja;
