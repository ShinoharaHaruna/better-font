# Better Font Renderer

**English** | [简体中文](./README_cn.md)

Better Font Renderer is a userscript for GreasyFork/Tampermonkey that enforces a consistent font experience across sites, with separate styling for code blocks. It is built with TypeScript + Vite and provides a visual settings panel through the userscript manager menu, supporting global settings, per-site override rules, and a whitelist.

## Features

- **Global font policy**: forces the configured font-family and font-weight on regular text, with an optional text-shadow.
- **Independent code styling**: applies the configured monospace font and weight to common code containers (code/pre, GitHub, Gist, etc.) so they are not overridden by the body font.
- **Icon font protection**: ships an exclusion list for common icon fonts (Font Awesome, Material Symbols, Google Symbols, etc.) so icons keep their original font instead of rendering as literal text.
- **Per-site overrides**: wildcard URL rules (`*`/`?`) that override any global field on matching sites (font, weight, shadow, code font, etc.).
- **UI language**: the settings panel supports 中文 / English / 日本語. It follows the browser language by default and can be overridden manually. Note: the menu label only switches language after a page reload.
- **Whitelist**: wildcard URL list that excludes matching sites entirely.
- **Settings panel**: opened via the userscript manager menu (the label is localized); edits the global config, whitelist, and site rules, and applies them immediately on save.
- **Style persistence**: CSS is injected at `document-start` and a `MutationObserver` watches `<head>` to keep the styles alive if the site tries to remove them.

## Project structure

```bash
├── dist/                    # build output (better-font.user.js)
├── src/
│   ├── index.ts             # userscript source
│   └── i18n/                # panel UI strings (zh/en/ja)
├── vite.config.mts          # Vite build config (injects the userscript metadata banner)
├── tsconfig.json            # TS config
├── package.json
├── README.md                # English (this file)
└── README_cn.md             # 简体中文
```

## Development & build

The repo uses Yarn Berry + PnP:

```bash
# install dependencies (first run)
yarn install

# build the userscript into dist/
yarn build

# watch mode
yarn dev
```

- Output: `dist/better-font.user.js`
- The build automatically prepends the userscript metadata block (name, version, grants).

## Usage

1. Install `dist/better-font.user.js` in GreasyFork, Tampermonkey, or a similar manager.
2. Find "Better Font Settings" in the page context menu or the manager's menu (the label follows the UI language).
3. The settings panel supports:
   - UI language: auto/中文/English/日本語
   - Global font/weight, text-shadow radius and color
   - Code block font/weight
   - Whitelist: one wildcard URL per line, e.g. `*://*.example.com/*`
   - Per-site overrides: a JSON array where each entry has a `pattern` (wildcards supported) plus any override fields, e.g.:

     ```json
     [
       {
         "pattern": "*://*.github.com/*",
         "fontFamily": "'Source Han Sans SC', sans-serif",
         "codeFontFamily": "'JetBrains Mono', monospace"
       }
     ]
     ```

4. Settings are written to GM storage on save and styles refresh immediately; clear the inputs to restore defaults.

## FAQ

- **Styles not applied**: check the settings panel to make sure the site is not whitelisted, or look for `[BetterFont]` logs in the Console (set `DEBUG` to `true` in the source to enable debug output).
- **Code blocks still use the site's font**: add a higher-priority selector for that site under "Per-site overrides", or extend `codeSelectors` in the source.
- **Icons render as literal text**: the icon's CSS class may be missing from `ICON_FONT_EXCLUSIONS` in `src/index.ts`; add a matching selector there.

## License

MIT License
