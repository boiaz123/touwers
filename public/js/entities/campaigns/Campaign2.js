import { CampaignBase } from './CampaignBase.js';
import { LevelRegistry } from '../levels/LevelRegistry.js';
import { Castle } from '../buildings/Castle.js';
import { MountainLevel1 } from '../levels/Mountain/MountainLevel1.js';
import { MountainLevel2 } from '../levels/Mountain/MountainLevel2.js';
import { MountainLevel3 } from '../levels/Mountain/MountainLevel3.js';
import { MountainLevel4 } from '../levels/Mountain/MountainLevel4.js';
import { MountainLevel5 } from '../levels/Mountain/MountainLevel5.js';
import { MountainLevel6 } from '../levels/Mountain/MountainLevel6.js';
import { MountainLevel7 } from '../levels/Mountain/MountainLevel7.js';
import { MountainLevel8 } from '../levels/Mountain/MountainLevel8.js';
import { MountainLevel9 } from '../levels/Mountain/MountainLevel9.js';
import { MountainLevel10 } from '../levels/Mountain/MountainLevel10.js';

/**
 * Campaign2: The Mountain Campaign
 * Alpine peak landscape with snowy mountains, mountain passes, and fortifications
 * Uses natural mountain range generation and in-game tree rendering
 */
export class Campaign2 extends CampaignBase {
    constructor(stateManager) {
        super(stateManager);
        
        this.campaignId = 'campaign-2';
        this.campaignName = 'The Mountain Campaign';
        this.castleInstances = {};
        this.animationTime = 0;
        this.pathPoints = [];
        this.terrainDetails = {
            mountains: [],
            trees: [],
            rocks: []
        };
        
        // Snow particle effect
        this.snowflakes = [];
        this.maxSnowflakes = 80;
        
        this.registerLevels();
    }
    
    
    registerLevels() {
        /**
         * Register all Mountain Campaign levels.
         * Metadata is read from static levelMetadata property in each level class.
         */
        const registerLevel = (levelId, levelClass) => {
            const metadata = levelClass.levelMetadata;
            if (!metadata) {
                throw new Error(`Level ${levelId} does not have static levelMetadata property`);
            }
            LevelRegistry.registerLevel('campaign-2', levelId, levelClass, metadata);
        };

        registerLevel('level1', MountainLevel1);
        registerLevel('level2', MountainLevel2);
        registerLevel('level3', MountainLevel3);
        registerLevel('level4', MountainLevel4);
        registerLevel('level5', MountainLevel5);
        registerLevel('level6', MountainLevel6);
        registerLevel('level7', MountainLevel7);
        registerLevel('level8', MountainLevel8);
        registerLevel('level9', MountainLevel9);
        registerLevel('level10', MountainLevel10);
    }
    
    enter() {
        // Get levels from registry for this campaign
        let registeredLevels = LevelRegistry.getLevelsByCampaign('campaign-2');
        
        // Apply unlock status from save data
        const saveData = this.stateManager.currentSaveData;
        this.levels = registeredLevels.map(level => ({
            id: level.id,
            name: level.name,
            difficulty: level.difficulty,
            unlocked: !saveData || !saveData.unlockedLevels || saveData.unlockedLevels.includes(level.id) || level.id === 'level1',
            type: 'campaign'
        }));
        
        this.generatePathAndSlots();
        this.generateTerrainCache();
        
        super.enter();
    }
    
