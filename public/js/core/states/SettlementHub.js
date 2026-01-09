import { SaveSystem } from '../SaveSystem.js';
import { LootRegistry } from '../../entities/loot/LootRegistry.js';
import { TrainingGrounds } from '../../entities/buildings/TrainingGrounds.js';
import { TowerForge } from '../../entities/buildings/TowerForge.js';
import { MagicAcademy } from '../../entities/buildings/MagicAcademy.js';
import { Castle } from '../../entities/buildings/Castle.js';
import { GuardPost } from '../../entities/towers/GuardPost.js';
import { SettlementBuildingVisuals } from '../SettlementBuildingVisuals.js';
import { UpgradeSystem } from '../UpgradeSystem.js';
import { UpgradeRegistry } from '../UpgradeRegistry.js';

/**
 * SettlementHub State
 * Main hub screen displayed after save slot selection or loading a game
 * Features a medieval settlement with interactive buildings and UI elements
 */
export class SettlementHub {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.showContent = true; // Show immediately, no initial delay
        this.contentOpacity = 1; // Fully opaque from the start
        this.fadeInOpacity = 0; // For optional fade-in overlay
        this.enableFadeInOverlay = true; // Professional fade-in effect overlay
        
        // Create actual building instances positioned INSIDE the settlement
        this.settlementBuildings = [];
        
        // Building interactivity - three main buildings are clickable
        this.buildings = [
            { id: 'trainingGrounds', name: 'Training Grounds', action: 'levelSelect', x: 0, y: 0, width: 80, height: 60, hovered: false },
            { id: 'towerForge', name: 'Tower Forge', action: 'upgrades', x: 0, y: 0, width: 80, height: 60, hovered: false },
            { id: 'magicAcademy', name: 'Magic Academy', action: 'enemyLogs', x: 0, y: 0, width: 80, height: 60, hovered: false },
        ];

        // UI state
        this.activePopup = null;
        this.upgradesPopup = null;
        this.optionsPopup = null;
        this.arcaneKnowledgePopup = null;
        this.buildingPositions = {};
        
        // Animation state
        this.buildingAnimations = {};
        
        // Pre-rendered scene for instant loading
        this.preRenderedScene = null;
        this.isFirstRender = true;
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

        // Reset animation - content is shown immediately
        this.animationTime = 0;
        this.showContent = true;
        this.contentOpacity = 1;
        this.fadeInOpacity = 0; // Fade-in overlay starts transparent
        this.isFirstRender = true; // Force pre-render on next render
        this.activePopup = null;
        
        // Load campaign progress (gold, inventory, upgrades) from persistent storage
        // Load from the current save slot to ensure isolation between save games
        // BUT: Only load inventory if it's empty (preserve loot from just-completed level)
        const campaignProgress = SaveSystem.loadCampaignProgress(this.stateManager.currentSaveSlot);
        this.stateManager.playerGold = campaignProgress.playerGold || 0;
        
        // Only load inventory from storage if we don't already have loot from current session
        if (!this.stateManager.playerInventory || this.stateManager.playerInventory.length === 0) {
            this.stateManager.playerInventory = campaignProgress.playerInventory || [];
        }
        
        // Initialize upgrade system if not already done
        if (!this.stateManager.upgradeSystem) {
            this.stateManager.upgradeSystem = new UpgradeSystem();
            if (campaignProgress.upgrades) {
                this.stateManager.upgradeSystem.restoreFromSave(campaignProgress.upgrades);
            }
        }
        
        // Reset all popup hover states
        if (this.upgradesPopup) {
            this.upgradesPopup.buttons = this.upgradesPopup.buttons.map(b => ({ ...b, hovered: false }));
        }
        if (this.optionsPopup) {
            this.optionsPopup.buttons = this.optionsPopup.buttons.map(b => ({ ...b, hovered: false }));
            this.optionsPopup.closeButtonHovered = false;
        }
        if (this.arcaneKnowledgePopup) {
            this.arcaneKnowledgePopup.buttons = this.arcaneKnowledgePopup.buttons.map(b => ({ ...b, hovered: false }));
            this.arcaneKnowledgePopup.closeButtonHovered = false;
        }
        
