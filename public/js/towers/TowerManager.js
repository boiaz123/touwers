import { BasicTower } from './BasicTower.js';

export class TowerManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.towers = [];
        this.towerTypes = {
            'basic': { class: BasicTower, cost: 50 },
            'cannon': { class: BasicTower, cost: 100 }, // Using BasicTower for now
            'archer': { class: BasicTower, cost: 75 },  // Using BasicTower for now
            'magic': { class: BasicTower, cost: 150 }   // Using BasicTower for now
        };
    }
    
    placeTower(type, x, y) {
        const towerType = this.towerTypes[type];
        if (!towerType) return false;
        
        if (this.gameState.spend(towerType.cost)) {
            const tower = new towerType.class(x, y);
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
}
