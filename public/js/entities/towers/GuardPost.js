import { Tower } from './Tower.js';
import { Defender } from '../enemies/Defender.js';

/**
 * GuardPost - A small tower that spawns at path intersections
 * Can only be placed on the path
 * Hires level 1 defenders to guard the path
 * Limited quantity: 1 at Training Grounds level 4, 2 at level 5
 */
export class GuardPost extends Tower {
    constructor(x, y, level = 1) {
        // GuardPost doesn't use grid positioning like other towers, so set gridX and gridY to 0
        // The tower is positioned at absolute canvas coordinates
        super(x, y, 0, 0);
        
        this.level = level; // Guard post level (always 1)
        this.defender = null;
        this.defenderDeadCooldown = 0;
        this.maxDefenderDeadCooldown = 10; // 10 second cooldown before hiring again
        
        // Stats for this tower
        this.health = 200;
        this.maxHealth = 200;
        this.armor = 5;
        // Clickbox size - used for click detection
        this.width = 50;
        this.height = 50;
        // Larger clickbox area for better clickability (used in click detection)
        this.clickBoxWidth = 80;
        this.clickBoxHeight = 80;
        
        // Build cost
        this.buildCost = 150;
        
        // Defender spawning position - at the front of the hut
        this.defenderSpawnX = x - 35;
        this.defenderSpawnY = y;
    }
    
    /**
     * Hire a level 1 defender at this guard post
     */
    hireDefender(gameState) {
        if (this.defender && !this.defender.isDead()) {
            console.log('GuardPost: Defender already active');
            return false;
        }
        
        if (this.defenderDeadCooldown > 0) {
            console.log(`GuardPost: Defender cooldown - ${this.defenderDeadCooldown.toFixed(1)}s remaining`);
            return false;
        }
        
        // Cost to hire
        const cost = 100; // Level 1 defender at guard post
        if (gameState.gold < cost) {
            console.log(`GuardPost: Not enough gold. Need ${cost}, have ${gameState.gold}`);
            return false;
        }
        
        // Deduct gold
        gameState.gold -= cost;
        
        // Create defender
        this.defender = new Defender(1);
        this.defender.x = this.defenderSpawnX;
        this.defender.y = this.defenderSpawnY;
        
        console.log(`GuardPost: Hired defender at (${this.defenderSpawnX}, ${this.defenderSpawnY}), gold remaining: ${gameState.gold}`);
        return true;
    }
    
    /**
     * Get available hiring options for this guard post
     */
    getDefenderHiringOptions() {
        const options = [];
        
        // Check if we need to hire a new defender
        if (!this.defender || this.defender.isDead()) {
            if (this.defenderDeadCooldown > 0) {
                // Show cooldown message
                options.push({
                    label: `Defender (Cooldown: ${this.defenderDeadCooldown.toFixed(1)}s)`,
                    cost: 100,
                    available: false,
                    reason: 'Cooldown active'
                });
            } else {
                // Show hiring option
                options.push({
                    label: 'Hire Defender L1 - 100g',
                    cost: 100,
                    available: true,
                    type: 'hireDefender'
                });
            }
        } else {
            // Defender is active
            options.push({
                label: `Defender Active (${this.defender.health}/${this.defender.maxHealth} HP)`,
                cost: 0,
                available: false,
                reason: 'Defender active'
            });
        }
        
        return options;
    }
    
    /**
     * Check if defender died and start cooldown
     */
    checkDefenderDeath() {
        if (this.defender && this.defender.isDead()) {
            console.log('GuardPost: Defender died, starting cooldown');
            this.defenderDeadCooldown = this.maxDefenderDeadCooldown;
            this.defender = null;
        }
    }
    
    /**
     * Update defender and cooldown
     */
    update(deltaTime, enemies, gameState) {
        // Update cooldown
        this.defenderDeadCooldown = Math.max(0, this.defenderDeadCooldown - deltaTime);
        
        // Update defender if alive
        if (this.defender && !this.defender.isDead()) {
            this.defender.update(deltaTime, enemies);
        } else {
            // Check if defender died
            this.checkDefenderDeath();
        }
    }
    
