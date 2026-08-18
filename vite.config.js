import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Project predates any bundler: public/ is both the source root and (today) the
// raw directory Tauri serves directly. Vite takes over as the dev server and
// production bundler; Tauri's frontendDist now points at dist/ instead of public/.
//
// public/assets/** is referenced everywhere as runtime path strings (audio src,
// <img src>), never via ES `import`, so Vite can't see/hash them. publicDir's
// default copy strips the "assets/" prefix (copies public/assets/towers/* to
// dist/towers/*), which would break every one of those string references. We
// disable publicDir and copy public/assets -> dist/assets verbatim instead, so
// the "assets/..." paths used throughout the codebase keep resolving unchanged.
// Vite's dev server already serves files under `root` directly, so dev mode
// needs no equivalent step.
function copyAssetsVerbatim() {
  return {
    name: 'copy-assets-verbatim',
    apply: 'build',
    closeBundle() {
      cpSync(resolve(__dirname, 'public/assets'), resolve(__dirname, 'dist/assets'), { recursive: true });
    },
  };
}

export default defineConfig({
  root: 'public',
  base: './',
  publicDir: false,
  plugins: [copyAssetsVerbatim()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Must support native class fields (ES2022). Below that, esbuild's syntax-lowering
    // rewrites `class Foo { static bar = 1 }` into a class *expression* plus a separate
    // `__publicField(Foo, "bar", 1)` statement, and Rollup then has to give that expression
    // its own internal name distinct from the outer binding - which it does by prefixing it
    // with "_" (`class _Foo`). That silently renames `.constructor.name` for every class with
    // a static/private field (MagicAcademy, TowerForge, WorkshopHall, CannonTower, most enemy
    // classes, ...), which gameplay code identifies at runtime via
    // `instance.constructor.name === 'GoldMine'` (etc.) in ~30 places across the codebase.
    // Dev mode serves native, unbundled, un-lowered ESM straight to the WebView, so this only
    // ever showed up in the built app: e.g. SettlementHub's header-label lookup keys off
    // 'MagicAcademy'/'TowerForge' and silently drew nothing, and TowerManager's
    // `find(b => b.constructor.name === 'TowerForge')` returned undefined so the Tower Forge
    // hotkey no-opped. Confirmed by building with `--minify false`: the renaming survives with
    // minification off, so it's esbuild's target-driven lowering, not terser's mangler -
    // keep_classnames below doesn't reach this at all. Tauri's WebView2/WKWebView both support
    // ES2022 natively, so target: 'es2022' avoids the lowering entirely instead of fighting it.
    target: 'es2022',
    minify: 'terser',
    terserOptions: {
      keep_classnames: true,
      keep_fnames: true,
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        levelDesigner: resolve(__dirname, 'public/level-designer.html'),
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
