import { SaveSystem } from '../SaveSystem.js';
import { TrainingGrounds } from '../../entities/buildings/TrainingGrounds.js';
import { TowerForge } from '../../entities/buildings/TowerForge.js';
import { MagicAcademy } from '../../entities/buildings/MagicAcademy.js';
import { GoldMine } from '../../entities/buildings/GoldMine.js';
import { GuardPost } from '../../entities/towers/GuardPost.js';

/**
 * SettlementHub State
 * Main hub screen displayed after save slot selection or loading a game
 * Features a medieval settlement with interactive buildings and UI elements
 */
export class SettlementHub {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.showContent = false;
        this.contentOpacity = 0;
        
        // Create actual building instances positioned INSIDE the settlement
        this.settlementBuildings = [];
        
        // Building interactivity - three main buildings are clickable
        this.buildings = [
            { id: 'trainingGrounds', name: 'Training Grounds', action: 'levelSelect', x: 0, y: 0, width: 80, height: 60, hovered: false },
            { id: 'towerForge', name: 'Tower Forge', action: 'upgrades', x: 0, y: 0, width: 80, height: 60, hovered: false },
            { id: 'magicAcademy', name: 'Magic Academy', action: 'options', x: 0, y: 0, width: 80, height: 60, hovered: false },
        ];

        // UI state
        this.activePopup = null;
        this.upgradesPopup = null;
        this.optionsPopup = null;
        this.buildingPositions = {};
        
