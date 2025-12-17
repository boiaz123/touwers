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
            case 'GoldMine':
                this.renderGoldMineSettlement(ctx, size);
                break;
            case 'TowerForge':
                this.renderTowerForgeSettlement(ctx, size);
                break;
            case 'MagicAcademy':
                this.renderMagicAcademySettlement(ctx, size);
                break;
            default:
                // For other buildings, use their default rendering
                this.building.render(ctx, size);
        }
    }

    /**
     * Gold Mine settlement rendering
     * Shows the mine visuals WITHOUT:
     * - Toggle icon (gem/gold switch)
     * - Production status display
     * - Ready indicator
     * 
     * This allows customization of settlement appearance independently
     */
    renderGoldMineSettlement(ctx, size) {
        // Save original ready states so we can restore them
        const originalGoldReady = this.building.goldReady;

        // Temporarily hide the ready/icon for settlement rendering
        this.building.goldReady = false;

        // Render all the visual components EXCEPT the game-specific UI
        this.building.renderExcavatedGround(ctx, size);
        this.building.renderStaticEnvironment(ctx, size);
        this.building.renderMineTrack(ctx, size);
        this.building.renderWorkers(ctx, size);

        // Render gold piles if any exist (visual only, not functional)
        if (this.building.goldPiles && this.building.goldPiles.length > 0) {
            this.building.renderGoldPiles(ctx, size);
        }

        this.building.renderDustClouds(ctx);

        // NOTE: NOT rendering:
        // - renderProductionStatus() - game mechanic UI
        // - renderToggleIcon() - game mechanic UI
        // - renderFloatingTexts() - game mechanic UI
        // - renderFlashEffect() - game mechanic effect

        // Restore original state for in-game use
        this.building.goldReady = originalGoldReady;
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
}

