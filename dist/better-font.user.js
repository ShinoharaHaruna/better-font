// ==UserScript==
// @name         Better Font Renderer
// @namespace    https://github.com/ShinoharaHaruna/better-font
// @version      0.6.0
// @license      MIT
// @description  Force consistent fonts & code styling with per-site overrides
// @author       Shinohara Haruna
// @match        *://*/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
  "use strict";
  const zh = {
    title: "Better Font 设置",
    language: "界面语言",
    languageAuto: "自动（跟随浏览器）",
    fontFamily: "全局 font-family",
    fontFamilyHint: "示例: 'PingFang SC','Microsoft YaHei',sans-serif",
    fontWeight: "全局 font-weight",
    shadowRadius: "text-shadow 半径",
    shadowColor: "text-shadow 颜色",
    codeFontFamily: "代码块 font-family",
    codeFontFamilyPlaceholder: "'Fira Code','monospace'",
    codeFontWeight: "代码块 font-weight",
    whitelist: "白名单（每行一个通配符 URL，支持 * 与 ?）",
    whitelistPlaceholder: "例如：*://*.example.com/*",
    siteRules: "站点优先配置（JSON 数组，字段同上）",
    siteRulesPlaceholder: '[{"pattern":"*://*.example.com/*","fontFamily":"..."}]',
    siteRulesHint: `示例：[{ "pattern": "*://*.example.com/*", "fontFamily": "'PingFang SC'", "codeFontFamily": "'Fira Code',monospace" }]`,
    siteRulesInvalid: "站点优先配置 JSON 无法解析，请检查格式。",
    close: "关闭",
    cancel: "取消",
    save: "保存"
  };
  const en = {
    title: "Better Font Settings",
    language: "Language",
    languageAuto: "Auto (follow browser)",
    fontFamily: "Global font-family",
    fontFamilyHint: "e.g. 'PingFang SC','Microsoft YaHei',sans-serif",
    fontWeight: "Global font-weight",
    shadowRadius: "text-shadow radius",
    shadowColor: "text-shadow color",
    codeFontFamily: "Code block font-family",
    codeFontFamilyPlaceholder: "'Fira Code','monospace'",
    codeFontWeight: "Code block font-weight",
    whitelist: "Whitelist (one wildcard URL per line, * and ? supported)",
    whitelistPlaceholder: "e.g. *://*.example.com/*",
    siteRules: "Per-site overrides (JSON array, same fields as above)",
    siteRulesPlaceholder: '[{"pattern":"*://*.example.com/*","fontFamily":"..."}]',
    siteRulesHint: `e.g. [{ "pattern": "*://*.example.com/*", "fontFamily": "'PingFang SC'", "codeFontFamily": "'Fira Code',monospace" }]`,
    siteRulesInvalid: "Could not parse the per-site rules JSON. Please check the format.",
    close: "Close",
    cancel: "Cancel",
    save: "Save"
  };
  const ja = {
    title: "Better Font 設定",
    language: "表示言語",
    languageAuto: "自動（ブラウザに従う）",
    fontFamily: "グローバル font-family",
    fontFamilyHint: "例: 'PingFang SC','Microsoft YaHei',sans-serif",
    fontWeight: "グローバル font-weight",
    shadowRadius: "text-shadow の半径",
    shadowColor: "text-shadow の色",
    codeFontFamily: "コードブロックの font-family",
    codeFontFamilyPlaceholder: "'Fira Code','monospace'",
    codeFontWeight: "コードブロックの font-weight",
    whitelist: "ホワイトリスト（1行1つのワイルドカード URL、* と ? が使えます）",
    whitelistPlaceholder: "例：*://*.example.com/*",
    siteRules: "サイト別設定（JSON 配列、フィールドは上記と同じ）",
    siteRulesPlaceholder: '[{"pattern":"*://*.example.com/*","fontFamily":"..."}]',
    siteRulesHint: `例：[{ "pattern": "*://*.example.com/*", "fontFamily": "'PingFang SC'", "codeFontFamily": "'Fira Code',monospace" }]`,
    siteRulesInvalid: "サイト別設定の JSON を解析できませんでした。形式を確認してください。",
    close: "閉じる",
    cancel: "キャンセル",
    save: "保存"
  };
  const LOCALES = { zh, en, ja };
  function resolveLocale(pref) {
    if (pref === "zh" || pref === "en" || pref === "ja") return pref;
    const navs = typeof navigator !== "undefined" && Array.isArray(navigator.languages) && navigator.languages.length > 0 ? navigator.languages : [typeof navigator !== "undefined" ? navigator.language : "en"];
    for (const nav of navs) {
      const lang = (nav ?? "").toLowerCase();
      if (lang.startsWith("zh")) return "zh";
      if (lang.startsWith("ja")) return "ja";
      if (lang.startsWith("en")) return "en";
    }
    return "en";
  }
  function createTranslator(pref) {
    const messages = LOCALES[resolveLocale(pref)];
    return (key) => messages[key] ?? en[key] ?? key;
  }
  const debugLog = (...args) => {
    return;
  };
  const STORAGE_KEY = "better_font_state_v2";
  const EMOJI_FALLBACK_FONTS = "'Apple Color Emoji','Noto Color Emoji','Segoe UI Emoji','Segoe UI Symbol'";
  const ICON_FONT_EXCLUSIONS = [
    // Generic markers
    "i",
    // classic <i> icon element (also skips italic text)
    "[class*='icon']",
    // Font Awesome
    ".fa",
    ".fas",
    ".far",
    ".fab",
    ".fal",
    ".fad",
    ".fat",
    ".fass",
    "[class*='fa-']",
    // Google Material Symbols / Material Icons (singular and plural,
    // e.g. .material-symbol, .material-symbols-outlined, .material-icons)
    "[class*='material-symbol']",
    "[class*='material-icon']",
    // Google 1P icon font ("Google Symbols") used in the avatar menu and
    // One Google bar; the class name contains neither "material" nor "icon"
    "[class*='google-symbols']",
    // Material Design Icons / Material Design Iconic Font
    ".mdi",
    "[class*='mdi-']",
    ".zmdi",
    "[class*='zmdi-']",
    // Bootstrap 3 Glyphicons, Bootstrap Icons
    ".glyphicon",
    "[class*='glyphicon-']",
    ".bi",
    "[class*='bi-']",
    // iconfont.cn (Alibaba)
    ".iconfont",
    // GitHub Octicons
    ".octicon",
    "[class*='octicon-']",
    // Ionicons
    "ion-icon",
    ".ionicons",
    // WordPress Dashicons
    ".dashicons",
    "[class*='dashicons-']",
    // Elementor icons
    ".eicon",
    "[class*='eicon-']",
    // Smaller icon fonts: exact base classes only (two-letter substring
    // matches like 'ti-'/'pi-' would catch ordinary classes such as 'multi-')
    ".ti",
    // Themify
    ".wi",
    // Weather Icons
    ".la",
    // Line Awesome
    ".ai",
    // Academicons
    ".pi",
    // PrimeIcons
    ".oi",
    // Open Iconic
    ".fi",
    // Foundation Icons
    ".pe-7s",
    // Stroke 7
    ".icofont",
    ".devicon",
    ".typcn",
    // Typicons
    "[class*='uil-']",
    // Unicons
    "[class*='entypo']",
    // Attribute-marked icon systems
    "[data-cds='Icon']",
    // Claude (claude.ai) design system PUA icons
    // UI framework icon classes
    ".anticon",
    // Ant Design
    "[class*='el-icon']",
    // Element UI / Element Plus
    ".ivu-icon",
    // iView / View UI
    ".v-icon",
    // Vuetify
    ".q-icon",
    // Quasar
    ".weui-icon"
    // WeUI
  ];
  const DEFAULT_CONFIG = {
    fontFamily: "'PingFang SC','Heiti SC','Microsoft YaHei','Source Han Sans SC','Noto Sans CJK SC','sans-serif'",
    fontWeight: "bold",
    shadowRadius: 3,
    shadowColor: "#c3c3c3",
    codeFontFamily: "'Fira Code','JetBrains Mono','Consolas','Menlo','monospace'",
    codeFontWeight: "400",
    codeSelectors: [
      "code",
      "pre",
      "pre code",
      "pre *",
      "kbd",
      "samp",
      "tt",
      ".hljs",
      ".markdown-body pre",
      ".markdown-body pre *",
      ".markdown-body .highlight",
      ".markdown-body .highlight *",
      ".react-code-text",
      ".react-code-line-contents-no-virtualization",
      ".react-code-text *",
      ".react-code-line-contents-no-virtualization *",
      ".blob-code",
      ".blob-code-inner",
      ".blob-code-inner *",
      ".blob-wrapper code",
      ".blob-wrapper code *",
      ".gist .blob-code",
      ".gist .blob-code *",
      ".gist .blob-code-inner",
      ".gist .blob-code-inner *",
      ".gist .blob-num",
      ".gist .blob-num *",
      ".gist .highlight",
      ".gist .highlight *",
      ".js-file-line",
      ".js-file-line *",
      ".highlight .blob-code",
      ".highlight .blob-code *",
      ".highlight td",
      ".highlight td *"
    ]
  };
  function normalizeCodeSelectors(value) {
    if (!Array.isArray(value)) {
      if (typeof value === "string") {
        return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
      }
      return [...DEFAULT_CONFIG.codeSelectors];
    }
    return value.map((item) => typeof item === "string" ? item.trim() : "").filter((item) => item.length > 0);
  }
  function createDefaultSettings() {
    return {
      global: { ...DEFAULT_CONFIG },
      siteRules: [],
      whitelist: [],
      language: "auto"
    };
  }
  function normalizeFontConfig(raw) {
    const pickString = (value, fallback) => typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
    const clampNumber = (value, fallback) => {
      const num = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(num)) return fallback;
      return Math.min(Math.max(num, 0), 50);
    };
    return {
      fontFamily: pickString(raw?.fontFamily, DEFAULT_CONFIG.fontFamily),
      fontWeight: pickString(raw?.fontWeight, DEFAULT_CONFIG.fontWeight),
      shadowRadius: clampNumber(raw?.shadowRadius, DEFAULT_CONFIG.shadowRadius),
      shadowColor: pickString(raw?.shadowColor, DEFAULT_CONFIG.shadowColor),
      codeFontFamily: pickString(
        raw?.codeFontFamily,
        DEFAULT_CONFIG.codeFontFamily
      ),
      codeFontWeight: pickString(
        raw?.codeFontWeight,
        DEFAULT_CONFIG.codeFontWeight
      ),
      codeSelectors: normalizeCodeSelectors(raw?.codeSelectors)
    };
  }
  function normalizeSiteRule(input) {
    if (!input || typeof input !== "object") return null;
    const data = input;
    const pattern = typeof data.pattern === "string" ? data.pattern.trim() : "";
    if (!pattern) return null;
    const overrides = {};
    const pickString = (value) => {
      const trimmed = typeof value === "string" ? value.trim() : "";
      return trimmed.length > 0 ? trimmed : void 0;
    };
    const fontFamily = pickString(data.fontFamily);
    if (fontFamily) overrides.fontFamily = fontFamily;
    const fontWeight = pickString(data.fontWeight);
    if (fontWeight) overrides.fontWeight = fontWeight;
    const shadowColor = pickString(data.shadowColor);
    if (shadowColor) overrides.shadowColor = shadowColor;
    const codeFontFamily = pickString(data.codeFontFamily);
    if (codeFontFamily) overrides.codeFontFamily = codeFontFamily;
    const codeFontWeight = pickString(data.codeFontWeight);
    if (codeFontWeight) overrides.codeFontWeight = codeFontWeight;
    if (data.shadowRadius !== void 0 && data.shadowRadius !== null) {
      const num = Number(data.shadowRadius);
      if (Number.isFinite(num)) {
        overrides.shadowRadius = Math.min(Math.max(num, 0), 50);
      }
    }
    if (data.codeSelectors !== void 0 && data.codeSelectors !== null) {
      overrides.codeSelectors = normalizeCodeSelectors(data.codeSelectors);
    }
    return { pattern, ...overrides };
  }
  function normalizeSettings(input) {
    if (!input) return createDefaultSettings();
    const normalizedRules = Array.isArray(input.siteRules) ? input.siteRules.map((rule) => normalizeSiteRule(rule)).filter((rule) => Boolean(rule)) : [];
    const whitelist = Array.isArray(input.whitelist) ? input.whitelist.map((item) => typeof item === "string" ? item.trim() : "").filter((item) => item.length > 0) : [];
    return {
      global: normalizeFontConfig(input.global),
      siteRules: normalizedRules,
      whitelist,
      language: normalizeLanguagePref(input.language)
    };
  }
  function normalizeLanguagePref(value) {
    return value === "auto" || value === "zh" || value === "en" || value === "ja" ? value : "auto";
  }
  function loadSettings() {
    const stored = GM_getValue(STORAGE_KEY, null);
    if (stored) return normalizeSettings(stored);
    return createDefaultSettings();
  }
  function saveSettings(settings) {
    GM_setValue(STORAGE_KEY, settings);
  }
  function mergeFontConfig(base, override) {
    if (!override) return { ...base };
    const clampNumber = (value, fallback) => {
      const num = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(num)) return fallback;
      return Math.min(Math.max(num, 0), 50);
    };
    const next = { ...base };
    if (override.fontFamily != null) next.fontFamily = override.fontFamily;
    if (override.fontWeight != null) next.fontWeight = override.fontWeight;
    if (override.shadowColor != null) next.shadowColor = override.shadowColor;
    if (override.codeFontFamily != null)
      next.codeFontFamily = override.codeFontFamily;
    if (override.codeFontWeight != null)
      next.codeFontWeight = override.codeFontWeight;
    if (override.codeSelectors != null) {
      next.codeSelectors = normalizeCodeSelectors(override.codeSelectors);
    }
    if (override.shadowRadius != null) {
      next.shadowRadius = clampNumber(override.shadowRadius, next.shadowRadius);
    }
    return next;
  }
  function globToRegExp(pattern) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    const regex = `^${escaped.replace(/\\\*/g, ".*").replace(/\\\?/g, ".")}$`;
    return new RegExp(regex);
  }
  const globRegExpCache = /* @__PURE__ */ new Map();
  function matchPattern(url, pattern) {
    if (!pattern) return false;
    try {
      let re = globRegExpCache.get(pattern);
      if (!re) {
        re = globToRegExp(pattern);
        globRegExpCache.set(pattern, re);
      }
      return re.test(url);
    } catch {
      return false;
    }
  }
  function expandCodeSelectors(selectors) {
    const result = /* @__PURE__ */ new Set();
    for (const selector of selectors) {
      const trimmed = selector.trim();
      if (!trimmed) continue;
      result.add(trimmed);
      if (!trimmed.includes("*")) {
        result.add(`${trimmed} *`);
      }
    }
    return Array.from(result);
  }
  function appendEmojiFallback(fontFamily) {
    const lower = fontFamily.toLowerCase();
    if (lower.includes("emoji") || lower.includes("segoe ui symbol") || lower.includes("apple color emoji") || lower.includes("noto color emoji")) {
      return fontFamily;
    }
    return `${fontFamily},${EMOJI_FALLBACK_FONTS}`;
  }
  function buildCss(cfg) {
    const shadow = cfg.shadowRadius <= 0 ? "" : `text-shadow: 1px 1px ${cfg.shadowRadius}px ${cfg.shadowColor} !important;`;
    const globalFontFamily = appendEmojiFallback(cfg.fontFamily);
    const codeFontFamily = appendEmojiFallback(cfg.codeFontFamily);
    const rawCodeSelectors = cfg.codeSelectors && cfg.codeSelectors.length > 0 ? cfg.codeSelectors : DEFAULT_CONFIG.codeSelectors;
    const expandedCodeSelectors = expandCodeSelectors(rawCodeSelectors).join(",\n");
    const generalFontSelector = `:where(:not(${ICON_FONT_EXCLUSIONS.join(",")}))`;
    return `
${generalFontSelector}{
  font-family:${globalFontFamily} !important;
}
html,body{
  font-weight:${cfg.fontWeight};
}
${expandedCodeSelectors}{
  font-family:${codeFontFamily} !important;
  font-weight:${cfg.codeFontWeight} !important;
}
:where(*) {
  ${shadow}
}
`;
  }
  let injectedStyle;
  function ensureStyleAttached(cssText) {
    if (!cssText) {
      if (injectedStyle && injectedStyle.parentNode) {
        injectedStyle.remove();
        injectedStyle = null;
      }
      return;
    }
    if (injectedStyle && document.head && document.head.contains(injectedStyle)) {
      if (injectedStyle.textContent !== cssText) {
        injectedStyle.textContent = cssText;
        debugLog("Styles updated (existing tag reused).", {
          length: cssText.length
        });
      }
      return;
    }
    injectedStyle = GM_addStyle(cssText);
    debugLog("Styles injected (new tag).", { length: cssText.length });
  }
  function keepStyleAlive(getCssText) {
    let scheduled = false;
    const sync = () => {
      scheduled = false;
      ensureStyleAttached(getCssText());
    };
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(sync);
    });
    const observe = () => {
      if (!document.head) return;
      observer.observe(document.head, { childList: true });
    };
    if (document.head) observe();
    else document.addEventListener("DOMContentLoaded", observe, { once: true });
  }
  function deriveStyles(settings, url) {
    const whitelistEntry = settings.whitelist.find(
      (pattern) => matchPattern(url, pattern)
    );
    const whitelistHit = Boolean(whitelistEntry);
    const matchedRule = settings.siteRules.find(
      (rule) => matchPattern(url, rule.pattern)
    );
    const ctx = {
      url,
      whitelistHit,
      whitelistPattern: whitelistEntry ?? null,
      matchedPattern: matchedRule?.pattern ?? null
    };
    if (whitelistHit) {
      return { cssText: null, effectiveConfig: null };
    }
    const effectiveConfig = mergeFontConfig(settings.global, matchedRule);
    const css = buildCss(effectiveConfig);
    debugLog("Styles derived.", {
      ...ctx,
      usingRule: matchedRule ? "siteRule" : "global",
      codeSelectorsCount: effectiveConfig.codeSelectors.length,
      cssLength: css.length
    });
    return { cssText: css, effectiveConfig };
  }
  const FONT_WEIGHT_OPTIONS = ["normal", "400", "500", "600", "bold"];
  function el(tag, options = {}) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== void 0) node.textContent = options.text;
    if (options.attrs) {
      for (const [name, value] of Object.entries(options.attrs)) {
        node.setAttribute(name, value);
      }
    }
    if (options.children) node.append(...options.children);
    return node;
  }
  function weightOptionElements() {
    return FONT_WEIGHT_OPTIONS.map(
      (value) => el("option", { text: value, attrs: { value } })
    );
  }
  function mountSettingsUi(getState, setState) {
    const existing = document.querySelector(
      "#better-font-settings"
    );
    if (existing) return;
    const state = getState();
    const t = createTranslator(state.language);
    const css = `
#better-font-settings{position:fixed;z-index:2147483647;right:24px;top:16px;width:360px;max-height:90vh;overflow:auto;background:#fff;border-radius:12px;box-shadow:0 6px 28px rgba(0,0,0,.25);font:14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111}
#better-font-settings *{box-sizing:border-box}
#better-font-settings .hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 12px 8px;border-bottom:1px solid #eee;position:sticky;top:0;background:#fff;z-index:1}
#better-font-settings .ttl{font-weight:600}
#better-font-settings .btn{border:0;border-radius:8px;padding:6px 10px;background:#f3f4f6;color:#111;cursor:pointer}
#better-font-settings .btn.primary{background:#2563eb;color:#fff}
#better-font-settings .bd{padding:12px;display:flex;flex-direction:column;gap:12px}
#better-font-settings label{display:flex;flex-direction:column;gap:6px}
#better-font-settings input[type=text],#better-font-settings select,#better-font-settings textarea{width:100%;padding:8px 10px;border:1px solid #ddd;border-radius:8px;font:inherit}
#better-font-settings textarea{min-height:80px;resize:vertical}
#better-font-settings input[type=range]{width:100%}
#better-font-settings .row{display:flex;gap:10px;align-items:center}
#better-font-settings .row .grow{flex:1}
#better-font-settings .hint{color:#666;font-size:12px}
`;
    const style = GM_addStyle(css);
    const root = document.createElement("div");
    root.id = "better-font-settings";
    root.append(
      el("div", {
        className: "hdr",
        children: [
          el("div", { className: "ttl", text: t("title") }),
          el("button", {
            className: "btn",
            text: t("close"),
            attrs: { "data-act": "close" }
          })
        ]
      }),
      el("div", {
        className: "bd",
        children: [
          el("label", {
            children: [
              el("div", { text: t("language") }),
              el("select", {
                attrs: { "data-k": "language" },
                children: [
                  el("option", {
                    text: t("languageAuto"),
                    attrs: { value: "auto" }
                  }),
                  el("option", { text: "中文", attrs: { value: "zh" } }),
                  el("option", { text: "English", attrs: { value: "en" } }),
                  el("option", { text: "日本語", attrs: { value: "ja" } })
                ]
              })
            ]
          }),
          el("label", {
            children: [
              el("div", { text: t("fontFamily") }),
              el("input", { attrs: { type: "text", "data-k": "fontFamily" } }),
              el("div", { className: "hint", text: t("fontFamilyHint") })
            ]
          }),
          el("label", {
            children: [
              el("div", { text: t("fontWeight") }),
              el("select", {
                attrs: { "data-k": "fontWeight" },
                children: weightOptionElements()
              })
            ]
          }),
          el("label", {
            children: [
              el("div", {
                className: "row",
                children: [
                  el("div", { className: "grow", text: t("shadowRadius") }),
                  el("div", {
                    children: [
                      el("span", { attrs: { "data-k": "shadowRadiusLabel" } }),
                      "px"
                    ]
                  })
                ]
              }),
              el("input", {
                attrs: {
                  type: "range",
                  min: "0",
                  max: "20",
                  step: "1",
                  "data-k": "shadowRadius"
                }
              })
            ]
          }),
          el("label", {
            children: [
              el("div", { text: t("shadowColor") }),
              el("input", {
                attrs: {
                  type: "text",
                  "data-k": "shadowColor",
                  placeholder: "#c3c3c3"
                }
              })
            ]
          }),
          el("label", {
            children: [
              el("div", { text: t("codeFontFamily") }),
              el("input", {
                attrs: {
                  type: "text",
                  "data-k": "codeFontFamily",
                  placeholder: t("codeFontFamilyPlaceholder")
                }
              })
            ]
          }),
          el("label", {
            children: [
              el("div", { text: t("codeFontWeight") }),
              el("select", {
                attrs: { "data-k": "codeFontWeight" },
                children: weightOptionElements()
              })
            ]
          }),
          el("label", {
            children: [
              el("div", { text: t("whitelist") }),
              el("textarea", {
                attrs: {
                  "data-k": "whitelist",
                  rows: "3",
                  placeholder: t("whitelistPlaceholder")
                }
              })
            ]
          }),
          el("label", {
            children: [
              el("div", { text: t("siteRules") }),
              el("textarea", {
                attrs: {
                  "data-k": "siteRules",
                  rows: "6",
                  placeholder: t("siteRulesPlaceholder")
                }
              }),
              el("div", { className: "hint", text: t("siteRulesHint") })
            ]
          }),
          el("div", {
            className: "row",
            attrs: { style: "justify-content:flex-end" },
            children: [
              el("button", {
                className: "btn",
                text: t("cancel"),
                attrs: { "data-act": "cancel" }
              }),
              el("button", {
                className: "btn primary",
                text: t("save"),
                attrs: { "data-act": "save" }
              })
            ]
          })
        ]
      })
    );
    const q = (sel) => {
      const el2 = root.querySelector(sel);
      if (!el2) throw new Error(`Element not found: ${sel}`);
      return el2;
    };
    const { global, whitelist, siteRules } = state;
    const selLang = q('select[data-k="language"]');
    const ipFont = q('input[data-k="fontFamily"]');
    const selWeight = q('select[data-k="fontWeight"]');
    const rgShadow = q('input[data-k="shadowRadius"]');
    const lbShadow = q('span[data-k="shadowRadiusLabel"]');
    const ipColor = q('input[data-k="shadowColor"]');
    const ipCodeFont = q('input[data-k="codeFontFamily"]');
    const selCodeWeight = q('select[data-k="codeFontWeight"]');
    const taWhitelist = q('textarea[data-k="whitelist"]');
    const taSiteRules = q('textarea[data-k="siteRules"]');
    selLang.value = state.language;
    ipFont.value = global.fontFamily;
    selWeight.value = global.fontWeight;
    rgShadow.value = String(global.shadowRadius);
    lbShadow.textContent = String(global.shadowRadius);
    ipColor.value = global.shadowColor;
    ipCodeFont.value = global.codeFontFamily;
    selCodeWeight.value = global.codeFontWeight;
    taWhitelist.value = whitelist.join("\n");
    taSiteRules.value = siteRules.length > 0 ? JSON.stringify(siteRules, null, 2) : "";
    rgShadow.addEventListener("input", () => {
      lbShadow.textContent = rgShadow.value;
    });
    const close = () => {
      root.remove();
      style.remove();
    };
    function parseSiteRules(input) {
      if (!input.trim()) return [];
      try {
        const parsed = JSON.parse(input);
        if (!Array.isArray(parsed)) throw new Error("rules must be an array");
        return parsed.map((item) => normalizeSiteRule(item)).filter((item) => item !== null);
      } catch {
        window.alert(t("siteRulesInvalid"));
        return null;
      }
    }
    function parseWhitelist(input) {
      return input.split(/\n+/).map((line) => line.trim()).filter((line) => line.length > 0);
    }
    root.addEventListener("click", (e) => {
      const target = e.target;
      const act = target.getAttribute("data-act");
      if (!act) return;
      if (act === "close" || act === "cancel") {
        close();
        return;
      }
      if (act === "save") {
        const parsedRules = parseSiteRules(taSiteRules.value);
        if (parsedRules === null) return;
        const whitelistList = parseWhitelist(taWhitelist.value);
        const next = {
          global: {
            fontFamily: ipFont.value.trim() || DEFAULT_CONFIG.fontFamily,
            fontWeight: selWeight.value,
            shadowRadius: Math.max(0, Math.min(20, Number(rgShadow.value))),
            shadowColor: ipColor.value.trim() || DEFAULT_CONFIG.shadowColor,
            codeFontFamily: ipCodeFont.value.trim() || DEFAULT_CONFIG.codeFontFamily,
            codeFontWeight: selCodeWeight.value,
            codeSelectors: [...state.global.codeSelectors]
          },
          whitelist: whitelistList,
          siteRules: parsedRules,
          language: normalizeLanguagePref(selLang.value)
        };
        setState(normalizeSettings(next));
        close();
      }
    });
    const mount = () => {
      document.body.append(root);
    };
    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount, { once: true });
  }
  (function main() {
    const settingsRef = { current: loadSettings() };
    const derive = () => {
      const result = deriveStyles(settingsRef.current, window.location.href);
      return result.cssText;
    };
    const apply = () => {
      ensureStyleAttached(derive());
    };
    apply();
    keepStyleAlive(() => derive());
    GM_registerMenuCommand(createTranslator(settingsRef.current.language)("title"), () => {
      mountSettingsUi(
        () => settingsRef.current,
        (next) => {
          settingsRef.current = next;
          saveSettings(next);
          apply();
        }
      );
    });
  })();
})();
