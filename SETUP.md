# 百货小店 · 上线部署指南

5 步即可让 Linux DO 授权登录跑起来。预计耗时 10–15 分钟。

---

## Step 1 · 在 Linux DO Connect 注册 OAuth 应用

1. 打开 https://connect.linux.do/ 并登录你的账号
2. 进入"我的应用 / Applications"，点击新建应用
3. 填表：
   - **应用名称**：百货小店
   - **Client Type**：`Confidential`（不是 Public）
   - **Redirect URI**：
     ```
     https://nestahedrington-lab.github.io/zhongzhuan-zhijia/callback.html
     ```
   - **Scopes**：勾选 `openid`、`profile`、`email`
4. 创建后记录两个值：
   - `Client ID` —— 公开值，会写入前端 `auth-config.js`
   - `Client Secret` —— **绝密**，只能写入 Cloudflare Worker 环境变量

> 本地调试也想能登录？把 `http://localhost:4567/callback.html` 也加进 Redirect URI 列表（多个用换行或逗号分隔，按 LDC 后台支持的方式）。

---

## Step 2 · 部署 Cloudflare Worker（持有 Client Secret）

```bash
# 1. 安装 wrangler（一次性）
npm i -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 进入 worker 目录部署
cd /Users/wangjun/Desktop/中转之家/site/worker
wrangler deploy

# 4. 设置 secret（按提示粘贴值，不会回显）
wrangler secret put LDC_CLIENT_ID
wrangler secret put LDC_CLIENT_SECRET
```

部署完成后控制台会输出 Worker URL，形如：

```
https://baihuo-shop-auth.<your-subdomain>.workers.dev
```

把这个 URL 复制下来。

---

## Step 3 · 填配置

打开 `site/auth-config.js`，替换两处占位：

```js
window.AUTH_CONFIG = {
  clientId: "你的 Client ID",
  workerUrl: "https://baihuo-shop-auth.your-subdomain.workers.dev",
  // ... 其余保持不变
};
```

---

## Step 4 · 推送上线

```bash
cd /Users/wangjun/Desktop/中转之家/site
git add .
git commit -m "feat: replicate LDC Shop layout + Linux DO OAuth login"
git push origin main
```

GitHub Pages 几秒后会刷新，访问：

```
https://nestahedrington-lab.github.io/zhongzhuan-zhijia/
```

点 Sign in → 跳到 Linux DO → 同意授权 → 跳回 callback.html → 回到首页时右上角已显示头像 + 用户名。

---

## Step 5 · 验证 checklist

- [ ] 桌面端首屏与 https://shop.smiletoyou.me/ 视觉一致
- [ ] 移动端（< 768px）底部胶囊导航显示 Home / LDC Nav
- [ ] 点 Sign in → 跳转到 connect.linux.do 授权页
- [ ] 授权后回调页显示"欢迎，{用户名}"，2 秒自动回首页
- [ ] 首页右上角变为头像 + 用户名（不再是 Sign in 按钮）
- [ ] 点头像出菜单，显示昵称、邮箱、Trust Level、退出登录按钮
- [ ] 点退出登录后回到 Sign in 按钮态
- [ ] 主题切换（日/月）持久化
- [ ] 语言切换 EN ⇄ 中持久化

---

## 文件结构

```
site/
├── index.html            主页
├── callback.html         OAuth 回调页
├── styles.css            完整样式
├── app.js                主页交互（主题/语言/排序/搜索/用户菜单）
├── auth.js               OAuth 前端模块（PKCE / state）
├── auth-config.js        ← 上线前必填
├── assets/
└── worker/
    ├── oauth.js          Cloudflare Worker（持有 secret，做 token 交换）
    └── wrangler.toml     部署配置
```

---

## 安全说明

- `Client Secret` 只存在于 Cloudflare Worker 的 secret 中（不在代码、不在 git、不在前端）
- Worker 用 `ALLOWED_ORIGINS` 白名单限制只有你的 GH Pages 站和本地预览能调用
- PKCE + state 防止授权码拦截和 CSRF
- 前端 localStorage 仅存非敏感字段（用户名/头像/trust_level/email），**不存 access_token**
- 退出登录会清空 localStorage 中的用户信息

---

## 故障排查

**问题：点 Sign in 后报 `redirect_uri_mismatch`**
→ Linux DO 后台填的 Redirect URI 必须和 `auth-config.js` 计算出的完全一致（连协议/末尾斜杠都要一样）。打开浏览器控制台，看跳转 URL 中的 `redirect_uri` 参数与 LDC 后台对比。

**问题：回调页报 `token_exchange_failed`**
→ Worker 那边 secret 没设对。重新执行 `wrangler secret put LDC_CLIENT_ID` 和 `wrangler secret put LDC_CLIENT_SECRET`。

**问题：报 `state_mismatch`**
→ 通常是浏览器禁用了 sessionStorage，或者你在多个 tab 同时点了 Sign in。关掉其他 tab 再试。

**问题：头像不显示**
→ 检查 LDC userinfo 返回的 `avatar_url` 字段值，浏览器控制台 Network 看 `/token` 响应。