    generatePathAndSlots() {
        const canvas = this.stateManager.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Path well below the mountains at the ground level, curving around lake
        this.pathPoints = [
            // Entry from left at ground level
            { x: -20, y: height * 0.76 },
            { x: width * 0.05, y: height * 0.76 },
            { x: width * 0.10, y: height * 0.76 },
            { x: width * 0.15, y: height * 0.76 },
            { x: width * 0.20, y: height * 0.76 },
            // Curve DOWN and LEFT to avoid lake
            { x: width * 0.25, y: height * 0.77 },
            { x: width * 0.30, y: height * 0.79 },
            { x: width * 0.35, y: height * 0.82 },
            { x: width * 0.38, y: height * 0.84 },  // Far left of lake
            { x: width * 0.40, y: height * 0.855 },  // Furthest left point
            // Curve BACK UP and RIGHT around lake bottom
            { x: width * 0.50, y: height * 0.86 },  // Bottom center past lake
            { x: width * 0.60, y: height * 0.855 },  // Furthest right point
            { x: width * 0.62, y: height * 0.84 },  // Far right of lake
            { x: width * 0.65, y: height * 0.82 },
            { x: width * 0.70, y: height * 0.79 },
            { x: width * 0.75, y: height * 0.77 },
            { x: width * 0.80, y: height * 0.76 },
            // Final curve to exit
            { x: width * 0.85, y: height * 0.76 },
            { x: width * 0.90, y: height * 0.76 },
            { x: width * 0.95, y: height * 0.76 },
            { x: width + 20, y: height * 0.76 }
        ];
        
        // Generate 10 level slots positioned evenly along the path with better spacing
        this.levelSlots = [];
        // Spread slots more evenly - use fractional indices for better distribution
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
        
        // Generate a full-screen mountain range with multiple peaks
        // The entire background will be one continuous mountain range
        this.terrainDetails.mountainRangeGenerated = true;
        
        // Generate rocks in lower terrain - more rocks with better spacing
        const rocks = [
            // Left side rocks
            { x: width * 0.08, y: height * 0.65, size: 24 },
            { x: width * 0.12, y: height * 0.68, size: 20 },
            { x: width * 0.05, y: height * 0.72, size: 28 },
            { x: width * 0.15, y: height * 0.75, size: 26 },
            { x: width * 0.18, y: height * 0.70, size: 22 },
            { x: width * 0.10, y: height * 0.80, size: 24 },
            
            // Center-left rocks
            { x: width * 0.28, y: height * 0.64, size: 28 },
            { x: width * 0.32, y: height * 0.72, size: 24 },
            { x: width * 0.24, y: height * 0.78, size: 26 },
            { x: width * 0.38, y: height * 0.68, size: 22 },
            { x: width * 0.42, y: height * 0.76, size: 20 },
            
            // Center rocks
            { x: width * 0.48, y: height * 0.66, size: 26 },
            { x: width * 0.52, y: height * 0.70, size: 24 },
            { x: width * 0.56, y: height * 0.74, size: 28 },
            { x: width * 0.50, y: height * 0.80, size: 22 },
            
            // Center-right rocks
            { x: width * 0.62, y: height * 0.65, size: 24 },
            { x: width * 0.68, y: height * 0.72, size: 26 },
            { x: width * 0.58, y: height * 0.76, size: 20 },
            { x: width * 0.72, y: height * 0.68, size: 28 },
            { x: width * 0.78, y: height * 0.75, size: 24 },
            
            // Right side rocks
            { x: width * 0.82, y: height * 0.64, size: 26 },
            { x: width * 0.88, y: height * 0.70, size: 28 },
            { x: width * 0.85, y: height * 0.78, size: 22 },
            { x: width * 0.92, y: height * 0.73, size: 24 },
            { x: width * 0.95, y: height * 0.80, size: 26 }
        ];
        this.terrainDetails.rocks = rocks;
        
        // Generate a natural lake in the center-bottom area
        this.terrainDetails.lake = {
            x: width * 0.5,
            y: height * 0.85,
            radiusX: width * 0.15,
            radiusY: height * 0.08
        };
        
        // Generate trees away from the path and lake - MUCH DENSER in bottom half
        const trees = [];
        const pathBuffer = 120;
        const lakeBuffer = 180;
        const mountainBaseLine = height * 0.55; // Trees below this line
        
        // Tighter tree density with better spreading - reduced grid spacing
        const gridSpacing = 35; // Smaller spacing for more trees
        
        // Left side trees
        for (let x = 0; x < width * 0.4; x += gridSpacing) {
            for (let y = mountainBaseLine; y < height; y += gridSpacing) {
                if (Math.random() > 0.25) continue; // 75% spawn chance
                const tx = x + (Math.random() - 0.5) * gridSpacing * 0.6;
                const ty = y + (Math.random() - 0.5) * gridSpacing * 0.6;
                
                let tooClose = false;
                // Check path proximity
                for (const pt of this.pathPoints) {
                    if (Math.hypot(tx - pt.x, ty - pt.y) < pathBuffer) {
                        tooClose = true;
                        break;
                    }
                }
                
                // Check lake proximity
                if (!tooClose) {
                    const lake = this.terrainDetails.lake;
                    const distToLake = Math.hypot((tx - lake.x) / lake.radiusX, (ty - lake.y) / lake.radiusY);
                    if (distToLake < 1.3) tooClose = true;
                }
                
                if (!tooClose && ty > mountainBaseLine && ty < height) {
                    trees.push({
                        x: tx,
                        y: ty,
                        size: 28 + Math.random() * 24,
                        gridX: Math.floor(tx / 10),
                        gridY: Math.floor(ty / 10)
                    });
                }
            }
        }
        
        // Right side trees
        for (let x = width * 0.6; x < width; x += gridSpacing) {
            for (let y = mountainBaseLine; y < height; y += gridSpacing) {
                if (Math.random() > 0.25) continue;
                const tx = x + (Math.random() - 0.5) * gridSpacing * 0.6;
                const ty = y + (Math.random() - 0.5) * gridSpacing * 0.6;
                
                let tooClose = false;
                // Check path proximity
                for (const pt of this.pathPoints) {
                    if (Math.hypot(tx - pt.x, ty - pt.y) < pathBuffer) {
                        tooClose = true;
                        break;
                    }
                }
                
                // Check lake proximity
                if (!tooClose) {
                    const lake = this.terrainDetails.lake;
                    const distToLake = Math.hypot((tx - lake.x) / lake.radiusX, (ty - lake.y) / lake.radiusY);
                    if (distToLake < 1.3) tooClose = true;
                }
                
                if (!tooClose && ty > mountainBaseLine && ty < height) {
                    trees.push({
                        x: tx,
                        y: ty,
                        size: 28 + Math.random() * 24,
                        gridX: Math.floor(tx / 10),
                        gridY: Math.floor(ty / 10)
                    });
                }
            }
        }
        
        // Center area trees (around the path but in wider spaces) - much denser
        for (let x = width * 0.3; x < width * 0.7; x += gridSpacing) {
            for (let y = mountainBaseLine + (height * 0.05); y < height; y += gridSpacing) {
                if (Math.random() > 0.35) continue; // 65% spawn chance
                const tx = x + (Math.random() - 0.5) * gridSpacing * 0.6;
                const ty = y + (Math.random() - 0.5) * gridSpacing * 0.6;
                
                let tooClose = false;
                // Check path proximity (wider buffer for center)
                for (const pt of this.pathPoints) {
                    if (Math.hypot(tx - pt.x, ty - pt.y) < pathBuffer * 1.2) {
                        tooClose = true;
                        break;
                    }
                }
                
                // Check lake proximity
                if (!tooClose) {
                    const lake = this.terrainDetails.lake;
                    const distToLake = Math.hypot((tx - lake.x) / lake.radiusX, (ty - lake.y) / lake.radiusY);
                    if (distToLake < 1.3) tooClose = true;
                }
                
                if (!tooClose && ty > mountainBaseLine && ty < height) {
                    trees.push({
                        x: tx,
                        y: ty,
                        size: 28 + Math.random() * 24,
                        gridX: Math.floor(tx / 10),
                        gridY: Math.floor(ty / 10)
                    });
                }
            }
        }
        
        this.terrainDetails.trees = trees;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.animationTime += deltaTime;
        this.updateSnowflakes(deltaTime);
    }
    
