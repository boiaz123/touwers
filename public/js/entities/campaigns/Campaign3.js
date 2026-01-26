import { CampaignBase } from './CampaignBase.js';
import { LevelRegistry } from '../levels/LevelRegistry.js';
import { Castle } from '../buildings/Castle.js';
import { LevelBase } from '../levels/LevelBase.js';
// Import level classes - they auto-register when imported
import { DesertLevel1 } from '../levels/Desert/DesertLevel1.js';
import { DesertLevel2 } from '../levels/Desert/DesertLevel2.js';
import { DesertLevel3 } from '../levels/Desert/DesertLevel3.js';
import { DesertLevel4 } from '../levels/Desert/DesertLevel4.js';
import { DesertLevel5 } from '../levels/Desert/DesertLevel5.js';
import { DesertLevel6 } from '../levels/Desert/DesertLevel6.js';
import { DesertLevel7 } from '../levels/Desert/DesertLevel7.js';
import { DesertLevel8 } from '../levels/Desert/DesertLevel8.js';
import { DesertLevel9 } from '../levels/Desert/DesertLevel9.js';
import { DesertLevel10 } from '../levels/Desert/DesertLevel10.js';

/**
 * Campaign3: The Desert Campaign
 * Arid sandy terrain with natural oasis and desert vegetation
 * Uses LevelBase terrain rendering for cacti, rocks, and vegetation
 */
export class Campaign3 extends CampaignBase {
    constructor(stateManager) {
        super(stateManager);
        
        this.campaignId = 'campaign-3';
        this.campaignName = 'The Desert Campaign';
        this.castleInstances = {};
        
        // Animation time for castle flags
        this.animationTime = 0;
        
        // Terrain cache
        this.terrainDetails = {
            oasis: null
        };
        this.pathPoints = [];
        
        // Tumbleweed animation
        this.tumbleweeds = [];
        this.maxTumbleweeds = 3;
        
        // Register campaign levels once during construction
        this.registerLevels();
    }
    
    registerLevels() {
        /**
         * Register all Desert Campaign levels.
         * Metadata is read from static levelMetadata property in each level class.
         */
        const registerLevel = (levelId, levelClass) => {
            const metadata = levelClass.levelMetadata;
            if (!metadata) {
                throw new Error(`Level ${levelId} does not have static levelMetadata property`);
            }
            LevelRegistry.registerLevel('campaign-3', levelId, levelClass, metadata);
        };

        registerLevel('level1', DesertLevel1);
        registerLevel('level2', DesertLevel2);
        registerLevel('level3', DesertLevel3);
        registerLevel('level4', DesertLevel4);
        registerLevel('level5', DesertLevel5);
        registerLevel('level6', DesertLevel6);
        registerLevel('level7', DesertLevel7);
        registerLevel('level8', DesertLevel8);
        registerLevel('level9', DesertLevel9);
        registerLevel('level10', DesertLevel10);
    }
    
