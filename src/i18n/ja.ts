import type { MsgKey } from "./zh";

export const ja: Record<MsgKey, string> = {
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
  siteRulesPlaceholder:
    '[{"pattern":"*://*.example.com/*","fontFamily":"..."}]',
  siteRulesHint: `例：[{ "pattern": "*://*.example.com/*", "fontFamily": "'PingFang SC'", "codeFontFamily": "'Fira Code',monospace" }]`,
  siteRulesInvalid:
    "サイト別設定の JSON を解析できませんでした。形式を確認してください。",
  close: "閉じる",
  cancel: "キャンセル",
  save: "保存",
};
