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
