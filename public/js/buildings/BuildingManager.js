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
            'superweapon': { class: SuperWeaponLab, cost: 500, size: 4 }
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
        if (!buildingType) return false;
        
        // Check if the 4x4 position is available
        if (this.isBuildingPositionOccupied(gridX, gridY, buildingType.size)) {
            console.log('BuildingManager: Building position occupied');
            return false;
        }
        
        if (this.gameState.spend(buildingType.cost)) {
            const building = new buildingType.class(x, y, gridX, gridY);
            this.buildings.push(building);
            
            // Mark the 4x4 area as occupied
            this.markBuildingPosition(gridX, gridY, buildingType.size);
            
            // Apply building effects to this manager
            building.applyEffect(this);
            
            console.log(`BuildingManager: Placed ${type} building at grid (${gridX}, ${gridY})`);
            return true;
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
        
        // Check building icon clicks with proper size calculation
        const cellSize = Math.floor(32 * Math.max(0.5, Math.min(2.5, canvasSize.width / 1920)));
        const iconSize = 20;
        console.log(`BuildingManager: Cell size calculated as ${cellSize}`);
        
        for (const building of this.buildings) {
            // Icon position: bottom right of building grid, slightly floating up
            const iconX = (building.gridX + building.size - 0.5) * cellSize;
            const iconY = (building.gridY + building.size - 0.5) * cellSize - 5; // Float up slightly
            
            console.log(`BuildingManager: Checking ${building.constructor.name} icon at (${iconX}, ${iconY}) with size ${iconSize}`);
            
            if (x >= iconX - iconSize/2 && x <= iconX + iconSize/2 &&
                y >= iconY - iconSize/2 && y <= iconY + iconSize/2) {
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
    
    getBuildingTypeFromInstance(building) {
        const className = building.constructor.name;
        switch(className) {
            case 'TowerForge': return { size: 4 };
            case 'MagicAcademy': return { size: 4 };
            case 'GoldMine': return { size: 4 };
            case 'SuperWeaponLab': return { size: 4 };
            default: return { size: 4 };
        }
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
}
