import { LevelBase } from '../LevelBase.js';

export class FrogKingsRealmLevel extends LevelBase {
    static levelMetadata = {
        name: "Frog King's Realm",
        difficulty: 'Special',
        order: 99,
        campaign: 'mountain'
    };

    constructor() {
        super();
        this.levelName = FrogKingsRealmLevel.levelMetadata.name;
        this.levelNumber = FrogKingsRealmLevel.levelMetadata.order;
        this.difficulty = FrogKingsRealmLevel.levelMetadata.difficulty;
        this.campaign = 'mountain';
        this.maxWaves = 1;

        // Level flags: no tower building, no-cooldown spells, auto-place superweapon, no loss
        this.levelFlags = {
            noTowerBuilding: true,
            spellsNoCooldown: true,
            noLoss: true,
            autoPlaceSuperWeaponLab: { gridX: 33, gridY: 12 },
            realmLootConfig: { normalChance: 0.55, rareChance: 0.15, realmShardChance: 0 }
        };

        // Realm ambient particles (magical atmosphere)
        this._realmParticles = [];
        this._realmParticleTimer = 0;
        this._realmAnimTime = 0;

        // Rich mixed terrain for the magical weird realm feel
        // Path is at gridY=20. Lab occupies gridX 33-36, gridY 12-15. Avoid those zones.
        this.terrainElements = [
            // ---- UPPER ZONE (y 1-17, left of lab) ----
            // Far left trees
            { type: 'vegetation', gridX: 1,  gridY: 2,  size: 2.2, variant: 0 },
            { type: 'vegetation', gridX: 3,  gridY: 1,  size: 1.8, variant: 2 },
            { type: 'rock',       gridX: 5,  gridY: 3,  size: 1.4 },
            { type: 'vegetation', gridX: 6,  gridY: 1,  size: 2.5, variant: 1 },
            { type: 'drybush',    gridX: 9,  gridY: 4,  size: 1.3 },
            { type: 'rock',       gridX: 10, gridY: 2,  size: 1.6 },
            { type: 'vegetation', gridX: 12, gridY: 3,  size: 2.0, variant: 3 },
            { type: 'cactus',     gridX: 14, gridY: 1,  size: 1.5, variant: 0 },
            { type: 'vegetation', gridX: 15, gridY: 4,  size: 2.3, variant: 0 },
            { type: 'rock',       gridX: 17, gridY: 2,  size: 1.3 },
            { type: 'drybush',    gridX: 18, gridY: 5,  size: 1.2 },
            { type: 'cactus',     gridX: 20, gridY: 3,  size: 1.7, variant: 2 },
            { type: 'vegetation', gridX: 21, gridY: 1,  size: 2.0, variant: 1 },
            { type: 'rock',       gridX: 23, gridY: 4,  size: 1.5 },
            { type: 'vegetation', gridX: 24, gridY: 2,  size: 2.4, variant: 3 },
            { type: 'drybush',    gridX: 26, gridY: 5,  size: 1.4 },
            { type: 'cactus',     gridX: 27, gridY: 1,  size: 1.6, variant: 4 },
            { type: 'rock',       gridX: 29, gridY: 3,  size: 1.8 },
            { type: 'vegetation', gridX: 30, gridY: 5,  size: 2.1, variant: 2 },
            { type: 'drybush',    gridX: 31, gridY: 2,  size: 1.2 },
            // Mid-upper rows (y 7-11)
            { type: 'vegetation', gridX: 1,  gridY: 8,  size: 2.4, variant: 2 },
            { type: 'rock',       gridX: 4,  gridY: 10, size: 1.5 },
            { type: 'cactus',     gridX: 7,  gridY: 7,  size: 1.8, variant: 1 },
            { type: 'vegetation', gridX: 10, gridY: 9,  size: 2.0, variant: 0 },
            { type: 'drybush',    gridX: 12, gridY: 11, size: 1.3 },
            { type: 'rock',       gridX: 15, gridY: 8,  size: 1.6 },
            { type: 'vegetation', gridX: 17, gridY: 10, size: 2.5, variant: 3 },
            { type: 'cactus',     gridX: 19, gridY: 7,  size: 1.4, variant: 3 },
            { type: 'rock',       gridX: 22, gridY: 11, size: 1.7 },
            { type: 'vegetation', gridX: 24, gridY: 8,  size: 2.2, variant: 1 },
            { type: 'drybush',    gridX: 26, gridY: 10, size: 1.5 },
            { type: 'rock',       gridX: 28, gridY: 9,  size: 1.3 },
            { type: 'cactus',     gridX: 30, gridY: 11, size: 1.6, variant: 0 },
            { type: 'vegetation', gridX: 31, gridY: 8,  size: 2.0, variant: 2 },
            // Near-lab gap row (y 12-17, right of lab at x>=38)
            { type: 'vegetation', gridX: 38, gridY: 12, size: 2.3, variant: 0 },
            { type: 'rock',       gridX: 40, gridY: 14, size: 1.5 },
            { type: 'drybush',    gridX: 42, gridY: 11, size: 1.3 },
            { type: 'cactus',     gridX: 44, gridY: 13, size: 1.7, variant: 2 },
            { type: 'vegetation', gridX: 46, gridY: 15, size: 2.1, variant: 1 },
            { type: 'rock',       gridX: 48, gridY: 12, size: 1.6 },
            { type: 'vegetation', gridX: 50, gridY: 14, size: 2.4, variant: 3 },
            { type: 'drybush',    gridX: 52, gridY: 11, size: 1.4 },
            { type: 'cactus',     gridX: 54, gridY: 13, size: 1.5, variant: 4 },
            { type: 'rock',       gridX: 56, gridY: 15, size: 1.8 },
            { type: 'vegetation', gridX: 58, gridY: 12, size: 2.0, variant: 0 },
            { type: 'drybush',    gridX: 60, gridY: 14, size: 1.3 },
            { type: 'cactus',     gridX: 62, gridY: 11, size: 1.6, variant: 1 },
            { type: 'vegetation', gridX: 64, gridY: 13, size: 2.2, variant: 2 },
            { type: 'rock',       gridX: 66, gridY: 15, size: 1.4 },
            { type: 'vegetation', gridX: 68, gridY: 12, size: 2.5, variant: 3 },
            // Very top strip (y 16-17)
            { type: 'rock',       gridX: 2,  gridY: 16, size: 1.5 },
            { type: 'vegetation', gridX: 5,  gridY: 17, size: 1.9, variant: 1 },
            { type: 'drybush',    gridX: 8,  gridY: 16, size: 1.2 },
            { type: 'cactus',     gridX: 11, gridY: 17, size: 1.5, variant: 3 },
            { type: 'rock',       gridX: 14, gridY: 16, size: 1.7 },
            { type: 'vegetation', gridX: 17, gridY: 17, size: 2.0, variant: 0 },
            { type: 'drybush',    gridX: 20, gridY: 16, size: 1.3 },
            { type: 'cactus',     gridX: 23, gridY: 17, size: 1.4, variant: 2 },
            { type: 'rock',       gridX: 26, gridY: 16, size: 1.6 },
            { type: 'vegetation', gridX: 29, gridY: 17, size: 2.1, variant: 3 },
            { type: 'drybush',    gridX: 38, gridY: 17, size: 1.2 },
            { type: 'rock',       gridX: 41, gridY: 16, size: 1.5 },
            { type: 'vegetation', gridX: 44, gridY: 17, size: 2.0, variant: 1 },
            { type: 'cactus',     gridX: 47, gridY: 16, size: 1.6, variant: 0 },
            { type: 'drybush',    gridX: 50, gridY: 17, size: 1.3 },
            { type: 'rock',       gridX: 53, gridY: 16, size: 1.4 },
            { type: 'vegetation', gridX: 56, gridY: 17, size: 2.3, variant: 2 },
            { type: 'cactus',     gridX: 59, gridY: 16, size: 1.7, variant: 4 },
            { type: 'rock',       gridX: 62, gridY: 17, size: 1.5 },
            { type: 'vegetation', gridX: 65, gridY: 16, size: 2.0, variant: 0 },
            { type: 'drybush',    gridX: 68, gridY: 17, size: 1.2 },
            // ---- LOWER ZONE (y 23-38) ----
            // Just below path
            { type: 'vegetation', gridX: 1,  gridY: 23, size: 2.0, variant: 1 },
            { type: 'rock',       gridX: 4,  gridY: 24, size: 1.5 },
            { type: 'drybush',    gridX: 6,  gridY: 23, size: 1.3 },
            { type: 'cactus',     gridX: 9,  gridY: 24, size: 1.6, variant: 0 },
            { type: 'vegetation', gridX: 11, gridY: 23, size: 2.2, variant: 3 },
            { type: 'rock',       gridX: 13, gridY: 24, size: 1.4 },
            { type: 'drybush',    gridX: 16, gridY: 23, size: 1.2 },
            { type: 'cactus',     gridX: 18, gridY: 24, size: 1.7, variant: 2 },
            { type: 'vegetation', gridX: 20, gridY: 23, size: 2.4, variant: 0 },
            { type: 'rock',       gridX: 22, gridY: 24, size: 1.5 },
            { type: 'drybush',    gridX: 25, gridY: 23, size: 1.3 },
            { type: 'cactus',     gridX: 27, gridY: 24, size: 1.4, variant: 4 },
            { type: 'vegetation', gridX: 29, gridY: 23, size: 2.1, variant: 1 },
            { type: 'rock',       gridX: 32, gridY: 24, size: 1.6 },
            { type: 'drybush',    gridX: 35, gridY: 23, size: 1.2 },
            { type: 'cactus',     gridX: 38, gridY: 24, size: 1.8, variant: 1 },
            { type: 'vegetation', gridX: 40, gridY: 23, size: 2.3, variant: 2 },
            { type: 'rock',       gridX: 43, gridY: 24, size: 1.5 },
            { type: 'drybush',    gridX: 46, gridY: 23, size: 1.4 },
            { type: 'cactus',     gridX: 49, gridY: 24, size: 1.6, variant: 3 },
            { type: 'vegetation', gridX: 51, gridY: 23, size: 2.0, variant: 0 },
            { type: 'rock',       gridX: 54, gridY: 24, size: 1.3 },
            { type: 'drybush',    gridX: 57, gridY: 23, size: 1.5 },
            { type: 'cactus',     gridX: 60, gridY: 24, size: 1.4, variant: 0 },
            { type: 'vegetation', gridX: 63, gridY: 23, size: 2.2, variant: 3 },
            { type: 'rock',       gridX: 66, gridY: 24, size: 1.6 },
            { type: 'drybush',    gridX: 68, gridY: 23, size: 1.2 },
            // Mid-lower (y 26-32)
            { type: 'vegetation', gridX: 2,  gridY: 28, size: 2.4, variant: 0 },
            { type: 'rock',       gridX: 5,  gridY: 30, size: 1.7 },
            { type: 'cactus',     gridX: 7,  gridY: 27, size: 1.5, variant: 2 },
            { type: 'vegetation', gridX: 10, gridY: 29, size: 2.1, variant: 1 },
            { type: 'drybush',    gridX: 13, gridY: 31, size: 1.3 },
            { type: 'rock',       gridX: 15, gridY: 28, size: 1.6 },
            { type: 'vegetation', gridX: 18, gridY: 30, size: 2.5, variant: 3 },
            { type: 'cactus',     gridX: 21, gridY: 27, size: 1.4, variant: 4 },
            { type: 'rock',       gridX: 23, gridY: 31, size: 1.8 },
            { type: 'drybush',    gridX: 25, gridY: 29, size: 1.2 },
            { type: 'vegetation', gridX: 28, gridY: 27, size: 2.0, variant: 2 },
            { type: 'cactus',     gridX: 31, gridY: 30, size: 1.6, variant: 0 },
            { type: 'rock',       gridX: 34, gridY: 28, size: 1.5 },
            { type: 'vegetation', gridX: 37, gridY: 31, size: 2.3, variant: 1 },
            { type: 'drybush',    gridX: 40, gridY: 29, size: 1.4 },
            { type: 'cactus',     gridX: 43, gridY: 27, size: 1.7, variant: 3 },
            { type: 'rock',       gridX: 46, gridY: 30, size: 1.5 },
            { type: 'vegetation', gridX: 49, gridY: 28, size: 2.2, variant: 0 },
            { type: 'drybush',    gridX: 51, gridY: 31, size: 1.3 },
            { type: 'rock',       gridX: 54, gridY: 27, size: 1.6 },
            { type: 'vegetation', gridX: 57, gridY: 29, size: 2.0, variant: 2 },
            { type: 'cactus',     gridX: 60, gridY: 31, size: 1.4, variant: 1 },
            { type: 'drybush',    gridX: 62, gridY: 28, size: 1.2 },
            { type: 'rock',       gridX: 65, gridY: 30, size: 1.7 },
            { type: 'vegetation', gridX: 67, gridY: 28, size: 2.4, variant: 3 },
            // Bottom strip (y 34-38)
            { type: 'vegetation', gridX: 1,  gridY: 35, size: 2.3, variant: 0 },
            { type: 'rock',       gridX: 4,  gridY: 37, size: 1.5 },
            { type: 'cactus',     gridX: 7,  gridY: 35, size: 1.6, variant: 2 },
            { type: 'vegetation', gridX: 10, gridY: 36, size: 2.0, variant: 1 },
            { type: 'drybush',    gridX: 13, gridY: 38, size: 1.3 },
            { type: 'rock',       gridX: 16, gridY: 35, size: 1.4 },
            { type: 'vegetation', gridX: 19, gridY: 37, size: 2.5, variant: 3 },
            { type: 'cactus',     gridX: 22, gridY: 35, size: 1.7, variant: 0 },
            { type: 'rock',       gridX: 25, gridY: 38, size: 1.5 },
            { type: 'drybush',    gridX: 27, gridY: 36, size: 1.2 },
            { type: 'vegetation', gridX: 30, gridY: 35, size: 2.1, variant: 2 },
            { type: 'cactus',     gridX: 33, gridY: 37, size: 1.6, variant: 4 },
            { type: 'rock',       gridX: 36, gridY: 35, size: 1.8 },
            { type: 'vegetation', gridX: 39, gridY: 38, size: 2.0, variant: 1 },
            { type: 'drybush',    gridX: 42, gridY: 36, size: 1.4 },
            { type: 'cactus',     gridX: 45, gridY: 35, size: 1.5, variant: 3 },
            { type: 'rock',       gridX: 48, gridY: 37, size: 1.3 },
            { type: 'vegetation', gridX: 51, gridY: 35, size: 2.4, variant: 0 },
            { type: 'drybush',    gridX: 54, gridY: 38, size: 1.2 },
            { type: 'cactus',     gridX: 57, gridY: 36, size: 1.6, variant: 2 },
            { type: 'rock',       gridX: 60, gridY: 35, size: 1.7 },
            { type: 'vegetation', gridX: 63, gridY: 37, size: 2.2, variant: 3 },
            { type: 'drybush',    gridX: 65, gridY: 35, size: 1.3 },
            { type: 'rock',       gridX: 67, gridY: 38, size: 1.5 },
            { type: 'vegetation', gridX: 69, gridY: 36, size: 1.9, variant: 1 }
        ];
    }

