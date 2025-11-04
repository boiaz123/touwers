export class LevelSelect {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.levels = [
            { name: 'The King\'s Road', difficulty: 'Easy', unlocked: true },
            { name: 'Goblin Valley', difficulty: 'Medium', unlocked: false },
            { name: 'Dragon\'s Lair', difficulty: 'Hard', unlocked: false }
        ];
        this.selectedLevel = 0;
        this.hoveredLevel = -1;
        this.hoveredStartButton = false;
    }
    
    enter() {
        // Hide game UI
        document.getElementById('ui').style.display = 'none';
        this.setupMouseListeners();
    }
    
    exit() {
        // Show game UI
        document.getElementById('ui').style.display = 'flex';
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
                
                // Check if hovering over start button for selected level
                if (index === this.selectedLevel) {
                    const buttonX = cardX + cardWidth / 2 - 50; // Center the 100px wide button
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
        
        // Update cursor style
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
        ctx.fillText('Select Your Quest', canvas.width / 2, 100);
        ctx.strokeText('Select Your Quest', canvas.width / 2, 100);
        
        // Level cards
        const cardWidth = 300;
        const cardHeight = 150;
        const startY = 200;
        const spacing = 180;
        
        this.levels.forEach((level, index) => {
            const x = canvas.width / 2 - cardWidth / 2;
            const y = startY + index * spacing;
            
            // Card background with hover effect
            let cardColor = '#2a1a0f';
            let borderColor = '#d4af37';
            
            if (level.unlocked) {
                if (index === this.selectedLevel) {
                    cardColor = '#3a2a1f';
                } else if (index === this.hoveredLevel) {
                    cardColor = '#352217';
                }
            } else {
                cardColor = '#1a1a1a';
                borderColor = '#666';
            }
            
            ctx.fillStyle = cardColor;
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = level.unlocked && index === this.hoveredLevel ? 3 : 2;
            ctx.fillRect(x, y, cardWidth, cardHeight);
            ctx.strokeRect(x, y, cardWidth, cardHeight);
            
            if (level.unlocked) {
                // Level name
                ctx.textAlign = 'center';
                ctx.font = 'bold 24px serif';
                ctx.fillStyle = '#d4af37';
                ctx.fillText(level.name, x + cardWidth / 2, y + 50);
                
                // Difficulty
                ctx.font = '18px serif';
                ctx.fillStyle = level.difficulty === 'Easy' ? '#4CAF50' : 
                              level.difficulty === 'Medium' ? '#FFC107' : '#F44336';
                ctx.fillText(level.difficulty, x + cardWidth / 2, y + 80);
                
                // Start button for selected level
                if (index === this.selectedLevel) {
                    const buttonX = x + cardWidth / 2 - 50; // Center the button
                    const buttonY = y + 100;
                    const buttonWidth = 100;
                    const buttonHeight = 30;
                    
                    // Button background with hover effect
                    ctx.fillStyle = this.hoveredStartButton ? '#45a049' : '#4CAF50';
                    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
                    
                    // Button border
                    ctx.strokeStyle = this.hoveredStartButton ? '#d4af37' : '#2E7D32';
                    ctx.lineWidth = this.hoveredStartButton ? 2 : 1;
                    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
                    
                    // Button text
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
        ctx.fillText('Click on a level to select, then click START', canvas.width / 2, canvas.height - 50);
    }
    
    handleClick(x, y) {
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
                    // Check start button area with corrected positioning
                    const buttonX = cardX + cardWidth / 2 - 50; // Center the button
                    const buttonY = cardY + 100;
                    const buttonWidth = 100;
                    const buttonHeight = 30;
                    
                    if (x >= buttonX && x <= buttonX + buttonWidth && 
                        y >= buttonY && y <= buttonY + buttonHeight) {
                        this.stateManager.changeState('game');
                    }
                } else {
                    this.selectedLevel = index;
                }
            }
        });
    }
}