    enter() {
        // Get levels from registry for this campaign
        let registeredLevels = LevelRegistry.getLevelsByCampaign('campaign-3');
        
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
        
        // Desert path - runs at ground level, curves around oasis below
        // Path positioned at bottom (height * 0.78) so it goes UNDER the oasis
        this.pathPoints = [
            // Entry from left at ground level
            { x: -20, y: height * 0.78 },
            { x: width * 0.05, y: height * 0.78 },
            { x: width * 0.10, y: height * 0.78 },
            { x: width * 0.15, y: height * 0.78 },
            { x: width * 0.20, y: height * 0.78 },
            // Curve DOWN and LEFT to avoid oasis center
            { x: width * 0.25, y: height * 0.79 },
            { x: width * 0.30, y: height * 0.81 },
            { x: width * 0.35, y: height * 0.83 },
            { x: width * 0.40, y: height * 0.84 },  // Far left of oasis
            { x: width * 0.45, y: height * 0.855 }, // Furthest left point
            // Curve BACK UP and RIGHT around oasis bottom
            { x: width * 0.50, y: height * 0.86 },  // Bottom center past oasis
            { x: width * 0.55, y: height * 0.855 }, // Furthest right point
            { x: width * 0.60, y: height * 0.84 },  // Far right of oasis
            { x: width * 0.65, y: height * 0.83 },
            { x: width * 0.70, y: height * 0.81 },
            { x: width * 0.75, y: height * 0.79 },
            { x: width * 0.80, y: height * 0.78 },
            // Final curve to exit
            { x: width * 0.85, y: height * 0.78 },
            { x: width * 0.90, y: height * 0.78 },
            { x: width * 0.95, y: height * 0.78 },
            { x: width + 20, y: height * 0.78 }
        ];
        
        // Generate 10 level slots positioned evenly along the path with good spacing
        this.levelSlots = [];
        const pathLength = this.pathPoints.length - 1;
        const slotSpacing = pathLength / 11; // 11 intervals for 10 slots, keeping margin from edges
        
        for (let i = 0; i < 10; i++) {
            const pathIndex = Math.min(Math.floor((i + 1) * slotSpacing), this.pathPoints.length - 1);
            const pathPoint = this.pathPoints[pathIndex];
            
            // Use existing level or create placeholder
            const level = i < this.levels.length ? this.levels[i] : {
                id: `placeholder-${i}`,
                name: `Level ${i + 1}`,
                unlocked: false,
                completed: false
            };
            
            this.levelSlots.push({
                x: pathPoint.x,
                y: pathPoint.y,
                level: level,
                levelIndex: i
            });
        }
    }
    
    generateTerrainCache() {
        const canvas = this.stateManager.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Oasis location - center-middle of the landscape (above the path)
        this.terrainDetails.oasis = {
            x: width * 0.50,
            y: height * 0.70,
            radiusX: width * 0.14,
            radiusY: height * 0.09
        };
        
        // Create a LevelBase instance to use for rendering desert elements
        this.levelBase = new LevelBase();
        
        // Generate cacti scattered around the desert ground
        const cacti = [];
        const groundLevel = height * 0.78;
        
        // Spread cacti across multiple areas with different Y positions
        const cactusAreas = [
            { centerX: width * 0.08, centerY: groundLevel - 15, count: 3 },
            { centerX: width * 0.18, centerY: groundLevel - 8, count: 3 },
            { centerX: width * 0.32, centerY: groundLevel - 12, count: 2 },
            { centerX: width * 0.68, centerY: groundLevel - 10, count: 2 },
            { centerX: width * 0.82, centerY: groundLevel - 18, count: 3 },
            { centerX: width * 0.92, centerY: groundLevel - 6, count: 3 }
        ];
        
        for (const area of cactusAreas) {
            for (let i = 0; i < area.count; i++) {
                // Spread within area with some randomness
                const offsetX = (Math.random() - 0.5) * (width * 0.08);
                const offsetY = (Math.random() - 0.5) * 20; // Increased vertical spread
                const x = area.centerX + offsetX;
                const y = area.centerY + offsetY;
                
                // Skip if too close to oasis
                const oasis = this.terrainDetails.oasis;
                const distToOasis = Math.hypot((x - oasis.x) / oasis.radiusX, (y - oasis.y) / oasis.radiusY);
                if (distToOasis < 1.2) continue;
                
                cacti.push({
                    x: x,
                    y: y,
                    size: 32 + Math.random() * 20,
                    type: Math.floor(Math.random() * 4),
                    gridX: Math.floor(x / 32),
                    gridY: Math.floor(y / 32)
                });
            }
        }
        
        this.terrainDetails.cacti = cacti;
        
        // Generate rocks scattered naturally around the desert floor with good vertical spread
        const rocks = [
            // Left area
            { x: width * 0.05, y: groundLevel - 8, size: 18 },
            { x: width * 0.10, y: groundLevel - 14, size: 16 },
            
            // Left-center area
            { x: width * 0.20, y: groundLevel - 4, size: 20 },
            { x: width * 0.26, y: groundLevel - 16, size: 17 },
            
            // Center-left area
            { x: width * 0.35, y: groundLevel - 10, size: 19 },
            { x: width * 0.40, y: groundLevel - 6, size: 18 },
            
            // Center area
            { x: width * 0.50, y: groundLevel - 12, size: 20 },
            { x: width * 0.55, y: groundLevel - 7, size: 17 },
            
            // Center-right area
            { x: width * 0.60, y: groundLevel - 9, size: 20 },
            { x: width * 0.65, y: groundLevel - 13, size: 17 },
            
            // Right-center area
            { x: width * 0.74, y: groundLevel - 5, size: 19 },
            { x: width * 0.80, y: groundLevel - 15, size: 21 },
            
            // Right area
            { x: width * 0.90, y: groundLevel - 11, size: 18 },
            { x: width * 0.95, y: groundLevel - 7, size: 20 }
        ];
        
        this.terrainDetails.rocks = rocks;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.animationTime += deltaTime;
        this.updateTumbleweeds(deltaTime);
    }
    
