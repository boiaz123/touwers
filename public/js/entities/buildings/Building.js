export class Building {
    constructor(x, y, gridX, gridY, size = 4) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.size = size;
        this.type = null; // Will be set by BuildingRegistry when creating
        this.animationTime = 0;
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
    }
    
    /**
     * Get cell size from resolution manager if available
     */
    getCellSize(ctx) {
        if (ctx && ctx.resolutionManager) {
            return ctx.resolutionManager.cellSize;
        }
        // Fallback: manual calculation
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, (ctx && ctx.canvas ? ctx.canvas.width : 1920) / baseResolution));
        return Math.floor(32 * scaleFactor);
    }
    
    render(ctx, buildingSize) {
        // Override in subclasses
    }

    /**
     * Extra downward pixel offset (relative to buildingSize = cellSize * this.size) applied
     * to this.y once, when the building is placed/repositioned - lets a subclass whose
     * artwork is drawn "tall" (e.g. MagicAcademy's towers/roof) sit its ground plane lower
     * within its placement square instead of at the exact grid-cell centre. Zero for
     * everything else. See BuildingManager.placeBuilding/updatePositions.
     */
    getVisualYOffset(buildingSize) {
        return 0;
    }

    /**
     * Screen-space Y used to depth-sort this building against trees/rocks/towers/enemies
     * sharing the Pixi entity layer's Y-sort (see BuildingRenderAdapter.js) - the ground
     * contact point where the building's NxN footprint actually meets the surrounding
     * terrain, not this.y itself (which getVisualYOffset nudges around purely so a given
     * subclass's "tall" artwork grounds nicely within its own tile - see MagicAcademy's
     * VISUAL_SCALE doc comment).
     *
     * Grounded at the FRONT edge of the placement square (the edge closest to the camera,
     * i.e. the largest-Y edge) rather than the footprint centre - mirrors how
     * LevelBase.getTerrainElementDepthY() grounds trees at their trunk-base row instead of
     * a shifted canopy anchor. A terrain tree planted in front of that edge must draw in
     * front of the building; one behind it must draw behind - regardless of how far the
     * unclipped artwork (spires, moat, decorative trees) bleeds past the footprint (see
     * MagicAcademy/GoldMine's "no clip applied" notes). Without this correction the sort
     * key sat back near the footprint centre, letting rows of real terrain trees that are
     * actually beside/in front of the building lose the sort and draw underneath it.
     */
    getSortDepthY(buildingSize) {
        return this.y - this.getVisualYOffset(buildingSize) + buildingSize / 2;
    }

    /**
     * Grid-cell radius of real level terrain (trees/rocks/vegetation) to remove around
     * this building's footprint when it's placed - see LevelBase.clearTerrainNear,
     * called once from GameplayState right after a successful placement. Zero for every
     * building: real terrain is never deleted to make room for a building's own art -
     * a building is placed among the existing level like any other entity, not carved
     * a hole out of it.
     *
     * Subclasses whose baked artwork deliberately surrounds itself with a decorative
     * ring of trees (MagicAcademy, GoldMine) face the same underlying problem: a single
     * scalar Y-sort key (see BuildingRenderAdapter.js's zIndex comment) can never
     * correctly interleave a real terrain tree (its own sibling sprite, sorted
     * independently) against a wide building silhouette that has trees standing on every
     * side of it. GoldMine resolves this by overriding getSortDepthY to sort by its own
     * back edge instead of the usual front edge, so it reliably loses that sort against
     * real terrain nearby and renders behind it (see GoldMine.getSortDepthY's doc
     * comment) - deleting nothing. This clearing radius mechanism remains here for any
     * building that would rather solve it the other way.
     */
    getClearingRadius() {
        return 0;
    }

    applyEffect(towerManager) {
        // Override in subclasses
    }
    
    static getInfo() {
        return {
            name: 'Base Building',
            description: 'Base building class',
            effect: 'None',
            size: '4x4',
            cost: 0
        };
    }
}
