# Repository Guidelines

## Project Structure

- `src/index.ts` contains the TypeScript userscript, including settings, CSS generation, and the configuration UI.
- `vite.config.mts` defines the bundle and userscript metadata; update its `@version` when releasing.
- `dist/better-font.user.js` is the generated, checked-in userscript. Rebuild it after source or version changes.
- `README.md` documents user-facing features and setup. `tsconfig.json` enables strict TypeScript checks.

## Build and Development

This repository uses Yarn 4.6 with Plug’n’Play.

- `yarn install` installs the locked dependencies.
- `yarn build` builds the userscript into `dist/better-font.user.js` and adds the metadata banner.
- `yarn dev` runs Vite in watch mode and rebuilds after source changes.

There is no automated test or lint script configured in `package.json`. For behavior changes, build the bundle and manually check the affected settings or page styling in a userscript manager.

## Code Style

Use TypeScript with two-space indentation and the strict compiler settings in `tsconfig.json`. Keep the implementation in `src/index.ts` unless the source grows enough to benefit from focused modules. Follow existing naming: `camelCase` for functions and values, `PascalCase` for types, and uppercase names for constants. No formatter or linter is configured; match surrounding code and keep CSS selectors and site-specific exceptions explicit.

## Commits and Pull Requests

History uses a Gitmoji followed by a Conventional Commit type and concise subject, such as `✨ feat: add site override` or `🐛 fix: preserve icon fonts`.

- Use Conventional Commits with a Gitmoji prefix (for example, `✨ feat`, `🐛 fix`, `♻️ refactor`, or `📝 docs`); follow `git log`.
- Include version updates in the same commit as the related code changes; do not create standalone release or version-bump commits. Update the banner's `@version` in `vite.config.mts`.
- Commit the generated `dist/better-font.user.js` artifact. Run `yarn build` after changing `src/` or the version, then commit the output.

Pull requests should explain the user-visible change and list validation performed. Link a related issue when applicable; include screenshots for changes to the settings panel. Keep each change focused and call out any site-specific behavior that needs review.
