import { Tower } from './Tower.js';
import { ObjectPool } from '../../core/ObjectPool.js';

export class CannonTower extends Tower {
    // How fast the whole mechanism can turn to face a target while winding up, in
    // radians/sec - fast enough to comfortably finish the turn within the ~0.83s
    // windup, slow enough to read as a heavy timber frame turning rather than a snap.
    static TURN_SPEED = Math.PI * 1.5;
    // Slightly gentler than TURN_SPEED - used only to settle the frame back to its
    // neutral "as-built" facing once a shot's recoil finishes, so it doesn't sit
    // twisted toward wherever it last fired.
    static RESET_TURN_SPEED = Math.PI * 0.9;
    // Height of the solid parapet rim the platform rests on - shared between
    // renderStaticBack (draws it) and renderDynamicParts (anchors to its top).
    static PARAPET_HEIGHT = 12;

    constructor(x, y, gridX, gridY) {
        super(x, y, gridX, gridY);
        this.range = 155;
        this.damage = 100;
        this.splashRadius = 50;
        this.originalSplashRadius = 50; // Store original for upgrades
        this.fireRate = 0.4;
        
        this.trebuchetAngle = 0;
        this.armPosition = 0;
        this.armSpeed = 0;
        this.isRecoiling = false;
        this.isLoading = false;
        this.explosions = [];
        this.fireballs = [];
        // Phase 5: reuse fireball/explosion objects across shots instead of allocating a
        // fresh literal every time - acquire() in shoot()/explode(), release() once an
        // entry is dropped from the respective compaction loop below.
        this._fireballPool = new ObjectPool(() => ({
            x: 0, y: 0, vx: 0, vy: 0, gravity: 0, flameAnimation: 0, life: 0, maxLife: 0,
            targetX: 0, targetY: 0, target: null, fallbackX: 0, fallbackY: 0
        }));
        this._explosionPool = new ObjectPool(() => ({
            x: 0, y: 0, radius: 0, maxRadius: 0, life: 0, maxLife: 0
        }));
        this.loadingTime = 0;
        this.randomSeed = Math.random() * 1000;

        // Set by TowerRenderAdapter once it has baked/synced this tower's static body via
        // Pixi (fireballs/explosions/attack-radius still draw here regardless - not migrated yet).
        this.skipCanvas2DBodyRender = false;
    }
    
