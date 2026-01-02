import { CampaignRegistry } from '../../game/CampaignRegistry.js';

export class CampaignMenu {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.campaigns = [];
        this.selectedCampaignId = null;
        this.hoveredCampaignId = null;
        
        // Info panel state
        this.infoPanelOpen = false;
        this.infoPanelOpacity = 0;
        this.infoPanelAnimSpeed = 0.08;
        
        // Grid configuration
        this.gridConfig = {
            cols: 2,
            rows: 3,
            slotWidth: 280,
            slotHeight: 200,
            paddingX: 80,
            paddingY: 120,
            gapX: 80,
            gapY: 60
        };
        
        // Exit button
        this.hoveredExitButton = false;
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
        
        // Load campaigns
        this.campaigns = CampaignRegistry.getCampaignsOrdered();
        
        // Select first campaign by default
        this.selectedCampaignId = this.campaigns.length > 0 ? this.campaigns[0].id : null;
        this.infoPanelOpen = false;
        this.infoPanelOpacity = 0;
        
        // Play menu theme music
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playMusic('menu-theme');
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
    
    getCampaignSlotPosition(index) {
        const { cols, slotWidth, slotHeight, paddingX, paddingY, gapX, gapY } = this.gridConfig;
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        return {
            x: paddingX + col * (slotWidth + gapX),
            y: paddingY + row * (slotHeight + gapY),
            width: slotWidth,
            height: slotHeight
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
    
    getInfoPanelBounds() {
        const canvas = this.stateManager.canvas;
        const panelWidth = 450;
        const panelHeight = 500;
        return {
            x: canvas.width - panelWidth - 40,
            y: 120,
            width: panelWidth,
            height: panelHeight
        };
    }
    
    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.hoveredCampaignId = null;
        this.hoveredExitButton = false;
        
        // Check exit button
        const exitBtn = this.getExitButtonBounds();
        if (x >= exitBtn.x && x <= exitBtn.x + exitBtn.width &&
            y >= exitBtn.y && y <= exitBtn.y + exitBtn.height) {
            this.hoveredExitButton = true;
        }
        
        // Check campaign slots
        this.campaigns.forEach((campaign, index) => {
            const pos = this.getCampaignSlotPosition(index);
            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {
                this.hoveredCampaignId = campaign.id;
            }
        });
        
        this.stateManager.canvas.style.cursor = 
            (this.hoveredCampaignId || this.hoveredExitButton) ? 'pointer' : 'default';
    }
    
    handleClick(x, y) {
        // Check exit button
        const exitBtn = this.getExitButtonBounds();
        if (x >= exitBtn.x && x <= exitBtn.x + exitBtn.width &&
            y >= exitBtn.y && y <= exitBtn.y + exitBtn.height) {
            this.stateManager.changeState('settlementHub');
            return;
        }
        
        // Check campaign clicks
        this.campaigns.forEach((campaign, index) => {
            const pos = this.getCampaignSlotPosition(index);
            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {
                // Click selects campaign or enters if already selected
                if (this.selectedCampaignId === campaign.id && !campaign.locked) {
                    // Enter campaign - switch to the campaign state (levelSelect)
                    this.stateManager.changeState('levelSelect');
                } else {
                    // Select campaign to show info panel
                    this.selectedCampaignId = campaign.id;
                    this.infoPanelOpen = true;
                }
            }
        });
    }
    
    render(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Background
        this.renderBackground(ctx, canvas);
        
        // Title
        ctx.font = 'bold 48px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d4af37';
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.fillText('CAMPAIGNS', canvas.width / 2, 70);
        ctx.strokeText('CAMPAIGNS', canvas.width / 2, 70);
        
        // Render campaign slots
        this.campaigns.forEach((campaign, index) => {
            this.renderCampaignSlot(ctx, campaign, index);
        });
        
        // Render info panel if a campaign is selected
        if (this.selectedCampaignId) {
            this.infoPanelOpacity = Math.min(1, this.infoPanelOpacity + this.infoPanelAnimSpeed);
            const selectedCampaign = CampaignRegistry.getCampaign(this.selectedCampaignId);
            if (selectedCampaign) {
                this.renderInfoPanel(ctx, selectedCampaign, this.infoPanelOpacity);
            }
        } else {
            this.infoPanelOpacity = Math.max(0, this.infoPanelOpacity - this.infoPanelAnimSpeed);
        }
        
        // Render exit button
        this.renderExitButton(ctx);
    }
    
    renderBackground(ctx, canvas) {
        // Medieval background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2a1a0f');
        gradient.addColorStop(1, '#1a0f0a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Subtle texture
        ctx.fillStyle = 'rgba(212, 175, 55, 0.03)';
        for (let i = 0; i < 300; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2;
            ctx.fillRect(x, y, size, size);
        }
    }
    
    renderCampaignSlot(ctx, campaign, index) {
        const pos = this.getCampaignSlotPosition(index);
        const isSelected = this.selectedCampaignId === campaign.id;
        const isHovered = this.hoveredCampaignId === campaign.id;
        const isLocked = campaign.locked;
        
        // Card background
        let bgColor = '#1a0f05';
        let borderColor = '#664422';
        let borderWidth = 2;
        
        if (isLocked) {
            bgColor = '#0f0f0f';
            borderColor = '#333';
            borderWidth = 1;
        } else if (isSelected) {
            bgColor = '#3a2a1a';
            borderColor = '#d4af37';
            borderWidth = 3;
        } else if (isHovered) {
            bgColor = '#2a1a0a';
            borderColor = '#a88555';
            borderWidth = 2.5;
        }
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(pos.x + 4, pos.y + 4, pos.width, pos.height);
        
        // Card background
        ctx.fillStyle = bgColor;
        ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
        
        // Border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);
        
        // Inner highlight
        if (!isLocked) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(pos.x + 2, pos.y + 2, pos.width - 4, pos.height - 4);
        }
        
        if (isLocked) {
            // Locked state
            ctx.font = 'bold 36px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#666';
            ctx.fillText('🔒', pos.x + pos.width / 2, pos.y + pos.height / 2 - 20);
            
            ctx.font = '14px serif';
            ctx.fillStyle = '#888';
            ctx.fillText('LOCKED', pos.x + pos.width / 2, pos.y + pos.height / 2 + 30);
        } else {
            // Campaign icon
            ctx.font = '32px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(campaign.icon, pos.x + pos.width / 2, pos.y + 15);
            
            // Campaign name
            ctx.font = 'bold 16px serif';
            ctx.fillStyle = isSelected ? '#ffd700' : '#d4af37';
            ctx.textBaseline = 'middle';
            ctx.fillText(campaign.name, pos.x + pos.width / 2, pos.y + 65);
            
            // Difficulty
            ctx.font = '12px serif';
            const diffColor = campaign.difficulty === 'Beginner' ? '#4CAF50' : 
                            campaign.difficulty === 'Intermediate' ? '#FFC107' : 
                            campaign.difficulty === 'Advanced' ? '#F44336' : 
                            campaign.difficulty === 'Expert' ? '#9C27B0' : '#E91E63';
            ctx.fillStyle = diffColor;
            ctx.fillText(`● ${campaign.difficulty}`, pos.x + pos.width / 2, pos.y + 85);
            
            // Progress bar
            const barWidth = pos.width - 30;
            const barHeight = 8;
            const barX = pos.x + 15;
            const barY = pos.y + pos.height - 45;
            
            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Progress
            const progressColor = campaign.progress >= 100 ? '#4CAF50' : '#d4af37';
            ctx.fillStyle = progressColor;
            ctx.fillRect(barX, barY, barWidth * (campaign.progress / 100), barHeight);
            
            // Border
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Progress text
            ctx.font = '10px serif';
            ctx.fillStyle = '#c9a876';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`${Math.floor(campaign.progress)}%`, pos.x + pos.width / 2, barY + 12);
        }
    }
    
