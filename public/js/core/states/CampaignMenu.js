import { CampaignRegistry } from '../../game/CampaignRegistry.js';

export class CampaignMenu {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.campaigns = [];
        this.selectedCampaignId = null;
        this.hoveredCampaignId = null;
        this.hoveredStartButton = false;
        
        // Info panel state
        this.infoPanelOpen = false;
        this.infoPanelOpacity = 0;
        this.infoPanelAnimSpeed = 0.08;
        
        // Layout configuration - 2-column grid on left, info panel on right (full height)
        this.layout = {
            leftPadding: 40,
            topPadding: 140,
            rightPadding: 40,
            bottomPadding: 40,
            campaignTileWidth: 380,
            campaignTileHeight: 200,
            campaignGapX: 30,
            campaignGapY: 25,
            campaignCols: 2,
            infoPanelRightMargin: 40,
            infoPanelTopMargin: 140
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
        
        // Reset hover states
        this.hoveredCampaignId = null;
        this.hoveredExitButton = false;
        
        // Select first campaign by default
        this.selectedCampaignId = this.campaigns.length > 0 ? this.campaigns[0].id : null;
        this.infoPanelOpen = false;
        this.infoPanelOpacity = 0;
        
        // Campaign menu should ONLY play settlement music, never the main theme
        // This keeps the settlement song playing throughout settlement-related menus
        if (this.stateManager.audioManager) {
            const currentTrack = this.stateManager.audioManager.getCurrentTrack();
            const settlementTracks = this.stateManager.audioManager.getSettlementTracks();
            const isManualMusic = this.stateManager.audioManager.isManualMusicSelection;
            
            // If a player manually selected music from the library, keep playing it
            if (isManualMusic) {
                // Leave it as is - don't change tracks
            }
            // If settlement music is already playing, keep it
            else if (settlementTracks.includes(currentTrack)) {
                // Leave it as is - don't restart
            }
            // Otherwise, start new settlement music
            else {
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
            // Account for CSS scaling
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

    /**
     * Handle campaign selection and start
     */
    startCampaign() {
        if (this.selectedCampaignId) {
            // Play open campaign SFX
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.playSFX('open-campaign');
            }
            // Transition to campaign gameplay will happen next
            this.stateManager.selectedCampaignId = this.selectedCampaignId;
            this.stateManager.changeState('game');
        }
    }
    
    getCampaignSlotPosition(index) {
        const { leftPadding, topPadding, campaignTileWidth, campaignTileHeight, campaignGapX, campaignGapY, campaignCols } = this.layout;
        
        const row = Math.floor(index / campaignCols);
        const col = index % campaignCols;
        
        return {
            x: leftPadding + col * (campaignTileWidth + campaignGapX),
            y: topPadding + row * (campaignTileHeight + campaignGapY),
            width: campaignTileWidth,
            height: campaignTileHeight
        };
    }
    
    getInfoPanelBounds() {
        const canvas = this.stateManager.canvas;
        const { leftPadding, topPadding, infoPanelRightMargin, bottomPadding, campaignTileWidth, campaignGapX, campaignCols } = this.layout;
        
        // Info panel starts after campaigns on the left
        const panelX = leftPadding + campaignCols * campaignTileWidth + (campaignCols - 1) * campaignGapX + 60;
        const panelWidth = canvas.width - panelX - infoPanelRightMargin;
        const panelHeight = canvas.height - topPadding - bottomPadding; // Full height with margins
        
        return {
            x: panelX,
            y: topPadding,
            width: panelWidth,
            height: panelHeight
        };
    }
    
    getStartButtonBounds() {
        const panel = this.getInfoPanelBounds();
        const buttonHeight = 50;
        const buttonWidth = panel.width - 40;
        
        return {
            x: panel.x + 20,
            y: panel.y + panel.height - buttonHeight - 20,
            width: buttonWidth,
            height: buttonHeight
        };
    }
    
    getExitButtonBounds() {
        return {
            x: this.stateManager.canvas.width - 140,
            y: 30,
            width: 110,
            height: 44
        };
    }
    
    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        // Account for CSS scaling
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        this.hoveredCampaignId = null;
        this.hoveredExitButton = false;
        this.hoveredStartButton = false;
        
        // Check exit button
        const exitBtn = this.getExitButtonBounds();
        if (x >= exitBtn.x && x <= exitBtn.x + exitBtn.width &&
            y >= exitBtn.y && y <= exitBtn.y + exitBtn.height) {
            this.hoveredExitButton = true;
        }
        
        // Check start button
        const startBtn = this.getStartButtonBounds();
        if (this.selectedCampaignId && 
            x >= startBtn.x && x <= startBtn.x + startBtn.width &&
            y >= startBtn.y && y <= startBtn.y + startBtn.height) {
            const selectedCampaign = CampaignRegistry.getCampaign(this.selectedCampaignId);
            if (selectedCampaign && !selectedCampaign.locked) {
                this.hoveredStartButton = true;
            }
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
            (this.hoveredCampaignId && !CampaignRegistry.getCampaign(this.hoveredCampaignId)?.locked) || 
            this.hoveredExitButton || 
            this.hoveredStartButton ? 'pointer' : 'default';
    }
    
    handleClick(x, y) {
        // Check exit button
        const exitBtn = this.getExitButtonBounds();
        if (x >= exitBtn.x && x <= exitBtn.x + exitBtn.width &&
            y >= exitBtn.y && y <= exitBtn.y + exitBtn.height) {
            // Play button click SFX
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.playSFX('button-click');
            }
            this.stateManager.changeState('settlementHub');
            return;
        }
        
        // Check start button
        const startBtn = this.getStartButtonBounds();
        if (this.selectedCampaignId && 
            x >= startBtn.x && x <= startBtn.x + startBtn.width &&
            y >= startBtn.y && y <= startBtn.y + startBtn.height) {
            const selectedCampaign = CampaignRegistry.getCampaign(this.selectedCampaignId);
            if (selectedCampaign && !selectedCampaign.locked && selectedCampaign.class) {
                // Play open campaign SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('open-campaign');
                }
                const campaignState = new selectedCampaign.class(this.stateManager);
                this.stateManager.addState('levelSelect', campaignState);
                this.stateManager.changeState('levelSelect');
            }
            return;
        }
        
        // Check campaign clicks
        this.campaigns.forEach((campaign, index) => {
            const pos = this.getCampaignSlotPosition(index);
            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height &&
                !campaign.locked) {
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }
                // Select campaign to show info panel
                this.selectedCampaignId = campaign.id;
                this.infoPanelOpen = true;
            }
        });
    }
    
    render(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Reset canvas shadow properties to prevent persistent glow effects
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.globalAlpha = 1;
        
        // Background
        this.renderBackground(ctx, canvas);
        
        // Title
        ctx.font = 'bold 52px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d4af37';
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.textBaseline = 'top';
        ctx.fillText('CAMPAIGNS', canvas.width / 2, 50);
        ctx.strokeText('CAMPAIGNS', canvas.width / 2, 50);
        
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
        let shadowOpacity = 0.4;
        
        if (isLocked) {
            bgColor = '#0f0f0f';
            borderColor = '#333';
            borderWidth = 1;
            shadowOpacity = 0.2;
        } else if (isSelected) {
            bgColor = '#3a2a1a';
            borderColor = '#ffd700';
            borderWidth = 3;
            shadowOpacity = 0.6;
        } else if (isHovered) {
            bgColor = '#2a1a0a';
            borderColor = '#d4af37';
            borderWidth = 2.5;
            shadowOpacity = 0.5;
        }
        
        // Shadow
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
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
            ctx.fillStyle = '#555';
            ctx.fillText('🔒', pos.x + pos.width / 2, pos.y + pos.height / 2 - 30);
            
            ctx.font = '16px serif';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Locked', pos.x + pos.width / 2, pos.y + pos.height / 2 + 20);
        } else {
            // Campaign icon and name
            ctx.font = '32px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(campaign.icon, pos.x + pos.width / 2, pos.y + 15);
            
            // Campaign name
            ctx.font = 'bold 16px serif';
            ctx.fillStyle = isSelected ? '#ffd700' : '#d4af37';
            ctx.textBaseline = 'top';
            ctx.fillText(campaign.name, pos.x + pos.width / 2, pos.y + 55);
            
            // Difficulty
            ctx.font = '12px serif';
            const diffColor = campaign.difficulty === 'Beginner' ? '#4CAF50' : 
                            campaign.difficulty === 'Intermediate' ? '#FFC107' : 
                            campaign.difficulty === 'Advanced' ? '#F44336' : 
                            campaign.difficulty === 'Expert' ? '#9C27B0' : '#E91E63';
            ctx.fillStyle = diffColor;
            ctx.textAlign = 'center';
            ctx.fillText(`● ${campaign.difficulty}`, pos.x + pos.width / 2, pos.y + 75);
            
            // Progress bar
            const barWidth = pos.width - 30;
            const barHeight = 10;
            const barX = pos.x + 15;
            const barY = pos.y + pos.height - 35;
            
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
            ctx.font = 'bold 11px serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${Math.floor(campaign.progress)}%`, barX + barWidth / 2, barY + barHeight / 2);
        }
    }
    
    renderInfoPanel(ctx, campaign, opacity) {
        const panel = this.getInfoPanelBounds();
        const startBtn = this.getStartButtonBounds();
        
        // Save context alpha
        const globalAlpha = ctx.globalAlpha;
        ctx.globalAlpha = opacity;
        
        // Background panel with gradient
        const gradient = ctx.createLinearGradient(0, panel.y, 0, panel.y + panel.height);
        gradient.addColorStop(0, 'rgba(26, 15, 5, 0.98)');
        gradient.addColorStop(1, 'rgba(15, 10, 5, 0.98)');
        ctx.fillStyle = gradient;
        ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
        
        // Outer border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(panel.x, panel.y, panel.width, panel.height);
        
        // Inner decorative border
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(panel.x + 2, panel.y + 2, panel.width - 4, panel.height - 4);
        
        const contentX = panel.x + 25;
        const contentY = panel.y + 25;
        const contentWidth = panel.width - 50;
        const maxContentY = startBtn.y - 20; // Leave space for start button
        
        let currentY = contentY;
        
        // Campaign icon and name header
        ctx.font = 'bold 24px serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#d4af37';
        ctx.textBaseline = 'top';
        ctx.fillText(campaign.icon, contentX, currentY);
        
        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(campaign.name, contentX + 45, currentY + 2);
        currentY += 50;
        
        // Difficulty and progress on same line
        ctx.font = '12px serif';
        const diffColor = campaign.difficulty === 'Beginner' ? '#4CAF50' : 
                        campaign.difficulty === 'Intermediate' ? '#FFC107' : 
                        campaign.difficulty === 'Advanced' ? '#F44336' : 
                        campaign.difficulty === 'Expert' ? '#9C27B0' : '#E91E63';
        ctx.fillStyle = diffColor;
        const diffText = `Difficulty: ${campaign.difficulty}`;
        ctx.fillText(diffText, contentX, currentY);
        
        // Progress bar below difficulty
        currentY += 25;
        const barWidth = contentWidth;
        const barHeight = 10;
        const barX = contentX;
        const barY = currentY;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
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
        ctx.font = 'bold 11px serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.floor(campaign.progress)}% Complete`, barX + barWidth / 2, barY + barHeight / 2);
        currentY += 25;
        
        // Separator line
        currentY += 10;
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(contentX, currentY);
        ctx.lineTo(contentX + contentWidth, currentY);
        ctx.stroke();
        currentY += 15;
        
        // Story/Description
        ctx.font = '12px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Story', contentX, currentY);
        currentY += 18;
        
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
        lineY += 18;
        
        if (lineY >= maxContentY - 80) {
            // Skip section if not enough space
            ctx.globalAlpha = globalAlpha;
            this.renderStartButton(ctx, campaign);
            return;
        }
        
        // Separator line
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(contentX, lineY);
        ctx.lineTo(contentX + contentWidth, lineY);
        ctx.stroke();
        lineY += 15;
        
        // Rewards section
        ctx.font = 'bold 12px serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('Rewards', contentX, lineY);
        lineY += 18;
        
        ctx.font = '11px serif';
        ctx.fillStyle = '#c9a876';
        ctx.fillText(`Gold: ${campaign.rewards.gold}`, contentX + 15, lineY);
        lineY += 14;
        
        ctx.fillText(`Experience: ${campaign.rewards.experience}`, contentX + 15, lineY);
        lineY += 14;
        
        if (campaign.rewards.unlocks.length > 0) {
            ctx.fillStyle = '#a8ff5e';
            campaign.rewards.unlocks.forEach(unlock => {
                ctx.fillText(`✦ ${unlock}`, contentX + 15, lineY);
                lineY += 14;
            });
        }
        
        // Restore context alpha
        ctx.globalAlpha = globalAlpha;
        
        // Render start button at the bottom
        this.renderStartButton(ctx, campaign);
    }
    
    renderStartButton(ctx, campaign) {
        const btn = this.getStartButtonBounds();
        const isHovered = this.hoveredStartButton;
        const isLocked = campaign.locked;
        
        if (isLocked) {
            // Disabled state
            const gradient = ctx.createLinearGradient(btn.y, btn.y + btn.height, 0, 0);
            gradient.addColorStop(0, '#3a3a3a');
            gradient.addColorStop(0.5, '#4a4a4a');
            gradient.addColorStop(1, '#3a3a3a');
            ctx.fillStyle = gradient;
            ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
            
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
            
            ctx.font = 'bold 16px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#666';
            ctx.fillText('LOCKED', btn.x + btn.width / 2, btn.y + btn.height / 2);
        } else {
            // Enabled state
            const gradient = ctx.createLinearGradient(btn.y, btn.y + btn.height, 0, 0);
            if (isHovered) {
                gradient.addColorStop(0, '#d4af37');
                gradient.addColorStop(0.5, '#e8c547');
                gradient.addColorStop(1, '#d4af37');
            } else {
                gradient.addColorStop(0, '#8b7355');
                gradient.addColorStop(0.5, '#a89968');
                gradient.addColorStop(1, '#9a8960');
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
            
            // Inner shadow
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(btn.x, btn.y, btn.width, 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(btn.x, btn.y + btn.height - 3, btn.width, 3);
            
            // Border
            ctx.strokeStyle = isHovered ? '#ffe700' : '#d4af37';
            ctx.lineWidth = isHovered ? 2.5 : 2;
            ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
            
            // Text
            ctx.font = 'bold 18px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillText('START CAMPAIGN', btn.x + btn.width / 2 + 1, btn.y + btn.height / 2 + 1);
            ctx.fillStyle = isHovered ? '#000000' : '#1a0f05';
            ctx.fillText('START CAMPAIGN', btn.x + btn.width / 2, btn.y + btn.height / 2);
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
        // Animation updates if needed
    }
}
