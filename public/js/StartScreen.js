export class StartScreen {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.showContinue = false;
        this.titleOpacity = 0;
        this.subtitleOpacity = 0;
        this.continueOpacity = 0;
        this.particles = [];
        this.particlesInitialized = false;
        console.log('StartScreen: constructor called');
    }
    
    initParticles() {
        // Always try to initialize particles when called
        const canvas = this.stateManager.canvas;
        if (!canvas || !canvas.width || !canvas.height) {
            console.warn('StartScreen: Canvas not ready for particles');
            return false;
        }
        
        console.log('StartScreen: Initializing particles for canvas size:', canvas.width, 'x', canvas.height);
        this.particles = [];
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 20 + 10,
                opacity: Math.random() * 0.5 + 0.1
            });
        }
        this.particlesInitialized = true;
        console.log('StartScreen: Particles initialized:', this.particles.length);
        return true;
    }
    
    enter() {
        console.log('StartScreen: enter called');
        
        // Ensure game UI is hidden when in start screen
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        
        if (statsBar) {
            statsBar.style.display = 'none';
            console.log('StartScreen: Stats bar hidden');
        } else {
            console.warn('StartScreen: Stats bar element not found');
        }
        
        if (sidebar) {
            sidebar.style.display = 'none';
            console.log('StartScreen: Sidebar hidden');
        } else {
            console.warn('StartScreen: Sidebar element not found');
        }
        
        this.animationTime = 0;
        this.showContinue = false;
        this.titleOpacity = 0;
        this.subtitleOpacity = 0;
        this.continueOpacity = 0;
        this.particlesInitialized = false;
        
        // Try to initialize particles immediately
        this.initParticles();
        
        console.log('StartScreen: enter completed');
    }
    
    exit() {
        console.log('StartScreen: exit called');
        // Clear any resources if needed
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Try to initialize particles if not done yet
        if (!this.particlesInitialized) {
            this.initParticles();
        }
        
        // Title fade in
        if (this.animationTime > 1) {
            this.titleOpacity = Math.min(1, (this.animationTime - 1) / 2);
        }
        
        // Subtitle fade in
        if (this.animationTime > 3) {
            this.subtitleOpacity = Math.min(1, (this.animationTime - 3) / 1.5);
        }
        
        // Show continue button
        if (this.animationTime > 5) {
            this.showContinue = true;
            this.continueOpacity = Math.min(1, (this.animationTime - 5) / 1);
        }
        
        // Update particles only if they exist
        if (this.particles.length > 0 && this.stateManager.canvas) {
            this.particles.forEach(particle => {
                particle.y += particle.speed * deltaTime;
                if (particle.y > this.stateManager.canvas.height) {
                    particle.y = -10;
                    particle.x = Math.random() * this.stateManager.canvas.width;
                }
            });
        }
    }
    
    render(ctx) {
        try {
            const canvas = ctx.canvas;
            
            // Don't render if canvas isn't ready
            if (!canvas || !canvas.width || !canvas.height) {
                console.warn('StartScreen: Canvas not ready for rendering');
                return;
            }
            
            // Dark medieval background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a0f0a');
            gradient.addColorStop(1, '#0a0505');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Render particles (falling embers) only if they exist
            if (this.particles.length > 0) {
                this.particles.forEach(particle => {
                    ctx.save();
                    ctx.globalAlpha = particle.opacity;
                    ctx.fillStyle = 'rgba(255, 140, 0, 0.6)';
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            }
            
            // Title
            ctx.textAlign = 'center';
            ctx.globalAlpha = this.titleOpacity;
            
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
                ctx.globalAlpha = this.continueOpacity * (0.5 + 0.5 * Math.sin(this.animationTime * 3));
                ctx.font = '20px serif';
                ctx.fillStyle = '#fff';
                ctx.fillText('Click to Continue', canvas.width / 2, canvas.height / 2 + 120);
            }
            
            ctx.globalAlpha = 1;
        } catch (error) {
            console.error('StartScreen render error:', error);
        }
    }
    
    handleClick() {
        console.log('StartScreen: Click detected, showContinue:', this.showContinue);
        if (this.showContinue) {
            console.log('StartScreen: Transitioning to levelSelect');
            this.stateManager.changeState('levelSelect');
        }
    }
}