    updateSnowflakes(deltaTime) {
        const canvas = this.stateManager.canvas;
        
        // Spawn new snowflakes
        if (this.snowflakes.length < this.maxSnowflakes && Math.random() < 0.25) {
            this.snowflakes.push({
                x: Math.random() * canvas.width,
                y: -10,
                vx: (Math.random() - 0.5) * 20,
                vy: 30 + Math.random() * 40,
                size: 2 + Math.random() * 4,
                swayPhase: Math.random() * Math.PI * 2,
                opacity: 0.4 + Math.random() * 0.5
            });
        }
        
        // Update snowflakes
        for (let i = this.snowflakes.length - 1; i >= 0; i--) {
            const flake = this.snowflakes[i];
            
            flake.y += flake.vy * deltaTime;
            flake.swayPhase += deltaTime * 1.5;
            flake.x += flake.vx * deltaTime + Math.sin(flake.swayPhase) * 15 * deltaTime;
            
            // Remove snowflakes off screen
            if (flake.y > canvas.height + 10 || flake.x < -10 || flake.x > canvas.width + 10) {
                this.snowflakes.splice(i, 1);
            }
        }
    }
    
    renderSnowflakes(ctx) {
        for (const flake of this.snowflakes) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderBackground(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
        grad.addColorStop(0, '#1a3a5a');
        grad.addColorStop(0.3, '#3a5a8a');
        grad.addColorStop(0.7, '#6a9aca');
        grad.addColorStop(1, '#8ab4da');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render full-screen mountain range
        this.drawFullMountainRange(ctx, canvas);
        
        ctx.globalAlpha = 1;
    }

    renderTerrain(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Ground separation line - lighter ground below mountains
        const separationY = canvas.height * 0.55;
        ctx.fillStyle = '#a8c8e1';
        ctx.fillRect(0, separationY, canvas.width, canvas.height - separationY);
        
        // Add more detailed and natural ground texture pattern
        ctx.fillStyle = 'rgba(90, 120, 100, 0.08)';
        for (let x = 0; x < canvas.width; x += 23) {
            for (let y = separationY; y < canvas.height; y += 18) {
                const randomVariation = Math.sin(x * 0.1 + y * 0.15) * 0.5 + 0.5;
                const size = 6 + randomVariation * 4;
                const opacity = 0.04 + randomVariation * 0.08;
                ctx.globalAlpha = opacity;
                ctx.fillRect(x + Math.sin(y * 0.01) * 5, y, size, 2);
            }
        }
        ctx.globalAlpha = 1;
        
        // Add additional texture detail layer
        ctx.fillStyle = 'rgba(100, 140, 110, 0.06)';
        for (let x = 10; x < canvas.width; x += 31) {
            for (let y = separationY + 8; y < canvas.height; y += 24) {
                const randomVariation = Math.cos(x * 0.12 + y * 0.08) * 0.5 + 0.5;
                const size = 5 + randomVariation * 3;
                ctx.globalAlpha = 0.03 + randomVariation * 0.06;
                ctx.fillRect(x + Math.cos(y * 0.015) * 3, y, size, 1);
            }
        }
        ctx.globalAlpha = 1;
        
        // Render lake with natural organic blob shape
        if (this.terrainDetails && this.terrainDetails.lake) {
            const lake = this.terrainDetails.lake;
            ctx.save();
            ctx.translate(lake.x, lake.y);
            
            // Create a natural organic lake shape using a path
            ctx.fillStyle = '#4a7ba7';
            ctx.beginPath();
            
            // Draw organic lake boundary with curves
            const lakeScale = lake.radiusX;
            const lakeTall = lake.radiusY;
            
            // Top left curve
            ctx.moveTo(-lakeScale * 0.8, -lakeTall * 0.6);
            ctx.quadraticCurveTo(-lakeScale * 0.9, -lakeTall * 0.3, -lakeScale * 0.75, lakeTall * 0.2);
            
            // Bottom left inlet
            ctx.quadraticCurveTo(-lakeScale * 0.6, lakeTall * 0.5, -lakeScale * 0.3, lakeTall * 0.4);
            
            // Bottom center
            ctx.quadraticCurveTo(0, lakeTall * 0.55, lakeScale * 0.35, lakeTall * 0.45);
            
            // Bottom right
            ctx.quadraticCurveTo(lakeScale * 0.7, lakeTall * 0.4, lakeScale * 0.85, lakeTall * 0.1);
            
            // Right side
            ctx.quadraticCurveTo(lakeScale * 0.92, -lakeTall * 0.2, lakeScale * 0.7, -lakeTall * 0.5);
            
            // Top right
            ctx.quadraticCurveTo(lakeScale * 0.4, -lakeTall * 0.7, lakeScale * 0.1, -lakeTall * 0.65);
            
            // Back to start
            ctx.quadraticCurveTo(-lakeScale * 0.5, -lakeTall * 0.75, -lakeScale * 0.8, -lakeTall * 0.6);
            
            ctx.closePath();
            ctx.fill();
            
            // Lake highlight/reflection
            ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
            ctx.beginPath();
            ctx.ellipse(-lakeScale * 0.25, -lakeTall * 0.35, lakeScale * 0.3, lakeTall * 0.2, 0.1, 0, Math.PI * 2);
            ctx.fill();
            
            // Lake shore line
            ctx.strokeStyle = 'rgba(60, 100, 140, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-lakeScale * 0.8, -lakeTall * 0.6);
            ctx.quadraticCurveTo(-lakeScale * 0.9, -lakeTall * 0.3, -lakeScale * 0.75, lakeTall * 0.2);
            ctx.quadraticCurveTo(-lakeScale * 0.6, lakeTall * 0.5, -lakeScale * 0.3, lakeTall * 0.4);
            ctx.quadraticCurveTo(0, lakeTall * 0.55, lakeScale * 0.35, lakeTall * 0.45);
            ctx.quadraticCurveTo(lakeScale * 0.7, lakeTall * 0.4, lakeScale * 0.85, lakeTall * 0.1);
            ctx.quadraticCurveTo(lakeScale * 0.92, -lakeTall * 0.2, lakeScale * 0.7, -lakeTall * 0.5);
            ctx.quadraticCurveTo(lakeScale * 0.4, -lakeTall * 0.7, lakeScale * 0.1, -lakeTall * 0.65);
            ctx.quadraticCurveTo(-lakeScale * 0.5, -lakeTall * 0.75, -lakeScale * 0.8, -lakeTall * 0.6);
            ctx.stroke();
            
            ctx.restore();
        }
        
        // Rocks
        if (this.terrainDetails && this.terrainDetails.rocks) {
            for (const rock of this.terrainDetails.rocks) {
                this.drawRock(ctx, rock.x, rock.y, rock.size);
            }
        }
        
        // Render the path on the ground
        this.renderPath(ctx);
        
        // Render all trees - sorted by Y for 2.5D perspective
        if (this.terrainDetails && this.terrainDetails.trees) {
            const sortedTrees = [...this.terrainDetails.trees].sort((a, b) => a.y - b.y);
            for (const tree of sortedTrees) {
                this.drawMountainTree(ctx, tree.x, tree.y, tree.size, tree.gridX, tree.gridY);
            }
        }
        
        // Snow particles on top of everything
        this.renderSnowflakes(ctx);
    }
    
    drawFullMountainRange(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const separationLine = height * 0.55;
        
        // Create mountain range using large-scale triangular rocks
        // All mountain bottoms aligned to the separation line
        // Rendered from back to front with proper depth layering
        // Fewer mountains but full coverage with good depth
        
        ctx.globalAlpha = 1;
        
        // FIRST: Draw the two background big mountains - rendered FIRST so they're always behind
        // Third big mountain brought to background with reduced opacity - appears behind other mountains
        this.drawLargeMountainRock(ctx, width * 0.82, separationLine, 950, 0.8);
        
        // Additional mountain between middle and right - brought to background with reduced opacity
        this.drawLargeMountainRock(ctx, width * 0.66, separationLine, 750, 0.8);
        
        // Background mountains - small, faded, rendered next - creates depth
        this.drawLargeMountainRock(ctx, width * 0.12, separationLine, 190, 1.0);
        this.drawLargeMountainRock(ctx, width * 0.35, separationLine, 170, 1.0);
        this.drawLargeMountainRock(ctx, width * 0.58, separationLine, 210, 1.0);
        this.drawLargeMountainRock(ctx, width * 0.80, separationLine, 180, 1.0);
        
        // Mid-layer mountains - medium size, medium opacity - bridge foreground and background
        // Plus additional taller mountains to fill gaps and stick out between big peaks
        this.drawLargeMountainRock(ctx, width * 0.05, separationLine, 310, 1.0);
        this.drawLargeMountainRock(ctx, width * 0.28, separationLine, 340, 1.0);
        this.drawLargeMountainRock(ctx, width * 0.52, separationLine, 305, 1.0);
        this.drawLargeMountainRock(ctx, width * 0.75, separationLine, 335, 1.0);
        this.drawLargeMountainRock(ctx, width * 0.93, separationLine, 295, 1.0);
        
        // Additional taller background mountains to fill gaps and create visual continuity
        // Left side of first big mountain
        this.drawLargeMountainRock(ctx, width * 0.08, separationLine, 380, 1.0);
        
        // Between 1st and 2nd big mountains - taller to stick out between peaks
        this.drawLargeMountainRock(ctx, width * 0.32, separationLine, 420, 1.0);
        this.drawLargeMountainRock(ctx, width * 0.42, separationLine, 400, 1.0);
        
        // Between 2nd and 3rd big mountains - taller to stick out between peaks
        this.drawLargeMountainRock(ctx, width * 0.62, separationLine, 415, 1.0);
        this.drawLargeMountainRock(ctx, width * 0.70, separationLine, 390, 1.0);
        
        // Right side of last big mountain
        this.drawLargeMountainRock(ctx, width * 0.88, separationLine, 370, 1.0);
        
        // Foreground mountains - MUCH larger, fully opaque, rendered last, well spaced
        // More variation in the big two: 900, 1150 (tallest)
        this.drawLargeMountainRock(ctx, width * 0.18, separationLine, 900, 1.0);   // 1st big - 900
        this.drawLargeMountainRock(ctx, width * 0.50, separationLine, 1150, 1.0);  // 2nd big - 1150 (tallest)
    }
    
    drawLargeMountainRock(ctx, x, baseY, size, opacity) {
        ctx.globalAlpha = opacity;
        
        // Position rock so bottom sits on baseY
        const y = baseY - size * 0.15;
        
        // Triangular rock (mountain peak style)
        ctx.fillStyle = '#5a6a7a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.35, baseY);
        ctx.lineTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.35, baseY);
        ctx.closePath();
        ctx.fill();
        
        // Snow cap - perfectly fitted triangle to match peak
        // Snow base width matches the mountain width at that height level
        ctx.fillStyle = '#f5f9ff';
        ctx.globalAlpha = opacity * 0.95;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.18, y - size * 0.05);
        ctx.lineTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.18, y - size * 0.05);
        ctx.closePath();
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
    
    drawRock(ctx, x, y, size) {
        const seed = Math.floor(x + y) % 3;
        
        if (seed === 0) {
            // Rounded rock
            ctx.fillStyle = '#6a7a7a';
            ctx.beginPath();
            ctx.ellipse(x, y, size * 0.4, size * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Snow cap
            ctx.fillStyle = '#f0f4f8';
            ctx.beginPath();
            ctx.ellipse(x, y - size * 0.25, size * 0.35, size * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (seed === 1) {
            // Angular rock
            ctx.fillStyle = '#5a6a7a';
            ctx.beginPath();
            ctx.moveTo(x - size * 0.35, y + size * 0.15);
            ctx.lineTo(x, y - size * 0.4);
            ctx.lineTo(x + size * 0.35, y + size * 0.15);
            ctx.closePath();
            ctx.fill();
            
            // Snow
            ctx.fillStyle = '#f0f4f8';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(x - size * 0.1, y - size * 0.2);
            ctx.lineTo(x, y - size * 0.35);
            ctx.lineTo(x + size * 0.1, y - size * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        } else {
            // Blocky rock
            ctx.fillStyle = '#5a6a7a';
            ctx.fillRect(x - size * 0.3, y - size * 0.25, size * 0.6, size * 0.5);
            
            ctx.fillStyle = '#f0f4f8';
            ctx.globalAlpha = 0.6;
            ctx.fillRect(x - size * 0.3, y - size * 0.25, size * 0.6, size * 0.15);
            ctx.globalAlpha = 1;
        }
    }
    
    renderPath(ctx) {
        if (!this.pathPoints || this.pathPoints.length < 2) return;
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Layer 1: Dark shadow base for depth
        ctx.strokeStyle = 'rgba(40, 40, 50, 0.6)';
        ctx.lineWidth = 54;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x + 3, this.pathPoints[0].y + 3);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x + 3, this.pathPoints[i].y + 3);
        }
        ctx.stroke();
        
        // Layer 2: Main stone/packed snow path - lighter gray
        ctx.strokeStyle = '#b8c4d8';
        ctx.lineWidth = 50;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        // Layer 2b: Dark edge for natural boundary
        ctx.strokeStyle = '#7a8a9a';
        ctx.lineWidth = 50;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Layer 3: Lighter center stripe - worn from travel
        ctx.strokeStyle = '#d0dce8';
        ctx.lineWidth = 24;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        // Layer 4: Road edge highlights
        ctx.strokeStyle = '#e8f0f8';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    
    drawMountainTree(ctx, x, y, size, gridX, gridY) {
        // Pick tree variant based on grid coordinates (same as LevelBase)
        const seed = Math.floor((gridX || x) * 0.5 + (gridY || y) * 0.7) % 4;
        const scaledSize = size * 1.8;
        
        switch(seed) {
            case 0:
                this.renderMountainPineType1(ctx, x, y, scaledSize);
                break;
            case 1:
                this.renderMountainPineType2(ctx, x, y, scaledSize);
                break;
            case 2:
                this.renderMountainPineType3(ctx, x, y, scaledSize);
                break;
            case 3:
                this.renderMountainPineType4(ctx, x, y, scaledSize);
                break;
        }
    }
    
    // Mountain pine type 1 - tall with heavy snow
    renderMountainPineType1(ctx, x, y, size) {
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.45;
        
        ctx.fillStyle = '#654321';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        
        ctx.fillStyle = '#1a4d2e';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.65);
        ctx.lineTo(x + size * 0.4, y - size * 0.05);
        ctx.lineTo(x - size * 0.4, y - size * 0.05);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#2d5a3d';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.35, y + size * 0.15);
        ctx.lineTo(x - size * 0.35, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.62);
        ctx.lineTo(x + size * 0.12, y - size * 0.4);
        ctx.lineTo(x - size * 0.12, y - size * 0.4);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.15, y - size * 0.2);
        ctx.lineTo(x + size * 0.28, y);
        ctx.lineTo(x + size * 0.08, y);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x - size * 0.15, y - size * 0.2);
        ctx.lineTo(x - size * 0.28, y);
        ctx.lineTo(x - size * 0.08, y);
        ctx.closePath();
        ctx.fill();
    }
    
    // Mountain pine type 2 - medium, less snow
    renderMountainPineType2(ctx, x, y, size) {
        const trunkWidth = size * 0.18;
        const trunkHeight = size * 0.4;
        
        ctx.fillStyle = '#704020';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        
        ctx.fillStyle = '#2d5a3d';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.55);
        ctx.lineTo(x + size * 0.35, y);
        ctx.lineTo(x - size * 0.35, y);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#1a3d28';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.15, y - size * 0.3);
        ctx.lineTo(x + size * 0.15, y - size * 0.3);
        ctx.lineTo(x - size * 0.28, y + size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.5, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 2; i++) {
            const angle = (i / 2) * Math.PI;
            const px = x + Math.cos(angle - Math.PI / 2) * size * 0.25;
            const py = y - size * 0.15;
            ctx.beginPath();
            ctx.arc(px, py, size * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Mountain pine type 3 - small shrubby
    renderMountainPineType3(ctx, x, y, size) {
        const trunkWidth = size * 0.15;
        const trunkHeight = size * 0.35;
        
        ctx.fillStyle = '#8b5a3c';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        
        ctx.fillStyle = '#3d6d4d';
        ctx.beginPath();
        ctx.ellipse(x, y - size * 0.2, size * 0.3, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1a3d28';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.1, y - size * 0.2, size * 0.2, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#e8e8e8';
        ctx.beginPath();
        ctx.arc(x - size * 0.15, y - size * 0.35, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + size * 0.2, y - size * 0.15, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Mountain pine type 4 - thick sturdy, minimal snow
    renderMountainPineType4(ctx, x, y, size) {
        const trunkWidth = size * 0.24;
        const trunkHeight = size * 0.48;
        
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#3a2418';
        ctx.fillRect(x - trunkWidth * 0.15, y, trunkWidth * 0.15, trunkHeight);
        
        ctx.fillStyle = '#0d3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.7);
        ctx.lineTo(x + size * 0.42, y - size * 0.08);
        ctx.lineTo(x - size * 0.42, y - size * 0.08);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#1a5a2a';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.38);
        ctx.lineTo(x + size * 0.38, y + size * 0.1);
        ctx.lineTo(x - size * 0.38, y + size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#0d3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.38);
        ctx.lineTo(x + size * 0.38, y + size * 0.1);
        ctx.lineTo(x + size * 0.1, y + size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.68, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x + size * 0.28, y - size * 0.2, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - size * 0.28, y - size * 0.2, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
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
        ctx.fillStyle = '#f5f5f5';
        ctx.fillText(level.name, slot.x, slot.y + 80);
    }
    
    drawPlaceholderSlot(ctx, centerX, centerY, isHovered) {
        const scale = 0.45;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        
        if (isHovered) {
            ctx.fillStyle = 'rgba(200, 220, 240, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, 220, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw a simple construction/placeholder marker
        ctx.strokeStyle = '#b8c4d8';
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
        ctx.fillStyle = '#b8c4d8';
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
            ctx.fillStyle = 'rgba(200, 220, 240, 0.3)';
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
        
        ctx.restore();
    }
    
    drawLockedCastleTopDown(ctx, centerX, centerY, isHovered) {
        const scale = 0.45;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        
        if (isHovered) {
            ctx.fillStyle = 'rgba(200, 220, 240, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, 220, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw a grayed-out castle outline
        ctx.globalAlpha = 0.5;
        const castle = new Castle(0, 0, 0, 0);
        castle.drawMainWall(ctx);
        castle.drawTower(ctx, -castle.wallWidth/2 - castle.towerWidth/2, 'left');
        castle.drawTower(ctx, castle.wallWidth/2 + castle.towerWidth/2, 'right');
        castle.drawCastleBase(ctx);
        castle.drawGate(ctx);
        castle.drawCrenellations(ctx);
        ctx.globalAlpha = 1;
        
        // Lock icon
        ctx.fillStyle = '#666';
        ctx.font = 'bold 80px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒', 0, 0);
        
        ctx.restore();
    }
    
    renderTitle(ctx) {
        const canvas = this.stateManager.canvas;
        ctx.fillStyle = '#654321';
        ctx.font = 'bold 48px serif';
        ctx.textAlign = 'center';
        ctx.fillText('THE MOUNTAIN CAMPAIGN', canvas.width / 2, 60);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('THE MOUNTAIN CAMPAIGN', canvas.width / 2 - 2, 58);
    }
    

}
