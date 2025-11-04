export class GameState {
    constructor() {
        this.health = 20;
        this.gold = 100;
        this.wave = 1;
    }
    
    canAfford(cost) {
        return this.gold >= cost;
    }
    
    spend(amount) {
        if (this.canAfford(amount)) {
            this.gold -= amount;
            return true;
        }
        return false;
    }
}
