type Maybe<T> = T | null | undefined;

declare const GM_getValue: <T>(key: string, defaultValue: T) => T;
declare const GM_setValue: <T>(key: string, value: T) => void;
declare const GM_addStyle: (css: string) => HTMLStyleElement;
declare const GM_registerMenuCommand: (name: string, fn: () => void) => void;

const DEBUG = false;
const debugLog = (...args: unknown[]) => {
  if (!DEBUG) return;
  console.log("[BetterFont]", ...args);
};

type FontConfig = {
  fontFamily: string;
  fontWeight: string;
  shadowRadius: number;
  shadowColor: string;
  codeFontFamily: string;
  codeFontWeight: string;
  codeSelectors: string[];
};

type SiteRule = Partial<FontConfig> & { pattern: string };

type StoredSettings = {
  global: FontConfig;
  siteRules: SiteRule[];
  whitelist: string[];
};

type DebugContext = {
  url: string;
  whitelistHit: boolean;
  whitelistPattern: string | null;
  matchedPattern: string | null;
};

const STORAGE_KEY = "better_font_state_v2";

const EMOJI_FALLBACK_FONTS =
  "'Apple Color Emoji','Noto Color Emoji','Segoe UI Emoji','Segoe UI Symbol'";

/**
 * Icon-font markers excluded from the global font-family override.
 * Each entry is a plain CSS selector; the rule generator wraps all of them in
 * a single :not(...) list, so an element matching ANY entry keeps its
 * original font (required for ligature/glyph icon fonts).
 *
 * When a site's icons render as raw text (e.g. the literal word "translate"),
 * find the icon element's class and add the matching entry here.
 */
const ICON_FONT_EXCLUSIONS: readonly string[] = [
  // Generic markers
  "i", // classic <i> icon element (also skips italic text)
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
  ".ti", // Themify
  ".wi", // Weather Icons
  ".la", // Line Awesome
  ".ai", // Academicons
  ".pi", // PrimeIcons
  ".oi", // Open Iconic
  ".fi", // Foundation Icons
  ".pe-7s", // Stroke 7
  ".icofont",
  ".devicon",
  ".typcn", // Typicons
  "[class*='uil-']", // Unicons
  "[class*='entypo']",

  // Attribute-marked icon systems
  "[data-cds='Icon']", // Claude (claude.ai) design system PUA icons

  // UI framework icon classes
  ".anticon", // Ant Design
  "[class*='el-icon']", // Element UI / Element Plus
  ".ivu-icon", // iView / View UI
  ".v-icon", // Vuetify
  ".q-icon", // Quasar
  ".weui-icon", // WeUI
];

const DEFAULT_CONFIG: FontConfig = {
  fontFamily:
    "'PingFang SC','Heiti SC','Microsoft YaHei','Source Han Sans SC','Noto Sans CJK SC','sans-serif'",
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
    ".highlight td *",
  ],
};

function normalizeCodeSelectors(value: unknown): string[] {
  if (!Array.isArray(value)) {
    if (typeof value === "string") {
      return value
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [...DEFAULT_CONFIG.codeSelectors];
  }
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function createDefaultSettings(): StoredSettings {
  return {
    global: { ...DEFAULT_CONFIG },
    siteRules: [],
    whitelist: [],
  };
}

function normalizeFontConfig(
  raw: Partial<FontConfig> | null | undefined,
): FontConfig {
  const pickString = (value: unknown, fallback: string): string =>
    typeof value === "string" && value.trim().length > 0
      ? value.trim()
      : fallback;

  const clampNumber = (value: unknown, fallback: number): number => {
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
      DEFAULT_CONFIG.codeFontFamily,
    ),
    codeFontWeight: pickString(
      raw?.codeFontWeight,
      DEFAULT_CONFIG.codeFontWeight,
    ),
    codeSelectors: normalizeCodeSelectors(raw?.codeSelectors),
  };
}

function normalizeSiteRule(input: unknown): SiteRule | null {
  if (!input || typeof input !== "object") return null;
  const data = input as Partial<SiteRule>;
  const pattern = typeof data.pattern === "string" ? data.pattern.trim() : "";
  if (!pattern) return null;

  const overrides: Partial<FontConfig> = {};

  const pickString = (value: unknown): string | undefined => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed.length > 0 ? trimmed : undefined;
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

  if (data.shadowRadius !== undefined && data.shadowRadius !== null) {
    const num = Number(data.shadowRadius);
    if (Number.isFinite(num)) {
      overrides.shadowRadius = Math.min(Math.max(num, 0), 50);
    }
  }

  if (data.codeSelectors !== undefined && data.codeSelectors !== null) {
    overrides.codeSelectors = normalizeCodeSelectors(data.codeSelectors);
  }

  return { pattern, ...overrides };
}

function normalizeSettings(input: StoredSettings | null): StoredSettings {
  if (!input) return createDefaultSettings();

  const normalizedRules: SiteRule[] = Array.isArray(input.siteRules)
    ? input.siteRules
        .map((rule) => normalizeSiteRule(rule))
        .filter((rule): rule is SiteRule => Boolean(rule))
    : [];

  const whitelist = Array.isArray(input.whitelist)
    ? input.whitelist
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0)
    : [];

  return {
    global: normalizeFontConfig(input.global),
    siteRules: normalizedRules,
    whitelist,
  };
}

