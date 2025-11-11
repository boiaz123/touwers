export class GameState {
    constructor() {
        this.health = 20;
        this.gold = 100;
        this.wave = 1; // Start at wave 1
        this.isSandbox = false; // Track sandbox mode
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
    
    reset() {
        this.health = 20;
        this.gold = 100;
        this.wave = 1;
        this.isSandbox = false;
    }
    
    initializeSandbox() {
        this.health = 20;
        this.gold = 100000; // Lots of gold for sandbox
        this.wave = 1;
        this.isSandbox = true;
        console.log('GameState: Initialized sandbox mode with', this.gold, 'gold');
    }
}
