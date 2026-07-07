import { Application } from 'pixi.js';

/**
 * Owns the single PIXI.Application used for gameplay rendering. Mirrors the
 * existing Canvas2D canvas's fixed-internal-resolution model exactly (see
 * game.js / ResolutionManager): no devicePixelRatio auto-scaling, no live
 * resize - resolution changes go through the same full page reload the
 * Canvas2D path already uses, so this never needs to resize after init.
 */
export class PixiApp {
    constructor() {
        this.app = null;
        this.ready = false;
        // Dev-diagnostic only (see PerformanceMonitor's drawCalls stat): counts raw
        // gl.draw*() calls per frame by wrapping the WebGL context once at init, since
        // Pixi v8's public Renderer API doesn't expose a draw-call counter itself.
        this._drawCallCount = 0;
    }

    /**
     * @param {number} width - internal render width, matches canvas.width
     * @param {number} height - internal render height, matches canvas.height
     * @param {HTMLElement} mountParent - element to append the Pixi canvas into
     */
    async init(width, height, mountParent) {
        this.app = new Application();

        await this.app.init({
            width,
            height,
            resolution: 1,
            autoDensity: false,
            antialias: true,
            backgroundAlpha: 0,
            preference: 'webgl',
            powerPreference: 'high-performance',
            // Pixi's Application defaults to autoStart:true, running its OWN
            // requestAnimationFrame render loop completely unsynchronized with
            // game.js's own loop (which already calls renderFrame() manually, once
            // per frame, right after GameplayState finishes syncing the stage for
            // that frame). Two independent loops both calling renderer.render(stage)
            // on the same canvas race each other - Pixi's automatic ticker can fire
            // mid-update or redundantly, and which call's result actually lands on
            // screen becomes nondeterministic. This is a well-known Pixi embedding
            // pitfall; disabling the internal ticker and driving rendering purely
            // through the explicit renderFrame() calls is the standard fix.
            autoStart: false,
        });
        this.app.ticker.stop();

        this.app.stage.sortableChildren = true;

        this.app.canvas.id = 'pixiCanvas';
        this.app.canvas.style.position = 'absolute';
        this.app.canvas.style.top = '0';
        this.app.canvas.style.left = '0';
        this.app.canvas.style.width = '100%';
        this.app.canvas.style.height = '100%';
        this.app.canvas.style.pointerEvents = 'none';
        this.app.canvas.style.display = 'none';
        // z-index:1 (positive) - sits behind #gameCanvas which gets z-index:2 in CSS.
        // Both canvases are now in the SAME stacking category (positioned elements with
        // explicit z-index), so comparison is direct and reliable - no negative z-index
        // against non-positioned content, which had known compositing quirks in Chromium
        // when combined with the legacy transform/will-change layer-promotion hints on
        // #gameCanvas that existed before Pixi was introduced.
        this.app.canvas.style.zIndex = '1';

        // Insert BEFORE #gameCanvas (first child) so DOM order matches paint order
        // even without z-index - belt-and-suspenders.
        mountParent.insertBefore(this.app.canvas, mountParent.firstChild);

        this._wrapGLDrawCalls();

        this.ready = true;
        return this.app;
    }

    /** Wraps drawArrays/drawElements on the underlying WebGL context so draw-call
     *  count can be surfaced in the performance overlay. Purely additive counting -
     *  never changes arguments or return values. No-op if the context isn't WebGL
     *  (e.g. a future canvas/webgpu fallback), since gl would be undefined then. */
    _wrapGLDrawCalls() {
        const gl = this.app.renderer.gl;
        if (!gl) return;
        const drawArrays = gl.drawArrays.bind(gl);
        const drawElements = gl.drawElements.bind(gl);
        gl.drawArrays = (...args) => { this._drawCallCount++; return drawArrays(...args); };
        gl.drawElements = (...args) => { this._drawCallCount++; return drawElements(...args); };
    }

    /** Call once per frame right before renderFrame() to get that frame's count in isolation. */
    resetDrawCallCount() {
        this._drawCallCount = 0;
    }

    getDrawCallCount() {
        return this._drawCallCount;
    }

    setVisible(visible) {
        if (!this.app) return;
        this.app.canvas.style.display = visible ? 'block' : 'none';
    }

    renderFrame() {
        if (!this.app) return;
        this.app.renderer.render(this.app.stage);
    }

    destroy() {
        if (!this.app) return;
        this.app.destroy(true, { children: true, texture: true });
        this.app = null;
        this.ready = false;
    }
}
