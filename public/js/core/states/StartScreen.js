import { ParticleSystem } from '../ParticleSystem.js';

export class StartScreen {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.showContinue = false;
        this.titleOpacity = 0;
        this.subtitleOpacity = 0;
        this.continueOpacity = 0;
        this.particleSystem = null;
    }
    
    enter() {
        
        // Ensure game UI is hidden when in start screen
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        
        if (statsBar) {
            statsBar.style.display = 'none';
        }
        
        if (sidebar) {
            sidebar.style.display = 'none';
        }
        
        // Reset animation state
        this.animationTime = 0;
        this.showContinue = false;
        this.titleOpacity = 0;
        this.subtitleOpacity = 0;
        this.continueOpacity = 0;
        
        // Get or initialize shared particle system
        if (this.stateManager.canvas && this.stateManager.canvas.width > 0 && this.stateManager.canvas.height > 0) {
            this.particleSystem = ParticleSystem.getInstance(this.stateManager.canvas.width, this.stateManager.canvas.height);
        }
        
        // Play menu theme music
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playMusic('menu-theme');
        }
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Title (TOUWERS) fade in - starts immediately
        if (this.animationTime > 0.3) {
            this.titleOpacity = Math.min(1, (this.animationTime - 0.3) / 0.8);
        }
        
        // Subtitle (Defend the Realm) fade in - after title is visible
        if (this.animationTime > 1.3) {
            this.subtitleOpacity = Math.min(1, (this.animationTime - 1.3) / 0.8);
        }
        
        // Show continue button - after subtitle is visible
        if (this.animationTime > 2.3) {
            this.showContinue = true;
            this.continueOpacity = Math.min(1, (this.animationTime - 2.3) / 0.8);
        }
        
        // Update shared particle system
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
        }
    }
    
    render(ctx) {
        try {
            const canvas = this.stateManager.canvas;
            
            // Always render background, even if canvas isn't fully ready
            if (!canvas || !canvas.width || !canvas.height) {
                // Fallback rendering for uninitialized canvas
                ctx.fillStyle = '#1a0f0a';
                ctx.fillRect(0, 0, 800, 600); // Default size
                console.warn('StartScreen: Canvas not ready, using fallback rendering');
                return;
            }
            
            // Dark medieval background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a0f0a');
            gradient.addColorStop(1, '#0a0505');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Render particles from shared system
            if (this.particleSystem) {
                this.particleSystem.render(ctx);
            }
            
            // Title rendering
            ctx.globalAlpha = Math.max(0.1, this.titleOpacity); // Ensure some visibility initially
            ctx.textAlign = 'center';
            
            // Title shadow
            ctx.fillStyle = '#000';
            ctx.font = 'bold 80px serif';
            ctx.fillText('TOUWERS', canvas.width / 2 + 3, canvas.height / 2 - 50 + 3);
            
            // Title main
            ctx.fillStyle = '#d4af37';
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 2;
            ctx.fillText('TOUWERS', canvas.width / 2, canvas.height / 2 - 50);
            ctx.strokeText('TOUWERS', canvas.width / 2, canvas.height / 2 - 50);
            
            // Subtitle
            ctx.globalAlpha = this.subtitleOpacity;
            ctx.font = 'italic 24px serif';
            ctx.fillStyle = '#c9a876';
            ctx.fillText('Defend the Realm', canvas.width / 2, canvas.height / 2 + 20);
            
            // Continue message
            if (this.showContinue) {
                const flickerAlpha = this.continueOpacity * (0.5 + 0.5 * Math.sin(this.animationTime * 3));
                ctx.globalAlpha = flickerAlpha;
                ctx.font = '20px serif';
                ctx.fillStyle = '#fff';
                ctx.fillText('Press to Continue', canvas.width / 2, canvas.height / 2 + 120);
            }
            
            ctx.globalAlpha = 1;
            
            
        } catch (error) {
            console.error('StartScreen render error:', error);
            console.error('Stack trace:', error.stack);
            
            // Fallback rendering
            ctx.fillStyle = '#1a0f0a';
            ctx.fillRect(0, 0, ctx.canvas.width || 800, ctx.canvas.height || 600);
            ctx.fillStyle = '#ff0000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('StartScreen Error', (ctx.canvas.width || 800) / 2, (ctx.canvas.height || 600) / 2);
        }
    }
    
    handleClick() {
        // Allow clicking even before animation completes for testing
        if (this.showContinue || this.animationTime > 1) {
            this.stateManager.changeState('mainMenu');
        }
    }
}