        // Animation state
        this.buildingAnimations = {};
    }

    enter() {
        // Hide game UI
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');

        if (statsBar) {
            statsBar.style.display = 'none';
        }
        if (sidebar) {
            sidebar.style.display = 'none';
        }

        // Reset animation
        this.animationTime = 0;
        this.showContent = false;
        this.contentOpacity = 0;
        this.activePopup = null;
        
        // Create settlement building instances positioned WITHIN the settlement boundary
        const canvas = this.stateManager.canvas;
        const centerX = canvas.width / 2;  // Settlement center X
        const centerY = canvas.height * 0.76;  // Settlement center Y - lower on screen
        
        // Settlement boundary (ellipse on ground):
        // Center: (centerX, centerY)
        // Radius X: 360 pixels, Radius Y: 140 pixels
        
        // Main buildings positioned strategically
        // Training Grounds OUTSIDE the settlement to the left (as per user request)
        // Other buildings spread naturally INSIDE the boundary
        this.settlementBuildings = [
            // Training Grounds - positioned at the black square (far left)
            {
                building: new TrainingGrounds(centerX - 720, centerY - 0, 0, 0),
                scale: 1,
                clickable: true,
                action: 'levelSelect'
            },
            // Tower Forge - inside upper right area
            {
                building: new TowerForge(centerX + 160, centerY - 50, 1, 0),
                scale: 30,
                clickable: true,
                action: 'upgrades'
            },
            // Magic Academy - positioned at purple circle arrow
            {
                building: new MagicAcademy(centerX - 130, centerY - 55, 1, 0),
                scale: 29,
                clickable: true,
                action: 'options'
            },
            // Gold Mine - positioned at red circle (far right)
            {
                building: new GoldMine(centerX + 820, centerY - 80, 1, 1),
                scale: 29,
                clickable: false,
                action: null
            }
        ];
        
        // Disable GoldMine timer mechanism for settlement hub display
        if (this.settlementBuildings[3].building) {
            this.settlementBuildings[3].building.goldReady = true;
        }
        
        this.setupMouseListeners();
    }

    exit() {
        this.removeMouseListeners();
    }

    initializeBuildingPositions() {
        const canvas = this.stateManager.canvas;
        
        // Settlement center area
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Position buildings around the settlement center
        // Training Grounds - center left
        this.buildingPositions['trainingGrounds'] = {
            x: centerX - 200,
            y: centerY - 80,
            width: 120,
            height: 100
        };
        
        // Tower Forge - center
        this.buildingPositions['towerForge'] = {
            x: centerX - 60,
            y: centerY + 40,
            width: 120,
            height: 100
        };
        
        // Magic Academy - center right
        this.buildingPositions['magicAcademy'] = {
            x: centerX + 140,
            y: centerY - 80,
            width: 120,
            height: 100
        };
        
        // Mine - right side
        this.buildingPositions['goldMine'] = {
            x: centerX + 280,
            y: centerY + 40,
            width: 100,
            height: 80
        };
        
        // Guard Post cluster - various positions
        this.buildingPositions['guardPost1'] = {
            x: centerX - 140,
            y: centerY + 120,
            width: 80,
            height: 70
        };
        
        this.buildingPositions['guardPost2'] = {
            x: centerX + 200,
            y: centerY + 120,
            width: 80,
            height: 70
        };
        
        // Houses (variations of guard post style)
        this.buildingPositions['house1'] = {
            x: centerX - 280,
            y: centerY - 20,
            width: 70,
            height: 60
        };
        
        this.buildingPositions['house2'] = {
            x: centerX + 360,
            y: centerY - 40,
            width: 70,
            height: 60
        };
    }

    setupMouseListeners() {
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        };
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.stateManager.canvas.addEventListener('click', this.clickHandler);
    }

    removeMouseListeners() {
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.clickHandler) {
            this.stateManager.canvas.removeEventListener('click', this.clickHandler);
        }
    }

    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // If popup is active, update its hover state
        if (this.activePopup === 'upgrades' && this.upgradesPopup) {
            this.upgradesPopup.updateHoverState(x, y);
        } else if (this.activePopup === 'options' && this.optionsPopup) {
            this.optionsPopup.updateHoverState(x, y);
        } else {
            // Check settlement building hover states
            let isHoveringBuilding = false;
            this.settlementBuildings.forEach(item => {
                if (item.clickable) {
                    // Get building bounds from buildingPositions if available, else use scale-based sizing
                    let bounds;
                    if (item.building instanceof TrainingGrounds) {
                        // TrainingGrounds has fence perimeter, use actual visual bounds
                        bounds = {
                            x: item.building.x - 150,
                            y: item.building.y - 150,
                            width: 300,
                            height: 300
                        };
                    } else {
                        const size = item.scale * 4;
                        bounds = {
                            x: item.building.x,
                            y: item.building.y,
                            width: size,
                            height: size
                        };
                    }
                    
                    // Check if mouse is within building bounds
                    if (x >= bounds.x && x <= bounds.x + bounds.width &&
                        y >= bounds.y && y <= bounds.y + bounds.height) {
                        isHoveringBuilding = true;
                    }
                }
            });
            this.stateManager.canvas.style.cursor = isHoveringBuilding || this.activePopup ? 'pointer' : 'default';
        }
    }

    handleClick(x, y) {
        // If popup is active, delegate click to popup
        if (this.activePopup === 'upgrades' && this.upgradesPopup) {
            this.upgradesPopup.handleClick(x, y);
            return;
        } else if (this.activePopup === 'options' && this.optionsPopup) {
            this.optionsPopup.handleClick(x, y);
            return;
        }

        // Check settlement building clicks
        this.settlementBuildings.forEach(item => {
            if (item.clickable) {
                // Get building bounds from buildingPositions if available, else use scale-based sizing
                let bounds;
                if (item.building instanceof TrainingGrounds) {
                    // TrainingGrounds has fence perimeter, use actual visual bounds
                    bounds = {
                        x: item.building.x - 150,
                        y: item.building.y - 150,
                        width: 300,
                        height: 300
                    };
                } else {
                    const size = item.scale * 4;
                    bounds = {
                        x: item.building.x,
                        y: item.building.y,
                        width: size,
                        height: size
                    };
                }
                
                // Check if click is within building bounds
                if (x >= bounds.x && x <= bounds.x + bounds.width &&
                    y >= bounds.y && y <= bounds.y + bounds.height) {
                    this.onBuildingClick(item);
                }
            }
        });
    }

    onBuildingClick(buildingItem) {
        if (buildingItem.action === 'levelSelect') {
            this.stateManager.changeState('levelSelect');
        } else if (buildingItem.action === 'upgrades') {
            this.activePopup = 'upgrades';
            if (!this.upgradesPopup) {
                this.upgradesPopup = new UpgradesMenu(this.stateManager, this);
            }
            this.upgradesPopup.open();
        } else if (buildingItem.action === 'options') {
            this.activePopup = 'options';
            if (!this.optionsPopup) {
                this.optionsPopup = new SettlementOptionsMenu(this.stateManager, this);
            }
            this.optionsPopup.open();
        }
    }

    closePopup() {
        this.activePopup = null;
    }

    update(deltaTime) {
        this.animationTime += deltaTime;

        // Show content after a brief delay
        if (this.animationTime > 0.3) {
            this.showContent = true;
            this.contentOpacity = Math.min(1, (this.animationTime - 0.3) / 0.5);
        }

        // Update active popup
        if (this.activePopup === 'upgrades' && this.upgradesPopup) {
            this.upgradesPopup.update(deltaTime);
        } else if (this.activePopup === 'options' && this.optionsPopup) {
            this.optionsPopup.update(deltaTime);
        }

        // Update settlement buildings for animations
        this.settlementBuildings.forEach(item => {
            if (item.building && item.building.update) {
                item.building.update(deltaTime);
            }
            // Prevent GoldMine timer from showing in settlement
            if (item.building && item.building.goldReady !== undefined) {
                item.building.goldReady = true;
            }
        });
    }

    render(ctx) {
        try {
            const canvas = this.stateManager.canvas;

            if (!canvas || !canvas.width || !canvas.height) {
                ctx.fillStyle = '#1a0f0a';
                ctx.fillRect(0, 0, 800, 600);
                return;
            }

            // Background with depth
            this.renderBackground(ctx, canvas);

            if (this.showContent) {
                ctx.globalAlpha = this.contentOpacity;

                // Render settlement with 3D perspective
                this.renderSettlementScene(ctx, canvas);

                // Render settlement title
                this.renderTitle(ctx, canvas);

                ctx.globalAlpha = 1;
            }

            // Render active popup
            if (this.activePopup === 'upgrades' && this.upgradesPopup) {
                this.upgradesPopup.render(ctx);
            } else if (this.activePopup === 'options' && this.optionsPopup) {
                this.optionsPopup.render(ctx);
            }

            ctx.globalAlpha = 1;

        } catch (error) {
            console.error('SettlementHub render error:', error);
            ctx.fillStyle = '#2a1a0f';
            ctx.fillRect(0, 0, ctx.canvas.width || 800, ctx.canvas.height || 600);
            ctx.fillStyle = '#ff0000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SettlementHub Error', (ctx.canvas.width || 800) / 2, (ctx.canvas.height || 800) / 2);
        }
    }

    renderBackground(ctx, canvas) {
        // Deep sky with gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
        skyGradient.addColorStop(0, '#1a4d7a');      // Deep blue sky
        skyGradient.addColorStop(0.4, '#4d9dcc');    // Mid blue
        skyGradient.addColorStop(0.7, '#99ccff');    // Light blue horizon
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);

        // Atmospheric haze at horizon
        const hazeGradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height * 0.75);
        hazeGradient.addColorStop(0, 'rgba(200, 220, 255, 0)');
        hazeGradient.addColorStop(1, 'rgba(200, 220, 255, 0.3)');
        ctx.fillStyle = hazeGradient;
        ctx.fillRect(0, canvas.height * 0.5, canvas.width, canvas.height * 0.25);

        // Distant hills/mountains
        this.renderDistantHills(ctx, canvas);

        // Mid-ground forest with depth
        this.renderMidGroundForest(ctx, canvas);

        // Ground terrain with perspective
        const groundGradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
        groundGradient.addColorStop(0, '#5fa366');     // Mid grass
        groundGradient.addColorStop(0.4, '#4a8a52');   // Darker grass
        groundGradient.addColorStop(1, '#3d6b42');     // Dark foreground
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);

        // Ground texture/detail
        this.renderGroundDetail(ctx, canvas);
    }

    renderDistantHills(ctx, canvas) {
        // Far background hills with atmospheric perspective
        ctx.fillStyle = '#5a7d8a';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.45);
        ctx.quadraticCurveTo(canvas.width * 0.2, canvas.height * 0.35, canvas.width * 0.4, canvas.height * 0.42);
        ctx.quadraticCurveTo(canvas.width * 0.6, canvas.height * 0.32, canvas.width * 0.8, canvas.height * 0.43);
        ctx.quadraticCurveTo(canvas.width * 0.9, canvas.height * 0.38, canvas.width, canvas.height * 0.45);
        ctx.lineTo(canvas.width, canvas.height * 0.6);
        ctx.lineTo(0, canvas.height * 0.6);
        ctx.fill();

        // Hill shadow/depth
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height * 0.48);
        ctx.quadraticCurveTo(canvas.width * 0.5, canvas.height * 0.38, canvas.width, canvas.height * 0.48);
        ctx.lineTo(canvas.width, canvas.height * 0.6);
        ctx.lineTo(0, canvas.height * 0.6);
        ctx.fill();
    }

    renderMidGroundForest(ctx, canvas) {
        // Trees in middle distance with scale
        const trees = [
            { x: 40, y: canvas.height * 0.48, scale: 0.6, opacity: 0.7 },
            { x: 80, y: canvas.height * 0.52, scale: 0.7, opacity: 0.75 },
            { x: canvas.width - 60, y: canvas.height * 0.50, scale: 0.65, opacity: 0.72 },
            { x: canvas.width - 120, y: canvas.height * 0.54, scale: 0.75, opacity: 0.78 },
        ];

        trees.forEach(tree => {
            ctx.globalAlpha = this.contentOpacity * tree.opacity;
            this.renderDistantTree(ctx, tree.x, tree.y, tree.scale);
        });
        ctx.globalAlpha = this.contentOpacity;
    }

    renderDistantTree(ctx, x, y, scale) {
        // Simplified distant tree with perspective
        ctx.fillStyle = '#2d5a2d';
        ctx.beginPath();
        ctx.arc(x, y - 15 * scale, 18 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        ctx.fillStyle = '#4d3d2d';
        ctx.fillRect(x - 3 * scale, y - 5 * scale, 6 * scale, 12 * scale);
    }

    renderGroundDetail(ctx, canvas) {
        // Add subtle grass texture
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;

        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = canvas.height * 0.65 + Math.random() * (canvas.height * 0.35);
            const length = 3 + Math.random() * 8;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 1, y - length);
            ctx.stroke();
        }
    }

    renderSettlementScene(ctx, canvas) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.76;  // Ground level, lower

        // Render decorative terrain (trees and rocks) - behind everything
        this.renderSettlementTerrain(ctx, canvas, centerX, centerY);

        // Render paths connecting buildings BEFORE walls so they appear underneath
        this.renderSettlementPaths(ctx, canvas, centerX, centerY);

        // Render 3D palisade walls - on top of paths, behind buildings
        this.renderEllipticalPalisade(ctx, canvas, centerX, centerY);

        // Render settlement buildings (after walls so they appear on top)
        this.renderSettlementBuildings(ctx, canvas);

        // Ground shadow under settlement
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 50, 340, 120, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    renderEllipticalPalisade(ctx, canvas, centerX, centerY) {
        // Simple vertical stick palisade with 3D trunk texture
        const radiusX = 360;
        const radiusY = 140;
        
        // Draw foundation/berm
        ctx.fillStyle = '#6b7a6b';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX + 20, radiusY + 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Darker shade for shadow
        ctx.fillStyle = '#5a6a5a';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 12, radiusX + 18, radiusY + 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw vertical STICK posts around the ellipse with 3D trunk texture
        // Render in proper z-order: back posts first, then sides, then front for natural layering
        const postSpacing = 18; // Vertical sticks
        const perimeter = Math.PI * (radiusX + radiusY) * 1.5;
        const postCount = Math.ceil(perimeter / postSpacing);
        
        // Collect all posts with depth info
        const posts = [];
        for (let i = 0; i < postCount; i++) {
            const angle = (i / postCount) * Math.PI * 2;
            const x = centerX + radiusX * Math.cos(angle);
            const y = centerY + radiusY * Math.sin(angle);
            
            // Skip if this is the center gate area
            const distFromCenterGate = Math.abs(x - centerX);
            if (distFromCenterGate < 50 && y > centerY + radiusY - 20) {
                continue;
            }
            
            posts.push({ x, y, angle, i });
        }
        
        // Sort posts by Y position (depth) - back (smaller Y) to front (larger Y)
        posts.sort((a, b) => a.y - b.y);
        
        // Render posts in depth order
        posts.forEach(post => {
            const { x, y } = post;
            
            // Draw 3D trunk with texture
            const postWidth = 12;
            const postHeight = 60;
            
            // Left side shadow (3D depth)
            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(x - postWidth/2 - 3, y - postHeight, 3, postHeight);
            
            // Main trunk - medium brown
            ctx.fillStyle = '#6b5a47';
            ctx.fillRect(x - postWidth/2, y - postHeight, postWidth, postHeight);
            
            // Right side highlight (3D depth)
            ctx.fillStyle = '#8b7a67';
            ctx.fillRect(x + postWidth/2, y - postHeight, 2, postHeight);
            
            // Vertical grain lines for wood texture
            ctx.strokeStyle = '#4a3a2a';
            ctx.lineWidth = 1;
            for (let g = 0; g < postHeight; g += 6) {
                ctx.beginPath();
                ctx.moveTo(x - postWidth/2 + 2, y - postHeight + g);
                ctx.lineTo(x - postWidth/2 + 2, y - postHeight + g + 4);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(x + postWidth/2 - 2, y - postHeight + g);
                ctx.lineTo(x + postWidth/2 - 2, y - postHeight + g + 4);
                ctx.stroke();
            }
            
            // Post top cap
            ctx.fillStyle = '#5a4a37';
            ctx.beginPath();
            ctx.moveTo(x - postWidth/2, y - postHeight);
            ctx.lineTo(x, y - postHeight - 4);
            ctx.lineTo(x + postWidth/2, y - postHeight);
            ctx.fill();
        });
        
        // Draw single integrated GATE in the middle of the front wall
        this.renderIntegratedGate(ctx, centerX, centerY + radiusY - 5);
        
        // Draw GUARD TOWERS on either side of gate - properly scaled
        this.renderGuardTowerWithBase(ctx, centerX - 120, centerY + radiusY + 15);
        this.renderGuardTowerWithBase(ctx, centerX + 120, centerY + radiusY + 15);
    }
    
    renderIntegratedGate(ctx, x, y) {
        // Gate integrated into wall structure - part of the wall
        const gateWidth = 55;
        const gateHeight = 60;
        
        // Posts flanking gate (left and right)
        // Left post
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(x - gateWidth/2 - 8, y - gateHeight, 3, gateHeight);
        ctx.fillStyle = '#6b5a47';
        ctx.fillRect(x - gateWidth/2 - 5, y - gateHeight, 10, gateHeight);
        ctx.fillStyle = '#8b7a67';
        ctx.fillRect(x - gateWidth/2 + 5, y - gateHeight, 2, gateHeight);
        
        // Right post
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(x + gateWidth/2 + 5, y - gateHeight, 3, gateHeight);
        ctx.fillStyle = '#6b5a47';
        ctx.fillRect(x + gateWidth/2 - 5, y - gateHeight, 10, gateHeight);
        ctx.fillStyle = '#8b7a67';
        ctx.fillRect(x + gateWidth/2 + 5, y - gateHeight, 2, gateHeight);
        
        // Gate frame - wooden structure
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(x - gateWidth/2, y - gateHeight, gateWidth, gateHeight);
        
        // Vertical planks on gate
        ctx.strokeStyle = '#5a4630';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const plankX = x - gateWidth/2 + (gateWidth * i / 4);
            ctx.beginPath();
            ctx.moveTo(plankX, y - gateHeight);
            ctx.lineTo(plankX, y);
            ctx.stroke();
        }
        
        // Horizontal support beams
        ctx.lineWidth = 3;
        for (let i = 1; i < 3; i++) {
            const supportY = y - gateHeight + (gateHeight * i / 3);
            ctx.beginPath();
            ctx.moveTo(x - gateWidth/2, supportY);
            ctx.lineTo(x + gateWidth/2, supportY);
            ctx.stroke();
        }
        
        // Gate hinges
        ctx.fillStyle = '#c0a080';
        ctx.fillRect(x - gateWidth/2 - 6, y - gateHeight + 10, 4, 5);
        ctx.fillRect(x - gateWidth/2 - 6, y - 18, 4, 5);
        ctx.fillRect(x + gateWidth/2 + 2, y - gateHeight + 10, 4, 5);
        ctx.fillRect(x + gateWidth/2 + 2, y - 18, 4, 5);
        
        // Fill gaps between gate and wall with wall pieces (left and right)
        const wallGapSize = 8;
        const wallGapHeight = gateHeight;
        
        // Left wall gap - small wooden fill posts
        for (let i = 0; i < 3; i++) {
            const fillX = x - gateWidth/2 - 5 - (i * 8);
            ctx.fillStyle = '#6b5a47';
            ctx.fillRect(fillX, y - gateHeight, 6, wallGapHeight);
            
            ctx.strokeStyle = '#4a3a2a';
            ctx.lineWidth = 1;
            ctx.strokeRect(fillX, y - gateHeight, 6, wallGapHeight);
            
            // Wood grain
            for (let g = 0; g < wallGapHeight; g += 8) {
                ctx.beginPath();
                ctx.moveTo(fillX + 1, y - gateHeight + g);
                ctx.lineTo(fillX + 5, y - gateHeight + g);
                ctx.stroke();
            }
        }
        
        // Right wall gap - small wooden fill posts
        for (let i = 0; i < 3; i++) {
            const fillX = x + gateWidth/2 + 5 + (i * 8);
            ctx.fillStyle = '#6b5a47';
            ctx.fillRect(fillX, y - gateHeight, 6, wallGapHeight);
            
            ctx.strokeStyle = '#4a3a2a';
            ctx.lineWidth = 1;
            ctx.strokeRect(fillX, y - gateHeight, 6, wallGapHeight);
            
            // Wood grain
            for (let g = 0; g < wallGapHeight; g += 8) {
                ctx.beginPath();
                ctx.moveTo(fillX + 1, y - gateHeight + g);
                ctx.lineTo(fillX + 5, y - gateHeight + g);
                ctx.stroke();
            }
        }
    }
    
    renderWatchtowerStructure(ctx, x, y) {
        // Tower structure based on BasicTower rendering style
        const baseSize = 50;
        const baseHeight = 8;
        const towerSize = 42;
        const towerHeight = 35;
        const platformSize = 48;
        const platformHeight = 5;
        const roofSize = 50;
        const roofHeight = 20;
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.save();
        ctx.translate(x + 2, y + 2);
        ctx.scale(1, 0.3);
        ctx.fillRect(-baseSize/2, -baseSize/2, baseSize, baseSize);
        ctx.restore();
        
        // Stone base
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(x - baseSize/2, y - baseHeight, baseSize, baseHeight);
        
        // Base top highlight
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(x - baseSize/2, y - baseHeight, baseSize, 2);
        
        // Stone lines
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - baseSize/2, y - baseHeight, baseSize, baseHeight);
        for (let i = 1; i < 3; i++) {
            const stoneY = y - baseHeight + (baseHeight * i / 3);
            ctx.beginPath();
            ctx.moveTo(x - baseSize/2, stoneY);
            ctx.lineTo(x + baseSize/2, stoneY);
            ctx.stroke();
        }
        
        // Tower structure
        const towerY = y - baseHeight - towerHeight;
        const platformY = towerY - platformHeight;
        const roofY = platformY - roofHeight;
        
        // Four corner posts with wood grain
        const postSize = 4;
        const postOffset = towerSize/2 - postSize/2;
        
        ctx.fillStyle = '#7a3f18';
        const posts = [
            {x: -postOffset}, {x: postOffset}
        ];
        
        posts.forEach(post => {
            // Post
            ctx.fillRect(x + post.x, towerY, postSize, towerHeight);
            
            // Wood grain
            ctx.strokeStyle = '#5a2f10';
            ctx.lineWidth = 1;
            for (let i = 1; i < 5; i++) {
                const grainY = towerY + (towerHeight * i / 6);
                ctx.beginPath();
                ctx.moveTo(x + post.x, grainY);
                ctx.lineTo(x + post.x + postSize, grainY);
                ctx.stroke();
            }
            
            // Metal corner plate
            ctx.fillStyle = '#606060';
            ctx.fillRect(x + post.x - 1, towerY, 5, 8);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(x + post.x - 1, towerY, 5, 8);
        });
        
        // Horizontal braces
        ctx.strokeStyle = '#5b3a24';
        ctx.lineWidth = 2;
        const braceYs = [
            towerY + towerHeight * 0.3,
            towerY + towerHeight * 0.6
        ];
        braceYs.forEach(braceY => {
            ctx.beginPath();
            ctx.moveTo(x - postOffset + 1, braceY);
            ctx.lineTo(x + postOffset - 1, braceY);
            ctx.stroke();
        });
        
        // Platform
        ctx.fillStyle = '#CDAA7A';
        ctx.fillRect(x - platformSize/2, platformY, platformSize, platformHeight);
        
        // Platform top bevel
        ctx.fillStyle = '#DABE94';
        ctx.fillRect(x - platformSize/2, platformY, platformSize, 2);
        
        // Platform planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        const planks = 5;
        for (let i = 0; i < planks; i++) {
            const plankX = x - platformSize/2 + (platformSize * i / planks);
            ctx.beginPath();
            ctx.moveTo(plankX, platformY);
            ctx.lineTo(plankX, platformY + platformHeight);
            ctx.stroke();
        }
        
        // Roof posts
        const roofPostOffset = platformSize/2 - 2;
        ctx.fillStyle = '#5a341d';
        ctx.fillRect(x - roofPostOffset, platformY, 2, -roofHeight);
        ctx.fillRect(x + roofPostOffset, platformY, 2, -roofHeight);
        ctx.fillRect(x, platformY, 2, -roofHeight);
        
        // Roof
        ctx.fillStyle = '#6f3b1a';
        ctx.fillRect(x - roofSize/2, roofY, roofSize, 4);
        
        // Roof planks
        ctx.strokeStyle = '#4a2a17';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const plankX = x - roofSize/2 + (roofSize * i / 4);
            ctx.beginPath();
            ctx.moveTo(plankX, roofY);
            ctx.lineTo(plankX, roofY + 4);
            ctx.stroke();
        }
        
        // Roof peak
        ctx.fillStyle = '#4a2a1a';
        ctx.beginPath();
        ctx.moveTo(x - roofSize/2, roofY);
        ctx.lineTo(x, roofY - 8);
        ctx.lineTo(x + roofSize/2, roofY);
        ctx.fill();
        
        // Flag/banner on center post
        ctx.fillStyle = '#8B1E3F';
        ctx.beginPath();
        ctx.moveTo(x + 1, platformY - roofHeight * 0.3);
        ctx.lineTo(x + 8, platformY - roofHeight * 0.3 + 3);
        ctx.lineTo(x + 1, platformY - roofHeight * 0.3 + 6);
        ctx.closePath();
        ctx.fill();
    }

    renderGuardTowerWithBase(ctx, x, y) {
        // Guard tower styled like BasicTower - wooden tower with stone base, connected to ground
        const towerSize = 50;
        const towerHeight = 70;
        const baseSize = 60;
        const baseHeight = 12;
        const platformSize = 55;
        const platformHeight = 8;
        const roofSize = 58;
        const roofHeight = 30;
        
        // Shadow - connected to ground
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.save();
        ctx.translate(x + 3, y + 3);
        ctx.scale(1, 0.3);
        ctx.fillRect(-baseSize/2, -baseSize/2, baseSize, baseSize);
        ctx.restore();
        
        // Stone base platform - connected to ground
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(x - baseSize/2, y - baseHeight, baseSize, baseHeight);
        
        // Base top highlight
        ctx.fillStyle = '#D3D3D3';
        ctx.fillRect(x - baseSize/2, y - baseHeight, baseSize, 2);
        
        // Stone base detail
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - baseSize/2, y - baseHeight, baseSize, baseHeight);
        
        // Main tower body - wood
        const towerY = y - baseHeight - towerHeight;
        
        // Wooden posts at corners
        ctx.fillStyle = '#7a3f18';
        const postSize = 6;
        const postOffset = towerSize/2 - postSize;
        ctx.fillRect(x - postOffset, towerY, postSize, towerHeight);
        ctx.fillRect(x + postOffset, towerY, postSize, towerHeight);
        
        // Wood grain lines
        ctx.strokeStyle = '#5a2f10';
        ctx.lineWidth = 1;
        for (let i = 1; i < 7; i++) {
            const grainY = towerY + (towerHeight * i / 8);
            ctx.beginPath();
            ctx.moveTo(x - postOffset, grainY);
            ctx.lineTo(x + postOffset + postSize, grainY);
            ctx.stroke();
        }
        
        // Tower main fill between posts
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(x - towerSize/2 + postSize, towerY, towerSize - (postSize * 2), towerHeight);
        
        // Tower stones/planks
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 1;
        for (let i = 0; i < towerHeight; i += 10) {
            ctx.beginPath();
            ctx.moveTo(x - towerSize/2, towerY + i);
            ctx.lineTo(x + towerSize/2, towerY + i);
            ctx.stroke();
        }
        
        // Metal corner plates
        ctx.fillStyle = '#606060';
        ctx.fillRect(x - postOffset - 1, towerY, 5, 12);
        ctx.fillRect(x + postOffset, towerY, 5, 12);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(x - postOffset - 1, towerY, 5, 12);
        ctx.strokeRect(x + postOffset, towerY, 5, 12);
        
        // Platform at top
        ctx.fillStyle = '#DABE94';
        ctx.fillRect(x - platformSize/2, towerY - platformHeight, platformSize, platformHeight);
        
        // Platform planks
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const plankX = x - platformSize/2 + (platformSize * i / 5);
            ctx.beginPath();
            ctx.moveTo(plankX, towerY - platformHeight);
            ctx.lineTo(plankX, towerY);
            ctx.stroke();
        }
        
        // Platform edge
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - platformSize/2, towerY - platformHeight, platformSize, platformHeight);
        
        // Roof posts - center and sides
        ctx.fillStyle = '#5a341d';
        ctx.fillRect(x - platformSize/2 + 2, towerY - platformHeight - roofHeight, 3, roofHeight);
        ctx.fillRect(x + platformSize/2 - 5, towerY - platformHeight - roofHeight, 3, roofHeight);
        ctx.fillRect(x - 2, towerY - platformHeight - roofHeight, 3, roofHeight);
        
        // Roof
        const roofY = towerY - platformHeight - roofHeight;
        ctx.fillStyle = '#6f3b1a';
        ctx.fillRect(x - roofSize/2, roofY, roofSize, 4);
        
        // Roof planks
        ctx.strokeStyle = '#4a2a17';
        ctx.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
            const plankX = x - roofSize/2 + (roofSize * i / 4);
            ctx.beginPath();
            ctx.moveTo(plankX, roofY);
            ctx.lineTo(plankX, roofY + 4);
            ctx.stroke();
        }
        
        // Roof peak
        ctx.fillStyle = '#4a2a1a';
        ctx.beginPath();
        ctx.moveTo(x - roofSize/2, roofY);
        ctx.lineTo(x, roofY - 12);
        ctx.lineTo(x + roofSize/2, roofY);
        ctx.fill();
        
        // Crenellations on top
        ctx.fillStyle = '#696969';
        const battlementCount = 5;
        const battlementSpacing = roofSize / (battlementCount + 1);
        for (let i = 1; i <= battlementCount; i++) {
            const bx = x - roofSize/2 + battlementSpacing * i;
            ctx.fillRect(bx - 3, roofY - 8, 6, 8);
        }
        
        // Arrow slits
        ctx.fillStyle = '#2a2a2a';
        for (let h = 0; h < 3; h++) {
            ctx.fillRect(x - towerSize/4, towerY + 15 + (h * 15), 2, 8);
            ctx.fillRect(x + towerSize/4 - 2, towerY + 15 + (h * 15), 2, 8);
        }
    }

    renderWoodenPalisadeSide(ctx, x1, y1, x2, y2, side) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;

        // Post spacing
        const postSpacing = 35;
        const postCount = Math.floor(length / postSpacing) + 1;

        for (let i = 0; i < postCount; i++) {
            const px = x1 + unitX * i * postSpacing;
            const py = y1 + unitY * i * postSpacing;

            // Wooden post
            ctx.fillStyle = '#8b6f47';
            ctx.fillRect(px - 4, py - 3, 8, 50);

            // Post detail lines
            ctx.strokeStyle = '#5a4630';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px - 3, py);
            ctx.lineTo(px - 3, py + 50);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(px + 3, py);
            ctx.lineTo(px + 3, py + 50);
            ctx.stroke();

            // Post top
            ctx.fillStyle = '#6b5a42';
            ctx.beginPath();
            ctx.moveTo(px - 4, py - 3);
            ctx.lineTo(px, py - 8);
            ctx.lineTo(px + 4, py - 3);
            ctx.fill();
        }

        // Horizontal beam
        ctx.fillStyle = '#9a7a5a';
        ctx.fillRect(x1, y1 + 20, dx || dy ? length : 1, 4);

        // Beam shadow
        ctx.fillStyle = '#6a5a42';
        ctx.fillRect(x1, y1 + 24, dx || dy ? length : 1, 2);
    }

    renderWoodenGate(ctx, x, y, side) {
        // Gate frame
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(x - 40, y - 5, 80, 45);

        // Gate boards - vertical
        ctx.strokeStyle = '#5a4630';
        ctx.lineWidth = 2;
        for (let i = 1; i < 4; i++) {
            const boardX = x - 40 + (80 / 4) * i;
            ctx.beginPath();
            ctx.moveTo(boardX, y - 5);
            ctx.lineTo(boardX, y + 40);
            ctx.stroke();
        }

        // Gate door center line
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x, y + 40);
        ctx.stroke();

        // Gate hinges
        ctx.fillStyle = '#c0a080';
        for (let i = 0; i < 3; i++) {
            const hy = y + 5 + i * 12;
            ctx.fillRect(x - 45, hy, 4, 4);
            ctx.fillRect(x + 41, hy, 4, 4);
        }

        // Gate handle
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(x + 15, y + 15, 6, 12);
    }

    renderSettlementBuildings(ctx, canvas) {
        // Render all actual building instances with their full game rendering
        this.settlementBuildings.forEach(item => {
            if (item.building && item.building.render) {
                ctx.globalAlpha = this.contentOpacity;
                
                // Special handling for TrainingGrounds: render scaled-down version at 70% for settlement
                if (item.building instanceof TrainingGrounds) {
                    this.renderTrainingGroundsSettlement(ctx, item.building);
                } else {
                    const size = item.scale * 4; // Convert scale to building size (4x4 grid)
                    item.building.render(ctx, size);
                }
                
                ctx.globalAlpha = 1;
            }
        });
    }

    renderTrainingGroundsSettlement(ctx, building) {
        // Render a 70% scaled version of training grounds for the settlement display
        const scale = 0.7;
        const x = building.x;
        const y = building.y;
        
        // Grass base
        const grassGradient = ctx.createLinearGradient(
            x - (200 * scale), y - (192 * scale),
            x - (200 * scale), y + (192 * scale)
        );
        grassGradient.addColorStop(0, '#5A7A3A');
        grassGradient.addColorStop(0.5, '#6B8E3A');
        grassGradient.addColorStop(1, '#4A6A2A');
        
        ctx.fillStyle = grassGradient;
        ctx.fillRect(x - (200 * scale), y - (192 * scale), 400 * scale, 384 * scale);
        
        // Fence perimeter at 70%
        const posts = [
            { x: -200, y: -192, endX: 200, endY: -192, posts: 13 },
            { x: 200, y: -192, endX: 200, endY: 192, posts: 12 },
            { x: 200, y: 192, endX: -200, endY: 192, posts: 13 },
            { x: -200, y: 192, endX: -200, endY: -192, posts: 12 }
        ];
        
        posts.forEach(segment => {
            const startX = x + (segment.x * scale);
            const startY = y + (segment.y * scale);
            const endX = x + (segment.endX * scale);
            const endY = y + (segment.endY * scale);
            
            const angle = Math.atan2(endY - startY, endX - startX);
            const distance = Math.hypot(endX - startX, endY - startY);
            const postSpacing = distance / (segment.posts - 1);
            
            for (let i = 0; i < segment.posts; i++) {
                const postX = startX + Math.cos(angle) * (i * postSpacing);
                const postY = startY + Math.sin(angle) * (i * postSpacing);
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(postX - 0.7, postY + 0.7, 1.4, 1.05);
                
                ctx.fillStyle = '#8B7355';
                ctx.fillRect(postX - 0.7, postY - (8 * scale), 1.4, 8 * scale);
                
                ctx.strokeStyle = '#696969';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(postX - 0.7, postY - (8 * scale), 1.4, 8 * scale);
            }
        });
        
        // Hut
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(x + (-168 * scale), y + (-152 * scale), 40 * scale, 36 * scale);
        ctx.strokeStyle = '#5a4630';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + (-168 * scale), y + (-152 * scale), 40 * scale, 36 * scale);
        
        // Lane dividers
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 0.7;
        ctx.setLineDash([32 * scale, 32 * scale]);
        
        ctx.beginPath();
        ctx.moveTo(x + (-192 * scale), y + (-112 * scale));
        ctx.lineTo(x + (192 * scale), y + (-112 * scale));
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + (-192 * scale), y + (32 * scale));
        ctx.lineTo(x + (192 * scale), y + (32 * scale));
        ctx.stroke();
        
        ctx.setLineDash([]);
    }

    renderSettlementTerrain(ctx, canvas, centerX, centerY) {
        // Render decorative terrain elements within the settlement boundary
        // Boundary: ellipse center (centerX, centerY), radiusX=360, radiusY=140
        
        // Paths are now rendered separately in renderSettlementScene() for proper layering
        
        // Render GuardPost living quarters around the settlement interior
        // These represent barracks and living areas for defenders
        this.renderGuardPostQuarters(ctx, centerX, centerY);
        
        // Flower beds and gardens - positioned within boundary
        this.renderFlowerBeds(ctx, centerX, centerY);
        
        // Small decorative trees positioned inside boundary
        this.renderSimpleTree(ctx, centerX - 310, centerY - 15, 30, '#0D3817');
        this.renderSimpleTree(ctx, centerX - 300, centerY + 40, 26, '#1B5E20');
        
        // Right side inside
        this.renderSimpleTree(ctx, centerX + 310, centerY - 15, 30, '#0D3817');
        this.renderSimpleTree(ctx, centerX + 300, centerY + 40, 26, '#1B5E20');
        
        // Small decorative rocks inside boundary
        this.renderSimpleRock(ctx, centerX - 280, centerY + 95, 20);
        this.renderSimpleRock(ctx, centerX + 280, centerY + 95, 20);
        
        // Additional scattered elements for depth - all within boundary
        this.renderSimpleRock(ctx, centerX - 160, centerY + 110, 18);
        this.renderSimpleRock(ctx, centerX + 160, centerY + 110, 18);
        
        // Well/fountain in center
        this.renderWell(ctx, centerX, centerY + 5);
    }

    renderSmallWatchTower(ctx, x, y, size) {
        // Small tower structure similar to guard post but just decorative
        // Base platform
        ctx.fillStyle = '#7a6b5a';
        ctx.fillRect(x - size * 0.6, y, size * 1.2, size * 0.3);
        
        // Main post
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(x - size * 0.15, y - size * 0.6, size * 0.3, size * 0.7);
        
        // Post detail
        ctx.strokeStyle = '#5a4630';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.1, y - size * 0.6);
        ctx.lineTo(x - size * 0.1, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + size * 0.1, y - size * 0.6);
        ctx.lineTo(x + size * 0.1, y);
        ctx.stroke();
        
        // Small roof/roof peak
        ctx.fillStyle = '#6b5a42';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y - size * 0.6);
        ctx.lineTo(x, y - size * 0.85);
        ctx.lineTo(x + size * 0.25, y - size * 0.6);
        ctx.fill();
        
        // Shadow under base
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x - size * 0.6, y + size * 0.3, size * 1.2, 3);
    }

    renderWell(ctx, x, y) {
        // Decorative well in settlement center
        // Well structure
        ctx.fillStyle = '#8b7355';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Well border stone
        ctx.strokeStyle = '#6b5a42';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.stroke();
        
        // Well interior
        ctx.fillStyle = '#3a4a3a';
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Water reflection
        ctx.fillStyle = '#4a6a7a';
        ctx.beginPath();
        ctx.ellipse(x, y - 3, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Rope/wood structure
        ctx.strokeStyle = '#6b5a42';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 20, y - 25);
        ctx.lineTo(x - 25, y - 35);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 20, y - 25);
        ctx.lineTo(x + 25, y - 35);
        ctx.stroke();
        
        // Top bar
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 25, y - 35);
        ctx.lineTo(x + 25, y - 35);
        ctx.stroke();
    }

    renderSettlementPaths(ctx, canvas, centerX, centerY) {
        // Stone/dirt paths connecting buildings inside the settlement
        // Uses natural curved paths for organic feel
        const pathColor = '#9d9181';
        const pathDark = '#7a6f5d';
        const pathEdge = '#6b5f4d';
        
        // Set line cap and join for smoother curves
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Path 1: From entrance (left-bottom) sweeping up to Magic Academy (upper-left)
        this.drawCurvedPath(ctx, [
            { x: centerX - 200, y: centerY + 100 },
            { x: centerX - 160, y: centerY + 60 },
            { x: centerX - 140, y: centerY - 20 }
        ], 28, pathColor, pathDark);
        
        // Path 2: From Magic Academy sweeping across to Tower Forge area
        this.drawCurvedPath(ctx, [
            { x: centerX - 130, y: centerY - 40 },
            { x: centerX - 40, y: centerY - 60 },
            { x: centerX + 100, y: centerY - 40 }
        ], 26, pathColor, pathDark);
        
        // Path 3: From Tower Forge down and around
        this.drawCurvedPath(ctx, [
            { x: centerX + 120, y: centerY - 20 },
            { x: centerX + 140, y: centerY + 40 },
            { x: centerX + 160, y: centerY + 80 }
        ], 24, pathColor, pathDark);
        
        // Path 4: Connecting bottom area from left to right (passes near Gold Mine area)
        this.drawCurvedPath(ctx, [
            { x: centerX - 180, y: centerY + 100 },
            { x: centerX, y: centerY + 110 },
            { x: centerX + 180, y: centerY + 100 }
        ], 26, pathColor, pathDark);
        
        // Central gathering area - slightly elevated
        ctx.fillStyle = pathColor;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 10, 90, 70, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Central area edge highlight
        ctx.strokeStyle = pathDark;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 10, 92, 72, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Add stone texture details to paths
        ctx.fillStyle = 'rgba(100, 100, 100, 0.12)';
        for (let i = 0; i < 25; i++) {
            const x = centerX - 220 + Math.random() * 440;
            const y = centerY - 120 + Math.random() * 220;
            const size = 2 + Math.random() * 4;
            ctx.fillRect(x, y, size, size);
        }
        
        // Add some worn spots where paths intersect
        const intersectionPoints = [
            { x: centerX - 140, y: centerY - 20 },
            { x: centerX, y: centerY - 10 },
            { x: centerX + 100, y: centerY - 20 }
        ];
        
        intersectionPoints.forEach(point => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.beginPath();
            ctx.ellipse(point.x, point.y, 30, 25, 0, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawCurvedPath(ctx, points, width, color, darkColor) {
        // Draw a smooth curved path using quadratic curves
        // Main path fill
        ctx.fillStyle = color;
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.beginPath();
        
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const prevPoint = points[i - 1];
            const currPoint = points[i];
            const nextPoint = points[i + 1];
            
            if (nextPoint) {
                // Calculate control point for smooth curve
                const cpX = currPoint.x;
                const cpY = currPoint.y;
                ctx.quadraticCurveTo(cpX, cpY, 
                    (currPoint.x + nextPoint.x) / 2, 
                    (currPoint.y + nextPoint.y) / 2);
            } else {
                ctx.lineTo(currPoint.x, currPoint.y);
            }
        }
        
        ctx.stroke();
        
        // Path edge for depth - draw offset parallel line
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        ctx.moveTo(points[0].x - width/2.5, points[0].y - width/2.5);
        for (let i = 1; i < points.length; i++) {
            const prevPoint = points[i - 1];
            const currPoint = points[i];
            const nextPoint = points[i + 1];
            
            if (nextPoint) {
                const cpX = currPoint.x - width/2.5;
                const cpY = currPoint.y - width/2.5;
                ctx.quadraticCurveTo(cpX, cpY, 
                    (currPoint.x + nextPoint.x) / 2 - width/2.5, 
                    (currPoint.y + nextPoint.y) / 2 - width/2.5);
            } else {
                ctx.lineTo(currPoint.x - width/2.5, currPoint.y - width/2.5);
            }
        }
        
        ctx.stroke();
    }

    renderGuardPostQuarters(ctx, centerX, centerY) {
        // Render small GuardPost-style structures around the settlement
        // These represent barracks, guard quarters, and living areas
        
        // Create GuardPost instances at various positions around the interior
        const guardPostPositions = [
            // Left side positions
            { x: centerX - 250, y: centerY - 20, scale: 0.65 },
            { x: centerX - 220, y: centerY + 50, scale: 0.65 },
            
            // Right side positions
            { x: centerX + 220, y: centerY + 40, scale: 0.65 },
            { x: centerX + 200, y: centerY - 10, scale: 0.65 },
            
            // Bottom center positions
            { x: centerX - 100, y: centerY + 65, scale: 0.6 },
            { x: centerX + 100, y: centerY + 70, scale: 0.6 },
            
            // Top interior positions
            { x: centerX - 60, y: centerY - 40, scale: 0.6 },
            { x: centerX + 60, y: centerY - 35, scale: 0.6 },
        ];
        
        // Render each guard post
        guardPostPositions.forEach(pos => {
            this.renderGuardPostSmall(ctx, pos.x, pos.y, pos.scale);
        });
    }
    
    renderGuardPostSmall(ctx, x, y, scale = 1.0) {
        // Simplified GuardPost rendering based on BasicTower style
        scale = scale || 0.6;
        
        // Stone base
        ctx.fillStyle = '#8a8a8a';
        const baseWidth = 35 * scale;
        const baseHeight = 40 * scale;
        ctx.fillRect(x - baseWidth/2, y - baseHeight, baseWidth, baseHeight);
        
        // Base shading
        ctx.fillStyle = '#7a7a7a';
        ctx.fillRect(x - baseWidth/2, y - baseHeight + 5 * scale, baseWidth, baseHeight - 10 * scale);
        
        // Wooden corner posts
        ctx.fillStyle = '#6b5a47';
        const cornerOffset = baseWidth * 0.35;
        ctx.fillRect(x - cornerOffset - 2 * scale, y - baseHeight - 20 * scale, 4 * scale, 20 * scale);
        ctx.fillRect(x + cornerOffset - 2 * scale, y - baseHeight - 20 * scale, 4 * scale, 20 * scale);
        
        // Wooden platform
        ctx.fillStyle = '#7a5f3f';
        ctx.fillRect(x - baseWidth/2 - 3 * scale, y - baseHeight - 25 * scale, baseWidth + 6 * scale, 6 * scale);
        
        // Platform railings - vertical posts
        ctx.strokeStyle = '#6b5a47';
        ctx.lineWidth = 1.5 * scale;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 6 * scale, y - baseHeight - 25 * scale);
            ctx.lineTo(x + i * 6 * scale, y - baseHeight - 30 * scale);
            ctx.stroke();
        }
        
        // Roof - small conical shape
        ctx.fillStyle = '#8b3a3a';
        ctx.beginPath();
        ctx.moveTo(x - baseWidth/2, y - baseHeight - 25 * scale);
        ctx.lineTo(x, y - baseHeight - 42 * scale);
        ctx.lineTo(x + baseWidth/2, y - baseHeight - 25 * scale);
        ctx.fill();
        
        // Roof detail
        ctx.strokeStyle = '#6b2a2a';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(x - baseWidth/2 + 2 * scale, y - baseHeight - 23 * scale);
        ctx.lineTo(x, y - baseHeight - 40 * scale);
        ctx.lineTo(x + baseWidth/2 - 2 * scale, y - baseHeight - 23 * scale);
        ctx.stroke();
        
        // Small flag
        ctx.fillStyle = '#cc3333';
        ctx.fillRect(x - 2 * scale, y - baseHeight - 44 * scale, 7 * scale, 3 * scale);
    }

    renderFlowerBeds(ctx, centerX, centerY) {
        // Decorative flower beds positioned within the settlement boundary
        const flowerBeds = [
            { x: centerX - 260, y: centerY - 70, color: '#c74545' },     // Back left
            { x: centerX + 260, y: centerY - 70, color: '#f0a020' },     // Back right
            { x: centerX - 180, y: centerY + 60, color: '#e574d6' },     // Front left
            { x: centerX + 180, y: centerY + 60, color: '#ffd700' }      // Front right
        ];
        
        flowerBeds.forEach(bed => {
            // Flower bed border
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 2;
            ctx.strokeRect(bed.x - 20, bed.y - 10, 40, 20);
            
            // Soil
            ctx.fillStyle = '#6b5344';
            ctx.fillRect(bed.x - 18, bed.y - 8, 36, 16);
            
            // Flowers
            ctx.fillStyle = bed.color;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                const flowerX = bed.x - 10 + i * 10;
                ctx.arc(flowerX, bed.y + 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    renderSimpleTree(ctx, x, y, size, darkColor) {
        // Simple tree rendering - trunk and foliage
        const trunkWidth = size * 0.15;
        const trunkHeight = size * 0.35;
        
        // Trunk
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x - trunkWidth * 0.5, y, trunkWidth, trunkHeight);
        
        // Shadow on trunk
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(x, y, trunkWidth * 0.5, trunkHeight);
        
        // Foliage - top layer
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.45);
        ctx.lineTo(x + size * 0.3, y - size * 0.05);
        ctx.lineTo(x - size * 0.3, y - size * 0.05);
        ctx.closePath();
        ctx.fill();
        
        // Foliage - middle layer
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.25, y + size * 0.1);
        ctx.lineTo(x - size * 0.25, y + size * 0.1);
        ctx.closePath();
        ctx.fill();
    }

    renderSimpleRock(ctx, x, y, size) {
        // Simple rock rendering
        ctx.fillStyle = '#6b6b6b';
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.6, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Rock shadow/depth
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.2, y + size * 0.15, size * 0.5, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = '#8b8b8b';
        ctx.beginPath();
        ctx.ellipse(x - size * 0.15, y - size * 0.1, size * 0.25, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTitle(ctx, canvas) {
        ctx.globalAlpha = 0.8;
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px serif';
        ctx.fillStyle = '#d4af37';
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.fillText('SETTLEMENT', canvas.width / 2, 40);
        ctx.strokeText('SETTLEMENT', canvas.width / 2, 40);

        ctx.font = '16px serif';
        ctx.fillStyle = '#c9a876';
        ctx.fillText('Click buildings to interact', canvas.width / 2, 65);
        ctx.globalAlpha = 1;
    }
}

/**
 * Upgrades Menu Popup
 * Allows player to view and unlock tower/building upgrades
 */
class UpgradesMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.upgradesList = [
            { name: 'Faster Projectiles', description: 'Increase projectile speed by 20%', unlocked: false },
            { name: 'Enhanced Range', description: 'Tower range increased by 15%', unlocked: false },
            { name: 'Piercing Shots', description: 'Projectiles pierce through 1 enemy', unlocked: false },
            { name: 'Elemental Towers', description: 'Unlock element-based towers', unlocked: false },
            { name: 'Explosive Barrels', description: 'Place explosive traps', unlocked: false },
        ];
        this.closeButtonHovered = false;
        this.selectedUpgrade = -1;
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
    }

    close() {
        this.isOpen = false;
        this.settlementHub.closePopup();
    }

    update(deltaTime) {
        if (this.isOpen && this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
    }

    updateHoverState(x, y) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 250;
        const menuY = canvas.height / 2 - 200;
        const menuWidth = 500;
        const menuHeight = 400;

        // Check close button
        const closeX = menuX + menuWidth - 40;
        const closeY = menuY + 15;
        this.closeButtonHovered = x >= closeX && x <= closeX + 30 &&
                                 y >= closeY && y <= closeY + 30;

        this.stateManager.canvas.style.cursor = this.closeButtonHovered ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 250;
        const menuY = canvas.height / 2 - 200;
        const menuWidth = 500;

        // Check close button
        const closeX = menuX + menuWidth - 40;
        const closeY = menuY + 15;
        if (x >= closeX && x <= closeX + 30 && y >= closeY && y <= closeY + 30) {
            this.close();
        }
    }

    render(ctx) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 250;
        const menuY = canvas.height / 2 - 200;
        const menuWidth = 500;
        const menuHeight = 400;

        // Fade background
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        // Popup background
        ctx.globalAlpha = Math.min(1, this.animationProgress);
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        // Border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        // Title
        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.fillText('TOWER UPGRADES', canvas.width / 2, menuY + 40);

        // Close button
        ctx.fillStyle = this.closeButtonHovered ? '#ff6b6b' : '#8b0000';
        ctx.fillRect(menuX + menuWidth - 40, menuY + 15, 30, 30);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1;
        ctx.strokeRect(menuX + menuWidth - 40, menuY + 15, 30, 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('×', menuX + menuWidth - 25, menuY + 34);

        // Upgrades list
        ctx.font = '14px serif';
        ctx.textAlign = 'left';
        let yOffset = menuY + 70;
        
        this.upgradesList.forEach((upgrade, index) => {
            ctx.fillStyle = '#c9a876';
            ctx.fillText(`• ${upgrade.name}`, menuX + 20, yOffset);
            
            ctx.font = '12px serif';
            ctx.fillStyle = '#999';
            ctx.fillText(upgrade.description, menuX + 30, yOffset + 18);
            
            ctx.font = '14px serif';
            ctx.fillStyle = upgrade.unlocked ? '#FFD700' : '#666';
            ctx.textAlign = 'right';
            ctx.fillText(upgrade.unlocked ? '[UNLOCKED]' : '[LOCKED]', menuX + menuWidth - 20, yOffset);
            
            ctx.textAlign = 'left';
            yOffset += 50;
        });

        ctx.globalAlpha = 1;
    }
}

