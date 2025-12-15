import { BuildingRegistry } from './BuildingRegistry.js';

export class BuildingManager {
    constructor(gameState, level) {
        this.gameState = gameState;
        this.level = level;
        this.buildings = [];
        this.occupiedPositions = new Set();
        
        // Building effects tracking
        this.goldPerSecond = 0;
        this.towerUpgrades = {
            damage: 1.0,
            range: 1.0,
            fireRate: 1.0
        };
        this.availableSkills = [];
        this.superWeaponUnlocked = false;
        this.manaPerSecond = 0;
        this.elementalBonuses = {
            fire: { damageBonus: 0 },
            ice: { slowBonus: 0 },
            lightning: { chainRange: 0 },
            earth: { armorPiercing: 0 }
        };
    }
    
    placeBuilding(type, x, y, gridX, gridY) {
        const buildingType = BuildingRegistry.getBuildingType(type);
        if (!buildingType) {
            console.error(`BuildingManager: Building type '${type}' not found in registry!`);
            return false;
        }
        
        
        // Check if the 4x4 position is available
        if (this.isBuildingPositionOccupied(gridX, gridY, buildingType.size)) {
            return false;
        }
        
        // Check for additional costs (e.g., diamonds for Super Weapon Lab)
        if (type === 'superweapon') {
            // Super Weapon Lab requires 5 diamonds + gold
            const diamondCost = 5;
            const academy = this.buildings.find(b => b.constructor.name === 'MagicAcademy');
            if (!academy || (academy.gems.diamond || 0) < diamondCost) {
                return false;
            }
        }
        
        if (this.gameState.spend(buildingType.cost)) {
            // Deduct additional costs
            if (type === 'superweapon') {
                const academy = this.buildings.find(b => b.constructor.name === 'MagicAcademy');
                if (academy) {
                    academy.gems.diamond -= 5;
                }
            }
            
            const building = BuildingRegistry.createBuilding(type, x, y, gridX, gridY);
            this.buildings.push(building);
            
            // Mark the 4x4 area as occupied
            this.markBuildingPosition(gridX, gridY, buildingType.size);
            
            // Apply building effects to this manager
            building.applyEffect(this);
            
            return true;
        } else {
        }
        return false;
    }
    