function loadSettings(): StoredSettings {
  const stored = GM_getValue<StoredSettings | null>(STORAGE_KEY, null);
  if (stored) return normalizeSettings(stored);
  return createDefaultSettings();
}

function saveSettings(settings: StoredSettings): void {
  GM_setValue(STORAGE_KEY, settings);
}

function mergeFontConfig(
  base: FontConfig,
  override?: Partial<FontConfig>,
): FontConfig {
  if (!override) return { ...base };

  const clampNumber = (value: unknown, fallback: number): number => {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.min(Math.max(num, 0), 50);
  };

  const next: FontConfig = { ...base };

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

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regex = `^${escaped.replace(/\\\*/g, ".*").replace(/\\\?/g, ".")}$`;
  return new RegExp(regex);
}

const globRegExpCache = new Map<string, RegExp>();

function matchPattern(url: string, pattern: string): boolean {
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

function expandCodeSelectors(selectors: string[]): string[] {
  const result = new Set<string>();

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

function appendEmojiFallback(fontFamily: string): string {
  const lower = fontFamily.toLowerCase();
  if (
    lower.includes("emoji") ||
    lower.includes("segoe ui symbol") ||
    lower.includes("apple color emoji") ||
    lower.includes("noto color emoji")
  ) {
    return fontFamily;
  }
  return `${fontFamily},${EMOJI_FALLBACK_FONTS}`;
}

function buildCss(cfg: FontConfig): string {
  const shadow =
    cfg.shadowRadius <= 0
      ? ""
      : `text-shadow: 1px 1px ${cfg.shadowRadius}px ${cfg.shadowColor} !important;`;

  const globalFontFamily = appendEmojiFallback(cfg.fontFamily);
  const codeFontFamily = appendEmojiFallback(cfg.codeFontFamily);

  const rawCodeSelectors =
    cfg.codeSelectors && cfg.codeSelectors.length > 0
      ? cfg.codeSelectors
      : DEFAULT_CONFIG.codeSelectors;

  const expandedCodeSelectors =
    expandCodeSelectors(rawCodeSelectors).join(",\n");
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

let injectedStyle: Maybe<HTMLStyleElement>;

function ensureStyleAttached(cssText: string | null): void {
  if (!cssText) {
    if (injectedStyle && injectedStyle.parentNode) {
      injectedStyle.remove();
      injectedStyle = null;
      debugLog("Styles removed (whitelisted or empty).");
    }
    return;
  }

  if (injectedStyle && document.head && document.head.contains(injectedStyle)) {
    if (injectedStyle.textContent !== cssText) {
      injectedStyle.textContent = cssText;
      debugLog("Styles updated (existing tag reused).", {
        length: cssText.length,
      });
    }
    return;
  }

  injectedStyle = GM_addStyle(cssText);
  debugLog("Styles injected (new tag).", { length: cssText.length });
}

function keepStyleAlive(getCssText: () => string | null): void {
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

type DeriveResult = {
  cssText: string | null;
  effectiveConfig: FontConfig | null;
};

function deriveStyles(settings: StoredSettings, url: string): DeriveResult {
  const whitelistEntry = settings.whitelist.find((pattern) =>
    matchPattern(url, pattern),
  );
  const whitelistHit = Boolean(whitelistEntry);
  const matchedRule = settings.siteRules.find((rule) =>
    matchPattern(url, rule.pattern),
  );

  const ctx: DebugContext = {
    url,
    whitelistHit,
    whitelistPattern: whitelistEntry ?? null,
    matchedPattern: matchedRule?.pattern ?? null,
  };

  if (whitelistHit) {
    debugLog("Whitelist hit, skipping styles.", ctx);
    return { cssText: null, effectiveConfig: null };
  }

  const effectiveConfig = mergeFontConfig(settings.global, matchedRule);

  const css = buildCss(effectiveConfig);
  debugLog("Styles derived.", {
    ...ctx,
    usingRule: matchedRule ? "siteRule" : "global",
    codeSelectorsCount: effectiveConfig.codeSelectors.length,
    cssLength: css.length,
  });
  return { cssText: css, effectiveConfig };
}

function mountSettingsUi(
  getState: () => StoredSettings,
  setState: (payload: StoredSettings) => void,
): void {
  const existing = document.querySelector<HTMLDivElement>(
    "#better-font-settings",
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

  const q = <T extends HTMLElement>(sel: string) => {
    const el = root.querySelector<T>(sel);
    if (!el) throw new Error(`Element not found: ${sel}`);
    return el;
  };

  const { global, whitelist, siteRules } = state;

  const ipFont = q<HTMLInputElement>('input[data-k="fontFamily"]');
  const selWeight = q<HTMLSelectElement>('select[data-k="fontWeight"]');
  const rgShadow = q<HTMLInputElement>('input[data-k="shadowRadius"]');
  const lbShadow = q<HTMLSpanElement>('span[data-k="shadowRadiusLabel"]');
  const ipColor = q<HTMLInputElement>('input[data-k="shadowColor"]');
  const ipCodeFont = q<HTMLInputElement>('input[data-k="codeFontFamily"]');
  const selCodeWeight = q<HTMLSelectElement>('select[data-k="codeFontWeight"]');
  const taWhitelist = q<HTMLTextAreaElement>('textarea[data-k="whitelist"]');
  const taSiteRules = q<HTMLTextAreaElement>('textarea[data-k="siteRules"]');

  ipFont.value = global.fontFamily;
  selWeight.value = global.fontWeight;
  rgShadow.value = String(global.shadowRadius);
  lbShadow.textContent = String(global.shadowRadius);
  ipColor.value = global.shadowColor;
  ipCodeFont.value = global.codeFontFamily;
  selCodeWeight.value = global.codeFontWeight;
  taWhitelist.value = whitelist.join("\n");
  taSiteRules.value =
    siteRules.length > 0 ? JSON.stringify(siteRules, null, 2) : "";

  rgShadow.addEventListener("input", () => {
    lbShadow.textContent = rgShadow.value;
  });

  const close = () => {
    root.remove();
    style.remove();
  };

  function parseSiteRules(input: string): SiteRule[] | null {
    if (!input.trim()) return [];
    try {
      const parsed = JSON.parse(input);
      if (!Array.isArray(parsed)) throw new Error("rules must be an array");
      return parsed
        .map((item) => normalizeSiteRule(item))
        .filter((item): item is SiteRule => item !== null);
    } catch {
      window.alert("站点优先配置 JSON 无法解析，请检查格式。");
      return null;
    }
  }

  function parseWhitelist(input: string): string[] {
    return input
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  root.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
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

      const next: StoredSettings = {
        global: {
          fontFamily: ipFont.value.trim() || DEFAULT_CONFIG.fontFamily,
          fontWeight: selWeight.value,
          shadowRadius: Math.max(0, Math.min(20, Number(rgShadow.value))),
          shadowColor: ipColor.value.trim() || DEFAULT_CONFIG.shadowColor,
          codeFontFamily:
            ipCodeFont.value.trim() || DEFAULT_CONFIG.codeFontFamily,
          codeFontWeight: selCodeWeight.value,
          codeSelectors: [...state.global.codeSelectors],
        },
        whitelist: whitelistList,
        siteRules: parsedRules,
      };

      setState(normalizeSettings(next));
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
  const settingsRef: { current: StoredSettings } = { current: loadSettings() };

  const derive = () => {
    const result = deriveStyles(settingsRef.current, window.location.href);
    return result.cssText;
  };

  const apply = () => {
    ensureStyleAttached(derive());
  };

  apply();
  keepStyleAlive(() => derive());

  GM_registerMenuCommand("Better Font 设置", () => {
    mountSettingsUi(
      () => settingsRef.current,
      (next) => {
        settingsRef.current = next;
        saveSettings(next);
        apply();
      },
    );
  });
})();
