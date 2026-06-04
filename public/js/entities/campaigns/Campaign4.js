import { CampaignBase } from './CampaignBase.js';
import { LevelRegistry } from '../levels/LevelRegistry.js';
import { Castle } from '../buildings/Castle.js';
import { LevelBase } from '../levels/LevelBase.js';
// Import Space levels for Frog Realm campaign
import { SpaceLevel1 } from '../levels/Space/SpaceLevel1.js';
import { SpaceLevel2 } from '../levels/Space/SpaceLevel2.js';
import { SpaceLevel3 } from '../levels/Space/SpaceLevel3.js';
import { SpaceLevel4 } from '../levels/Space/SpaceLevel4.js';
import { SpaceLevel5 } from '../levels/Space/SpaceLevel5.js';
import { SpaceLevel6 } from '../levels/Space/SpaceLevel6.js';
import { SpaceLevel7 } from '../levels/Space/SpaceLevel7.js';
import { SpaceLevel8 } from '../levels/Space/SpaceLevel8.js';
import { FrogKingsRealmLevel } from '../levels/FrogKingsRealm/FrogKingsRealmLevel.js';

/**
 * Campaign4: The Frog King's Realm
 * Interdimensional landscape with alien vegetation and otherworldly rock formations
 * Uses LevelBase terrain rendering for vegetation and rocks with frog realm colors
 */
export class Campaign4 extends CampaignBase {
    constructor(stateManager) {
        super(stateManager);
        
        this.campaignId = 'campaign-4';
        this.campaignName = 'The Frog King\'s Realm';
        this.castleInstances = {};

        // Animation time for castle flags
        this.animationTime = 0;

        // Terrain cache
        this.terrainDetails = {
            vegetation: [],
            moons: [],
            stars: [],
            shootingStars: []
        };
        this.pathPoints = [];

        // Space / alien-themed label banner: dark purple, arcane border
        this.labelStyle = {
            bg1:    'rgba(18, 8, 32, 0.94)',
            bg2:    'rgba(32, 12, 52, 0.97)',
            border: 'rgba(136, 64, 200, 0.88)',
            text:   '#d4a8f8'
        };

        // Register campaign levels once during construction
        this.registerLevels();
    }
    
    registerLevels() {
        /**
         * Register all Frog Realm Campaign levels.
         * Uses Space level templates with Frog Realm theme.
         * Metadata is read from static levelMetadata property in each level class.
         */
        const registerLevel = (levelId, levelClass) => {
            const metadata = levelClass.levelMetadata;
            if (!metadata) {
                throw new Error(`Level ${levelId} does not have static levelMetadata property`);
            }
            LevelRegistry.registerLevel('campaign-4', levelId, levelClass, metadata);
        };

        // Register Space levels for Frog Realm campaign
        registerLevel('level1', SpaceLevel1);
        registerLevel('level2', SpaceLevel2);
        registerLevel('level3', SpaceLevel3);
        registerLevel('level4', SpaceLevel4);
        registerLevel('level5', SpaceLevel5);
        registerLevel('level6', SpaceLevel6);
        registerLevel('level7', SpaceLevel7);
        registerLevel('level8', SpaceLevel8);
        registerLevel('frog-kings-realm', FrogKingsRealmLevel);
        // Levels 3-8 will be created as placeholders in enter()
        // when registerLevels() doesn't find them, generatePathAndSlots creates placeholder objects
    }
    
    enter() {
        // Get levels from registry for this campaign
        let registeredLevels = LevelRegistry.getLevelsByCampaign('campaign-4');
        
        // Apply unlock status from save data
        const saveData = this.stateManager.currentSaveData;
        this.levels = registeredLevels.map(level => ({
            id: level.id,
            name: level.name,
            difficulty: level.difficulty,
            unlocked: !saveData || !saveData.unlockedLevels || saveData.unlockedLevels.includes(level.id) || level.id === 'level1',
            type: 'campaign'
        }));

        
        // Generate level slot positions along a natural winding path
        this.generatePathAndSlots();
        
        // Generate static terrain cache once
        this.generateTerrainCache();
        
        // Call parent enter
        super.enter();
    }
    
    generatePathAndSlots() {
        const canvas = this.stateManager.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Frog Realm path — winding alien landscape, terminating at the boss castle
        // (no exit off-screen; the road ends at the final fortress)
        const bossX = width * 0.87;
        const bossY = height * 0.58;  // elevated, imposing right-side position
        this.pathPoints = [
            // Entry from left
            { x: -20,           y: height * 0.72 },
            { x: width * 0.05,  y: height * 0.72 },
            { x: width * 0.10,  y: height * 0.75 },
            { x: width * 0.15,  y: height * 0.78 },

            // First descent
            { x: width * 0.22,  y: height * 0.82 },
            { x: width * 0.28,  y: height * 0.85 },

            // Deep valley bottom-left
            { x: width * 0.35,  y: height * 0.87 },
            { x: width * 0.42,  y: height * 0.86 },

            // Rise and cross
            { x: width * 0.48,  y: height * 0.81 },
            { x: width * 0.53,  y: height * 0.76 },

            // Second descent
            { x: width * 0.58,  y: height * 0.80 },
            { x: width * 0.63,  y: height * 0.85 },
            { x: width * 0.68,  y: height * 0.86 },

            // Turn and climb toward boss
            { x: width * 0.73,  y: height * 0.82 },
            { x: width * 0.78,  y: height * 0.76 },
            { x: width * 0.82,  y: height * 0.70 },
            { x: width * 0.85,  y: height * 0.64 },

            // Arrives at the boss castle gate
            { x: bossX,         y: bossY }
        ];

        // All levels get a slot — last slot is the boss
        const totalSlots = this.levels.length;
        this.levelSlots = [];

        const positions = this._distributeSlotsByDistance(this.pathPoints, totalSlots);
        // Force last slot to the exact boss castle position
        positions[totalSlots - 1] = { x: bossX, y: bossY };

        for (let i = 0; i < totalSlots; i++) {
            const pos = { ...positions[i] };
            if (i < this.levels.length) {
                pos.level = this.levels[i];
            } else {
                pos.level = {
                    id: `level${i + 1}`,
                    name: `Level ${i + 1}`,
                    difficulty: 'medium',
                    unlocked: false,
                    type: 'campaign'
                };
            }
            pos.levelIndex = i;
            this.levelSlots.push(pos);
        }
    }
    
