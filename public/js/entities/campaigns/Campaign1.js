import { CampaignBase } from './CampaignBase.js';
import { LevelRegistry } from '../levels/LevelRegistry.js';
import { Castle } from '../buildings/Castle.js';
// Import level classes - they auto-register when imported
import { ForestLevel1 } from '../levels/Forest/ForestLevel1.js';
import { ForestLevel2 } from '../levels/Forest/ForestLevel2.js';
import { ForestLevel3 } from '../levels/Forest/ForestLevel3.js';
import { ForestLevel4 } from '../levels/Forest/ForestLevel4.js';
import { ForestLevel5 } from '../levels/Forest/ForestLevel5.js';

/**
 * Campaign1: The Forest Campaign
 * Woodland landscape with forest fortifications and natural terrain
 * Castles rendered using exact Castle.js rendering methods for consistency
 */
export class Campaign1 extends CampaignBase {
    constructor(stateManager) {
        super(stateManager);
        
        this.campaignId = 'campaign-1';
        this.campaignName = 'The Forest Campaign';
        
        // Castle instances for each level slot (for exact rendering consistency)
        this.castleInstances = {};
        
        // Animation time for castle flags
        this.animationTime = 0;
        
        // Terrain cache - generated once on enter to prevent flickering
        this.terrainDetails = null;
        this.pathPoints = [];
        
        // Falling leaves particle effect
        this.fallingLeaves = [];
        this.maxLeaves = 40;
        
        // Register campaign levels once during construction
        this.registerLevels();
    }
    
    registerLevels() {
        /**
         * Register all Forest Campaign levels.
         * Metadata is read from static levelMetadata property in each level class.
         */
        const registerLevel = (levelId, levelClass) => {
            const metadata = levelClass.levelMetadata;
            if (!metadata) {
                throw new Error(`Level ${levelId} does not have static levelMetadata property`);
            }
            LevelRegistry.registerLevel('campaign-1', levelId, levelClass, metadata);
        };

        registerLevel('level1', ForestLevel1);
        registerLevel('level2', ForestLevel2);
        registerLevel('level3', ForestLevel3);
        registerLevel('level4', ForestLevel4);
        registerLevel('level5', ForestLevel5);
    }
    
    enter() {
        // Get levels from registry for this campaign
        let registeredLevels = LevelRegistry.getLevelsByCampaign('campaign-1');
        
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
        
        // Horizontal S-curve path with more turns through the forest
        // Creates a natural winding road that curves left then right
        this.pathPoints = [
            // Entry from left at middle height
            { x: 20, y: height * 0.50 },
            
            // First curve: Gentle slope down and to the right
            { x: width * 0.08, y: height * 0.52 },
            { x: width * 0.12, y: height * 0.56 },
            { x: width * 0.16, y: height * 0.60 },
            { x: width * 0.20, y: height * 0.62 },
            
            // Bottom of first curve - heading left
            { x: width * 0.24, y: height * 0.64 },
            { x: width * 0.28, y: height * 0.66 },
            { x: width * 0.32, y: height * 0.68 },
            { x: width * 0.36, y: height * 0.69 },
            { x: width * 0.40, y: height * 0.68 },
            
            // Transition - start curving back up and right
            { x: width * 0.44, y: height * 0.64 },
            { x: width * 0.48, y: height * 0.58 },
            { x: width * 0.52, y: height * 0.50 },
            { x: width * 0.56, y: height * 0.42 },
            
            // Upper middle section - curve left turn
            { x: width * 0.60, y: height * 0.38 },
            { x: width * 0.64, y: height * 0.36 },
            { x: width * 0.68, y: height * 0.37 },
            { x: width * 0.72, y: height * 0.40 },
            
            // Start second big turn - curve down and right
            { x: width * 0.75, y: height * 0.45 },
            { x: width * 0.78, y: height * 0.52 },
            { x: width * 0.81, y: height * 0.60 },
            { x: width * 0.84, y: height * 0.66 },
            { x: width * 0.87, y: height * 0.70 },
            
            // Bottom right - curve left for exit
            { x: width * 0.90, y: height * 0.71 },
            { x: width * 0.93, y: height * 0.68 },
            { x: width * 0.96, y: height * 0.60 },
            
            // Exit right at middle height
            { x: width + 20, y: height * 0.50 }
        ];
        
        // Generate 12 level slots positioned along the path
        const totalSlots = 12;
        this.levelSlots = [];
        
        // Spread 12 castles with varied spacing - some clustered, some more spread out
        // Creates a more natural, organic distribution along the path
        const slotIndices = [1, 3, 5, 8, 10, 12, 13, 15, 17, 20, 22, 25];
        
        for (let i = 0; i < totalSlots; i++) {
            const pathIndex = Math.min(slotIndices[i], this.pathPoints.length - 1);
            const pathPoint = this.pathPoints[pathIndex];
            
            // Position castles directly on the road path (no perpendicular offset)
            // This ensures castles are in the middle of the road
            const pos = { ...pathPoint };
            
            // Use existing level or create placeholder
            if (i < this.levels.length) {
                pos.level = this.levels[i];
                pos.levelIndex = i;
            } else {
                pos.level = {
                    id: `placeholder-${i}`,
                    name: `Level ${i + 1}`,
                    unlocked: false,
                    completed: false
                };
                pos.levelIndex = i;
            }
            
            this.levelSlots.push(pos);
        }
    }
    
