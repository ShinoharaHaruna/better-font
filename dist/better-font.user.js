// ==UserScript==
// @name         Better Font Renderer
// @namespace    https://github.com/ShinoharaHaruna/better-font
// @version      0.2.0
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
  const STORAGE_KEY = "better_font_state_v2";
  const DEFAULT_CONFIG = {
    fontFamily: "'PingFang SC','Heiti SC','Microsoft YaHei','Source Han Sans SC','Noto Sans CJK SC','sans-serif'",
    fontWeight: "bold",
    shadowRadius: 3,
    shadowColor: "#c3c3c3",
    smoothScroll: true,
    codeFontFamily: "'Fira Code','JetBrains Mono','Consolas','Menlo','monospace'",
    codeFontWeight: "400",
    codeSelectors: [
      "code",
      "pre",
      "pre code",
      "kbd",
      "samp",
      "tt",
      ".hljs",
      ".react-code-text",
      ".react-code-line-contents-no-virtualization",
      ".react-code-text *",
      ".react-code-line-contents-no-virtualization *"
    ]
  };
  function createDefaultSettings() {
    return {
      global: { ...DEFAULT_CONFIG },
      siteRules: [],
      whitelist: []
    };
  }
  function normalizeFontConfig(raw) {
    const safeNumber = (value, fallback, min = 0, max = 100) => {
      const num = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(num)) return fallback;
      return Math.min(Math.max(num, min), max);
    };
    const pickString = (value, fallback) => typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
    const normalizeSelectors = (value) => {
      if (!Array.isArray(value)) {
        if (typeof value === "string") {
          return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
        }
        return [...DEFAULT_CONFIG.codeSelectors];
      }
      return value.map((item) => typeof item === "string" ? item.trim() : "").filter((item) => item.length > 0);
    };
    return {
      fontFamily: pickString(raw?.fontFamily, DEFAULT_CONFIG.fontFamily),
      fontWeight: pickString(raw?.fontWeight, DEFAULT_CONFIG.fontWeight),
      shadowRadius: safeNumber(
        raw?.shadowRadius,
        DEFAULT_CONFIG.shadowRadius,
        0,
        50
      ),
      shadowColor: pickString(raw?.shadowColor, DEFAULT_CONFIG.shadowColor),
      smoothScroll: typeof raw?.smoothScroll === "boolean" ? raw.smoothScroll : DEFAULT_CONFIG.smoothScroll,
      codeFontFamily: pickString(
        raw?.codeFontFamily,
        DEFAULT_CONFIG.codeFontFamily
      ),
      codeFontWeight: pickString(
        raw?.codeFontWeight,
        DEFAULT_CONFIG.codeFontWeight
      ),
      codeSelectors: normalizeSelectors(raw?.codeSelectors)
    };
  }
  function normalizeSiteRule(input) {
    if (!input || typeof input !== "object") return null;
    const data = input;
    const pattern = typeof data.pattern === "string" ? data.pattern.trim() : "";
    if (!pattern) return null;
    const normalized = { pattern };
    const overrides = normalized;
    const assign = (key, value) => {
      if (value === void 0 || value === null) return;
      if (key === "shadowRadius") {
        const num = Number(value);
        if (Number.isFinite(num))
          overrides[key] = Math.min(Math.max(num, 0), 50);
        return;
      }
      if (key === "smoothScroll") {
        overrides[key] = Boolean(value);
        return;
      }
      if (typeof value === "string" && value.trim().length > 0) {
        overrides[key] = value.trim();
      }
    };
    assign("fontFamily", data.fontFamily);
    assign("fontWeight", data.fontWeight);
    assign("shadowColor", data.shadowColor);
    assign("shadowRadius", data.shadowRadius);
    assign("smoothScroll", data.smoothScroll);
    assign("codeFontFamily", data.codeFontFamily);
    assign("codeFontWeight", data.codeFontWeight);
    return normalized;
  }
  function normalizeSettings(input) {
    if (!input) return createDefaultSettings();
    const normalizedRules = Array.isArray(input.siteRules) ? input.siteRules.map((rule) => normalizeSiteRule(rule)).filter((rule) => Boolean(rule)) : [];
    const whitelist = Array.isArray(input.whitelist) ? input.whitelist.map((item) => typeof item === "string" ? item.trim() : "").filter((item) => item.length > 0) : [];
    return {
      global: normalizeFontConfig(input.global),
      siteRules: normalizedRules,
      whitelist
    };
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
    const next = { ...base };
    const assign = (key) => {
      const value = override[key];
      if (value === void 0 || value === null) return;
      next[key] = value;
    };
    assign("fontFamily");
    assign("fontWeight");
    assign("shadowColor");
    assign("smoothScroll");
    assign("codeFontFamily");
    assign("codeFontWeight");
    if (override.shadowRadius !== void 0 && override.shadowRadius !== null) {
      const num = Number(override.shadowRadius);
      if (Number.isFinite(num)) {
        next.shadowRadius = Math.min(Math.max(num, 0), 50);
      }
    }
    return next;
  }
  function globToRegExp(pattern) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    const regex = `^${escaped.replace(/\\\*/g, ".*").replace(/\\\?/g, ".")}$`;
    return new RegExp(regex);
  }
  function matchPattern(url, pattern) {
    if (!pattern) return false;
    try {
      return globToRegExp(pattern).test(url);
    } catch {
      return false;
    }
  }
  function buildCss(cfg) {
    const shadow = cfg.shadowRadius <= 0 ? "" : `text-shadow: 1px 1px ${cfg.shadowRadius}px ${cfg.shadowColor} !important;`;
    const smooth = cfg.smoothScroll ? "html{scroll-behavior:smooth !important;}" : "";
    return `
${smooth}
*:not([class*='icon']):not(.fa):not(.fas):not(i){
  font-family:${cfg.fontFamily} !important;
}
code, pre, pre code{
  font-family:${cfg.codeFontFamily} !important;
  font-weight:${cfg.codeFontWeight} !important;
}
*{
  font-weight:${cfg.fontWeight} !important;
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
      if (injectedStyle.textContent !== cssText)
        injectedStyle.textContent = cssText;
      return;
    }
    injectedStyle = GM_addStyle(cssText);
  }
  function keepStyleAlive(getCssText) {
    const observer = new MutationObserver(() => {
      const cssText = getCssText();
      ensureStyleAttached(cssText);
    });
    const observe = () => {
      if (!document.head) return;
      observer.observe(document.head, { childList: true });
    };
    if (document.head) observe();
    else document.addEventListener("DOMContentLoaded", observe, { once: true });
  }
  function deriveCss(settings, url) {
    const whitelistHit = settings.whitelist.some(
      (pattern) => matchPattern(url, pattern)
    );
    if (whitelistHit) return null;
    const matchedRule = settings.siteRules.find(
      (rule) => matchPattern(url, rule.pattern)
    );
    const effectiveConfig = matchedRule ? mergeFontConfig(settings.global, matchedRule) : settings.global;
    return buildCss(effectiveConfig);
  }
  function mountSettingsUi(getState, setState) {
    const existing = document.querySelector(
      "#better-font-settings"
    );
    if (existing) return;
    const state = getState();
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
    root.innerHTML = `
    <div class="hdr">
      <div class="ttl">Better Font 设置</div>
      <button class="btn" data-act="close">关闭</button>
    </div>
    <div class="bd">
      <label>
        <div>全局 font-family</div>
        <input type="text" data-k="fontFamily" />
        <div class="hint">示例: 'PingFang SC','Microsoft YaHei',sans-serif</div>
      </label>
      <label>
        <div>全局 font-weight</div>
        <select data-k="fontWeight">
          <option value="normal">normal</option>
          <option value="400">400</option>
          <option value="500">500</option>
          <option value="600">600</option>
          <option value="bold">bold</option>
        </select>
      </label>
      <label>
        <div class="row">
          <div class="grow">text-shadow 半径</div>
          <div><span data-k="shadowRadiusLabel"></span>px</div>
        </div>
        <input type="range" min="0" max="20" step="1" data-k="shadowRadius" />
      </label>
      <label>
        <div>text-shadow 颜色</div>
        <input type="text" data-k="shadowColor" placeholder="#c3c3c3" />
      </label>
      <label>
        <div class="row">
          <div class="grow">平滑滚动</div>
          <input type="checkbox" data-k="smoothScroll" />
        </div>
        <div class="hint">切换后通过 scroll-behavior 生效</div>
      </label>
      <label>
        <div>代码块 font-family</div>
        <input type="text" data-k="codeFontFamily" placeholder="'Fira Code','monospace'" />
      </label>
      <label>
        <div>代码块 font-weight</div>
        <select data-k="codeFontWeight">
          <option value="normal">normal</option>
          <option value="400">400</option>
          <option value="500">500</option>
          <option value="600">600</option>
          <option value="bold">bold</option>
        </select>
      </label>
      <label>
        <div>白名单（每行一个通配符 URL，支持 * 与 ?）</div>
        <textarea data-k="whitelist" rows="3" placeholder="例如：*://*.example.com/*"></textarea>
      </label>
      <label>
        <div>站点优先配置（JSON 数组，字段同上）</div>
        <textarea data-k="siteRules" rows="6" placeholder='[{"pattern":"*://*.example.com/*","fontFamily":"..."}]'></textarea>
        <div class="hint">示例：[{ "pattern": "*://*.example.com/*", "fontFamily": "'PingFang SC'", "codeFontFamily": "'Fira Code',monospace" }]</div>
      </label>
      <div class="row" style="justify-content:flex-end">
        <button class="btn" data-act="cancel">取消</button>
        <button class="btn primary" data-act="save">保存</button>
      </div>
    </div>
  `;
    const q = (sel) => {
      const el = root.querySelector(sel);
      if (!el) throw new Error(`Element not found: ${sel}`);
      return el;
    };
    const { global, whitelist, siteRules } = state;
    const ipFont = q('input[data-k="fontFamily"]');
    const selWeight = q('select[data-k="fontWeight"]');
    const rgShadow = q('input[data-k="shadowRadius"]');
    const lbShadow = q('span[data-k="shadowRadiusLabel"]');
    const ipColor = q('input[data-k="shadowColor"]');
    const ckSmooth = q('input[data-k="smoothScroll"]');
    const ipCodeFont = q('input[data-k="codeFontFamily"]');
    const selCodeWeight = q('select[data-k="codeFontWeight"]');
    const taWhitelist = q('textarea[data-k="whitelist"]');
    const taSiteRules = q('textarea[data-k="siteRules"]');
    ipFont.value = global.fontFamily;
    selWeight.value = global.fontWeight;
    rgShadow.value = String(global.shadowRadius);
    lbShadow.textContent = String(global.shadowRadius);
    ipColor.value = global.shadowColor;
    ckSmooth.checked = global.smoothScroll;
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
    root.addEventListener("click", (e) => {
      const target = e.target;
      const act = target.getAttribute("data-act");
      if (!act) return;
      if (act === "close" || act === "cancel") {
        close();
        return;
      }
      if (act === "save") {
        let parsedRules = [];
        const rulesInput = taSiteRules.value.trim();
        if (rulesInput) {
          try {
            const parsed = JSON.parse(rulesInput);
            if (!Array.isArray(parsed)) throw new Error("rules must be an array");
            parsedRules = parsed.map((item) => normalizeSiteRule(item)).filter((item) => Boolean(item));
          } catch (error) {
            window.alert("站点优先配置 JSON 无法解析，请检查格式。");
            return;
          }
        }
        const whitelistList = taWhitelist.value.split(/\n+/).map((line) => line.trim()).filter((line) => line.length > 0);
        const next = {
          global: {
            fontFamily: ipFont.value.trim() || DEFAULT_CONFIG.fontFamily,
            fontWeight: selWeight.value,
            shadowRadius: Math.max(0, Math.min(20, Number(rgShadow.value))),
            shadowColor: ipColor.value.trim() || DEFAULT_CONFIG.shadowColor,
            smoothScroll: ckSmooth.checked,
            codeFontFamily: ipCodeFont.value.trim() || DEFAULT_CONFIG.codeFontFamily,
            codeFontWeight: selCodeWeight.value
          },
          whitelist: whitelistList,
          siteRules: parsedRules
        };
        setState(next);
        close();
      }
    });
    const mount = () => {
      document.body.appendChild(root);
    };
    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount, { once: true });
  }
  (function main() {
    const settingsRef = { current: loadSettings() };
    const currentCss = () => deriveCss(settingsRef.current, window.location.href);
    const apply = () => {
      ensureStyleAttached(currentCss());
    };
    apply();
    keepStyleAlive(() => currentCss());
    GM_registerMenuCommand("Better Font 设置", () => {
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
