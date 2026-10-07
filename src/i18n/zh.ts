export const zh = {
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
  siteRulesPlaceholder:
    '[{"pattern":"*://*.example.com/*","fontFamily":"..."}]',
  siteRulesHint: `示例：[{ "pattern": "*://*.example.com/*", "fontFamily": "'PingFang SC'", "codeFontFamily": "'Fira Code',monospace" }]`,
  siteRulesInvalid: "站点优先配置 JSON 无法解析，请检查格式。",
  close: "关闭",
  cancel: "取消",
  save: "保存",
};

export type MsgKey = keyof typeof zh;
