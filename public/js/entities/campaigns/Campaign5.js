import { CampaignBase } from './CampaignBase.js';
import { LevelRegistry } from '../levels/LevelRegistry.js';
// Import test levels from Campaign5 folder
import { SandboxLevel } from '../levels/Campaign5/SandboxLevel.js';
import { Level6 } from '../levels/Campaign5/Level2.js';
import { Level8 } from '../levels/Campaign5/Level8.js';

/**
 * Campaign5: Level Testing Campaign
 * A sandbox campaign with all slots available for level testing purposes.
 * Uses the same visual style as Campaign1 (castles, winding path, terrain)
 */
export class Campaign5 extends CampaignBase {
    constructor(stateManager) {
        super(stateManager);
        
        this.campaignId = 'campaign-5';
        this.campaignName = 'Level Testing Campaign';
        
        // Castle rendering scale for campaign map
        this.castleScale = 0.5;
        
        // Animation time for castle flags
        this.animationTime = 0;
        
        // Terrain cache - generated once on enter to prevent flickering
        this.terrainDetails = null;
        this.pathPoints = [];
        
        // Register campaign levels once during construction
        this.registerLevels();
    }
    
    registerLevels() {
        /**
         * Register all Campaign 5 sandbox test levels.
         * Level metadata is read from static levelMetadata properties in each level class.
         */
        const registerLevel = (levelId, levelClass) => {
            const metadata = levelClass.levelMetadata;
            if (!metadata) {
                throw new Error(`Level ${levelId} does not have static levelMetadata property`);
            }
            LevelRegistry.registerLevel('campaign-5', levelId, levelClass, metadata);
        };

        // Register sandbox level in multiple slots for testing
        // Each SandboxLevel instance uses the same static metadata (Sandbox Mode, Endless)
        registerLevel('sandbox-test-1', SandboxLevel);
        registerLevel('spiraling-into-control', Level6);
        registerLevel('My Level', Level8);
        registerLevel('sandbox-test-4', SandboxLevel);
        registerLevel('sandbox-test-5', SandboxLevel);
        registerLevel('sandbox-test-6', SandboxLevel);
        registerLevel('sandbox-test-7', SandboxLevel);
        registerLevel('sandbox-test-8', SandboxLevel);
    }
    
