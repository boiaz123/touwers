/**
 * CampaignBase
 * Base class for all campaigns. Extend this to create new campaign maps.
 * Each campaign is responsible for:
 * - Rendering the map landscape and terrain
 * - Managing the path and level slot positions
 * - Handling interactions with level slots
 */
export class CampaignBase {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.selectedLevel = null;
        this.hoveredLevel = -1;
        
        // Campaign metadata - override in subclasses
        this.campaignId = 'campaign-unknown';
        this.campaignName = 'Unknown Campaign';
        this.levels = [];
        
        // Exit button
        this.hoveredExitButton = false;
        
        // Terrain and visuals - override in subclasses
        this.terrainData = null;
        this.pathPoints = [];
        this.levelSlots = [];
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
        
        // Select first unlocked level by default
        this.selectedLevel = this.levels.findIndex(l => l.unlocked);
        if (this.selectedLevel === -1) this.selectedLevel = 0;
        
        this.hoveredExitButton = false;
        
        // Campaign screen should play settlement music (same as campaign menu)
        if (this.stateManager.audioManager) {
            const currentTrack = this.stateManager.audioManager.getCurrentTrack();
            const settlementTracks = this.stateManager.audioManager.getSettlementTracks();
            
            // If settlement music is not already playing, start a new one
            if (!settlementTracks.includes(currentTrack)) {
                this.stateManager.audioManager.playRandomSettlementTheme();
            }
        }
        
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
    
    getExitButtonBounds() {
        return {
            x: this.stateManager.canvas.width - 120,
            y: 20,
            width: 100,
            height: 40
        };
    }
    
    getLevelSlotBounds(index) {
        if (!this.levelSlots || index >= this.levelSlots.length) return null;
        const slot = this.levelSlots[index];
        const size = 90;
        return {
            x: slot.x - size / 2,
            y: slot.y - size / 2,
            width: size,
            height: size,
            centerX: slot.x,
            centerY: slot.y
        };
    }
    
    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.hoveredLevel = -1;
        this.hoveredExitButton = false;
        
        // Check exit button
        const exitBtn = this.getExitButtonBounds();
        if (x >= exitBtn.x && x <= exitBtn.x + exitBtn.width &&
            y >= exitBtn.y && y <= exitBtn.y + exitBtn.height) {
            this.hoveredExitButton = true;
        }
        
        // Check level slots using circular hit detection
        // Radius of 110px matches castle visual size at 0.5 scale (base castle ~220px)
        // Castles are drawn via drawCastleTopDown(ctx, centerX, centerY, this.castleScale)
        if (this.levelSlots && this.levelSlots.length > 0) {
            for (let i = 0; i < this.levelSlots.length; i++) {
                const slot = this.levelSlots[i];
                if (slot) {
                    const distance = Math.sqrt(
                        Math.pow(x - slot.x, 2) + Math.pow(y - slot.y, 2)
                    );
                    
                    // Increased from 50 to 110 to match castle visual size at 0.5 scale
                    if (distance <= 110) {
                        this.hoveredLevel = i;
                        break;
                    }
                }
            }
        }
        