    generateTerrainCache() {
        const canvas = this.stateManager.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Create a LevelBase instance to use for rendering vegetation and rock elements
        this.levelBase = new LevelBase();
        
        // Generate moon craters once and cache them for stability
        this.terrainDetails.moons = [
            {
                x: width * 0.2,
                y: height * 0.25,
                radius: 45,
                craters: this.generateCraters(5, 45)
            },
            {
                x: width * 0.75,
                y: height * 0.2,
                radius: 28,
                craters: this.generateCraters(3, 28)
            },
            {
                x: width * 0.5,
                y: height * 0.15,
                radius: 35,
                craters: this.generateCraters(4, 35)
            }
        ];
        
        // Generate alien vegetation scattered across the terrain
        const vegetation = [];
        const groundLevelBottom = height * 0.95;   // Bottom of screen
        const groundTopAbove = height * 0.65;      // Above path (higher up)
        const groundLevelPath = height * 0.70;     // Path level
        
        // Use vegetation placement attempts with better spacing
        const vegAttempts = 150;  // Reduced from 200 for less density
        const minVegSpacing = 100; // Increased from 70 for better spread
        
        for (let attempt = 0; attempt < vegAttempts; attempt++) {
            const x = Math.random() * width;
            
            // Randomly decide if vegetation goes above or below the path
            let y, groundTop, groundLevel;
            if (Math.random() < 0.4) {
                // Above path (40%)
                groundTop = groundTopAbove;
                groundLevel = groundLevelPath;
            } else {
                // Below path (60%)
                groundTop = groundLevelPath;
                groundLevel = groundLevelBottom;
            }
            
            y = groundTop + Math.random() * (groundLevel - groundTop);
            
            // Skip if too close to path
            let tooCloseToPath = false;
            for (const pathPoint of this.pathPoints) {
                const dist = Math.hypot(x - pathPoint.x, y - pathPoint.y);
                if (dist < 80) {  // Increased clearance from path
                    tooCloseToPath = true;
                    break;
                }
            }
            if (tooCloseToPath) continue;
            
            // Skip if too close to other vegetation
            let tooCloseToOtherVeg = false;
            for (const veg of vegetation) {
                const dist = Math.hypot(x - veg.x, y - veg.y);
                if (dist < minVegSpacing) {
                    tooCloseToOtherVeg = true;
                    break;
                }
            }
            if (tooCloseToOtherVeg) continue;
            
            vegetation.push({
                x: x,
                y: y,
                size: 32 + Math.random() * 20,
                type: Math.floor(Math.random() * 6), // 6 space vegetation types
                gridX: Math.floor(x / 32),
                gridY: Math.floor(y / 32)
            });
        }
        
        this.terrainDetails.vegetation = vegetation;
    }
    
    generateCraters(count, radius) {
        // Generate stable crater positions for a moon (called once, not every frame)
        const craters = [];
        for (let i = 0; i < count; i++) {
            craters.push({
                x: (Math.random() - 0.5) * radius * 1.2,
                y: (Math.random() - 0.5) * radius * 1.2,
                size: radius * (0.07 + Math.random() * 0.08)
            });
        }
        return craters;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.animationTime += deltaTime;
        this.lastDeltaTime = deltaTime;
    }

    renderBackground(ctx) {
        const canvas = this.stateManager.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Alien sky gradient - otherworldly colors for Frog King's Realm
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
        skyGradient.addColorStop(0, '#5a3a7a');    // Purple-dark at top
        skyGradient.addColorStop(0.3, '#8a5a9a');  // Purple-blue
        skyGradient.addColorStop(0.6, '#9a7aaa');  // Lighter purple
        skyGradient.addColorStop(1, '#b8a8c0');    // Very light purple
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height * 0.6);
        
        // Alien terrain ground - darker purple-green tones
        ctx.fillStyle = '#7a8a6a';
        ctx.fillRect(0, height * 0.6, width, height * 0.4);
        
        // Draw twinkling stars first
        this.renderStars(ctx, width, height);
        
        // Draw shooting stars
        this.renderShootingStars(ctx, width, height);
        