    update(deltaTime, enemies) {
        super.update(deltaTime, enemies);
        
        // Update trebuchet arm animation
        this.isLoading = false;
        if (this.isRecoiling) {
            // Snap-back after release: accelerates from 0, so this must keep running
            // every frame until the arm is fully home - a one-shot equality check here
            // let the very first (barely-moved) frame count as "done" and handed off to
            // the slow idle-decay below, which produced a visible pop next windup.
            this.armSpeed += deltaTime * 10;
            this.armPosition = Math.max(0, this.armPosition - this.armSpeed * deltaTime);
            if (this.armPosition <= 0) {
                this.armPosition = 0;
                this.armSpeed = 0;
                this.isRecoiling = false;
            }
        } else if (this.target && this.cooldown === 0) {
            this.isLoading = true;
            this.loadingTime += deltaTime * 1.2;
            this.armPosition = Math.min(1, this.loadingTime);

            if (this.armPosition >= 1) {
                this.shoot();
                this.cooldown = 1 / this.fireRate;
                this.armPosition = 2;
                this.armSpeed = 0;
                this.loadingTime = 0;
                this.isLoading = false;
                this.isRecoiling = true;
            }
        } else {
            this.loadingTime = 0;
            this.armPosition = Math.max(0, this.armPosition - deltaTime * 0.3);
        }

        // Only the arm winding up to throw turns the whole mechanism to face the
        // enemy - the base and counterweight otherwise sit still between shots
        // instead of continuously swivelling to chase a moving target, and the turn
        // is a smooth turn-rate-limited sweep (not an instant snap) so it reads as
        // one solid piece of timber coming around rather than teleporting.
        if (this.target && this.isLoading) {
            const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            let diff = targetAngle - this.trebuchetAngle;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            const maxStep = CannonTower.TURN_SPEED * deltaTime;
            this.trebuchetAngle += Math.max(-maxStep, Math.min(maxStep, diff));
        } else if (!this.isRecoiling && this.trebuchetAngle !== 0) {
            // Once a shot's recoil is fully done, settle back to the neutral facing
            // it had when first built instead of staying twisted toward the last
            // target - it was "hanging" at the fired angle forever otherwise.
            let diff = Math.atan2(Math.sin(-this.trebuchetAngle), Math.cos(-this.trebuchetAngle));
            const maxStep = CannonTower.RESET_TURN_SPEED * deltaTime;
            if (Math.abs(diff) <= maxStep) {
                this.trebuchetAngle = 0;
            } else {
                this.trebuchetAngle += Math.sign(diff) * maxStep;
            }
        }

        // Update fireballs (compact in-place)
        let fbWrite = 0;
        for (let i = 0; i < this.fireballs.length; i++) {
            const fireball = this.fireballs[i];
            fireball.x += fireball.vx * deltaTime;
            fireball.y += fireball.vy * deltaTime;
            fireball.vy += fireball.gravity * deltaTime;
            fireball.life -= deltaTime;
            fireball.flameAnimation += deltaTime * 8;
            
            let targetX = fireball.targetX;
            let targetY = fireball.targetY;
            if (fireball.target) {
                targetX = fireball.target.x;
                targetY = fireball.target.y;
            } else if (fireball.fallbackX != null) {
                targetX = fireball.fallbackX;
                targetY = fireball.fallbackY;
            }
            
            if (fireball.life <= 0 ||
                (fireball.life < fireball.maxLife * 0.5 &&
                 Math.hypot(fireball.x - targetX, fireball.y - targetY) < 20)) {
                this.explode(targetX, targetY, enemies);
                this._fireballPool.release(fireball);
            } else {
                this.fireballs[fbWrite++] = fireball;
            }
        }
        this.fireballs.length = fbWrite;
        
        // Update explosions (compact in-place)
        let expWrite = 0;
        for (let i = 0; i < this.explosions.length; i++) {
            const explosion = this.explosions[i];
            explosion.life -= deltaTime;
            explosion.radius = (1 - explosion.life / explosion.maxLife) * explosion.maxRadius;
            if (explosion.life > 0) {
                this.explosions[expWrite++] = explosion;
            } else {
                this._explosionPool.release(explosion);
            }
        }
        this.explosions.length = expWrite;
    }
    
    shoot() {
        if (this.target) {
            // Estimate initial speed to predict trajectory time
            const distEstimate = Math.hypot(this.target.x - this.x, this.target.y - this.y);
            const gravity = 250;
            const launchAngle = Math.PI / 6;
            const initialSpeedEstimate = Math.sqrt((distEstimate * gravity) / Math.sin(2 * launchAngle));
            const flightTimeEstimate = distEstimate / (initialSpeedEstimate * Math.cos(launchAngle));
            
            // Predict where the target will be.
            // Pass the horizontal speed component so the quadratic intercept formula
            // uses the correct flight time (horizontal range / horizontal speed).
            const effectiveSpeedEstimate = initialSpeedEstimate * Math.cos(launchAngle);
            const predicted = this.predictEnemyPosition(this.target, effectiveSpeedEstimate);
            
            const dx = predicted.x - this.x;
            const dy = predicted.y - this.y;
            const distance = Math.hypot(dx, dy);
            
            const initialSpeed = distance > 0 ? Math.sqrt((distance * gravity) / Math.sin(2 * launchAngle)) : initialSpeedEstimate;
            const flightTime = distance > 0 ? distance / (initialSpeed * Math.cos(launchAngle)) : flightTimeEstimate;
            
            // Play launch sound
            if (this.audioManager) {
                this.audioManager.playSFX('trebuchet-launch');
            }
            
            const fireball = this._fireballPool.acquire();
            fireball.x = this.x;
            fireball.y = this.y - 25;
            fireball.vx = distance > 0 ? (dx / distance) * initialSpeed * Math.cos(launchAngle) : 0;
            fireball.vy = -initialSpeed * Math.sin(launchAngle);
            fireball.gravity = gravity;
            fireball.flameAnimation = 0;
            fireball.life = flightTime;
            fireball.maxLife = flightTime;
            fireball.targetX = predicted.x;
            fireball.targetY = predicted.y;
            fireball.target = this.target;
            fireball.fallbackX = this.target.x;
            fireball.fallbackY = this.target.y;
            this.fireballs.push(fireball);
        }
    }
    
