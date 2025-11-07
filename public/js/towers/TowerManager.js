import { BasicTower } from './BasicTower.js';
import { CannonTower } from './CannonTower.js';
import { ArcherTower } from './ArcherTower.js';
import { MagicTower } from './MagicTower.js';

export class TowerManager {
    constructor(gameState, level) {
        this.gameState = gameState;
        this.level = level;
        this.towers = [];
        this.towerTypes = {
            'basic': { class: BasicTower, cost: 50 },
            'cannon': { class: CannonTower, cost: 100 },
            'archer': { class: ArcherTower, cost: 75 },
            'magic': { class: MagicTower, cost: 150 }
        };
        // Track occupied grid positions by towers
        this.occupiedPositions = new Set();
    }
    
    placeTower(type, x, y, gridX, gridY) {
        const towerType = this.towerTypes[type];
        if (!towerType) return false;
        
        // Check if the position is already occupied by another tower
        if (this.isTowerPositionOccupied(gridX, gridY)) {
            console.log('TowerManager: Position already occupied by another tower');
            return false;
        }
        
        if (this.gameState.spend(towerType.cost)) {
            const tower = new towerType.class(x, y, gridX, gridY);
            this.towers.push(tower);
            
            // Mark the 2x2 area as occupied by this tower
            this.markTowerPosition(gridX, gridY);
            
            console.log(`TowerManager: Placed ${type} tower at grid (${gridX}, ${gridY})`);
            return true;
        }
        return false;
    }
    
    isTowerPositionOccupied(gridX, gridY) {
        // Check if any part of the 2x2 tower area is occupied
        for (let x = gridX; x < gridX + 2; x++) {
            for (let y = gridY; y < gridY + 2; y++) {
                if (this.occupiedPositions.has(`${x},${y}`)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    markTowerPosition(gridX, gridY) {
        // Mark the 2x2 area as occupied
        for (let x = gridX; x < gridX + 2; x++) {
            for (let y = gridY; y < gridY + 2; y++) {
                this.occupiedPositions.add(`${x},${y}`);
            }
        }
    }
    
    removeTower(tower) {
        const index = this.towers.indexOf(tower);
        if (index !== -1) {
            this.towers.splice(index, 1);
            
            // Free up the occupied positions
            for (let x = tower.gridX; x < tower.gridX + 2; x++) {
                for (let y = tower.gridY; y < tower.gridY + 2; y++) {
                    this.occupiedPositions.delete(`${x},${y}`);
                }
            }
        }
    }
    
    update(deltaTime, enemies, buildingManager = null) {
        this.towers.forEach(tower => {
            // Apply building upgrades if building manager is available
            if (buildingManager) {
                const upgrades = buildingManager.getTowerUpgrades(tower);
                
                // Store original values if not already stored
                if (!tower.originalDamage) {
                    tower.originalDamage = tower.damage;
                    tower.originalRange = tower.range;
                    tower.originalFireRate = tower.fireRate;
                }
                
                // Apply upgrades
                tower.damage = Math.floor(tower.originalDamage * upgrades.damageMultiplier);
                tower.range = tower.originalRange + upgrades.rangeBonus;
                tower.fireRate = tower.originalFireRate * upgrades.fireRateMultiplier;
            }
            
            tower.update(deltaTime, enemies);
        });
    }
    
    render(ctx) {
        this.towers.forEach(tower => tower.render(ctx));
    }
    
    getTowerInfo(type) {
        const towerType = this.towerTypes[type];
        if (towerType && towerType.class.getInfo) {
            return towerType.class.getInfo();
        }
        return null;
    }
}
