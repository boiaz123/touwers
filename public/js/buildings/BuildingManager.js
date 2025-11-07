import { Arsenal } from './Arsenal.js';
import { GoldMine } from './GoldMine.js';
import { ArcaneAcademy } from './ArcaneAcademy.js';
import { FusionCore } from './FusionCore.js';

export class BuildingManager {
    constructor(gameState, level) {
        this.gameState = gameState;
        this.level = level;
        this.buildings = [];
        this.buildingTypes = {
            'arsenal': { class: Arsenal, cost: 300 },
            'goldmine': { class: GoldMine, cost: 250 },
            'academy': { class: ArcaneAcademy, cost: 400 },
            'fusioncore': { class: FusionCore, cost: 1000 }
        };
        // Track occupied grid positions by buildings (4x4 each)
        this.occupiedPositions = new Set();
    }
    
    placeBuilding(type, x, y, gridX, gridY) {
        const buildingType = this.buildingTypes[type];
        if (!buildingType) return false;
        
        // Check if the 4x4 position is available
        if (this.isBuildingPositionOccupied(gridX, gridY)) {
            console.log('BuildingManager: Position already occupied');
            return false;
        }
        
        if (this.gameState.spend(buildingType.cost)) {
            const building = new buildingType.class(x, y, gridX, gridY, this.gameState);
            this.buildings.push(building);
            
            // Mark the 4x4 area as occupied
            this.markBuildingPosition(gridX, gridY);
            
            console.log(`BuildingManager: Placed ${type} building at grid (${gridX}, ${gridY})`);
            return true;
        }
        return false;
    }
    
    isBuildingPositionOccupied(gridX, gridY) {
        // Check if any part of the 4x4 building area is occupied
        for (let x = gridX; x < gridX + 4; x++) {
            for (let y = gridY; y < gridY + 4; y++) {
                if (this.occupiedPositions.has(`${x},${y}`)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    markBuildingPosition(gridX, gridY) {
        // Mark the 4x4 area as occupied
        for (let x = gridX; x < gridX + 4; x++) {
            for (let y = gridY; y < gridY + 4; y++) {
                this.occupiedPositions.add(`${x},${y}`);
            }
        }
    }
    
    removeBuilding(building) {
        const index = this.buildings.indexOf(building);
        if (index !== -1) {
            this.buildings.splice(index, 1);
            
            // Free up the occupied positions
            for (let x = building.gridX; x < building.gridX + 4; x++) {
                for (let y = building.gridY; y < building.gridY + 4; y++) {
                    this.occupiedPositions.delete(`${x},${y}`);
                }
            }
        }
    }
    
    update(deltaTime, towers, enemies) {
        this.buildings.forEach(building => {
            building.update(deltaTime, towers, enemies);
        });
    }
    
    render(ctx) {
        this.buildings.forEach(building => building.render(ctx));
    }
    
    getBuildingInfo(type) {
        const buildingType = this.buildingTypes[type];
        if (buildingType && buildingType.class.getInfo) {
            return buildingType.class.getInfo();
        }
        return null;
    }
    
    // Get building effects for towers
    getTowerUpgrades(tower) {
        let damageMultiplier = 1;
        let rangeBonus = 0;
        let fireRateMultiplier = 1;
        
        this.buildings.forEach(building => {
            if (building.type === 'arsenal' && building.isInRange(tower.x, tower.y)) {
                damageMultiplier *= building.getDamageMultiplier();
                rangeBonus += building.getRangeBonus();
            }
        });
        
        return { damageMultiplier, rangeBonus, fireRateMultiplier };
    }
    
    // Get available spells from academies
    getAvailableSpells() {
        const spells = [];
        this.buildings.forEach(building => {
            if (building.type === 'academy') {
                spells.push(...building.getAvailableSpells());
            }
        });
        return spells;
    }
    
    // Check if fusion cores allow combination towers
    canBuildCombinationTowers() {
        return this.buildings.some(building => building.type === 'fusioncore' && building.isActive());
    }
}
