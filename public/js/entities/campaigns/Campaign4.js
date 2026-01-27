import { CampaignBase } from './CampaignBase.js';
import { LevelRegistry } from '../levels/LevelRegistry.js';
import { Castle } from '../buildings/Castle.js';
import { LevelBase } from '../levels/LevelBase.js';
// Import Space levels for Frog Realm campaign
import { SpaceLevel1 } from '../levels/Space/SpaceLevel1.js';
import { SpaceLevel2 } from '../levels/Space/SpaceLevel2.js';
// Import level classes - they auto-register when imported
// (Frog Realm levels would be imported here when created)

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
        
        // Frog Realm path - spiral/twisting pattern through the landscape
        // Different from desert to create unique visual identity
        this.pathPoints = [
            // Entry from left, starting at upper level
            { x: -20, y: height * 0.70 },
            { x: width * 0.05, y: height * 0.68 },
            { x: width * 0.10, y: height * 0.72 },
            { x: width * 0.15, y: height * 0.75 },
            
            // First spiral down-right
            { x: width * 0.20, y: height * 0.78 },
            { x: width * 0.25, y: height * 0.80 },
            { x: width * 0.30, y: height * 0.82 },
            
            // Bottom left point - lowest point of path
            { x: width * 0.35, y: height * 0.85 },
            { x: width * 0.40, y: height * 0.86 },
            
            // Turn and spiral back up
            { x: width * 0.45, y: height * 0.85 },
            { x: width * 0.50, y: height * 0.82 },
            
            // Rise toward middle
            { x: width * 0.55, y: height * 0.78 },
            { x: width * 0.60, y: height * 0.75 },
            
            // Second spiral down-left
            { x: width * 0.65, y: height * 0.78 },
            { x: width * 0.70, y: height * 0.82 },
            
            // Bottom right point
            { x: width * 0.75, y: height * 0.86 },
            { x: width * 0.80, y: height * 0.85 },
            
            // Final rise toward exit
            { x: width * 0.85, y: height * 0.80 },
            { x: width * 0.90, y: height * 0.75 },
            { x: width * 0.95, y: height * 0.70 },
            
            // Exit right
            { x: width + 20, y: height * 0.70 }
        ];
        
        // Generate 8 level slots positioned evenly along the path
        const totalSlots = 8;
        this.levelSlots = [];
        
        // Spread slots evenly along path with margins from edges
        const pathLength = this.pathPoints.length - 1;
        const slotSpacing = pathLength / (totalSlots + 1); // Even distribution with margins
        
        for (let i = 0; i < totalSlots; i++) {
            const pathIndex = Math.min(Math.floor((i + 1) * slotSpacing), this.pathPoints.length - 1);
            const pathPoint = this.pathPoints[pathIndex];
            
            const pos = { ...pathPoint };
            // Assign level if available, otherwise create a locked level
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
        // Generate shooting stars if not exists
        if (!this.terrainDetails.shootingStars || this.terrainDetails.shootingStars.length === 0) {
            this.terrainDetails.shootingStars = [];
            // Create 1 shooting star with rare appearances
            for (let i = 0; i < 1; i++) {
                // Varied directions including more horizontal paths
                const directions = [
                    { angle: -Math.PI / 12, label: 'gentle-horizontal' },  // 15 degrees (very shallow)
                    { angle: -Math.PI / 8, label: 'slight-diagonal' },     // 22.5 degrees
                    { angle: -Math.PI / 6, label: 'down-right' },          // 30 degrees down-right
                    { angle: -Math.PI / 7, label: 'mild-down' }            // 25.7 degrees
                ];
                const dir = directions[Math.floor(Math.random() * directions.length)];
                
                this.terrainDetails.shootingStars.push({
                    startX: Math.random() * width,
                    startY: Math.random() * height * 0.35,
                    speed: 80 + Math.random() * 60,  // Much slower speed (was 150-250)
                    angle: dir.angle,
                    duration: 3 + Math.random() * 2, // Longer duration for slower appearance
                    delay: 20 + Math.random() * 25,  // Longer delay between appearances
                    active: false,
                    time: 0
                });
            }
        }
        
        // Update and draw shooting stars
        for (const star of this.terrainDetails.shootingStars) {
            star.time += this.animationTime * 0.016; // Approximate dt
            
            if (star.time > star.delay && star.time < star.delay + star.duration) {
                star.active = true;
                const elapsed = star.time - star.delay;
                const progress = elapsed / star.duration;
                
                const x = star.startX + Math.cos(star.angle) * star.speed * elapsed;
                const y = star.startY + Math.sin(star.angle) * star.speed * elapsed;
                
                // Fade out at end
                const opacity = 1 - (progress > 0.7 ? (progress - 0.7) / 0.3 : 0);
                
                // Trail
                const trailLength = 80;  // Slightly longer trail for slower stars
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
                
                // Star
                ctx.fillStyle = `rgba(255, 255, 200, ${opacity})`;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Reset if finished - much longer cooldown before reappearing
            if (star.time > star.delay + star.duration + 5) {
                star.time = 0;
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
        
        const level = slot.level;
        const isHovered = index === this.hoveredLevel;
        const isLocked = !level.unlocked;
        
        // Draw castle for this level
        if (isLocked) {
            this.drawLockedCastleTopDown(ctx, slot.x, slot.y, isHovered);
        } else {
            this.drawCastleFromInstance(ctx, slot.x, slot.y, index, isHovered);
        }
        
        // Draw level name/number below
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d0c8a8';
        const displayName = level.name || `Level ${index + 1}`;
        ctx.fillText(displayName, slot.x, slot.y + 80);
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
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒', 0, 2);
        
        ctx.restore();
    }

    exit() {
        super.exit();
    }
}
