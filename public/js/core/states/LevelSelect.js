import { LevelFactory } from '../../game/LevelFactory.js';
import { CampaignRegistry } from '../../game/CampaignRegistry.js';
import { SaveSystem } from '../SaveSystem.js';

export class LevelSelect {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.selectedLevel = null;
        this.hoveredLevel = -1;
        
        // Campaign context
        this.campaign = null;
        this.campaignLevelIds = [];
        
        // Exit button hover state
        this.hoveredExitButton = false;
        
        // Map configuration - 8 slots arranged around a central map
        this.mapConfig = {
            centerX: 0,
            centerY: 0,
            mapRadius: 250,
            slotRadius: 400
        };
        
        // Slot positions (8 slots arranged in a circle)
        this.slotPositions = [];
    }
    
    enter() {
        // Hide game UI when in level select
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        
        if (statsBar) {
            statsBar.style.display = 'none';
        }
        if (sidebar) {
            sidebar.style.display = 'none';
        }
        
        // Load campaign context if available
        if (this.stateManager.selectedCampaign) {
            this.campaign = this.stateManager.selectedCampaign;
            this.campaignLevelIds = this.campaign.levels;
        }
        
        // Load all levels from LevelFactory
        const saveData = this.stateManager.currentSaveData;
        const allLevels = LevelFactory.getLevelList(saveData);
        
        // Filter levels to only those in the campaign
        if (this.campaignLevelIds.length > 0) {
            this.levels = allLevels.filter(level => this.campaignLevelIds.includes(level.id));
        } else {
            this.levels = allLevels;
        }
        
        // Initialize map center
        const canvas = this.stateManager.canvas;
        this.mapConfig.centerX = canvas.width / 2;
        this.mapConfig.centerY = canvas.height / 2;
        
        // Calculate slot positions based on campaign level count
        this.calculateSlotPositions();
        
        // Select first unlocked level by default
        this.selectedLevel = this.levels.findIndex(l => l.unlocked);
        if (this.selectedLevel === -1) this.selectedLevel = 0;
        
        this.hoveredExitButton = false;
        
        this.setupMouseListeners();
    }
    
    calculateSlotPositions() {
        this.slotPositions = [];
        const numSlots = 8;
        for (let i = 0; i < numSlots; i++) {
            const angle = (i / numSlots) * Math.PI * 2 - Math.PI / 2;
            const x = this.mapConfig.centerX + Math.cos(angle) * this.mapConfig.slotRadius;
            const y = this.mapConfig.centerY + Math.sin(angle) * this.mapConfig.slotRadius;
            this.slotPositions.push({ x, y, angle });
        }
    }
    
    getSlotBounds(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slotPositions.length) return null;
        const slot = this.slotPositions[slotIndex];
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
    
    getExitButtonBounds() {
        return {
            x: this.stateManager.canvas.width - 120,
            y: 20,
            width: 100,
            height: 40
        };
    }
    
    exit() {
        // UI will be shown by the next state (game state)
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
        
        this.hoveredLevel = -1;
        this.hoveredExitButton = false;
        
        // Check exit button hover
        const exitBtn = this.getExitButtonBounds();
        if (x >= exitBtn.x && x <= exitBtn.x + exitBtn.width &&
            y >= exitBtn.y && y <= exitBtn.y + exitBtn.height) {
            this.hoveredExitButton = true;
        }
        
        // Check level slot hovers
        for (let i = 0; i < Math.min(this.levels.length, 8); i++) {
            const bounds = this.getSlotBounds(i);
            const distance = Math.sqrt(
                Math.pow(x - bounds.centerX, 2) + Math.pow(y - bounds.centerY, 2)
            );
            
            if (distance <= 50) {
                this.hoveredLevel = i;
            }
        }
        
        this.stateManager.canvas.style.cursor = 
            (this.hoveredLevel !== -1 || this.hoveredExitButton) ? 'pointer' : 'default';
    }
    
    render(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Old school map background
        this.renderMapBackground(ctx, canvas);
        
        // Draw connecting paths between level slots
        this.renderPaths(ctx);
        
        // Draw central map area with decorative elements
        this.renderMapCenter(ctx);
        
        // Render level slots
        for (let i = 0; i < Math.min(this.levels.length, 8); i++) {
            this.renderLevelSlot(ctx, i);
        }
        
        // Draw exit button in top right
        this.renderExitButton(ctx);
    }
    
    renderMapBackground(ctx, canvas) {
        // Parchment-like background with texture
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#d4a574');
        gradient.addColorStop(0.5, '#c19a6b');
        gradient.addColorStop(1, '#b8a68f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Weathered paper texture
        ctx.fillStyle = 'rgba(139, 90, 43, 0.1)';
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 3;
            ctx.fillRect(x, y, size, size);
        }
        
        // Dark border frame
        ctx.strokeStyle = '#3d2817';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    }
    
    renderMapCenter(ctx) {
        const centerX = this.mapConfig.centerX;
        const centerY = this.mapConfig.centerY;
        const mapRadius = this.mapConfig.mapRadius;
        
        // Draw decorative map circle/compass
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, mapRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Compass rose
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 2;
        
        // Cardinal directions
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - mapRadius);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + mapRadius);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX - mapRadius, centerY);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + mapRadius, centerY);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();
        
        // Central point
        ctx.fillStyle = '#3d2817';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Map title - show campaign name if available
        ctx.font = 'bold 36px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#3d2817';
        const titleText = this.campaign ? this.campaign.name.toUpperCase() : 'THE REALM';
        ctx.fillText(titleText, centerX, centerY - mapRadius - 40);
    }
    
    renderPaths(ctx) {
        const centerX = this.mapConfig.centerX;
        const centerY = this.mapConfig.centerY;
        
        // Draw paths connecting center to each slot
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        
        this.slotPositions.forEach(slot => {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(slot.x, slot.y);
            ctx.stroke();
        });
        
        ctx.setLineDash([]);
    }
    
    renderLevelSlot(ctx, index) {
        const level = this.levels[index];
        if (!level) return;
        
        const bounds = this.getSlotBounds(index);
        const isHovered = index === this.hoveredLevel;
        const isSelected = index === this.selectedLevel;
        const size = 90;
        
        // Draw slot background circle
        let bgColor = '#8b5a2b';
        let borderColor = '#5a3a1a';
        let borderWidth = 2;
        
        if (!level.unlocked) {
            bgColor = '#4a4a4a';
            borderColor = '#2a2a2a';
        } else if (isSelected) {
            bgColor = '#d4af37';
            borderColor = '#8b7355';
            borderWidth = 4;
        } else if (isHovered) {
            bgColor = '#c19a6b';
            borderColor = '#8b5a2b';
            borderWidth = 3;
        }
        
        // Draw slot circle with shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(bounds.centerX + 3, bounds.centerY + 3, 45, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(bounds.centerX, bounds.centerY, 45, 0, Math.PI * 2);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.beginPath();
        ctx.arc(bounds.centerX, bounds.centerY, 45, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner highlight for 3D effect
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bounds.centerX - 15, bounds.centerY - 15, 30, 0, Math.PI * 1.5);
        ctx.stroke();
        
        if (level.unlocked) {
            // Level number/icon
            ctx.font = 'bold 24px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isSelected ? '#3d2817' : '#ffffcc';
            
            const levelNum = level.id === 'sandbox' ? 'S' : level.id.replace('level', '');
            ctx.fillText(levelNum, bounds.centerX, bounds.centerY - 10);
            
            // Level name below
            ctx.font = '11px serif';
            ctx.fillStyle = isSelected ? '#3d2817' : '#ffffcc';
            ctx.fillText(level.name, bounds.centerX, bounds.centerY + 18);
        } else {
            // Locked indicator
            ctx.font = 'bold 20px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#666';
            ctx.fillText('🔒', bounds.centerX, bounds.centerY);
        }
    }
    
    renderExitButton(ctx) {
        const btn = this.getExitButtonBounds();
        const isHovered = this.hoveredExitButton;
        
        // Medieval button background
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
        
        // Inner shadow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(btn.x, btn.y, btn.width, 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(btn.x, btn.y, btn.width, 3);
        ctx.fillRect(btn.x, btn.y + btn.height - 3, btn.width, 3);
        
        // Border
        ctx.strokeStyle = isHovered ? '#ffd700' : '#d4af37';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
        
        ctx.strokeStyle = isHovered ? '#8b7355' : '#3a2a1f';
        ctx.lineWidth = 1;
        ctx.strokeRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
        
        // Text
        ctx.font = 'bold 14px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText('EXIT', btn.x + btn.width / 2 + 1, btn.y + btn.height / 2 + 1);
        ctx.fillStyle = isHovered ? '#ffe700' : '#d4af37';
        ctx.fillText('EXIT', btn.x + btn.width / 2, btn.y + btn.height / 2);
    }
    update(deltaTime) {
        // No dynamic updates needed for level select
    }
    
    handleClick(x, y) {
        // Check exit button click
        const exitBtn = this.getExitButtonBounds();
        if (x >= exitBtn.x && x <= exitBtn.x + exitBtn.width &&
            y >= exitBtn.y && y <= exitBtn.y + exitBtn.height) {
            // Return to campaign menu or settlement hub
            if (this.campaign) {
                this.stateManager.changeState('campaignMenu');
            } else {
                this.stateManager.changeState('settlementHub');
            }
            return;
        }
        
        // Check level slot clicks
        for (let i = 0; i < Math.min(this.levels.length, 8); i++) {
            const level = this.levels[i];
            const bounds = this.getSlotBounds(i);
            const distance = Math.sqrt(
                Math.pow(x - bounds.centerX, 2) + Math.pow(y - bounds.centerY, 2)
            );
            
            if (distance <= 50) {
                if (level.unlocked) {
                    // Start level
                    this.stateManager.selectedLevelInfo = level;
                    this.stateManager.changeState('game');
                }
                return;
            }
        }
    }
    
    saveGame() {
        if (this.stateManager.currentSaveSlot) {
            const saveData = {
                lastPlayedLevel: this.stateManager.selectedLevelInfo?.id || 'level1',
                unlockedLevels: this.stateManager.currentSaveData?.unlockedLevels || ['level1'],
                completedLevels: this.stateManager.currentSaveData?.completedLevels || []
            };

            SaveSystem.saveGame(this.stateManager.currentSaveSlot, saveData);
            this.stateManager.currentSaveData = saveData;
        }
    }
}