    generateTerrainCache() {
        // Generate all terrain variations once on enter for a dense forest look
        this.terrainDetails = {
            forests: [],
            rocks: [],
            water: [],
            trees: [],
            grassPatches: [],
            shrubs: [],
            mountains: [],
            boulders: [],
            smallRocks: []
        };
        
        const canvas = this.stateManager.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // NO MOUNTAINS - create a dense forest instead
        this.terrainDetails.mountains = [];
        
        // Generate water features - only organic/shaped lakes, no simple circles
        const waterFeatures = [
            // Top-left - tall vertical lake with jagged shore
            {x: 140, y: 150, radiusX: 55, radiusY: 90, rotation: 0.4, shapeVariant: 1},
            
            // Top-center - wide asymmetric crescent
            {x: width / 2 + 20, y: 130, radiusX: 105, radiusY: 50, rotation: -0.8, shapeVariant: 3},
            
            // Top-right - organic jagged shape (moved far from path)
            {x: width - 160, y: 240, radiusX: 80, radiusY: 85, rotation: 0.4, shapeVariant: 1},
            
            // Bottom-center - tall bean shape (moved left away from path)
            {x: width / 2 - 100, y: height - 140, radiusX: 70, radiusY: 95, rotation: -0.7, shapeVariant: 3},
            
            // Bottom-right - organic jagged shape (moved far from path)
            {x: width - 180, y: height - 120, radiusX: 85, radiusY: 90, rotation: 0.6, shapeVariant: 1}
        ];
        this.terrainDetails.water = waterFeatures;
        
        // Generate MANY more rocks scattered throughout - dense forest has lots of boulders
        const rocks = [
            {x: 120, y: 150, size: 35, type: 'large'},
            {x: 200, y: 320, size: 28, type: 'medium'},
            {x: 280, y: 450, size: 32, type: 'large'},
            {x: 360, y: 280, size: 26, type: 'medium'},
            {x: 420, y: 520, size: 30, type: 'large'},
            {x: 180, y: 600, size: 24, type: 'medium'},
            {x: 320, y: 150, size: 28, type: 'medium'},
            {x: 480, y: 380, size: 34, type: 'large'},
            {x: width - 150, y: 200, size: 30, type: 'large'},
            {x: width - 280, y: 380, size: 26, type: 'medium'},
            {x: width - 100, y: 520, size: 32, type: 'large'},
            {x: width - 400, y: 450, size: 28, type: 'medium'},
            {x: width - 220, y: 150, size: 24, type: 'medium'},
            {x: width / 2 - 180, y: 320, size: 29, type: 'medium'},
            {x: width / 2 + 150, y: 480, size: 31, type: 'large'},
            {x: width / 2 - 320, y: 500, size: 25, type: 'medium'},
            {x: width / 2 + 280, y: 250, size: 27, type: 'medium'},
            {x: 100, y: height - 150, size: 33, type: 'large'},
            {x: 350, y: height - 200, size: 28, type: 'medium'},
            {x: width - 200, y: height - 180, size: 30, type: 'large'},
            {x: width / 2, y: height - 220, size: 26, type: 'medium'},
            {x: 520, y: 150, size: 29, type: 'medium'},
            {x: width - 450, y: 320, size: 32, type: 'large'},
            {x: 250, y: 250, size: 25, type: 'medium'},
            {x: width - 320, y: 600, size: 28, type: 'medium'}
        ];
        
        this.terrainDetails.rocks = rocks;
        
        // Generate scattered trees with natural distribution - very dense forest
        const scatteredTrees = [];
        const waterRegions = this.terrainDetails.water;
        const minTreeSpacing = 40; // Even smaller spacing for much denser forest
        
        // Massive number of placement attempts to create very dense forest
        const attempts = 15000;
        for (let attempt = 0; attempt < attempts; attempt++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            
            // Check if too close to water - allow trees closer to lakes
            let tooCloseToWater = false;
            for (const water of waterRegions) {
                const dist = Math.hypot(x - water.x, y - water.y);
                const minDist = Math.max(water.radiusX, water.radiusY) + 35;
                if (dist < minDist) {
                    tooCloseToWater = true;
                    break;
                }
            }
            if (tooCloseToWater) continue;
            
            // Check if too close to road path
            let tooCloseToRoad = false;
            for (const roadPoint of this.pathPoints) {
                const dist = Math.hypot(x - roadPoint.x, y - roadPoint.y);
                if (dist < 75) {
                    tooCloseToRoad = true;
                    break;
                }
            }
            if (tooCloseToRoad) continue;
            
            // Check if too close to other scattered trees
            let tooCloseToOtherTree = false;
            for (const tree of scatteredTrees) {
                const dist = Math.hypot(x - tree.x, y - tree.y);
                if (dist < minTreeSpacing) {
                    tooCloseToOtherTree = true;
                    break;
                }
            }
            if (tooCloseToOtherTree) continue;
            
            scatteredTrees.push({
                x: x,
                y: y,
                size: 32 + Math.random() * 40, // Much bigger trees (32-72px)
                variant: Math.floor(Math.random() * 6)
            });
        }
        this.terrainDetails.trees = scatteredTrees;
        
        // Remove forest clusters - use only scattered random trees for natural look
        // This prevents the circular clustering pattern
        this.terrainDetails.forests = [];
    }
    
    
    renderBackground(ctx, canvas) {
        // Base grass - render once
        ctx.fillStyle = '#4a9d4a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    renderTerrain(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Render water features FIRST (behind everything)
        if (this.terrainDetails && this.terrainDetails.water) {
            for (const water of this.terrainDetails.water) {
                this.drawWater(ctx, water);
            }
        }
        
        // Render rocks
        if (this.terrainDetails && this.terrainDetails.rocks) {
            for (const rock of this.terrainDetails.rocks) {
                this.drawRock(ctx, rock.x, rock.y, rock.size);
            }
        }
        
        // Render small rocks for ground detail
        if (this.terrainDetails && this.terrainDetails.smallRocks) {
            for (const rock of this.terrainDetails.smallRocks) {
                this.drawSmallRock(ctx, rock.x, rock.y, rock.size, rock.opacity);
            }
        }
        
        // Render the path on the ground
        this.renderPath(ctx);
        
        // Render all trees on top of the path - sorted by Y for 2.5D perspective
        // Lower Y (top of screen) renders first, appears behind
        // Higher Y (bottom of screen) renders last, appears in front
        if (this.terrainDetails && this.terrainDetails.trees) {
            const sortedTrees = [...this.terrainDetails.trees].sort((a, b) => a.y - b.y);
            for (const tree of sortedTrees) {
                this.drawTreeTopDown(ctx, tree.x, tree.y, tree.size, tree.variant);
            }
        }
        
        // Render falling leaves particle effect on top
        this.updateAndRenderFallingLeaves(ctx);
    }
    
    
    drawSmallRock(ctx, x, y, size, opacity) {
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#8b7d6b';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Small highlight
        ctx.fillStyle = 'rgba(150, 140, 120, 0.6)';
        ctx.beginPath();
        ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    
    drawWater(ctx, water) {
        const { x, y, radiusX, radiusY, rotation, shapeVariant } = water;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        // Water depth shadow
        ctx.fillStyle = '#0f3a4a';
        ctx.beginPath();
        
        // Draw differently shaped water based on variant
        if (shapeVariant === 0) {
            // Simple ellipse
            ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
        } else if (shapeVariant === 1) {
            // Irregular jagged shore
            const points = [];
            for (let i = 0; i < 32; i++) {
                const angle = (i / 32) * Math.PI * 2;
                const dist = (Math.sin(i * 0.5) * 0.15 + 0.9);
                const px = Math.cos(angle) * radiusX * dist;
                const py = Math.sin(angle) * radiusY * dist;
                points.push({x: px, y: py});
            }
            ctx.moveTo(points[0].x, points[0].y);
            for (const pt of points) ctx.lineTo(pt.x, pt.y);
            ctx.closePath();
        } else if (shapeVariant === 2) {
            // Crescent/curved shape
            ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
            ctx.moveTo(radiusX * 0.6, 0);
            ctx.arc(radiusX * 0.3, 0, radiusX * 0.4, 0, Math.PI * 2);
        } else {
            // Bean-like organic shape
            ctx.ellipse(-radiusX * 0.2, 0, radiusX * 0.8, radiusY, 0, 0, Math.PI * 2);
            ctx.moveTo(radiusX * 0.2, 0);
            ctx.ellipse(radiusX * 0.2, 0, radiusX * 0.6, radiusY * 0.8, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        
        // Main water color with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(radiusX, radiusY));
        gradient.addColorStop(0, '#2a7fa0');
        gradient.addColorStop(0.6, '#1e5f7a');
        gradient.addColorStop(1, '#0f3a4a');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        
        // Redraw shape for water fill
        if (shapeVariant === 0) {
            ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
        } else if (shapeVariant === 1) {
            const points = [];
            for (let i = 0; i < 32; i++) {
                const angle = (i / 32) * Math.PI * 2;
                const dist = (Math.sin(i * 0.5) * 0.15 + 0.9);
                const px = Math.cos(angle) * radiusX * dist;
                const py = Math.sin(angle) * radiusY * dist;
                points.push({x: px, y: py});
            }
            ctx.moveTo(points[0].x, points[0].y);
            for (const pt of points) ctx.lineTo(pt.x, pt.y);
            ctx.closePath();
        } else if (shapeVariant === 2) {
            ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
            ctx.moveTo(radiusX * 0.6, 0);
            ctx.arc(radiusX * 0.3, 0, radiusX * 0.4, 0, Math.PI * 2);
        } else {
            ctx.ellipse(-radiusX * 0.2, 0, radiusX * 0.8, radiusY, 0, 0, Math.PI * 2);
            ctx.moveTo(radiusX * 0.2, 0);
            ctx.ellipse(radiusX * 0.2, 0, radiusX * 0.6, radiusY * 0.8, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        
        // Water shimmer - subtle ripples
        ctx.fillStyle = 'rgba(100, 200, 255, 0.15)';
        ctx.beginPath();
        ctx.ellipse(-radiusX * 0.3, -radiusY * 0.3, radiusX * 0.5, radiusY * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Water highlights on shore
        ctx.fillStyle = 'rgba(150, 220, 255, 0.1)';
        ctx.beginPath();
        ctx.ellipse(radiusX * 0.2, radiusY * 0.2, radiusX * 0.4, radiusY * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Water edge - subtle wave effect
        ctx.strokeStyle = 'rgba(100, 180, 220, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX * 0.95, radiusY * 0.95, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawRock(ctx, x, y, size) {
        // Use level-based rock rendering with seed-based variation
        // Rocks on campaign map don't have grid coordinates, so use position-based seed
        const seed = Math.floor(x * 0.5 + y * 0.7) % 4;
        switch(seed) {
            case 0:
                this.drawRockType1(ctx, x, y, size);
                break;
            case 1:
                this.drawRockType2(ctx, x, y, size);
                break;
            case 2:
                this.drawRockType3(ctx, x, y, size);
                break;
            default:
                this.drawRockType4(ctx, x, y, size);
        }
    }

    drawRockType1(ctx, x, y, size) {
        // Large rough mountain-like rock with better depth and integration
        
        // Create layered shadow for depth effect
        ctx.fillStyle = 'rgba(30, 25, 20, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.36, y - size * 0.22);
        ctx.lineTo(x - size * 0.21, y - size * 0.38);
        ctx.lineTo(x + size * 0.06, y - size * 0.43);
        ctx.lineTo(x + size * 0.36, y - size * 0.13);
        ctx.lineTo(x + size * 0.35, y + size * 0.28);
        ctx.lineTo(x + 1, y + size * 0.42);
        ctx.lineTo(x - size * 0.34, y + size * 0.23);
        ctx.closePath();
        ctx.fill();
        
        // Main mountain body with multiple shades
        ctx.fillStyle = '#505050';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.35, y - size * 0.25);
        ctx.lineTo(x - size * 0.2, y - size * 0.4);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x + size * 0.35, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x, y + size * 0.38);
        ctx.lineTo(x - size * 0.35, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Right shadow side for dimension
        ctx.fillStyle = '#343434';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x + size * 0.35, y - size * 0.15);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x + size * 0.08, y - size * 0.3);
        ctx.lineTo(x + size * 0.02, y + size * 0.32);
        ctx.closePath();
        ctx.fill();
        
        // Light highlights on top faces
        ctx.fillStyle = '#8a8a8a';
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.sin(i * 1.3 + x * 0.01) - 0.5) * size * 0.25;
            const offsetY = (Math.cos(i * 1.3 + y * 0.01) - 0.5) * size * 0.15;
            ctx.beginPath();
            ctx.arc(x + offsetX, y - size * 0.15 + offsetY, size * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Weathering spots and moss - spread naturally
        ctx.fillStyle = 'rgba(90, 110, 70, 0.4)';
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.sin(i * 1.7 + x * 0.015) - 0.5) * size * 0.38;
            const offsetY = (Math.cos(i * 1.7 + y * 0.015) - 0.5) * size * 0.28;
            const spotSize = size * (0.08 + Math.abs(Math.sin(i * 0.7)) * 0.04);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Rock cracks/texture
        ctx.strokeStyle = 'rgba(40, 35, 30, 0.3)';
        ctx.lineWidth = 1.5;
        const crackCount = 2 + Math.floor(Math.abs(Math.sin(x * 0.02)) * 2);
        for (let i = 0; i < crackCount; i++) {
            const startX = (Math.sin(i * 0.7 + x * 0.01) - 0.5) * size * 0.3;
            const startY = (Math.cos(i * 0.7 + y * 0.01) - 0.5) * size * 0.2;
            const endX = startX + (Math.sin(i * 1.2 + x * 0.02) - 0.5) * size * 0.2;
            const endY = startY + (Math.cos(i * 1.2 + y * 0.02) - 0.5) * size * 0.15;
            ctx.beginPath();
            ctx.moveTo(x + startX, y + startY);
            ctx.lineTo(x + endX, y + endY);
            ctx.stroke();
        }
        
        // Outline for definition
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.35, y - size * 0.25);
        ctx.lineTo(x - size * 0.2, y - size * 0.4);
        ctx.lineTo(x + size * 0.05, y - size * 0.45);
        ctx.lineTo(x + size * 0.35, y - size * 0.15);
        ctx.lineTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x, y + size * 0.38);
        ctx.lineTo(x - size * 0.35, y + size * 0.2);
        ctx.closePath();
        ctx.stroke();
        
        // Natural growth at base - connects mountain to ground
        ctx.fillStyle = 'rgba(100, 120, 80, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.32, size * 0.4, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRockType2(ctx, x, y, size) {
        // Rounded mountain form with better integration and detail
        
        // Shadow base for grounding
        ctx.fillStyle = 'rgba(30, 25, 20, 0.35)';
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, size * 0.39, 0, Math.PI * 2);
        ctx.fill();
        
        // Main rounded mountain body
        ctx.fillStyle = '#595959';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.38, 0, Math.PI * 2);
        ctx.fill();
        
