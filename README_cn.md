# Better Font Renderer

[English](./README.md) | **简体中文**

Better Font Renderer 是一个面向 GreasyFork/Tampermonkey 的 userscript，目标是跨站点统一网页字体体验，并对代码块提供独立样式配置。脚本使用 TypeScript + Vite 构建，通过脚本管理器菜单提供可视化设置面板，支持全局设定、站点优先级规则以及白名单。

## 功能特性

- **全局字体策略**：强制普通文本使用指定 font-family、font-weight，并可附带 text-shadow。
- **代码块独立样式**：为 code/pre/GitHub/Gist 等常见容器统一应用指定的等宽字体与粗细，避免被正文字体覆盖。
- **图标字体保护**：内置常见图标字体（Font Awesome、Material Symbols、Google Symbols 等）的选择器排除列表，避免图标被强制字体渲染成文字。
- **站点优先级规则**：基于支持 `*`/`?` 的通配 URL，为特定站点覆盖全局配置（字体、阴影、代码字体等字段均可覆盖）。
- **界面语言**：设置面板支持中文 / English / 日本語，默认跟随浏览器语言，可在面板中手动覆盖。注意菜单项名称在页面刷新后才切换语言。
- **白名单**：通过通配 URL 列表排除特定站点，让这些站点完全不受脚本影响。
- **设置面板**：通过脚本管理器菜单项呼出弹窗（名称随界面语言变化，中文为 "Better Font 设置"），实时修改全局配置/白名单/站点规则，保存后立即生效。
- **样式保活**：脚本在 `document-start` 注入 CSS，并使用 `MutationObserver` 监控 `<head>`，防止站点动态删除样式。

## 目录结构

```bash
├── dist/                    # 构建输出（better-font.user.js）
├── src/
│   ├── index.ts             # userscript 源码
│   └── i18n/                # 面板文案（zh/en/ja）
├── vite.config.mts          # Vite 构建配置（包含 userscript metadata banner）
├── tsconfig.json            # TS 配置
├── package.json
├── README.md                # English
└── README_cn.md             # 简体中文（本文件）
```

## 开发与构建

仓库使用 Yarn Berry + PnP：

```bash
# 安装依赖（首次执行）
yarn install

# 构建 userscript 到 dist/
yarn build

# 开发模式（watch）
yarn dev
```

- 产物位置：`dist/better-font.user.js`
- 构建脚本会自动为产物插入 userscript metadata block（名称、版本、grant 等）。

## 使用方式

1. 在 GreasyFork/Tampermonkey 等平台安装 `dist/better-font.user.js`。
2. 安装后可在任何网页右键菜单或扩展菜单中找到 "Better Font 设置"（随界面语言变化）。
3. 设置面板支持：
   - 界面语言：auto/中文/English/日本語
   - 全局普通字体/粗细、text-shadow 半径与颜色
   - 代码块字体/粗细
   - 白名单：一行一个通配 URL，例如 `*://*.example.com/*`
   - 站点优先配置：JSON 数组，每条包含 `pattern`（支持通配符）与任意覆盖字段，如：

     ```json
     [
       {
         "pattern": "*://*.github.com/*",
         "fontFamily": "'Source Han Sans SC', sans-serif",
         "codeFontFamily": "'JetBrains Mono', monospace"
       }
     ]
     ```

4. 保存后脚本会立即写入 GM 存储并刷新样式；若需要恢复默认，清空输入即可。

## 常见问题

- **样式未生效**：检查设置面板确认未将站点加入白名单，或在 Console 查看 `[BetterFont]` 日志（源码中可将 `DEBUG` 设为 `true` 以输出调试信息）。
- **代码块仍使用站点字体**：可以在设置面板的 "站点优先配置" 中为对应站点添加更高优先级的选择器，或直接在源码的 `codeSelectors` 中扩充。
- **图标显示为文字**：该图标的 CSS 类可能不在 `src/index.ts` 的 `ICON_FONT_EXCLUSIONS` 列表中，在其中补充对应选择器即可。

## 许可证

MIT License