        // Draw moons in the sky
        this.renderMoons(ctx, width, height);
    }

    renderMoons(ctx, width, height) {
        // Use cached moon data with pre-generated craters for stability
        if (this.terrainDetails && this.terrainDetails.moons) {
            for (const moon of this.terrainDetails.moons) {
                // Determine color based on position/index
                let lightColor, darkColor;
                if (moon.x < width * 0.3) {
                    // Purple moon
                    lightColor = '#b089c8';
                    darkColor = '#8a5aa8';
                } else if (moon.x > width * 0.6) {
                    // Blue-green moon with ring
                    lightColor = '#6a9aaa';
                    darkColor = '#4a7a8a';
                    this.drawMoonWithRing(ctx, moon.x, moon.y, moon.radius, lightColor, darkColor, moon.craters);
                    continue;
                } else {
                    // Pink-white moon
                    lightColor = '#d8b8d8';
                    darkColor = '#b88ab8';
                }
                
                this.drawMoon(ctx, moon.x, moon.y, moon.radius, lightColor, darkColor, moon.craters);
            }
        }
    }

    drawMoon(ctx, x, y, radius, lightColor, darkColor, cachedCraters = null) {
        // Shadow/dark side
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Light side with gradient
        const moonGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
        moonGradient.addColorStop(0, lightColor);
        moonGradient.addColorStop(0.7, darkColor);
        moonGradient.addColorStop(1, darkColor);
        ctx.fillStyle = moonGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Crater details using cached craters
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        if (cachedCraters) {
            for (const crater of cachedCraters) {
                ctx.beginPath();
                ctx.arc(x + crater.x, y + crater.y, crater.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Glow around moon
        ctx.strokeStyle = `rgba(${lightColor === '#b089c8' ? '176, 137, 200' : lightColor === '#d8b8d8' ? '216, 184, 216' : '106, 154, 170'}, 0.3)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawMoonWithRing(ctx, x, y, radius, lightColor, darkColor, cachedCraters = null) {
        // Draw Saturn-like rings BEHIND moon first (back portion only)
        ctx.save();
        ctx.globalAlpha = 0.4;
        
        // Ring ellipse (back portion - bottom half)
        ctx.strokeStyle = 'rgba(180, 160, 130, 0.4)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.ellipse(x, y + radius * 0.15, radius * 2.2, radius * 0.7, -0.3, Math.PI, 0);
        ctx.stroke();
        
        // Inner ring shadow
        ctx.strokeStyle = 'rgba(90, 70, 40, 0.3)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(x, y + radius * 0.15, radius * 1.95, radius * 0.6, -0.3, Math.PI, 0);
        ctx.stroke();
        
        ctx.restore();
        
        // Now draw the moon itself
        // Shadow/dark side
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Light side with gradient
        const moonGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
        moonGradient.addColorStop(0, lightColor);
        moonGradient.addColorStop(0.7, darkColor);
        moonGradient.addColorStop(1, darkColor);
        ctx.fillStyle = moonGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Crater details using cached craters
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        if (cachedCraters) {
            for (const crater of cachedCraters) {
                ctx.beginPath();
                ctx.arc(x + crater.x, y + crater.y, crater.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Glow around moon
        ctx.strokeStyle = `rgba(106, 154, 170, 0.3)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw rings in front of moon (top portion visible over moon)
        ctx.save();
        ctx.globalAlpha = 0.7;
        
        // Ring ellipse (front portion - top half)
        ctx.strokeStyle = 'rgba(210, 190, 160, 0.65)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.ellipse(x, y + radius * 0.15, radius * 2.2, radius * 0.7, -0.3, 0, Math.PI);
        ctx.stroke();
        
        ctx.restore();
    }

    renderTerrain(ctx) {
        const canvas = this.stateManager.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Ground plane - transition from terrain to path
        ctx.fillStyle = '#8a9a7a';
        ctx.fillRect(0, height * 0.70, width, height * 0.30);
        
        // Alien horizon structures before path
        this.renderHorizonStructures(ctx, width, height);
        
        // Frog Realm path - alien terrain with bioluminescence
        this.renderFrogPath(ctx);
        
        // Foreground: Render vegetation (sorted by Y for depth)
        if (this.terrainDetails && this.terrainDetails.vegetation) {
            const sortedVeg = [...this.terrainDetails.vegetation].sort((a, b) => a.y - b.y);
            for (const veg of sortedVeg) {
                this.renderVegetationOnMap(ctx, veg);
            }
        }
    }
    
    renderHorizonStructures(ctx, width, height) {
        // Add alien structures at the horizon for visual interest
        const horizonY = height * 0.62;
        
        // Draw wavy, crater-filled horizon first
        this.renderCraterHorizon(ctx, width, height, horizonY);
        
        // Clustered alien city structures - bunched together in center area
        // Creates impression of a distant alien metropolis
        const structures = [
            { x: width * 0.35, height: 85, width: 19, color: '#5a6a8a', spikes: true },
            { x: width * 0.40, height: 70, width: 17, color: '#4a5a7a', spikes: false },
            { x: width * 0.43, height: 110, width: 22, color: '#6a7a9a', spikes: true },
            { x: width * 0.48, height: 65, width: 18, color: '#5a6a8a', spikes: false },
            { x: width * 0.52, height: 95, width: 20, color: '#4a5a7a', spikes: true },
            { x: width * 0.57, height: 75, width: 19, color: '#6a7a9a', spikes: false },
            { x: width * 0.60, height: 105, width: 23, color: '#5a6a8a', spikes: true },
            { x: width * 0.65, height: 80, width: 18, color: '#4a5a7a', spikes: false }
        ];
        
        for (const struct of structures) {
            this.drawAlienStructure(ctx, struct, horizonY);
        }
        
        // Atmospheric haze at horizon
        const horizonGradient = ctx.createLinearGradient(0, horizonY - 120, 0, horizonY);
        horizonGradient.addColorStop(0, 'rgba(100, 80, 120, 0)');
        horizonGradient.addColorStop(1, 'rgba(80, 60, 100, 0.2)');
        ctx.fillStyle = horizonGradient;
        ctx.fillRect(0, horizonY - 120, width, 120);
    }
    
    drawAlienStructure(ctx, struct, horizonY) {
        // Main structure body with taper
        ctx.fillStyle = struct.color;
        ctx.beginPath();
        ctx.moveTo(struct.x - struct.width/2, horizonY);
        ctx.lineTo(struct.x + struct.width/2, horizonY);
        ctx.lineTo(struct.x + struct.width/3, horizonY - struct.height);
        ctx.lineTo(struct.x - struct.width/3, horizonY - struct.height);
        ctx.closePath();
        ctx.fill();
        
        // Structure edge highlight
        ctx.fillStyle = 'rgba(200, 220, 240, 0.25)';
        ctx.beginPath();
        ctx.moveTo(struct.x - struct.width/3, horizonY - struct.height);
        ctx.lineTo(struct.x + struct.width/3, horizonY - struct.height);
        ctx.lineTo(struct.x + struct.width/2 - 2, horizonY - 10);
        ctx.lineTo(struct.x - struct.width/2 + 2, horizonY - 10);
        ctx.closePath();
        ctx.fill();
        
        if (struct.spikes) {
            // Alien spikes/protrusions on sides
            const spikeCount = Math.max(2, Math.floor(struct.height / 25));
            ctx.fillStyle = 'rgba(100, 150, 200, 0.6)';
            for (let i = 0; i < spikeCount; i++) {
                const progress = i / (spikeCount - 1);
                const y = horizonY - struct.height * progress;
                
                // Left spike
                ctx.beginPath();
                ctx.moveTo(struct.x - struct.width/2 - 2, y);
                ctx.lineTo(struct.x - struct.width/2 - 12, y - 6);
                ctx.lineTo(struct.x - struct.width/2 - 8, y);
                ctx.fill();
                
                // Right spike
                ctx.beginPath();
                ctx.moveTo(struct.x + struct.width/2 + 2, y);
                ctx.lineTo(struct.x + struct.width/2 + 12, y - 6);
                ctx.lineTo(struct.x + struct.width/2 + 8, y);
                ctx.fill();
            }
        }
    }
    
    renderCraterHorizon(ctx, width, height, horizonY) {
        // Draw wavy horizon line without craters
        ctx.fillStyle = '#8a9a7a';
        
        // Main horizon shape with waves
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        
        for (let x = 0; x <= width; x += 20) {
            const waveOffset = Math.sin(x * 0.003) * 15 + Math.cos(x * 0.005 + 1) * 10;
            const y = horizonY + waveOffset;
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.quadraticCurveTo(x - 10, y - 3, x, y);
            }
        }
        
        ctx.lineTo(width, height * 0.75);
        ctx.lineTo(0, height * 0.75);
        ctx.closePath();
        ctx.fill();
    }
    
    renderStars(ctx, width, height) {
        // Generate stars once and cache them
        if (!this.terrainDetails.stars || this.terrainDetails.stars.length === 0) {
            this.terrainDetails.stars = [];
            for (let i = 0; i < 80; i++) {
                this.terrainDetails.stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height * 0.5,
                    size: Math.random() * 1.5,
                    twinklePhase: Math.random() * Math.PI * 2,
                    twinkleSpeed: 1 + Math.random() * 2
                });
            }
        }
        
        // Draw twinkling stars
        for (const star of this.terrainDetails.stars) {
            const twinkle = Math.abs(Math.sin(this.animationTime * star.twinkleSpeed + star.twinklePhase)) * 0.8 + 0.2;
            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderShootingStars(ctx, width, height) {
        const dt = this.lastDeltaTime || 0.016;

        // Generate shooting stars if not initialized
        if (!this.terrainDetails.shootingStars || this.terrainDetails.shootingStars.length === 0) {
            this.terrainDetails.shootingStars = [];
            const angles = [-Math.PI / 12, -Math.PI / 8, -Math.PI / 6, -Math.PI / 7, Math.PI / 12, Math.PI / 8];
            this.terrainDetails.shootingStars.push({
                startX: Math.random() * width,
                startY: Math.random() * height * 0.35,
                speed: 80 + Math.random() * 60,
                angle: angles[Math.floor(Math.random() * angles.length)],
                duration: 2 + Math.random() * 2,
                delay: 15 + Math.random() * 35,
                active: false,
                time: 0
            });
        }

        // Update and draw shooting stars
        for (const star of this.terrainDetails.shootingStars) {
            star.time += dt;

            if (star.time > star.delay && star.time < star.delay + star.duration) {
                star.active = true;
                const elapsed = star.time - star.delay;
                const progress = elapsed / star.duration;

                const x = star.startX + Math.cos(star.angle) * star.speed * elapsed;
                const y = star.startY + Math.sin(star.angle) * star.speed * elapsed;

                // Fade in at start, fade out at end
                let opacity = 1;
                if (progress < 0.15) {
                    opacity = progress / 0.15;
                } else if (progress > 0.7) {
                    opacity = (1 - progress) / 0.3;
                }

                // Trail
                const trailLength = 80;
                const gradient = ctx.createLinearGradient(
                    x, y,
                    x - Math.cos(star.angle) * trailLength,
                    y - Math.sin(star.angle) * trailLength
                );
                gradient.addColorStop(0, `rgba(255, 255, 200, ${opacity * 0.8})`);
                gradient.addColorStop(1, `rgba(255, 255, 150, 0)`);

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(
                    x - Math.cos(star.angle) * trailLength,
                    y - Math.sin(star.angle) * trailLength
                );
                ctx.stroke();

                ctx.fillStyle = `rgba(255, 255, 200, ${opacity})`;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Reset with new random properties once the streak has finished
            if (star.time > star.delay + star.duration) {
                const angles = [-Math.PI / 12, -Math.PI / 8, -Math.PI / 6, -Math.PI / 7, Math.PI / 12, Math.PI / 8];
                star.startX    = Math.random() * width;
                star.startY    = Math.random() * height * 0.35;
                star.speed     = 80 + Math.random() * 60;
                star.angle     = angles[Math.floor(Math.random() * angles.length)];
                star.duration  = 2 + Math.random() * 2;
                star.delay     = 18 + Math.random() * 40;
                star.active    = false;
                star.time      = 0;
            }
        }
    }
    
    renderVegetationOnMap(ctx, veg) {
        // Use LevelBase rendering methods for consistency with game levels
        // Use Space vegetation types (6 variants)
        const types = [
            'renderSpaceVortexPlant',
            'renderSpaceSpikeCoral',
            'renderSpaceFractalGrowth',
            'renderSpaceBiolumPlant',
            'renderSpaceAlienMushroom',
            'renderSpaceCrystalOrganism'
        ];
        const method = types[veg.type % types.length];
        
        if (this.levelBase && typeof this.levelBase[method] === 'function') {
            this.levelBase[method](ctx, veg.x, veg.y, veg.size);
        }
    }
    
    renderRockOnMap(ctx, rock) {
        // Draw alien rocks with otherworldly colors
        ctx.fillStyle = '#6a7a5a';
        ctx.beginPath();
        ctx.ellipse(rock.x, rock.y, rock.size * 0.6, rock.size * 0.4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Rock shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(rock.x + 2, rock.y + 1, rock.size * 0.5, rock.size * 0.2, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Rock highlight with alien tint
        ctx.fillStyle = 'rgba(200, 255, 180, 0.15)';
        ctx.beginPath();
        ctx.ellipse(rock.x - rock.size * 0.2, rock.y - rock.size * 0.15, rock.size * 0.2, rock.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderFrogPath(ctx) {
        if (!this.pathPoints || this.pathPoints.length < 2) return;
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Alien path with bioluminescent tint
        ctx.strokeStyle = '#9aaa8a';
        ctx.lineWidth = 54;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        // Bioluminescent center highlight
        ctx.strokeStyle = '#c0e0b0';
        ctx.lineWidth = 20;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
    
    renderLevelSlot(ctx, index) {
        if (!this.levelSlots || index >= this.levelSlots.length) return;

        const slot = this.levelSlots[index];
        if (!slot || !slot.level) return;

        const level    = slot.level;
        const isHovered = index === this.hoveredLevel;
        const isLocked  = !level.unlocked;
        const isBoss    = index === this.levelSlots.length - 1;

        if (isBoss) {
            if (isLocked) {
                ctx.save();
                ctx.globalAlpha = 0.65;
                this.drawBossCastle(ctx, slot.x, slot.y, false);
                ctx.restore();
                // Lock icon over boss castle
                ctx.save();
                ctx.translate(slot.x, slot.y);
                ctx.fillStyle = 'rgba(80, 0, 100, 0.7)';
                ctx.beginPath();
                ctx.arc(0, 0, 28, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#cc88ff';
                ctx.beginPath();
                ctx.arc(0, -5, 8, Math.PI, 0, false);
                ctx.strokeStyle = '#dd99ff';
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.fillStyle = '#8844aa';
                ctx.fillRect(-10, -6, 20, 16);
                ctx.fillStyle = '#cc88ff';
                ctx.beginPath();
                ctx.arc(0, 1, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-2, 2, 4, 6);
                ctx.restore();
            } else {
                this.drawBossCastle(ctx, slot.x, slot.y, isHovered);
            }
        } else if (isLocked) {
            this.drawLockedCastleTopDown(ctx, slot.x, slot.y, isHovered);
        } else {
            this.drawCastleFromInstance(ctx, slot.x, slot.y, index, isHovered);
        }
    }

    renderLevelLabel(ctx, index) {
        if (!this.levelSlots || index >= this.levelSlots.length) return;
        const slot = this.levelSlots[index];
        if (!slot || !slot.level) return;

        const isBoss = index === this.levelSlots.length - 1;

        if (isBoss) {
            this._renderBossLabel(ctx, slot);
            return;
        }

        // Regular space-themed label (delegated to base with this.labelStyle)
        super.renderLevelLabel(ctx, index);
    }

    _renderBossLabel(ctx, slot) {
        const displayName = slot.level.name || 'The Frog King\'s Realm';
        const x = slot.x;
        const y = slot.y - 195;  // above the boss castle spire (~178px at scale 0.68)
        const t = this.animationTime;

        ctx.save();
        ctx.font = 'bold 14px serif';
        const textW   = ctx.measureText(displayName).width;
        const bannerW = Math.max(textW + 44, 130);
        const bannerH = 30;
        const notch   = 11;

        const ribbonPath = () => {
            ctx.beginPath();
            ctx.moveTo(x - bannerW / 2,         y - bannerH / 2);
            ctx.lineTo(x + bannerW / 2,         y - bannerH / 2);
            ctx.lineTo(x + bannerW / 2,         y - notch);
            ctx.lineTo(x + bannerW / 2 - notch, y);
            ctx.lineTo(x + bannerW / 2,         y + notch);
            ctx.lineTo(x + bannerW / 2,         y + bannerH / 2);
            ctx.lineTo(x - bannerW / 2,         y + bannerH / 2);
            ctx.lineTo(x - bannerW / 2,         y + notch);
            ctx.lineTo(x - bannerW / 2 + notch, y);
            ctx.lineTo(x - bannerW / 2,         y - notch);
            ctx.closePath();
        };

        // Pulsing crimson outer glow
        const pulse = Math.abs(Math.sin(t * 1.8)) * 0.55 + 0.25;
        ctx.shadowColor   = `rgba(180, 0, 60, ${pulse})`;
        ctx.shadowBlur    = 18;
        ctx.shadowOffsetY = 0;

        const grad = ctx.createLinearGradient(x, y - bannerH / 2, x, y + bannerH / 2);
        grad.addColorStop(0,   'rgba(14, 4, 22, 0.97)');
        grad.addColorStop(0.5, 'rgba(28, 6, 40, 0.99)');
        grad.addColorStop(1,   'rgba(14, 4, 22, 0.97)');
        ctx.fillStyle = grad;
        ribbonPath();
        ctx.fill();

        ctx.shadowBlur = 0;

        // Animated blood-red border
        const borderPulse = Math.abs(Math.sin(t * 2.2)) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(200, 20, 50, ${borderPulse})`;
        ctx.lineWidth   = 2;
        ribbonPath();
        ctx.stroke();

        // Inner glow line
        ctx.strokeStyle = `rgba(255, 80, 100, ${borderPulse * 0.4})`;
        ctx.lineWidth   = 0.8;
        ribbonPath();
        ctx.stroke();

        // Small rune marks at banner ends
        const runeAlpha = Math.abs(Math.sin(t * 1.5)) * 0.5 + 0.5;
        ctx.fillStyle   = `rgba(220, 60, 80, ${runeAlpha})`;
        for (const rx of [x - bannerW / 2 + notch + 10, x + bannerW / 2 - notch - 10]) {
            ctx.beginPath();
            ctx.moveTo(rx, y - 7);
            ctx.lineTo(rx + 5, y);
            ctx.lineTo(rx, y + 7);
            ctx.lineTo(rx - 5, y);
            ctx.closePath();
            ctx.fill();
        }

        // Text — white with crimson shadow
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = `rgba(220, 30, 60, 0.7)`;
        ctx.fillText(displayName, x + 1, y + 1);
        ctx.fillStyle    = '#ffe8e8';
        ctx.fillText(displayName, x, y);

        ctx.restore();
    }

    drawBossCastle(ctx, centerX, centerY, isHovered) {
        const scale = 0.68;
        const t = this.animationTime;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);

        // Layout constants
        const BY = 78; // base / ground y
        const OTW = 56, OTH = 238, OTSH = 88; // outer tower: width, height, spire height
        const ITW = 44, ITH = 198, ITSH = 68; // inner tower
        const OTX = 188, ITX = 112;            // tower center x offsets
        const KW = 178, KH = 218;              // keep width, height
        const KT = BY - KH;                    // keep top y
        const CR_H = 24;                       // crenellation height
        const CR_T = KT - CR_H;               // crenellation top y
        const SP_H = 164;                      // spire height measured from keep-wall top (KT)
        const SP_TOP = KT - SP_H;             // spire tip y (same absolute height as CR_T-140)

        // ── Dark aura beneath the fortress ──────────────────────────────────
        const auraPulse = Math.sin(t * 1.4) * 18;
        const aura = ctx.createRadialGradient(0, 0, 40, 0, 0, 320 + auraPulse);
        aura.addColorStop(0,    'rgba(80, 0, 120, 0.30)');
        aura.addColorStop(0.45, 'rgba(40, 0, 70,  0.15)');
        aura.addColorStop(1,    'rgba(10, 0, 25,  0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, 320 + auraPulse, 0, Math.PI * 2);
        ctx.fill();

        if (isHovered) {
            const hg = ctx.createRadialGradient(0, 0, 60, 0, 0, 280);
            hg.addColorStop(0, 'rgba(220, 0, 80, 0.28)');
            hg.addColorStop(1, 'rgba(100, 0, 30, 0)');
            ctx.fillStyle = hg;
            ctx.beginPath();
            ctx.arc(0, 0, 280, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.beginPath();
        ctx.ellipse(0, BY + 28, 230, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── Outer flanking towers ───────────────────────────────────────────
        for (const sx of [-OTX, OTX]) {
            this._drawDarkTower(ctx, sx, OTW, OTH, OTSH, t);
        }

        // ── Connecting curtain walls  (outer tower → inner tower) ───────────
        // Left: outer right edge (-OTX + OTW/2) → inner left edge (-ITX - ITW/2)
        // Right: mirror
        const outerRE = OTX - OTW / 2;  // 188-28=160
        const innerLE = ITX + ITW / 2;  // 112+22=134
        const cwW = outerRE - innerLE;   // 26
        const cwH = 148;
        for (const sx of [-1, 1]) {
            const cwX = sx < 0 ? -(outerRE) : innerLE;
            const cg = ctx.createLinearGradient(0, BY - cwH, 0, BY);
            cg.addColorStop(0, '#38224a');
            cg.addColorStop(1, '#261636');
            ctx.fillStyle = cg;
            ctx.fillRect(cwX, BY - cwH, cwW, cwH);
            // Outline
            ctx.strokeStyle = '#5c1480';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cwX, BY - cwH, cwW, cwH);
            // Brick rows on curtain wall
            ctx.save();
            ctx.beginPath();
            ctx.rect(cwX, BY - cwH, cwW, cwH);
            ctx.clip();
            ctx.strokeStyle = 'rgba(12, 4, 20, 0.8)';
            ctx.lineWidth = 1;
            const cwBH = 19;
            for (let row = 0; row <= Math.ceil(cwH / cwBH); row++) {
                const ry = BY - cwH + row * cwBH;
                ctx.beginPath();
                ctx.moveTo(cwX, ry); ctx.lineTo(cwX + cwW, ry);
                ctx.stroke();
                // single vertical every other row
                if (row % 2 === 0) {
                    ctx.beginPath();
                    ctx.moveTo(cwX + cwW / 2, ry); ctx.lineTo(cwX + cwW / 2, ry + cwBH);
                    ctx.stroke();
                }
            }
            ctx.restore();
            // Crenellations on top of curtain wall
            const ccW = cwW / 2;
            for (let c = 0; c < 2; c++) {
                if (c % 2 === 0) {
                    ctx.fillStyle = '#38224a';
                    ctx.fillRect(cwX + c * ccW, BY - cwH - 18, ccW, 18);
                    ctx.strokeStyle = '#5c1480';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(cwX + c * ccW, BY - cwH - 18, ccW, 18);
                }
            }
        }

        // ── Inner flanking towers ───────────────────────────────────────────
        for (const sx of [-ITX, ITX]) {
            this._drawDarkTower(ctx, sx, ITW, ITH, ITSH, t);
        }

        // ── Base platform ───────────────────────────────────────────────────
        const baseH = 50;
        const baseGrad = ctx.createLinearGradient(0, BY, 0, BY + baseH);
        baseGrad.addColorStop(0,   '#3e2a54');
        baseGrad.addColorStop(0.5, '#2e1c3e');
        baseGrad.addColorStop(1,   '#1c0e28');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(-215, BY, 430, baseH);
        ctx.strokeStyle = '#6c1898';
        ctx.lineWidth = 2;
        ctx.strokeRect(-215, BY, 430, baseH);
        // Base brick courses
        ctx.save();
        ctx.beginPath(); ctx.rect(-215, BY, 430, baseH); ctx.clip();
        const bpBW = 54, bpBH = 25;
        ctx.strokeStyle = 'rgba(10, 3, 18, 0.85)';
        ctx.lineWidth = 1;
        for (let row = 0; row < 2; row++) {
            const off = (row % 2) * (bpBW / 2);
            const ry = BY + row * bpBH;
            ctx.beginPath(); ctx.moveTo(-215, ry); ctx.lineTo(215, ry); ctx.stroke();
            for (let bx = -215 + off; bx < 215; bx += bpBW) {
                ctx.beginPath(); ctx.moveTo(bx, ry); ctx.lineTo(bx, ry + bpBH); ctx.stroke();
            }
        }
        ctx.restore();
        // Top highlight strip
        ctx.fillStyle = 'rgba(110, 50, 170, 0.18)';
        ctx.fillRect(-215, BY, 430, 4);

        // ── Central keep ────────────────────────────────────────────────────
        const kGrad = ctx.createLinearGradient(-KW / 2, 0, KW / 2, 0);
        kGrad.addColorStop(0,   '#301a42');
        kGrad.addColorStop(0.25,'#3e2456');
        kGrad.addColorStop(0.5, '#4a2a66');
        kGrad.addColorStop(0.75,'#3e2456');
        kGrad.addColorStop(1,   '#301a42');
        ctx.fillStyle = kGrad;
        ctx.fillRect(-KW / 2, KT, KW, KH);
        ctx.strokeStyle = '#701ab0';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-KW / 2, KT, KW, KH);
        // Keep brick mortar lines — clipped
        ctx.save();
        ctx.beginPath(); ctx.rect(-KW / 2, KT, KW, KH); ctx.clip();
        const kBH = 19, kBW = 40;
        ctx.strokeStyle = 'rgba(12, 3, 22, 0.80)';
        ctx.lineWidth = 1;
        for (let row = 0; row <= Math.ceil(KH / kBH) + 1; row++) {
            const off = (row % 2) * (kBW / 2);
            const ry = KT + row * kBH;
            ctx.beginPath(); ctx.moveTo(-KW / 2, ry); ctx.lineTo(KW / 2, ry); ctx.stroke();
            for (let bx = -KW / 2 + off; bx <= KW / 2; bx += kBW) {
                ctx.beginPath(); ctx.moveTo(bx, ry); ctx.lineTo(bx, ry + kBH); ctx.stroke();
            }
        }
        ctx.restore();
        // Edge shadow strips for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(-KW / 2, KT, 6, KH);
        ctx.fillRect(KW / 2 - 6, KT, 6, KH);
        // Edge highlight
        ctx.fillStyle = 'rgba(130, 60, 200, 0.18)';
        ctx.fillRect(-KW / 2, KT, 3, KH);

        // ── Central spire — drawn BEFORE battlements so merlons sit in front ────
        // Base anchored at KT (keep-wall top) so the spire grows out of the wall
        ctx.fillStyle = '#1c0c2a';
        ctx.beginPath();
        ctx.moveTo(-KW * 0.28, KT);
        ctx.lineTo( KW * 0.28, KT);
        ctx.lineTo(0, SP_TOP);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#8c18d0';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Ridge lines (horizontal striations up the spire faces)
        ctx.strokeStyle = 'rgba(110, 30, 160, 0.45)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 6; i++) {
            const prog = i / 7;
            const sy  = KT - SP_H * prog;
            const sx2 = KW * 0.28 * (1 - prog);
            ctx.beginPath();
            ctx.moveTo(-sx2, sy); ctx.lineTo(sx2, sy);
            ctx.stroke();
        }
        // Left-face shadow for dimensionality
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.beginPath();
        ctx.moveTo(-KW * 0.28, KT);
        ctx.lineTo(0, KT);
        ctx.lineTo(0, SP_TOP);
        ctx.closePath();
        ctx.fill();

        // ── Keep battlements — 9 cells: M G M G M G M G M ───────────────────
        // 5 merlons / 4 gaps, centre cell (c=4) is a merlon perfectly at x=0
        const kCrW = KW / 9;
        for (let c = 0; c < 9; c++) {
            const cx = -KW / 2 + c * kCrW;
            if (c % 2 === 0) {   // even index = solid merlon
                const cg = ctx.createLinearGradient(cx, CR_T, cx + kCrW, CR_T);
                cg.addColorStop(0,   '#3e2456');
                cg.addColorStop(0.5, '#4c2e68');
                cg.addColorStop(1,   '#3e2456');
                ctx.fillStyle = cg;
                ctx.fillRect(cx, CR_T, kCrW, CR_H);
                ctx.strokeStyle = '#701ab0';
                ctx.lineWidth = 1;
                ctx.strokeRect(cx, CR_T, kCrW, CR_H);
                // Right-face shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
                ctx.fillRect(cx + kCrW * 0.55, CR_T, kCrW * 0.45, CR_H);
            }
        }

        // Gem at spire tip
        const gemAlpha = Math.abs(Math.sin(t * 2.2)) * 0.75 + 0.25;
        const gGlow = ctx.createRadialGradient(0, SP_TOP, 0, 0, SP_TOP, 26);
        gGlow.addColorStop(0, `rgba(255, 110, 255, ${gemAlpha})`);
        gGlow.addColorStop(0.5, `rgba(180, 30, 220, ${gemAlpha * 0.55})`);
        gGlow.addColorStop(1, 'rgba(100, 0, 180, 0)');
        ctx.fillStyle = gGlow;
        ctx.beginPath();
        ctx.arc(0, SP_TOP, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(210, 70, 255, ${gemAlpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(0, SP_TOP, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff8ff';
        ctx.beginPath();
        ctx.arc(0, SP_TOP, 4, 0, Math.PI * 2);
        ctx.fill();

        // ── Glowing windows ──────────────────────────────────────────────────
        const wins = [
            { x: -52, y: KT + 42, w: 18, h: 32 },
            { x:  52, y: KT + 42, w: 18, h: 32 },
            { x: -38, y: KT + 98, w: 16, h: 26 },
            { x:  38, y: KT + 98, w: 16, h: 26 },
        ];
        for (const w of wins) {
            const wp = Math.abs(Math.sin(t * 1.9 + w.x * 0.01)) * 0.55 + 0.45;
            // Outer glow bloom
            const wg = ctx.createRadialGradient(w.x, w.y + w.h / 2, 0, w.x, w.y + w.h / 2, w.w * 2.8);
            wg.addColorStop(0,   `rgba(255, 40, 80,  ${wp * 0.75})`);
            wg.addColorStop(0.5, `rgba(150, 10, 170, ${wp * 0.45})`);
            wg.addColorStop(1,   'rgba(80, 0, 120, 0)');
            ctx.fillStyle = wg;
            ctx.beginPath();
            ctx.arc(w.x, w.y + w.h / 2, w.w * 2.8, 0, Math.PI * 2);
            ctx.fill();
            // Stone frame recess
            ctx.fillStyle = '#10061a';
            ctx.fillRect(w.x - w.w / 2 - 3, w.y - 3, w.w + 6, w.h + 3);
            ctx.beginPath();
            ctx.arc(w.x, w.y + 9, w.w / 2 + 3, Math.PI, 0);
            ctx.fill();
            // Glass
            ctx.fillStyle = `rgba(220, 40, 70, ${wp})`;
            ctx.fillRect(w.x - w.w / 2, w.y, w.w, w.h);
            ctx.beginPath();
            ctx.arc(w.x, w.y + 9, w.w / 2, Math.PI, 0);
            ctx.fill();
            // Lead dividers
            ctx.strokeStyle = `rgba(255, 190, 210, ${wp * 0.45})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(w.x, w.y + 6); ctx.lineTo(w.x, w.y + w.h);
            ctx.stroke();
        }

        // ── Arch gate ────────────────────────────────────────────────────────
        const gH = 62, gW = 64;
        const gTop = BY - gH; // gate opening top
        // Arch surround (stone frame)
        ctx.fillStyle = '#200c34';
        ctx.fillRect(-gW / 2 - 8, gTop - 18, gW + 16, gH + 18);
        ctx.beginPath();
        ctx.arc(0, gTop, gW / 2 + 8, Math.PI, 0);
        ctx.fill();
        // Gate void
        ctx.fillStyle = '#070310';
        ctx.fillRect(-gW / 2, gTop, gW, gH);
        ctx.beginPath();
        ctx.arc(0, gTop, gW / 2, Math.PI, 0);
        ctx.fill();
        // Arch border
        ctx.strokeStyle = '#8020c0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, gTop, gW / 2, Math.PI, 0);
        ctx.moveTo(-gW / 2, gTop); ctx.lineTo(-gW / 2, BY);
        ctx.moveTo( gW / 2, gTop); ctx.lineTo( gW / 2, BY);
        ctx.stroke();
        // Keystone
        ctx.fillStyle = '#4a1070';
        ctx.beginPath();
        ctx.moveTo(-8, gTop - gW / 2 + 4);
        ctx.lineTo( 8, gTop - gW / 2 + 4);
        ctx.lineTo( 6, gTop - gW / 2 + 18);
        ctx.lineTo(-6, gTop - gW / 2 + 18);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#9030d8';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Portcullis bars
        ctx.strokeStyle = 'rgba(70, 10, 100, 0.75)';
        ctx.lineWidth = 3;
        for (let bar = -1; bar <= 1; bar++) {
            ctx.beginPath();
            ctx.moveTo(bar * 18, gTop); ctx.lineTo(bar * 18, BY);
            ctx.stroke();
        }
        ctx.lineWidth = 2;
        for (let row = 1; row <= 3; row++) {
            ctx.beginPath();
            ctx.moveTo(-gW / 2, gTop + row * (gH / 4));
            ctx.lineTo( gW / 2, gTop + row * (gH / 4));
            ctx.stroke();
        }

        // Evil eye above gate
        const eyeY = gTop - 22;
        const eyeP = Math.abs(Math.sin(t * 2.8)) * 0.65 + 0.35;
        ctx.fillStyle = `rgba(190, 0, 55, ${eyeP})`;
        ctx.beginPath();
        ctx.ellipse(0, eyeY, 24, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#030106';
        ctx.beginPath();
        ctx.arc(0, eyeY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 25, 80, ${eyeP})`;
        ctx.beginPath();
        ctx.arc(0, eyeY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 80, 120, ${eyeP * 0.55})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, eyeY, 24, 13, 0, 0, Math.PI * 2);
        ctx.stroke();

        // ── Lightning arcs ────────────────────────────────────────────────────
        const lightAlpha = 0.45 + Math.sin(t * 9) * 0.45;
        ctx.strokeStyle = `rgba(215, 145, 255, ${lightAlpha})`;
        ctx.lineWidth = 1.8;
        const ltPairs = [
            { sx: -OTX, sy: BY - OTH - OTSH, ex: 0, ey: SP_TOP },
            { sx:  OTX, sy: BY - OTH - OTSH, ex: 0, ey: SP_TOP },
            { sx: -ITX, sy: BY - ITH - ITSH, ex: 0, ey: SP_TOP },
            { sx:  ITX, sy: BY - ITH - ITSH, ex: 0, ey: SP_TOP },
        ];
        for (const lp of ltPairs) {
            ctx.beginPath();
            ctx.moveTo(lp.sx, lp.sy);
            const mx = (lp.sx + lp.ex) / 2 + Math.sin(t * 11 + lp.sx * 0.02) * 30;
            const my = (lp.sy + lp.ey) / 2 + Math.cos(t *  9 + lp.sx * 0.02) * 30;
            ctx.quadraticCurveTo(mx, my, lp.ex, lp.ey);
            ctx.stroke();
        }

        // ── Orbiting particles ────────────────────────────────────────────────
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + t * 0.55;
            const r  = 148 + Math.sin(t * 2 + i * 0.8) * 20;
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r - 50;
            const pa = Math.max(0.1, Math.sin(t * 1.6 + i * 0.75) * 0.3 + 0.5);
            ctx.fillStyle = `rgba(130, 35, 195, ${pa})`;
            const ps = 9 + Math.sin(t * 2.2 + i) * 3;
            ctx.beginPath();
            ctx.arc(px, py, ps, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── Wall runes ────────────────────────────────────────────────────────
        const runeAlpha = Math.abs(Math.sin(t * 1.3)) * 0.6 + 0.4;
        ctx.strokeStyle = `rgba(205, 100, 255, ${runeAlpha})`;
        ctx.lineWidth = 2;
        for (const rx of [-60, 0, 60]) {
            const ry = KT + 168;
            ctx.beginPath();
            ctx.moveTo(rx,     ry - 12); ctx.lineTo(rx + 8,  ry);
            ctx.lineTo(rx,     ry + 12); ctx.lineTo(rx - 8,  ry);
            ctx.closePath();
            ctx.moveTo(rx - 8, ry); ctx.lineTo(rx + 8, ry);
            ctx.moveTo(rx,    ry - 12); ctx.lineTo(rx, ry + 12);
            ctx.stroke();
        }

        ctx.restore();
    }

    _drawDarkTower(ctx, towerX, tw, th, sh, t) {
        const BY = 78;

        // Tower body
        const g = ctx.createLinearGradient(towerX - tw / 2, 0, towerX + tw / 2, 0);
        g.addColorStop(0,   '#301840');
        g.addColorStop(0.35,'#3c2252');
        g.addColorStop(0.65,'#3c2252');
        g.addColorStop(1,   '#1e0e28');
        ctx.fillStyle = g;
        ctx.fillRect(towerX - tw / 2, BY - th, tw, th);
        ctx.strokeStyle = '#5c1480';
        ctx.lineWidth = 2;
        ctx.strokeRect(towerX - tw / 2, BY - th, tw, th);

        // Brick mortar lines — clipped to tower rect
        ctx.save();
        ctx.beginPath();
        ctx.rect(towerX - tw / 2, BY - th, tw, th);
        ctx.clip();
        const tbH = 18;
        const halfW = tw / 2;
        ctx.strokeStyle = 'rgba(12, 3, 20, 0.80)';
        ctx.lineWidth = 1;
        for (let row = 0; row <= Math.ceil(th / tbH) + 1; row++) {
            const off = (row % 2) * (halfW / 2);
            const ry  = BY - th + row * tbH;
            ctx.beginPath(); ctx.moveTo(towerX - tw / 2, ry); ctx.lineTo(towerX + tw / 2, ry); ctx.stroke();
            for (let bx = towerX - tw / 2 + off; bx < towerX + tw / 2; bx += halfW) {
                ctx.beginPath(); ctx.moveTo(bx, ry); ctx.lineTo(bx, ry + tbH); ctx.stroke();
            }
        }
        ctx.restore();

        // Edge shadow / highlight for depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
        ctx.fillRect(towerX + tw / 2 - 5, BY - th, 5, th);
        ctx.fillStyle = 'rgba(120, 55, 185, 0.14)';
        ctx.fillRect(towerX - tw / 2, BY - th, 3, th);

        // Crenellations — 5 cells: M G M G M (3 merlons, 2 gaps, symmetric)
        const crH2 = 20;
        const crW  = tw / 5;
        for (let c = 0; c < 5; c++) {
            const cx = towerX - tw / 2 + c * crW;
            if (c % 2 === 0) {   // even = merlon
                const cg = ctx.createLinearGradient(cx, BY - th - crH2, cx + crW, BY - th - crH2);
                cg.addColorStop(0,   '#3c2252');
                cg.addColorStop(0.5, '#482a62');
                cg.addColorStop(1,   '#3c2252');
                ctx.fillStyle = cg;
                ctx.fillRect(cx, BY - th - crH2, crW, crH2);
                ctx.strokeStyle = '#5c1480';
                ctx.lineWidth = 1;
                ctx.strokeRect(cx, BY - th - crH2, crW, crH2);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
                ctx.fillRect(cx + crW * 0.55, BY - th - crH2, crW * 0.45, crH2);
            }
        }

        // Spire
        ctx.fillStyle = '#1c0a28';
        ctx.beginPath();
        ctx.moveTo(towerX - tw * 0.32, BY - th);
        ctx.lineTo(towerX + tw * 0.32, BY - th);
        ctx.lineTo(towerX,             BY - th - sh);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#7020b8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Left-face shadow on spire
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.beginPath();
        ctx.moveTo(towerX - tw * 0.32, BY - th);
        ctx.lineTo(towerX,             BY - th);
        ctx.lineTo(towerX,             BY - th - sh);
        ctx.closePath();
        ctx.fill();
        // Centre ridge line
        ctx.strokeStyle = 'rgba(120, 40, 180, 0.40)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(towerX, BY - th); ctx.lineTo(towerX, BY - th - sh);
        ctx.stroke();

        // Spire tip glow
        const gp = Math.abs(Math.sin(t * 1.8 + towerX * 0.005)) * 0.6 + 0.2;
        const tipG = ctx.createRadialGradient(towerX, BY - th - sh, 0, towerX, BY - th - sh, 14);
        tipG.addColorStop(0, `rgba(210, 90, 255, ${gp})`);
        tipG.addColorStop(1, 'rgba(120, 0, 180, 0)');
        ctx.fillStyle = tipG;
        ctx.beginPath();
        ctx.arc(towerX, BY - th - sh, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 210, 255, ${gp * 0.9})`;
        ctx.beginPath();
        ctx.arc(towerX, BY - th - sh, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawPlaceholderSlot(ctx, centerX, centerY, isHovered) {
        const scale = 0.45;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        
        if (isHovered) {
            ctx.fillStyle = 'rgba(200, 220, 200, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, 220, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw a simple construction/placeholder marker
        ctx.strokeStyle = '#a8a888';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.rect(-120, -80, 240, 160);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Placeholder text
        ctx.font = 'bold 20px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#a8a888';
        ctx.globalAlpha = 0.6;
        ctx.fillText('?', 0, -10);
        ctx.globalAlpha = 1;
        
        ctx.restore();
    }
    
    drawCastleFromInstance(ctx, centerX, centerY, slotIndex, isHovered) {
        // Create or retrieve castle instance for this slot
        const slotKey = `slot_${slotIndex}`;
        if (!this.castleInstances[slotKey]) {
            this.castleInstances[slotKey] = new Castle(0, 0, 0, 0);
        }
        const castle = this.castleInstances[slotKey];
        
        // Update animation time on castle
        castle.animationTime = this.animationTime;
        
        const scale = 0.45;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        
        if (isHovered) {
            ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 220, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw using exact Castle.js rendering methods for consistency
        castle.drawMainWall(ctx);
        castle.drawTower(ctx, -castle.wallWidth/2 - castle.towerWidth/2, 'left');
        castle.drawTower(ctx, castle.wallWidth/2 + castle.towerWidth/2, 'right');
        castle.drawCastleBase(ctx);
        castle.drawGate(ctx);
        castle.drawCrenellations(ctx);
        // Removed flags and flagposts for cleaner map appearance
        
        ctx.restore();
    }
    
    drawLockedCastleTopDown(ctx, x, y, isHovered) {
        const scale = 0.45;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        if (isHovered) {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, 220, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw dimmed castle to show it's locked
        ctx.globalAlpha = 0.4;
        
        // Create a dimmed castle instance for visual
        const tempCastle = new Castle(0, 0, 0, 0);
        tempCastle.drawMainWall(ctx);
        tempCastle.drawTower(ctx, -tempCastle.wallWidth/2 - tempCastle.towerWidth/2, 'left');
        tempCastle.drawTower(ctx, tempCastle.wallWidth/2 + tempCastle.towerWidth/2, 'right');
        tempCastle.drawCastleBase(ctx);
        tempCastle.drawGate(ctx);
        tempCastle.drawCrenellations(ctx);
        
        ctx.globalAlpha = 1;
        
        // Lock icon overlay
        ctx.fillStyle = 'rgba(100, 100, 100, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(0, -2, 7, Math.PI, 0, false);
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillRect(-9, -3, 18, 14);
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(0, 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-2, 3, 4, 5);
        
        ctx.restore();
    }

    exit() {
        super.exit();
    }
}
