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
        
        // Nav buttons (top-right)
        this.hoveredCampaignBtn = false;
        this.hoveredSettlementBtn = false;
        
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
        
        this.hoveredCampaignBtn = false;
        this.hoveredSettlementBtn = false;
        
        // Play campaign-specific music
        if (this.stateManager.audioManager && this.campaignId) {
            // Use playMusicCategory to play campaign-specific music
            // This will automatically rotate through all campaign tracks
            this.stateManager.audioManager.playMusicCategory(this.campaignId);
        }
        
        this.setupMouseListeners();
    }
    
    exit() {
        this.removeMouseListeners();
    }

    // ============ GAMEPAD BUTTON NAVIGATION ============

    getButtonCount() {
        // Unlocked levels + 2 nav buttons
        const unlockedCount = this.levels ? this.levels.filter(l => l.unlocked && !l.id.startsWith('placeholder-')).length : 0;
        return unlockedCount + 2; // +2 for campaign select + settlement
    }

    getFocusedButtonIndex() {
        const unlockedLevels = this._getUnlockedLevelIndices();
        if (this.hoveredCampaignBtn) {
            return unlockedLevels.length;
        }
        if (this.hoveredSettlementBtn) {
            return unlockedLevels.length + 1;
        }
        if (this.hoveredLevel >= 0) {
            return unlockedLevels.indexOf(this.hoveredLevel);
        }
        return -1;
    }

    focusButton(index) {
        this.hoveredLevel = -1;
        this.hoveredCampaignBtn = false;
        this.hoveredSettlementBtn = false;
        const unlockedLevels = this._getUnlockedLevelIndices();

        if (index >= 0 && index < unlockedLevels.length) {
            this.hoveredLevel = unlockedLevels[index];
        } else if (index === unlockedLevels.length) {
            this.hoveredCampaignBtn = true;
        } else if (index === unlockedLevels.length + 1) {
            this.hoveredSettlementBtn = true;
        }
    }

    activateFocusedButton() {
        if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');
        if (this.hoveredCampaignBtn) {
            this.stateManager.changeState('campaignMenu');
            return;
        }
        if (this.hoveredSettlementBtn) {
            this.stateManager.changeState('settlementHub');
            return;
        }
        if (this.hoveredLevel >= 0 && this.levelSlots && this.levelSlots[this.hoveredLevel]) {
            const slot = this.levelSlots[this.hoveredLevel];
            const level = slot.level;
            if (level && level.unlocked && !level.id.startsWith('placeholder-')) {
                this.stateManager.selectedLevelInfo = {
                    ...level,
                    campaignId: this.campaignId
                };
                this.stateManager.changeState('game');
            }
        }
    }

    _getUnlockedLevelIndices() {
        if (!this.levels) return [];
        const indices = [];
        for (let i = 0; i < this.levels.length; i++) {
            if (this.levels[i].unlocked && !this.levels[i].id.startsWith('placeholder-')) {
                indices.push(i);
            }
        }
        return indices;
    }
    
    setupMouseListeners() {
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
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
    
    getCampaignBtnBounds() {
        const canvas = this.stateManager.canvas;
        return {
            x: canvas.width - 322,
            y: 14,
            width: 158,
            height: 44
        };
    }

    getSettlementBtnBounds() {
        const canvas = this.stateManager.canvas;
        return {
            x: canvas.width - 154,
            y: 14,
            width: 140,
            height: 44
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
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        this.hoveredLevel = -1;
        this.hoveredCampaignBtn = false;
        this.hoveredSettlementBtn = false;
        
        // Check nav buttons
        const campaignBtn = this.getCampaignBtnBounds();
        if (x >= campaignBtn.x && x <= campaignBtn.x + campaignBtn.width &&
            y >= campaignBtn.y && y <= campaignBtn.y + campaignBtn.height) {
            this.hoveredCampaignBtn = true;
        }
        const settlementBtn = this.getSettlementBtnBounds();
        if (x >= settlementBtn.x && x <= settlementBtn.x + settlementBtn.width &&
            y >= settlementBtn.y && y <= settlementBtn.y + settlementBtn.height) {
            this.hoveredSettlementBtn = true;
        }
        
        // Check level slots using circular hit detection
        // Radius of 110px matches castle visual size at 0.5 scale (base castle ~220px)
        // Only allow hover for UNLOCKED levels
        if (this.levelSlots && this.levelSlots.length > 0) {
            for (let i = 0; i < this.levelSlots.length; i++) {
                const slot = this.levelSlots[i];
                if (slot && slot.level && slot.level.unlocked) {
                    const distance = Math.sqrt(
                        Math.pow(x - slot.x, 2) + Math.pow(y - slot.y, 2)
                    );
                    
                    // Radius of 110px matches castle visual size at 0.5 scale
                    if (distance <= 110) {
                        this.hoveredLevel = i;
                        break;
                    }
                }
            }
        }
        
        this.stateManager.canvas.style.cursor = 
            (this.hoveredLevel !== -1 || this.hoveredCampaignBtn || this.hoveredSettlementBtn) ? 'pointer' : 'default';
    }
    
    handleClick(x, y) {
        // Check nav buttons
        const campaignBtn = this.getCampaignBtnBounds();
        if (x >= campaignBtn.x && x <= campaignBtn.x + campaignBtn.width &&
            y >= campaignBtn.y && y <= campaignBtn.y + campaignBtn.height) {
            if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');
            this.stateManager.changeState('campaignMenu');
            return;
        }
        const settlementBtn = this.getSettlementBtnBounds();
        if (x >= settlementBtn.x && x <= settlementBtn.x + settlementBtn.width &&
            y >= settlementBtn.y && y <= settlementBtn.y + settlementBtn.height) {
            if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');
            this.stateManager.changeState('settlementHub');
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
                            // IMPORTANT: Include campaignId so GameplayState loads from correct campaign
                            this.stateManager.selectedLevelInfo = {
                                ...level,
                                campaignId: this.campaignId
                            };
                            // GameplayState will read selectedLevelInfo.id and campaignId to create the level
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

        // Render terrain (includes path rendering before trees)
        this.renderTerrain(ctx);

        // Render level slots (castles only)
        this.renderLevelSlots(ctx);

        // Render level labels on top of all terrain/trees
        this.renderAllLevelLabels(ctx);

        // Render title
        this.renderTitle(ctx, canvas);

        // Render nav buttons
        this.renderNavButtons(ctx);
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

    renderAllLevelLabels(ctx) {
        if (this.levelSlots && this.levelSlots.length > 0) {
            for (let i = 0; i < this.levelSlots.length; i++) {
                this.renderLevelLabel(ctx, i);
            }
        }
    }

    // Draw a themed ribbon banner with the level name hovering above the castle.
    // Subclasses can override this.labelStyle to customise colours per campaign.
    renderLevelLabel(ctx, index) {
        if (!this.levelSlots || index >= this.levelSlots.length) return;
        const slot = this.levelSlots[index];
        if (!slot || !slot.level) return;

        const level = slot.level;
        const displayName = level.name || `Level ${index + 1}`;
        const x = slot.x;
        const y = slot.y - 78;  // hover just above castle top

        const style = this.labelStyle || {};
        const bg1    = style.bg1    || 'rgba(40, 25, 10, 0.93)';
        const bg2    = style.bg2    || 'rgba(55, 35, 15, 0.97)';
        const border = style.border || 'rgba(160, 120, 50, 0.85)';
        const text   = style.text   || '#f0e0b0';

        ctx.save();
        ctx.font = 'bold 13px serif';
        const textW   = ctx.measureText(displayName).width;
        const bannerW = Math.max(textW + 36, 108);
        const bannerH = 26;
        const notch   = 9;

        // Ribbon shape path (inward V-notch on each side)
        const ribbonPath = () => {
            ctx.beginPath();
            ctx.moveTo(x - bannerW / 2,         y - bannerH / 2);
            ctx.lineTo(x + bannerW / 2,         y - bannerH / 2);
            ctx.lineTo(x + bannerW / 2,         y - notch);
            ctx.lineTo(x + bannerW / 2 - notch, y);
            ctx.lineTo(x + bannerW / 2,         y + notch);
            ctx.lineTo(x + bannerW / 2,         y + bannerH / 2);
            ctx.lineTo(x - bannerW / 2,         y + bannerH / 2);
            ctx.lineTo(x - bannerW / 2,         y + notch);
            ctx.lineTo(x - bannerW / 2 + notch, y);
            ctx.lineTo(x - bannerW / 2,         y - notch);
            ctx.closePath();
        };

        // Drop shadow
        ctx.shadowColor   = 'rgba(0,0,0,0.65)';
        ctx.shadowBlur    = 8;
        ctx.shadowOffsetY = 3;

        // Gradient fill
        const grad = ctx.createLinearGradient(x, y - bannerH / 2, x, y + bannerH / 2);
        grad.addColorStop(0,   bg1);
        grad.addColorStop(0.5, bg2);
        grad.addColorStop(1,   bg1);
        ctx.fillStyle = grad;
        ribbonPath();
        ctx.fill();

        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

        // Border
        ctx.strokeStyle = border;
        ctx.lineWidth   = 1.5;
        ribbonPath();
        ctx.stroke();

        // Text shadow
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = 'rgba(0,0,0,0.55)';
        ctx.fillText(displayName, x + 1, y + 1);

        // Text
        ctx.fillStyle = text;
        ctx.fillText(displayName, x, y);

        ctx.restore();
    }

    // Distribute totalSlots evenly along pathPoints by cumulative pixel distance.
    // Uses linear interpolation within segments so slots are spaced exactly equal
    // path-distance apart, rather than snapping to the nearest path-point vertex
    // (which could place two consecutive slots on the same position when a segment
    // is shorter than the slot spacing).
    // Returns an array of {x, y} position objects.
    _distributeSlotsByDistance(pathPoints, totalSlots) {
        const cum = [0];
        for (let i = 1; i < pathPoints.length; i++) {
            const dx = pathPoints[i].x - pathPoints[i - 1].x;
            const dy = pathPoints[i].y - pathPoints[i - 1].y;
            cum.push(cum[i - 1] + Math.hypot(dx, dy));
        }
        const total   = cum[cum.length - 1];
        const spacing = total / (totalSlots + 1);
        const result  = [];
        for (let s = 0; s < totalSlots; s++) {
            const target = (s + 1) * spacing;
            let idx = 1;
            while (idx < cum.length - 1 && cum[idx] < target) idx++;
            const segLen = cum[idx] - cum[idx - 1];
            const t = segLen > 0 ? (target - cum[idx - 1]) / segLen : 0;
            const p0 = pathPoints[idx - 1];
            const p1 = pathPoints[idx];
            result.push({ x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t });
        }
        return result;
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
            ctx.save();
            ctx.translate(slot.x, slot.y);
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.arc(0, -4, 7, Math.PI, 0, false);
            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fillRect(-9, -5, 18, 14);
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(-2, 1, 4, 5);
            ctx.restore();
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
    
    renderNavButtons(ctx) {
        this._renderNavBtn(ctx, this.getCampaignBtnBounds(), 'CAMPAIGNS', this.hoveredCampaignBtn);
        this._renderNavBtn(ctx, this.getSettlementBtnBounds(), 'SETTLEMENT', this.hoveredSettlementBtn);
    }

    _renderNavBtn(ctx, btn, label, isHovered) {
        const gradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
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
        ctx.fillRect(btn.x, btn.y + btn.height - 3, btn.width, 3);
        
        ctx.strokeStyle = isHovered ? '#ffd700' : '#d4af37';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
        
        ctx.strokeStyle = isHovered ? '#8b7355' : '#3a2a1f';
        ctx.lineWidth = 1;
        ctx.strokeRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
        
        ctx.font = 'bold 13px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText(label, btn.x + btn.width / 2 + 1, btn.y + btn.height / 2 + 1);
        ctx.fillStyle = isHovered ? '#ffe700' : '#d4af37';
        ctx.fillText(label, btn.x + btn.width / 2, btn.y + btn.height / 2);
    }
    
    update(deltaTime) {
        // Override in subclasses for animations
    }
}
