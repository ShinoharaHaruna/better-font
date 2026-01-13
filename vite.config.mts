import { defineConfig } from "vite";

const userscriptBanner =
  `// ==UserScript==\n` +
  `// @name         Better Font Renderer\n` +
  `// @namespace    https://github.com/ShinoharaHaruna/better-font\n` +
  `// @version      0.1.1\n` +
  `// @description  Force consistent fonts & code styling with per-site overrides\n` +
  `// @author       Shinohara Haruna\n` +
  `// @match        *://*/*\n` +
  `// @run-at       document-start\n` +
  `// @grant        GM_getValue\n` +
  `// @grant        GM_setValue\n` +
  `// @grant        GM_addStyle\n` +
  `// @grant        GM_registerMenuCommand\n` +
  `// ==/UserScript==\n`;

const userscriptMetadataPlugin = () => ({
  name: "userscript-metadata",
  generateBundle(_, bundle) {
    Object.values(bundle).forEach((output) => {
      if (output.type !== "chunk") return;
      if (output.code.startsWith(userscriptBanner)) return;
      output.code = `${userscriptBanner}\n${output.code}`;
    });
  },
});

export default defineConfig({
  plugins: [userscriptMetadataPlugin()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "BetterFont",
      formats: ["iife"],
      fileName: () => "better-font.user.js",
    },
    target: "es2020",
    minify: false,
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: "better-font.user.js",
      },
    },
  },
});
