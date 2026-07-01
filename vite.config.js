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
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        levelDesigner: resolve(__dirname, 'public/level-designer.html'),
        playerLevelDesigner: resolve(__dirname, 'public/player-level-designer.html'),
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