    renderInfoPanel(ctx, campaign, opacity) {
        const panel = this.getInfoPanelBounds();
        
        // Save context alpha
        const globalAlpha = ctx.globalAlpha;
        ctx.globalAlpha = opacity;
        
        // Background panel with border
        ctx.fillStyle = 'rgba(26, 15, 5, 0.95)';
        ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(panel.x, panel.y, panel.width, panel.height);
        
        // Inner decorative border
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 1;
        ctx.strokeRect(panel.x + 2, panel.y + 2, panel.width - 4, panel.height - 4);
        
        const contentX = panel.x + 20;
        const contentY = panel.y + 20;
        const contentWidth = panel.width - 40;
        
        let currentY = contentY;
        
        // Campaign icon and name
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d4af37';
        ctx.fillText(campaign.icon, panel.x + panel.width / 2, currentY);
        currentY += 40;
        
        // Campaign title
        ctx.font = 'bold 18px serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText(campaign.name, panel.x + panel.width / 2, currentY);
        currentY += 35;
        
        // Difficulty
        ctx.font = '12px serif';
        const diffColor = campaign.difficulty === 'Beginner' ? '#4CAF50' : 
                        campaign.difficulty === 'Intermediate' ? '#FFC107' : 
                        campaign.difficulty === 'Advanced' ? '#F44336' : 
                        campaign.difficulty === 'Expert' ? '#9C27B0' : '#E91E63';
        ctx.fillStyle = diffColor;
        ctx.fillText(`Difficulty: ${campaign.difficulty}`, panel.x + panel.width / 2, currentY);
        currentY += 25;
        
        // Separator line
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(contentX, currentY);
        ctx.lineTo(contentX + contentWidth, currentY);
        ctx.stroke();
        currentY += 15;
        
        // Story/Description
        ctx.font = '11px serif';
        ctx.fillStyle = '#c9a876';
        ctx.textAlign = 'left';
        
        const maxWidth = contentWidth;
        const words = campaign.story.split(' ');
        let line = '';
        let lineY = currentY;
        
        words.forEach(word => {
            const testLine = line + (line ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth) {
                ctx.fillText(line, contentX, lineY);
                line = word;
                lineY += 14;
            } else {
                line = testLine;
            }
        });
        if (line) ctx.fillText(line, contentX, lineY);
        
        lineY += 25;
        
        // Separator line
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(contentX, lineY);
        ctx.lineTo(contentX + contentWidth, lineY);
        ctx.stroke();
        lineY += 15;
        
        // Rewards section
        ctx.font = 'bold 13px serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'left';
        ctx.fillText('Rewards:', contentX, lineY);
        lineY += 20;
        
        ctx.font = '11px serif';
        ctx.fillStyle = '#c9a876';
        ctx.fillText(`Gold: ${campaign.rewards.gold}`, contentX, lineY);
        lineY += 16;
        
        ctx.fillText(`Experience: ${campaign.rewards.experience}`, contentX, lineY);
        lineY += 16;
        
        ctx.fillStyle = '#a8ff5e';
        campaign.rewards.unlocks.forEach(unlock => {
            ctx.fillText(`✦ ${unlock}`, contentX + 10, lineY);
            lineY += 16;
        });
        
        // Enter button hint if not locked
        if (!campaign.locked && this.selectedCampaignId === campaign.id) {
            ctx.font = '10px serif';
            ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('Click again to enter campaign', panel.x + panel.width / 2, panel.y + panel.height - 15);
        }
        
        // Restore context alpha
        ctx.globalAlpha = globalAlpha;
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
        // Animation updates if needed
    }
}
