export class LevelSelect {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.levels = [
            { name: 'The King\'s Road', difficulty: 'Easy', unlocked: true },
            { name: 'Goblin Valley', difficulty: 'Medium', unlocked: false },
            { name: 'Dragon\'s Lair', difficulty: 'Hard', unlocked: false }
        ];
        this.selectedLevel = 0;
    }
    
    enter() {
        // Hide game UI
        document.getElementById('ui').style.display = 'none';
    }
    
    exit() {
        // Show game UI
        document.getElementById('ui').style.display = 'flex';
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
            
            // Card background
            ctx.fillStyle = level.unlocked ? 
                (index === this.selectedLevel ? '#3a2a1f' : '#2a1a0f') : 
                '#1a1a1a';
            ctx.strokeStyle = level.unlocked ? '#d4af37' : '#666';
            ctx.lineWidth = 2;
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
                
                // Start button
                if (index === this.selectedLevel) {
                    ctx.fillStyle = '#4CAF50';
                    ctx.fillRect(x + 100, y + 100, 100, 30);
                    ctx.fillStyle = '#fff';
                    ctx.font = '16px serif';
                    ctx.fillText('START', x + cardWidth / 2, y + 120);
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
                    // Start button area
                    if (x >= cardX + 100 && x <= cardX + 200 && 
                        y >= cardY + 100 && y <= cardY + 130) {
                        this.stateManager.changeState('game');
                    }
                } else {
                    this.selectedLevel = index;
                }
            }
        });
    }
}
