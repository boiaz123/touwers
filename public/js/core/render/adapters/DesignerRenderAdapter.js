import { PixiApp } from '../PixiApp.js';
import { Graphics } from 'pixi.js';
import { CanvasGraphicsShim } from '../CanvasGraphicsShim.js';

/**
 * Phase 8 of the Canvas2D -> Pixi migration: the Level Designer tool's own
 * canvas (#designCanvas in level-designer.html / player-level-designer.html,
 * also reused embedded inside the main game shell via LevelDesignerState).
 *
 * Unlike gameplay, the designer has no pre-existing shared PixiApp - each of
 * its three host pages (or the in-game overlay) is its own isolated lifecycle,
 * so this adapter owns its own PixiApp instance rather than reusing
 * stateManager.pixiApp. render() is a single self-contained Strategy-B draw
 * routine (LevelDesigner.render(), only ever called event-driven - mousemove/
 * click/button handlers, never a rAF loop) that only touches this.ctx, so it
 * runs completely unmodified against the CanvasGraphicsShim exactly like
 * SpellEffectRenderAdapter.
 */
export class DesignerRenderAdapter {
    constructor() {
        this.pixiApp = new PixiApp();
        this.graphics = null;
        this.shim = null;
        this._initPromise = null;
    }

    /**
     * @param {HTMLCanvasElement} canvas - the designer's Canvas2D canvas; its
     * parentElement (.canvas-wrapper, already position:relative) is the mount point.
     */
    init(canvas) {
        if (this._initPromise) return this._initPromise;
        this._initPromise = this.pixiApp.init(canvas.width, canvas.height, canvas.parentElement)
            .then(() => {
                this.pixiApp.setVisible(true);
                this.graphics = new Graphics();
                this.pixiApp.app.stage.addChild(this.graphics);
                this.shim = new CanvasGraphicsShim(this.graphics);
            });
        return this._initPromise;
    }

    /** Call after the designer canvas is resized (setupCanvas/handleResize) so the WebGL surface matches. */
    resize(width, height) {
        if (!this.pixiApp.ready) return;
        this.pixiApp.app.renderer.resize(width, height);
    }

    /**
     * Call once per LevelDesigner.render() when the Pixi renderer is active.
     * @param {(ctx: CanvasGraphicsShim) => void} renderFn - LevelDesigner.render, bound, reused unmodified.
     */
    sync(renderFn) {
        if (!this.pixiApp.ready) return;
        this.shim.reset();
        renderFn(this.shim);
        this.pixiApp.renderFrame();
    }
}