        // Darker overlay for form and depth
        ctx.fillStyle = '#414141';
        ctx.beginPath();
        ctx.arc(x + size * 0.12, y + size * 0.12, size * 0.34, 0, Math.PI * 2);
        ctx.fill();
        
        // Light highlights on upper portions
        ctx.fillStyle = '#9a9a9a';
        ctx.beginPath();
        ctx.arc(x - size * 0.15, y - size * 0.2, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y - size * 0.05, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // Weathering and moss spread naturally across the mountain
        ctx.fillStyle = 'rgba(85, 105, 65, 0.35)';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const distance = size * (0.15 + Math.abs(Math.sin(i * 0.5)) * 0.12);
            const vx = x + Math.cos(angle) * distance;
            const vy = y + Math.sin(angle) * distance;
            const spotSize = size * (0.09 + Math.abs(Math.cos(i * 0.7)) * 0.05);
            ctx.beginPath();
            ctx.arc(vx, vy, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Darker moss in crevices
        ctx.fillStyle = 'rgba(60, 80, 45, 0.4)';
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3 + 0.3) * Math.PI * 2;
            const vx = x + Math.cos(angle) * size * 0.2;
            const vy = y + Math.sin(angle) * size * 0.2;
            ctx.beginPath();
            ctx.arc(vx, vy, size * 0.07, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Subtle cracks for texture
        ctx.strokeStyle = 'rgba(40, 35, 30, 0.25)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(
                x + Math.cos(angle) * size * 0.3,
                y + Math.sin(angle) * size * 0.3
            );
            ctx.stroke();
        }
        
