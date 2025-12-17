import { CampaignBase } from './CampaignBase.js';
import { LevelFactory } from '../../game/LevelFactory.js';

/**
 * Campaign1: The Great Northern Campaign
 * Top-down landscape view with castles representing levels along a winding road
 * Castles rendered using exact Castle.js rendering methods for consistency
 */
export class Campaign1 extends CampaignBase {
    constructor(stateManager) {
        super(stateManager);
        
        this.campaignId = 'campaign-1';
        this.campaignName = 'The Great Northern Campaign';
        
        // Castle rendering scale for campaign map
        this.castleScale = 0.3;
        
        // Animation time for castle flags
        this.animationTime = 0;
        
        // Terrain cache - generated once on enter to prevent flickering
        this.terrainDetails = null;
        this.pathPoints = [];
    }
    
    enter() {
        // Load levels from factory
        const saveData = this.stateManager.currentSaveData;
        const allLevels = LevelFactory.getLevelList(saveData);
        this.levels = allLevels.filter(level => 
            ['level1', 'level2', 'level3', 'level4', 'level5'].includes(level.id)
        );
        
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
        
        // Define the winding path with key points
        this.pathPoints = [
            { x: width * 0.1, y: height * 0.7 },      // Start bottom left
            { x: width * 0.2, y: height * 0.6 },
            { x: width * 0.25, y: height * 0.4 },
            { x: width * 0.35, y: height * 0.3 },
            { x: width * 0.5, y: height * 0.25 },
            { x: width * 0.65, y: height * 0.3 },
            { x: width * 0.75, y: height * 0.45 },
            { x: width * 0.85, y: height * 0.55 },
            { x: width * 0.9, y: height * 0.7 }
        ];
        
        // Generate level slots evenly distributed along the path
        this.levelSlots = [];
        for (let i = 0; i < this.levels.length; i++) {
            const t = i / (this.levels.length - 1); // 0 to 1
            const pos = this.getPointOnPath(t);
            pos.level = this.levels[i];
            pos.levelIndex = i;
            this.levelSlots.push(pos);
        }
    }
    
