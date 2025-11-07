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
        console.log('StartScreen: constructor completed');
    }
    
    initParticles() {
        const canvas = this.stateManager.canvas;
        if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
            console.warn('StartScreen: Canvas not ready for particles, using defaults');
            // Use default screen size as fallback
            const width = Math.max(800, window.innerWidth);
            const height = Math.max(600, window.innerHeight);
            
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
            this.particlesInitialized = true;
            console.log('StartScreen: Particles initialized with fallback size');
            return true;
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
        
        // Hide game UI elements
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');
        
        if (statsBar) {
            statsBar.style.display = 'none';
            console.log('StartScreen: Stats bar hidden');
        }
        
        if (sidebar) {
            sidebar.style.display = 'none';
            console.log('StartScreen: Sidebar hidden');
        }
        
        // Reset animation state
        this.animationTime = 0;
        this.showContinue = false;
        this.titleOpacity = 0;
        this.subtitleOpacity = 0;
        this.continueOpacity = 0;
        this.particlesInitialized = false;
        
        // Initialize particles
        this.initParticles();
        
        console.log('StartScreen: enter completed');
    }
    
    exit() {
        console.log('StartScreen: exit called');
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Ensure particles are initialized
        if (!this.particlesInitialized) {
            this.initParticles();
        }
        
        // Faster animation for testing
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
        const canvas = this.stateManager.canvas;
        const canvasHeight = canvas && canvas.height > 0 ? canvas.height : window.innerHeight;
        const canvasWidth = canvas && canvas.width > 0 ? canvas.width : window.innerWidth;
        
        if (this.particles.length > 0) {
            this.particles.forEach(particle => {
                particle.y += particle.speed * deltaTime;
                if (particle.y > canvasHeight + 10) {
                    particle.y = -10;
                    particle.x = Math.random() * canvasWidth;
                }
            });
        }
    }
    
    render(ctx) {
        try {
            const canvas = ctx.canvas;
            
            // Fallback canvas dimensions
            const canvasWidth = canvas.width > 0 ? canvas.width : window.innerWidth;
            const canvasHeight = canvas.height > 0 ? canvas.height : window.innerHeight;
            
            console.log('StartScreen: Rendering with dimensions', canvasWidth, 'x', canvasHeight);
            
            // Dark medieval background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
            gradient.addColorStop(0, '#1a0f0a');
            gradient.addColorStop(1, '#0a0505');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            // Render particles
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
            ctx.fillText('TOUWERS', canvasWidth / 2 + 3, canvasHeight / 2 - 50 + 3);
            
            // Title main
            ctx.fillStyle = '#d4af37';
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 2;
            ctx.fillText('TOUWERS', canvasWidth / 2, canvasHeight / 2 - 50);
            ctx.strokeText('TOUWERS', canvasWidth / 2, canvasHeight / 2 - 50);
            
            // Subtitle
            ctx.globalAlpha = this.subtitleOpacity;
            ctx.font = 'italic 24px serif';
            ctx.fillStyle = '#c9a876';
            ctx.fillText('Defend the Realm', canvasWidth / 2, canvasHeight / 2 + 20);
            
            // Continue message
            if (this.showContinue) {
                ctx.globalAlpha = this.continueOpacity * (0.5 + 0.5 * Math.sin(this.animationTime * 3));
                ctx.font = '20px serif';
                ctx.fillStyle = '#fff';
                ctx.fillText('Click to Continue', canvasWidth / 2, canvasHeight / 2 + 120);
            }
            
            ctx.globalAlpha = 1;
            
            console.log('StartScreen: Render completed successfully');
        } catch (error) {
            console.error('StartScreen render error:', error);
            // Fallback rendering
            ctx.fillStyle = '#ff0000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('StartScreen Render Error', ctx.canvas.width / 2, ctx.canvas.height / 2);
        }
    }
    
    handleClick() {
        console.log('StartScreen: Click detected, showContinue:', this.showContinue);
        if (this.showContinue || this.animationTime > 1) { // Allow earlier skip
            console.log('StartScreen: Transitioning to levelSelect');
            this.stateManager.changeState('levelSelect');
        }
    }
}
