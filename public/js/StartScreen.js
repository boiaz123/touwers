export class StartScreen {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.showContinue = false;
        this.titleOpacity = 0;
        this.subtitleOpacity = 0;
        this.continueOpacity = 0;
        this.particles = [];
        console.log('StartScreen: constructor completed');
    }
    
    enter() {
        console.log('StartScreen: enter called');
        
        // Hide game UI
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        
        if (statsBar) statsBar.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';
        
        // Reset animation
        this.animationTime = 0;
        this.showContinue = false;
        this.titleOpacity = 0;
        this.subtitleOpacity = 0;
        this.continueOpacity = 0;
        
        // Initialize particles immediately
        this.initParticles();
    }
    
    initParticles() {
        const width = this.stateManager.canvas?.width || window.innerWidth;
        const height = this.stateManager.canvas?.height || window.innerHeight;
        
        this.particles = [];
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 20 + 10,
                opacity: Math.random() * 0.5 + 0.1
            });
        }
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Animation timing
        if (this.animationTime > 0.5) {
            this.titleOpacity = Math.min(1, (this.animationTime - 0.5) / 1);
        }
        
        if (this.animationTime > 1.5) {
            this.subtitleOpacity = Math.min(1, (this.animationTime - 1.5) / 1);
        }
        
        if (this.animationTime > 2.5) {
            this.showContinue = true;
            this.continueOpacity = Math.min(1, (this.animationTime - 2.5) / 0.5);
        }
        
        // Update particles
        const height = this.stateManager.canvas?.height || window.innerHeight;
        const width = this.stateManager.canvas?.width || window.innerWidth;
        
        this.particles.forEach(particle => {
            particle.y += particle.speed * deltaTime;
            if (particle.y > height + 10) {
                particle.y = -10;
                particle.x = Math.random() * width;
            }
        });
    }
    
    render(ctx) {
        const width = ctx.canvas.width || window.innerWidth;
        const height = ctx.canvas.height || window.innerHeight;
        
        console.log('StartScreen: Rendering with canvas size:', width, 'x', height);
        
        // Ensure we have valid dimensions
        if (width <= 0 || height <= 0) {
            console.warn('StartScreen: Invalid canvas dimensions, using fallback');
            return;
        }
        
        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1a0f0a');
        gradient.addColorStop(1, '#0a0505');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Particles
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = '#ff8c00';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Title
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Title with shadow
        ctx.globalAlpha = this.titleOpacity;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 80px serif';
        ctx.fillText('TOUWERS', width / 2 + 3, height / 2 - 47);
        
        ctx.fillStyle = '#d4af37';
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.fillText('TOUWERS', width / 2, height / 2 - 50);
        ctx.strokeText('TOUWERS', width / 2, height / 2 - 50);
        
        // Subtitle
        ctx.globalAlpha = this.subtitleOpacity;
        ctx.font = 'italic 24px serif';
        ctx.fillStyle = '#c9a876';
        ctx.fillText('Defend the Realm', width / 2, height / 2 + 20);
        
        // Continue message
        if (this.showContinue) {
            const blink = this.continueOpacity * (0.5 + 0.5 * Math.sin(this.animationTime * 3));
            ctx.globalAlpha = blink;
            ctx.font = '20px serif';
            ctx.fillStyle = '#fff';
            ctx.fillText('Click to Continue', width / 2, height / 2 + 120);
        }
        
        ctx.restore();
        
        console.log('StartScreen: Render complete - title opacity:', this.titleOpacity, 
                   'showContinue:', this.showContinue);
    }
    
    handleClick() {
        console.log('StartScreen: Click detected');
        if (this.showContinue || this.animationTime > 1) {
            this.stateManager.changeState('levelSelect');
        }
    }
}
