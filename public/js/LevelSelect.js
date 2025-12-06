import { LevelFactory } from './LevelFactory.js';

export class LevelSelect {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.levels = LevelFactory.getLevelList();
        this.selectedLevel = null;
        this.hoveredLevel = -1;
        this.hoveredStartButton = false;
        
        // Grid layout configuration
        this.gridConfig = {
            cols: 3,
            cardWidth: 200,
            cardHeight: 200,
            paddingX: 40,
            paddingY: 120,
            gapX: 30,
            gapY: 40
        };
    }
    
    enter() {
        // Hide game UI when in level select
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        
        if (statsBar) {
            statsBar.style.display = 'none';
            console.log('LevelSelect: Stats bar hidden');
        }
        if (sidebar) {
            sidebar.style.display = 'none';
            console.log('LevelSelect: Sidebar hidden');
        }
        
        // Select first unlocked level by default
        this.selectedLevel = this.levels.findIndex(l => l.unlocked);
        if (this.selectedLevel === -1) this.selectedLevel = 0;
        
        this.setupMouseListeners();
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
    
    getCardPosition(index) {
        const { cols, cardWidth, cardHeight, paddingX, paddingY, gapX, gapY } = this.gridConfig;
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        return {
            x: paddingX + col * (cardWidth + gapX),
            y: paddingY + row * (cardHeight + gapY),
            width: cardWidth,
            height: cardHeight
        };
    }
    
    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.hoveredLevel = -1;
        this.hoveredStartButton = false;
        
        this.levels.forEach((level, index) => {
            const pos = this.getCardPosition(index);
            
            if (x >= pos.x && x <= pos.x + pos.width && 
                y >= pos.y && y <= pos.y + pos.height) {
                
                this.hoveredLevel = index;
                
                // Check if hovering over start button
                if (index === this.selectedLevel && level.unlocked) {
                    const buttonX = pos.x + pos.width / 2 - 40;
                    const buttonY = pos.y + pos.height - 50;
                    const buttonWidth = 80;
                    const buttonHeight = 30;
                    
                    if (x >= buttonX && x <= buttonX + buttonWidth && 
                        y >= buttonY && y <= buttonY + buttonHeight) {
                        this.hoveredStartButton = true;
                    }
                }
            }
        });
        
        this.stateManager.canvas.style.cursor = 
            (this.hoveredLevel !== -1 || this.hoveredStartButton) ? 'pointer' : 'default';
    }
    
    render(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#2a1a0f');
        gradient.addColorStop(1, '#1a0f0a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Title
        ctx.textAlign = 'center';
        ctx.font = 'bold 48px serif';
        ctx.fillStyle = '#d4af37';
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.fillText('Select Your Quest', canvas.width / 2, 60);
        ctx.strokeText('Select Your Quest', canvas.width / 2, 60);
        
        // Render level cards in grid
        this.levels.forEach((level, index) => {
            this.renderLevelCard(ctx, level, index);
        });
        
        // Instructions
        ctx.textAlign = 'center';
        ctx.font = '14px serif';
        ctx.fillStyle = '#c9a876';
        ctx.fillText('Click to select, then START', canvas.width / 2, canvas.height - 30);
    }
    
    renderLevelCard(ctx, level, index) {
        const pos = this.getCardPosition(index);
        const isSelected = index === this.selectedLevel;
        const isHovered = index === this.hoveredLevel;
        
        // Card background
        let cardColor = '#1a0f05';
        let borderColor = '#664422';
        let borderWidth = 2;
        
        if (!level.unlocked) {
            cardColor = '#0f0f0f';
            borderColor = '#333';
        } else {
            if (isSelected) {
                cardColor = '#3a2a1a';
                borderColor = '#d4af37';
                borderWidth = 3;
            } else if (isHovered) {
                cardColor = '#2a1a0a';
                borderColor = '#a88555';
                borderWidth = 2.5;
            }
        }
        
        ctx.fillStyle = cardColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.fillRect(pos.x, pos.y, pos.width, pos.height);
        ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);
        
        if (level.unlocked) {
            // Level icon/number
            ctx.textAlign = 'center';
            ctx.font = 'bold 32px serif';
            ctx.fillStyle = '#d4af37';
            ctx.fillText(level.id === 'sandbox' ? '🏜️' : `${level.id.replace('level', '')}`, 
                         pos.x + pos.width / 2, pos.y + 45);
            
            // Level name
            ctx.font = 'bold 16px serif';
            ctx.fillStyle = '#d4af37';
            ctx.fillText(level.name, pos.x + pos.width / 2, pos.y + 85);
            
            // Difficulty badge
            ctx.font = 'bold 12px serif';
            const diffColor = level.difficulty === 'Easy' ? '#4CAF50' : 
                            level.difficulty === 'Medium' ? '#FFC107' : 
                            level.difficulty === 'Hard' ? '#F44336' : '#9C27B0';
            ctx.fillStyle = diffColor;
            ctx.fillText(`● ${level.difficulty}`, pos.x + pos.width / 2, pos.y + 108);
            
            // Start button for selected level
            if (isSelected) {
                const buttonX = pos.x + pos.width / 2 - 40;
                const buttonY = pos.y + pos.height - 50;
                const buttonWidth = 80;
                const buttonHeight = 30;
                
                ctx.fillStyle = this.hoveredStartButton ? '#66BB6A' : '#4CAF50';
                ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
                
                ctx.strokeStyle = this.hoveredStartButton ? '#d4af37' : '#2E7D32';
                ctx.lineWidth = this.hoveredStartButton ? 2 : 1;
                ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
                
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px serif';
                ctx.textAlign = 'center';
                ctx.fillText('START', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
            }
        } else {
            // Locked indicator
            ctx.textAlign = 'center';
            ctx.font = 'bold 24px serif';
            ctx.fillStyle = '#666';
            ctx.fillText('🔒', pos.x + pos.width / 2, pos.y + pos.height / 2);
            
            ctx.font = '12px serif';
            ctx.fillText('LOCKED', pos.x + pos.width / 2, pos.y + pos.height / 2 + 30);
        }
    }
    
    handleClick(x, y) {
        this.levels.forEach((level, index) => {
            const pos = this.getCardPosition(index);
            
            if (x >= pos.x && x <= pos.x + pos.width && 
                y >= pos.y && y <= pos.y + pos.height && 
                level.unlocked) {
                
                if (index === this.selectedLevel) {
                    // Check start button click
                    const buttonX = pos.x + pos.width / 2 - 40;
                    const buttonY = pos.y + pos.height - 50;
                    const buttonWidth = 80;
                    const buttonHeight = 30;
                    
                    if (x >= buttonX && x <= buttonX + buttonWidth && 
                        y >= buttonY && y <= buttonY + buttonHeight) {
                        this.stateManager.selectedLevelInfo = this.levels[this.selectedLevel];
                        this.stateManager.changeState('game');
                    }
                } else {
                    // Select different level
                    this.selectedLevel = index;
                }
            }
        });
    }
}