        // Define outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.38, 0, Math.PI * 2);
        ctx.stroke();
        
        // Natural growth at base
        ctx.fillStyle = 'rgba(100, 120, 80, 0.25)';
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.34, size * 0.42, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRockType3(ctx, x, y, size) {
        // Jagged angular mountain with better weathering and integration
        
        // Shadow base
        ctx.fillStyle = 'rgba(30, 25, 20, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.36, y - size * 0.09);
        ctx.lineTo(x - size * 0.1, y - size * 0.37);
        ctx.lineTo(x + size * 0.32, y - size * 0.17);
        ctx.lineTo(x + size * 0.34, y + size * 0.28);
        ctx.lineTo(x - size * 0.3, y + size * 0.25);
        ctx.closePath();
        ctx.fill();
        
        // Main rocky body
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.35, y - size * 0.12);
        ctx.lineTo(x - size * 0.08, y - size * 0.4);
        ctx.lineTo(x + size * 0.30, y - size * 0.2);
        ctx.lineTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x - size * 0.28, y + size * 0.22);
        ctx.closePath();
        ctx.fill();
        
        // Right side shadow
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.30, y - size * 0.2);
        ctx.lineTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x + size * 0.1, y + size * 0.15);
        ctx.lineTo(x + size * 0.05, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        
        // Highlight faces
        ctx.fillStyle = '#7a7a7a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.35, y - size * 0.12);
        ctx.lineTo(x - size * 0.08, y - size * 0.4);
        ctx.lineTo(x - size * 0.15, y - size * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // Light moss and weathering
        ctx.fillStyle = 'rgba(80, 100, 60, 0.35)';
        for (let i = 0; i < 4; i++) {
            const offsetX = (Math.sin(i * 1.5 + x * 0.01) - 0.5) * size * 0.32;
            const offsetY = (Math.cos(i * 1.5 + y * 0.01) - 0.5) * size * 0.22;
            const spotSize = size * (0.09 + Math.abs(Math.cos(i * 0.6)) * 0.04);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.35, y - size * 0.12);
        ctx.lineTo(x - size * 0.08, y - size * 0.4);
        ctx.lineTo(x + size * 0.30, y - size * 0.2);
        ctx.lineTo(x + size * 0.32, y + size * 0.25);
        ctx.lineTo(x - size * 0.28, y + size * 0.22);
        ctx.closePath();
        ctx.stroke();
        
        // Natural growth at base
        ctx.fillStyle = 'rgba(100, 120, 80, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.28, size * 0.38, size * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRockType4(ctx, x, y, size) {
        // Massive blocky boulder with strong presence
        
        // Shadow base
        ctx.fillStyle = 'rgba(30, 25, 20, 0.35)';
        ctx.beginPath();
        ctx.ellipse(x + 1, y + 1, size * 0.4, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main blocky form
        ctx.fillStyle = '#5a5a5a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.38, y - size * 0.1);
        ctx.lineTo(x - size * 0.12, y - size * 0.42);
        ctx.lineTo(x + size * 0.28, y - size * 0.28);
        ctx.lineTo(x + size * 0.38, y + size * 0.05);
        ctx.lineTo(x + size * 0.22, y + size * 0.3);
        ctx.lineTo(x - size * 0.32, y + size * 0.24);
        ctx.closePath();
        ctx.fill();
        
        // Right side darker shade
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.28, y - size * 0.28);
        ctx.lineTo(x + size * 0.38, y + size * 0.05);
        ctx.lineTo(x + size * 0.15, y - size * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // Top light face
        ctx.fillStyle = '#8a8a8a';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.38, y - size * 0.1);
        ctx.lineTo(x - size * 0.12, y - size * 0.42);
        ctx.lineTo(x + size * 0.05, y - size * 0.32);
        ctx.lineTo(x - size * 0.18, y - size * 0.08);
        ctx.closePath();
        ctx.fill();
        
        // Weathering spots and moss
        ctx.fillStyle = 'rgba(85, 105, 65, 0.4)';
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.sin(i * 1.4 + x * 0.01) - 0.5) * size * 0.36;
            const offsetY = (Math.cos(i * 1.4 + y * 0.01) - 0.5) * size * 0.26;
            const spotSize = size * (0.1 + Math.abs(Math.sin(i * 0.8)) * 0.04);
            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Outline
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.38, y - size * 0.1);
        ctx.lineTo(x - size * 0.12, y - size * 0.42);
        ctx.lineTo(x + size * 0.28, y - size * 0.28);
        ctx.lineTo(x + size * 0.38, y + size * 0.05);
        ctx.lineTo(x + size * 0.22, y + size * 0.3);
        ctx.lineTo(x - size * 0.32, y + size * 0.24);
        ctx.closePath();
        ctx.stroke();
        
        // Natural growth at base
        ctx.fillStyle = 'rgba(100, 120, 80, 0.35)';
        ctx.beginPath();
        ctx.ellipse(x, y + size * 0.3, size * 0.42, size * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawTreeTopDown(ctx, x, y, size, variant = 0) {
        // Use level-based tree rendering with seed-based variation
        // Seed based on position for consistent variation
        const seed = Math.floor(x + y) % 6;
        const treeVariant = seed;
        
        switch(treeVariant) {
            case 0:
                this.drawTreeType1(ctx, x, y, size);
                break;
            case 1:
                this.drawTreeType2(ctx, x, y, size);
                break;
            case 2:
                this.drawTreeType3(ctx, x, y, size);
                break;
            case 3:
                this.drawTreeType4(ctx, x, y, size);
                break;
            case 4:
                this.drawTreeType5(ctx, x, y, size);
                break;
            default:
                this.drawTreeType6(ctx, x, y, size);
        }
    }

    drawTreeType1(ctx, x, y, size) {
        const trunkWidth = size * 0.25;
        const trunkHeight = size * 0.5;
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(x, y, trunkWidth * 0.5, trunkHeight);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.35, y - size * 0.1);
        ctx.lineTo(x - size * 0.35, y - size * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.35);
        ctx.lineTo(x + size * 0.3, y + size * 0.05);
        ctx.lineTo(x - size * 0.3, y + size * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.15);
        ctx.lineTo(x + size * 0.25, y + size * 0.2);
        ctx.lineTo(x - size * 0.25, y + size * 0.2);
        ctx.closePath();
        ctx.fill();
    }

    drawTreeType2(ctx, x, y, size) {
        const trunkWidth = size * 0.2;
        const trunkHeight = size * 0.4;
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        ctx.fillStyle = '#8B5A3C';
        ctx.fillRect(x - trunkWidth * 0.5 + trunkWidth * 0.6, y, trunkWidth * 0.4, trunkHeight);
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.35, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTreeType3(ctx, x, y, size) {
        // Sparse tree with distinct branches
        const trunkWidth = size * 0.22;
        ctx.fillStyle = '#795548';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.2, trunkWidth, size * 0.6);
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(x + trunkWidth * 0.25, y, trunkWidth * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x - size * 0.28, y - size * 0.35, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x + size * 0.25, y - size * 0.25, size * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x - size * 0.08, y + size * 0.1, size * 0.22, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTreeType4(ctx, x, y, size) {
        // Compact round tree
        const trunkWidth = size * 0.18;
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.15, trunkWidth, size * 0.45);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.35, size * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.08, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y + size * 0.15, size * 0.32, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTreeType5(ctx, x, y, size) {
        // Tall conical tree
        const trunkWidth = size * 0.16;
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.05, trunkWidth, size * 0.55);
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.55);
        ctx.lineTo(x + size * 0.32, y - size * 0.15);
        ctx.lineTo(x - size * 0.32, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.36, y + size * 0.08);
        ctx.lineTo(x - size * 0.36, y + size * 0.08);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.arc(x, y + size * 0.15, size * 0.28, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTreeType6(ctx, x, y, size) {
        // Wide spreading tree
        const trunkWidth = size * 0.2;
        ctx.fillStyle = '#795548';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.1, trunkWidth, size * 0.5);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.25, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + size * 0.2, y - size * 0.2, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.15, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + size * 0.2, y - size * 0.15, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2d8b3f';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderPath(ctx) {
        if (!this.pathPoints || this.pathPoints.length < 2) return;
        
        // Layer 1: Dark shadow base for depth and grounding
        ctx.strokeStyle = 'rgba(40, 30, 25, 0.5)';
        ctx.lineWidth = 50;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x + 3, this.pathPoints[0].y + 3);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x + 3, this.pathPoints[i].y + 3);
        }
        ctx.stroke();
        
        // Layer 2: Main dirt road color
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 46;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        // Layer 2b: Dark grass border - natural edge of road
        ctx.strokeStyle = '#5a5038';
        ctx.lineWidth = 48;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Layer 3: Lighter center stripe - worn from foot traffic
        ctx.strokeStyle = '#a8927a';
        ctx.lineWidth = 22;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        // Layer 4: Road edge highlights - natural weathering
        ctx.strokeStyle = '#b5a484';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x - 19, this.pathPoints[0].y - 19);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x - 19, this.pathPoints[i].y - 19);
        }
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x + 19, this.pathPoints[0].y + 19);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x + 19, this.pathPoints[i].y + 19);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    
    renderLevelSlot(ctx, index) {
        const slot = this.levelSlots[index];
        if (!slot) return;
        
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
        ctx.fillStyle = '#1a0f05';
        ctx.fillText(level.name, slot.x, slot.y + 80);
    }
    
    drawPlaceholderSlot(ctx, centerX, centerY, isHovered) {
        const scale = 0.45;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        
        if (isHovered) {
            ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, 220, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw a simple construction/placeholder marker
        ctx.strokeStyle = '#a89878';
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
        ctx.fillStyle = '#a89878';
        ctx.globalAlpha = 0.6;
        ctx.fillText('?', 0, -10);
        ctx.globalAlpha = 1;
        
        ctx.restore();
    }
    
    // Castle rendering methods copied from Castle.js for exact visual consistency
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
    
    drawCastleTopDown(ctx, centerX, centerY, isHovered) {
        const scale = this.castleScale;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        
        if (isHovered) {
            ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 220, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw in order: base, walls, towers, gate, crenellations (no flags)
        this.drawCastleBase(ctx);
        this.drawMainWall(ctx);
        this.drawTowers(ctx);
        this.drawGate(ctx);
        this.drawCrenellations(ctx);
        
        ctx.restore();
    }
    
    drawCastleBase(ctx) {
        const baseWidth = 280;
        const baseHeight = 20;
        const baseY = 50; // Bottom of castle
        
        // Base shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-baseWidth / 2, baseY, baseWidth, baseHeight);
        
        // Main base
        const gradient = ctx.createLinearGradient(-baseWidth / 2, baseY, baseWidth / 2, baseY);
        gradient.addColorStop(0, '#5a4a3a');
        gradient.addColorStop(0.5, '#7a6a5a');
        gradient.addColorStop(1, '#5a4a3a');
        ctx.fillStyle = gradient;
        ctx.fillRect(-baseWidth / 2, baseY, baseWidth, baseHeight);
        
        // Stone block pattern on base
        const blockSize = 35;
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 1;
        for (let x = -baseWidth / 2; x < baseWidth / 2; x += blockSize) {
            ctx.strokeRect(x, baseY, blockSize, baseHeight);
        }
    }
    
    drawMainWall(ctx) {
        const wallWidth = 220;
        const wallHeight = 90;
        const wallTopY = -wallHeight / 2;
        const wallBottomY = wallHeight / 2;
        
        // Wall gradient
        const gradient = ctx.createLinearGradient(0, wallTopY, 0, wallBottomY);
        gradient.addColorStop(0, '#8b7d6b');
        gradient.addColorStop(0.5, '#9b8d7b');
        gradient.addColorStop(1, '#7b6d5b');
        ctx.fillStyle = gradient;
        ctx.fillRect(-wallWidth / 2, wallTopY, wallWidth, wallHeight);
        
        // Stone brick pattern
        const brickHeight = 18;
        const brickWidth = 35;
        ctx.strokeStyle = '#5b4d3b';
        ctx.lineWidth = 1;
        
        for (let row = 0; row < Math.ceil(wallHeight / brickHeight); row++) {
            const offset = (row % 2) * brickWidth * 0.5;
            for (let col = 0; col < Math.ceil(wallWidth / brickWidth) + 1; col++) {
                const x = -wallWidth / 2 + col * brickWidth + offset;
                const y = wallTopY + row * brickHeight;
                ctx.strokeRect(x, y, brickWidth, brickHeight);
            }
        }
        
        // Brick highlights
        ctx.strokeStyle = '#aba98b';
        ctx.lineWidth = 0.5;
        for (let row = 0; row < Math.ceil(wallHeight / brickHeight); row++) {
            const offset = (row % 2) * brickWidth * 0.5;
            for (let col = 0; col < Math.ceil(wallWidth / brickWidth) + 1; col++) {
                const x = -wallWidth / 2 + col * brickWidth + offset;
                const y = wallTopY + row * brickHeight;
                ctx.strokeRect(x + 2, y + 2, brickWidth - 4, brickHeight - 4);
            }
        }
    }
    
    drawTowers(ctx) {
        const towerX = [-110, 110];
        const towerHeight = 75;
        const towerTopY = -towerHeight; // Goes UP (negative)
        const towerSize = 38;
        
        for (const x of towerX) {
            // Tower shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(x - towerSize / 2, -5, towerSize, towerHeight + 5);
            
            // Tower
            const gradient = ctx.createLinearGradient(x - towerSize / 2, towerTopY, x + towerSize / 2, towerTopY);
            gradient.addColorStop(0, '#6b5d4b');
            gradient.addColorStop(0.5, '#8b7d6b');
            gradient.addColorStop(1, '#6b5d4b');
            ctx.fillStyle = gradient;
            ctx.fillRect(x - towerSize / 2, towerTopY, towerSize, towerHeight);
            
            // Tower brick pattern
            ctx.strokeStyle = '#4b3d2b';
            ctx.lineWidth = 1;
            const brickH = 15;
            for (let row = 0; row < Math.ceil(towerHeight / brickH); row++) {
                for (let col = 0; col < 2; col++) {
                    ctx.strokeRect(
                        x - towerSize / 2 + col * towerSize / 2,
                        towerTopY + row * brickH,
                        towerSize / 2,
                        brickH
                    );
                }
            }
        }
    }
    
    drawGate(ctx) {
        const gateWidth = 36;
        const gateHeight = 55;
        const gateY = 0; // Middle of wall (from -45 to 45)
        
        // Gate door - dark brown
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(-gateWidth / 2, gateY - gateHeight / 2, gateWidth, gateHeight);
        
        // Gate center seam
        ctx.strokeStyle = '#2a1a0a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, gateY - gateHeight / 2);
        ctx.lineTo(0, gateY + gateHeight / 2);
        ctx.stroke();
        
        // Metal bands on gate
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            const y = gateY - gateHeight / 2 + (gateHeight / 4) * (i + 0.5);
            ctx.beginPath();
            ctx.moveTo(-gateWidth / 2, y);
            ctx.lineTo(gateWidth / 2, y);
            ctx.stroke();
        }
        
        // Metal studs on gate
        ctx.fillStyle = '#d4af37';
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 2; col++) {
                const x = -gateWidth / 2 + gateWidth / 3 + col * gateWidth / 3;
                const y = gateY - gateHeight / 2 + gateHeight / 5 + row * gateHeight / 5;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Golden knocker
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(0, gateY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a4802a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, gateY, 3.5, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawCrenellations(ctx) {
        const wallWidth = 220;
        const crenelHeight = 12;
        const crenelWidth = 10;
        const spacing = 14;
        const crenelY = -45; // Top of wall (-90/2)
        
        ctx.fillStyle = '#8b7d6b';
        const crenelCount = Math.floor(wallWidth / spacing);
        for (let i = 0; i < crenelCount; i++) {
            const x = -wallWidth / 2 + i * spacing;
            ctx.fillRect(x, crenelY - crenelHeight, crenelWidth, crenelHeight);
        }
        
        // Crenel shadows
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < crenelCount; i++) {
            const x = -wallWidth / 2 + i * spacing;
            ctx.fillRect(x + crenelWidth * 0.3, crenelY - crenelHeight + crenelHeight * 0.4, crenelWidth * 0.4, crenelHeight * 0.6);
        }
    }
    
    drawFlags(ctx) {
        // Flags removed - using exact castle rendering without flag poles
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
    
    renderTitle(ctx, canvas) {
        ctx.font = 'bold 36px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1a0f05';
        ctx.fillText(this.campaignName.toUpperCase(), canvas.width / 2, 50);
    }
    
    update(deltaTime) {
        // Update animation for castle flags
        this.animationTime += deltaTime;
        
        // Update falling leaves
        this.updateFallingLeaves(deltaTime);
    }
    
    updateFallingLeaves(deltaTime) {
        // Spawn new leaves occasionally
        if (this.fallingLeaves.length < this.maxLeaves && Math.random() < 0.15) {
            const canvas = this.stateManager.canvas;
            this.fallingLeaves.push({
                x: Math.random() * canvas.width,
                y: -10,
                vx: (Math.random() - 0.5) * 30,
                vy: 40 + Math.random() * 40,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 8,
                swayPhase: Math.random() * Math.PI * 2,
                color: Math.random() > 0.5 ? '#d4a574' : '#a68d5b'
            });
        }
        
        const canvas = this.stateManager.canvas;
        
        // Update leaves
        for (let i = this.fallingLeaves.length - 1; i >= 0; i--) {
            const leaf = this.fallingLeaves[i];
            
            leaf.y += leaf.vy * deltaTime;
            leaf.swayPhase += deltaTime * 2;
            leaf.x += leaf.vx * deltaTime + Math.sin(leaf.swayPhase) * 20 * deltaTime;
            leaf.rotation += leaf.rotationSpeed * deltaTime;
            
            // Remove leaves that have fallen off screen
            if (leaf.y > canvas.height + 10 || leaf.x < -10 || leaf.x > canvas.width + 10) {
                this.fallingLeaves.splice(i, 1);
            }
        }
    }
    
    updateAndRenderFallingLeaves(ctx) {
        const canvas = this.stateManager.canvas;
        
        for (const leaf of this.fallingLeaves) {
            ctx.save();
            ctx.translate(leaf.x, leaf.y);
            ctx.rotate(leaf.rotation);
            
            // Draw leaf shape
            ctx.fillStyle = leaf.color;
            ctx.globalAlpha = 0.7;
            
            // Simple leaf shape - ellipse with point
            ctx.beginPath();
            ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Leaf vein
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.lineTo(6, 0);
            ctx.stroke();
            
            ctx.globalAlpha = 1;
            ctx.restore();
        }
    }
}
