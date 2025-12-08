import { LevelFactory } from '../../game/LevelFactory.js';
import { SaveSystem } from '../SaveSystem.js';

export class LevelSelect {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.selectedLevel = null;
        this.hoveredLevel = -1;
        this.hoveredStartButton = false;
        
        // Button hover states
        this.hoveredButton = null;
        
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

        // Button configuration (bottom right)
        this.buttons = [
            { label: 'SAVE', action: 'save', width: 90, height: 40 },
            { label: 'OPTIONS', action: 'options', width: 90, height: 40 },
            { label: 'MENU', action: 'menu', width: 90, height: 40 }
        ];
        this.buttonGap = 10;
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
        
        // Reload levels with current save data
        const saveData = this.stateManager.currentSaveData;
        this.levels = LevelFactory.getLevelList(saveData);
        
        // Select first unlocked level by default
        this.selectedLevel = this.levels.findIndex(l => l.unlocked);
        if (this.selectedLevel === -1) this.selectedLevel = 0;
        
        this.hoveredButton = null;
        
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

    getButtonPosition(index) {
        const canvas = this.stateManager.canvas;
        const button = this.buttons[index];
        const totalWidth = this.buttons.reduce((sum, b) => sum + b.width, 0) + 
                          (this.buttons.length - 1) * this.buttonGap;
        const startX = canvas.width - totalWidth - 20;
        let currentX = startX;

        for (let i = 0; i < index; i++) {
            currentX += this.buttons[i].width + this.buttonGap;
        }

        return {
            x: currentX,
            y: canvas.height - 60,
            width: button.width,
            height: button.height
        };
    }
    
    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.hoveredLevel = -1;
        this.hoveredStartButton = false;
        this.hoveredButton = null;
        
        // Check level cards
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

        // Check buttons
        this.buttons.forEach((button, index) => {
            const pos = this.getButtonPosition(index);
            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {
                this.hoveredButton = button.action;
            }
        });
        
        this.stateManager.canvas.style.cursor = 
            (this.hoveredLevel !== -1 || this.hoveredStartButton || this.hoveredButton) ? 'pointer' : 'default';
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

        // Render buttons
        this.buttons.forEach((button, index) => {
            this.renderButton(ctx, button, index);
        });
        
        // Instructions
        ctx.textAlign = 'center';
        ctx.font = '14px serif';
        ctx.fillStyle = '#c9a876';
        ctx.fillText('Click to select, then START', canvas.width / 2, canvas.height - 30);
    }

    update(deltaTime) {
        // No dynamic updates needed for level select
    }

    renderButton(ctx, button, index) {
        const pos = this.getButtonPosition(index);
        const isHovered = this.hoveredButton === button.action;

        // Button background
        ctx.fillStyle = isHovered ? '#66BB6A' : '#4CAF50';
        ctx.fillRect(pos.x, pos.y, pos.width, pos.height);

        // Button border
        ctx.strokeStyle = isHovered ? '#d4af37' : '#2E7D32';
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

        // Button text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px serif';
        ctx.textAlign = 'center';
        ctx.fillText(button.label, pos.x + pos.width / 2, pos.y + pos.height / 2 + 4);
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
        // Check button clicks first
        this.buttons.forEach((button, index) => {
            const pos = this.getButtonPosition(index);

            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {

                console.log(`LevelSelect: Button clicked - ${button.action}`);

                switch (button.action) {
                    case 'save':
                        this.saveGame();
                        break;
                    case 'options':
                        this.stateManager.previousState = 'levelSelect';
                        this.stateManager.changeState('options');
                        break;
                    case 'menu':
                        this.stateManager.currentSaveData = null;
                        this.stateManager.changeState('mainMenu');
                        break;
                }
                return;
            }
        });

        // Check level card clicks
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

    saveGame() {
        if (this.stateManager.currentSaveSlot) {
            const saveData = {
                lastPlayedLevel: this.stateManager.selectedLevelInfo?.id || 'level1',
                unlockedLevels: this.stateManager.currentSaveData?.unlockedLevels || ['level1'],
                completedLevels: this.stateManager.currentSaveData?.completedLevels || []
            };

            SaveSystem.saveGame(this.stateManager.currentSaveSlot, saveData);
            this.stateManager.currentSaveData = saveData;
            console.log('Game saved to slot', this.stateManager.currentSaveSlot);
        }
    }
}
