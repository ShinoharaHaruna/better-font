import type { MsgKey } from "./zh";

export const en: Record<MsgKey, string> = {
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
  siteRulesPlaceholder:
    '[{"pattern":"*://*.example.com/*","fontFamily":"..."}]',
  siteRulesHint: `e.g. [{ "pattern": "*://*.example.com/*", "fontFamily": "'PingFang SC'", "codeFontFamily": "'Fira Code',monospace" }]`,
  siteRulesInvalid:
    "Could not parse the per-site rules JSON. Please check the format.",
  close: "Close",
  cancel: "Cancel",
  save: "Save",
};