    isBuildingPositionOccupied(gridX, gridY, size) {
        // Check if any part of the building area is occupied
        for (let x = gridX; x < gridX + size; x++) {
            for (let y = gridY; y < gridY + size; y++) {
                if (this.occupiedPositions.has(`${x},${y}`)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    markBuildingPosition(gridX, gridY, size) {
        // Mark the building area as occupied
        for (let x = gridX; x < gridX + size; x++) {
            for (let y = gridY; y < gridY + size; y++) {
                this.occupiedPositions.add(`${x},${y}`);
            }
        }
    }
    
    // Mark castle as occupied (call after castle is created)
    reserveCastleSpace(castle) {
        if (castle && castle.gridX !== undefined && castle.gridY !== undefined && castle.size !== undefined) {
            this.markBuildingPosition(castle.gridX, castle.gridY, castle.size);
        }
    }
    
    update(deltaTime) {
        this.buildings.forEach(building => {
            building.update(deltaTime);
            
            // Apply mine income multiplier to gold mines
            if (building.constructor.name === 'GoldMine' && this.mineIncomeMultiplier) {
                building.incomeMultiplier = this.mineIncomeMultiplier;
            }
        });
        
        // Recalculate tower upgrades
        this.calculateTowerUpgrades();
    }
    
    calculateTowerUpgrades() {
        // Reset to base values
        this.towerUpgrades = {
            damage: 1,
            range: 1,
            fireRate: 1
        };
        
        this.mineIncomeMultiplier = 1;
        
        // Apply effects from all buildings
        this.buildings.forEach(building => {
            if (building.applyEffect) {
                building.applyEffect(this);
            }
        });
    }
    
    handleClick(x, y, canvasSize) {
        
        // Clear all selections first
        this.buildings.forEach(building => {
            if (building.deselect) building.deselect();
        });
        
        // Check for ANY building interaction
        const cellSize = Math.floor(32 * Math.max(0.5, Math.min(2.5, canvasSize.width / 1920)));
        
        // First check toggle icon clicks for gold mines (in grid space)
        for (const building of this.buildings) {
            if (building.constructor.name === 'GoldMine' && building.gemMiningUnlocked) {
                // Toggle icon is at the top-left of the 4x4 building grid
                const toggleGridX = building.gridX;
                const toggleGridY = building.gridY;
                const togglePixelX = toggleGridX * cellSize + 12; // Offset within grid cell
                const togglePixelY = toggleGridY * cellSize + 12;
                
                const toggleIconSize = 25;
                const clickBuffer = 5;
                if (x >= togglePixelX - (toggleIconSize/2 + clickBuffer) && x <= togglePixelX + (toggleIconSize/2 + clickBuffer) &&
                    y >= togglePixelY - (toggleIconSize/2 + clickBuffer) && y <= togglePixelY + (toggleIconSize/2 + clickBuffer)) {
                    
                    // Call toggle method
                    building.toggleGemMode();
                    building.goldReady = false;
                    building.currentProduction = 0;
                    return 0; // No gold collected on toggle
                }
            }
        }
        
        // Then check regular building grid-based clicks
        for (const building of this.buildings) {
            // Use grid-based coordinates, not screen coordinates
            const buildingGridWidth = building.size;
            const buildingGridHeight = building.size;
            const buildingLeftEdge = building.gridX * cellSize;
            const buildingTopEdge = building.gridY * cellSize;
            const buildingRightEdge = buildingLeftEdge + (buildingGridWidth * cellSize);
            const buildingBottomEdge = buildingTopEdge + (buildingGridHeight * cellSize);
            
            // Check if click is within the building's grid area
            const clickIsValid = x >= buildingLeftEdge && x <= buildingRightEdge && y >= buildingTopEdge && y <= buildingBottomEdge;
            
            
            if (clickIsValid) {
                
                // Call the building's onClick method directly
                if (building.onClick) {
                    const result = building.onClick();
                    return result;
                } else if (building.constructor.name === 'GoldMine') {
                    // Fallback for GoldMine if onClick doesn't exist
                    return building.collectGold();
                }
                break;
            }
        }
        
        return null;
    }
    
    render(ctx) {
        this.buildings.forEach(building => this.renderBuilding(ctx, building));
    }
    
    renderBuilding(ctx, building) {
        // Get cell size - use ResolutionManager if available
        const cellSize = building.getCellSize(ctx);
        const buildingSize = cellSize * building.size;
        
        // Building shadow - FIXED: Only for the actual building, not full grid
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(building.x - buildingSize/2 + 5, building.y - buildingSize/2 + 5, buildingSize, buildingSize);
        
        building.render(ctx, buildingSize);
    }
    
    getBuildingInfo(type) {
        const buildingClass = BuildingRegistry.getBuildingClass(type);
        if (!buildingClass || !buildingClass.getInfo) return null;
        
        return buildingClass.getInfo();
    }
    
    updatePositions(level) {
        this.buildings.forEach(building => {
            const { screenX, screenY } = level.gridToScreen(building.gridX, building.gridY, 4);
            building.x = screenX;
            building.y = screenY;
        });
    }
    
    /**
     * Sell a building: free up grid positions, refund 70% of cost, remove building
     */
    sellBuilding(building) {
        if (!building) return false;
        
        // Get building cost info
        const buildingInfo = building.constructor.getInfo();
        const refund = Math.floor(buildingInfo.cost * 0.7);
        
        // Free up the occupied positions
        const size = building.size || 4;
        for (let x = building.gridX; x < building.gridX + size; x++) {
            for (let y = building.gridY; y < building.gridY + size; y++) {
                this.occupiedPositions.delete(`${x},${y}`);
            }
        }
        
        // Remove building from array
        const index = this.buildings.indexOf(building);
        if (index !== -1) {
            this.buildings.splice(index, 1);
        }
        
        // Refund the player
        this.gameState.gold += refund;
        
        // Recalculate tower upgrades (since building effects may have changed)
        this.calculateTowerUpgrades();
        
        return true;
    }
}

