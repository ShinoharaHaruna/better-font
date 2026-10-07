import { zh } from "./zh";
import { en } from "./en";
import { ja } from "./ja";
import type { MsgKey } from "./zh";

export type { MsgKey } from "./zh";

export type Locale = "zh" | "en" | "ja";
export type LanguagePref = "auto" | Locale;

const LOCALES: Record<Locale, Record<MsgKey, string>> = { zh, en, ja };

export function resolveLocale(pref: string): Locale {
  if (pref === "zh" || pref === "en" || pref === "ja") return pref;

  const navs =
    typeof navigator !== "undefined" &&
    Array.isArray(navigator.languages) &&
    navigator.languages.length > 0
      ? navigator.languages
      : [typeof navigator !== "undefined" ? navigator.language : "en"];

  for (const nav of navs) {
    const lang = (nav ?? "").toLowerCase();
    if (lang.startsWith("zh")) return "zh";
    if (lang.startsWith("ja")) return "ja";
    if (lang.startsWith("en")) return "en";
  }
  return "en";
}

export function createTranslator(pref: string): (key: MsgKey) => string {
  const messages = LOCALES[resolveLocale(pref)];
  return (key: MsgKey) => messages[key] ?? en[key] ?? key;
}
