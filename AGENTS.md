# AGENTS.md

## 提交约定

- 提交信息使用 Conventional Commits 加 gitmoji 前缀（✨ feat、🐛 fix、♻️ refactor、📝 docs 等），参考 `git log`。
- 版本号升级跟随代码改动放在同一个提交里，不单独留 release/version-bump commit。修改 `vite.config.mts` 中 banner 的 `@version` 即可。
- `dist/better-font.user.js` 是构建产物且随仓库提交：改完 `src/` 或版本号后运行 `yarn build` 再提交。
