// =====================================================
// 百货小店 · OAuth 前端模块
// PKCE + state 防 CSRF · 与 Worker 后端配合
// =====================================================

(function () {
  "use strict";

  const STORAGE_KEYS = {
    pkceVerifier: "ldc.pkce.verifier",
    oauthState: "ldc.oauth.state",
    user: "ldc.user",
  };

  // ---------- PKCE / utils ----------
  function randomString(len) {
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    let out = "";
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    for (let i = 0; i < arr.length; i++) {
      out += chars[arr[i] % chars.length];
    }
    return out;
  }

  function base64UrlEncode(buffer) {
    const bytes = new Uint8Array(buffer);
    let str = "";
    for (let i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return btoa(str)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  async function sha256(input) {
    const data = new TextEncoder().encode(input);
    return await crypto.subtle.digest("SHA-256", data);
  }

  async function buildPkce() {
    const verifier = randomString(64);
    const challenge = base64UrlEncode(await sha256(verifier));
    return { verifier, challenge };
  }

  // ---------- Storage ----------
  function setUser(user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.user);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function clearUser() {
    localStorage.removeItem(STORAGE_KEYS.user);
  }

  // ---------- Public API ----------
  async function login() {
    const cfg = window.AUTH_CONFIG;
    if (!cfg) throw new Error("AUTH_CONFIG missing");
    if (!cfg.clientId || cfg.clientId.startsWith("REPLACE_ME")) {
      throw new Error("CLIENT_ID_NOT_SET");
    }

    const { verifier, challenge } = await buildPkce();
    const state = randomString(24);

    sessionStorage.setItem(STORAGE_KEYS.pkceVerifier, verifier);
    sessionStorage.setItem(STORAGE_KEYS.oauthState, state);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      scope: cfg.scope,
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    location.href = `${cfg.authorizeUrl}?${params.toString()}`;
  }

  async function handleCallback() {
    const cfg = window.AUTH_CONFIG;
    if (!cfg) throw new Error("AUTH_CONFIG missing");

    const url = new URL(location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const err = url.searchParams.get("error");

    if (err) {
      throw new Error(
        `OAuth provider error: ${err} ${url.searchParams.get("error_description") || ""}`,
      );
    }
    if (!code) throw new Error("no_code");

    const expectedState = sessionStorage.getItem(STORAGE_KEYS.oauthState);
    const verifier = sessionStorage.getItem(STORAGE_KEYS.pkceVerifier);
    sessionStorage.removeItem(STORAGE_KEYS.oauthState);
    sessionStorage.removeItem(STORAGE_KEYS.pkceVerifier);

    if (!state || state !== expectedState) throw new Error("state_mismatch");
    if (!verifier) throw new Error("verifier_missing");

    if (!cfg.workerUrl || cfg.workerUrl.startsWith("REPLACE_ME")) {
      throw new Error("WORKER_URL_NOT_SET");
    }

    const res = await fetch(cfg.workerUrl.replace(/\/$/, "") + "/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        code_verifier: verifier,
        redirect_uri: cfg.redirectUri,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`token_exchange_failed (${res.status}): ${detail}`);
    }
    const data = await res.json();
    if (!data.ok || !data.user) throw new Error("invalid_response");

    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearUser();
  }

  function isLoggedIn() {
    return !!getUser();
  }

  window.LDCAuth = {
    login,
    logout,
    handleCallback,
    isLoggedIn,
    getUser,
  };
})();
