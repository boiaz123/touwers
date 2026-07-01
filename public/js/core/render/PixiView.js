import { Graphics, Sprite } from 'pixi.js';

/**
 * Thin wrapper around a single Pixi display object representing one game
 * entity's on-screen presence. Entities never touch Pixi directly - a
 * RenderAdapter owns the PixiView and calls its setters from the entity's
 * already-computed state inside the entity's syncPixiView(pixiView) method.
 *
 * Two modes, matching the two migration strategies in the plan:
 *  - Strategy A (texture-baked): mode 'sprite', displayObject is a PIXI.Sprite
 *    whose texture is swapped via setTexture() to a pre-baked PixiTextureCache entry.
 *  - Strategy B (live redraw): mode 'graphics', displayObject is a PIXI.Graphics
 *    that the adapter clears and redraws every frame via getGraphics().
 */
export class PixiView {
    constructor(mode = 'sprite') {
        this.mode = mode;
        this.displayObject = mode === 'graphics' ? new Graphics() : new Sprite();
        if (mode === 'sprite') {
            this.displayObject.anchor.set(0.5, 0.5);
        }
    }

    addTo(container) {
        container.addChild(this.displayObject);
        return this;
    }

    removeFrom(container) {
        container.removeChild(this.displayObject);
        return this;
    }

    destroy() {
        this.displayObject.destroy();
    }

    setPosition(x, y) {
        this.displayObject.x = x;
        this.displayObject.y = y;
    }

    setRotation(radians) {
        this.displayObject.rotation = radians;
    }

    setAlpha(alpha) {
        this.displayObject.alpha = alpha;
    }

    setVisible(visible) {
        this.displayObject.visible = visible;
    }

    setTint(tint) {
        this.displayObject.tint = tint;
    }

    /** Y-sort hook: keep in sync with the entity's y so Pixi's sortableChildren handles draw order. */
    setSortY(y) {
        this.displayObject.zIndex = y;
    }

    /** Strategy A only - swap to a pre-baked texture from PixiTextureCache. */
    setTexture(texture) {
        if (this.mode !== 'sprite') {
            throw new Error('setTexture() called on a graphics-mode PixiView');
        }
        this.displayObject.texture = texture;
    }

    /** Strategy B only - adapter clears and redraws this every frame. */
    getGraphics() {
        if (this.mode !== 'graphics') {
            throw new Error('getGraphics() called on a sprite-mode PixiView');
        }
        return this.displayObject;
    }
}