    /**
     * Render the guard post tower and defender
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Shadow - square shadow at the bottom of the building
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(-this.width * 0.4, this.height * 0.3, this.width * 0.8, this.height * 0.1);
        
        // --- GUARD POST HUT - DEFENSIVE DESIGN ---
        
        // Foundation/base - stone look
        ctx.fillStyle = '#6B6B6B';
        ctx.fillRect(-this.width * 0.4, -this.height * 0.1, this.width * 0.8, this.height * 0.35);
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width * 0.4, -this.height * 0.1, this.width * 0.8, this.height * 0.35);
        
        // Stone pattern/texture
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                const stoneX = -this.width * 0.35 + i * this.width * 0.2;
                const stoneY = -this.height * 0.05 + j * this.height * 0.12;
                ctx.strokeRect(stoneX, stoneY, this.width * 0.18, this.height * 0.1);
            }
        }
        
        // Defensive roof - sharper peaks
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.5, -this.height * 0.1);
        ctx.lineTo(this.width * 0.5, -this.height * 0.1);
        ctx.lineTo(0, -this.height * 0.6);
        ctx.closePath();
        ctx.fill();
        
        // Roof shading for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.6);
        ctx.lineTo(this.width * 0.5, -this.height * 0.1);
        ctx.lineTo(0, -this.height * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Roof edge/trim
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.5, -this.height * 0.1);
        ctx.lineTo(this.width * 0.5, -this.height * 0.1);
        ctx.stroke();
        
        // Defensive palisade on roof edge
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.width * 0.13, -this.height * 0.1);
            ctx.lineTo(i * this.width * 0.13, -this.height * 0.2);
            ctx.stroke();
        }
        
        // Door - narrow and fortified
        ctx.fillStyle = '#3a2817';
        ctx.fillRect(-this.width * 0.1, -this.height * 0.05, this.width * 0.2, this.height * 0.22);
        
        // Door frame - metal reinforced
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width * 0.1, -this.height * 0.05, this.width * 0.2, this.height * 0.22);
        
        // Door handle - iron ring
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(this.width * 0.04, this.height * 0.05, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Arrow slit window - defensive
        ctx.fillStyle = '#333333';
        ctx.fillRect(-this.width * 0.25, -this.height * 0.1, this.width * 0.08, this.height * 0.25);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-this.width * 0.25, -this.height * 0.08, this.width * 0.08, this.height * 0.1);
        
        // Flagpole - reinforced
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.width * 0.28, -this.height * 0.6);
        ctx.lineTo(this.width * 0.28, -this.height * 0.9);
        ctx.stroke();
        
        // Flag - guard colors (red and gold)
        ctx.fillStyle = '#CC3333';
        ctx.beginPath();
        ctx.moveTo(this.width * 0.28, -this.height * 0.82);
        ctx.lineTo(this.width * 0.28 + 14, -this.height * 0.72);
        ctx.lineTo(this.width * 0.28, -this.height * 0.62);
        ctx.closePath();
        ctx.fill();
        
        // Flag stripe
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.width * 0.28, -this.height * 0.77, 14, 3);
        
        ctx.restore();
        
        // Render defender if alive
        if (this.defender && !this.defender.isDead()) {
            this.defender.render(ctx);
        }
    }
    
    /**
     * Render building icon for GUI
     */
    /**
     * Handle click on this guard post
     */
    onClick(gameState) {
        console.log('GuardPost: Clicked');
        return {
            type: 'guard-post',
            tower: this,
            options: this.getDefenderHiringOptions(),
            gameState: gameState
        };
    }

    static getInfo() {
        return {
            name: 'Guard Post',
            description: 'Small fortified outpost that hires Level 1 defenders to guard the path. Defenders spawn at 100g with a 10-second cooldown after defeat.',
            damage: 'N/A',
            range: 'N/A',
            fireRate: 'N/A',
            cost: 150,
            icon: '🛡️'
        };
    }
}
