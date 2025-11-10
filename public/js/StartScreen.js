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
        // Ensure we have valid canvas dimensions before initializing particles
        if (!this.stateManager.canvas.width || !this.stateManager.canvas.height) {
            console.warn('StartScreen: Canvas dimensions not available, skipping particle initialization');
            return;
        }
        
        // Prevent multiple initializations
        if (this.particlesInitialized) {
            return;
        }
        
        console.log('StartScreen: Initializing particles for canvas size:', this.stateManager.canvas.width, 'x', this.stateManager.canvas.height);
        this.particles = [];
        
        // Reduce particle count to speed up initialization
        for (let i = 0; i < 25; i++) { // Reduced from 50 to 25
            this.particles.push({
                x: Math.random() * this.stateManager.canvas.width,
                y: Math.random() * this.stateManager.canvas.height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 20 + 10,
                opacity: Math.random() * 0.5 + 0.1
            });
        }
        
        this.particlesInitialized = true;
        console.log('StartScreen: Particles initialized:', this.particles.length);
    }
    
    enter() {
        console.log('StartScreen: enter called');
        
        // Ensure game UI is hidden when in start screen
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
        
        this.animationTime = 0;
        this.showContinue = false;
        this.titleOpacity = 0;
        this.subtitleOpacity = 0;
        this.continueOpacity = 0;
        
        // Don't initialize particles immediately - let first render do it
        console.log('StartScreen: enter completed');
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Title fade in
        if (this.animationTime > 0.5) { // Reduced from 1
            this.titleOpacity = Math.min(1, (this.animationTime - 0.5) / 1); // Reduced from 2
        }
        
        // Subtitle fade in
        if (this.animationTime > 1.5) { // Reduced from 3
            this.subtitleOpacity = Math.min(1, (this.animationTime - 1.5) / 1); // Reduced from 1.5
        }
        
        // Show continue button
        if (this.animationTime > 2.5) { // Reduced from 5
            this.showContinue = true;
            this.continueOpacity = Math.min(1, (this.animationTime - 2.5) / 1); // Reduced from 5
        }
        
        // Update particles only if they exist
        if (this.particles.length > 0) {
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
            const canvas = this.stateManager.canvas;
            
            // Don't render if canvas isn't ready
            if (!canvas.width || !canvas.height) {
                return;
            }
            
            // Initialize particles on first render if not done yet
            if (!this.particlesInitialized) {
                this.initParticles();
            }
            
            // Dark medieval background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#1a0f0a');
            gradient.addColorStop(1, '#0a0505');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Render particles (falling embers) only if they exist
            if (this.particles.length > 0) {
                ctx.fillStyle = 'rgba(255, 140, 0, 0.6)';
                this.particles.forEach(particle => {
                    ctx.globalAlpha = particle.opacity;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.globalAlpha = 1;
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
                ctx.fillText('Press to Continue', canvas.width / 2, canvas.height / 2 + 120);
            }
            
            ctx.globalAlpha = 1;
        } catch (error) {
            console.error('StartScreen render error:', error);
        }
    }
    
    handleClick() {
        console.log('StartScreen: Click detected, showContinue:', this.showContinue);
        if (this.showContinue) {
            this.stateManager.changeState('levelSelect');
        }
    }
}