    updateTumbleweeds(deltaTime) {
        const canvas = this.stateManager.canvas;
        const height = canvas.height;
        const groundLevel = height * 0.78;
        
        // Define different lane heights for tumbleweeds
        const tumbleweeds_lanes = [
            groundLevel,           // Lane 0: Ground level
            groundLevel - 40,      // Lane 1: Low height
            groundLevel - 80,      // Lane 2: Medium height
            groundLevel - 120      // Lane 3: High height
        ];
        
        // Spawn new tumbleweeds occasionally from the left side in different lanes
        if (this.tumbleweeds.length < this.maxTumbleweeds && Math.random() < 0.06) {
            // Pick a random lane
            const laneIndex = Math.floor(Math.random() * tumbleweeds_lanes.length);
            const laneY = tumbleweeds_lanes[laneIndex];
            
            this.tumbleweeds.push({
                x: -40,  // Start off-screen on the left
                y: laneY,
                targetY: laneY, // Stay on this lane
                vx: 40 + Math.random() * 60,  // Horizontal speed
                vy: 0,   // No vertical velocity - stay on lane
                rotationSpeed: 3 + Math.random() * 5,
                rotation: Math.random() * Math.PI * 2,
                size: 20 + Math.random() * 14
            });
        }
        
        // Update tumbleweeds
        for (let i = this.tumbleweeds.length - 1; i >= 0; i--) {
            const tumbleweed = this.tumbleweeds[i];
            
            // Move right along its lane
            tumbleweed.x += tumbleweed.vx * deltaTime;
            tumbleweed.rotation += tumbleweed.rotationSpeed * deltaTime;
            
            // Keep tumbleweed on its assigned lane (no bouncing, just stay at target height)
            tumbleweed.y = tumbleweed.targetY;
            
            // Remove tumbleweeds off screen
            if (tumbleweed.x > canvas.width + 50) {
                this.tumbleweeds.splice(i, 1);
            }
        }
    }

    renderBackground(ctx) {
        const canvas = this.stateManager.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Sky gradient - hot desert
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
        skyGradient.addColorStop(0, '#ffb347');
        skyGradient.addColorStop(0.3, '#ffc966');
        skyGradient.addColorStop(0.6, '#ffe4b5');
        skyGradient.addColorStop(1, '#f5deb3');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height * 0.6);
        
        // Scorching sun
        this.drawSun(ctx, width * 0.85, height * 0.15);
        
