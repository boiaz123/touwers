export class GameState {
    constructor() {
        this.health = 20;
        this.gold = 100;
        this.wave = 1; // Start at wave 1
        this.isSandbox = false; // Track sandbox mode
        
        // New: Gem tracking for sandbox mode
        this.gems = {
            fire: 0,
            water: 0,
            air: 0,
            earth: 0,
            diamond: 0
        };
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
        this.gems = {
            fire: 0,
            water: 0,
            air: 0,
            earth: 0,
            diamond: 0
        };
    }
    
    initializeSandbox() {
        this.health = 20;
        this.gold = 100000; // Lots of gold for sandbox
        this.wave = 1;
        this.isSandbox = true;
        
        // New: Initialize sandbox with full gems
        this.gems = {
            fire: 100,
            water: 100,
            air: 100,
            earth: 100,
            diamond: 100
        };
        
        console.log('GameState: Initialized sandbox mode with', this.gold, 'gold and 100 of each gem');
    }
}
