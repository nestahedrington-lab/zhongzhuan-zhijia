// =====================================================
// 百货小店 · 轻量交互
// =====================================================

(function () {
  "use strict";

  const I18N = {
    zh: {
      brandName: "百货小店",
      ldcNav: "LDC Nav",
      heroTitle: "Welcome to 百货小店",
      heroSub: "面向 Linux DO 生态的虚拟商品小店",
      visitorLabel: "访客",
      searchPlaceholder: "搜索商品...",
      catAll: "全部",
      sortDefault: "默认",
      sortStock: "库存",
      sortSold: "销量",
      sortPriceAsc: "价格 ↑",
      sortPriceDesc: "价格 ↓",
      productsTitle: "商品列表",
      resultBadge: (n) => `${n} 个结果`,
      emptyTitle: "暂无商品",
      emptySub: "店铺正在筹备中，商品上架后将在此展示。",
      pageInfo: (p, t) => `第 ${p} 页 / 共 ${t} 页`,
      pagePrev: "上一页",
      pageNext: "下一页",
      footerText:
        "Built for Linux DO ecosystem. Not an official service. Developed by chatgpt.org.uk.",
      mbnHome: "首页",
      mbnNav: "LDC Nav",
      signInBtn: "登录",
      langLabel: "中",
      toastSignin: "登录功能即将开放",
      toastNav: "LDC Nav 即将上线",
      toastVersion: "百货小店 · v1.4.1",
      toastEmpty: "店铺暂无商品可供搜索",
      logoutLabel: "退出登录",
      trustLabel: "信任等级",
      toastLoginConfig: "登录功能未配置，请先填写 Client ID / Worker URL",
      toastLoginRedirect: "正在跳转到 Linux DO 授权页...",
      toastLoginFail: "登录失败：",
      toastLogout: "已退出登录",
    },
    en: {
      brandName: "百货小店",
      ldcNav: "LDC Nav",
      heroTitle: "Welcome to 百货小店",
      heroSub: "A virtual goods shop for the Linux DO ecosystem",
      visitorLabel: "Visitors",
      searchPlaceholder: "Search products...",
      catAll: "All",
      sortDefault: "Default",
      sortStock: "Stock",
      sortSold: "Sold",
      sortPriceAsc: "Price ↑",
      sortPriceDesc: "Price ↓",
      productsTitle: "Explore products",
      resultBadge: (n) => `${n} results`,
      emptyTitle: "No products yet",
      emptySub: "The shop is being prepared. Products will appear here soon.",
      pageInfo: (p, t) => `Page ${p} / ${t}`,
      pagePrev: "Prev",
      pageNext: "Next",
      footerText:
        "Built for Linux DO ecosystem. Not an official service. Developed by chatgpt.org.uk.",
      mbnHome: "Home",
      mbnNav: "LDC Nav",
      signInBtn: "Sign in",
      langLabel: "EN",
      toastSignin: "Sign in is coming soon",
      toastNav: "LDC Nav is coming soon",
      toastVersion: "百货小店 · v1.4.1",
      toastEmpty: "No products to search yet",
      logoutLabel: "Sign out",
      trustLabel: "Trust Level",
      toastLoginConfig:
        "Login is not configured. Set Client ID / Worker URL first.",
      toastLoginRedirect: "Redirecting to Linux DO authorization...",
      toastLoginFail: "Login failed: ",
      toastLogout: "Signed out",
    },
  };

  // ---------- State ----------
  const STORAGE_KEYS = {
    theme: "theme",
    lang: "lang",
    visitors: "visitor-count",
    visited: "visitor-marked",
  };

  let lang = localStorage.getItem(STORAGE_KEYS.lang) || "en";
  if (!I18N[lang]) lang = "en";

  // ---------- Helpers ----------
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function showToast(msg) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  // ---------- Theme ----------
  function getTheme() {
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  }

  function setTheme(theme) {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }

  function toggleTheme() {
    setTheme(getTheme() === "dark" ? "light" : "dark");
  }

  // ---------- i18n ----------
  function applyLang() {
    const t = I18N[lang];
    const set = (sel, val) => {
      const el = $(sel);
      if (el) el.textContent = val;
    };
    const setAttr = (sel, attr, val) => {
      const el = $(sel);
      if (el) el.setAttribute(attr, val);
    };

    document.documentElement.setAttribute(
      "lang",
      lang === "zh" ? "zh-CN" : "en",
    );
    document.title = t.brandName;

    set(".brand-name", t.brandName);
    set(".header-nav a", t.ldcNav);
    set(".hero-title", t.heroTitle);
    set(".hero-sub", t.heroSub);
    set(".visitor-label", t.visitorLabel);
    setAttr("#search-input", "placeholder", t.searchPlaceholder);
    set('.category-btn[data-cat="all"]', t.catAll);
    set('.sort-btn[data-sort="default"]', t.sortDefault);
    set('.sort-btn[data-sort="stock"]', t.sortStock);
    set('.sort-btn[data-sort="sold"]', t.sortSold);
    set('.sort-btn[data-sort="price-asc"]', t.sortPriceAsc);
    set('.sort-btn[data-sort="price-desc"]', t.sortPriceDesc);
    set(".products-title", t.productsTitle);
    set(".empty-title", t.emptyTitle);
    set(".empty-sub", t.emptySub);
    set(".page-label", t.pageInfo(1, 1));
    const pageBtns = $$(".page-btn");
    if (pageBtns[0]) pageBtns[0].textContent = t.pagePrev;
    if (pageBtns[1]) pageBtns[1].textContent = t.pageNext;
    set(".footer-text", t.footerText);
    set('.mbn-item[data-mbn="home"] span', t.mbnHome);
    set('.mbn-item[data-mbn="nav"] span', t.mbnNav);
    set(".signin-btn", t.signInBtn);
    set(".lang-label", t.langLabel);
    set("[data-logout-label]", t.logoutLabel);
    set("[data-trust-label]", t.trustLabel);

    // Update result badge with current count
    const badge = $("#result-badge");
    if (badge) badge.textContent = t.resultBadge(0);

    // Position the active category thumb after lang change (text width changes)
    requestAnimationFrame(updateCategoryThumb);
  }

  function toggleLang() {
    lang = lang === "en" ? "zh" : "en";
    localStorage.setItem(STORAGE_KEYS.lang, lang);
    applyLang();
  }

  // ---------- Category thumb ----------
  function updateCategoryThumb() {
    const active = $(".category-btn.active");
    const thumb = $(".category-thumb");
    if (!active || !thumb) return;
    const parent = thumb.parentElement;
    const parentRect = parent.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    thumb.style.left = rect.left - parentRect.left + "px";
    thumb.style.width = rect.width + "px";
  }

  // ---------- Sort ----------
  function bindSort() {
    $$(".sort-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".sort-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }

  // ---------- Category ----------
  function bindCategory() {
    $$(".category-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(".category-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        updateCategoryThumb();
      });
    });
  }

  // ---------- Search ----------
  function bindSearch() {
    const input = $("#search-input");
    if (!input) return;
    let timer;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const value = input.value.trim();
        if (value) {
          showToast(I18N[lang].toastEmpty);
        }
      }, 600);
    });
  }

  // ---------- Visitor count ----------
  function bumpVisitor() {
    const stored = parseInt(localStorage.getItem(STORAGE_KEYS.visitors), 10);
    const visited = sessionStorage.getItem(STORAGE_KEYS.visited);
    let count = isNaN(stored) ? Math.floor(Math.random() * 30) + 10 : stored;
    if (!visited) {
      count += 1;
      sessionStorage.setItem(STORAGE_KEYS.visited, "1");
    }
    localStorage.setItem(STORAGE_KEYS.visitors, String(count));
    const el = $("#visitor-count");
    if (el) el.textContent = String(count);
  }

  // ---------- Auth UI ----------
  function getDisplayName(user) {
    return user.name || user.username || "Linux DO";
  }

  function fillUserUI(user) {
    const t = I18N[lang];
    $$("[data-user-avatar]").forEach((el) => {
      if (user.avatar_url) {
        el.src = user.avatar_url;
      }
    });
    $$("[data-user-name]").forEach((el) => {
      el.textContent = getDisplayName(user);
    });
    $$("[data-user-email]").forEach((el) => {
      el.textContent = user.email || (user.username ? "@" + user.username : "");
    });
    $$("[data-user-trust]").forEach((el) => {
      el.textContent =
        user.trust_level !== undefined && user.trust_level !== null
          ? "Lv " + user.trust_level
          : "—";
    });
    void t;
  }

  function renderAuthUI() {
    const signinBtn = $(".signin-btn");
    const userMenu = $("[data-user-menu]");
    if (!signinBtn || !userMenu) return;

    const user = window.LDCAuth && window.LDCAuth.getUser();
    if (user) {
      signinBtn.hidden = true;
      userMenu.hidden = false;
      fillUserUI(user);
    } else {
      signinBtn.hidden = false;
      userMenu.hidden = true;
      userMenu.classList.remove("open");
    }
  }

  async function handleSignIn() {
    if (!window.LDCAuth) {
      showToast(I18N[lang].toastLoginConfig);
      return;
    }
    try {
      showToast(I18N[lang].toastLoginRedirect);
      await window.LDCAuth.login();
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      if (msg === "CLIENT_ID_NOT_SET" || msg === "WORKER_URL_NOT_SET") {
        showToast(I18N[lang].toastLoginConfig);
      } else {
        showToast(I18N[lang].toastLoginFail + msg);
      }
    }
  }

  function handleLogout() {
    if (window.LDCAuth) window.LDCAuth.logout();
    renderAuthUI();
    showToast(I18N[lang].toastLogout);
  }

  function bindUserMenu() {
    const trigger = $('[data-action="user-trigger"]');
    const menu = $("[data-user-menu]");
    if (!trigger || !menu) return;

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle("open");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target)) {
        menu.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        menu.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }
    });

    const logoutBtn = $('[data-action="logout"]');
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  }

  // ---------- Bind buttons ----------
  function bindActions() {
    const themeBtn = $('[data-action="theme"]');
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

    const langBtn = $('[data-action="lang"]');
    if (langBtn) langBtn.addEventListener("click", toggleLang);

    const signinBtn = $('[data-action="signin"]');
    if (signinBtn) signinBtn.addEventListener("click", handleSignIn);

    const ldcNav = $('[data-action="ldc-nav"]');
    if (ldcNav)
      ldcNav.addEventListener("click", (e) => {
        e.preventDefault();
        showToast(I18N[lang].toastNav);
      });

    const versionLink = $('[data-action="version"]');
    if (versionLink)
      versionLink.addEventListener("click", (e) => {
        e.preventDefault();
        showToast(I18N[lang].toastVersion);
      });

    $$(".mbn-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const target = item.getAttribute("data-mbn");
        if (target === "home") return; // 默认行为
        e.preventDefault();
        $$(".mbn-item").forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
        showToast(I18N[lang].toastNav);
      });
    });
  }

  // ---------- Init ----------
  function init() {
    applyLang();
    bindActions();
    bindSort();
    bindCategory();
    bindSearch();
    bindUserMenu();
    bumpVisitor();
    renderAuthUI();
    requestAnimationFrame(updateCategoryThumb);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("resize", () => {
    requestAnimationFrame(updateCategoryThumb);
  });
})();
