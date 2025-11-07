export class ArcaneAcademy {
    constructor(x, y, gridX, gridY, gameState) {
        this.x = x;
        this.y = y;
        this.gridX = gridX;
        this.gridY = gridY;
        this.gameState = gameState;
        this.type = 'academy';
        this.level = 1;
        this.maxLevel = 4;
        this.upgradeCost = 300;
        
        // Spell system
        this.availableSpells = this.getSpellsForLevel(this.level);
        this.spellCooldowns = {};
        
        // Animation properties
        this.animationTime = 0;
        this.crystalPulse = 0;
        this.runeRotation = 0;
        this.magicParticles = [];
        this.activeSpells = [];
        
        // Initialize spell cooldowns
        this.availableSpells.forEach(spell => {
            this.spellCooldowns[spell.id] = 0;
        });
    }
    
    update(deltaTime, towers, enemies) {
        this.animationTime += deltaTime;
        this.crystalPulse = 0.5 + 0.5 * Math.sin(this.animationTime * 2);
        this.runeRotation += deltaTime * 0.5;
        
        // Update spell cooldowns
        Object.keys(this.spellCooldowns).forEach(spellId => {
            this.spellCooldowns[spellId] = Math.max(0, this.spellCooldowns[spellId] - deltaTime);
        });
        
        // Generate ambient magic particles
        if (Math.random() < deltaTime * 4) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 60 + 30;
            this.magicParticles.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30 - 20,
                life: 3,
                maxLife: 3,
                size: 0,
                maxSize: Math.random() * 3 + 2,
                color: Math.random() < 0.5 ? 'rgba(138, 43, 226, ' : 'rgba(75, 0, 130, '
            });
        }
        
        // Update magic particles
        this.magicParticles = this.magicParticles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            particle.size = particle.maxSize * (particle.life / particle.maxLife);
            return particle.life > 0;
        });
        
        // Update active spells
        this.activeSpells = this.activeSpells.filter(spell => {
            spell.duration -= deltaTime;
            return spell.duration > 0;
        });
    }
    
    upgrade() {
        if (this.level < this.maxLevel && this.gameState.spend(this.upgradeCost)) {
            this.level++;
            this.upgradeCost = Math.floor(this.upgradeCost * 1.4);
            this.availableSpells = this.getSpellsForLevel(this.level);
            
            // Initialize cooldowns for new spells
            this.availableSpells.forEach(spell => {
                if (!this.spellCooldowns[spell.id]) {
                    this.spellCooldowns[spell.id] = 0;
                }
            });
            
            return true;
        }
        return false;
    }
    
    getSpellsForLevel(level) {
        const allSpells = [
            {
                id: 'fireball',
                name: 'Fireball',
                description: 'Launch a fireball at target location',
                cost: 30,
                cooldown: 10,
                damage: 80,
                radius: 50,
                minLevel: 1
            },
            {
                id: 'freeze',
                name: 'Freeze',
                description: 'Slows all enemies for 5 seconds',
                cost: 40,
                cooldown: 15,
                slowFactor: 0.3,
                duration: 5,
                minLevel: 2
            },
            {
                id: 'lightning',
                name: 'Chain Lightning',
                description: 'Lightning that jumps between enemies',
                cost: 60,
                cooldown: 20,
                damage: 100,
                jumps: 5,
                minLevel: 3
            },
            {
                id: 'meteor',
                name: 'Meteor Storm',
                description: 'Rain meteors over large area',
                cost: 100,
                cooldown: 30,
                damage: 150,
                radius: 100,
                duration: 3,
                minLevel: 4
            }
        ];
        
        return allSpells.filter(spell => spell.minLevel <= level);
    }
    
    castSpell(spellId, targetX, targetY, enemies) {
        const spell = this.availableSpells.find(s => s.id === spellId);
        if (!spell || this.spellCooldowns[spellId] > 0 || !this.gameState.spend(spell.cost)) {
            return false;
        }
        
        this.spellCooldowns[spellId] = spell.cooldown;
        
        switch (spellId) {
            case 'fireball':
                this.castFireball(targetX, targetY, enemies, spell);
                break;
            case 'freeze':
                this.castFreeze(enemies, spell);
                break;
            case 'lightning':
                this.castLightning(enemies, spell);
                break;
            case 'meteor':
                this.castMeteor(targetX, targetY, enemies, spell);
                break;
        }
        
        return true;
    }
    
    castFireball(x, y, enemies, spell) {
        // Damage all enemies in radius
        enemies.forEach(enemy => {
            const distance = Math.hypot(enemy.x - x, enemy.y - y);
            if (distance <= spell.radius) {
                const damage = spell.damage * (1 - distance / spell.radius * 0.5);
                enemy.takeDamage(Math.floor(damage));
            }
        });
        
        // Visual effect
        this.activeSpells.push({
            type: 'explosion',
            x: x,
            y: y,
            radius: spell.radius,
            duration: 1,
            maxDuration: 1
        });
    }
    
    castFreeze(enemies, spell) {
        enemies.forEach(enemy => {
            enemy.speed *= spell.slowFactor;
            // Set a timer to restore speed
            setTimeout(() => {
                enemy.speed /= spell.slowFactor;
            }, spell.duration * 1000);
        });
        
        this.activeSpells.push({
            type: 'freeze',
            duration: spell.duration,
            maxDuration: spell.duration
        });
    }
    
    castLightning(enemies, spell) {
        if (enemies.length === 0) return;
        
        // Find closest enemy to academy
        let currentTarget = enemies.reduce((closest, enemy) => {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            const closestDist = Math.hypot(closest.x - this.x, closest.y - this.y);
            return dist < closestDist ? enemy : closest;
        });
        
        const targets = [currentTarget];
        currentTarget.takeDamage(spell.damage);
        
        // Chain to nearby enemies
        for (let i = 1; i < spell.jumps && i < enemies.length; i++) {
            const nearbyEnemies = enemies.filter(enemy => 
                !targets.includes(enemy) &&
                Math.hypot(enemy.x - currentTarget.x, enemy.y - currentTarget.y) <= 80
            );
            
            if (nearbyEnemies.length === 0) break;
            
            currentTarget = nearbyEnemies[0];
            targets.push(currentTarget);
            currentTarget.takeDamage(Math.floor(spell.damage * (1 - i * 0.2)));
        }
        
        this.activeSpells.push({
            type: 'lightning',
            targets: targets.map(t => ({ x: t.x, y: t.y })),
            duration: 0.5,
            maxDuration: 0.5
        });
    }
    
    castMeteor(x, y, enemies, spell) {
        this.activeSpells.push({
            type: 'meteor',
            x: x,
            y: y,
            radius: spell.radius,
            damage: spell.damage,
            duration: spell.duration,
            maxDuration: spell.duration,
            lastStrike: 0
        });
    }
    
    getAvailableSpells() {
        return this.availableSpells.map(spell => ({
            ...spell,
            cooldownRemaining: this.spellCooldowns[spell.id]
        }));
    }
    
    render(ctx) {
        // Calculate building size based on grid cell size (4x4 cells)
        const baseResolution = 1920;
        const scaleFactor = Math.max(0.5, Math.min(2.5, ctx.canvas.width / baseResolution));
        const cellSize = Math.floor(32 * scaleFactor);
        const buildingSize = cellSize * 4;
        
        // 3D shadow
        ctx.fillStyle = 'rgba(75, 0, 130, 0.4)';
        ctx.fillRect(this.x - buildingSize * 0.4 + 6, this.y - buildingSize * 0.35 + 6, buildingSize * 0.8, buildingSize * 0.7);
        
        const buildingWidth = buildingSize * 0.8;
        const buildingHeight = buildingSize * 0.7;
        
        // Main academy tower (tall mystical structure)
        const towerGradient = ctx.createLinearGradient(
            this.x - buildingWidth/2, this.y - buildingHeight,
            this.x + buildingWidth/3, this.y
        );
        towerGradient.addColorStop(0, '#9370DB');
        towerGradient.addColorStop(0.3, '#8A2BE2');
        towerGradient.addColorStop(0.7, '#6A5ACD');
        towerGradient.addColorStop(1, '#483D8B');
        
        ctx.fillStyle = towerGradient;
        ctx.strokeStyle = '#2E0A4F';
        ctx.lineWidth = 3;
        
        // Academy base (octagonal)
        this.drawOctagon(ctx, this.x, this.y, buildingWidth/2);
        ctx.stroke();
        
        // Central spire
        const spireHeight = buildingHeight * 1.2;
        const spireWidth = buildingWidth * 0.4;
        
        ctx.fillRect(this.x - spireWidth/2, this.y - spireHeight, spireWidth, spireHeight);
        ctx.strokeRect(this.x - spireWidth/2, this.y - spireHeight, spireWidth, spireHeight);
        
        // Mystical windows with glow
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const windowX = this.x + Math.cos(angle) * buildingWidth * 0.35;
            const windowY = this.y - buildingHeight * 0.5 + Math.sin(angle) * buildingWidth * 0.35;
            
            // Window glow
            const windowGlow = ctx.createRadialGradient(windowX, windowY, 0, windowX, windowY, 12);
            windowGlow.addColorStop(0, `rgba(138, 43, 226, ${this.crystalPulse})`);
            windowGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
            ctx.fillStyle = windowGlow;
            ctx.beginPath();
            ctx.arc(windowX, windowY, 12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Floating crystal at the top
        const crystalY = this.y - spireHeight - 20;
        const crystalGlow = ctx.createRadialGradient(this.x, crystalY, 0, this.x, crystalY, 15);
        crystalGlow.addColorStop(0, `rgba(255, 255, 255, ${this.crystalPulse})`);
        crystalGlow.addColorStop(0.3, `rgba(138, 43, 226, ${this.crystalPulse})`);
        crystalGlow.addColorStop(1, 'rgba(138, 43, 226, 0)');
        
        ctx.fillStyle = crystalGlow;
        ctx.beginPath();
        ctx.arc(this.x, crystalY, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Crystal core
        ctx.fillStyle = `rgba(255, 255, 255, ${this.crystalPulse})`;
        ctx.beginPath();
        ctx.arc(this.x, crystalY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Rotating runes around the academy
        for (let i = 0; i < 8; i++) {
            const runeAngle = this.runeRotation + (i / 8) * Math.PI * 2;
            const runeRadius = buildingWidth * 0.7;
            const runeX = this.x + Math.cos(runeAngle) * runeRadius;
            const runeY = this.y - buildingHeight * 0.3 + Math.sin(runeAngle) * runeRadius * 0.5;
            
            ctx.fillStyle = `rgba(138, 43, 226, ${this.crystalPulse * 0.8})`;
            ctx.font = 'bold 16px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(['◊', '☆', '◇', '※', '❋', '⚡', '✦', '◈'][i], runeX, runeY);
        }
        
        // Render magic particles
        this.magicParticles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.fillStyle = particle.color + alpha + ')';
            ctx.beginPath();
            ctx.arc(this.x + particle.x, this.y + particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Academy level indicator
        ctx.fillStyle = '#9370DB';
        ctx.font = 'bold 16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`ACADEMY LV${this.level}`, this.x, this.y - buildingHeight - 45);
        
        // Show available spells count
        ctx.font = '12px serif';
        ctx.fillText(`${this.availableSpells.length} Spells Available`, this.x, this.y - buildingHeight - 30);
    }
    
    drawOctagon(ctx, centerX, centerY, radius) {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }
    
    static getInfo() {
        return {
            name: 'Arcane Academy',
            description: 'Magical institution that researches and provides combat spells.',
            effect: 'Unlocks powerful spells to cast on enemies',
            spells: 'Fireball, Freeze, Lightning, Meteor',
            maxLevel: '4 (unlocks all spells)',
            cost: 400
        };
    }
}