        // Sand dunes - layered for depth
        this.drawSandDunes(ctx, canvas);
    }

    renderTerrain(ctx) {
        const canvas = this.stateManager.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // BACKGROUND LAYER 1: Sand ground (moved down to not overlap dunes)
        ctx.fillStyle = '#e8c590';
        ctx.fillRect(0, height * 0.75, width, height * 0.25);
        
        // BACKGROUND LAYER 2: Render oasis water first (far background)
        if (this.terrainDetails && this.terrainDetails.oasis) {
            this.renderOasis(ctx);
        }
        
        // MIDDLE LAYER: Desert path
        this.renderDesertPath(ctx);
        
        // FOREGROUND LAYER: Render cacti and rocks (sorted by Y for depth)
        if (this.terrainDetails && this.terrainDetails.cacti) {
            const sortedCacti = [...this.terrainDetails.cacti].sort((a, b) => a.y - b.y);
            for (const cactus of sortedCacti) {
                this.renderCactusOnMap(ctx, cactus);
            }
        }
        
        if (this.terrainDetails && this.terrainDetails.rocks) {
            const sortedRocks = [...this.terrainDetails.rocks].sort((a, b) => a.y - b.y);
            for (const rock of sortedRocks) {
                this.renderRockOnMap(ctx, rock);
            }
        }
        
        // FOREGROUND FX: Tumbleweeds drift over terrain
        this.renderTumbleweeds(ctx);
    }
    
    renderCactusOnMap(ctx, cactus) {
        // Use LevelBase cactus rendering for consistency
        const types = ['renderCactusSaguaro', 'renderCactusBarrel', 'renderCactusPricklyPear', 'renderCactusColumnar'];
        const method = types[cactus.type % types.length];
        
        if (this.levelBase && typeof this.levelBase[method] === 'function') {
            this.levelBase[method](ctx, cactus.x, cactus.y, cactus.size);
        }
    }
    
    renderRockOnMap(ctx, rock) {
        // Draw a simple desert rock
        ctx.fillStyle = '#8a7a5a';
        ctx.beginPath();
        ctx.ellipse(rock.x, rock.y, rock.size * 0.6, rock.size * 0.4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Rock shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(rock.x + 2, rock.y + 1, rock.size * 0.5, rock.size * 0.2, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Rock highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.ellipse(rock.x - rock.size * 0.2, rock.y - rock.size * 0.15, rock.size * 0.2, rock.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawSun(ctx, x, y) {
        // Sun glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
        gradient.addColorStop(0, 'rgba(255, 200, 0, 0.6)');
        gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 80, 0, Math.PI * 2);
        ctx.fill();
        
        // Main sun disc
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y, 48, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright center
        ctx.fillStyle = '#ffff99';
        ctx.beginPath();
        ctx.arc(x, y, 32, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawSandDunes(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        
        // Simple smooth wave-like dunes - no harsh overlaps
        // LAYER 1 (BACK): Distant dunes at 35% height
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.35);
        for (let x = 0; x <= width; x += 40) {
            const waveY = Math.sin(x * 0.006) * 8 + height * 0.35;
            ctx.lineTo(x, waveY);
        }
        ctx.lineTo(width, height * 0.50);
        ctx.lineTo(0, height * 0.50);
        ctx.closePath();
        ctx.fill();
        
        // LAYER 2 (MIDDLE): Medium dunes at 50% height
        ctx.fillStyle = '#dbb896';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.50);
        for (let x = 0; x <= width; x += 40) {
            const waveY = Math.sin(x * 0.005 + 1.5) * 10 + height * 0.50;
            ctx.lineTo(x, waveY);
        }
        ctx.lineTo(width, height * 0.65);
        ctx.lineTo(0, height * 0.65);
        ctx.closePath();
        ctx.fill();
        
        // LAYER 3 (FRONT): Large prominent dunes at 65% height
        ctx.fillStyle = '#e8c898';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.65);
        for (let x = 0; x <= width; x += 40) {
            const waveY = Math.sin(x * 0.004 + 0.8) * 12 + height * 0.65;
            ctx.lineTo(x, waveY);
        }
        ctx.lineTo(width, height * 0.75);
        ctx.lineTo(0, height * 0.75);
        ctx.closePath();
        ctx.fill();
        
        // Add subtle shading for depth on the back dunes
        ctx.fillStyle = 'rgba(150, 100, 50, 0.15)';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.35);
        for (let x = 0; x <= width; x += 40) {
            const waveY = Math.sin(x * 0.006) * 8 + height * 0.35;
            ctx.lineTo(x, waveY);
        }
        ctx.lineTo(width, height * 0.38);
        ctx.lineTo(0, height * 0.38);
        ctx.closePath();
        ctx.fill();
    }
    
    renderOasis(ctx) {
        const oasis = this.terrainDetails.oasis;
        
        // Water with organic shape
        ctx.fillStyle = '#3a8a6a';
        ctx.save();
        ctx.translate(oasis.x, oasis.y);
        
        ctx.beginPath();
        // Draw organic water shape
        const waterScale = oasis.radiusX;
        const waterTall = oasis.radiusY;
        
        ctx.moveTo(-waterScale * 0.9, -waterTall * 0.5);
        ctx.quadraticCurveTo(-waterScale, -waterTall * 0.3, -waterScale * 0.8, waterTall * 0.3);
        ctx.quadraticCurveTo(-waterScale * 0.4, waterTall * 0.5, 0, waterTall * 0.6);
        ctx.quadraticCurveTo(waterScale * 0.4, waterTall * 0.5, waterScale * 0.8, waterTall * 0.3);
        ctx.quadraticCurveTo(waterScale, -waterTall * 0.3, waterScale * 0.9, -waterTall * 0.5);
        ctx.quadraticCurveTo(waterScale * 0.5, -waterTall * 0.7, 0, -waterTall * 0.8);
        ctx.quadraticCurveTo(-waterScale * 0.5, -waterTall * 0.7, -waterScale * 0.9, -waterTall * 0.5);
        
        ctx.closePath();
        ctx.fill();
        
        // Water reflection
        ctx.fillStyle = 'rgba(100, 200, 180, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-waterScale * 0.3, -waterTall * 0.3, waterScale * 0.35, waterTall * 0.2, 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Water shore
        ctx.strokeStyle = 'rgba(80, 120, 100, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-waterScale * 0.9, -waterTall * 0.5);
        ctx.quadraticCurveTo(-waterScale, -waterTall * 0.3, -waterScale * 0.8, waterTall * 0.3);
        ctx.quadraticCurveTo(-waterScale * 0.4, waterTall * 0.5, 0, waterTall * 0.6);
        ctx.quadraticCurveTo(waterScale * 0.4, waterTall * 0.5, waterScale * 0.8, waterTall * 0.3);
        ctx.quadraticCurveTo(waterScale, -waterTall * 0.3, waterScale * 0.9, -waterTall * 0.5);
        ctx.quadraticCurveTo(waterScale * 0.5, -waterTall * 0.7, 0, -waterTall * 0.8);
        ctx.quadraticCurveTo(-waterScale * 0.5, -waterTall * 0.7, -waterScale * 0.9, -waterTall * 0.5);
        ctx.stroke();
        
        ctx.restore();
    }
    
    renderDesertPath(ctx) {
        if (!this.pathPoints || this.pathPoints.length < 2) return;
        
        const canvas = this.stateManager.canvas;
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Layer 1: Dark shadow base
        ctx.strokeStyle = 'rgba(40, 40, 40, 0.4)';
        ctx.lineWidth = 58;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x + 3, this.pathPoints[0].y + 3);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x + 3, this.pathPoints[i].y + 3);
        }
        ctx.stroke();
        
        // Layer 2: Main sand path - packed dirt
        ctx.strokeStyle = '#c9a876';
        ctx.lineWidth = 54;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        // Layer 3: Edge darkening
        ctx.strokeStyle = '#a88a6a';
        ctx.lineWidth = 54;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        // Layer 4: Worn center stripe
        ctx.strokeStyle = '#ddb892';
        ctx.lineWidth = 26;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
    
    drawSun(ctx, x, y) {
        // Sun glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
        gradient.addColorStop(0, 'rgba(255, 200, 0, 0.6)');
        gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 80, 0, Math.PI * 2);
        ctx.fill();
        
        // Main sun disc
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x, y, 48, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright center
        ctx.fillStyle = '#ffff99';
        ctx.beginPath();
        ctx.arc(x, y, 32, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderTumbleweeds(ctx) {
        for (const tumbleweed of this.tumbleweeds) {
            ctx.save();
            ctx.translate(tumbleweed.x, tumbleweed.y);
            ctx.rotate(tumbleweed.rotation);
            
            // Draw bushy tumbleweed with organic appearance
            const size = tumbleweed.size;
            const baseSize = size * 0.4;
            
            // Main bushy body - concentric circles with fuzzy edges
            // Outer layer - light brown with transparency
            ctx.fillStyle = 'rgba(180, 120, 60, 0.6)';
            ctx.beginPath();
            ctx.arc(0, 0, baseSize * 1.2, 0, Math.PI * 2);
            ctx.fill();
            
            // Middle layer - darker brown
            ctx.fillStyle = 'rgba(140, 90, 40, 0.8)';
            ctx.beginPath();
            ctx.arc(0, 0, baseSize * 0.95, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner layer - darkest for depth
            ctx.fillStyle = 'rgba(100, 60, 20, 0.8)';
            ctx.beginPath();
            ctx.arc(0, 0, baseSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
            // Add spiky branches radiating out for bushy texture
            ctx.strokeStyle = 'rgba(120, 80, 40, 0.7)';
            ctx.lineWidth = 1.5;
            const branchCount = 12;
            for (let i = 0; i < branchCount; i++) {
                const angle = (i / branchCount) * Math.PI * 2;
                const branchLength = baseSize * (0.8 + Math.random() * 0.5);
                const branchX = Math.cos(angle) * branchLength;
                const branchY = Math.sin(angle) * branchLength;
                
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(branchX, branchY);
                ctx.stroke();
                
                // Small twigs on branches
                ctx.lineWidth = 0.8;
                for (let j = 0; j < 2; j++) {
                    const twigDist = branchLength * (0.4 + j * 0.4);
                    const twigAngle = angle + (Math.random() - 0.5) * 0.6;
                    const twigLength = baseSize * 0.3;
                    const twigX = Math.cos(angle) * twigDist + Math.cos(twigAngle) * twigLength;
                    const twigY = Math.sin(angle) * twigDist + Math.sin(twigAngle) * twigLength;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * twigDist, Math.sin(angle) * twigDist);
                    ctx.lineTo(twigX, twigY);
                    ctx.stroke();
                }
            }
            
            // Add fuzzy outline by drawing semi-transparent points around edge
            ctx.fillStyle = 'rgba(150, 100, 50, 0.4)';
            const fuzzyPoints = 20;
            for (let i = 0; i < fuzzyPoints; i++) {
                const angle = (i / fuzzyPoints) * Math.PI * 2;
                const fuzzX = Math.cos(angle) * baseSize * 1.3;
                const fuzzY = Math.sin(angle) * baseSize * 1.3;
                ctx.beginPath();
                ctx.arc(fuzzX, fuzzY, baseSize * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    renderLevelSlot(ctx, index) {
        if (!this.levelSlots || index >= this.levelSlots.length) return;
        
        const slot = this.levelSlots[index];
        const level = slot.level;
        const isHovered = index === this.hoveredLevel;
        const isLocked = !level.unlocked;
        const isPlaceholder = level.id.startsWith('placeholder-');
        
        // Draw castle for this level (or placeholder)
        if (isPlaceholder) {
            this.drawPlaceholderSlot(ctx, slot.x, slot.y, isHovered);
        } else if (isLocked) {
            this.drawLockedCastleTopDown(ctx, slot.x, slot.y, isHovered);
        } else {
            this.drawCastleFromInstance(ctx, slot.x, slot.y, index, isHovered);
        }
        
        // Draw level name/number below
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#3d2817';
        ctx.fillText(level.name, slot.x, slot.y + 80);
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
        ctx.strokeStyle = '#c9a876';
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
        ctx.fillStyle = '#c9a876';
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
    
    drawLockedCastleTopDown(ctx, centerX, centerY, isHovered) {
        ctx.save();
        ctx.translate(centerX, centerY);
        const scale = 0.45;
        ctx.scale(scale, scale);
        
        if (isHovered) {
            ctx.fillStyle = 'rgba(150, 150, 150, 0.1)';
            ctx.beginPath();
            ctx.arc(0, 0, 220, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw locked castle - desaturated
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.rect(-100, -80, 200, 160);
        ctx.fill();
        
        // Walls
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 8;
        ctx.strokeRect(-100, -80, 200, 160);
        
        // Towers
        ctx.fillStyle = '#777777';
        ctx.fillRect(-100, -80, 40, 50);
        ctx.fillRect(60, -80, 40, 50);
        
        // Lock symbol
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    handleDesertClick(mouseX, mouseY) {
        // Click handling is done by base class handleClick using levelSlots
        // This method is not used
    }

    exit() {
        super.exit();
    }
}
