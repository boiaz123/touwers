import { Container, Sprite, Texture } from 'pixi.js';

// Sits below every other render adapter's container once more subsystems
// migrate to Pixi; for now it's the only Pixi content on stage.
const BACKGROUND_Z_INDEX = -1000000;

/**
 * Phase 2 of the Canvas2D -> Pixi migration: the level's static
 * background + terrain (water/rivers/path) layer. LevelBase.js already
 * pre-renders these once per level onto offscreen canvases
 * (this.backgroundCanvas / this.terrainCanvas) and blits them via
 * ctx.drawImage every frame - that existing, untouched cache-population
 * code is reused verbatim as the Strategy-A texture source. This adapter
 * just wraps those same canvases in PIXI.Texture/Sprite instead.
 */
export class BackgroundRenderAdapter {
    constructor(parentContainer) {
        this.container = new Container();
        this.container.zIndex = BACKGROUND_Z_INDEX;
        parentContainer.addChild(this.container);

        this._backgroundSprite = new Sprite();
        this._terrainSprite = new Sprite();
        this.container.addChild(this._backgroundSprite);
        this.container.addChild(this._terrainSprite);

        // Track which offscreen canvas each sprite's texture currently wraps,
        // so we only rebuild a PIXI.Texture when the level (re)builds its cache
        // (e.g. on level load, or after the backgroundCanvas/terrainCanvas null-out
        // that happens on a resolution-driven reinitialize).
        this._bakedBackgroundCanvas = null;
        this._bakedTerrainCanvas = null;
    }

    /**
     * Call once per frame after level.render(ctx) has run (so
     * level.backgroundCanvas / level.terrainCanvas are guaranteed built).
     * @param {import('../../../entities/levels/LevelBase.js').LevelBase} level
     * @returns {boolean} true if both layers are baked and on stage
     */
    syncLevel(level) {
        if (!level || !level.backgroundCanvas || !level.terrainCanvas) {
            return false;
        }

        if (level.backgroundCanvas !== this._bakedBackgroundCanvas) {
            this._backgroundSprite.texture = this._wrapCanvas(level.backgroundCanvas);
            this._bakedBackgroundCanvas = level.backgroundCanvas;
        }

        if (level.terrainCanvas !== this._bakedTerrainCanvas) {
            this._terrainSprite.texture = this._wrapCanvas(level.terrainCanvas);
            this._bakedTerrainCanvas = level.terrainCanvas;
        }

        return true;
    }

    _wrapCanvas(canvas) {
        const texture = Texture.from(canvas);
        texture.source.scaleMode = 'linear';
        return texture;
    }

    reset() {
        this._bakedBackgroundCanvas = null;
        this._bakedTerrainCanvas = null;
        this._backgroundSprite.texture = Texture.EMPTY;
        this._terrainSprite.texture = Texture.EMPTY;
    }

    /** Call when leaving gameplay (GameplayState.exit()) so the next level starts with a fresh adapter. */
    destroy() {
        // Only destroy textures we actually baked - sprites still on Texture.EMPTY (the
        // shared Pixi default, e.g. if this adapter was created but never synced) must
        // not be destroyed, since that's a process-wide singleton.
        if (this._bakedBackgroundCanvas) this._backgroundSprite.texture.destroy(true);
        if (this._bakedTerrainCanvas) this._terrainSprite.texture.destroy(true);
        this.container.destroy({ children: true });
    }
}
