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
        
        // Oasis location - center-middle of the landscape (above the path), moved down slightly
        this.terrainDetails.oasis = {
            x: width * 0.50,
            y: height * 0.75,
            radiusX: width * 0.14,
            radiusY: height * 0.09
        };
        
        // Create a LevelBase instance to use for rendering desert elements
        this.levelBase = new LevelBase();
        
        // Generate cacti scattered ONLY on the light sand plane (above and below path, around lake)
        const cacti = [];
        const groundLevelBottom = height * 0.95;   // Bottom of screen
        const groundTopAbove = height * 0.72;      // Above path (on light sand, not dunes)
        const groundLevelPath = height * 0.78;     // Path level
        const groundTopBelow = height * 0.78;      // Below path (on light sand)
        
        // Use fewer placement attempts for less cacti spread out more
        const cactiAttempts = 200;  // Same as before
        const oasis = this.terrainDetails.oasis;
        const minCactusSpacing = 70;  // Increased from 55 for better spread
        
        for (let attempt = 0; attempt < cactiAttempts; attempt++) {
            const x = Math.random() * width;
            
            // Randomly decide if cacti goes above or below the path (both on light sand plane)
            let y, groundTop, groundLevel;
            if (Math.random() < 0.3) {
                // Above path on light sand (30%)
                groundTop = groundTopAbove;
                groundLevel = groundLevelPath;
            } else {
                // Below path on light sand (70%)
                groundTop = groundTopBelow;
                groundLevel = groundLevelBottom;
            }
            
            y = groundTop + Math.random() * (groundLevel - groundTop);
            
            // Skip if too close to oasis
            const distToOasis = Math.hypot((x - oasis.x) / oasis.radiusX, (y - oasis.y) / oasis.radiusY);
            if (distToOasis < 1.3) continue;
            
            // Skip if too close to path
            let tooCloseToPath = false;
            for (const pathPoint of this.pathPoints) {
                const dist = Math.hypot(x - pathPoint.x, y - pathPoint.y);
                if (dist < 60) {
                    tooCloseToPath = true;
                    break;
                }
            }
            if (tooCloseToPath) continue;
            
            // Skip if too close to other cacti
            let tooCloseToOtherCactus = false;
            for (const cactus of cacti) {
                const dist = Math.hypot(x - cactus.x, y - cactus.y);
                if (dist < minCactusSpacing) {
                    tooCloseToOtherCactus = true;
                    break;
                }
            }
            if (tooCloseToOtherCactus) continue;
            
            cacti.push({
                x: x,
                y: y,
                size: 32 + Math.random() * 20,
                type: Math.floor(Math.random() * 4),
                gridX: Math.floor(x / 32),
                gridY: Math.floor(y / 32)
            });
        }
        
        this.terrainDetails.cacti = cacti;
        
        // Generate rocks scattered ONLY below the path with natural distribution
        const rocks = [];
        const rocksAttempts = 100;  // Same as before
        const minRockSpacing = 80;  // Increased from 65 for better spread
        
        for (let attempt = 0; attempt < rocksAttempts; attempt++) {
            const x = Math.random() * width;
            const y = groundTopBelow + Math.random() * (groundLevelBottom - groundTopBelow);
            
            // Skip if too close to oasis
            const distToOasis = Math.hypot((x - oasis.x) / oasis.radiusX, (y - oasis.y) / oasis.radiusY);
            if (distToOasis < 1.3) continue;
            
            // Skip if too close to path
            let tooCloseToPath = false;
            for (const pathPoint of this.pathPoints) {
                const dist = Math.hypot(x - pathPoint.x, y - pathPoint.y);
                if (dist < 65) {
                    tooCloseToPath = true;
                    break;
                }
            }
            if (tooCloseToPath) continue;
            
            // Skip if too close to other rocks
            let tooCloseToOtherRock = false;
            for (const rock of rocks) {
                const dist = Math.hypot(x - rock.x, y - rock.y);
                if (dist < minRockSpacing) {
                    tooCloseToOtherRock = true;
                    break;
                }
            }
            if (tooCloseToOtherRock) continue;
            
            rocks.push({
                x: x,
                y: y,
                size: 16 + Math.random() * 12
            });
        }
        
        this.terrainDetails.rocks = rocks;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.animationTime += deltaTime;
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
        
        // Light sand ground plane
        ctx.fillStyle = '#e8c898';
        ctx.fillRect(0, height * 0.75, width, height * 0.25);
        
        // Render oasis water first (far background)
        if (this.terrainDetails && this.terrainDetails.oasis) {
            this.renderOasis(ctx);
        }
        
        // Desert path
        this.renderDesertPath(ctx);
        
        // Foreground: Render cacti and rocks (sorted by Y for depth)
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
        
        // Heat shimmer effect over landscape
        this.renderHeatShimmer(ctx, canvas);
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
        
        // LAYER 1 (BACK): Far dunes - subtle and hazy
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
        
        // LAYER 2 (MIDDLE): Medium dunes - fill completely to ground level
        ctx.fillStyle = '#dbb896';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.50);
        for (let x = 0; x <= width; x += 40) {
            const waveY = Math.sin(x * 0.005 + 1.5) * 10 + height * 0.50;
            ctx.lineTo(x, waveY);
        }
        ctx.lineTo(width, height * 0.75);
        ctx.lineTo(0, height * 0.75);
        ctx.closePath();
        ctx.fill();
        
        // LAYER 3 (FRONT): Large foreground dunes - now blend into ground
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
        
        // Add subtle shading for depth on back dunes
        ctx.fillStyle = 'rgba(150, 100, 50, 0.12)';
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
        
        // Simple path with no dark edges - just light sand color
        ctx.strokeStyle = '#e8c898';
        ctx.lineWidth = 54;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        // Subtle center highlight
        ctx.strokeStyle = '#f0e0c8';
        ctx.lineWidth = 20;
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
    
    renderHeatShimmer(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const shimmerHeight = height * 0.5;  // Top portion of screen
        
        // Create a wavy shimmer effect - much more visible
        const shimmerStrength = 12 + Math.sin(this.animationTime * 3) * 6;
        
        // Draw semi-transparent wavy lines for heat distortion - much more opaque
        ctx.strokeStyle = 'rgba(255, 255, 200, 0.15)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        const waveCount = 8;
        for (let w = 0; w < waveCount; w++) {
            const baseY = (shimmerHeight * w) / waveCount;
            ctx.beginPath();
            
            for (let x = 0; x <= width; x += 15) {
                const waveOffset = Math.sin((x * 0.012 + this.animationTime * 2.5) + w) * shimmerStrength;
                const y = baseY + waveOffset;
                
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // Add multiple radial gradient heat effects for more prominent mirage
        const sunX = width * 0.85;
        const sunY = height * 0.15;
        
        // Large outer shimmer
        let heatGradient = ctx.createRadialGradient(sunX, sunY, 100, sunX, sunY, 500);
        heatGradient.addColorStop(0, 'rgba(255, 220, 100, 0.15)');
        heatGradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.08)');
        heatGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = heatGradient;
        ctx.fillRect(0, 0, width, shimmerHeight);
        
        // Bright inner core
        heatGradient = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 200);
        heatGradient.addColorStop(0, 'rgba(255, 255, 150, 0.2)');
        heatGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.fillStyle = heatGradient;
        ctx.fillRect(0, 0, width, shimmerHeight);
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

    handleDesertClick(mouseX, mouseY) {
        // Click handling is done by base class handleClick using levelSlots
        // This method is not used
    }

    exit() {
        super.exit();
    }
}