    explode(x, y, enemies) {
        // Play impact sound
        if (this.audioManager) {
            this.audioManager.playSFX('trebuchet-impact');
        }
        
        // splashRadius is a base-resolution (1920x1080) stat; AoE checks below need the
        // current resolution's pixel space, matching enemy screen positions (see Tower.js
        // effectiveRange comment).
        const splashRadius = this.effectiveSplashRadius ?? this.splashRadius;

        const explosion = this._explosionPool.acquire();
        explosion.x = x;
        explosion.y = y;
        explosion.radius = 0;
        explosion.maxRadius = splashRadius * 1.5;
        explosion.life = 1.0;
        explosion.maxLife = 1.0;
        this.explosions.push(explosion);

        // OPTIMIZATION: Use spatial grid for AoE damage when available
        const splashRadiusSq = splashRadius * splashRadius;
        if (this._spatialGrid) {
            const grid = this._spatialGrid;
            const count = grid.query(x, y, splashRadius);
            const buf = grid._queryBuf;
            for (let i = 0; i < count; i++) {
                const enemy = buf[i];
                const dx = enemy.x - x;
                const dy = enemy.y - y;
                const distSq = dx * dx + dy * dy;
                if (distSq <= splashRadiusSq) {
                    const distance = Math.sqrt(distSq);
                    const damageFalloff = 1 - (distance / splashRadius) * 0.5;
                    const actualDamage = Math.floor(this.damage * damageFalloff);
                    enemy.takeDamage(actualDamage, 0, 'physical');
                }
            }
        } else {
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                const dx = enemy.x - x;
                const dy = enemy.y - y;
                const distSq = dx * dx + dy * dy;
                if (distSq <= splashRadiusSq) {
                    const distance = Math.sqrt(distSq);
                    const damageFalloff = 1 - (distance / splashRadius) * 0.5;
                    const actualDamage = Math.floor(this.damage * damageFalloff);
                    enemy.takeDamage(actualDamage, 0, 'physical');
                }
            }
        }
    }
    
    render(ctx) {
        const cellSize = this.getCellSize(ctx);
        const towerSize = cellSize * 2;

        if (!this.skipCanvas2DBodyRender) {
            this.renderStaticBack(ctx, towerSize);
            this.renderDynamicParts(ctx, towerSize);
            this.renderProjectiles(ctx);
        }

        // Not yet migrated - selection-dependent, cheap, always drawn on Canvas2D on top.
        this.renderAttackRadiusCircle(ctx);
    }

    /** Phase 5: fireballs/explosions - present so TowerRenderAdapter.sync() can call this through the same shim used for renderDynamicParts, preserving draw order (body, then projectiles on top). */
    renderProjectiles(ctx) {
        this.renderProjectilesAndExplosions(ctx);
    }

    /** Strategy A (baked once per campaign, shared across instances): tower body/platform. */
    renderStaticBack(ctx, towerSize) {
        // 3D square tower shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(this.x - towerSize * 0.4 + 5, this.y - towerSize * 0.35 + 5, towerSize * 0.8, towerSize * 0.7);
        
        // Main square tower structure
        const towerWidth = towerSize * 0.8;
        const towerHeight = towerSize * 0.7;
        
        // Stone tower (robust square design)
        ctx.fillStyle = '#808080';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        ctx.fillRect(this.x - towerWidth/2, this.y - towerHeight, towerWidth, towerHeight);
        ctx.strokeRect(this.x - towerWidth/2, this.y - towerHeight, towerWidth, towerHeight);
        
        // Stone block pattern
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 2;
        const blockRows = 6;
        const blockCols = 4;
        
        for (let row = 0; row < blockRows; row++) {
            for (let col = 0; col < blockCols; col++) {
                // Offset every other row for realistic stone pattern
                const offsetX = (row % 2) * (towerWidth / blockCols / 2);
                const blockX = this.x - towerWidth/2 + offsetX + (col * towerWidth / blockCols);
                const blockY = this.y - towerHeight + (row * towerHeight / blockRows);
                const blockWidth = towerWidth / blockCols;
                const blockHeight = towerHeight / blockRows;
                
                if (blockX + blockWidth <= this.x + towerWidth/2) {
                    ctx.strokeRect(blockX, blockY, blockWidth, blockHeight);
                }
            }
        }
        
        // Corner reinforcements
        const cornerSize = towerWidth * 0.08;
        ctx.fillStyle = '#808080';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        
        // Four corner reinforcements
        for (let x = -1; x <= 1; x += 2) {
            for (let y = 0; y <= 1; y++) {
                const cornerX = this.x + x * (towerWidth/2 - cornerSize);
                const cornerY = this.y - towerHeight + y * (towerHeight - cornerSize * 2);
                
                ctx.fillRect(cornerX, cornerY, cornerSize, cornerSize * 2);
                ctx.strokeRect(cornerX, cornerY, cornerSize, cornerSize * 2);
            }
        }
        
        // Solid parapet rim - alternating raised/recessed merlons here used to
        // leave 3 separate block "pillars" with visible gaps between them
        // holding up the platform, which read as disconnected rather than a
        // finished wall. A single rim spanning the full tower width sits flush
        // with the body below it and gives the platform one continuous seat.
        const parapetHeight = CannonTower.PARAPET_HEIGHT;
        const parapetY = this.y - towerHeight - parapetHeight;
        ctx.fillStyle = '#969696';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - towerWidth/2, parapetY, towerWidth, parapetHeight);
        ctx.strokeRect(this.x - towerWidth/2, parapetY, towerWidth, parapetHeight);

        // Brick divisions along the rim, matching the wall's block pattern below
        const parapetBrickCount = 6;
        ctx.beginPath();
        for (let i = 1; i < parapetBrickCount; i++) {
            const bx = this.x - towerWidth/2 + i * (towerWidth / parapetBrickCount);
            ctx.moveTo(bx, parapetY);
            ctx.lineTo(bx, parapetY + parapetHeight);
        }
        ctx.stroke();

        // Trebuchet platform on top - its underside rests flush on the parapet
        // rim so there's no gap of background visible between the wall and the
        // platform.
        const platformY = parapetY;
        const platformWidth = towerWidth * 0.9;
        const platformThickness = 10;

        // Wooden platform
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x - platformWidth/2, platformY - platformThickness, platformWidth, platformThickness);
        ctx.strokeRect(this.x - platformWidth/2, platformY - platformThickness, platformWidth, platformThickness);
        
        // Platform planks
        for (let i = 1; i < 5; i++) {
            const plankX = this.x - platformWidth/2 + (i * platformWidth / 5);
            ctx.beginPath();
            ctx.moveTo(plankX, platformY - platformThickness);
            ctx.lineTo(plankX, platformY);
            ctx.stroke();
        }
        
    }

    /** Strategy B (per-instance Graphics, redrawn every frame): the whole rotating trebuchet mechanism - arm angle and load position are continuous, not bakeable. Includes the small static A-frame/pivot too rather than splitting it out, since it's cheap geometry sharing the same transform block. */
    renderDynamicParts(ctx, towerSize) {
        const towerHeight = towerSize * 0.7;
        const platformWidth = towerSize * 0.8 * 0.9;
        const platformThickness = 10;
        // Anchor at the platform's top surface (not its underside) so the mechanism
        // sits ON it, flush with the same flat, front-facing plank drawn in
        // renderStaticBack - an ellipse "swivel base" here previously read as a
        // top-down disc, a different perspective than the rest of the tower. Must
        // match renderStaticBack's platformY (parapet top) plus its thickness.
        const platformY = this.y - towerHeight - CannonTower.PARAPET_HEIGHT - platformThickness;

        // Trebuchet mechanism - translate to base, rotate around pivot
        ctx.save();
        ctx.translate(this.x, platformY);

        // Static mounting deck (does not rotate) - a flat block on top of the
        // platform, drawn front-facing like the rest of the tower, that the A-frame
        // is bolted to. Grounds the mechanism without switching to a top-down
        // perspective the way the old ellipse did.
        const deckHalfWidth = platformWidth * 0.4;
        const deckHeight = 8;
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.fillRect(-deckHalfWidth, -deckHeight, deckHalfWidth * 2, deckHeight);
        ctx.strokeRect(-deckHalfWidth, -deckHeight, deckHalfWidth * 2, deckHeight);

        // Grain lines, matching the main platform's plank style
        ctx.beginPath();
        for (let i = 1; i < 4; i++) {
            const lx = -deckHalfWidth + i * (deckHalfWidth * 2 / 4);
            ctx.moveTo(lx, -deckHeight);
            ctx.lineTo(lx, 0);
        }
        ctx.stroke();

        // Corner bolts - static, reinforce the "bolted to the platform" read
        ctx.fillStyle = '#2F2F2F';
        for (const sx of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(sx * (deckHalfWidth - 4), -deckHeight + 3, 1.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(sx * (deckHalfWidth - 4), -3, 1.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // The A-frame, pivot and arm all turn together to face the target - previously
        // only the arm rotated here while the frame stayed fixed, so at most aim angles
        // the arm/counterweight visibly detached from the frame instead of pivoting
        // with it. Rotating before drawing the frame keeps everything joined.
        ctx.rotate(this.trebuchetAngle);

        // Trebuchet base (more robust A-frame) - kept compact so its feet stay on
        // the swivel base at every rotation instead of swinging past its edge.
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 6;

        // Main support frame
        ctx.beginPath();
        ctx.moveTo(-14, 3);
        ctx.lineTo(0, -20);
        ctx.lineTo(14, 3);
        ctx.stroke();

        // Cross braces
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-9, -8);
        ctx.lineTo(9, -8);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-11, -3);
        ctx.lineTo(11, -3);
        ctx.stroke();

        // Pivot point at correct location (large axle) - this is where we'll rotate around
        ctx.fillStyle = '#2F2F2F';
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -15, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Now translate to the pivot - already rotated with the frame above, so the
        // arm swings relative to it without a second, independent rotation.
        ctx.translate(0, -15);

        // Trebuchet arm (longer and more realistic)
        // Angles are relative to pivot now
        const armLength = platformWidth * 0.6;
        const shortArmLength = armLength * 0.3;
        const armAngle = -Math.PI/2.5 + this.armPosition * Math.PI/1.5;
        
        // Long arm (throwing end)
        const longArmEndX = Math.cos(armAngle) * armLength;
        const longArmEndY = Math.sin(armAngle) * armLength;
        
        // Short arm (counterweight end)
        const shortArmEndX = -Math.cos(armAngle) * shortArmLength;
        const shortArmEndY = -Math.sin(armAngle) * shortArmLength;
        
        // Arm shaft
        ctx.strokeStyle = '#4A2F16';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(shortArmEndX, shortArmEndY);
        ctx.lineTo(longArmEndX, longArmEndY);
        ctx.stroke();

        // Thin highlight down the middle so the beam reads as one solid piece of
        // timber rather than a flat line blending into the platform behind it.
        ctx.strokeStyle = 'rgba(200, 150, 100, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(shortArmEndX, shortArmEndY);
        ctx.lineTo(longArmEndX, longArmEndY);
        ctx.stroke();

        // Metal strap clamping the arm to the pivot axle - reinforces the visual
        // join between the two, now that both rotate together.
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();

        // Sling at end of long arm
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        
        ctx.save();
        ctx.translate(longArmEndX, longArmEndY);
        ctx.rotate(armAngle + Math.PI/8);
        
        // Sling pouch
        ctx.beginPath();
        ctx.arc(0, 8, 8, 0, Math.PI);
        ctx.stroke();
        ctx.fillRect(-8, 8, 16, 4);
        ctx.strokeRect(-8, 8, 16, 4);
        
        // Sling ropes
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, 8);
        ctx.lineTo(0, -5);
        ctx.moveTo(8, 8);
        ctx.lineTo(0, -5);
        ctx.stroke();
        
        ctx.restore();
        
        // Large counterweight
        ctx.fillStyle = '#696969';
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 3;
        
        const counterweightSize = 20;
        ctx.fillRect(shortArmEndX - counterweightSize/2, shortArmEndY - counterweightSize/2, 
                     counterweightSize, counterweightSize * 1.5);
        ctx.strokeRect(shortArmEndX - counterweightSize/2, shortArmEndY - counterweightSize/2, 
                       counterweightSize, counterweightSize * 1.5);
        
        // Stone texture on counterweight
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                const stoneX = shortArmEndX - 8 + i * 5;
                const stoneY = shortArmEndY - 8 + j * 8;
                ctx.strokeRect(stoneX, stoneY, 5, 7);
            }
        }
        
        // Support chains for counterweight
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 3;
        
        // Chain links
        for (let chain = -1; chain <= 1; chain += 2) {
            const chainX = shortArmEndX + chain * 8;
            ctx.beginPath();
            ctx.moveTo(chainX, shortArmEndY - counterweightSize/2);
            ctx.lineTo(chainX, shortArmEndY + counterweightSize);
            ctx.stroke();
        }
        
        // Fireball in sling (when loading)
        if (this.armPosition > 0.1 && this.armPosition < 1.9) {
            ctx.save();
            ctx.translate(longArmEndX, longArmEndY);
            ctx.rotate(armAngle + Math.PI/8);
            
            // Fireball in sling
            const fireballRadius = 5;
            ctx.fillStyle = '#FF8C00';
            ctx.beginPath();
            ctx.arc(0, 6, fireballRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Flame effects
            for (let i = 0; i < 6; i++) {
                const flameAngle = (i / 6) * Math.PI * 2;
                const flameX = Math.cos(flameAngle) * (fireballRadius + 3);
                const flameY = 6 + Math.sin(flameAngle) * (fireballRadius + 3);
                
                ctx.fillStyle = `rgba(255, ${100 + (i * 25) % 155}, 0, 0.7)`;
                ctx.beginPath();
                ctx.arc(flameX, flameY, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        ctx.restore();
    }

    /** Not yet migrated (Phase 5/6) - always drawn on Canvas2D regardless of renderer. */
    renderProjectilesAndExplosions(ctx) {
        // Render flying fireballs
        for (let f = 0; f < this.fireballs.length; f++) {
            const fireball = this.fireballs[f];
            ctx.save();
            ctx.translate(fireball.x, fireball.y);
            
            // Main fireball with animated flames
            const fireballRadius = 6;
            const flameFlicker = Math.sin(fireball.flameAnimation) * 0.3 + 1;
            
            // Outer flame layer
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.arc(0, 0, fireballRadius * flameFlicker, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner core
            ctx.fillStyle = '#FFCC00';
            ctx.beginPath();
            ctx.arc(0, 0, fireballRadius * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
            // Trailing flames (deterministic)
            for (let i = 0; i < 8; i++) {
                const trailAngle = (i / 8) * Math.PI * 2;
                const trailDistance = fireballRadius + (i % 3) * 2 + 2;
                const trailX = Math.cos(trailAngle) * trailDistance;
                const trailY = Math.sin(trailAngle) * trailDistance;
                
                ctx.fillStyle = `rgba(255, ${100 + (i * 15)}, 0, ${0.4 + (i % 3) * 0.1})`;
                ctx.beginPath();
                ctx.arc(trailX, trailY, 1.5 + (i % 2), 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Smoke trail
            ctx.fillStyle = 'rgba(60, 60, 60, 0.3)';
            ctx.beginPath();
            ctx.arc(-fireball.vx * 0.03, -fireball.vy * 0.03 + 5, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // Render explosions with fire effects
        for (let e = 0; e < this.explosions.length; e++) {
            const explosion = this.explosions[e];
            const alpha = explosion.life / explosion.maxLife;
            
            // Outer fire ring
            ctx.strokeStyle = `rgba(255, 100, 0, ${alpha * 0.4})`;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius * 1.3, 0, Math.PI * 2);
            ctx.stroke();
            
            // Main explosion fire
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Core white flash
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(explosion.x, explosion.y, explosion.radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /** No front-of-tower environment decoration for this type - present for TowerRenderAdapter's uniform convention. */
    renderStaticFront(ctx, towerSize) {
        // intentionally empty
    }

    static getInfo() {
        return {
            name: 'Trebuchet Tower',
            description: 'Powerful stone tower with a massive trebuchet. Deals heavy area damage at long range.',
            damage: '100 (AoE)',
            range: '155',
            fireRate: '0.4/sec',
            cost: 250,
            icon: ''
        };
    }
}
