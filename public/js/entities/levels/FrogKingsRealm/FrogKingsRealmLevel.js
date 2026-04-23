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
            realmLootConfig: { normalChance: 0.12, rareChance: 0.05, realmShardChance: 0 }
        };

        // Realm ambient particles (magical atmosphere)
        this._realmParticles = [];
        this._realmParticleTimer = 0;
        this._realmAnimTime = 0;

        // Rich mixed terrain for the magical weird realm feel
        // Path is at gridY=20. Lab occupies gridX 33-36, gridY 12-15. Avoid those zones.
        // vegetation variants cycle across all 4 theme renderers:
        //   0-5: forest trees,  6-9: mountain pines,  10-15: desert plants,  16-21: space plants
        // Placement uses intentional cluster groupings with open clearings between them.
        // Sizes range 1.0-3.2 for strong visual variation. No regular grid spacing.
        this.terrainElements = [
            // ================================================================
            // UPPER ZONE (y 1-18, x 1-69, skip lab at x 33-36 y 12-15)
            // ================================================================

            // --- CLUSTER A: Dense forest grove, top-left corner ---
            { type: 'vegetation', gridX: 1,  gridY: 3,  size: 3.2, variant: 0 },
            { type: 'vegetation', gridX: 3,  gridY: 1,  size: 2.4, variant: 2 },
            { type: 'vegetation', gridX: 2,  gridY: 6,  size: 1.8, variant: 1 },
            { type: 'rock',       gridX: 4,  gridY: 4,  size: 2.0 },
            { type: 'vegetation', gridX: 5,  gridY: 2,  size: 2.6, variant: 3 },
            { type: 'rock',       gridX: 6,  gridY: 5,  size: 1.1 },

            // --- CLUSTER B: Mountain pine ridge ---
            { type: 'vegetation', gridX: 9,  gridY: 2,  size: 3.0, variant: 6 },
            { type: 'vegetation', gridX: 11, gridY: 5,  size: 2.2, variant: 7 },
            { type: 'rock',       gridX: 8,  gridY: 6,  size: 2.1 },
            { type: 'rock',       gridX: 10, gridY: 7,  size: 1.0 },
            { type: 'vegetation', gridX: 12, gridY: 3,  size: 1.6, variant: 9 },

            // --- open clearing x 13-15 ---

            // --- CLUSTER C: Desert outpost ---
            { type: 'vegetation', gridX: 16, gridY: 3,  size: 3.1, variant: 10 },
            { type: 'vegetation', gridX: 18, gridY: 1,  size: 1.7, variant: 11 },
            { type: 'vegetation', gridX: 15, gridY: 5,  size: 1.4, variant: 10 },
            { type: 'rock',       gridX: 19, gridY: 4,  size: 1.5 },

            // --- lone specimen (x 21 gap) ---
            { type: 'vegetation', gridX: 21, gridY: 7,  size: 1.2, variant: 14 },

            // --- CLUSTER D: Alien-forest mix ---
            { type: 'vegetation', gridX: 23, gridY: 2,  size: 2.8, variant: 17 },
            { type: 'vegetation', gridX: 25, gridY: 4,  size: 3.2, variant: 1 },
            { type: 'vegetation', gridX: 24, gridY: 6,  size: 1.5, variant: 19 },
            { type: 'rock',       gridX: 27, gridY: 3,  size: 2.2 },
            { type: 'rock',       gridX: 28, gridY: 5,  size: 1.0 },
            { type: 'vegetation', gridX: 29, gridY: 1,  size: 2.9, variant: 8 },
            { type: 'vegetation', gridX: 31, gridY: 4,  size: 2.1, variant: 21 },
            { type: 'vegetation', gridX: 32, gridY: 6,  size: 1.7, variant: 4 },

            // --- Mid-interior upper zone (y 7-13, x 1-32) ---
            { type: 'vegetation', gridX: 1,  gridY: 9,  size: 2.9, variant: 5 },
            { type: 'vegetation', gridX: 3,  gridY: 12, size: 1.4, variant: 16 },
            { type: 'rock',       gridX: 5,  gridY: 10, size: 1.9 },
            { type: 'vegetation', gridX: 7,  gridY: 8,  size: 2.6, variant: 9 },
            { type: 'vegetation', gridX: 9,  gridY: 12, size: 1.3, variant: 13 },
            { type: 'rock',       gridX: 14, gridY: 9,  size: 1.4 },
            { type: 'rock',       gridX: 15, gridY: 12, size: 2.1 },
            { type: 'vegetation', gridX: 17, gridY: 8,  size: 3.0, variant: 18 },
            { type: 'vegetation', gridX: 19, gridY: 13, size: 1.9, variant: 0 },
            { type: 'vegetation', gridX: 22, gridY: 9,  size: 2.3, variant: 12 },
            { type: 'vegetation', gridX: 26, gridY: 11, size: 1.7, variant: 3 },
            { type: 'vegetation', gridX: 28, gridY: 8,  size: 2.9, variant: 20 },
            { type: 'rock',       gridX: 30, gridY: 10, size: 1.6 },
            { type: 'vegetation', gridX: 32, gridY: 13, size: 2.0, variant: 7 },

            // --- CLUSTER E: Right of lab (x 38-55, y 1-16) ---
            { type: 'vegetation', gridX: 38, gridY: 13, size: 2.9, variant: 21 },
            { type: 'vegetation', gridX: 40, gridY: 11, size: 2.1, variant: 6 },
            { type: 'rock',       gridX: 41, gridY: 14, size: 1.8 },
            { type: 'vegetation', gridX: 43, gridY: 12, size: 1.5, variant: 15 },
            { type: 'rock',       gridX: 43, gridY: 9,  size: 2.2 },
            { type: 'vegetation', gridX: 46, gridY: 15, size: 2.6, variant: 3 },
            { type: 'vegetation', gridX: 48, gridY: 11, size: 3.1, variant: 11 },
            { type: 'vegetation', gridX: 49, gridY: 14, size: 1.4, variant: 18 },
            { type: 'rock',       gridX: 51, gridY: 13, size: 1.9 },
            { type: 'vegetation', gridX: 53, gridY: 10, size: 2.3, variant: 0 },
            { type: 'vegetation', gridX: 55, gridY: 14, size: 2.9, variant: 17 },
            { type: 'vegetation', gridX: 56, gridY: 12, size: 1.6, variant: 8 },

            // --- CLUSTER F: Far-right top (x 57-69, y 1-10) ---
            { type: 'rock',       gridX: 58, gridY: 3,  size: 2.3 },
            { type: 'vegetation', gridX: 60, gridY: 1,  size: 2.6, variant: 6 },
            { type: 'vegetation', gridX: 62, gridY: 4,  size: 1.9, variant: 3 },
            { type: 'rock',       gridX: 64, gridY: 2,  size: 2.3 },
            { type: 'vegetation', gridX: 66, gridY: 5,  size: 3.0, variant: 15 },
            { type: 'vegetation', gridX: 68, gridY: 2,  size: 2.1, variant: 21 },
            { type: 'rock',       gridX: 57, gridY: 15, size: 2.0 },
            { type: 'vegetation', gridX: 60, gridY: 14, size: 2.5, variant: 20 },
            { type: 'vegetation', gridX: 62, gridY: 11, size: 3.1, variant: 2 },
            { type: 'vegetation', gridX: 64, gridY: 13, size: 1.8, variant: 14 },
            { type: 'rock',       gridX: 66, gridY: 10, size: 2.1 },
            { type: 'vegetation', gridX: 68, gridY: 13, size: 2.6, variant: 19 },
            { type: 'vegetation', gridX: 69, gridY: 11, size: 1.5, variant: 5 },

            // --- Top strip (x 38-69, y 1-5) ---
            { type: 'vegetation', gridX: 39, gridY: 3,  size: 2.7, variant: 7 },
            { type: 'vegetation', gridX: 42, gridY: 1,  size: 2.0, variant: 9 },
            { type: 'rock',       gridX: 44, gridY: 2,  size: 1.3 },
            { type: 'vegetation', gridX: 46, gridY: 4,  size: 2.9, variant: 16 },
            { type: 'vegetation', gridX: 50, gridY: 2,  size: 1.5, variant: 12 },
            { type: 'rock',       gridX: 52, gridY: 4,  size: 1.8 },
            { type: 'vegetation', gridX: 54, gridY: 1,  size: 3.1, variant: 4 },

            // --- Pre-path strip (y 15-18, full width except lab gap) ---
            { type: 'vegetation', gridX: 1,  gridY: 16, size: 2.1, variant: 13 },
            { type: 'rock',       gridX: 4,  gridY: 17, size: 1.4 },
            { type: 'vegetation', gridX: 7,  gridY: 15, size: 2.6, variant: 1 },
            { type: 'vegetation', gridX: 11, gridY: 17, size: 1.7, variant: 20 },
            { type: 'rock',       gridX: 14, gridY: 15, size: 1.9 },
            { type: 'vegetation', gridX: 17, gridY: 17, size: 2.9, variant: 4 },
            { type: 'rock',       gridX: 20, gridY: 16, size: 1.1 },
            { type: 'vegetation', gridX: 23, gridY: 15, size: 2.0, variant: 9 },
            { type: 'vegetation', gridX: 26, gridY: 17, size: 1.6, variant: 18 },
            { type: 'rock',       gridX: 29, gridY: 16, size: 2.1 },
            { type: 'vegetation', gridX: 32, gridY: 15, size: 2.5, variant: 6 },
            { type: 'vegetation', gridX: 38, gridY: 17, size: 2.2, variant: 11 },
            { type: 'rock',       gridX: 41, gridY: 16, size: 1.5 },
            { type: 'vegetation', gridX: 44, gridY: 17, size: 1.9, variant: 2 },
            { type: 'rock',       gridX: 47, gridY: 15, size: 2.3 },
            { type: 'vegetation', gridX: 50, gridY: 17, size: 2.7, variant: 19 },
            { type: 'vegetation', gridX: 53, gridY: 15, size: 1.5, variant: 5 },
            { type: 'rock',       gridX: 56, gridY: 17, size: 1.7 },
            { type: 'vegetation', gridX: 59, gridY: 15, size: 3.1, variant: 14 },
            { type: 'vegetation', gridX: 62, gridY: 17, size: 2.0, variant: 8 },
            { type: 'rock',       gridX: 65, gridY: 16, size: 1.6 },
            { type: 'vegetation', gridX: 68, gridY: 15, size: 2.4, variant: 0 },
            { type: 'vegetation', gridX: 69, gridY: 17, size: 1.8, variant: 16 },

            // ================================================================
            // LOWER ZONE (y 22-38, x 1-69)
            // ================================================================

            // --- Post-path border (y 22-24, full width): guard perimeter ---
            { type: 'vegetation', gridX: 2,  gridY: 22, size: 2.1, variant: 1 },
            { type: 'rock',       gridX: 5,  gridY: 23, size: 1.6 },
            { type: 'vegetation', gridX: 8,  gridY: 22, size: 2.7, variant: 17 },
            { type: 'vegetation', gridX: 12, gridY: 23, size: 1.5, variant: 8 },
            { type: 'rock',       gridX: 15, gridY: 22, size: 2.0 },
            { type: 'vegetation', gridX: 18, gridY: 23, size: 2.9, variant: 3 },
            { type: 'vegetation', gridX: 22, gridY: 22, size: 1.6, variant: 20 },
            { type: 'rock',       gridX: 25, gridY: 23, size: 1.3 },
            { type: 'vegetation', gridX: 28, gridY: 22, size: 2.4, variant: 12 },
            { type: 'vegetation', gridX: 31, gridY: 23, size: 3.1, variant: 7 },
            { type: 'rock',       gridX: 35, gridY: 22, size: 1.8 },
            { type: 'vegetation', gridX: 38, gridY: 23, size: 2.2, variant: 0 },
            { type: 'vegetation', gridX: 41, gridY: 22, size: 2.6, variant: 18 },
            { type: 'rock',       gridX: 44, gridY: 23, size: 1.5 },
            { type: 'vegetation', gridX: 47, gridY: 22, size: 1.9, variant: 5 },
            { type: 'vegetation', gridX: 50, gridY: 23, size: 3.0, variant: 11 },
            { type: 'rock',       gridX: 53, gridY: 22, size: 2.1 },
            { type: 'vegetation', gridX: 56, gridY: 23, size: 1.6, variant: 16 },
            { type: 'vegetation', gridX: 60, gridY: 22, size: 2.8, variant: 4 },
            { type: 'rock',       gridX: 63, gridY: 23, size: 1.4 },
            { type: 'vegetation', gridX: 66, gridY: 22, size: 2.3, variant: 13 },
            { type: 'vegetation', gridX: 69, gridY: 23, size: 1.9, variant: 21 },

            // --- CLUSTER G: Dense lower-left grove (x 1-12, y 26-33) ---
            { type: 'vegetation', gridX: 1,  gridY: 27, size: 3.2, variant: 2 },
            { type: 'vegetation', gridX: 3,  gridY: 30, size: 2.1, variant: 6 },
            { type: 'vegetation', gridX: 2,  gridY: 33, size: 1.6, variant: 10 },
            { type: 'rock',       gridX: 5,  gridY: 28, size: 2.3 },
            { type: 'rock',       gridX: 4,  gridY: 31, size: 1.0 },
            { type: 'vegetation', gridX: 7,  gridY: 26, size: 2.5, variant: 19 },
            { type: 'vegetation', gridX: 9,  gridY: 30, size: 1.9, variant: 3 },
            { type: 'vegetation', gridX: 11, gridY: 27, size: 2.8, variant: 15 },
            { type: 'rock',       gridX: 12, gridY: 33, size: 1.7 },

            // --- Sparse clearing (x 13-21) ---
            { type: 'vegetation', gridX: 15, gridY: 29, size: 1.3, variant: 14 },
            { type: 'rock',       gridX: 19, gridY: 31, size: 1.9 },
            { type: 'vegetation', gridX: 21, gridY: 28, size: 2.1, variant: 9 },

            // --- CLUSTER H: Desert outcrop (x 23-32, y 26-33) ---
            { type: 'vegetation', gridX: 24, gridY: 27, size: 2.9, variant: 11 },
            { type: 'vegetation', gridX: 26, gridY: 31, size: 1.6, variant: 10 },
            { type: 'rock',       gridX: 28, gridY: 28, size: 2.1 },
            { type: 'vegetation', gridX: 30, gridY: 26, size: 3.1, variant: 12 },
            { type: 'vegetation', gridX: 31, gridY: 32, size: 1.9, variant: 0 },
            { type: 'rock',       gridX: 33, gridY: 29, size: 1.5 },

            // --- CLUSTER I: Space garden (x 35-44, y 25-32) ---
            { type: 'vegetation', gridX: 35, gridY: 26, size: 2.6, variant: 18 },
            { type: 'vegetation', gridX: 37, gridY: 30, size: 3.1, variant: 16 },
            { type: 'vegetation', gridX: 38, gridY: 27, size: 1.7, variant: 21 },
            { type: 'rock',       gridX: 40, gridY: 32, size: 2.0 },
            { type: 'vegetation', gridX: 42, gridY: 26, size: 2.3, variant: 17 },
            { type: 'vegetation', gridX: 44, gridY: 31, size: 1.5, variant: 20 },
            { type: 'rock',       gridX: 45, gridY: 28, size: 1.3 },

            // --- CLUSTER J: Big right grove (x 46-55, y 26-34) ---
            { type: 'vegetation', gridX: 46, gridY: 27, size: 2.9, variant: 1 },
            { type: 'vegetation', gridX: 48, gridY: 32, size: 2.2, variant: 7 },
            { type: 'vegetation', gridX: 49, gridY: 28, size: 3.2, variant: 5 },
            { type: 'rock',       gridX: 51, gridY: 30, size: 2.1 },
            { type: 'rock',       gridX: 52, gridY: 33, size: 1.4 },
            { type: 'vegetation', gridX: 54, gridY: 26, size: 2.6, variant: 8 },
            { type: 'vegetation', gridX: 55, gridY: 33, size: 1.8, variant: 13 },

            // --- CLUSTER K: Right edge band (x 57-69, y 26-33) ---
            { type: 'vegetation', gridX: 57, gridY: 28, size: 2.4, variant: 4 },
            { type: 'vegetation', gridX: 60, gridY: 26, size: 3.1, variant: 6 },
            { type: 'rock',       gridX: 61, gridY: 31, size: 1.7 },
            { type: 'vegetation', gridX: 63, gridY: 29, size: 2.1, variant: 19 },
            { type: 'vegetation', gridX: 65, gridY: 33, size: 2.7, variant: 2 },
            { type: 'rock',       gridX: 67, gridY: 29, size: 2.0 },
            { type: 'vegetation', gridX: 69, gridY: 27, size: 2.9, variant: 15 },
            { type: 'vegetation', gridX: 68, gridY: 34, size: 1.6, variant: 9 },

            // --- Bottom border (y 35-38, full width) ---
            { type: 'vegetation', gridX: 2,  gridY: 36, size: 2.5, variant: 0 },
            { type: 'rock',       gridX: 6,  gridY: 37, size: 1.8 },
            { type: 'vegetation', gridX: 10, gridY: 35, size: 3.1, variant: 14 },
            { type: 'vegetation', gridX: 13, gridY: 38, size: 2.0, variant: 21 },
            { type: 'rock',       gridX: 17, gridY: 36, size: 2.2 },
            { type: 'vegetation', gridX: 21, gridY: 37, size: 2.7, variant: 7 },
            { type: 'vegetation', gridX: 24, gridY: 35, size: 1.5, variant: 18 },
            { type: 'rock',       gridX: 28, gridY: 38, size: 1.6 },
            { type: 'vegetation', gridX: 32, gridY: 36, size: 2.9, variant: 11 },
            { type: 'vegetation', gridX: 35, gridY: 35, size: 2.1, variant: 4 },
            { type: 'rock',       gridX: 38, gridY: 37, size: 1.9 },
            { type: 'vegetation', gridX: 41, gridY: 36, size: 3.1, variant: 1 },
            { type: 'vegetation', gridX: 45, gridY: 38, size: 1.7, variant: 17 },
            { type: 'rock',       gridX: 49, gridY: 35, size: 1.4 },
            { type: 'vegetation', gridX: 52, gridY: 37, size: 2.4, variant: 8 },
            { type: 'vegetation', gridX: 56, gridY: 36, size: 2.8, variant: 20 },
            { type: 'rock',       gridX: 60, gridY: 38, size: 1.7 },
            { type: 'vegetation', gridX: 63, gridY: 35, size: 2.2, variant: 3 },
            { type: 'vegetation', gridX: 66, gridY: 37, size: 3.0, variant: 16 },
            { type: 'rock',       gridX: 68, gridY: 36, size: 1.5 },
            { type: 'vegetation', gridX: 69, gridY: 38, size: 2.3, variant: 10 }
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
                enemyHealth_multiplier: 10.0,
                speedMultiplier: 1.0,
                spawnInterval: 0.3,
                pattern: [{ type: 'frog', count: 100 }]
            };
        }
        return null;
    }

    /**
     * Override the background canvas rendering to produce a deep purple magical backdrop
     * with nebula clouds and a starfield, replacing the default mountain backdrop.
     */
    _renderBackgroundToCanvas(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Deep purple/indigo base gradient
        const base = ctx.createLinearGradient(0, 0, 0, h);
        base.addColorStop(0,    '#0b0030');
        base.addColorStop(0.3,  '#0e0040');
        base.addColorStop(0.65, '#090025');
        base.addColorStop(1,    '#050014');
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, w, h);

        // Nebula cloud patches — large soft radial gradients of purple, indigo, deep blue
        const nebulae = [
            [0.14, 0.13, 0.28, 'rgba(90,0,160,0.20)'],
            [0.66, 0.10, 0.26, 'rgba(0,50,160,0.16)'],
            [0.38, 0.50, 0.34, 'rgba(110,0,190,0.14)'],
            [0.82, 0.44, 0.22, 'rgba(70,0,130,0.18)'],
            [0.08, 0.72, 0.28, 'rgba(0,70,150,0.15)'],
            [0.54, 0.82, 0.24, 'rgba(100,0,170,0.17)'],
            [0.46, 0.22, 0.20, 'rgba(150,0,210,0.12)'],
            [0.74, 0.68, 0.22, 'rgba(50,0,130,0.16)'],
            [0.22, 0.38, 0.18, 'rgba(0,80,140,0.12)'],
            [0.92, 0.20, 0.16, 'rgba(80,0,150,0.14)'],
        ];
        nebulae.forEach(([fx, fy, frad, col]) => {
            const cx = w * fx, cy = h * fy, r = w * frad;
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0, col);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        });

        // Brighter nebula accent streaks (horizontal) for depth
        const streakG = ctx.createLinearGradient(0, h * 0.35, w, h * 0.40);
        streakG.addColorStop(0,   'rgba(0,0,0,0)');
        streakG.addColorStop(0.2, 'rgba(60,0,120,0.08)');
        streakG.addColorStop(0.5, 'rgba(100,0,200,0.10)');
        streakG.addColorStop(0.8, 'rgba(60,0,120,0.08)');
        streakG.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = streakG;
        ctx.fillRect(0, h * 0.30, w, h * 0.15);

        // Starfield — deterministic pseudo-random placement
        for (let i = 0; i < 260; i++) {
            const sx = ((i * 127 + 53) * 17) % w;
            const sy = ((i * 211 + 37) * 13) % h;
            const sr = 0.4 + (i % 4) * 0.35;
            const sa = 0.25 + (i % 7) * 0.08;
            // Mix of white-blue stars and slight purple tinted ones
            const starColor = i % 5 === 0 ? `rgba(220,180,255,${sa})` :
                              i % 5 === 1 ? `rgba(180,210,255,${sa})` :
                                            `rgba(230,220,255,${sa})`;
            ctx.fillStyle = starColor;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
        }

        // Slightly lighter band near path row (gridY=20) for visual grounding
        const pathFY = 20 / 40;
        const pathBand = ctx.createLinearGradient(0, h * (pathFY - 0.12), 0, h * (pathFY + 0.12));
        pathBand.addColorStop(0,   'rgba(0,0,0,0)');
        pathBand.addColorStop(0.5, 'rgba(40,0,80,0.14)');
        pathBand.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = pathBand;
        ctx.fillRect(0, h * (pathFY - 0.12), w, h * 0.24);
    }

    /**
     * Mix all 4 campaign tree/vegetation renders for the magical cross-realm feel.
     * variant 0-5: forest trees, 6-9: mountain pines, 10-15: desert plants, 16-21: space plants.
     */
    renderVegetation(ctx, x, y, size, gridX, gridY, variant) {
        const v = (variant !== undefined && variant !== null)
            ? variant
            : Math.floor(gridX * 3 + gridY * 7) % 22;
        if (v < 6) {
            this.renderTree(ctx, x, y, size, gridX, gridY, v);
        } else if (v < 10) {
            this.renderMountainVegetation(ctx, x, y, size, gridX, gridY, v - 6);
        } else if (v < 16) {
            this.renderDesertVegetation(ctx, x, y, size, gridX, gridY, v - 10);
        } else {
            this.renderSpaceVegetation(ctx, x, y, size, gridX, gridY, v - 16);
        }
    }

    /**
     * Route cactus-type elements through the proper desert vegetation renders.
     */
    renderCactus(ctx, x, y, size, gridX, gridY) {
        this.renderDesertVegetation(ctx, x, y, size, gridX, gridY, undefined);
    }

    /**
     * Route drybush-type elements through the proper space vegetation renders for alien flavor.
     */
    renderDryBush(ctx, x, y, size, gridX, gridY) {
        this.renderSpaceVegetation(ctx, x, y, size, gridX, gridY, undefined);
    }

    /**
     * Update realm ambient effects - called every frame from GameplayState.
     */
    updateRealmEffects(deltaTime) {
        this._realmAnimTime = (this._realmAnimTime || 0) + deltaTime;
        this._realmParticleTimer = (this._realmParticleTimer || 0) + deltaTime;
        const cs = this.cellSize;
        const cw = (this.gridWidth || 70) * cs;
        const ch = (this.gridHeight || 40) * cs;

        // Spawn particles along all 4 level edges for a "realm boundary" glow effect
        if (this._realmParticleTimer > 0.025) {
            this._realmParticleTimer = 0;
            const colors = [
                'rgb(180,0,255)', 'rgb(120,0,255)', 'rgb(255,0,220)',
                'rgb(0,200,255)', 'rgb(255,220,0)', 'rgb(0,255,180)'
            ];
            const c = colors[Math.floor(Math.random() * colors.length)];

            // Pick one of 4 edges, spawn particle bursting inward
            const edge = Math.floor(Math.random() * 4);
            const margin = cs * 2;
            let px, py, pvx, pvy;
            if (edge === 0) { // top edge
                px = Math.random() * cw;
                py = Math.random() * margin;
                pvx = (Math.random() - 0.5) * 35;
                pvy = 25 + Math.random() * 50;
            } else if (edge === 1) { // bottom edge
                px = Math.random() * cw;
                py = ch - Math.random() * margin;
                pvx = (Math.random() - 0.5) * 35;
                pvy = -(25 + Math.random() * 50);
            } else if (edge === 2) { // left edge
                px = Math.random() * margin;
                py = Math.random() * ch;
                pvx = 25 + Math.random() * 50;
                pvy = (Math.random() - 0.5) * 35;
            } else { // right edge
                px = cw - Math.random() * margin;
                py = Math.random() * ch;
                pvx = -(25 + Math.random() * 50);
                pvy = (Math.random() - 0.5) * 35;
            }

            this._realmParticles.push({
                x: px, y: py, vx: pvx, vy: pvy,
                life: 2.0 + Math.random() * 2.5,
                maxLife: 4.5,
                size: 2 + Math.random() * 3.5,
                color: c,
                edge: true
            });

            // Occasional interior ambient sparkle
            if (Math.random() < 0.35) {
                const c2 = colors[Math.floor(Math.random() * colors.length)];
                this._realmParticles.push({
                    x: Math.random() * cw,
                    y: Math.random() * ch,
                    vx: (Math.random() - 0.5) * 15,
                    vy: -10 - Math.random() * 20,
                    life: 1.0 + Math.random() * 1.5,
                    maxLife: 2.5,
                    size: 0.8 + Math.random() * 1.8,
                    color: c2,
                    edge: false
                });
            }
        }

        // Update all particles
        for (let i = this._realmParticles.length - 1; i >= 0; i--) {
            const p = this._realmParticles[i];
            p.life -= deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            if (p.edge) {
                // Edge particles decelerate as they drift inward
                p.vx *= 0.97;
                p.vy *= 0.97;
            } else {
                p.vy += 4 * deltaTime;
            }
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

        // ---- BORDER VIGNETTE — pulsing purple haze along all 4 edges ----
        const vigW = cw * 0.16;
        const vigH = ch * 0.18;
        const vigPulse = 0.65 + 0.35 * Math.sin(t * 1.1);

        const topG = ctx.createLinearGradient(0, 0, 0, vigH);
        topG.addColorStop(0, `rgba(90,0,170,${0.65 * vigPulse})`);
        topG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = topG; ctx.fillRect(0, 0, cw, vigH);

        const botG = ctx.createLinearGradient(0, ch - vigH, 0, ch);
        botG.addColorStop(0, 'rgba(0,0,0,0)');
        botG.addColorStop(1, `rgba(90,0,170,${0.65 * vigPulse})`);
        ctx.fillStyle = botG; ctx.fillRect(0, ch - vigH, cw, vigH);

        const leftG = ctx.createLinearGradient(0, 0, vigW, 0);
        leftG.addColorStop(0, `rgba(70,0,150,${0.60 * vigPulse})`);
        leftG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = leftG; ctx.fillRect(0, 0, vigW, ch);

        const rightG = ctx.createLinearGradient(cw - vigW, 0, cw, 0);
        rightG.addColorStop(0, 'rgba(0,0,0,0)');
        rightG.addColorStop(1, `rgba(70,0,150,${0.60 * vigPulse})`);
        ctx.fillStyle = rightG; ctx.fillRect(cw - vigW, 0, vigW, ch);

        // ---- PATH GLOW — four layered animated halos ----

        // Layer 1: Wide diffuse teal outer aura
        const pulse1 = 0.45 + 0.30 * Math.sin(t * 1.4);
        const aura1 = ctx.createLinearGradient(0, pathY - cs * 9, 0, pathY + cs * 9);
        aura1.addColorStop(0,   'rgba(0,0,0,0)');
        aura1.addColorStop(0.3, `rgba(0,210,180,${0.30 * pulse1})`);
        aura1.addColorStop(0.5, `rgba(0,230,200,${0.40 * pulse1})`);
        aura1.addColorStop(0.7, `rgba(0,210,180,${0.30 * pulse1})`);
        aura1.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = aura1;
        ctx.fillRect(0, pathY - cs * 9, cw, cs * 18);

        // Layer 2: Tighter purple/magenta mid glow
        const pulse2 = 0.50 + 0.38 * Math.sin(t * 2.2 + 1.1);
        const aura2 = ctx.createLinearGradient(0, pathY - cs * 4.5, 0, pathY + cs * 4.5);
        aura2.addColorStop(0,    'rgba(0,0,0,0)');
        aura2.addColorStop(0.22, `rgba(150,0,255,${0.42 * pulse2})`);
        aura2.addColorStop(0.5,  `rgba(200,0,255,${0.60 * pulse2})`);
        aura2.addColorStop(0.78, `rgba(150,0,255,${0.42 * pulse2})`);
        aura2.addColorStop(1,    'rgba(0,0,0,0)');
        ctx.fillStyle = aura2;
        ctx.fillRect(0, pathY - cs * 4.5, cw, cs * 9);

        // Layer 3: Narrow bright white/gold core line glow
        const pulse3 = 0.60 + 0.40 * Math.sin(t * 3.2 + 2.7);
        const aura3 = ctx.createLinearGradient(0, pathY - cs * 1.8, 0, pathY + cs * 1.8);
        aura3.addColorStop(0,   'rgba(0,0,0,0)');
        aura3.addColorStop(0.3, `rgba(255,210,255,${0.50 * pulse3})`);
        aura3.addColorStop(0.5, `rgba(255,255,255,${0.72 * pulse3})`);
        aura3.addColorStop(0.7, `rgba(255,210,255,${0.50 * pulse3})`);
        aura3.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = aura3;
        ctx.fillRect(0, pathY - cs * 1.8, cw, cs * 3.6);

        // Layer 4: Traveling light orbs along the path (left-to-right and right-to-left)
        const orbs = [
            { speed: 55,   dir: 1,  phase: 0,    color: [200, 255, 255], alpha: 0.72 },
            { speed: 38,   dir: -1, phase: 0.4,  color: [160, 0,   255], alpha: 0.58 },
            { speed: 72,   dir: 1,  phase: 0.75, color: [255, 200, 80],  alpha: 0.50 },
        ];
        orbs.forEach(orb => {
            const rawPos = ((t * orb.speed + cw * orb.phase) * orb.dir) % cw;
            const orbX = rawPos < 0 ? rawPos + cw : rawPos;
            const orbR = cs * 4.5;
            const travelG = ctx.createRadialGradient(orbX, pathY, 0, orbX, pathY, orbR);
            travelG.addColorStop(0,   `rgba(${orb.color[0]},${orb.color[1]},${orb.color[2]},${orb.alpha})`);
            travelG.addColorStop(0.4, `rgba(${orb.color[0]},${orb.color[1]},${orb.color[2]},${orb.alpha * 0.4})`);
            travelG.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.fillStyle = travelG;
            ctx.fillRect(orbX - orbR, pathY - orbR, orbR * 2, orbR * 2);
        });

        // ---- FLOATING RUNE SYMBOLS ----
        const runeData = [
            { gx: 6,  gy: 7  }, { gx: 16, gy: 5  }, { gx: 26, gy: 9  },
            { gx: 36, gy: 6  }, { gx: 46, gy: 8  }, { gx: 56, gy: 5  },
            { gx: 8,  gy: 32 }, { gx: 18, gy: 34 }, { gx: 28, gy: 31 },
            { gx: 38, gy: 33 }, { gx: 48, gy: 30 }, { gx: 58, gy: 34 },
            { gx: 66, gy: 31 }
        ];
        runeData.forEach((pos, idx) => {
            const rx = pos.gx * cs;
            const ry = pos.gy * cs;
            const phase = t * 0.7 + idx * 0.9;
            const alpha = 0.28 + 0.22 * Math.sin(phase);
            const [r, g, b] = idx % 3 === 0 ? [0, 220, 160] :
                              idx % 3 === 1 ? [190, 0, 255] :
                                              [255, 200, 0];
            const color = `rgba(${r},${g},${b},${alpha})`;
            const runeR = cs * (0.38 + 0.12 * Math.sin(phase * 0.6));
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.1;
            ctx.beginPath(); ctx.arc(rx, ry, runeR, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(rx - runeR * 0.72, ry); ctx.lineTo(rx + runeR * 0.72, ry); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(rx, ry - runeR * 0.72); ctx.lineTo(rx, ry + runeR * 0.72); ctx.stroke();
            // Faint outer ring
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.35})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.arc(rx, ry, runeR * 1.7, 0, Math.PI * 2); ctx.stroke();
        });

        ctx.restore();
    }

    _renderRealmParticles(ctx) {
        ctx.save();
        for (let i = 0; i < this._realmParticles.length; i++) {
            const p = this._realmParticles[i];
            const alpha = Math.min(1, (p.life / p.maxLife) * 1.6) * 0.90;
            if (alpha <= 0) continue;
            const col = p.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.edge ? 12 : 7;
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            // Cross/star shape for larger edge particles
            if (p.edge && p.size > 2.5) {
                ctx.strokeStyle = col;
                ctx.lineWidth = 0.9;
                ctx.beginPath();
                ctx.moveTo(p.x - p.size * 1.8, p.y); ctx.lineTo(p.x + p.size * 1.8, p.y);
                ctx.moveTo(p.x, p.y - p.size * 1.8); ctx.lineTo(p.x, p.y + p.size * 1.8);
                ctx.stroke();
            }
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}
