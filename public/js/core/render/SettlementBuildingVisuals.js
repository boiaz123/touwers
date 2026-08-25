/**
 * SettlementBuildingVisuals
 * Handles settlement-specific rendering for buildings
 * This layer is completely separate from in-game building rendering
 *
 * Key difference: Settlement visuals do NOT render in-game-specific UI elements
 * like production status, toggle icons, or other game mechanics
 */

// Matches BuildingRenderAdapter.js's BAKE_CANVAS_SCALE - the same margin already
// proven sufficient (in the Pixi gameplay path) to hold every building type's full
// static extent, including ones that reach noticeably outside their own grid cell
// (e.g. MagicAcademy's moat/bridge).
const BAKE_SCALE = 3;

const NOOP = () => {};

/**
 * Bakes a building's renderStaticBack(ctx, size) output to an offscreen canvas
 * once, caching the result on the building instance itself (keyed by size) so
 * repeat calls across frames are free. Shared by SettlementBuildingVisuals below
 * and by SettlementHub's own TrainingGrounds preview path (TrainingGrounds is
 * rendered directly there rather than through SettlementBuildingVisuals, but the
 * exact same "renderStaticBack is expensive and 100% deterministic" reasoning
 * applies, so it reuses this instead of duplicating the technique).
 */
export function ensureSettlementStaticBake(building, size) {
    const cached = building._settlementStaticBake;
    if (cached && cached.size === size) {
        return cached;
    }

    const bakeSize = Math.ceil(size * BAKE_SCALE);
    const origin = bakeSize / 2;
    const canvas = document.createElement('canvas');
    canvas.width = bakeSize;
    canvas.height = bakeSize;
    const bakeCtx = canvas.getContext('2d');

    // Shift the bake context so the building's REAL (this.x, this.y) - never
    // touched - lands at the bake canvas's center. Deliberately a context-level
    // translate rather than temporarily reassigning building.x/y (the technique
    // BuildingRenderAdapter.js uses for the Pixi path): at least one building type
    // (WorkshopHall) has renderStaticBack side effects that cache this.x/this.y-
    // derived ABSOLUTE bounds on the instance for a later live effect to read
    // (_windowGlowBounds/_poleTopBounds, read by renderMapGlow/renderBanner from
    // renderDynamicParts). Mutating building.x/y during the bake poisons those
    // bounds with the fake bake-origin position - and since this bake only runs
    // once per session (that's the whole point of caching it), they'd never get
    // corrected, leaving the effect floating at the wrong screen position for the
    // rest of the session (this is exactly what happened before this fix - a
    // WorkshopHall map-glow/banner rendering high in the sky, nowhere near the
    // building). Translating the context instead leaves this.x/this.y at their
    // real values throughout, so any such side effect computes the correct
    // absolute position, regardless of which building type does this.
    bakeCtx.translate(origin - building.x, origin - building.y);
    building.renderStaticBack(bakeCtx, size);

    const cache = { size, canvas, origin };
    building._settlementStaticBake = cache;
    return cache;
}

export class SettlementBuildingVisuals {
    constructor(building) {
        this.building = building;
    }

    /**
     * Render settlement-specific visuals
     * Does NOT call the building's in-game render method
     * Instead provides custom settlement display
     */
    render(ctx, size) {
        const buildingType = this.building.constructor.name;

        switch (buildingType) {
            case 'Castle':
                this.renderCastleSettlement(ctx, size);
                break;
            default:
                this.renderCachedBody(ctx, size);
        }
    }

    /**
     * PRE-RENDER OPTIMIZATION: every Building subclass's render() calls
     * renderStaticBack() (a fully deterministic structure - walls, roof, chimney,
     * bridge, etc, worth dozens of gradient/path operations across the building
     * files) followed by renderDynamicParts() (the actual animated bits - fire
     * flicker, worker sway). The Settlement Hub was recomputing renderStaticBack's
     * full output from scratch every single frame, 60x/sec, for every building
     * placed, because this Canvas2D preview path never goes through the Pixi
     * BuildingRenderAdapter that the gameplay canvas uses to bake exactly this same
     * content once per building type (see BuildingRenderAdapter.js's
     * _getOrBakeLayer - same BAKE_SCALE/origin-translate technique reused below,
     * already proven safe: that adapter shares one baked texture across every
     * instance of a building type, so the static structure is confirmed
     * upgrade-level-independent by design, not just by assumption here).
     *
     * renderStaticBack's output is baked to an offscreen canvas once per
     * (building, size) and blitted every frame instead. Everything else - dynamic
     * parts, and each building's own "not yet migrated" particle/effect calls -
     * still runs live every frame by calling the building's real render() with
     * renderStaticBack temporarily stubbed to a no-op, so this file doesn't need
     * to know or duplicate each building type's specific post-static call list.
     */
    renderCachedBody(ctx, size) {
        const building = this.building;
        if (typeof building.renderStaticBack !== 'function') {
            building.render(ctx, size);
            return;
        }

        const cache = ensureSettlementStaticBake(building, size);
        ctx.drawImage(cache.canvas, building.x - cache.origin, building.y - cache.origin);

        const realStaticBack = building.renderStaticBack;
        building.renderStaticBack = NOOP;
        try {
            building.render(ctx, size);
        } finally {
            building.renderStaticBack = realStaticBack;
        }
    }

    /**
     * Castle settlement rendering
     * Renders the castle without the health bar (settlement-specific UI)
     */
    renderCastleSettlement(ctx, size) {
        // Render castle structure without health bar
        ctx.save();
        ctx.translate(this.building.x, this.building.y);

        // Draw damage flash if active
        if (this.building.damageFlashTimer > 0) {
            const flashIntensity = this.building.damageFlashTimer / this.building.damageFlashDuration;
            ctx.fillStyle = `rgba(255, 100, 100, ${flashIntensity * 0.5})`;
            ctx.fillRect(-this.building.wallWidth/2 - 50, -this.building.wallHeight/2 - 50, this.building.wallWidth + 100, this.building.wallHeight + 100);
        }

        // Draw all castle components
        this.building.drawMainWall(ctx);
        this.building.drawTower(ctx, -this.building.wallWidth/2 - this.building.towerWidth/2, 'left');
        this.building.drawTower(ctx, this.building.wallWidth/2 + this.building.towerWidth/2, 'right');
        this.building.drawCastleBase(ctx);
        this.building.drawGate(ctx);
        this.building.drawCrenellations(ctx);

        ctx.restore();

        // NOTE: NOT rendering drawHealthBar() - this is settlement-specific, no game UI
    }
}
