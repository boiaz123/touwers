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
    }
    
    placeTower(type, x, y, gridX, gridY) {
        const towerType = this.towerTypes[type];
        if (!towerType) return false;
        
        if (this.gameState.spend(towerType.cost)) {
            const tower = new towerType.class(x, y, gridX, gridY);
            this.towers.push(tower);
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
