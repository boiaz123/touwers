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
        
        // Add start-screen class to body for CSS cursor control
        document.body.className = document.body.className.replace(/\b(start-screen|level-select|game-active)\b/g, '').trim();
        document.body.classList.add('start-screen');
        
        console.log('StartScreen: Using CSS cursor styling');
        
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
        
        // Reset animation state
        this.animationTime = 0;
        this.showContinue = false;
        this.titleOpacity = 0;
        this.subtitleOpacity = 0;
        this.continueOpacity = 0;
        
        // Reset particle state
        this.particles = [];
        this.particlesInitialized = false;
        
        // CRITICAL: Initialize particles SYNCHRONOUSLY - don't defer
        const canvas = this.stateManager.canvas;
        if (canvas && canvas.width > 0 && canvas.height > 0) {
            console.log('StartScreen: Force initializing particles NOW in enter()');
            
            // Initialize particles inline to ensure they're ready
            this.particles = [];
            for (let i = 0; i < 25; i++) {
                this.particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 3 + 1,
                    speed: Math.random() * 20 + 10,
                    opacity: Math.random() * 0.5 + 0.1
                });
            }
            this.particlesInitialized = true;
            console.log('StartScreen: Particles initialized synchronously:', this.particles.length);
        } else {
            console.error('StartScreen: Canvas not ready in enter()! Width:', canvas?.width, 'Height:', canvas?.height);
        }
        
        console.log('StartScreen: enter completed successfully');
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
            
            // Validate canvas dimensions
            if (!canvas || !canvas.width || !canvas.height) {
                console.error('StartScreen: Invalid canvas in render!', canvas);
                return;
            }
            
            const width = canvas.width;
            const height = canvas.height;
            
            // REMOVED excessive logging - only log once
            if (!this._hasRendered) {
                console.log('StartScreen: First render - canvas', width, 'x', height, 'particles:', this.particles.length);
                this._hasRendered = true;
            }
            
            // Initialize particles on first render if somehow not initialized
            if (!this.particlesInitialized && width > 0 && height > 0) {
                console.warn('StartScreen: Late particle initialization in render');
                this.particles = [];
                for (let i = 0; i < 25; i++) {
                    this.particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 3 + 1,
                        speed: Math.random() * 20 + 10,
                        opacity: Math.random() * 0.5 + 0.1
                    });
                }
                this.particlesInitialized = true;
            }
            
            // Dark medieval background
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#1a0f0a');
            gradient.addColorStop(1, '#0a0505');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // Render particles (falling embers) if they exist
            if (this.particles && this.particles.length > 0) {
                this.particles.forEach(particle => {
                    ctx.globalAlpha = particle.opacity;
                    ctx.fillStyle = 'rgba(255, 140, 0, 0.6)';
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
            
            ctx.globalAlpha = 1;
            
            // Title rendering
            ctx.globalAlpha = Math.max(0.1, this.titleOpacity);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Title shadow
            ctx.fillStyle = '#000';
            ctx.font = 'bold 80px serif';
            ctx.fillText('TOUWERS', width / 2 + 3, height / 2 - 50 + 3);
            
            // Title main
            ctx.fillStyle = '#d4af37';
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 2;
            ctx.fillText('TOUWERS', width / 2, height / 2 - 50);
            ctx.strokeText('TOUWERS', width / 2, height / 2 - 50);
            
            // Subtitle
            ctx.globalAlpha = Math.max(0.05, this.subtitleOpacity);
            ctx.font = 'italic 24px serif';
            ctx.fillStyle = '#c9a876';
            ctx.fillText('Defend the Realm', width / 2, height / 2 + 20);
            
            // Continue message
            if (this.showContinue || this.animationTime > 1) {
                const flickerAlpha = this.showContinue ? 
                    this.continueOpacity * (0.5 + 0.5 * Math.sin(this.animationTime * 3)) : 
                    0.3;
                ctx.globalAlpha = flickerAlpha;
                ctx.font = '20px serif';
                ctx.fillStyle = '#fff';
                ctx.fillText('Press to Continue', width / 2, height / 2 + 120);
            }
            
            ctx.globalAlpha = 1;
            
        } catch (error) {
            console.error('StartScreen render error:', error);
            console.error('Error stack:', error.stack);
            
            // Fallback rendering
            try {
                ctx.fillStyle = '#1a0f0a';
                ctx.fillRect(0, 0, ctx.canvas.width || 800, ctx.canvas.height || 600);
                ctx.fillStyle = '#d4af37';
                ctx.font = '24px serif';
                ctx.textAlign = 'center';
                ctx.fillText('Starting...', (ctx.canvas.width || 800) / 2, (ctx.canvas.height || 600) / 2);
            } catch (fallbackError) {
                console.error('StartScreen: Even fallback render failed:', fallbackError);
            }
        }
    }
    
    handleClick() {
        console.log('StartScreen: Click detected, showContinue:', this.showContinue, 'animationTime:', this.animationTime);
        // Allow clicking even before animation completes for testing
        if (this.showContinue || this.animationTime > 1) {
            // Ensure cursor is reset before state change
            this.stateManager.canvas.style.cursor = 'default';
            this.stateManager.changeState('levelSelect');
        }
    }
}