/**
 * Settlement Options Menu Popup
 * Allows player to save, load, and exit
 */
class SettlementOptionsMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.buttons = [
            { label: 'SAVE GAME', action: 'save', hovered: false },
            { label: 'LOAD GAME', action: 'load', hovered: false },
            { label: 'MAIN MENU', action: 'menu', hovered: false },
            { label: 'CLOSE', action: 'close', hovered: false },
        ];
        this.buttonWidth = 180;
        this.buttonHeight = 50;
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
    }

    close() {
        this.isOpen = false;
        this.settlementHub.closePopup();
    }

    update(deltaTime) {
        if (this.isOpen && this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
    }

    updateHoverState(x, y) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 150;
        const menuY = canvas.height / 2 - 150;

        this.buttons.forEach((button, index) => {
            const buttonX = menuX + 30;
            const buttonY = menuY + 60 + index * 70;
            button.hovered = x >= buttonX && x <= buttonX + this.buttonWidth &&
                           y >= buttonY && y <= buttonY + this.buttonHeight;
        });

        this.stateManager.canvas.style.cursor =
            this.buttons.some(b => b.hovered) ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 150;
        const menuY = canvas.height / 2 - 150;

        this.buttons.forEach((button, index) => {
            const buttonX = menuX + 30;
            const buttonY = menuY + 60 + index * 70;

            if (x >= buttonX && x <= buttonX + this.buttonWidth &&
                y >= buttonY && y <= buttonY + this.buttonHeight) {
                this.handleButtonClick(button.action);
            }
        });
    }

    handleButtonClick(action) {
        if (action === 'save') {
            SaveSystem.saveGame(this.stateManager.currentSaveSlot, this.stateManager.currentSaveData);
        } else if (action === 'load') {
            this.stateManager.changeState('loadGame');
        } else if (action === 'menu') {
            this.stateManager.changeState('mainMenu');
        } else if (action === 'close') {
            this.close();
        }
    }

    render(ctx) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 150;
        const menuY = canvas.height / 2 - 150;
        const menuWidth = 300;
        const menuHeight = 320;

        // Fade background
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        // Popup background
        ctx.globalAlpha = Math.min(1, this.animationProgress);
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        // Border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        // Title
        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.fillText('OPTIONS', canvas.width / 2, menuY + 40);

        // Buttons
        this.buttons.forEach((button, index) => {
            const buttonX = menuX + 30;
            const buttonY = menuY + 60 + index * 70;

            // Button background
            ctx.fillStyle = button.hovered ? '#3a2a1a' : '#1a0f05';
            ctx.fillRect(buttonX, buttonY, this.buttonWidth, this.buttonHeight);

            // Button border
            ctx.strokeStyle = button.hovered ? '#d4af37' : '#664422';
            ctx.lineWidth = button.hovered ? 2 : 1;
            ctx.strokeRect(buttonX, buttonY, this.buttonWidth, this.buttonHeight);

            // Button text
            ctx.font = 'bold 16px serif';
            ctx.fillStyle = button.hovered ? '#d4af37' : '#c9a876';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(button.label, buttonX + this.buttonWidth / 2, buttonY + this.buttonHeight / 2);
        });

        ctx.globalAlpha = 1;
    }
}
