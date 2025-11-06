import { BasicTower } from './BasicTower.js';
import { CannonTower } from './CannonTower.js';
import { ArcherTower } from './ArcherTower.js';
import { MagicTower } from './MagicTower.js';

export class TowerManager {
    constructor(gameState, level) {
        this.gameState = gameState;
        this.level = level; // Add level reference
        this.towers = [];
        this.towerTypes = {
            'basic': { class: BasicTower, cost: 50 },
            'cannon': { class: CannonTower, cost: 100 },
            'archer': { class: ArcherTower, cost: 75 },
            'magic': { class: MagicTower, cost: 150 }
        };
    }
    
    placeTower(type, x, y, ctx = null) {
        const towerType = this.towerTypes[type];
        if (!towerType || !this.level) return false;
        
        // Check if placement is valid using level's grid system
        if (!this.level.canPlaceTower(x, y, ctx)) {
            return false;
        }
        
        if (this.gameState.spend(towerType.cost)) {
            // Get the proper grid-aligned position
            const centerPos = this.level.getGridCenterPosition(x, y, ctx);
            
            // Create tower at grid-aligned position
            const tower = new towerType.class(centerPos.x, centerPos.y);
            this.towers.push(tower);
            
            // Occupy the grid cells
            this.level.occupyGridCell(x, y, ctx);
            
            return true;
        }
        return false;
    }
    
    update(deltaTime, enemies) {
        this.towers.forEach(tower => tower.update(deltaTime, enemies));
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
