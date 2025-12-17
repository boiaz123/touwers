import { SaveSystem } from '../SaveSystem.js';
import { TrainingGrounds } from '../../entities/buildings/TrainingGrounds.js';
import { TowerForge } from '../../entities/buildings/TowerForge.js';
import { MagicAcademy } from '../../entities/buildings/MagicAcademy.js';
import { GoldMine } from '../../entities/buildings/GoldMine.js';
import { GuardPost } from '../../entities/towers/GuardPost.js';
import { SettlementBuildingVisuals } from '../SettlementBuildingVisuals.js';

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
        this.statsPopup = null;
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
            // === MAIN INTERACTIVE BUILDINGS ===
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
            // Gold Mine - positioned to the right side of settlement
            {
                building: new GoldMine(centerX + 700, centerY - 80, 1, 1),
                scale: 29,
                clickable: true,
                action: 'stats'
            },

            // === GUARD POST QUARTERS (BARRACKS) ===
            // Left side positions
            {
                building: new GuardPost(centerX - 260, centerY - 20, 0, 0),
                scale: 0.65,
                clickable: false,
                action: null
            },
            {
                building: new GuardPost(centerX - 240, centerY - 60, 0, 0),
                scale: 0.65,
                clickable: false,
                action: null
            },
            
            {
                building: new GuardPost(centerX - 220, centerY + 20, 0, 0),
                scale: 0.65,
                clickable: false,
                action: null
            },
            {
                building: new GuardPost(centerX - 200, centerY - 30, 0, 0),
                scale: 0.65,
                clickable: false,
                action: null
            },
            
            {
                building: new GuardPost(centerX - 180, centerY + 15, 0, 0),
                scale: 0.6,
                clickable: false,
                action: null
            },

            {
                building: new GuardPost(centerX + 165, centerY + 15, 0, 0),
                scale: 0.6,
                clickable: false,
                action: null
            },

            {
                building: new GuardPost(centerX + 180, centerY + 35, 0, 0),
                scale: 0.6,
                clickable: false,
                action: null
            },

            {
                building: new GuardPost(centerX + 240, centerY + 20, 0, 0),
                scale: 0.6,
                clickable: false,
                action: null
            },
                                   

            {
                building: new GuardPost(centerX - 560, centerY - 80, 0, 0),
                scale: 0.6,
                clickable: false,
                action: null
            },

            {
                building: new GuardPost(centerX + 500, centerY - 60, 0, 0),
                scale: 0.6,
                clickable: false,
                action: null
            },

            {
                building: new GuardPost(centerX + 460, centerY - 25, 0, 0),
                scale: 0.6,
                clickable: false,
                action: null
            }
        ];
        
        this.setupMouseListeners();
    }

    exit() {
        this.removeMouseListeners();
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
        } else if (this.activePopup === 'stats' && this.statsPopup) {
            this.statsPopup.updateHoverState(x, y);
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
        } else if (this.activePopup === 'stats' && this.statsPopup) {
            this.statsPopup.handleClick(x, y);
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
                        x: item.building.x - size / 2,
                        y: item.building.y - size / 2,
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
        } else if (buildingItem.action === 'stats') {
            this.activePopup = 'stats';
            if (!this.statsPopup) {
                this.statsPopup = new StatsPanel(this.stateManager, this);
            }
            this.statsPopup.open();
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
        } else if (this.activePopup === 'stats' && this.statsPopup) {
            this.statsPopup.update(deltaTime);
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
            } else if (this.activePopup === 'stats' && this.statsPopup) {
                this.statsPopup.render(ctx);
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

        // Render sun and sky colors
        this.renderSun(ctx, canvas);
        this.renderClouds(ctx, canvas);

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

    renderSun(ctx, canvas) {
        // Sun position in upper right area
        const sunX = canvas.width * 0.75;
        const sunY = canvas.height * 0.15;
        const sunRadius = 50;

        // Sun glow - multi-layer outer aura
        const glowGradient1 = ctx.createRadialGradient(sunX, sunY, sunRadius, sunX, sunY, sunRadius * 3);
        glowGradient1.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
        glowGradient1.addColorStop(0.4, 'rgba(255, 180, 80, 0.15)');
        glowGradient1.addColorStop(1, 'rgba(255, 150, 0, 0)');
        ctx.fillStyle = glowGradient1;
        ctx.fillRect(sunX - sunRadius * 3.2, sunY - sunRadius * 3.2, sunRadius * 6.4, sunRadius * 6.4);

        // Medium glow layer
        const glowGradient2 = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.8, sunX, sunY, sunRadius * 2);
        glowGradient2.addColorStop(0, 'rgba(255, 220, 120, 0.4)');
        glowGradient2.addColorStop(1, 'rgba(255, 180, 80, 0)');
        ctx.fillStyle = glowGradient2;
        ctx.fillRect(sunX - sunRadius * 2.2, sunY - sunRadius * 2.2, sunRadius * 4.4, sunRadius * 4.4);

        // Sun core - bright yellow gradient
        const sunGradient = ctx.createRadialGradient(sunX - 12, sunY - 12, 8, sunX, sunY, sunRadius);
        sunGradient.addColorStop(0, '#fffacd');    // Light yellow
        sunGradient.addColorStop(0.3, '#ffeb3b');  // Bright yellow
        sunGradient.addColorStop(0.6, '#ffd700');  // Gold
        sunGradient.addColorStop(1, '#ff8c00');    // Dark orange
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // Sun rim - darker orange edge
        ctx.strokeStyle = 'rgba(255, 140, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Primary shine highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(sunX - 18, sunY - 18, sunRadius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Secondary shine highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(sunX - 25, sunY - 10, sunRadius * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    renderClouds(ctx, canvas) {
        // Render many clouds at different positions with varying sizes
        // Clouds move from left to right with subtle animation
        const cloudSpeed = 8; // pixels per second (subtle speed)
        const cloudDistance = canvas.width + 300; // Distance cloud travels before looping
        
        // Calculate smooth continuous offset
        const offset = (this.animationTime * cloudSpeed) % cloudDistance;
        
        const clouds = [
            // Large clouds - baseX, y position, scale, opacity, parallax speed multiplier
            { baseX: canvas.width * 0.15, y: canvas.height * 0.12, scale: 1.8, opacity: 0.7, speed: 0.8 },
            { baseX: canvas.width * 0.75, y: canvas.height * 0.08, scale: 2.0, opacity: 0.65, speed: 0.9 },
            { baseX: canvas.width * 0.45, y: canvas.height * 0.22, scale: 1.9, opacity: 0.6, speed: 0.7 },
            
            // Medium clouds
            { baseX: canvas.width * 0.35, y: canvas.height * 0.18, scale: 1.2, opacity: 0.6, speed: 1.0 },
            { baseX: canvas.width * 0.55, y: canvas.height * 0.1, scale: 1.3, opacity: 0.65, speed: 0.75 },
            { baseX: canvas.width * 0.85, y: canvas.height * 0.25, scale: 1.4, opacity: 0.65, speed: 0.85 },
            { baseX: canvas.width * 0.25, y: canvas.height * 0.32, scale: 1.1, opacity: 0.55, speed: 1.1 },
            { baseX: canvas.width * 0.65, y: canvas.height * 0.28, scale: 1.2, opacity: 0.6, speed: 0.7 },
            
            // Small clouds for depth
            { baseX: canvas.width * 0.1, y: canvas.height * 0.08, scale: 0.8, opacity: 0.5, speed: 1.2 },
            { baseX: canvas.width * 0.5, y: canvas.height * 0.05, scale: 0.7, opacity: 0.45, speed: 0.6 },
            { baseX: canvas.width * 0.9, y: canvas.height * 0.15, scale: 0.9, opacity: 0.5, speed: 0.95 },
            { baseX: canvas.width * 0.3, y: canvas.height * 0.25, scale: 0.7, opacity: 0.48, speed: 1.15 },
        ];

        clouds.forEach(cloud => {
            // Calculate animated x position with parallax
            let cloudX = cloud.baseX + (offset * cloud.speed);
            
            // Wrap cloud smoothly - only restart when completely off screen (left side)
            if (cloudX > canvas.width + 150) {
                cloudX = cloudX - cloudDistance;
            }
            
            // Only render if cloud is at least partially visible
            if (cloudX > -150) {
                this.renderCloud(ctx, cloudX, cloud.y, cloud.scale, cloud.opacity);
            }
        });

        // Render bird flocks (sporadic)
        this.renderBirds(ctx, canvas);

        // Render wind gust animation (occasional)
        this.renderWindGust(ctx, canvas);
    }

    renderCloud(ctx, x, y, scale, opacity) {
        // Cloud made of overlapping circles with gradient
        ctx.globalAlpha = opacity * this.contentOpacity;
        
        // Cloud shadow/bottom
        ctx.fillStyle = 'rgba(200, 210, 220, 0.3)';
        ctx.beginPath();
        ctx.arc(x - 30 * scale, y + 5 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.arc(x, y + 8 * scale, 22 * scale, 0, Math.PI * 2);
        ctx.arc(x + 30 * scale, y + 5 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Cloud body - white
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(x - 30 * scale, y, 22 * scale, 0, Math.PI * 2);
        ctx.arc(x, y, 26 * scale, 0, Math.PI * 2);
        ctx.arc(x + 30 * scale, y, 22 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Cloud highlight - light white
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(x - 20 * scale, y - 8 * scale, 15 * scale, 0, Math.PI * 2);
        ctx.arc(x + 20 * scale, y - 6 * scale, 12 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = this.contentOpacity;
    }

    renderBirds(ctx, canvas) {
        // Sporadic bird flocks flying across the sky
        // Slower birds, less frequently, better V-formation
        
        const flocks = [
            { startTime: 6, duration: 20, yOffset: canvas.height * 0.20, birdCount: 5, cycleLength: 45 },
            { startTime: 31, duration: 20, yOffset: canvas.height * 0.28, birdCount: 4, cycleLength: 70 },
            { startTime: 46, duration: 20, yOffset: canvas.height * 0.15, birdCount: 6, cycleLength: 100 },
        ];
        
        flocks.forEach(flock => {
            // Calculate position in cycle
            const cyclePosition = (this.animationTime % flock.cycleLength);
            
            // Check if flock should be visible
            if (cyclePosition >= flock.startTime && cyclePosition < flock.startTime + flock.duration) {
                const timeInFlock = cyclePosition - flock.startTime;
                
                // Ease in and out
                let visibility = 1.0;
                if (timeInFlock < 0.5) {
                    visibility = timeInFlock / 0.5; // Fade in
                } else if (timeInFlock > flock.duration - 0.5) {
                    visibility = (flock.duration - timeInFlock) / 0.5; // Fade out
                }
                
                // Much slower movement across screen
                const flockX = -80 + (timeInFlock / flock.duration) * (canvas.width + 160);
                
                ctx.globalAlpha = visibility * this.contentOpacity * 0.7;
                
                // Draw bird formation - natural V-shape
                for (let i = 0; i < flock.birdCount; i++) {
                    // Create V-formation: center lead bird, others offset in V pattern
                    let offsetX, offsetY;
                    if (i === 0) {
                        // Lead bird at center front
                        offsetX = 0;
                        offsetY = 0;
                    } else {
                        // Birds arranged in V behind lead
                        const vIndex = i - 1;
                        const side = vIndex % 2; // 0 = left, 1 = right
                        const row = Math.floor(vIndex / 2);
                        offsetX = side === 0 ? -28 - (row * 10) : 28 + (row * 10);
                        offsetY = (row + 1) * 22;
                    }
                    
                    const birdX = flockX + offsetX;
                    const birdY = flock.yOffset + offsetY;
                    
                    if (birdX > -30 && birdX < canvas.width + 30) {
                        // Slower wing flapping animation
                        const wingFlap = Math.sin(this.animationTime * 2.5 + i * 0.3) * 0.5 + 0.5;
                        this.renderBird(ctx, birdX, birdY, 2, wingFlap);
                    }
                }
                
                ctx.globalAlpha = this.contentOpacity;
            }
        });
    }

    renderBird(ctx, x, y, scale, wingFlap) {
        // Bird body with flapping wings
        // wingFlap is 0-1 indicating wing position in flap cycle
        
        // Calculate wing positions based on flap
        const wingUp = wingFlap > 0.5;
        const wingAngle = (wingFlap - 0.5) * Math.PI; // 0 to PI for full flap
        
        // Draw left wing
        ctx.strokeStyle = 'rgba(80, 80, 80, 0.8)';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(x - 2 * scale, y);
        const leftWingX = x - 8 * scale - Math.abs(Math.sin(wingAngle) * 4 * scale);
        const leftWingY = wingUp ? y - 2 * scale : y + 1 * scale;
        ctx.quadraticCurveTo(x - 5 * scale, leftWingY, leftWingX, leftWingY + 1 * scale);
        ctx.stroke();
        
        // Draw right wing
        ctx.beginPath();
        ctx.moveTo(x + 2 * scale, y);
        const rightWingX = x + 8 * scale + Math.abs(Math.sin(wingAngle) * 4 * scale);
        const rightWingY = wingUp ? y - 2 * scale : y + 1 * scale;
        ctx.quadraticCurveTo(x + 5 * scale, rightWingY, rightWingX, rightWingY + 1 * scale);
        ctx.stroke();
        
        // Draw bird body
        ctx.fillStyle = 'rgba(60, 60, 60, 0.9)';
        ctx.beginPath();
        // Main body (ellipse)
        ctx.ellipse(x, y, 3 * scale, 2 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird head
        ctx.beginPath();
        ctx.arc(x + 2.5 * scale, y - 0.5 * scale, 1.2 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye highlight
        ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
        ctx.beginPath();
        ctx.arc(x + 3.2 * scale, y - 0.8 * scale, 0.4 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    renderWindGust(ctx, canvas) {
        // Occasional wind gust visual effect - longer streaks, fewer lines
        // Creates subtle effect that moves slower and more naturally
        
        const gustCycle = (this.animationTime % 15);
        if (gustCycle > 10 && gustCycle < 12) {
            const gustProgress = (gustCycle - 10) / 2;
            const gustOpacity = (Math.sin(gustProgress * Math.PI) * 0.25) * this.contentOpacity;
            
            if (gustOpacity > 0.01) {
                // Multiple longer parallel wind streaks at different heights
                const streakLayers = [
                    { yBase: canvas.height * 0.16, count: 2, spacing: 40 },
                    { yBase: canvas.height * 0.26, count: 2, spacing: 45 },
                    { yBase: canvas.height * 0.33, count: 2, spacing: 38 },
                ];
                
                streakLayers.forEach(layer => {
                    for (let i = 0; i < layer.count; i++) {
                        const y = layer.yBase + (i * layer.spacing);
                        const streakLength = 150 + Math.sin(gustProgress * Math.PI + i * 0.5) * 30;
                        const streakX = -100 + gustProgress * (canvas.width + 200) * 0.8; // Slower movement
                        
                        // Soft gradient wind streak - longer and more subtle
                        const gradient = ctx.createLinearGradient(
                            streakX - streakLength, y,
                            streakX + streakLength, y
                        );
                        gradient.addColorStop(0, `rgba(200, 220, 255, 0)`);
                        gradient.addColorStop(0.2, `rgba(200, 220, 255, ${gustOpacity * 0.5})`);
                        gradient.addColorStop(0.5, `rgba(200, 220, 255, ${gustOpacity})`);
                        gradient.addColorStop(0.8, `rgba(200, 220, 255, ${gustOpacity * 0.5})`);
                        gradient.addColorStop(1, `rgba(200, 220, 255, 0)`);
                        
                        ctx.fillStyle = gradient;
                        ctx.fillRect(streakX - streakLength, y - 1, streakLength * 2, 2);
                    }
                });
            }
        }
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

        // Render 3D palisade walls - foundation layer (behind paths and buildings)
        this.renderEllipticalPalisade(ctx, canvas, centerX, centerY);

        // Render paths INSIDE the walls - clipped to ellipse interior
        ctx.save();
        this.createEllipseClipPath(ctx, centerX, centerY, 360, 140);
        this.renderSettlementPaths(ctx, canvas, centerX, centerY);
        ctx.restore();

        // Render settlement buildings (on top of paths)
        this.renderSettlementBuildings(ctx, canvas);

        // Ground shadow under settlement
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 50, 340, 120, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    createEllipseClipPath(ctx, x, y, radiusX, radiusY) {
        // Create a clipping region that is an ellipse - paths will only render inside
        ctx.beginPath();
        ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.clip();
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
        // Render all actual building instances with settlement-specific visuals
        const headers = {
            'TrainingGrounds': 'Campaign',
            'MagicAcademy': 'Options',
            'TowerForge': 'Upgrades',
            'GoldMine': 'Stats'
        };

        this.settlementBuildings.forEach(item => {
            if (item.building) {
                ctx.globalAlpha = this.contentOpacity;
                
                // Special handling for TrainingGrounds: render scaled-down version at 70% for settlement
                if (item.building instanceof TrainingGrounds) {
                    this.renderTrainingGroundsSettlement(ctx, item.building);
                } else {
                    const size = item.scale * 4; // Convert scale to building size (4x4 grid)
                    
                    // Use SettlementBuildingVisuals for custom settlement rendering
                    const visuals = new SettlementBuildingVisuals(item.building);
                    visuals.render(ctx, size);
                }
                
                // Render header for clickable buildings
                if (item.clickable && item.action) {
                    const buildingType = item.building.constructor.name;
                    const headerText = headers[buildingType] || '';
                    
                    if (headerText) {
                        const headerX = item.building.x;
                        const headerY = item.building.y - 120;
                        
                        // Header text shadow
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                        ctx.font = 'bold 24px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(headerText, headerX + 1, headerY + 1);
                        
                        // Header text
                        ctx.fillStyle = '#FFD700';
                        ctx.fillText(headerText, headerX, headerY);
                    }
                }
                
                ctx.globalAlpha = 1;
            }
        });
    }

    renderTrainingGroundsSettlement(ctx, building) {
        // Render a scaled version of training grounds for the settlement display
        // Base scale is 0.7, then adjusted to fit within the red square area (~0.4x)
        const baseScale = 0.7;
        const settlementScale = 2.2; // Scales it down to fit in the red square
        const scale = baseScale * settlementScale;
        const x = building.x;
        const y = building.y;
        
        // ===== BACKGROUND & TERRAIN =====
        
        // Grass base - 70% of original size
        const grassGradient = ctx.createLinearGradient(
            x - (50 * scale), y - (48 * scale),
            x - (50 * scale), y + (48 * scale)
        );
        grassGradient.addColorStop(0, '#5A7A3A');
        grassGradient.addColorStop(0.5, '#6B8E3A');
        grassGradient.addColorStop(1, '#4A6A2A');
        
        ctx.fillStyle = grassGradient;
        ctx.fillRect(x - (50 * scale), y - (48 * scale), 100 * scale, 96 * scale);
        
        // Dirt wear patches
        const wearPatches = [
            { x: -38, y: -28, width: 27, height: 4, intensity: 0.5 },
            { x: 38, y: -28, width: 27, height: 4, intensity: 0.5 },
            { x: -24, y: 20, width: 18, height: 18, intensity: 0.6 },
            { x: 24, y: 20, width: 18, height: 18, intensity: 0.6 },
            { x: -38, y: 8, width: 13, height: 8, intensity: 0.4 },
            { x: 38, y: 8, width: 13, height: 8, intensity: 0.4 }
        ];
        
        wearPatches.forEach(patch => {
            const dirtGradient = ctx.createRadialGradient(
                x + (patch.x * scale), y + (patch.y * scale), 0,
                x + (patch.x * scale), y + (patch.y * scale), Math.max(patch.width, patch.height)
            );
            dirtGradient.addColorStop(0, `rgba(139, 90, 43, ${patch.intensity})`);
            dirtGradient.addColorStop(0.7, `rgba(139, 90, 43, ${patch.intensity * 0.5})`);
            dirtGradient.addColorStop(1, `rgba(139, 90, 43, 0)`);
            
            ctx.fillStyle = dirtGradient;
            ctx.fillRect(
                x + (patch.x * scale) - (patch.width * scale / 2),
                y + (patch.y * scale) - (patch.height * scale / 2),
                patch.width * scale,
                patch.height * scale
            );
        });
        
        // Grass variations
        const grassVariations = [
            { x: -42, y: -38, radius: 5, opacity: 0.25 },
            { x: 42, y: -38, radius: 5, opacity: 0.25 },
            { x: -42, y: 38, radius: 6, opacity: 0.3 },
            { x: 42, y: 38, radius: 6, opacity: 0.3 }
        ];
        
        grassVariations.forEach(area => {
            const grassVarGradient = ctx.createRadialGradient(
                x + (area.x * scale), y + (area.y * scale), 0,
                x + (area.x * scale), y + (area.y * scale), area.radius * scale
            );
            grassVarGradient.addColorStop(0, `rgba(34, 139, 34, ${area.opacity})`);
            grassVarGradient.addColorStop(1, `rgba(34, 139, 34, 0)`);
            
            ctx.fillStyle = grassVarGradient;
            ctx.beginPath();
            ctx.arc(x + (area.x * scale), y + (area.y * scale), area.radius * scale, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Scattered stones
        const rocks = [
            { x: -47, y: -35, size: 1 },
            { x: 47, y: -35, size: 1 },
            { x: -47, y: 35, size: 1.1 },
            { x: 47, y: 35, size: 1 }
        ];
        
        rocks.forEach(rock => {
            ctx.fillStyle = '#8B8680';
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(x + (rock.x * scale), y + (rock.y * scale), rock.size * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        
        // ===== FENCE & DECORATIONS =====
        
        // Fence perimeter at 70% scale
        const segments = [
            { startX: -50, startY: -48, endX: 50, endY: -48, posts: 13 },
            { startX: 50, startY: -48, endX: 50, endY: 48, posts: 12 },
            { startX: 50, startY: 48, endX: -50, endY: 48, posts: 13 },
            { startX: -50, startY: 48, endX: -50, endY: -48, posts: 12 }
        ];
        
        segments.forEach(segment => {
            const startX = x + (segment.startX * scale);
            const startY = y + (segment.startY * scale);
            const endX = x + (segment.endX * scale);
            const endY = y + (segment.endY * scale);
            
            const angle = Math.atan2(endY - startY, endX - startX);
            const distance = Math.hypot(endX - startX, endY - startY);
            const postSpacing = distance / (segment.posts - 1);
            
            for (let i = 0; i < segment.posts; i++) {
                const postX = startX + Math.cos(angle) * (i * postSpacing);
                const postY = startY + Math.sin(angle) * (i * postSpacing);
                
                // Post shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(postX - (1 * scale), postY + (1 * scale), 2 * scale, 1.5 * scale);
                
                // Post
                ctx.fillStyle = '#8B6F47';
                ctx.fillRect(postX - (1.25 * scale), postY - (11 * scale), 2.5 * scale, 12 * scale);
                
                // Post top
                ctx.fillStyle = '#654321';
                ctx.fillRect(postX - (1.75 * scale), postY - (12 * scale), 3.5 * scale, 1.5 * scale);
                
                // Post crossbeams
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 0.5 * scale;
                for (let g = 0; g < 3; g++) {
                    ctx.beginPath();
                    ctx.moveTo(postX - (1.25 * scale), postY - (10 * scale) + (g * 3.5 * scale));
                    ctx.lineTo(postX + (1.25 * scale), postY - (9.5 * scale) + (g * 3.5 * scale));
                    ctx.stroke();
                }
            }
            
            // Rails between posts
            for (let i = 0; i < segment.posts - 1; i++) {
                const railStartX = startX + Math.cos(angle) * (i * postSpacing);
                const railStartY = startY + Math.sin(angle) * (i * postSpacing);
                const railEndX = startX + Math.cos(angle) * ((i + 1) * postSpacing);
                const railEndY = startY + Math.sin(angle) * ((i + 1) * postSpacing);
                
                ctx.strokeStyle = '#CD853F';
                ctx.lineWidth = 1.5 * scale;
                ctx.beginPath();
                ctx.moveTo(railStartX, railStartY - (5 * scale));
                ctx.lineTo(railEndX, railEndY - (5 * scale));
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(railStartX, railStartY - (1.5 * scale));
                ctx.lineTo(railEndX, railEndY - (1.5 * scale));
                ctx.stroke();
            }
        });
        
        // ===== HUTS & STRUCTURES =====
        
        // Wooden hut
        const hutX = x + (-42 * scale);
        const hutY = y + (-38 * scale);
        const hutWidth = 10 * scale;
        const hutHeight = 9 * scale;
        
        // Hut shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(hutX - (hutWidth / 2) + (1 * scale), hutY + (1 * scale), hutWidth, hutHeight);
        
        // Hut main body
        ctx.fillStyle = '#8B6F47';
        ctx.fillRect(hutX - (hutWidth / 2), hutY, hutWidth, hutHeight);
        
        // Hut outline
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5 * scale;
        ctx.strokeRect(hutX - (hutWidth / 2), hutY, hutWidth, hutHeight);
        
        // Hut planks
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.2 * scale;
        for (let i = 1; i < 4; i++) {
            const plankY = hutY + (hutHeight * i / 4);
            ctx.beginPath();
            ctx.moveTo(hutX - (hutWidth / 2), plankY);
            ctx.lineTo(hutX + (hutWidth / 2), plankY);
            ctx.stroke();
        }
        
        // Hut roof
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(hutX - (hutWidth / 2), hutY);
        ctx.lineTo(hutX, hutY - (4 * scale));
        ctx.lineTo(hutX + (hutWidth / 2), hutY);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 0.5 * scale;
        ctx.stroke();
        
        // ===== TREES AROUND FENCE =====
        
        const trees = [
            { x: -54, y: -52, size: 15 * 1.8 * scale },
            { x: -46, y: -54, size: 15 * 2.0 * scale },
            { x: 54, y: -52, size: 15 * 1.9 * scale },
            { x: 56, y: -48, size: 15 * 1.7 * scale },
            { x: -56, y: 52, size: 15 * 1.95 * scale },
            { x: 54, y: 54, size: 15 * 1.8 * scale }
        ];
        
        trees.forEach((tree, idx) => {
            this.renderSettlementTree(ctx, x, y, tree.x, tree.y, tree.size, scale, idx);
        });
        
        // ===== ROCKS =====
        
        const decorRocks = [
            { x: -60, y: -40, size: 1.75 * scale },
            { x: 60, y: -42, size: 2.0 * scale },
            { x: -60, y: 36, size: 1.9 * scale },
            { x: 60, y: 32, size: 1.6 * scale }
        ];
        
        decorRocks.forEach(rock => {
            ctx.fillStyle = '#696969';
            ctx.strokeStyle = '#2F2F2F';
            ctx.lineWidth = 0.5 * scale;
            ctx.beginPath();
            ctx.arc(x + (rock.x * scale), y + (rock.y * scale), rock.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        
        // ===== BUSHES =====
        
        const bushes = [
            { x: -57, y: -32, size: 0.6 * scale },
            { x: 58, y: -36, size: 0.65 * scale },
            { x: -56, y: 48, size: 0.55 * scale },
            { x: 57, y: 52, size: 0.7 * scale }
        ];
        
        bushes.forEach(bush => {
            const bushX = x + (bush.x * scale);
            const bushY = y + (bush.y * scale);
            
            ctx.fillStyle = '#1f6f1f';
            ctx.beginPath();
            ctx.arc(bushX, bushY, 2.5 * bush.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#28a028';
            ctx.beginPath();
            ctx.arc(bushX - (1 * bush.size), bushY - (1 * bush.size), 1.75 * bush.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(bushX + (1 * bush.size), bushY - (1 * bush.size), 1.75 * bush.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // ===== BARRELS =====
        
        const barrels = [
            { x: -64, y: -24 },
            { x: 64, y: -22 },
            { x: -62, y: 28 },
            { x: 62, y: 26 }
        ];
        
        barrels.forEach(barrel => {
            const barrelX = x + (barrel.x * scale);
            const barrelY = y + (barrel.y * scale);
            
            // Barrel shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(barrelX - (2.5 * scale), barrelY + (1.5 * scale), 5 * scale, 1.5 * scale);
            
            // Barrel body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(barrelX - (2.5 * scale), barrelY - (5 * scale), 5 * scale, 6.5 * scale);
            
            // Barrel outline
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 0.75 * scale;
            ctx.strokeRect(barrelX - (2.5 * scale), barrelY - (5 * scale), 5 * scale, 6.5 * scale);
            
            // Barrel bands
            ctx.beginPath();
            ctx.moveTo(barrelX - (2.5 * scale), barrelY - (3 * scale));
            ctx.lineTo(barrelX + (2.5 * scale), barrelY - (3 * scale));
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(barrelX - (2.5 * scale), barrelY - (1 * scale));
            ctx.lineTo(barrelX + (2.5 * scale), barrelY - (1 * scale));
            ctx.stroke();
        });
        
        // ===== ARCHER TRAINING ELEMENTS =====
        
        // Lane dividers
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 0.7;
        ctx.setLineDash([8 * scale, 8 * scale]);
        
        ctx.beginPath();
        ctx.moveTo(x - (48 * scale), y + (-28 * scale));
        ctx.lineTo(x + (48 * scale), y + (-28 * scale));
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x - (48 * scale), y + (8 * scale));
        ctx.lineTo(x + (48 * scale), y + (8 * scale));
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Archer targets (left side)
        const targetPositions = [
            { x: -28, y: -28 - 35 },
            { x: -14, y: -28 - 35 },
            { x: 0, y: -28 - 35 },
            { x: 14, y: -28 - 35 },
            { x: 28, y: -28 - 35 }
        ];
        
        targetPositions.forEach(targetPos => {
            this.renderSettlementTarget(ctx, x, y, targetPos.x, targetPos.y, scale);
        });
        
        // Archers
        const archerPositions = [
            { x: -38, y: -28, isLeft: true },
            { x: -22, y: -28, isLeft: true },
            { x: 38, y: -28, isLeft: false },
            { x: 22, y: -28, isLeft: false }
        ];
        
        archerPositions.forEach(archer => {
            this.renderSettlementArcher(ctx, x, y, archer.x, archer.y, archer.isLeft, scale);
        });
        
        // ===== SWORD DUEL CIRCLES =====
        
        const duelCircles = [
            { x: -24, y: 20 },
            { x: 24, y: 20 }
        ];
        
        duelCircles.forEach((circle, circleIdx) => {
            const circleX = x + (circle.x * scale);
            const circleY = y + (circle.y * scale);
            
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
            ctx.lineWidth = 1 * scale;
            ctx.beginPath();
            ctx.arc(circleX, circleY, 9 * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(160, 82, 45, 0.3)';
            ctx.lineWidth = 0.5 * scale;
            ctx.beginPath();
            ctx.arc(circleX, circleY, 7 * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            // Render animated sword fighters in each circle
            // Left fighter
            this.renderSwordFighter(ctx, circleX - (4 * scale), circleY, 1, scale);
            // Right fighter
            this.renderSwordFighter(ctx, circleX + (4 * scale), circleY, -1, scale);
        });
        
        // ===== TRAINING DUMMIES =====
        
        const dummyPositions = [
            { x: -38, y: 8 },
            { x: 38, y: 8 }
        ];
        
        dummyPositions.forEach(dummy => {
            this.renderSettlementDummy(ctx, x, y, dummy.x, dummy.y, scale);
        });
    }
    
    renderSettlementTree(ctx, centerX, centerY, treeOffsetX, treeOffsetY, size, scale, idx) {
        const treeX = centerX + (treeOffsetX * scale);
        const treeY = centerY + (treeOffsetY * scale);
        const treeType = idx % 4;
        
        ctx.save();
        ctx.translate(treeX, treeY);
        
        const trunkWidth = size * 0.25;
        const trunkHeight = size * 0.5;
        
        if (treeType === 0) {
            // Tree type 1
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(-trunkWidth * 0.5, 0, trunkWidth, trunkHeight);
            ctx.fillStyle = '#3E2723';
            ctx.fillRect(0, 0, trunkWidth * 0.5, trunkHeight);
            ctx.fillStyle = '#0D3817';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.6);
            ctx.lineTo(size * 0.35, -size * 0.1);
            ctx.lineTo(-size * 0.35, -size * 0.1);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#1B5E20';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.35);
            ctx.lineTo(size * 0.3, size * 0.05);
            ctx.lineTo(-size * 0.3, size * 0.05);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.15);
            ctx.lineTo(size * 0.25, size * 0.2);
            ctx.lineTo(-size * 0.25, size * 0.2);
            ctx.closePath();
            ctx.fill();
        } else if (treeType === 1) {
            // Tree type 2
            ctx.fillStyle = '#6B4423';
            ctx.fillRect(-trunkWidth * 0.5, 0, trunkWidth, trunkHeight);
            ctx.fillStyle = '#8B5A3C';
            ctx.fillRect(-trunkWidth * 0.5 + trunkWidth * 0.6, 0, trunkWidth * 0.4, trunkHeight);
            ctx.fillStyle = '#1B5E20';
            ctx.beginPath();
            ctx.arc(0, -size * 0.1, size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(0, -size * 0.35, size * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#43A047';
            ctx.beginPath();
            ctx.arc(0, -size * 0.55, size * 0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (treeType === 2) {
            // Tree type 3
            ctx.fillStyle = '#795548';
            ctx.fillRect(-trunkWidth * 0.5, -size * 0.2, trunkWidth, size * 0.6);
            ctx.fillStyle = '#4E342E';
            ctx.beginPath();
            ctx.arc(trunkWidth * 0.25, 0, trunkWidth * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1B5E20';
            ctx.beginPath();
            ctx.arc(-size * 0.28, -size * 0.35, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(size * 0.28, -size * 0.3, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.arc(0, -size * 0.55, size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Tree type 4
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-trunkWidth * 0.5, -size * 0.05, trunkWidth, size * 0.45);
            ctx.fillStyle = '#0D3817';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.05);
            ctx.lineTo(size * 0.38, size * 0.15);
            ctx.lineTo(-size * 0.38, size * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#1B5E20';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.25);
            ctx.lineTo(size * 0.3, 0);
            ctx.lineTo(-size * 0.3, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.45);
            ctx.lineTo(size * 0.2, -size * 0.15);
            ctx.lineTo(-size * 0.2, -size * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#43A047';
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.65);
            ctx.lineTo(size * 0.12, -size * 0.35);
            ctx.lineTo(-size * 0.12, -size * 0.35);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    renderSettlementTarget(ctx, centerX, centerY, targetOffsetX, targetOffsetY, scale) {
        const targetX = centerX + (targetOffsetX * scale);
        const targetY = centerY + (targetOffsetY * scale);
        
        ctx.save();
        ctx.translate(targetX, targetY);
        
        // Target stand
        ctx.fillStyle = '#654321';
        ctx.fillRect(-0.75 * scale, 0, 1.5 * scale, 10 * scale);
        
        ctx.fillStyle = '#5D4E37';
        ctx.fillRect(-2 * scale, 10 * scale, 4 * scale, 1 * scale);
        
        // Target rings
        const rings = [
            { radius: 5.5, color: '#DC143C', shadow: 1 },
            { radius: 3.7, color: '#FFD700', shadow: 0.8 },
            { radius: 2, color: '#DC143C', shadow: 0.6 },
            { radius: 0.8, color: '#FFD700', shadow: 0.4 }
        ];
        
        rings.forEach(ring => {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.15 * ring.shadow})`;
            ctx.beginPath();
            ctx.arc(0.3 * scale, 0.3 * scale, ring.radius * scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = ring.color;
            ctx.beginPath();
            ctx.arc(0, 0, ring.radius * scale, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 0.5 * scale;
        ctx.beginPath();
        ctx.arc(0, 0, 6 * scale, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    renderSettlementArcher(ctx, centerX, centerY, archerOffsetX, archerOffsetY, isLeft, scale) {
        const archerX = centerX + (archerOffsetX * scale);
        const archerY = centerY + (archerOffsetY * scale);
        
        // Animate drawback based on settlement animation time
        const drawback = (Math.sin(this.animationTime * 3) + 1) * 0.5;
        
        ctx.save();
        ctx.translate(archerX, archerY);
        
        if (!isLeft) {
            ctx.scale(-1, 1);
        }
        
        // Archer shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0.5 * scale, 0.5 * scale, 2 * scale, 0.7 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Archer body
        ctx.fillStyle = '#2D5016';
        ctx.fillRect(-2.5 * scale, -6.5 * scale, 5 * scale, 8 * scale);
        
        // Archer head
        ctx.fillStyle = '#DDBEA9';
        ctx.beginPath();
        ctx.arc(0, -7.5 * scale, 1.7 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Archer helm
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -7.8 * scale, 2 * scale, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Bow
        const bowX = 2.5 * scale;
        const bowDrawAmount = drawback * 2;
        
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.moveTo(bowX, -5 * scale);
        ctx.quadraticCurveTo(bowX + 2 * scale, -7.5 * scale, bowX + 1.3 * scale, -9 * scale);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(bowX, -5 * scale);
        ctx.quadraticCurveTo(bowX + 2 * scale, -2.5 * scale, bowX + 1.3 * scale, -1 * scale);
        ctx.stroke();
        
        // Bow string with animation
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 0.5 * scale;
        ctx.beginPath();
        ctx.moveTo(bowX + (bowDrawAmount * 0.5), -9 * scale);
        ctx.lineTo(bowX - bowDrawAmount, -5 * scale);
        ctx.lineTo(bowX + (bowDrawAmount * 0.5), -1 * scale);
        ctx.stroke();
        
        ctx.restore();
    }
    
    renderSettlementDummy(ctx, centerX, centerY, dummyOffsetX, dummyOffsetY, scale) {
        const dummyX = centerX + (dummyOffsetX * scale);
        const dummyY = centerY + (dummyOffsetY * scale);
        
        ctx.save();
        ctx.translate(dummyX, dummyY);
        
        // Dummy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0.5 * scale, 0.5 * scale, 2.5 * scale, 0.8 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Dummy body - wooden post
        ctx.fillStyle = '#8B6F47';
        ctx.fillRect(-1.5 * scale, -5 * scale, 3 * scale, 10 * scale);
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5 * scale;
        ctx.strokeRect(-1.5 * scale, -5 * scale, 3 * scale, 10 * scale);
        
        // Dummy crossbar for arms
        ctx.fillStyle = '#8B6F47';
        ctx.fillRect(-3.5 * scale, -1 * scale, 7 * scale, 1.2 * scale);
        
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 0.5 * scale;
        ctx.strokeRect(-3.5 * scale, -1 * scale, 7 * scale, 1.2 * scale);
        
        // Dummy head
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -6 * scale, 1 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    renderSwordFighter(ctx, fighterX, fighterY, direction, scale) {
        // Animate sword swing based on settlement animation time
        const swingAngle = Math.sin(this.animationTime * 4 + direction) * 0.6;
        const stance = Math.sin(this.animationTime * 2) * 0.3;
        
        // Determine fighter color (alternating red and blue)
        const isRed = direction > 0;
        const bodyColor = isRed ? '#8B0000' : '#000080';
        
        ctx.save();
        ctx.translate(fighterX, fighterY);
        
        // Fighter shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0.3 * scale, 0.5 * scale, 1.8 * scale, 0.6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Fighter body
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-1.2 * scale, -3.5 * scale, 2.4 * scale, 4.5 * scale);
        
        // Fighter head
        ctx.fillStyle = '#DDBEA9';
        ctx.beginPath();
        ctx.arc(0, -4.2 * scale, 1 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Fighter helm
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(0, -4.5 * scale, 1.2 * scale, Math.PI, Math.PI * 2);
        ctx.fill();
        
        // Sword - animated swing
        ctx.save();
        ctx.rotate(swingAngle * direction);
        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 0.6 * scale;
        ctx.beginPath();
        ctx.moveTo(0.8 * scale, -2 * scale);
        ctx.lineTo(1.5 * scale, -4 * scale);
        ctx.stroke();
        
        // Sword guard
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0.5 * scale, -2.3 * scale, 0.6 * scale, 0.8 * scale);
        ctx.restore();
        
        // Arm holding sword
        ctx.fillStyle = bodyColor;
        ctx.fillRect(0.8 * scale - (0.3 * scale), -3 * scale, 0.8 * scale, 2.5 * scale);
        
        // Other arm
        ctx.fillRect(-1.2 * scale, -2.5 * scale - (stance * scale), 0.8 * scale, 2 * scale);
        
        ctx.restore();
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
        
        // Scattered trees throughout the entire settlement area
        // Create a natural forest feel with many trees in various sizes and depths
        // Settlement boundary: ellipse center (centerX, centerY), radiusX=360, radiusY=140
        // Trees positioned OUTSIDE the walls in the surrounding green area
        // ALL TREES: y-values must be >= centerY - 190 (not reaching into mountains)
        const treePositions = [
            // Far background - smallest trees (y >= centerY - 190)
            { x: centerX - 800, y: centerY - 190, size: 20 },
            { x: centerX - 500, y: centerY - 188, size: 18 },
            { x: centerX - 200, y: centerY - 190, size: 19 },
            { x: centerX + 200, y: centerY - 190, size: 19 },
            { x: centerX + 500, y: centerY - 188, size: 18 },
            { x: centerX + 800, y: centerY - 190, size: 20 },
            { x: centerX - 350, y: centerY - 189, size: 19 },
            { x: centerX + 350, y: centerY - 189, size: 19 },
            
            // Upper left area - outside settlement (x < centerX - 360)
            { x: centerX - 400, y: centerY - 180, size: 24 },
            { x: centerX - 550, y: centerY - 185, size: 22 },
            { x: centerX - 650, y: centerY - 178, size: 23 },
            { x: centerX - 650, y: centerY - 182, size: 21 },
            { x: centerX - 600, y: centerY - 179, size: 22 },
            { x: centerX - 900, y: centerY - 186, size: 21 },
            { x: centerX - 850, y: centerY - 183, size: 22 },
            
            // Upper right area - outside settlement (x > centerX + 360)
            { x: centerX + 700, y: centerY - 180, size: 24 },
            { x: centerX + 550, y: centerY - 185, size: 22 },
            { x: centerX + 750, y: centerY - 178, size: 23 },
            { x: centerX + 650, y: centerY - 182, size: 21 },
            { x: centerX + 600, y: centerY - 179, size: 22 },
            { x: centerX + 900, y: centerY - 186, size: 21 },
            { x: centerX + 850, y: centerY - 183, size: 22 },
            
            // Left side cluster - far outside walls
            { x: centerX - 820, y: centerY - 172, size: 32 },
            { x: centerX - 920, y: centerY - 168, size: 35 },
            { x: centerX - 850, y: centerY - 170, size: 30 },
            { x: centerX - 880, y: centerY - 165, size: 28 },
            { x: centerX - 800, y: centerY - 169, size: 29 },
            { x: centerX - 950, y: centerY - 170, size: 26 },
            { x: centerX - 600, y: centerY - 167, size: 27 },
            
            // Right side cluster - far outside walls
            { x: centerX + 820, y: centerY - 172, size: 32 },
            { x: centerX + 920, y: centerY - 168, size: 35 },
            { x: centerX + 750, y: centerY - 170, size: 30 },
            { x: centerX + 880, y: centerY - 165, size: 28 },
            { x: centerX + 800, y: centerY - 169, size: 29 },
            { x: centerX + 950, y: centerY - 170, size: 26 },
            { x: centerX + 700, y: centerY - 167, size: 27 },
            
            // Far left area
            { x: centerX - 600, y: centerY - 155, size: 31 },
            { x: centerX - 500, y: centerY - 160, size: 28 },
            { x: centerX - 950, y: centerY - 150, size: 33 },
            { x: centerX - 850, y: centerY - 145, size: 26 },
            { x: centerX - 550, y: centerY - 158, size: 27 },
            { x: centerX - 550, y: centerY - 152, size: 25 },
            { x: centerX - 900, y: centerY - 148, size: 29 },
            
            // Far right area
            { x: centerX + 700, y: centerY - 155, size: 31 },
            { x: centerX + 600, y: centerY - 160, size: 28 },
            { x: centerX + 850, y: centerY - 150, size: 33 },
            { x: centerX + 750, y: centerY - 145, size: 26 },
            { x: centerX + 650, y: centerY - 158, size: 27 },
            { x: centerX + 550, y: centerY - 152, size: 25 },
            { x: centerX + 900, y: centerY - 148, size: 29 },
            
            // Middle-left area
            { x: centerX - 550, y: centerY - 130, size: 34 },
            { x: centerX - 500, y: centerY - 125, size: 36 },
            { x: centerX - 450, y: centerY - 135, size: 32 },
            { x: centerX - 600, y: centerY - 128, size: 29 },
            { x: centerX - 900, y: centerY - 132, size: 31 },
            { x: centerX - 480, y: centerY - 118, size: 27 },
            
            // Middle-right area
            { x: centerX + 550, y: centerY - 130, size: 34 },
            { x: centerX + 700, y: centerY - 125, size: 36 },
            { x: centerX + 450, y: centerY - 135, size: 32 },
            { x: centerX + 600, y: centerY - 128, size: 29 },
            { x: centerX + 800, y: centerY - 132, size: 31 },
            { x: centerX + 680, y: centerY - 118, size: 27 },
            
            // Lower-middle left
            { x: centerX - 500, y: centerY - 110, size: 38 },
            { x: centerX - 750, y: centerY - 105, size: 40 },
            { x: centerX - 350, y: centerY - 115, size: 35 },
            { x: centerX - 650, y: centerY - 100, size: 32 },
            { x: centerX - 900, y: centerY - 108, size: 36 },
            
            // Lower-middle right
            { x: centerX + 500, y: centerY - 110, size: 38 },
            { x: centerX + 750, y: centerY - 105, size: 40 },
            { x: centerX + 350, y: centerY - 115, size: 35 },
            { x: centerX + 650, y: centerY - 100, size: 32 },
            { x: centerX + 900, y: centerY - 108, size: 36 },
            
            // Distant foreground left
            { x: centerX - 650, y: centerY - 70, size: 40 },
            { x: centerX - 450, y: centerY - 75, size: 38 },
            { x: centerX - 800, y: centerY - 65, size: 39 },
            
            // Distant foreground right
            { x: centerX + 650, y: centerY - 70, size: 40 },
            { x: centerX + 450, y: centerY - 75, size: 38 },
            { x: centerX + 800, y: centerY - 65, size: 39 },
            
            // ===== LOWER GREEN AREA TREES (below settlement) =====
            // Far left lower area
            { x: centerX - 550, y: centerY + 20, size: 36 },
            { x: centerX - 900, y: centerY + 30, size: 38 },
            { x: centerX - 450, y: centerY + 15, size: 34 },
            { x: centerX - 650, y: centerY + 35, size: 37 },
            { x: centerX - 800, y: centerY + 25, size: 39 },
            { x: centerX - 900, y: centerY + 28, size: 40 },
            
            // Far right lower area
            { x: centerX + 550, y: centerY + 20, size: 36 },
            { x: centerX + 700, y: centerY + 30, size: 38 },
            { x: centerX + 450, y: centerY + 15, size: 34 },
            { x: centerX + 650, y: centerY + 35, size: 37 },
            { x: centerX + 800, y: centerY + 25, size: 39 },
            { x: centerX + 900, y: centerY + 28, size: 40 },
            
            // Middle-lower left
            { x: centerX - 600, y: centerY + 50, size: 38 },
            { x: centerX - 850, y: centerY + 55, size: 40 },
            { x: centerX - 350, y: centerY + 45, size: 35 },
            { x: centerX - 500, y: centerY + 60, size: 36 },
            { x: centerX - 850, y: centerY + 52, size: 41 },
            
            // Middle-lower right
            { x: centerX + 600, y: centerY + 50, size: 38 },
            { x: centerX + 750, y: centerY + 55, size: 40 },
            { x: centerX + 350, y: centerY + 45, size: 35 },
            { x: centerX + 500, y: centerY + 60, size: 36 },
            { x: centerX + 850, y: centerY + 52, size: 41 },
            
            // Lower left fringe
            { x: centerX - 900, y: centerY + 70, size: 39 },
            { x: centerX - 550, y: centerY + 75, size: 37 },
            { x: centerX - 850, y: centerY + 65, size: 40 },
            { x: centerX - 450, y: centerY + 72, size: 36 },
            
            // Lower right fringe
            { x: centerX + 700, y: centerY + 70, size: 39 },
            { x: centerX + 550, y: centerY + 75, size: 37 },
            { x: centerX + 850, y: centerY + 65, size: 40 },
            { x: centerX + 450, y: centerY + 72, size: 36 },
            
            // Bottom left corner
            { x: centerX - 600, y: centerY + 85, size: 38 },
            { x: centerX - 950, y: centerY + 80, size: 41 },
            { x: centerX - 400, y: centerY + 88, size: 36 },
            
            // Bottom right corner
            { x: centerX + 600, y: centerY + 85, size: 38 },
            { x: centerX + 750, y: centerY + 80, size: 41 },
            { x: centerX + 400, y: centerY + 88, size: 36 },
            
            // Extra bottom edge left
            { x: centerX - 650, y: centerY + 100, size: 37 },
            { x: centerX - 500, y: centerY + 95, size: 35 },
            
            // Extra bottom edge right
            { x: centerX + 650, y: centerY + 100, size: 37 },
            { x: centerX + 500, y: centerY + 95, size: 35 },
            
            // ===== CAMPAIGN AREA TREES (far left, marked by red square) =====
            // Dense trees in the Campaign/Training Grounds area - larger sizes
            // Upper Campaign area
            { x: centerX - 900, y: centerY + 50, size: 42 },
            { x: centerX - 1000, y: centerY + 45, size: 44 },
            { x: centerX - 800, y: centerY + 35, size: 40 },
            { x: centerX - 1100, y: centerY + 40, size: 43 },
            { x: centerX - 650, y: centerY + 30, size: 38 },
            
            // Mid-upper Campaign area
            { x: centerX - 950, y: centerY + 170, size: 42 },
            { x: centerX - 1050, y: centerY + 150, size: 45 },
            { x: centerX - 850, y: centerY + 160, size: 40 },
            { x: centerX - 900, y: centerY + 180, size: 38 },
            { x: centerX - 1150, y: centerY + 100, size: 41 },
            
            // Mid Campaign area
            { x: centerX - 900, y: centerY + 100, size: 43 },
            { x: centerX - 1000, y: centerY + 150, size: 46 },
            { x: centerX - 800, y: centerY + 105, size: 40 },
            { x: centerX - 1100, y: centerY + 120, size: 42 },
            { x: centerX - 450, y: centerY + 108, size: 39 },
            
            // Mid-lower Campaign area
            { x: centerX - 950, y: centerY + 140, size: 44 },
            { x: centerX - 1050, y: centerY + 145, size: 45 },
            { x: centerX - 850, y: centerY + 135, size: 41 },
            { x: centerX - 600, y: centerY + 142, size: 40 },
            { x: centerX - 1150, y: centerY + 150, size: 43 },
            
            // Lower Campaign area
            { x: centerX - 900, y: centerY + 165, size: 43 },
            { x: centerX - 1000, y: centerY + 170, size: 46 },
            { x: centerX - 800, y: centerY + 160, size: 41 },
            { x: centerX - 1100, y: centerY + 175, size: 42 },
            { x: centerX - 850, y: centerY + 168, size: 40 },
            
            // Bottom Campaign area
            { x: centerX - 950, y: centerY + 190, size: 42 },
            { x: centerX - 1050, y: centerY + 195, size: 44 },
            { x: centerX - 850, y: centerY + 185, size: 39 },
            { x: centerX - 600, y: centerY + 192, size: 38 },
            { x: centerX - 1150, y: centerY + 200, size: 41 },
            
            // Extra Campaign edge trees
            { x: centerX - 1200, y: centerY + 125, size: 40 },
            { x: centerX - 1250, y: centerY + 130, size: 42 },
            { x: centerX - 1200, y: centerY + 170, size: 40 },
            { x: centerX - 1300, y: centerY + 115, size: 43 },

            { x: centerX + 900, y: centerY + 50, size: 42 },
            { x: centerX + 1000, y: centerY + 45, size: 44 },
            { x: centerX + 800, y: centerY + 35, size: 40 },
            { x: centerX + 1100, y: centerY + 40, size: 43 },
            { x: centerX + 750, y: centerY + 30, size: 38 },
            
            // Mid-upper Campaign area
            { x: centerX + 950, y: centerY + 200, size: 42 },
            { x: centerX + 1050, y: centerY + 150, size: 45 },
            { x: centerX + 850, y: centerY + 140, size: 40 },
            { x: centerX + 700, y: centerY + 180, size: 38 },
            { x: centerX + 1150, y: centerY + 100, size: 41 },
            
            // Mid Campaign area
            { x: centerX + 900, y: centerY + 100, size: 43 },
            { x: centerX + 1000, y: centerY + 150, size: 46 },
            { x: centerX + 800, y: centerY + 105, size: 40 },
            { x: centerX + 1100, y: centerY + 120, size: 42 },
            { x: centerX + 750, y: centerY + 108, size: 39 },
            
            // Mid-lower Campaign area
            { x: centerX + 950, y: centerY + 140, size: 44 },
            { x: centerX + 1050, y: centerY + 145, size: 45 },
            { x: centerX + 850, y: centerY + 135, size: 41 },
            { x: centerX + 700, y: centerY + 142, size: 40 },
            { x: centerX + 1150, y: centerY + 150, size: 43 },
            
            // Lower Campaign area
            { x: centerX + 900, y: centerY + 165, size: 43 },
            { x: centerX + 1000, y: centerY + 170, size: 46 },
            { x: centerX + 800, y: centerY + 160, size: 41 },
            { x: centerX + 1100, y: centerY + 175, size: 42 },
            { x: centerX + 750, y: centerY + 168, size: 40 },
            
            // Bottom Campaign area
            { x: centerX + 950, y: centerY + 190, size: 42 },
            { x: centerX + 1050, y: centerY + 195, size: 44 },
            { x: centerX + 850, y: centerY + 185, size: 39 },
            { x: centerX + 700, y: centerY + 192, size: 38 },
            { x: centerX + 1150, y: centerY + 200, size: 41 },
            
            // Extra Campaign edge trees
            { x: centerX + 1200, y: centerY + 125, size: 40 },
            { x: centerX + 1250, y: centerY + 130, size: 42 },
            { x: centerX + 1200, y: centerY + 170, size: 40 },
            { x: centerX + 1300, y: centerY + 115, size: 43 },
        ];

        // Render trees with proper z-ordering (by Y position)
        treePositions.sort((a, b) => a.y - b.y);
        
        treePositions.forEach((treePos, index) => {
            // Generate a consistent seed for tree type variation based on position
            const gridX = Math.floor(treePos.x / 50);
            const gridY = Math.floor(treePos.y / 50);
            this.renderTree(ctx, treePos.x, treePos.y, treePos.size, gridX, gridY);
        });

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
        // Stone/dirt paths - simple layout focused on central plaza with meandering branches
        // All paths contained within the settlement walls
        const pathColor = '#9d9181';
        const pathDark = '#7a6f5d';
        
        // Set line cap and join for smoother curves
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // CENTRAL GATHERING PLAZA - main feature (smaller, original size)
        ctx.fillStyle = pathColor;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 80, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Central plaza edge highlight
        ctx.strokeStyle = pathDark;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 82, 62, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Render fountain/well centerpiece in plaza
        this.renderFountainCenterpiece(ctx, centerX, centerY);
        
        // BRANCH 1: From plaza up-left to Magic Academy - meandering path
        this.drawCurvedPath(ctx, [
            { x: centerX - 60, y: centerY - 50 },
            { x: centerX - 85, y: centerY - 70 },
            { x: centerX - 110, y: centerY - 80 }
        ], 22, pathColor, pathDark);
        
        // BRANCH 2: From plaza up-right to Tower Forge - meandering path
        this.drawCurvedPath(ctx, [
            { x: centerX + 60, y: centerY - 50 },
            { x: centerX + 85, y: centerY - 70 },
            { x: centerX + 110, y: centerY - 80 }
        ], 22, pathColor, pathDark);
        
        // Add stone texture details to main paths
        ctx.fillStyle = 'rgba(100, 100, 100, 0.12)';
        for (let i = 0; i < 15; i++) {
            const x = centerX - 130 + Math.random() * 260;
            const y = centerY - 120 + Math.random() * 220;
            const size = 2 + Math.random() * 3;
            ctx.fillRect(x, y, size, size);
        }
        
        // Add worn spots at path junctions
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 50, 40, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderFountainCenterpiece(ctx, centerX, centerY) {
        // Decorative fountain/well centerpiece in the plaza
        const fountainScale = 1.0;
        
        // Base stone platform
        ctx.fillStyle = '#9a8a77';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 3, 35, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Base edge shadow
        ctx.fillStyle = '#7a7a67';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 5, 33, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Base highlight rim
        ctx.strokeStyle = '#b9b9a7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 2, 34, 27, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Stone blocks on base - horizontal lines for stone pattern
        ctx.strokeStyle = '#8a8a77';
        ctx.lineWidth = 1;
        for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.ellipse(centerX, centerY + 3 + (i * 8), 34, 27, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Central well/fountain structure
        // Inner stone ring
        ctx.fillStyle = '#8a7a67';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 20, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner stone ring top highlight
        ctx.fillStyle = '#aaa97a';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - 2, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Water surface reflection
        ctx.fillStyle = 'rgba(100, 150, 200, 0.25)';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 1, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Central post/spout structure
        ctx.fillStyle = '#9a8a77';
        ctx.fillRect(centerX - 3, centerY - 8, 6, 10);
        
        // Post top
        ctx.beginPath();
        ctx.arc(centerX, centerY - 8, 3.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Water spout light
        ctx.fillStyle = 'rgba(150, 200, 255, 0.3)';
        ctx.fillRect(centerX - 2, centerY - 12, 4, 5);
        
        // Small decorative accent stones on corners
        ctx.fillStyle = '#a9a997';
        const cornerDistance = 25;
        const corners = [
            { x: centerX - cornerDistance, y: centerY - cornerDistance },
            { x: centerX + cornerDistance, y: centerY - cornerDistance },
            { x: centerX - cornerDistance, y: centerY + cornerDistance },
            { x: centerX + cornerDistance, y: centerY + cornerDistance }
        ];
        
        corners.forEach(corner => {
            ctx.beginPath();
            ctx.arc(corner.x, corner.y, 2.5, 0, Math.PI * 2);
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

    // Tree rendering methods (from LevelBase.js)
    renderTreeType1(ctx, x, y, size) {
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

    renderTreeType2(ctx, x, y, size) {
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

    renderTreeType3(ctx, x, y, size) {
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
        ctx.beginPath();
        ctx.arc(x + size * 0.28, y - size * 0.3, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTreeType4(ctx, x, y, size) {
        const trunkWidth = size * 0.18;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - trunkWidth * 0.5, y - size * 0.05, trunkWidth, size * 0.45);
        ctx.fillStyle = '#0D3817';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.05);
        ctx.lineTo(x + size * 0.38, y + size * 0.15);
        ctx.lineTo(x - size * 0.38, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.25);
        ctx.lineTo(x + size * 0.3, y);
        ctx.lineTo(x - size * 0.3, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.45);
        ctx.lineTo(x + size * 0.2, y - size * 0.15);
        ctx.lineTo(x - size * 0.2, y - size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#43A047';
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.6);
        ctx.lineTo(x + size * 0.12, y - size * 0.45);
        ctx.lineTo(x - size * 0.12, y - size * 0.45);
        ctx.closePath();
        ctx.fill();
    }

    renderTree(ctx, x, y, size, gridX, gridY) {
        const seed = Math.floor(gridX + gridY) % 4;
        switch(seed) {
            case 0:
                this.renderTreeType1(ctx, x, y, size);
                break;
            case 1:
                this.renderTreeType2(ctx, x, y, size);
                break;
            case 2:
                this.renderTreeType3(ctx, x, y, size);
                break;
            default:
                this.renderTreeType4(ctx, x, y, size);
        }
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

class StatsPanel {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.animationProgress = 0;
        this.targetAnimationProgress = 1;
        this.isOpen = false;
        
        // Get stats from SaveSystem
        const currentSlot = SaveSystem.getCurrentSlot();
        const saveData = SaveSystem.getSave(currentSlot) || {};
        
        this.stats = {
            'Total Enemies Killed': saveData.enemiesKilled || 0,
            'Total Gold Earned': saveData.totalGoldEarned || 0,
            'Level Progress': (saveData.currentLevel || 0) + ' / 5',
            'Time Played': this.formatTime(saveData.timePlayed || 0),
            'Wave Record': saveData.waveRecord || 0,
            'Towers Built': saveData.towersBuild || 0
        };
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m ${secs}s`;
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
        this.targetAnimationProgress = 1;
    }

    close() {
        this.isOpen = false;
        this.targetAnimationProgress = 0;
    }

    update(deltaTime) {
        this.animationProgress += (this.targetAnimationProgress - this.animationProgress) * deltaTime * 5;
    }

    updateHoverState(x, y) {
        // Not needed for stats panel
    }

    handleClick(x, y) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 200;
        const menuY = canvas.height / 2 - 150;
        const closeButtonX = menuX + 360;
        const closeButtonY = menuY + 10;
        
        // Check if close button clicked
        if (x >= closeButtonX && x <= closeButtonX + 30 &&
            y >= closeButtonY && y <= closeButtonY + 30) {
            this.close();
            this.settlementHub.closePopup();
        }
    }

    render(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;

        const menuX = canvas.width / 2 - 200;
        const menuY = canvas.height / 2 - 150;
        const menuWidth = 400;
        const menuHeight = 300;

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
        ctx.fillText('STATS', canvas.width / 2, menuY + 40);

        // Close button
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(menuX + 360, menuY + 10, 30, 30);
        ctx.fillStyle = '#2a1a0f';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('X', menuX + 375, menuY + 25);

        // Stats display
        let yOffset = 70;
        const statSpacing = 35;
        
        Object.entries(this.stats).forEach(([label, value]) => {
            // Label
            ctx.font = '14px serif';
            ctx.fillStyle = '#c9a876';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(label + ':', menuX + 30, menuY + yOffset);

            // Value
            ctx.font = 'bold 14px serif';
            ctx.fillStyle = '#d4af37';
            ctx.textAlign = 'right';
            ctx.fillText(String(value), menuX + menuWidth - 30, menuY + yOffset);

            yOffset += statSpacing;
        });

        ctx.globalAlpha = 1;
    }
}
