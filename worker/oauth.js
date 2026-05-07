// =====================================================
// 百货小店 · Linux DO OAuth Worker
// 持有 client_secret，做 code → token 交换 + userinfo 查询
//
// 部署 (5 步):
//   1. npm i -g wrangler
//   2. wrangler login
//   3. cd worker && wrangler deploy
//   4. 设置 secret:
//        wrangler secret put LDC_CLIENT_ID
//        wrangler secret put LDC_CLIENT_SECRET
//   5. 把控制台输出的 Worker URL 填到 ../auth-config.js -> workerUrl
// =====================================================

const TOKEN_URL = "https://connect.linux.do/oauth2/token";
const USERINFO_URL = "https://connect.linux.do/api/user";

// 允许调用此 Worker 的前端域名（防止他人盗用你的 client_secret）
const ALLOWED_ORIGINS = [
  "https://nestahedrington-lab.github.io",
  "http://localhost:4567",
  "http://127.0.0.1:4567",
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data, init = {}, origin = "") {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
      ...(init.headers || {}),
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ---------- POST /token ----------
    // 前端把 code + code_verifier + redirect_uri 发来，换 access_token + user info
    if (url.pathname === "/token" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "invalid_json" }, { status: 400 }, origin);
      }

      const { code, code_verifier, redirect_uri } = body || {};
      if (!code || !code_verifier || !redirect_uri) {
        return json({ error: "missing_params" }, { status: 400 }, origin);
      }

      const clientId = env.LDC_CLIENT_ID;
      const clientSecret = env.LDC_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return json(
          { error: "server_misconfigured" },
          { status: 500 },
          origin,
        );
      }

      // 1) 用 code 换 token
      const tokenRes = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " + btoa(`${clientId}:${clientSecret}`),
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri,
          code_verifier,
        }).toString(),
      });

      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        return json(
          { error: "token_exchange_failed", detail: text },
          { status: 502 },
          origin,
        );
      }

      const tokenJson = await tokenRes.json();
      const accessToken = tokenJson.access_token;
      if (!accessToken) {
        return json(
          { error: "no_access_token", detail: tokenJson },
          { status: 502 },
          origin,
        );
      }

      // 2) 拿 token 调 userinfo
      const userRes = await fetch(USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!userRes.ok) {
        const text = await userRes.text();
        return json(
          { error: "userinfo_failed", detail: text },
          { status: 502 },
          origin,
        );
      }

      const user = await userRes.json();

      // 仅返回前端需要的非敏感字段
      return json(
        {
          ok: true,
          user: {
            id: user.id,
            sub: user.sub,
            username: user.username || user.login,
            name: user.name,
            email: user.email,
            avatar_url: user.avatar_url,
            trust_level: user.trust_level,
            active: user.active,
            silenced: user.silenced,
          },
        },
        {},
        origin,
      );
    }

    // ---------- 健康检查 ----------
    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ ok: true, service: "baihuo-shop-auth" }, {}, origin);
    }

    return json({ error: "not_found" }, { status: 404 }, origin);
  },
};
