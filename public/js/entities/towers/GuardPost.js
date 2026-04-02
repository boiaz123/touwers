import { Tower } from './Tower.js';
import { PathDefender } from '../defenders/PathDefender.js';

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
        
        this.type = 'guard-post'; // Identify this as a guard-post tower
        this.level = level; // Guard post level (always 1)
        this.defender = null;
        this.defenderDeadCooldown = 0;
        this.maxDefenderDeadCooldown = 10; // 10 second cooldown before hiring again
        
        // Path reference for placing defenders on the actual path
        this.gamePath = null;
        this.pathIndex = null; // Index of closest path waypoint
        
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
        this.buildCost = 250;
        
        // Defender spawning position - will be set based on path
        this.defenderSpawnX = x - 35;
        this.defenderSpawnY = y;
    }
    
    /**
     * Set the game path reference and calculate the nearest point on the path
     * Called after GuardPost is created to establish path connection
     */
    setPath(gamePath) {
        if (!gamePath || gamePath.length < 2) {
            console.warn('GuardPost: Invalid path provided');
            return;
        }

        this.gamePath = gamePath;

        // Find the nearest point ON the path (not just at waypoints)
        let closestPoint = null;
        let closestDistance = Infinity;
        let closestSegmentIndex = 0;

        // Check distance to each path segment
        for (let i = 0; i < gamePath.length - 1; i++) {
            const segmentStart = gamePath[i];
            const segmentEnd = gamePath[i + 1];

            // Find nearest point on this line segment
            const nearestOnSegment = this.getNearestPointOnSegment(
                this.x, this.y,
                segmentStart.x, segmentStart.y,
                segmentEnd.x, segmentEnd.y
            );

            const distance = Math.hypot(nearestOnSegment.x - this.x, nearestOnSegment.y - this.y);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = nearestOnSegment;
                closestSegmentIndex = i;
            }
        }

        // Also check the last waypoint
        const lastWaypoint = gamePath[gamePath.length - 1];
        const distanceToLast = Math.hypot(lastWaypoint.x - this.x, lastWaypoint.y - this.y);
        if (distanceToLast < closestDistance) {
            closestPoint = { x: lastWaypoint.x, y: lastWaypoint.y };
            closestDistance = distanceToLast;
            closestSegmentIndex = gamePath.length - 1;
        }

        // Set defender spawn position to the nearest point on the path
        this.defenderSpawnX = closestPoint.x;
        this.defenderSpawnY = closestPoint.y;
        this.pathIndex = closestSegmentIndex;

    }

    /**
     * Get the nearest point on a line segment to a given point
     * Uses projection to find the closest point
     */
    getNearestPointOnSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;

        if (lengthSquared === 0) {
            // Segment is a point
            return { x: x1, y: y1 };
        }

        // Calculate the projection parameter (t) of point P onto the line segment
        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;

        // Clamp t to [0, 1] to stay within the segment
        t = Math.max(0, Math.min(1, t));

        // Calculate the nearest point
        const nearestX = x1 + t * dx;
        const nearestY = y1 + t * dy;

        return { x: nearestX, y: nearestY };
    }    /**
     * Hire a defender at this guard post with specified level
     * @param {GameState} gameState - The game state for gold deduction
     * @param {number} level - The level of defender to hire (1, 2, or 3)
     */
    hireDefender(gameState, level = 1) {
        if (this.defender && !this.defender.isDead()) {
            return false;
        }
        
        if (this.defenderDeadCooldown > 0) {
            return false;
        }
        
        // Cost to hire - increases with level
        const costs = { 1: 200, 2: 300, 3: 450 };
        const cost = costs[level] || 100;
        
        if (gameState.gold < cost) {
            return false;
        }
        
        // Deduct gold
        gameState.gold -= cost;
        
        // Create defender with specified level
        this.defender = new PathDefender(level);
        this.defender.x = this.defenderSpawnX;
        this.defender.y = this.defenderSpawnY;
        
        // Set the defender's waypoint to make enemies stop here
        // Enemies will stop at this waypoint instead of reaching the castle
        if (this.pathIndex !== null && this.gamePath) {
            this.defender.stationedWaypoint = {
                x: this.defenderSpawnX,
                y: this.defenderSpawnY,
                pathIndex: this.pathIndex
            };
        }
        return true;
    }
    
    /**
     * Get the waypoint where this guard post's defender is stationed
     * Returns the exact location where the path defender stops enemies
     */
    getDefenderWaypoint() {
        if (this.defender && !this.defender.isDead() && this.defender.stationedWaypoint) {
            return this.defender.stationedWaypoint;
        }
        return null;
    }
    
    /**
     * Get the path defender instance at this guard post
     */
    getDefender() {
        if (this.defender && !this.defender.isDead()) {
            return this.defender;
        }
        return null;
    }
    
    /**
     * Get available hiring options for this guard post
     */
    getDefenderHiringOptions(trainingGrounds = null) {
        const options = [];
        
        // Get the maximum available defender level from training grounds
        let maxDefenderLevel = 1;
        if (trainingGrounds && trainingGrounds.defenderMaxLevel) {
            maxDefenderLevel = trainingGrounds.defenderMaxLevel;
        }
        
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
                // Show hiring options for all available defender levels
                const defenderCosts = [100, 150, 200]; // Cost increases with level
                const defenderLabels = ['Level 1', 'Level 2 - Medium', 'Level 3 - Heavy'];
                
                for (let level = 1; level <= maxDefenderLevel; level++) {
                    options.push({
                        label: `Hire ${defenderLabels[level - 1]} - ${defenderCosts[level - 1]}g`,
                        cost: defenderCosts[level - 1],
                        level: level,
                        available: true,
                        type: 'hireDefender'
                    });
                }
            }
        } else {
            // Defender is active
            options.push({
                label: `Defender Active (Level ${this.defender.level}) (${this.defender.health}/${this.defender.maxHealth} HP)`,
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
            // Maintain defender position on the path
            this.defender.x = this.defenderSpawnX;
            this.defender.y = this.defenderSpawnY;
            
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

        const w = this.width;
        const h = this.height;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(-w * 0.42, h * 0.25, w * 0.84, h * 0.1);

        // --- FOUNDATION SLAB (wider base) ---
        ctx.fillStyle = '#505050';
        ctx.fillRect(-w * 0.45, h * 0.08, w * 0.9, h * 0.18);
        ctx.fillStyle = '#686868';
        ctx.fillRect(-w * 0.45, h * 0.08, w * 0.9, h * 0.035);
        ctx.strokeStyle = '#383838';
        ctx.lineWidth = 1;
        ctx.strokeRect(-w * 0.45, h * 0.08, w * 0.9, h * 0.18);

        // --- STONE WALLS ---
        const wallLeft   = -w * 0.36;
        const wallRight  =  w * 0.36;
        const wallTop    = -h * 0.18;
        const wallBottom =  h * 0.08;
        const wallW      = wallRight - wallLeft;
        const wallH      = wallBottom - wallTop;

        // Wall base fill
        ctx.fillStyle = '#787878';
        ctx.fillRect(wallLeft, wallTop, wallW, wallH);

        // Highlight left face
        ctx.fillStyle = '#8c8c8c';
        ctx.fillRect(wallLeft, wallTop, wallW * 0.15, wallH);

        // Shadow right face
        ctx.fillStyle = '#5e5e5e';
        ctx.fillRect(wallRight - wallW * 0.12, wallTop, wallW * 0.12, wallH);

        // Stone block texture (offset rows, clipped to wall rect)
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 0.75;
        const stoneW = wallW / 4;
        const stoneH = wallH / 3;
        for (let row = 0; row < 3; row++) {
            const offset = (row % 2 === 0) ? 0 : stoneW * 0.5;
            for (let col = -1; col < 5; col++) {
                const bx = wallLeft + col * stoneW - offset;
                const by = wallTop + row * stoneH;
                const bx1 = Math.max(bx, wallLeft);
                const bx2 = Math.min(bx + stoneW, wallRight);
                if (bx2 > bx1) {
                    ctx.strokeRect(bx1, by, bx2 - bx1, stoneH);
                }
            }
        }

        // Wall outline
        ctx.strokeStyle = '#3c3c3c';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(wallLeft, wallTop, wallW, wallH);

        // --- ARROW SLIT (left of center) ---
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(-w * 0.2, wallTop + wallH * 0.15, w * 0.07, wallH * 0.6);
        // Slit stone surround
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 1;
        ctx.strokeRect(-w * 0.2, wallTop + wallH * 0.15, w * 0.07, wallH * 0.6);

        // --- DOOR (center) ---
        ctx.fillStyle = '#3a2414';
        ctx.fillRect(-w * 0.11, wallTop + wallH * 0.45, w * 0.22, wallH * 0.55);
        // Door frame
        ctx.strokeStyle = '#6a5030';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-w * 0.11, wallTop + wallH * 0.45, w * 0.22, wallH * 0.55);
        // Door plank lines
        ctx.strokeStyle = '#2a1a0a';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(0, wallTop + wallH * 0.45);
        ctx.lineTo(0, wallBottom);
        ctx.stroke();
        // Door handle
        ctx.fillStyle = '#999999';
        ctx.beginPath();
        ctx.arc(w * 0.05, wallTop + wallH * 0.72, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // --- BATTLEMENTS at top of wall ---
        // Draw before roof so roof cleanly overlaps them
        const merlonH = h * 0.06;
        const merlonW = wallW / 9;
        ctx.fillStyle = '#8a8a8a';
        ctx.strokeStyle = '#3c3c3c';
        ctx.lineWidth = 0.75;
        for (let i = 0; i < 5; i++) {
            const mx = wallLeft + i * merlonW * 2 + merlonW * 0.1;
            ctx.fillRect(mx, wallTop - merlonH, merlonW * 1.8, merlonH);
            ctx.strokeRect(mx, wallTop - merlonH, merlonW * 1.8, merlonH);
        }

        // --- ROOF (drawn OVER wall and battlements) ---
        const roofBase = wallTop;
        const roofPeak = -h * 0.62;

        // Main roof fill (left half)
        ctx.fillStyle = '#8b3a18';
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, roofBase);
        ctx.lineTo(0, roofPeak);
        ctx.lineTo(w * 0.5, roofBase);
        ctx.closePath();
        ctx.fill();

        // Right side shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.moveTo(0, roofPeak);
        ctx.lineTo(w * 0.5, roofBase);
        ctx.lineTo(0, roofBase);
        ctx.closePath();
        ctx.fill();

        // Shingle lines across roof
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        const roofH = roofBase - roofPeak;
        for (let t = 0.22; t < 1.0; t += 0.19) {
            const ly = roofPeak + roofH * t;
            const hw = w * 0.5 * t;
            ctx.beginPath();
            ctx.moveTo(-hw, ly);
            ctx.lineTo(hw, ly);
            ctx.stroke();
        }

        // Roof outline
        ctx.strokeStyle = '#4a1e08';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, roofBase);
        ctx.lineTo(0, roofPeak);
        ctx.lineTo(w * 0.5, roofBase);
        ctx.stroke();

        // Eave trim
        ctx.strokeStyle = '#6a3010';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, roofBase);
        ctx.lineTo(w * 0.5, roofBase);
        ctx.stroke();

        // Ridge cap at peak
        ctx.fillStyle = '#aa5428';
        ctx.fillRect(-w * 0.035, roofPeak - h * 0.018, w * 0.07, h * 0.036);

        // --- FLAGPOLE from roof peak ---
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, roofPeak);
        ctx.lineTo(0, roofPeak - h * 0.3);
        ctx.stroke();

        // Flag (red with gold stripe)
        ctx.fillStyle = '#CC3333';
        ctx.beginPath();
        ctx.moveTo(0, roofPeak - h * 0.28);
        ctx.lineTo(13, roofPeak - h * 0.19);
        ctx.lineTo(0, roofPeak - h * 0.1);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0, roofPeak - h * 0.23, 11, 2.5);

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
            icon: ''
        };
    }
}