    generateTerrainCache() {
        // Generate all terrain variations once on enter
        // This prevents recalculation and flickering on every frame
        this.terrainDetails = {
            forests: [],
            rocks: [],
            water: [],
            trees: []
        };
        
        const canvas = this.stateManager.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Generate forest clusters - many for visual richness
        const forestClusters = [
            // Left side
            {x: 80, y: 150, size: 120, treeCount: 18},
            {x: 120, y: 320, size: 90, treeCount: 14},
            {x: 60, y: 500, size: 100, treeCount: 15},
            
            // Right side
            {x: width - 100, y: 200, size: 110, treeCount: 17},
            {x: width - 80, y: 450, size: 95, treeCount: 14},
            
            // Center clusters
            {x: width / 2 + 200, y: 250, size: 85, treeCount: 12},
            {x: width / 2 - 250, y: 400, size: 100, treeCount: 15},
            
            // Top areas
            {x: 150, y: 80, size: 80, treeCount: 11},
            {x: width - 150, y: 120, size: 90, treeCount: 12},
            
            // Bottom areas
            {x: width / 2 - 100, y: height - 120, size: 100, treeCount: 14},
            {x: width / 2 + 120, y: height - 100, size: 95, treeCount: 13},
            
            // Random smaller clusters
            {x: 300, y: 280, size: 60, treeCount: 8},
            {x: width - 250, y: 350, size: 70, treeCount: 10},
            {x: 400, y: height - 150, size: 65, treeCount: 9},
            {x: width - 200, y: 550, size: 75, treeCount: 11}
        ];
        
        for (const cluster of forestClusters) {
            // Generate trees within cluster
            const trees = [];
            for (let i = 0; i < cluster.treeCount; i++) {
                const angle = (i / cluster.treeCount) * Math.PI * 2;
                const distance = Math.random() * cluster.size * 0.8;
                trees.push({
                    x: cluster.x + Math.cos(angle) * distance,
                    y: cluster.y + Math.sin(angle) * distance,
                    size: 12 + Math.random() * 20
                });
            }
            this.terrainDetails.forests.push({
                x: cluster.x,
                y: cluster.y,
                trees: trees
            });
        }
        
        // Generate water features
        const waterFeatures = [
            {x: 250, y: 200, width: 80, height: 50},
            {x: width - 200, y: 300, width: 70, height: 60},
            {x: width / 2 + 150, y: height - 150, width: 90, height: 55}
        ];
        this.terrainDetails.water = waterFeatures;
        
        // Generate rock formations
        const rocks = [
            {x: 180, y: 400, size: 25},
            {x: 350, y: 150, size: 20},
            {x: width - 180, y: 500, size: 28},
            {x: width / 2 + 100, y: 350, size: 22},
            {x: width - 100, y: 150, size: 18},
            {x: 420, y: 500, size: 24}
        ];
        this.terrainDetails.rocks = rocks;
        
        // Generate scattered trees for diversity
        const scatteredTrees = [];
        for (let i = 0; i < 20; i++) {
            scatteredTrees.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: 8 + Math.random() * 16
            });
        }
        this.terrainDetails.trees = scatteredTrees;
    }
    
    getPointOnPath(t) {
        // Interpolate along the path based on parameter t (0 to 1)
        const points = this.pathPoints;
        const segmentLength = 1 / (points.length - 1);
        const segment = Math.floor(t / segmentLength);
        const localT = (t - segment * segmentLength) / segmentLength;
        
        if (segment >= points.length - 1) {
            return points[points.length - 1];
        }
        
        const p1 = points[segment];
        const p2 = points[segment + 1];
        
        return {
            x: p1.x + (p2.x - p1.x) * localT,
            y: p1.y + (p2.y - p1.y) * localT
        };
    }
    
    renderBackground(ctx, canvas) {
        // Base grass - render once
        ctx.fillStyle = '#4a9d4a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    renderTerrain(ctx) {
        const canvas = this.stateManager.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // Render water features
        if (this.terrainDetails && this.terrainDetails.water) {
            ctx.fillStyle = '#1e5f7a';
            for (const water of this.terrainDetails.water) {
                ctx.fillRect(water.x - water.width / 2, water.y - water.height / 2, water.width, water.height);
                
                // Water shimmer
                ctx.fillStyle = '#2a7fa0';
                ctx.fillRect(
                    water.x - water.width / 2 + 5,
                    water.y - water.height / 2 + 3,
                    water.width - 10,
                    water.height - 6
                );
                ctx.fillStyle = '#1e5f7a';
            }
        }
        
        // Render rocks
        if (this.terrainDetails && this.terrainDetails.rocks) {
            for (const rock of this.terrainDetails.rocks) {
                this.drawRock(ctx, rock.x, rock.y, rock.size);
            }
        }
        
        // Render forests and individual trees
        if (this.terrainDetails && this.terrainDetails.forests) {
            for (const cluster of this.terrainDetails.forests) {
                for (const tree of cluster.trees) {
                    this.drawTreeTopDown(ctx, tree.x, tree.y, tree.size);
                }
            }
        }
        
        // Render scattered trees
        if (this.terrainDetails && this.terrainDetails.trees) {
            for (const tree of this.terrainDetails.trees) {
                this.drawTreeTopDown(ctx, tree.x, tree.y, tree.size);
            }
        }
        
        // Render the winding path
        this.renderPath(ctx);
    }
    
    drawRock(ctx, x, y, size) {
        ctx.fillStyle = '#8b7d6b';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Rock shadow
        ctx.fillStyle = '#5a4a3a';
        ctx.beginPath();
        ctx.arc(x + size * 0.3, y + size * 0.3, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Rock highlight
        ctx.fillStyle = '#a9987a';
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawTreeTopDown(ctx, x, y, size) {
        const treeSize = size * 0.7;
        
        // Tree shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + treeSize * 0.3, y + treeSize * 0.3, treeSize * 0.6, treeSize * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tree canopy - dark green
        ctx.fillStyle = '#2d5a2d';
        ctx.beginPath();
        ctx.arc(x, y, treeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Tree canopy - medium green (outer layer)
        ctx.fillStyle = '#3d7a3d';
        ctx.beginPath();
        ctx.arc(x, y, treeSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Tree trunk
        const trunkWidth = treeSize * 0.3;
        const trunkHeight = treeSize * 0.6;
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(x - trunkWidth / 2, y + treeSize * 0.3, trunkWidth, trunkHeight);
        
        // Trunk highlight
        ctx.fillStyle = '#7a6a5a';
        ctx.fillRect(x - trunkWidth / 3, y + treeSize * 0.3, trunkWidth * 0.4, trunkHeight * 0.7);
    }
    
    renderPath(ctx) {
        if (!this.pathPoints || this.pathPoints.length < 2) return;
        
        // Shadow path
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 40;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x + 3, this.pathPoints[0].y + 3);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x + 3, this.pathPoints[i].y + 3);
        }
        ctx.stroke();
        
        // Main path - dusty tan color
        ctx.strokeStyle = '#c9b89b';
        ctx.lineWidth = 36;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        
        // Path center line
        ctx.strokeStyle = '#a89878';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    renderLevelSlot(ctx, index) {
        const level = this.levels[index];
        if (!level || !this.levelSlots[index]) return;
        
        const slot = this.levelSlots[index];
        const isHovered = index === this.hoveredLevel;
        const isLocked = !level.unlocked;
        
        // Draw castle for this level
        if (isLocked) {
            this.drawLockedCastleTopDown(ctx, slot.x, slot.y, this.castleScale);
        } else {
            this.drawCastleTopDown(ctx, slot.x, slot.y, isHovered);
        }
        
        // Draw level name/number below castle
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1a0f05';
        ctx.fillText(level.name, slot.x, slot.y + 80);
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
        const baseWidth = 300;
        const baseHeight = 30;
        
        // Base shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(-baseWidth / 2, 100, baseWidth, baseHeight);
        
        // Main base
        const gradient = ctx.createLinearGradient(-baseWidth / 2, 100, baseWidth / 2, 100);
        gradient.addColorStop(0, '#5a4a3a');
        gradient.addColorStop(0.5, '#7a6a5a');
        gradient.addColorStop(1, '#5a4a3a');
        ctx.fillStyle = gradient;
        ctx.fillRect(-baseWidth / 2, 100, baseWidth, baseHeight);
        
        // Stone block pattern on base
        const blockSize = 40;
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 1;
        for (let x = -baseWidth / 2; x < baseWidth / 2; x += blockSize) {
            ctx.strokeRect(x, 100, blockSize, baseHeight);
        }
    }
    
    drawMainWall(ctx) {
        const wallWidth = 240;
        const wallHeight = 120;
        
        // Main wall gradient
        const gradient = ctx.createLinearGradient(0, -wallHeight, 0, 0);
        gradient.addColorStop(0, '#8b7d6b');
        gradient.addColorStop(0.5, '#9b8d7b');
        gradient.addColorStop(1, '#7b6d5b');
        ctx.fillStyle = gradient;
        ctx.fillRect(-wallWidth / 2, -wallHeight, wallWidth, wallHeight);
        
        // Stone brick pattern
        const brickHeight = 20;
        const brickWidth = 40;
        ctx.strokeStyle = '#5b4d3b';
        ctx.lineWidth = 1;
        
        for (let row = 0; row < Math.ceil(wallHeight / brickHeight); row++) {
            const offset = (row % 2) * brickWidth * 0.5;
            for (let col = 0; col < Math.ceil(wallWidth / brickWidth) + 1; col++) {
                const x = -wallWidth / 2 + col * brickWidth + offset;
                const y = -wallHeight + row * brickHeight;
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
                const y = -wallHeight + row * brickHeight;
                ctx.strokeRect(x + 2, y + 2, brickWidth - 4, brickHeight - 4);
            }
        }
    }
    
    drawTowers(ctx) {
        const towerX = [-120, 120];
        const towerY = -140;
        const towerSize = 40;
        
        for (const x of towerX) {
            // Tower shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(x - towerSize / 2, towerY + 10, towerSize, 50);
            
            // Tower
            const gradient = ctx.createLinearGradient(x - towerSize / 2, towerY, x + towerSize / 2, towerY);
            gradient.addColorStop(0, '#6b5d4b');
            gradient.addColorStop(0.5, '#8b7d6b');
            gradient.addColorStop(1, '#6b5d4b');
            ctx.fillStyle = gradient;
            ctx.fillRect(x - towerSize / 2, towerY, towerSize, 60);
            
            // Tower brick pattern
            ctx.strokeStyle = '#4b3d2b';
            ctx.lineWidth = 1;
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 2; col++) {
                    ctx.strokeRect(
                        x - towerSize / 2 + col * towerSize / 2,
                        towerY + row * 20,
                        towerSize / 2,
                        20
                    );
                }
            }
        }
    }
    
    drawGate(ctx) {
        const gateWidth = 40;
        const gateHeight = 50;
        
        // Gate door - dark brown
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(-gateWidth / 2, -40, gateWidth, gateHeight);
        
        // Gate center seam
        ctx.strokeStyle = '#2a1a0a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(0, -40 + gateHeight);
        ctx.stroke();
        
        // Metal bands on gate
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            const y = -40 + (gateHeight / 3) * (i + 0.5);
            ctx.beginPath();
            ctx.moveTo(-gateWidth / 2, y);
            ctx.lineTo(gateWidth / 2, y);
            ctx.stroke();
        }
        
        // Metal studs on gate
        ctx.fillStyle = '#d4af37';
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                const x = -gateWidth / 2 + gateWidth / 4 + col * gateWidth / 4;
                const y = -40 + gateHeight / 5 + row * gateHeight / 5;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Golden knocker
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(0, -20, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a4802a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -20, 4, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawCrenellations(ctx) {
        const wallWidth = 240;
        const crenelHeight = 14;
        const crenelWidth = 12;
        const spacing = 16;
        
        ctx.fillStyle = '#8b7d6b';
        const crenelCount = Math.floor(wallWidth / spacing);
        for (let i = 0; i < crenelCount; i++) {
            const x = -wallWidth / 2 + i * spacing;
            ctx.fillRect(x, -134, crenelWidth, crenelHeight);
        }
        
        // Crenel shadows
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < crenelCount; i++) {
            const x = -wallWidth / 2 + i * spacing;
            ctx.fillRect(x + crenelWidth * 0.3, -134 + crenelHeight * 0.5, crenelWidth * 0.4, crenelHeight * 0.5);
        }
    }
    
    drawFlags(ctx) {
        const towerX = [-120, 120];
        const towerY = -140;
        const flagPoleHeight = 30;
        const flagWidth = 40;
        const flagHeight = 25;
        
        const flagColors = ['#cc3333', '#334dbf'];
        
        for (let i = 0; i < towerX.length; i++) {
            const x = towerX[i];
            
            // Flag pole
            ctx.strokeStyle = '#6a5a4a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, towerY - flagPoleHeight);
            ctx.lineTo(x, towerY);
            ctx.stroke();
            
            // Flag with waving animation
            const waveAmount = Math.sin(this.animationTime * 4 + i * Math.PI) * 8;
            
            ctx.fillStyle = flagColors[i];
            ctx.beginPath();
            ctx.moveTo(x, towerY - flagPoleHeight);
            ctx.lineTo(x + flagWidth + waveAmount, towerY - flagPoleHeight - flagHeight / 2 + waveAmount * 0.3);
            ctx.lineTo(x + flagWidth + waveAmount * 0.8, towerY - flagPoleHeight + flagHeight / 2 + waveAmount * 0.2);
            ctx.closePath();
            ctx.fill();
            
            // Flag border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
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