    enter() {
        // Get levels from registry for this campaign
        let registeredLevels = LevelRegistry.getLevelsByCampaign('campaign-5');
        
        // Apply unlock status from save data - ALL LEVELS UNLOCKED FOR TESTING
        const saveData = this.stateManager.currentSaveData;
        this.levels = registeredLevels.map(level => ({
            id: level.id,
            name: level.name,
            difficulty: level.difficulty,
            unlocked: true, // All levels unlocked for testing
            // Mark as sandbox if it's a sandbox test or endless difficulty
            type: (level.id.includes('sandbox') || level.difficulty === 'Endless') ? 'sandbox' : 'campaign'
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
        
        // Define a more winding, natural path with multiple loops and turns
        // Keep all points well within canvas bounds for level placement
        this.pathPoints = [
            // Left edge entry
            { x: -20, y: height * 0.6 },
            { x: width * 0.08, y: height * 0.65 },    // Level 1 area - bottom left
            
            // First loop - wind left to right bottom
            { x: width * 0.15, y: height * 0.75 },
            { x: width * 0.22, y: height * 0.68 },
            { x: width * 0.28, y: height * 0.58 },    // Level 2 area
            
            // Wind back and up
            { x: width * 0.35, y: height * 0.48 },
            { x: width * 0.38, y: height * 0.35 },    // Level 3 area - middle left
            
            // Loop up and around
            { x: width * 0.45, y: height * 0.28 },
            { x: width * 0.52, y: height * 0.22 },    // Level 4 area - top middle
            { x: width * 0.60, y: height * 0.28 },
            
            // Wind down to right side
            { x: width * 0.68, y: height * 0.38 },    // Level 5 area - middle right
            { x: width * 0.75, y: height * 0.48 },
            { x: width * 0.80, y: height * 0.55 },    // Level 6 area - lower right
            
            // Final wind up and across
            { x: width * 0.85, y: height * 0.62 },
            { x: width * 0.90, y: height * 0.68 },    // Level 7 area
            { x: width * 0.95, y: height * 0.60 },    // Level 8 area - approaching exit
            
            // Right edge exit
            { x: width + 20, y: height * 0.60 }
        ];
        
        // Generate 8 level slots - specifically positioned along key path points
        const totalSlots = 8;
        this.levelSlots = [];
        
        // Define specific indices for level placement on the path for better control
        const levelPathIndices = [1, 4, 6, 8, 10, 12, 14, 15];
        
        for (let i = 0; i < totalSlots; i++) {
            // Interpolate between two path points for level placement
            const pathIndex = levelPathIndices[i];
            let pos;
            
            if (pathIndex < this.pathPoints.length) {
                pos = { ...this.pathPoints[pathIndex] };
            } else {
                const t = i / (totalSlots - 1);
                pos = this.getPointOnPath(t);
            }
            
            // Use existing level or create placeholder
            if (i < this.levels.length) {
                pos.level = this.levels[i];
                pos.levelIndex = i;
            } else {
                // Create placeholder for missing levels
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
    
    getPointOnPath(t) {
        // Interpolate along the path
        if (!this.pathPoints || this.pathPoints.length < 2) {
            return { x: 0, y: 0 };
        }
        
        const totalDistance = this.getPathLength();
        const targetDistance = totalDistance * t;
        let currentDistance = 0;
        
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const p1 = this.pathPoints[i];
            const p2 = this.pathPoints[i + 1];
            const segmentLength = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            
            if (currentDistance + segmentLength >= targetDistance) {
                const segmentT = (targetDistance - currentDistance) / segmentLength;
                return {
                    x: p1.x + (p2.x - p1.x) * segmentT,
                    y: p1.y + (p2.y - p1.y) * segmentT
                };
            }
            
            currentDistance += segmentLength;
        }
        
        return { ...this.pathPoints[this.pathPoints.length - 1] };
    }
    
    getPathLength() {
        let length = 0;
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const p1 = this.pathPoints[i];
            const p2 = this.pathPoints[i + 1];
            length += Math.hypot(p2.x - p1.x, p2.y - p1.y);
        }
        return length;
    }
    
    generateTerrainCache() {
        // Generate all terrain variations once on enter
        // This prevents recalculation and flickering on every frame
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
        
        // Generate mountain ranges for background depth - rolling hills with rocky appearance
        const mountains = [
            { x: 120, y: 140, width: 240, height: 200, rolliness: 4, rockiness: 8 },
            { x: width - 160, y: 160, width: 220, height: 180, rolliness: 3, rockiness: 7 },
            { x: width / 2 - 80, y: 120, width: 200, height: 190, rolliness: 3, rockiness: 8 }
        ];
        this.terrainDetails.mountains = mountains;
        
        // Generate grass patches for variety and depth - more organic with more opacity variation
        const grassPatchCount = 35;
        for (let i = 0; i < grassPatchCount; i++) {
            this.terrainDetails.grassPatches.push({
                x: Math.random() * width,
                y: Math.random() * height,
                width: 100 + Math.random() * 150,
                height: 80 + Math.random() * 120,
                color: Math.random() > 0.5 ? '#5aa85a' : '#4a8a4a',
                opacity: 0.15 + Math.random() * 0.2
            });
        }
        
        // Generate large boulders - removed for cleaner look
        const boulders = [];
        this.terrainDetails.boulders = boulders;
        
        // Generate many small rocks for detail
        const smallRocks = [];
        for (let i = 0; i < 40; i++) {
            smallRocks.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: 4 + Math.random() * 12,
                opacity: 0.4 + Math.random() * 0.4
            });
        }
        this.terrainDetails.smallRocks = smallRocks;
        
        // Generate forest clusters - positioned FAR from mountains, not on them, and away from road
        const forestClusters = [
            // Far left corners
            {x: 30, y: 80, size: 95, treeCount: 16, density: 0.58},
            {x: 50, y: 250, size: 100, treeCount: 17, density: 0.59},
            {x: 40, y: 500, size: 105, treeCount: 18, density: 0.60},
            {x: 60, y: height - 80, size: 100, treeCount: 17, density: 0.59},
            
            // Far right corners
            {x: width - 40, y: 100, size: 95, treeCount: 16, density: 0.58},
            {x: width - 60, y: 280, size: 100, treeCount: 17, density: 0.59},
            {x: width - 50, y: 520, size: 105, treeCount: 18, density: 0.60},
            {x: width - 70, y: height - 90, size: 100, treeCount: 17, density: 0.59},
            
            // Far bottom edges
            {x: 150, y: height - 60, size: 95, treeCount: 16, density: 0.58},
            {x: width / 2, y: height - 70, size: 110, treeCount: 19, density: 0.61},
            {x: width - 150, y: height - 65, size: 95, treeCount: 16, density: 0.58},
            
            // Far top edges  
            {x: 120, y: 40, size: 90, treeCount: 15, density: 0.56},
            {x: width / 2, y: 50, size: 100, treeCount: 17, density: 0.59},
            {x: width - 130, y: 45, size: 90, treeCount: 15, density: 0.56},
            
            // Distant outer left and right
            {x: 20, y: height / 2, size: 85, treeCount: 14, density: 0.55},
            {x: width - 25, y: height / 2, size: 85, treeCount: 14, density: 0.55}
        ];
        
        for (const cluster of forestClusters) {
            // Generate trees within cluster with better distribution
            const trees = [];
            for (let i = 0; i < cluster.treeCount; i++) {
                const angle = (i / cluster.treeCount) * Math.PI * 2;
                const randomness = Math.random() * 0.35 + 0.65;
                const distance = randomness * cluster.size * 0.85;
                trees.push({
                    x: cluster.x + Math.cos(angle) * distance,
                    y: cluster.y + Math.sin(angle) * distance,
                    size: 14 + Math.random() * 24,
                    variant: Math.floor(Math.random() * 3) // Tree variations
                });
            }
            this.terrainDetails.forests.push({
                x: cluster.x,
                y: cluster.y,
                trees: trees,
                density: cluster.density
            });
        }
        
        // Generate water features - positioned away from mountains
        const mountainsForWater = this.terrainDetails.mountains;
        const waterFeatures = [
            {x: 280, y: 380, radiusX: 55, radiusY: 35, rotation: 0.3},
            {x: width - 220, y: 480, radiusX: 50, radiusY: 42, rotation: -0.2},
            {x: width / 2 + 170, y: height - 140, radiusX: 60, radiusY: 38, rotation: 0.5},
            {x: 220, y: height - 160, radiusX: 45, radiusY: 32, rotation: -0.4},
            {x: width - 180, y: height - 100, radiusX: 48, radiusY: 36, rotation: 0.1}
        ].filter(water => {
            // Remove water if too close to any mountain
            for (const mountain of mountainsForWater) {
                const dist = Math.hypot(water.x - mountain.x, water.y - mountain.y);
                const minDist = Math.max(mountain.width, mountain.height) * 0.9;
                if (dist < minDist) {
                    return false;
                }
            }
            return true;
        });
        this.terrainDetails.water = waterFeatures;
        
        // Generate rock formations with variety - away from mountains
        const mountainsList = this.terrainDetails.mountains || [];
        const rocks = [
            {x: 210, y: 430, size: 28, type: 'large'},
            {x: 380, y: 180, size: 22, type: 'medium'},
            {x: width - 210, y: 520, size: 32, type: 'large'},
            {x: width / 2 + 120, y: 380, size: 24, type: 'medium'},
            {x: width - 120, y: 280, size: 20, type: 'small'},
            {x: 450, y: 520, size: 28, type: 'large'},
            {x: 320, y: 380, size: 18, type: 'small'},
            {x: width - 280, y: 410, size: 22, type: 'medium'},
            {x: 140, y: 560, size: 25, type: 'large'},
            {x: width - 100, y: 340, size: 19, type: 'medium'}
        ];
        
        // Filter rocks to remove any that are too close to mountains
        const filteredRocks = rocks.filter(rock => {
            for (const mountain of mountainsList) {
                const dist = Math.hypot(rock.x - mountain.x, rock.y - mountain.y);
                if (dist < 150) {
                    return false;
                }
            }
            return true;
        });
        this.terrainDetails.rocks = filteredRocks;
        
        // Generate scattered trees - random but avoiding mountains, water, and roads
        const roadPathPoints = this.pathPoints;
        const waterRegions = this.terrainDetails.water;
        const mountainRegions = this.terrainDetails.mountains;
        
        const scatteredTrees = [];
        let treesAdded = 0;
        const targetTrees = 80;
        let attempts = 0;
        const maxAttempts = 2000;
        
        while (treesAdded < targetTrees && attempts < maxAttempts) {
            attempts++;
            
            const x = Math.random() * width;
            const y = Math.random() * height;
            
            // FIRST CHECK: Not in water regions
            let tooCloseToWater = false;
            for (const water of waterRegions) {
                const dist = Math.hypot(x - water.x, y - water.y);
                const minDist = Math.max(water.radiusX, water.radiusY) + 80;
                if (dist < minDist) {
                    tooCloseToWater = true;
                    break;
                }
            }
            
            if (tooCloseToWater) continue;
            
            // THIRD CHECK: Large safety buffer from mountain centers
            let tooCloseToMountain = false;
            for (const mountain of mountainRegions) {
                const dist = Math.hypot(x - mountain.x, y - mountain.y);
                // Much larger buffer to keep trees far away even from base
                const minDist = Math.max(mountain.width, mountain.height) * 1.15;
                if (dist < minDist) {
                    tooCloseToMountain = true;
                    break;
                }
            }
            
            if (tooCloseToMountain) continue;
            
            // Check if tree is too close to road path - strict buffer
            let tooCloseToRoad = false;
            for (const roadPoint of roadPathPoints) {
                const dist = Math.hypot(x - roadPoint.x, y - roadPoint.y);
                if (dist < 70) { // 70px buffer around road
                    tooCloseToRoad = true;
                    break;
                }
            }
            
            if (tooCloseToRoad) continue;
            
            // Only place tree if not near water, mountains, or road
            scatteredTrees.push({
                x: x,
                y: y,
                size: 10 + Math.random() * 20,
                variant: Math.floor(Math.random() * 3)
            });
            treesAdded++;
        }
        this.terrainDetails.trees = scatteredTrees;
    }
    
    // Helper function to check if a point is inside a mountain shape
    isPointInMountain(x, y, mountain) {
        const { x: mx, y: my, width: mw, height: mh } = mountain;
        
        // Extended bounds check
        if (x < mx - mw / 2 - 40 || x > mx + mw / 2 + 40) {
            return false;
        }
        
        // Normalize x position to 0-1 range
        const t = (x - (mx - mw / 2)) / mw;
        
        // Use exact same formula as drawing for consistency
        const peak1 = Math.sin(t * Math.PI) * mh * 0.75;
        const peak2 = Math.sin(t * Math.PI * 2 + 0.3) * mh * 0.35;
        const peak3 = Math.sin(t * Math.PI * 4.2 + 2) * mh * 0.08;
        
        // Smooth edge transition (same as drawing)
        const edgeSmooth = Math.pow(Math.sin(t * Math.PI), 0.6);
        const mountainTopY = my + mh * 0.2 - (peak1 + peak2 + peak3) * edgeSmooth;
        
        // Point is in mountain if y is above (less than) the mountain top
        // With 10 pixel buffer for extra safety
        return y < mountainTopY + 10;
    }
    
    renderBackground(ctx, canvas) {
        // Base grass - render once
        ctx.fillStyle = '#4a9d4a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    renderTerrain(ctx) {
        if (!this.terrainDetails) return;
        
        // Render mountains (background layer)
        if (this.terrainDetails && this.terrainDetails.mountains) {
            for (const mountain of this.terrainDetails.mountains) {
                this.drawMountain(ctx, mountain);
            }
        }
        
        // Render grass patches
        if (this.terrainDetails && this.terrainDetails.grassPatches) {
            for (const patch of this.terrainDetails.grassPatches) {
                ctx.fillStyle = patch.color;
                ctx.globalAlpha = patch.opacity;
                ctx.fillRect(patch.x, patch.y, patch.width, patch.height);
                ctx.globalAlpha = 1;
            }
        }
        
        // Render boulders (front layer, in front of water and trees)
        if (this.terrainDetails && this.terrainDetails.boulders) {
            for (const boulder of this.terrainDetails.boulders) {
                this.drawBoulder(ctx, boulder.x, boulder.y, boulder.size, boulder.type);
            }
        }
        
        // Render small rocks for ground detail
        if (this.terrainDetails && this.terrainDetails.smallRocks) {
            for (const rock of this.terrainDetails.smallRocks) {
                this.drawSmallRock(ctx, rock.x, rock.y, rock.size, rock.opacity);
            }
        }
        
        // Render shrubs (background layer)
        if (this.terrainDetails && this.terrainDetails.shrubs) {
            for (const shrub of this.terrainDetails.shrubs) {
                this.drawShrub(ctx, shrub.x, shrub.y, shrub.size, shrub.color, shrub.opacity);
            }
        }
        
        // Render water features (behind trees)
        if (this.terrainDetails && this.terrainDetails.water) {
            for (const water of this.terrainDetails.water) {
                this.drawWater(ctx, water);
            }
        }
        
        // Render rocks
        if (this.terrainDetails && this.terrainDetails.rocks) {
            for (const rock of this.terrainDetails.rocks) {
                this.drawRock(ctx, rock.x, rock.y, rock.size, rock.type);
            }
        }
        
        // Render forests and individual trees (foreground) - on top of everything
        if (this.terrainDetails && this.terrainDetails.forests) {
            for (const cluster of this.terrainDetails.forests) {
                for (const tree of cluster.trees) {
                    this.drawTreeTopDown(ctx, tree.x, tree.y, tree.size, tree.variant);
                }
            }
        }
        
        // Render scattered trees (front layer) - on top of everything
        if (this.terrainDetails && this.terrainDetails.trees) {
            for (const tree of this.terrainDetails.trees) {
                this.drawTreeTopDown(ctx, tree.x, tree.y, tree.size, tree.variant);
            }
        }
    }
    
    drawMountain(ctx, mountain) {
        const { x, y, width, height, rolliness, rockiness } = mountain;
        
        ctx.save();
        
        // Helper to build mountain profile points
        const buildMountainProfile = (peaks) => {
            const points = [];
            for (let i = 0; i <= 150; i++) {
                const t = i / 150;
                const mountainX = x - width / 2 + t * width;
                
                const peak1 = Math.sin(t * Math.PI) * height * peaks.p1;
                const peak2 = Math.sin(t * Math.PI * 2 + peaks.offset2) * height * peaks.p2;
                const peak3 = Math.sin(t * Math.PI * peaks.freq3 + peaks.offset3) * height * peaks.p3;
                
                const edgeSmooth = Math.pow(Math.sin(t * Math.PI), 0.6);
                const mountainY = y + height * peaks.base - (peak1 + peak2 + peak3) * edgeSmooth;
                points.push({ x: mountainX, y: mountainY });
            }
            return points;
        };
        
        // Draw far mountain layer
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#505050';
        const farPoints = buildMountainProfile({
            p1: 0.5, p2: 0.2, p3: 0.12, 
            offset2: 0.7, offset3: 1.2, freq3: 3.5,
            base: 0.35
        });
        ctx.beginPath();
        ctx.moveTo(x - width / 2, y + height);
        for (const pt of farPoints) {
            ctx.lineTo(pt.x, pt.y);
        }
        ctx.lineTo(x + width / 2, y + height);
        ctx.closePath();
        ctx.fill();
        
        // Draw mid-layer mountain
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = '#6a7a7a';
        const midPoints = buildMountainProfile({
            p1: 0.62, p2: 0.28, p3: 0.1,
            offset2: 0.5, offset3: 1.5, freq3: 3.8,
            base: 0.28
        });
        ctx.beginPath();
        ctx.moveTo(x - width / 2, y + height);
        for (const pt of midPoints) {
            ctx.lineTo(pt.x, pt.y);
        }
        ctx.lineTo(x + width / 2, y + height);
        ctx.closePath();
        ctx.fill();
        
        // Draw front mountain layer
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#9a9a9a';
        const frontPoints = buildMountainProfile({
            p1: 0.75, p2: 0.35, p3: 0.08,
            offset2: 0.3, offset3: 2, freq3: 4.2,
            base: 0.2
        });
        ctx.beginPath();
        ctx.moveTo(x - width / 2, y + height);
        for (const pt of frontPoints) {
            ctx.lineTo(pt.x, pt.y);
        }
        ctx.lineTo(x + width / 2, y + height);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    drawBoulder(ctx, x, y, size, type) {
        // Large boulder shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5, y + size * 0.6, size * 0.9, size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Multiple concentric circles for boulder shape
        const gradient = ctx.createRadialGradient(x - size * 0.25, y - size * 0.25, 0, x, y, size);
        gradient.addColorStop(0, '#9a8970');
        gradient.addColorStop(0.5, '#7a6a5a');
        gradient.addColorStop(1, '#5a4a3a');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Boulder cracks and texture
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Highlight for 3D effect
        ctx.fillStyle = 'rgba(200, 190, 170, 0.5)';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.4, y - size * 0.4, size * 0.6, size * 0.5, -Math.PI / 3, 0, Math.PI * 2);
        ctx.fill();
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
    
    drawShrub(ctx, x, y, size, color, opacity) {
        // Shrub with opacity
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.ellipse(x, y, size * 1.2, size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shrub highlight
        ctx.fillStyle = 'rgba(100, 150, 100, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.4, y - size * 0.3, size * 0.5, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    drawWater(ctx, water) {
        const { x, y, radiusX, radiusY, rotation } = water;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        // Water depth shadow
        ctx.fillStyle = '#0f3a4a';
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main water color with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(radiusX, radiusY));
        gradient.addColorStop(0, '#2a7fa0');
        gradient.addColorStop(0.6, '#1e5f7a');
        gradient.addColorStop(1, '#0f3a4a');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
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
    
    drawRock(ctx, x, y, size, type = 'large') {
        // Rock shadow - more pronounced
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.4, y + size * 0.4, size * 0.7, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main rock - irregular shape for more natural look
        const gradient = ctx.createRadialGradient(x - size * 0.2, y - size * 0.2, 0, x, y, size);
        gradient.addColorStop(0, '#a39985');
        gradient.addColorStop(0.5, '#8b7d6b');
        gradient.addColorStop(1, '#6b5d4b');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Rock outline
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();
        
        // Rock shine/highlight
        ctx.fillStyle = 'rgba(200, 190, 170, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.3, y - size * 0.3, size * 0.5, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawTreeTopDown(ctx, x, y, size, variant = 0) {
        const variants = [
            { baseColor: '#2d5a2d', topColor: '#3d7d3d' },
            { baseColor: '#1a4a1a', topColor: '#2d6d2d' },
            { baseColor: '#2d6d2d', topColor: '#3d8d3d' }
        ];
        
        const v = variants[variant % variants.length];
        
        // Tree shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.2, y + size * 0.3, size * 0.6, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tree trunk - thin, low profile
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(x - size * 0.15, y + size * 0.4, size * 0.3, size * 0.5);
        
        // Tree canopy - concentric circles for top-down view
        ctx.fillStyle = v.baseColor;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Tree highlights
        ctx.fillStyle = v.topColor;
        ctx.beginPath();
        ctx.arc(x - size * 0.15, y - size * 0.2, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(100, 150, 100, 0.4)';
        ctx.beginPath();
        ctx.arc(x + size * 0.1, y + size * 0.1, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderPath(ctx) {
        if (!this.pathPoints || this.pathPoints.length < 2) return;
        
        const canvas = this.stateManager.canvas;
        
        // Very subtle shadow - barely visible
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 40;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x + 2, this.pathPoints[0].y + 2);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x + 2, this.pathPoints[i].y + 2);
        }
        ctx.stroke();
        
        // Main road surface - blends with ground, natural stone color
        ctx.strokeStyle = '#7a8a6a';
        ctx.lineWidth = 38;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Subtle worn centerline
        ctx.strokeStyle = 'rgba(80, 70, 60, 0.3)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([8, 10]);
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
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
            this.drawLockedCastleTopDown(ctx, slot.x, slot.y, this.castleScale);
        } else {
            this.drawCastleTopDown(ctx, slot.x, slot.y, isHovered);
        }
        
        // Draw level name/number below
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1a0f05';
        const displayName = level.name || `Level ${index + 1}`;
        ctx.fillText(displayName, slot.x, slot.y + 80);
    }
    
    drawPlaceholderSlot(ctx, centerX, centerY, isHovered) {
        const scale = this.castleScale;
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
        
        // Draw in order: base, walls, towers, gate, crenellations, flags
        this.drawCastleBase(ctx);
        this.drawMainWall(ctx);
        this.drawTowers(ctx);
        this.drawGate(ctx);
        this.drawCrenellations(ctx);
        this.drawFlags(ctx);
        
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
        const towerX = [-110, 110];
        const towerHeight = 75;
        const towerTopY = -towerHeight; // Top of tower
        const flagPoleHeight = 30;
        const flagWidth = 40;
        const flagHeight = 24;
        
        const flagColors = ['#cc3333', '#334dbf'];
        
        for (let i = 0; i < towerX.length; i++) {
            const x = towerX[i];
            const flagPoleBaseY = towerTopY; // At top of tower
            
            // Flag pole
            ctx.strokeStyle = '#6a5a4a';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(x, flagPoleBaseY);
            ctx.lineTo(x, flagPoleBaseY - flagPoleHeight);
            ctx.stroke();
            
            // Flag with waving animation
            const waveAmount = Math.sin(this.animationTime * 4 + i * Math.PI) * 5;
            
            ctx.fillStyle = flagColors[i];
            ctx.beginPath();
            // Base of flag at pole
            ctx.moveTo(x, flagPoleBaseY - flagPoleHeight);
            // Top right corner (waves)
            ctx.lineTo(x + flagWidth + waveAmount, flagPoleBaseY - flagPoleHeight - flagHeight / 2 + waveAmount * 0.15);
            // Bottom right corner
            ctx.lineTo(x + flagWidth + waveAmount * 0.5, flagPoleBaseY - flagPoleHeight + flagHeight / 2 + waveAmount * 0.1);
            // Back to pole
            ctx.closePath();
            ctx.fill();
            
            // Flag border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }
    
    drawLockedCastleTopDown(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        // Locked castle is grayed out
        ctx.globalAlpha = 0.5;
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 40, 130, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Main wall - grayed out
        const wallWidth = 240;
        const wallHeight = 120;
        
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(-wallWidth / 2, -wallHeight, wallWidth, wallHeight);
        
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(-wallWidth / 2, -wallHeight, wallWidth, wallHeight);
        
        // Lock symbol overlay
        ctx.globalAlpha = 1;
        ctx.font = 'bold 40px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#999';
        ctx.fillText('🔒', 0, -50);
        
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
    }
}
