import { GoldMine } from './GoldMine.js';
import { TowerForge } from './TowerForge.js';
import { MagicAcademy } from './MagicAcademy.js';
import { SuperWeaponLab } from './SuperWeaponLab.js';

export class BuildingManager {
    constructor(gameState, level) {
        this.gameState = gameState;
        this.level = level;
        this.buildings = [];
        this.buildingTypes = {
            'mine': { class: GoldMine, cost: 200, size: 4 },
            'forge': { class: TowerForge, cost: 300, size: 4 },
            'academy': { class: MagicAcademy, cost: 250, size: 4 },
            'superweapon': { class: SuperWeaponLab, cost: 1000, size: 4 }
        };
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
        const buildingType = this.buildingTypes[type];
        if (!buildingType) {
            console.error(`BuildingManager: Building type '${type}' not found in buildingTypes!`);
            console.log('Available types:', Object.keys(this.buildingTypes));
            return false;
        }
        
        console.log(`BuildingManager: Attempting to place ${type} at grid (${gridX}, ${gridY})`);
        
        // Check if the 4x4 position is available
        if (this.isBuildingPositionOccupied(gridX, gridY, buildingType.size)) {
            console.log(`BuildingManager: ${type} position occupied at (${gridX}, ${gridY})`);
            return false;
        }
        
        console.log(`BuildingManager: Position available, spending ${buildingType.cost} gold`);
        
        if (this.gameState.spend(buildingType.cost)) {
            const building = new buildingType.class(x, y, gridX, gridY);
            this.buildings.push(building);
            
            // Mark the 4x4 area as occupied
            this.markBuildingPosition(gridX, gridY, buildingType.size);
            
            // Apply building effects to this manager
            building.applyEffect(this);
            
            console.log(`BuildingManager: Successfully placed ${type} building at grid (${gridX}, ${gridY})`);
            return true;
        } else {
            console.log(`BuildingManager: Not enough gold to place ${type}`);
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
        console.log(`BuildingManager: Click at (${x}, ${y}), checking ${this.buildings.length} buildings`);
        
        // Clear all selections first
        this.buildings.forEach(building => {
            if (building.deselect) building.deselect();
        });
        
        // Check for ANY building interaction (icon clicks or regular clicks)
        const cellSize = Math.floor(32 * Math.max(0.5, Math.min(2.5, canvasSize.width / 1920)));
        const iconSize = 30;
        
        // First check toggle icon clicks for gold mines
        for (const building of this.buildings) {
            if (building.constructor.name === 'GoldMine' && building.gemMiningUnlocked) {
                const toggleIconSize = 25;
                const toggleX = building.x - (cellSize * 4) / 2 + 12; // Top-left corner
                const toggleY = building.y - (cellSize * 4) / 2 + 12;
                
                const clickBuffer = 5;
                if (x >= toggleX - (toggleIconSize/2 + clickBuffer) && x <= toggleX + (toggleIconSize/2 + clickBuffer) &&
                    y >= toggleY - (toggleIconSize/2 + clickBuffer) && y <= toggleY + (toggleIconSize/2 + clickBuffer)) {
                    console.log(`BuildingManager: HIT! Clicked on toggle icon`);
                    
                    // Call toggle method
                    building.toggleGemMode();
                    building.goldReady = false;
                    building.currentProduction = 0;
                    console.log(`BuildingManager: Toggled mine to ${building.gemMode ? 'gem' : 'gold'} mode`);
                    return 0; // No gold collected on toggle
                }
            }
        }
        
        // Then check regular building icon clicks
        for (const building of this.buildings) {
            // Icon position: bottom right of building grid, slightly floating up
            const iconX = (building.gridX + building.size - 0.5) * cellSize;
            const iconY = (building.gridY + building.size - 0.5) * cellSize - 5;
            
            // Add small buffer for easier clicking
            const clickBuffer = 5;
            if (x >= iconX - (iconSize/2 + clickBuffer) && x <= iconX + (iconSize/2 + clickBuffer) &&
                y >= iconY - (iconSize/2 + clickBuffer) && y <= iconY + (iconSize/2 + clickBuffer)) {
                console.log(`BuildingManager: HIT! Clicked on ${building.constructor.name} icon`);
                
                // Call the building's onClick method directly
                if (building.onClick) {
                    const result = building.onClick();
                    console.log(`BuildingManager: onClick result:`, result);
                    return result;
                } else if (building.constructor.name === 'GoldMine') {
                    // Fallback for GoldMine if onClick doesn't exist
                    return building.collectGold();
                }
                break;
            }
        }
        
        console.log('BuildingManager: No building icon hit');
        return null;
    }
    
    render(ctx) {
        this.buildings.forEach(building => this.renderBuilding(ctx, building));
    }
    
    renderBuilding(ctx, building) {
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const buildingSize = cellSize * building.size;
        
        // Building shadow - FIXED: Only for the actual building, not full grid
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(building.x - buildingSize/2 + 5, building.y - buildingSize/2 + 5, buildingSize, buildingSize);
        
        building.render(ctx, buildingSize);
    }
    
    getBuildingInfo(type) {
        const buildingType = this.buildingTypes[type];
        if (!buildingType) return null;
        
        return buildingType.class.getInfo();
    }
    
    updatePositions(level) {
        this.buildings.forEach(building => {
            const { screenX, screenY } = level.gridToScreen(building.gridX, building.gridY, 4);
            building.x = screenX;
            building.y = screenY;
        });
    }
}
