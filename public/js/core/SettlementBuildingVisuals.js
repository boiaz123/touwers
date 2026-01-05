/**
 * SettlementBuildingVisuals
 * Handles settlement-specific rendering for buildings
 * This layer is completely separate from in-game building rendering
 * 
 * Key difference: Settlement visuals do NOT render in-game-specific UI elements
 * like production status, toggle icons, or other game mechanics
 */

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
            case 'TowerForge':
                this.renderTowerForgeSettlement(ctx, size);
                break;
            case 'MagicAcademy':
                this.renderMagicAcademySettlement(ctx, size);
                break;
            case 'Castle':
                this.renderCastleSettlement(ctx, size);
                break;
            default:
                // For other buildings, use their default rendering
                this.building.render(ctx, size);
        }
    }

    /**
     * Tower Forge settlement rendering
     * For now, use the full render since we're still designing settlement customization
     */
    renderTowerForgeSettlement(ctx, size) {
        this.building.render(ctx, size);
    }

    /**
     * Magic Academy settlement rendering
     * For now, use the full render since we're still designing settlement customization
     */
    renderMagicAcademySettlement(ctx, size) {
        this.building.render(ctx, size);
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
        this.building.drawFlags(ctx);
        
        ctx.restore();
        
        // NOTE: NOT rendering drawHealthBar() - this is settlement-specific, no game UI
    }
}


