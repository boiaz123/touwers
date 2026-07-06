import { Container, Graphics } from 'pixi.js';
import { CanvasGraphicsShim } from '../CanvasGraphicsShim.js';

// Drawn after every other adapter's content, matching the Canvas2D behavior where
// GameplayState.renderSpellEffects(ctx) is called after the main Y-sorted entity loop
// (i.e. always on top, regardless of any individual effect's screen position).
const SPELL_EFFECTS_Z_INDEX = 1000000;

/**
 * Phase 6 of the Canvas2D -> Pixi migration: spell/particle effects
 * (GameplayState.spellEffects - arcaneBlast/frostNova/meteorStrike/chainLightning).
 *
 * Unlike towers/enemies, this isn't an entity-convention adapter - spellEffects is a
 * single global array owned by GameplayState, not per-instance state on a class with its
 * own render(ctx)/renderDynamicParts(ctx) split. So there's nothing to bake (Strategy A)
 * and no static/dynamic split needed: GameplayState.renderSpellEffects(ctx) is already a
 * single self-contained Strategy-B draw routine that only reads its `ctx` parameter, so it
 * runs completely unmodified against the CanvasGraphicsShim - this adapter just owns the
 * Graphics/shim pair and hands it to that existing method each frame.
 */
export class SpellEffectRenderAdapter {
    constructor(parentContainer) {
        this.container = new Container();
        this.container.zIndex = SPELL_EFFECTS_Z_INDEX;
        parentContainer.addChild(this.container);

        this.graphics = new Graphics();
        this.container.addChild(this.graphics);
        this.shim = new CanvasGraphicsShim(this.graphics);
        this._lastAnimKey = -1;
    }

    /**
     * Call once per frame when the Pixi renderer is active.
     * Spell particles are capped at 30fps — ring/particle drift at 60fps vs 30fps
     * is imperceptible during the fast-paced spell activation window.
     * @param {(ctx: CanvasGraphicsShim) => void} renderSpellEffectsFn - GameplayState's own
     * renderSpellEffects method, bound to the instance, reused unmodified.
     * @param {boolean} hasActiveEffects - skip the shim entirely when there are no active effects
     */
    sync(renderSpellEffectsFn, hasActiveEffects) {
        if (!hasActiveEffects) {
            // Clear any leftover spell graphics from the previous effect.
            if (this._lastAnimKey !== -1) {
                this.shim.reset();
                this._lastAnimKey = -1;
            }
            return;
        }
        const animKey = (performance.now() / 33) | 0; // ~30fps bucket
        if (animKey === this._lastAnimKey) return;
        this._lastAnimKey = animKey;
        this.shim.reset();
        renderSpellEffectsFn(this.shim);
    }

    destroy() {
        this.shim.destroyGradients();
        this.container.destroy({ children: true });
    }
}
