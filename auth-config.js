// =====================================================
// 百货小店 · Linux DO OAuth 配置
// 上线前需要把下面两项填好（按 SETUP.md 步骤获取）
// =====================================================

window.AUTH_CONFIG = {
  // 1. 在 https://connect.linux.do/ 后台创建 OAuth 应用后获得
  //    Client Type 选 "Confidential"
  //    Redirect URI 必须填: https://nestahedrington-lab.github.io/zhongzhuan-zhijia/callback.html
  clientId: "oHFl7zTDITlYhnQx06MME78c9UkiAy4T",

  // 2. 你部署 Cloudflare Worker 后得到的 URL（不要带末尾斜杠）
  //    示例: https://baihuo-shop-auth.your-subdomain.workers.dev
  workerUrl: "https://baihuo-shop-auth.nestahedrington-lab.workers.dev",

  // ---------- 以下保持默认即可 ----------
  authorizeUrl: "https://connect.linux.do/oauth2/authorize",
  redirectUri:
    location.origin +
    location.pathname.replace(/[^/]*$/, "") +
    "callback.html",
  scope: "openid profile email",
};
