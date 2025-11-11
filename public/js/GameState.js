export class GameState {
    constructor() {
        this.health = 20;
        this.gold = 500;
        this.gems = {
            fire: 0,
            water: 0,
            air: 0,
            earth: 0
        };
        this.wave = 1;
    }
    
    canAfford(cost) {
        return this.gold >= cost;
    }
    
    canAffordWithGems(cost, gemType) {
        if (typeof cost === 'object') {
            // Cost is {gold: X, gems: {fire: X, water: X, ...}}
            return this.gold >= (cost.gold || 0) && 
                   this.gems[gemType] >= (cost.gems?.[gemType] || 0);
        }
        return this.gold >= cost;
    }
    
    spend(amount) {
        if (this.canAfford(amount)) {
            this.gold -= amount;
            return true;
        }
        return false;
    }
    
    reset() {
        this.health = 20;
        this.gold = 100;
        this.wave = 1;
    }
}
