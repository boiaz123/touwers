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
        this.maxWaves = 5;

        // Level flags: no tower building, no-cooldown spells, auto-place superweapon
        this.levelFlags = {
            noTowerBuilding: true,
            spellsNoCooldown: true,
            autoPlaceSuperWeaponLab: { gridX: 33, gridY: 12 },
            realmLootConfig: { normalChance: 0.2, rareChance: 0.05, realmShardChance: 0 }
        };

        // Realm ambient particles (magical atmosphere)
        this._realmParticles = [];
        this._realmParticleTimer = 0;
        this._realmAnimTime = 0;

        this.terrainElements = [];
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
        const waveConfigs = [
            // Wave 1 - 20 frogs, normal health
            {
                enemyHealth_multiplier: 1.0,
                speedMultiplier: 1.0,
                spawnInterval: 0.5,
                pattern: [{ type: 'frog', count: 20 }]
            },
            // Wave 2
            {
                enemyHealth_multiplier: 1.2,
                speedMultiplier: 1.1,
                spawnInterval: 0.5,
                pattern: [{ type: 'frog', count: 20 }]
            },
            // Wave 3
            {
                enemyHealth_multiplier: 1.5,
                speedMultiplier: 1.2,
                spawnInterval: 0.45,
                pattern: [{ type: 'frog', count: 20 }]
            },
            // Wave 4
            {
                enemyHealth_multiplier: 1.8,
                speedMultiplier: 1.3,
                spawnInterval: 0.4,
                pattern: [{ type: 'frog', count: 20 }]
            },
            // Wave 5 - final wave
            {
                enemyHealth_multiplier: 2.2,
                speedMultiplier: 1.5,
                spawnInterval: 0.3,
                pattern: [{ type: 'frog', count: 20 }]
            }
        ];

        if (wave >= 1 && wave <= waveConfigs.length) {
            return waveConfigs[wave - 1];
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
