export class StartScreen {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.showContinue = false;
        this.titleOpacity = 0;
        this.subtitleOpacity = 0;
        this.continueOpacity = 0;
        this.particles = [];
        this.initParticles();
    }
    
    initParticles() {
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.stateManager.canvas.width,
                y: Math.random() * this.stateManager.canvas.height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 20 + 10,
                opacity: Math.random() * 0.5 + 0.1
            });
        }
    }
    
    enter() {
        this.animationTime = 0;
        this.showContinue = false;
        this.titleOpacity = 0;
        this.subtitleOpacity = 0;
        this.continueOpacity = 0;
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
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
        
        // Update particles
        this.particles.forEach(particle => {
            particle.y += particle.speed * deltaTime;
            if (particle.y > this.stateManager.canvas.height) {
                particle.y = -10;
                particle.x = Math.random() * this.stateManager.canvas.width;
            }
        });
    }
    
    render(ctx) {
        const canvas = this.stateManager.canvas;
        
        // Dark medieval background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a0f0a');
        gradient.addColorStop(1, '#0a0505');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render particles (falling embers)
        ctx.fillStyle = 'rgba(255, 140, 0, 0.6)';
        this.particles.forEach(particle => {
            ctx.globalAlpha = particle.opacity;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
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
    }
    
    handleClick() {
        if (this.showContinue) {
            this.stateManager.changeState('levelSelect');
        }
    }
}
