export class LevelSelect {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.levels = [
            { name: 'The King\'s Road', difficulty: 'Easy', unlocked: true },
            { name: 'Goblin Valley', difficulty: 'Medium', unlocked: false },
            { name: 'Dragon\'s Lair', difficulty: 'Hard', unlocked: false },
            { name: 'TEST LEVEL', difficulty: 'Sandbox', unlocked: true, isTest: true }
        ];
        this.selectedLevel = 0;
        this.hoveredLevel = -1;
        this.hoveredStartButton = false;
        console.log('LevelSelect: constructor completed');
    }
    
    enter() {
        console.log('LevelSelect: enter called');
        
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
        
        this.setupMouseListeners();
    }
    
    exit() {
        console.log('LevelSelect: exit called');
        this.removeMouseListeners();
    }
    
    setupMouseListeners() {
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    }
    
    removeMouseListeners() {
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        }
    }
    
    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const cardWidth = 300;
        const cardHeight = 150;
        const startY = 200;
        const spacing = 180;
        const cardX = this.stateManager.canvas.width / 2 - cardWidth / 2;
        
        this.hoveredLevel = -1;
        this.hoveredStartButton = false;
        
        this.levels.forEach((level, index) => {
            const cardY = startY + index * spacing;
            
            if (level.unlocked && 
                x >= cardX && x <= cardX + cardWidth && 
                y >= cardY && y <= cardY + cardHeight) {
                
                this.hoveredLevel = index;
                
                if (index === this.selectedLevel) {
                    const buttonX = cardX + cardWidth / 2 - 50;
                    const buttonY = cardY + 100;
                    const buttonWidth = 100;
                    const buttonHeight = 30;
                    
                    if (x >= buttonX && x <= buttonX + buttonWidth && 
                        y >= buttonY && y <= buttonY + buttonHeight) {
                        this.hoveredStartButton = true;
                    }
                }
            }
        });
    }
    
    update(deltaTime) {
        // Nothing to update for level select
    }
    
    render(ctx) {
        const canvas = ctx.canvas;
        const width = canvas.width || window.innerWidth;
        const height = canvas.height || window.innerHeight;
        
        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#2a1a0f');
        gradient.addColorStop(1, '#1a0f0a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Title
        ctx.textAlign = 'center';
        ctx.font = 'bold 48px serif';
        ctx.fillStyle = '#d4af37';
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.fillText('Select Your Quest', width / 2, 100);
        ctx.strokeText('Select Your Quest', width / 2, 100);
        
        // Level cards
        const cardWidth = 300;
        const cardHeight = 150;
        const startY = 200;
        const spacing = 180;
        
        this.levels.forEach((level, index) => {
            const x = width / 2 - cardWidth / 2;
            const y = startY + index * spacing;
            
            // Card background
            let cardColor = '#2a1a0f';
            let borderColor = '#d4af37';
            
            if (level.unlocked) {
                if (index === this.selectedLevel) {
                    cardColor = level.isTest ? '#1f2a3a' : '#3a2a1f';
                } else if (index === this.hoveredLevel) {
                    cardColor = level.isTest ? '#172535' : '#352217';
                }
                
                if (level.isTest) {
                    borderColor = '#00ffff';
                }
            } else {
                cardColor = '#1a1a1a';
                borderColor = '#666';
            }
            
            ctx.fillStyle = cardColor;
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.fillRect(x, y, cardWidth, cardHeight);
            ctx.strokeRect(x, y, cardWidth, cardHeight);
            
            if (level.unlocked) {
                // Level name
                ctx.textAlign = 'center';
                ctx.font = 'bold 24px serif';
                ctx.fillStyle = level.isTest ? '#00ffff' : '#d4af37';
                ctx.fillText(level.name, x + cardWidth / 2, y + 50);
                
                // Difficulty
                ctx.font = '18px serif';
                let difficultyColor = '#4CAF50';
                if (level.isTest) {
                    difficultyColor = '#ff00ff';
                } else if (level.difficulty === 'Medium') {
                    difficultyColor = '#FFC107';
                } else if (level.difficulty === 'Hard') {
                    difficultyColor = '#F44336';
                }
                ctx.fillStyle = difficultyColor;
                ctx.fillText(level.difficulty, x + cardWidth / 2, y + 80);
                
                // Test level description
                if (level.isTest) {
                    ctx.font = '12px serif';
                    ctx.fillStyle = '#cccccc';
                    ctx.fillText('∞ Gold • ∞ Lives • Endless Enemies', x + cardWidth / 2, y + 95);
                }
                
                // Start button for selected level
                if (index === this.selectedLevel) {
                    const buttonX = x + cardWidth / 2 - 50;
                    const buttonY = y + 100;
                    const buttonWidth = 100;
                    const buttonHeight = 30;
                    
                    ctx.fillStyle = this.hoveredStartButton ? '#45a049' : '#4CAF50';
                    if (level.isTest) {
                        ctx.fillStyle = this.hoveredStartButton ? '#ff4499' : '#ff00aa';
                    }
                    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
                    
                    ctx.strokeStyle = this.hoveredStartButton ? '#d4af37' : '#2E7D32';
                    if (level.isTest) {
                        ctx.strokeStyle = this.hoveredStartButton ? '#00ffff' : '#aa0055';
                    }
                    ctx.lineWidth = 2;
                    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
                    
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 16px serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('START', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 6);
                }
            } else {
                // Locked indicator
                ctx.textAlign = 'center';
                ctx.font = 'bold 24px serif';
                ctx.fillStyle = '#666';
                ctx.fillText('🔒 LOCKED', x + cardWidth / 2, y + cardHeight / 2 + 8);
            }
        });
        
        // Instructions
        ctx.textAlign = 'center';
        ctx.font = '16px serif';
        ctx.fillStyle = '#c9a876';
        ctx.fillText('Click on a level to select, then click START', width / 2, height - 50);
    }
    
    handleClick(x, y) {
        console.log('LevelSelect: Click detected at', x, y);
        
        const cardWidth = 300;
        const cardHeight = 150;
        const startY = 200;
        const spacing = 180;
        const cardX = this.stateManager.canvas.width / 2 - cardWidth / 2;
        
        this.levels.forEach((level, index) => {
            const cardY = startY + index * spacing;
            
            if (level.unlocked && 
                x >= cardX && x <= cardX + cardWidth && 
                y >= cardY && y <= cardY + cardHeight) {
                
                if (index === this.selectedLevel) {
                    // Check start button
                    const buttonX = cardX + cardWidth / 2 - 50;
                    const buttonY = cardY + 100;
                    const buttonWidth = 100;
                    const buttonHeight = 30;
                    
                    if (x >= buttonX && x <= buttonX + buttonWidth && 
                        y >= buttonY && y <= buttonY + buttonHeight) {
                        console.log('LevelSelect: Starting level', level.name);
                        this.stateManager.selectedLevelInfo = level;
                        this.stateManager.changeState('game');
                    }
                } else {
                    console.log('LevelSelect: Selected level', index);
                    this.selectedLevel = index;
                }
            }
        });
    }
}