        this.stateManager.canvas.style.cursor = 
            (this.hoveredLevel !== -1 || this.hoveredExitButton) ? 'pointer' : 'default';
    }
    
    handleClick(x, y) {
        // Check exit button
        const exitBtn = this.getExitButtonBounds();
        if (x >= exitBtn.x && x <= exitBtn.x + exitBtn.width &&
            y >= exitBtn.y && y <= exitBtn.y + exitBtn.height) {
            this.stateManager.changeState('campaignMenu');
            return;
        }
        
        // Check level clicks using circular hit detection
        // Radius of 110px matches castle visual size at 0.5 scale
        if (this.levelSlots && this.levelSlots.length > 0) {
            for (let i = 0; i < this.levelSlots.length; i++) {
                const slot = this.levelSlots[i];
                const level = slot.level;
                
                if (slot) {
                    const distance = Math.sqrt(
                        Math.pow(x - slot.x, 2) + Math.pow(y - slot.y, 2)
                    );
                    
                    // Increased from 50 to 110 to match castle visual size at 0.5 scale
                    if (distance <= 110) {
                        // Only allow clicking unlocked levels (not placeholders or locked levels)
                        if (level.unlocked && !level.id.startsWith('placeholder-')) {
                            // Pass level info to GameplayState via stateManager
                            this.stateManager.selectedLevelInfo = level;
                            // GameplayState will read selectedLevelInfo.id to create the level
                            this.stateManager.changeState('game');
                        }
                        return;
                    }
                }
            }
        }
    }
    
    render(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Render background
        this.renderBackground(ctx, canvas);
        
        // Render terrain
        this.renderTerrain(ctx);
        
        // Render path
        this.renderPath(ctx);
        
        // Render level slots
        this.renderLevelSlots(ctx);
        
        // Render title
        this.renderTitle(ctx, canvas);
        
        // Render exit button
        this.renderExitButton(ctx);
    }
    
    renderBackground(ctx, canvas) {
        // Default background - override in subclasses
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(1, '#e0f6ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    renderTerrain(ctx) {
        // Override in subclasses to render specific terrain
    }
    
    renderPath(ctx) {
        // Override in subclasses to render the path
    }
    
    renderLevelSlots(ctx) {
        if (this.levelSlots && this.levelSlots.length > 0) {
            for (let i = 0; i < this.levelSlots.length; i++) {
                this.renderLevelSlot(ctx, i);
            }
        }
    }
    
    renderLevelSlot(ctx, index) {
        if (!this.levelSlots || index >= this.levelSlots.length) return;
        
        const slot = this.levelSlots[index];
        const level = slot.level;
        const isHovered = index === this.hoveredLevel;
        const isLocked = !level.unlocked;
        
        // Draw slot circle with shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(slot.x + 3, slot.y + 3, 45, 0, Math.PI * 2);
        ctx.fill();
        
        let bgColor = '#8b5a2b';
        let borderColor = '#5a3a1a';
        let borderWidth = 2;
        
        if (isLocked) {
            bgColor = '#4a4a4a';
            borderColor = '#2a2a2a';
            borderWidth = 1;
        } else if (isHovered) {
            bgColor = '#c19a6b';
            borderColor = '#8b5a2b';
            borderWidth = 3;
        }
        
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(slot.x, slot.y, 45, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.beginPath();
        ctx.arc(slot.x, slot.y, 45, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(slot.x - 15, slot.y - 15, 30, 0, Math.PI * 1.5);
        ctx.stroke();
        
        if (isLocked) {
            ctx.font = 'bold 20px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#666';
            ctx.fillText('🔒', slot.x, slot.y);
        } else {
            ctx.font = 'bold 28px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffcc';
            ctx.fillText(index + 1, slot.x, slot.y);
        }
    }
    
    renderTitle(ctx, canvas) {
        ctx.font = 'bold 36px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#3d2817';
        ctx.fillText(this.campaignName.toUpperCase(), canvas.width / 2, 50);
    }
    
    renderExitButton(ctx) {
        const btn = this.getExitButtonBounds();
        const isHovered = this.hoveredExitButton;
        
        const gradient = ctx.createLinearGradient(btn.y, btn.y + btn.height, 0, 0);
        if (isHovered) {
            gradient.addColorStop(0, '#8b7355');
            gradient.addColorStop(0.5, '#a89968');
            gradient.addColorStop(1, '#9a8960');
        } else {
            gradient.addColorStop(0, '#5a4a3a');
            gradient.addColorStop(0.5, '#7a6a5a');
            gradient.addColorStop(1, '#6a5a4a');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(btn.x, btn.y, btn.width, 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(btn.x, btn.y, btn.width, 3);
        ctx.fillRect(btn.x, btn.y + btn.height - 3, btn.width, 3);
        
        ctx.strokeStyle = isHovered ? '#ffd700' : '#d4af37';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
        
        ctx.strokeStyle = isHovered ? '#8b7355' : '#3a2a1f';
        ctx.lineWidth = 1;
        ctx.strokeRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
        
        ctx.font = 'bold 14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText('EXIT', btn.x + btn.width / 2 + 1, btn.y + btn.height / 2 + 1);
        ctx.fillStyle = isHovered ? '#ffe700' : '#d4af37';
        ctx.fillText('EXIT', btn.x + btn.width / 2, btn.y + btn.height / 2);
    }
    
    update(deltaTime) {
        // Override in subclasses for animations
    }
}