    createMeanderingPath(canvasWidth, canvasHeight) {
        // Straight horizontal path at grid row 20
        const pathInGridCoords = [
            { gridX: 0, gridY: 20 },
            { gridX: 69, gridY: 20 }
        ];

        this.path = pathInGridCoords.map(point => ({
            x: Math.round(point.gridX * this.cellSize),
            y: Math.round(point.gridY * this.cellSize)
        }));
    }

    getWaveConfig(wave) {
        if (wave === 1) {
            return {
                enemyHealth_multiplier: 1.0,
                speedMultiplier: 1.0,
                spawnInterval: 0.3,
                pattern: [{ type: 'frog', count: 100 }]
            };
        }
        return null;
    }

    /**
     * Override background rendering to give this level a magical realm look.
     * Called by the terrain canvas caching system in LevelBase.
     */
    getVisualConfig() {
        return {
            grassColors: {
                top: '#0d0030',
                upper: '#1a0050',
                lower: '#0a0025',
                bottom: '#050015'
            },
            grassPatchDensity: 0,
            pathBaseColor: '#2a0080',
            edgeBushColor: '#1a0060',
            edgeRockColor: '#3a0090',
            edgeGrassColor: '#0a0040',
            flowerDensity: 0
        };
    }

    /**
     * Update realm ambient effects - call this every frame from GameplayState render.
     */
    updateRealmEffects(deltaTime) {
        this._realmAnimTime = (this._realmAnimTime || 0) + deltaTime;
        this._realmParticleTimer = (this._realmParticleTimer || 0) + deltaTime;
        const cs = this.cellSize;
        const cw = (this.gridWidth || 70) * cs;
        const ch = (this.gridHeight || 40) * cs;

        // Spawn new ambient sparkles
        if (this._realmParticleTimer > 0.04) {
            this._realmParticleTimer = 0;
            const colors = ['rgb(0,255,200)', 'rgb(170,0,255)', 'rgb(255,200,0)', 'rgb(100,180,255)'];
            this._realmParticles.push({
                x: Math.random() * cw,
                y: Math.random() * ch,
                vx: (Math.random() - 0.5) * 20,
                vy: -15 - Math.random() * 30,
                life: 1.5 + Math.random() * 2,
                maxLife: 3.5,
                size: 1 + Math.random() * 2,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        // Update particles
        for (let i = this._realmParticles.length - 1; i >= 0; i--) {
            const p = this._realmParticles[i];
            p.life -= deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 5 * deltaTime; // gentle gravity
            if (p.life <= 0) {
                this._realmParticles.splice(i, 1);
            }
        }
    }

    /**
     * Override render to draw realm-specific visuals on top of base terrain.
     */
    render(ctx) {
        // Call parent render first (handles initialization, grass background, path, terrain)
        super.render(ctx);
        // Draw magical realm overlay effects on top
        this._renderRealmOverlay(ctx);
    }

    renderForegroundTerrain(ctx) {
        // Call parent (handles foreground vegetation etc.)
        super.renderForegroundTerrain(ctx);
        // Render realm effect particles in the foreground
        this._renderRealmParticles(ctx);
    }

    _renderRealmOverlay(ctx) {
        const t = this._realmAnimTime || 0;
        const cs = this.cellSize;
        const cw = ctx.canvas ? ctx.canvas.width : this.gridWidth * cs;
        const ch = ctx.canvas ? ctx.canvas.height : this.gridHeight * cs;
        const pathY = this.path && this.path.length > 0 ? this.path[0].y : 20 * cs;

        ctx.save();

        // Dark magical tint over the whole level (dim normal terrain)
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#050015';
        ctx.fillRect(0, 0, cw, ch);
        ctx.globalAlpha = 1;

        // Glowing aura along the path
        const glowPulse = 0.5 + 0.3 * Math.sin(t * 1.8);
        const aura = ctx.createLinearGradient(0, pathY - cs * 6, 0, pathY + cs * 6);
        aura.addColorStop(0, 'rgba(0,0,0,0)');
        aura.addColorStop(0.35, `rgba(60,0,180,${0.22 * glowPulse})`);
        aura.addColorStop(0.5, `rgba(0,180,130,${0.18 * glowPulse})`);
        aura.addColorStop(0.65, `rgba(60,0,180,${0.22 * glowPulse})`);
        aura.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aura;
        ctx.fillRect(0, pathY - cs * 6, cw, cs * 12);

        // Floating rune symbols in upper and lower halves
        const runeData = [
            { gx: 6, gy: 7 }, { gx: 16, gy: 5 }, { gx: 26, gy: 9 },
            { gx: 36, gy: 6 }, { gx: 46, gy: 8 }, { gx: 56, gy: 5 },
            { gx: 8, gy: 32 }, { gx: 18, gy: 34 }, { gx: 28, gy: 31 },
            { gx: 38, gy: 33 }, { gx: 48, gy: 30 }, { gx: 58, gy: 34 },
            { gx: 66, gy: 31 }
        ];
        runeData.forEach((pos, idx) => {
            const rx = pos.gx * cs;
            const ry = pos.gy * cs;
            const phase = t * 0.7 + idx * 0.9;
            const alpha = 0.2 + 0.15 * Math.sin(phase);
            const color = idx % 3 === 0 ? `rgba(0,220,160,${alpha})` :
                          idx % 3 === 1 ? `rgba(160,0,255,${alpha})` :
                                          `rgba(255,190,0,${alpha})`;
            const r = cs * (0.3 + 0.08 * Math.sin(phase * 0.6));
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.arc(rx, ry, r, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(rx - r * 0.6, ry); ctx.lineTo(rx + r * 0.6, ry); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(rx, ry - r * 0.6); ctx.lineTo(rx, ry + r * 0.6); ctx.stroke();
        });

        ctx.restore();
    }

    _renderRealmParticles(ctx) {
        // Render floating sparkles in foreground
        ctx.save();
        for (let i = 0; i < this._realmParticles.length; i++) {
            const p = this._realmParticles[i];
            const alpha = Math.min(1, (p.life / p.maxLife) * 1.2) * 0.7;
            if (alpha <= 0) continue;
            ctx.fillStyle = p.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}