        // Play settlement theme music - pick random settlement song and loop it
        // BUT: If settlement music is already playing, keep it (don't restart)
        if (this.stateManager.audioManager) {
            const currentTrack = this.stateManager.audioManager.getCurrentTrack();
            const settlementTracks = this.stateManager.audioManager.getSettlementTracks();
            
            // If settlement music is not already playing, start a new one
            if (!settlementTracks.includes(currentTrack)) {
                this.stateManager.audioManager.playRandomSettlementTheme();
            }
        }
        
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
                action: 'arcaneKnowledge'
            },
            // Castle - positioned to the right side of settlement (clickable)
            {
                building: new Castle(centerX + 700, centerY - 80, 0, 0),
                scale: 29,
                clickable: true,
                action: 'options'
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
        // Save campaign progress before exiting (with current save slot)
        SaveSystem.saveCampaignProgress(
            this.stateManager.playerGold,
            this.stateManager.playerInventory,
            this.stateManager.upgradeSystem,
            this.stateManager.currentSaveSlot
        );
        
        this.removeMouseListeners();
    }

    setupMouseListeners() {
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            // Account for CSS scaling - same as handleMouseMove
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
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
        // Account for CSS scaling
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // If popup is active, update its hover state
        if (this.activePopup === 'upgrades' && this.upgradesPopup) {
            this.upgradesPopup.updateHoverState(x, y);
        } else if (this.activePopup === 'options' && this.optionsPopup) {
            this.optionsPopup.updateHoverState(x, y);
        } else if (this.activePopup === 'arcaneKnowledge' && this.arcaneKnowledgePopup) {
            this.arcaneKnowledgePopup.updateHoverState(x, y);
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
        } else if (this.activePopup === 'arcaneKnowledge' && this.arcaneKnowledgePopup) {
            this.arcaneKnowledgePopup.handleClick(x, y);
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
            this.stateManager.changeState('campaignMenu');
        } else if (buildingItem.action === 'upgrades') {
            this.activePopup = 'upgrades';
            if (!this.upgradesPopup) {
                this.upgradesPopup = new UpgradesMenu(this.stateManager, this);
            }
            this.upgradesPopup.open();
        } else if (buildingItem.action === 'options') {
            this.activePopup = 'options';
            if (!this.optionsPopup) {
                this.optionsPopup = new ManageSettlementMenu(this.stateManager, this);
            }
            this.optionsPopup.open();
        } else if (buildingItem.action === 'arcaneKnowledge') {
            this.activePopup = 'arcaneKnowledge';
            if (!this.arcaneKnowledgePopup) {
                this.arcaneKnowledgePopup = new ArcaneKnowledgeMenu(this.stateManager, this);
            }
            this.arcaneKnowledgePopup.open();
        }
    }

    closePopup() {
        this.activePopup = null;
    }

    update(deltaTime) {
        this.animationTime += deltaTime;

        // Fade-in overlay effect (professional 0.6 second fade)
        if (this.enableFadeInOverlay && this.fadeInOpacity < 1) {
            this.fadeInOpacity = Math.min(1, this.animationTime / 0.6);
        }

        // Update active popup
        if (this.activePopup === 'upgrades' && this.upgradesPopup) {
            this.upgradesPopup.update(deltaTime);
        } else if (this.activePopup === 'options' && this.optionsPopup) {
            this.optionsPopup.update(deltaTime);
        } else if (this.activePopup === 'arcaneKnowledge' && this.arcaneKnowledgePopup) {
            this.arcaneKnowledgePopup.update(deltaTime);
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

            // Reset canvas shadow properties to prevent persistent glow effects
            ctx.shadowColor = 'rgba(0, 0, 0, 0)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.globalAlpha = 1;

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
            } else if (this.activePopup === 'arcaneKnowledge' && this.arcaneKnowledgePopup) {
                this.arcaneKnowledgePopup.render(ctx);
            }

            // Professional fade-in overlay effect (soft, from dark to transparent)
            if (this.enableFadeInOverlay && this.fadeInOpacity < 1) {
                const fadeOpacity = (1 - this.fadeInOpacity) * 0.6; // Fade from 60% dark to transparent
                ctx.fillStyle = `rgba(0, 0, 0, ${fadeOpacity})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
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
        
        // Create subtle, slow pulsing effect using animation time
        const flicker = Math.sin(this.animationTime * 0.5) * 0.1 + 0.9; // Subtle pulsing between 0.8 and 1.0

        // Outer glow - very soft, far reaching
        const outerGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 4);
        outerGlow.addColorStop(0, 'rgba(255, 180, 80, 0.15)');
        outerGlow.addColorStop(0.5, 'rgba(255, 160, 60, 0.06)');
        outerGlow.addColorStop(1, 'rgba(255, 140, 40, 0)');
        ctx.fillStyle = outerGlow;
        ctx.fillRect(sunX - sunRadius * 4.2, sunY - sunRadius * 4.2, sunRadius * 8.4, sunRadius * 8.4);

        // Mid glow - corona effect (much slower, more natural)
        const coronaGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.8, sunX, sunY, sunRadius * 2.8);
        coronaGlow.addColorStop(0, `rgba(255, 200, 120, ${0.25 * flicker})`);
        coronaGlow.addColorStop(0.6, 'rgba(255, 160, 80, 0.12)');
        coronaGlow.addColorStop(1, 'rgba(255, 120, 60, 0)');
        ctx.fillStyle = coronaGlow;
        ctx.fillRect(sunX - sunRadius * 3, sunY - sunRadius * 3, sunRadius * 6, sunRadius * 6);

        // Sun core with radial gradient for depth - warmer golden tones
        const sunGradient = ctx.createRadialGradient(sunX - 15, sunY - 15, 5, sunX, sunY, sunRadius);
        sunGradient.addColorStop(0, '#fffccc');     // Very light creamy yellow center
        sunGradient.addColorStop(0.25, '#fffa00');  // Bright yellow
        sunGradient.addColorStop(0.5, '#ffd700');   // Golden
        sunGradient.addColorStop(0.75, '#ffb700');  // Golden-orange
        sunGradient.addColorStop(1, '#ff9500');     // Warm orange rim
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // Slow, gentle corona rays emanating from sun
        ctx.strokeStyle = `rgba(255, 160, 80, ${0.25 * flicker})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + this.animationTime * 0.05; // Much slower: 0.05 instead of 0.3
            const rayLength = sunRadius * (1.6 + Math.sin(this.animationTime * 0.3 + i) * 0.2); // Slower: 0.3 instead of 2
            const x1 = sunX + Math.cos(angle) * sunRadius * 0.9;
            const y1 = sunY + Math.sin(angle) * sunRadius * 0.9;
            const x2 = sunX + Math.cos(angle) * rayLength;
            const y2 = sunY + Math.sin(angle) * rayLength;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Subtle outer corona (gentle halo effect)
        const outerCorona = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.7, sunX, sunY, sunRadius * 2.2);
        outerCorona.addColorStop(0, `rgba(255, 200, 140, ${0.15 * flicker})`);
        outerCorona.addColorStop(0.5, 'rgba(255, 180, 120, 0.08)');
        outerCorona.addColorStop(1, 'rgba(255, 160, 100, 0)');
        ctx.fillStyle = outerCorona;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 2.2, 0, Math.PI * 2);
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
            'MagicAcademy': 'Arcane Knowledge',
            'TowerForge': 'Upgrades & Marketplace',
            'Castle': 'Manage Settlement'
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
                        
                        // Special handling for TowerForge with line break
                        if (buildingType === 'TowerForge') {
                            // Header text shadow
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                            ctx.font = 'bold 22px Arial';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText('UPGRADES &', headerX + 1, headerY - 15 + 1);
                            ctx.fillText('MARKETPLACE', headerX + 1, headerY + 15 + 1);
                            
                            // Header text
                            ctx.fillStyle = '#FFD700';
                            ctx.fillText('UPGRADES &', headerX, headerY - 15);
                            ctx.fillText('MARKETPLACE', headerX, headerY + 15);
                        } else {
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
        this.activeTab = 'buy'; // 'buy', 'sell', 'upgrade'
        this.currentPage = 0;
        // Get player gold from stateManager (persistent between levels)
        this.playerGold = stateManager.playerGold || 0;
        
        // Buy tab - 6 pages with 6 items each
        this.buyItems = [];
        for (let page = 0; page < 6; page++) {
            for (let i = 0; i < 6; i++) {
                this.buyItems.push({
                    id: `buy_${page * 6 + i}`,
                    name: `Item ${page * 6 + i + 1}`,
                    price: 100 + (page * 6 + i) * 50,
                    hovered: false
                });
            }
        }
        
        // Sell tab - build from actual loot inventory
        this.inventoryItems = this.buildInventoryItems();
        
        // Upgrade tab - populate from UpgradeRegistry
        this.upgradeItems = this.buildUpgradeItems();
        
        this.closeButtonHovered = false;
        this.leftArrowHovered = false;
        this.rightArrowHovered = false;
        this.tabButtons = [
            { label: 'BUY', action: 'buy', hovered: false },
            { label: 'SELL', action: 'sell', hovered: false },
            { label: 'UPGRADE', action: 'upgrade', hovered: false }
        ];
    }

    buildUpgradeItems() {
        // Get references from stateManager or create defaults
        const upgradeSystem = this.stateManager.upgradeSystem || { hasUpgrade: () => false };
        
        // Import UpgradeRegistry via stateManager (should be set during init)
        // For now, build a basic structure that will be updated when needed
        const items = [];
        
        // Hardcode the 6 upgrades for now (they'll be defined in the UI/rendering logic)
        const upgradeData = [
            {
                id: 'training-gear',
                name: 'Training Gear',
                description: 'Unlocks the ability to build Training Grounds in levels',
                cost: 500,
                icon: '⚔️',
                category: 'building'
            },
            {
                id: 'musical-equipment',
                name: 'Musical Equipment',
                description: 'Adds a music player to the UI for settling ambiance',
                cost: 300,
                icon: '🎵',
                category: 'ui'
            },
            {
                id: 'wooden-chest',
                name: 'Wooden Chest',
                description: 'Increase starting gold by 100',
                cost: 250,
                icon: '📦',
                category: 'gold'
            },
            {
                id: 'golden-chest',
                name: 'Golden Chest',
                description: 'Increase starting gold by another 100',
                cost: 400,
                icon: '🪙',
                category: 'gold',
                prerequisite: 'wooden-chest'
            },
            {
                id: 'platinum-chest',
                name: 'Platinum Chest',
                description: 'Increase starting gold by another 100',
                cost: 600,
                icon: '💎',
                category: 'gold',
                prerequisite: 'golden-chest'
            },
            {
                id: 'diamond-pickaxe',
                name: 'Diamond Pickaxe',
                description: 'Increase gem mining chance in gold mines',
                cost: 800,
                icon: '⛏️',
                category: 'mining'
            }
        ];
        
        for (const upgrade of upgradeData) {
            const isPurchased = upgradeSystem.hasUpgrade(upgrade.id);
            let canPurchase = !isPurchased;
            let prerequisiteMsg = null;
            
            // Check prerequisites
            if (upgrade.prerequisite && !upgradeSystem.hasUpgrade(upgrade.prerequisite)) {
                canPurchase = false;
                prerequisiteMsg = `Requires: ${upgradeData.find(u => u.id === upgrade.prerequisite)?.name}`;
            }
            
            items.push({
                id: upgrade.id,
                name: upgrade.name,
                description: upgrade.description,
                cost: upgrade.cost,
                icon: upgrade.icon,
                category: upgrade.category,
                hovered: false,
                isPurchased: isPurchased,
                canPurchase: canPurchase,
                prerequisiteMsg: prerequisiteMsg
            });
        }
        
        return items;
    }

    buildInventoryItems() {
        const items = [];
        const inventory = this.stateManager.playerInventory || [];
        
        console.log('Building inventory items from playerInventory:', inventory);
        
        // Create items from inventory
        for (const inventoryItem of inventory) {
            const lootInfo = this.getLootInfo(inventoryItem.lootId);
            if (!lootInfo) {
                console.warn('Could not find loot info for lootId:', inventoryItem.lootId);
                continue;
            }
            items.push({
                id: inventoryItem.lootId,
                name: lootInfo.name,
                sellPrice: lootInfo.sellValue,
                emblem: lootInfo.emblem,
                rarity: lootInfo.rarity,
                lootId: inventoryItem.lootId,
                count: inventoryItem.count || 1,
                hovered: false
            });
        }
        
        console.log('Built inventory items:', items);
        return items;
    }

    getLootInfo(lootId) {
        // Use LootRegistry for authoritative loot data
        const lootInfo = LootRegistry.getLootType(lootId);
        if (lootInfo) {
            console.log('Found loot in registry for', lootId, ':', lootInfo.name);
            return {
                name: lootInfo.name,
                sellValue: lootInfo.sellValue,
                emblem: lootInfo.emblem,
                rarity: lootInfo.rarity
            };
        }
        
        // Fallback for any items not in registry
        console.warn('Loot not found in registry:', lootId);
        return { 
            name: 'Unknown Item', 
            sellValue: 0,
            emblem: '?',
            rarity: 'common'
        };
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
        this.activeTab = 'buy';
        this.currentPage = 0;
        
        // Refresh player gold from stateManager (in case it changed)
        this.playerGold = this.stateManager.playerGold || 0;
        
        // Refresh inventory items from stateManager
        this.inventoryItems = this.buildInventoryItems();
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

    getMaxPages() {
        if (this.activeTab === 'buy') {
            return 6; // 6 pages of 6 items each
        } else if (this.activeTab === 'sell') {
            return Math.ceil(this.inventoryItems.length / 6);
        } else if (this.activeTab === 'upgrade') {
            return 2; // 2 pages of 6 upgrades each
        }
        return 1;
    }

    getItemsForCurrentPage() {
        const itemsPerPage = 6;
        const startIdx = this.currentPage * itemsPerPage;
        
        if (this.activeTab === 'buy') {
            return this.buyItems.slice(startIdx, startIdx + itemsPerPage);
        } else if (this.activeTab === 'sell') {
            return this.inventoryItems.slice(startIdx, startIdx + itemsPerPage);
        } else if (this.activeTab === 'upgrade') {
            return this.upgradeItems.slice(startIdx, startIdx + itemsPerPage);
        }
        return [];
    }

    updateHoverState(x, y) {
        const canvas = this.stateManager.canvas;
        const baseWidth = canvas.width - 120;
        const baseHeight = canvas.height - 80;
        const panelWidth = baseWidth * 0.6;
        const panelHeight = baseHeight * 0.6;
        const panelX = (canvas.width - panelWidth) / 2;
        const panelY = (canvas.height - panelHeight) / 2;
        
        const tabY = panelY + 42;
        const tabHeight = 32;
        const tabWidth = (panelWidth - 40) / 3;
        const tabGap = 0;
        
        // Check tab buttons
        this.tabButtons.forEach((tab, index) => {
            const tabX = panelX + 20 + index * (tabWidth + tabGap);
            tab.hovered = x >= tabX && x <= tabX + tabWidth && y >= tabY && y <= tabY + tabHeight;
        });
        
        // Check close button
        const closeX = panelX + panelWidth - 40;
        const closeY = panelY + 12;
        this.closeButtonHovered = x >= closeX && x <= closeX + 25 && y >= closeY && y <= closeY + 25;
        
        // Check arrow buttons
        const arrowY = panelY + panelHeight - 45;
        const arrowSize = 25;
        const leftArrowX = panelX + 20;
        const rightArrowX = panelX + panelWidth - 45;
        this.leftArrowHovered = x >= leftArrowX && x <= leftArrowX + arrowSize && y >= arrowY && y <= arrowY + arrowSize;
        this.rightArrowHovered = x >= rightArrowX && x <= rightArrowX + arrowSize && y >= arrowY && y <= arrowY + arrowSize;
        
        // Check item buttons (for sell and upgrade tabs)
        const contentY = panelY + 78;
        const contentHeight = panelHeight - 140;
        const itemsGridStartX = panelX + 14;
        const itemsGridStartY = contentY + 4;
        const itemWidth = (panelWidth - 28) / 3;
        const itemHeight = (contentHeight - 8) / 2;
        const itemGap = 8;
        
        const items = this.getItemsForCurrentPage();
        items.forEach((item, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const itemX = itemsGridStartX + col * (itemWidth + itemGap);
            const itemY = itemsGridStartY + row * (itemHeight + itemGap);
            item.hovered = x >= itemX && x <= itemX + itemWidth && y >= itemY && y <= itemY + itemHeight;
        });
        
        this.stateManager.canvas.style.cursor = 
            (this.tabButtons.some(t => t.hovered) || this.closeButtonHovered || this.leftArrowHovered || this.rightArrowHovered || items.some(i => i.hovered))
            ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        const canvas = this.stateManager.canvas;
        const baseWidth = canvas.width - 120;
        const baseHeight = canvas.height - 80;
        const panelWidth = baseWidth * 0.6;
        const panelHeight = baseHeight * 0.6;
        const panelX = (canvas.width - panelWidth) / 2;
        const panelY = (canvas.height - panelHeight) / 2;
        
        // Check close button
        const closeX = panelX + panelWidth - 40;
        const closeY = panelY + 12;
        if (x >= closeX && x <= closeX + 25 && y >= closeY && y <= closeY + 25) {
            this.close();
            return;
        }
        
        // Check tab buttons
        const tabY = panelY + 42;
        const tabHeight = 32;
        const tabWidth = (panelWidth - 40) / 3;
        const tabGap = 0;
        
        this.tabButtons.forEach((tab, index) => {
            const tabX = panelX + 20 + index * (tabWidth + tabGap);
            if (x >= tabX && x <= tabX + tabWidth && y >= tabY && y <= tabY + tabHeight) {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.activeTab = tab.action;
                this.currentPage = 0;
                
                // Refresh inventory items when switching to sell tab
                if (tab.action === 'sell') {
                    this.inventoryItems = this.buildInventoryItems();
                }
            }
        });
        
        // Check arrow buttons
        const arrowY = panelY + panelHeight - 45;
        const arrowSize = 25;
        const leftArrowX = panelX + 20;
        const rightArrowX = panelX + panelWidth - 45;
        const maxPages = this.getMaxPages();
        
        if (x >= leftArrowX && x <= leftArrowX + arrowSize && y >= arrowY && y <= arrowY + arrowSize) {
            if (this.currentPage > 0) {
                this.currentPage--;
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
            }
            return;
        }
        
        if (x >= rightArrowX && x <= rightArrowX + arrowSize && y >= arrowY && y <= arrowY + arrowSize) {
            if (this.currentPage < maxPages - 1) {
                this.currentPage++;
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
            }
            return;
        }
        
        // Check item buttons
        const contentY = panelY + 78;
        const contentHeight = panelHeight - 140;
        const itemsGridStartX = panelX + 14;
        const itemsGridStartY = contentY + 4;
        const itemWidth = (panelWidth - 28) / 3;
        const itemHeight = (contentHeight - 8) / 2;
        const itemGap = 8;
        
        const items = this.getItemsForCurrentPage();
        items.forEach((item, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const itemX = itemsGridStartX + col * (itemWidth + itemGap);
            const itemY = itemsGridStartY + row * (itemHeight + itemGap);
            if (x >= itemX && x <= itemX + itemWidth && y >= itemY && y <= itemY + itemHeight) {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                this.handleItemAction(item);
            }
        });
    }

    handleItemAction(item) {
        if (this.activeTab === 'buy') {
            console.log('Buying item:', item.name, 'for', item.price, 'gold');
            // TODO: Implement buy logic
        } else if (this.activeTab === 'sell') {
            // Sell the loot item
            this.playerGold += item.sellPrice;
            this.stateManager.playerGold = this.playerGold;
            
            // Remove from inventory
            const inventoryIndex = this.stateManager.playerInventory.findIndex(
                inv => inv.lootId === item.lootId
            );
            
            if (inventoryIndex !== -1) {
                this.stateManager.playerInventory[inventoryIndex].count -= 1;
                if (this.stateManager.playerInventory[inventoryIndex].count <= 0) {
                    this.stateManager.playerInventory.splice(inventoryIndex, 1);
                }
            }
            
            // Rebuild inventory items to reflect the change
            this.inventoryItems = this.buildInventoryItems();
            this.currentPage = 0;
            
            console.log('Sold item:', item.name, 'for', item.sellPrice, 'gold. Total gold:', this.playerGold);
        } else if (this.activeTab === 'upgrade') {
            // Handle upgrade purchase
            if (item.isPurchased) {
                console.log('Upgrade already purchased:', item.name);
                return;
            }
            
            if (!item.canPurchase) {
                if (item.prerequisiteMsg) {
                    console.log('Cannot purchase upgrade. ' + item.prerequisiteMsg);
                }
                return;
            }
            
            if (this.playerGold < item.cost) {
                console.log('Not enough gold to purchase:', item.name, '. Need:', item.cost, 'Have:', this.playerGold);
                return;
            }
            
            // Purchase the upgrade
            this.playerGold -= item.cost;
            this.stateManager.playerGold = this.playerGold;
            this.stateManager.upgradeSystem.purchaseUpgrade(item.id);
            
            // Rebuild upgrade items to reflect purchase
            this.upgradeItems = this.buildUpgradeItems();
            this.currentPage = 0;
            
            console.log('Purchased upgrade:', item.name, 'for', item.cost, 'gold. Remaining gold:', this.playerGold);
            
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.playSFX('purchase-success');
            }
        }
    }

    render(ctx) {
        if (!this.isOpen) return;
        
        const canvas = this.stateManager.canvas;
        const baseWidth = canvas.width - 120;
        const baseHeight = canvas.height - 80;
        const panelWidth = baseWidth * 0.6;
        const panelHeight = baseHeight * 0.6;
        const panelX = (canvas.width - panelWidth) / 2;
        const panelY = (canvas.height - panelHeight) / 2;
        
        // Fade background
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        
        // Panel background
        ctx.globalAlpha = Math.min(1, this.animationProgress);
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel border
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel title - inside at top
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('UPGRADES & MARKETPLACE', panelX + panelWidth / 2, panelY + 12);
        
        // Gold display in top left
        this.renderGoldDisplay(ctx, panelX + 20, panelY + 10);
        
        // Close button
        const closeX = panelX + panelWidth - 40;
        const closeY = panelY + 12;
        ctx.fillStyle = this.closeButtonHovered ? '#ff6666' : '#cc0000';
        ctx.fillRect(closeX, closeY, 25, 25);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(closeX, closeY, 25, 25);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', closeX + 12.5, closeY + 12.5);
        
        // Tabs
        const tabY = panelY + 42;
        const tabHeight = 32;
        const tabWidth = (panelWidth - 40) / 3;
        const tabGap = 0;
        
        this.tabButtons.forEach((tab, index) => {
            const tabX = panelX + 20 + index * (tabWidth + tabGap);
            const isActive = tab.action === this.activeTab;
            
            // Tab button with beveled edge effect
            // Background
            ctx.fillStyle = isActive ? '#6b5a47' : '#3a2a1a';
            ctx.fillRect(tabX, tabY, tabWidth, tabHeight);
            
            // Top highlight for active tab
            if (isActive) {
                ctx.fillStyle = '#8b7a67';
                ctx.fillRect(tabX, tabY, tabWidth, 2);
                ctx.fillStyle = '#7b6a57';
                ctx.fillRect(tabX, tabY + 2, tabWidth, 1);
            }
            
            // Bottom shadow
            ctx.fillStyle = '#1a0a00';
            ctx.fillRect(tabX, tabY + tabHeight - 2, tabWidth, 2);
            
            // Left shadow
            ctx.fillStyle = '#1a0a00';
            ctx.fillRect(tabX, tabY, 1, tabHeight);
            
            // Border
            ctx.strokeStyle = isActive ? '#ffd700' : '#5a4a3a';
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.strokeRect(tabX, tabY, tabWidth, tabHeight);
            
            // Tab text
            ctx.font = isActive ? 'bold 13px Arial' : '13px Arial';
            ctx.fillStyle = isActive ? '#ffd700' : '#b89968';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tab.label, tabX + tabWidth / 2, tabY + tabHeight / 2);
        });
        
        // Content area based on active tab - expanded to fill space
        const contentY = panelY + 78;
        const contentHeight = panelHeight - 140;
        
        this.renderTabContent(ctx, panelX, contentY, panelWidth, contentHeight);
        
        // Pagination controls
        const maxPages = this.getMaxPages();
        if (maxPages > 1) {
            this.renderPaginationControls(ctx, panelX, panelY + panelHeight - 50, panelWidth);
        }
        
        ctx.globalAlpha = 1;
    }

    renderGoldDisplay(ctx, x, y) {
        // Draw treasure chest with half-opened lid
        const chestWidth = 35;
        const chestHeight = 25;
        
        // Chest body - main brown color
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(x, y + 8, chestWidth, chestHeight - 8);
        
        // Chest front face - darker for 3D effect
        ctx.fillStyle = '#6b5a47';
        ctx.fillRect(x, y + 8, chestWidth, 3);
        
        // Chest sides shadow
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(x - 2, y + 8, 2, chestHeight - 8);
        ctx.fillRect(x + chestWidth, y + 8, 2, chestHeight - 8);
        
        // Chest bottom rim
        ctx.fillStyle = '#5a4a37';
        ctx.fillRect(x, y + chestHeight, chestWidth, 2);
        
        // Metal bands on chest
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(x - 2, y + 12, chestWidth + 4, 2);
        ctx.fillRect(x - 2, y + 20, chestWidth + 4, 1);
        
        // Chest lid - half open
        const lidWidth = chestWidth;
        const lidHeight = 8;
        const lidAngle = Math.PI / 6; // 30 degrees open
        
        ctx.save();
        ctx.translate(x, y + 8);
        ctx.rotate(-lidAngle);
        
        // Lid body
        ctx.fillStyle = '#8b6f47';
        ctx.fillRect(0, -lidHeight, lidWidth, lidHeight);
        
        // Lid front edge highlight
        ctx.fillStyle = '#a68f67';
        ctx.fillRect(0, -lidHeight, lidWidth, 2);
        
        // Lid metal hinge
        ctx.fillStyle = '#c4af37';
        ctx.fillRect(0, -2, 4, 4);
        ctx.fillRect(lidWidth - 4, -2, 4, 4);
        
        ctx.restore();
        
        // Gold coins visible inside chest
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth * 0.25, y + 15, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffed4e';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth * 0.5, y + 18, 3, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth * 0.75, y + 16, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Spilled gold coins around chest
        ctx.fillStyle = '#ffed4e';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth + 6, y + 18, 2.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(x + chestWidth + 10, y + 20, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Gold amount text next to chest
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.playerGold + ' Gold', x + chestWidth + 18, y + 14);
    }

    renderTabContent(ctx, panelX, contentY, panelWidth, contentHeight) {
        const items = this.getItemsForCurrentPage();
        const itemWidth = (panelWidth - 28) / 3;
        const itemHeight = (contentHeight - 8) / 2;
        const itemGap = 8;
        const itemsGridStartX = panelX + 14;
        const itemsGridStartY = contentY + 4;
        
        items.forEach((item, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const itemX = itemsGridStartX + col * (itemWidth + itemGap);
            const itemY = itemsGridStartY + row * (itemHeight + itemGap);
            
            this.renderItemTile(ctx, itemX, itemY, itemWidth, itemHeight, item);
        });
    }

    renderItemTile(ctx, x, y, width, height, item) {
        // Background
        ctx.fillStyle = item.hovered ? '#6b5a47' : '#3a2a1a';
        ctx.fillRect(x, y, width, height);
        
        // Top highlight
        ctx.fillStyle = item.hovered ? '#8b7a67' : '#4a3a2a';
        ctx.fillRect(x, y, width, 2);
        
        // Border (color by rarity if sell tab)
        let borderColor = item.hovered ? '#ffd700' : '#5a4a3a';
        if (this.activeTab === 'sell' && item.rarity) {
            const rarityColors = {
                'common': '#C9A961',
                'uncommon': '#4FC3F7',
                'rare': '#AB47BC',
                'epic': '#FF6F00',
                'legendary': '#FFD700'
            };
            borderColor = item.hovered ? rarityColors[item.rarity] : '#5a4a3a';
        }
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = item.hovered ? 3 : 2;
        ctx.strokeRect(x, y, width, height);
        
        // Extra glow for legendary items
        if (this.activeTab === 'sell' && item.rarity === 'legendary') {
            ctx.strokeStyle = '#FFD700';
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 1;
            ctx.strokeRect(x - 3, y - 3, width + 6, height + 6);
            ctx.globalAlpha = 1;
        }
        
        // Emblem (for sell tab items)
        if (this.activeTab === 'sell' && item.emblem) {
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = borderColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(item.emblem, x + width / 2, y + 8);
        }
        
        // Item name
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const nameY = this.activeTab === 'sell' && item.emblem ? y + 35 : y + 8;
        ctx.fillText(item.name, x + width / 2, nameY);
        
        // Price or cost
        const priceLabel = this.activeTab === 'sell' ? 'Sell: ' : this.activeTab === 'upgrade' ? 'Cost: ' : 'Price: ';
        const priceValue = this.activeTab === 'sell' ? item.sellPrice : this.activeTab === 'upgrade' ? item.cost : item.price;
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(priceLabel + priceValue + 'g', x + width / 2, y + height / 2 - 10);
        
        // Count (for sell tab)
        if (this.activeTab === 'sell' && item.count > 1) {
            ctx.font = '11px Arial';
            ctx.fillStyle = '#b89968';
            ctx.fillText('Count: ' + item.count, x + width / 2, y + height / 2 + 5);
        }
        
        // Action button
        const buttonWidth = width - 14;
        const buttonHeight = 22;
        const buttonX = x + 7;
        const buttonY = y + height - 30;
        
        // Button beveled effect
        ctx.fillStyle = item.hovered ? '#8b6f47' : '#5a4a3a';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Top highlight
        ctx.fillStyle = item.hovered ? '#9b7f57' : '#6a5a4a';
        ctx.fillRect(buttonX, buttonY, buttonWidth, 1);
        
        ctx.strokeStyle = item.hovered ? '#ffd700' : '#8b7355';
        ctx.lineWidth = item.hovered ? 2 : 1;
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        const actionText = this.activeTab === 'sell' ? 'SELL' : this.activeTab === 'upgrade' ? 'UPGRADE' : 'BUY';
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = item.hovered ? '#ffd700' : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(actionText, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
    }

    renderPaginationControls(ctx, panelX, y, panelWidth) {
        const arrowSize = 25;
        const leftArrowX = panelX + 20;
        const rightArrowX = panelX + panelWidth - 45;
        const maxPages = this.getMaxPages();
        
        // Left arrow with beveled effect
        ctx.fillStyle = this.leftArrowHovered ? '#8b6f47' : '#5a4a3a';
        ctx.fillRect(leftArrowX, y, arrowSize, arrowSize);
        
        // Top highlight
        ctx.fillStyle = this.leftArrowHovered ? '#9b7f57' : '#6a5a4a';
        ctx.fillRect(leftArrowX, y, arrowSize, 1);
        
        ctx.strokeStyle = this.leftArrowHovered ? '#ffd700' : '#5a4a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(leftArrowX, y, arrowSize, arrowSize);
        
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = this.leftArrowHovered ? '#ffd700' : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◀', leftArrowX + arrowSize / 2, y + arrowSize / 2);
        
        // Right arrow
        ctx.fillStyle = this.rightArrowHovered ? '#8b6f47' : '#5a4a3a';
        ctx.fillRect(rightArrowX, y, arrowSize, arrowSize);
        
        // Top highlight
        ctx.fillStyle = this.rightArrowHovered ? '#9b7f57' : '#6a5a4a';
        ctx.fillRect(rightArrowX, y, arrowSize, 1);
        
        ctx.strokeStyle = this.rightArrowHovered ? '#ffd700' : '#5a4a3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(rightArrowX, y, arrowSize, arrowSize);
        
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = this.rightArrowHovered ? '#ffd700' : '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▶', rightArrowX + arrowSize / 2, y + arrowSize / 2);
        
        // Page indicator
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Page ${this.currentPage + 1} / ${maxPages}`, ctx.canvas.width / 2, y + arrowSize / 2);
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
        const menuWidth = 300;
        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;

        // Check close button first
        if (x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
            y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
            this.close();
            return;
        }

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

        // Red X close button at top right
        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        
        ctx.fillStyle = this.closeButtonHovered ? '#ff6666' : '#cc0000';
        ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        
        // Draw X
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(closeButtonX + 5, closeButtonY + 5);
        ctx.lineTo(closeButtonX + closeButtonSize - 5, closeButtonY + closeButtonSize - 5);
        ctx.moveTo(closeButtonX + closeButtonSize - 5, closeButtonY + 5);
        ctx.lineTo(closeButtonX + 5, closeButtonY + closeButtonSize - 5);
        ctx.stroke();

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

/**
 * Manage Settlement Menu
 * Allows player to save, load, manage options, and quit
 */
class ManageSettlementMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.activeWarningDialog = null; // 'quitSettlement', 'quitTouwers', or null
        
        this.buttons = [
            { label: 'SAVE SETTLEMENT', action: 'save', hovered: false },
            { label: 'LOAD SETTLEMENT', action: 'load', hovered: false },
            { label: 'OPTIONS', action: 'options', hovered: false },
            { label: 'QUIT SETTLEMENT', action: 'quitSettlement', hovered: false },
            { label: 'QUIT TOUWERS', action: 'quitTouwers', hovered: false },
            { label: 'CLOSE', action: 'close', hovered: false },
        ];
        this.buttonWidth = 220;
        this.buttonHeight = 48;
        this.buttonMarginTop = 40;
        this.buttonGap = 12;
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
        this.activeWarningDialog = null; // Clear any existing warning dialog state
    }

    close() {
        this.isOpen = false;
        this.activeWarningDialog = null;
        this.settlementHub.closePopup();
    }

    update(deltaTime) {
        if (this.isOpen && this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
    }

    updateHoverState(x, y) {
        const canvas = this.stateManager.canvas;
        
        if (this.activeWarningDialog) {
            this.updateWarningDialogHoverState(x, y);
            return;
        }
        
        const menuPadding = 30;
        const menuWidth = this.buttonWidth + menuPadding * 2;
        const menuHeight = this.buttons.length * (this.buttonHeight + this.buttonGap) + this.buttonMarginTop + menuPadding * 2;
        const menuX = canvas.width / 2 - menuWidth / 2;
        const menuY = canvas.height / 2 - menuHeight / 2;

        this.buttons.forEach((button, index) => {
            const buttonX = menuX + menuPadding;
            const buttonY = menuY + this.buttonMarginTop + index * (this.buttonHeight + this.buttonGap);
            button.hovered = x >= buttonX && x <= buttonX + this.buttonWidth &&
                           y >= buttonY && y <= buttonY + this.buttonHeight;
        });

        this.stateManager.canvas.style.cursor =
            this.buttons.some(b => b.hovered) ? 'pointer' : 'default';
    }

    updateWarningDialogHoverState(x, y) {
        const canvas = this.stateManager.canvas;
        const dialogWidth = 480;
        const dialogHeight = 220;
        const dialogX = canvas.width / 2 - dialogWidth / 2;
        const dialogY = canvas.height / 2 - dialogHeight / 2;
        const buttonWidth = 130;
        const buttonHeight = 45;
        const buttonGap = 15;
        
        // Button positions in warning dialog
        const totalButtonWidth = buttonWidth * 3 + buttonGap * 2;
        const buttonsStartX = dialogX + (dialogWidth - totalButtonWidth) / 2;
        
        const cancelX = buttonsStartX;
        const cancelY = dialogY + 130;
        
        const saveQuitX = buttonsStartX + buttonWidth + buttonGap;
        const saveQuitY = dialogY + 130;
        
        const quitX = buttonsStartX + (buttonWidth + buttonGap) * 2;
        const quitY = dialogY + 130;
        
        const cancelHovered = x >= cancelX && x <= cancelX + buttonWidth && y >= cancelY && y <= cancelY + buttonHeight;
        const saveQuitHovered = x >= saveQuitX && x <= saveQuitX + buttonWidth && y >= saveQuitY && y <= saveQuitY + buttonHeight;
        const quitHovered = x >= quitX && x <= quitX + buttonWidth && y >= quitY && y <= quitY + buttonHeight;
        
        this.warningCancelHovered = cancelHovered;
        this.warningSaveQuitHovered = saveQuitHovered;
        this.warningQuitHovered = quitHovered;
        
        this.stateManager.canvas.style.cursor = (cancelHovered || saveQuitHovered || quitHovered) ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        const canvas = this.stateManager.canvas;
        
        if (this.activeWarningDialog) {
            this.handleWarningDialogClick(x, y);
            return;
        }
        
        const menuPadding = 30;
        const menuWidth = this.buttonWidth + menuPadding * 2;
        const menuHeight = this.buttons.length * (this.buttonHeight + this.buttonGap) + this.buttonMarginTop + menuPadding * 2;
        const menuX = canvas.width / 2 - menuWidth / 2;
        const menuY = canvas.height / 2 - menuHeight / 2;

        for (let i = 0; i < this.buttons.length; i++) {
            const button = this.buttons[i];
            const buttonX = menuX + menuPadding;
            const buttonY = menuY + this.buttonMarginTop + i * (this.buttonHeight + this.buttonGap);

            if (x >= buttonX && x <= buttonX + this.buttonWidth &&
                y >= buttonY && y <= buttonY + this.buttonHeight) {
                
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                
                this.handleButtonAction(button.action);
                return;
            }
        }
    }

    handleWarningDialogClick(x, y) {
        const canvas = this.stateManager.canvas;
        const dialogWidth = 480;
        const dialogHeight = 220;
        const dialogX = canvas.width / 2 - dialogWidth / 2;
        const dialogY = canvas.height / 2 - dialogHeight / 2;
        const buttonWidth = 130;
        const buttonHeight = 45;
        const buttonGap = 15;
        
        // Button positions
        const totalButtonWidth = buttonWidth * 3 + buttonGap * 2;
        const buttonsStartX = dialogX + (dialogWidth - totalButtonWidth) / 2;
        
        const cancelX = buttonsStartX;
        const cancelY = dialogY + 130;
        
        const saveQuitX = buttonsStartX + buttonWidth + buttonGap;
        const saveQuitY = dialogY + 130;
        
        const quitX = buttonsStartX + (buttonWidth + buttonGap) * 2;
        const quitY = dialogY + 130;
        
        // Play button click
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playSFX('button-click');
        }
        
        // Check Cancel button
        if (x >= cancelX && x <= cancelX + buttonWidth && y >= cancelY && y <= cancelY + buttonHeight) {
            this.activeWarningDialog = null;
            return;
        }
        
        // Check Save & Quit button
        if (x >= saveQuitX && x <= saveQuitX + buttonWidth && y >= saveQuitY && y <= saveQuitY + buttonHeight) {
            this.executeWarningAction('saveAndQuit');
            return;
        }
        
        // Check Quit button
        if (x >= quitX && x <= quitX + buttonWidth && y >= quitY && y <= quitY + buttonHeight) {
            this.executeWarningAction('quit');
            return;
        }
    }

    handleButtonAction(action) {
        switch (action) {
            case 'save':
                this.saveSettlement();
                break;
            case 'load':
                this.loadSettlement();
                break;
            case 'options':
                this.openOptions();
                break;
            case 'quitSettlement':
                this.activeWarningDialog = 'quitSettlement';
                break;
            case 'quitTouwers':
                this.activeWarningDialog = 'quitTouwers';
                break;
            case 'close':
                this.close();
                break;
        }
    }

    saveSettlement() {
        // Save the current game state
        if (this.stateManager.saveSystem) {
            // Save to the current slot (we need to track which slot was used)
            const currentSlot = SaveSystem.getCurrentSlot ? SaveSystem.getCurrentSlot() : 1;
            SaveSystem.saveGame(currentSlot);
        }
        
        // Close the menu
        this.close();
    }

    loadSettlement() {
        // Close menu and transition to load screen
        this.close();
        
        // Set previous state so options menu knows to return here
        this.stateManager.previousState = 'settlementHub';
        this.stateManager.changeState('loadGame');
    }

    openOptions() {
        // Close this menu and open options
        this.close();
        
        // Set previous state so options menu knows to return to settlement hub
        this.stateManager.previousState = 'settlementHub';
        this.stateManager.changeState('options');
    }

    executeWarningAction(action) {
        switch (action) {
            case 'quit':
                if (this.activeWarningDialog === 'quitSettlement') {
                    this.quitSettlement();
                } else if (this.activeWarningDialog === 'quitTouwers') {
                    this.quitTouwers(); // Will execute async in background
                }
                break;
            case 'saveAndQuit':
                if (this.stateManager.saveSystem) {
                    const currentSlot = SaveSystem.getCurrentSlot ? SaveSystem.getCurrentSlot() : 1;
                    SaveSystem.saveGame(currentSlot);
                }
                if (this.activeWarningDialog === 'quitSettlement') {
                    this.quitSettlement();
                } else if (this.activeWarningDialog === 'quitTouwers') {
                    this.quitTouwers(); // Will execute async in background
                }
                break;
        }
    }

    quitSettlement() {
        this.stateManager.changeState('mainMenu');
    }

    async quitTouwers() {
        // Check if running in Tauri
        if (window.__TAURI__) {
            try {
                // Use the custom Tauri command to close the app
                const { invoke } = window.__TAURI__.core;
                await invoke('close_app');
            } catch (error) {
                console.error('Error closing application:', error);
            }
        } else {
            // Fallback for development environment
            console.log('Closing application...');
            window.close();
        }
    }

    render(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Menu dimensions
        const menuPadding = 30;
        const menuWidth = this.buttonWidth + menuPadding * 2;
        const menuHeight = this.buttons.length * (this.buttonHeight + this.buttonGap) + this.buttonMarginTop + menuPadding * 2;
        const menuX = canvas.width / 2 - menuWidth / 2;
        const menuY = canvas.height / 2 - menuHeight / 2;

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Menu background with border
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        // Menu border
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        // Decorative corner accents
        const accentSize = 15;
        const accentColor = '#d4af37';
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        
        // Top-left
        ctx.beginPath();
        ctx.moveTo(menuX, menuY + accentSize);
        ctx.lineTo(menuX, menuY);
        ctx.lineTo(menuX + accentSize, menuY);
        ctx.stroke();
        
        // Top-right
        ctx.beginPath();
        ctx.moveTo(menuX + menuWidth - accentSize, menuY);
        ctx.lineTo(menuX + menuWidth, menuY);
        ctx.lineTo(menuX + menuWidth, menuY + accentSize);
        ctx.stroke();
        
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(menuX, menuY + menuHeight - accentSize);
        ctx.lineTo(menuX, menuY + menuHeight);
        ctx.lineTo(menuX + accentSize, menuY + menuHeight);
        ctx.stroke();
        
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(menuX + menuWidth - accentSize, menuY + menuHeight);
        ctx.lineTo(menuX + menuWidth, menuY + menuHeight);
        ctx.lineTo(menuX + menuWidth, menuY + menuHeight - accentSize);
        ctx.stroke();

        // Menu title
        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Title shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText('MANAGE SETTLEMENT', menuX + menuWidth / 2 + 1, menuY + 12 + 1);
        
        // Title
        ctx.fillStyle = '#ffd700';
        ctx.fillText('MANAGE SETTLEMENT', menuX + menuWidth / 2, menuY + 12);

        // Render buttons
        this.buttons.forEach((button, index) => {
            const buttonX = menuX + menuPadding;
            const buttonY = menuY + this.buttonMarginTop + index * (this.buttonHeight + this.buttonGap);

            // Button background gradient
            const bgGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + this.buttonHeight);
            bgGradient.addColorStop(0, button.hovered ? '#5a4030' : '#44301c');
            bgGradient.addColorStop(1, button.hovered ? '#3a2410' : '#261200');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(buttonX, buttonY, this.buttonWidth, this.buttonHeight);

            // Button border - highlight when hovered
            ctx.strokeStyle = button.hovered ? '#ffd700' : '#8b7355';
            ctx.lineWidth = button.hovered ? 3 : 2;
            ctx.strokeRect(buttonX, buttonY, this.buttonWidth, this.buttonHeight);

            // Top highlight line for beveled effect
            ctx.strokeStyle = button.hovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(buttonX, buttonY);
            ctx.lineTo(buttonX + this.buttonWidth, buttonY);
            ctx.stroke();

            // Inset shadow
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(buttonX, buttonY + this.buttonHeight);
            ctx.lineTo(buttonX + this.buttonWidth, buttonY + this.buttonHeight);
            ctx.stroke();

            // Button text
            ctx.font = 'bold 15px Trebuchet MS, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Text shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText(button.label, buttonX + this.buttonWidth / 2 + 1, buttonY + this.buttonHeight / 2 + 1);
            
            // Main text
            ctx.fillStyle = button.hovered ? '#ffd700' : '#d4af37';
            ctx.fillText(button.label, buttonX + this.buttonWidth / 2, buttonY + this.buttonHeight / 2);
        });

        // Render warning dialog if active
        if (this.activeWarningDialog) {
            this.renderWarningDialog(ctx);
        }

        ctx.globalAlpha = 1;
    }

    renderWarningDialog(ctx) {
        const canvas = this.stateManager.canvas;
        const dialogWidth = 480;
        const dialogHeight = 220;
        const dialogX = canvas.width / 2 - dialogWidth / 2;
        const dialogY = canvas.height / 2 - dialogHeight / 2;
        const buttonWidth = 130;
        const buttonHeight = 45;
        const buttonGap = 15;

        // Semi-transparent background (darker)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);

        // Dialog border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);

        // Dialog title
        const titleText = this.activeWarningDialog === 'quitSettlement' 
            ? 'QUIT SETTLEMENT?' 
            : 'QUIT TOUWERS?';
        
        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Title shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(titleText, dialogX + dialogWidth / 2 + 1, dialogY + 18 + 1);
        
        // Title
        ctx.fillStyle = '#ffd700';
        ctx.fillText(titleText, dialogX + dialogWidth / 2, dialogY + 18);

        // Warning message
        const messageText = this.activeWarningDialog === 'quitSettlement'
            ? 'Return to main menu?'
            : 'Close the game?';
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(messageText, dialogX + dialogWidth / 2, dialogY + 65);

        // Buttons in warning dialog - centered row
        const totalButtonWidth = buttonWidth * 3 + buttonGap * 2;
        const buttonsStartX = dialogX + (dialogWidth - totalButtonWidth) / 2;
        
        const cancelX = buttonsStartX;
        const cancelY = dialogY + 130;
        
        const saveQuitX = buttonsStartX + buttonWidth + buttonGap;
        const saveQuitY = dialogY + 130;
        
        const quitX = buttonsStartX + (buttonWidth + buttonGap) * 2;
        const quitY = dialogY + 130;

        // Helper function to render warning dialog buttons
        const renderWarningButton = (x, y, label, hovered) => {
            // Button background
            const bgGradient = ctx.createLinearGradient(x, y, x, y + buttonHeight);
            bgGradient.addColorStop(0, hovered ? '#5a4030' : '#44301c');
            bgGradient.addColorStop(1, hovered ? '#3a2410' : '#261200');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(x, y, buttonWidth, buttonHeight);

            // Border
            ctx.strokeStyle = hovered ? '#ffd700' : '#8b7355';
            ctx.lineWidth = hovered ? 3 : 2;
            ctx.strokeRect(x, y, buttonWidth, buttonHeight);

            // Top highlight
            ctx.strokeStyle = hovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + buttonWidth, y);
            ctx.stroke();

            // Inset shadow
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y + buttonHeight);
            ctx.lineTo(x + buttonWidth, y + buttonHeight);
            ctx.stroke();

            // Text
            ctx.font = 'bold 13px Trebuchet MS, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText(label, x + buttonWidth / 2 + 1, y + buttonHeight / 2 + 1);
            ctx.fillStyle = hovered ? '#ffd700' : '#d4af37';
            ctx.fillText(label, x + buttonWidth / 2, y + buttonHeight / 2);
        };

        renderWarningButton(cancelX, cancelY, 'CANCEL', this.warningCancelHovered);
        renderWarningButton(saveQuitX, saveQuitY, 'SAVE & QUIT', this.warningSaveQuitHovered);
        renderWarningButton(quitX, quitY, 'QUIT', this.warningQuitHovered);
    }
}

/**
 * Arcane Knowledge Menu
 * Placeholder menu for tracking magical knowledge, enemy encounters and statistics
 */
class ArcaneKnowledgeMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.buttons = [
            { label: 'CAMPAIGN JOURNAL', action: 'journal', hovered: false },
            { label: 'MONSTER JOURNAL', action: 'monsters', hovered: false },
            { label: 'STATISTICS', action: 'stats', hovered: false },
        ];
        this.buttonWidth = 200;
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
        const menuWidth = 300;
        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;

        // Check close button
        this.closeButtonHovered = x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
                                 y >= closeButtonY && y <= closeButtonY + closeButtonSize;

        this.buttons.forEach((button, index) => {
            const buttonX = menuX + 30;
            const buttonY = menuY + 70 + index * 70;
            button.hovered = x >= buttonX && x <= buttonX + this.buttonWidth &&
                           y >= buttonY && y <= buttonY + this.buttonHeight;
        });

        this.stateManager.canvas.style.cursor =
            (this.buttons.some(b => b.hovered) || this.closeButtonHovered) ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 150;
        const menuY = canvas.height / 2 - 150;
        const menuWidth = 300;
        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;

        // Check close button first
        if (x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
            y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
            this.close();
            return;
        }

        for (let i = 0; i < this.buttons.length; i++) {
            const button = this.buttons[i];
            const buttonX = menuX + 30;
            const buttonY = menuY + 70 + i * 70;

            if (x >= buttonX && x <= buttonX + this.buttonWidth &&
                y >= buttonY && y <= buttonY + this.buttonHeight) {
                this.handleButtonAction(button.action);
                return;
            }
        }
    }

    handleButtonAction(action) {
        switch (action) {
            case 'journal':
                // TODO: Implement campaign journal
                break;
            case 'monsters':
                // TODO: Implement monster journal
                break;
            case 'stats':
                // TODO: Implement magic statistics
                break;
        }
    }

    render(ctx) {
        const canvas = this.stateManager.canvas;
        const menuX = canvas.width / 2 - 150;
        const menuY = canvas.height / 2 - 150;
        const menuWidth = 300;
        const menuHeight = 340;

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Menu background
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        // Menu border
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        // Menu title
        ctx.font = 'bold 20px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('ARCANE KNOWLEDGE', menuX + menuWidth / 2, menuY + 20);

        // Render buttons in StartScreen style
        this.buttons.forEach((button, index) => {
            const buttonX = menuX + 30;
            const buttonY = menuY + 70 + index * 70;

            // Button background gradient
            const bgGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + this.buttonHeight);
            bgGradient.addColorStop(0, '#44301c');
            bgGradient.addColorStop(1, '#261200');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(buttonX, buttonY, this.buttonWidth, this.buttonHeight);

            // Button border - outset style
            ctx.strokeStyle = button.hovered ? '#ffd700' : '#8b7355';
            ctx.lineWidth = 2;
            ctx.strokeRect(buttonX, buttonY, this.buttonWidth, this.buttonHeight);

            // Top highlight line for beveled effect
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(buttonX, buttonY);
            ctx.lineTo(buttonX + this.buttonWidth, buttonY);
            ctx.stroke();

            // Inset shadow
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(buttonX, buttonY + this.buttonHeight);
            ctx.lineTo(buttonX + this.buttonWidth, buttonY + this.buttonHeight);
            ctx.stroke();

            // Button text
            ctx.fillStyle = button.hovered ? '#ffd700' : '#d4af37';
            ctx.font = 'bold 16px Trebuchet MS, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Text shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText(button.label, buttonX + this.buttonWidth / 2 + 1, buttonY + this.buttonHeight / 2 + 1);
            
            // Main text
            ctx.fillStyle = button.hovered ? '#ffd700' : '#d4af37';
            ctx.fillText(button.label, buttonX + this.buttonWidth / 2, buttonY + this.buttonHeight / 2);
        });

        // Red X close button at top right
        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        
        ctx.fillStyle = this.closeButtonHovered ? '#ff6666' : '#cc0000';
        ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        
        // Draw X
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(closeButtonX + 5, closeButtonY + 5);
        ctx.lineTo(closeButtonX + closeButtonSize - 5, closeButtonY + closeButtonSize - 5);
        ctx.moveTo(closeButtonX + closeButtonSize - 5, closeButtonY + 5);
        ctx.lineTo(closeButtonX + 5, closeButtonY + closeButtonSize - 5);
        ctx.stroke();

        ctx.globalAlpha = 1;
    }
}



