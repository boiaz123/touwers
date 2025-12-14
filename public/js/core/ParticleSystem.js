/**
 * Shared ParticleSystem for menu screens
 * Maintains continuous particle animation across state transitions
 */
export class ParticleSystem {
    static instance = null;

    static getInstance(canvasWidth, canvasHeight) {
        if (!ParticleSystem.instance) {
            ParticleSystem.instance = new ParticleSystem(canvasWidth, canvasHeight);
        }
        return ParticleSystem.instance;
    }

    static reset() {
        ParticleSystem.instance = null;
    }

    constructor(canvasWidth, canvasHeight) {
        this.particles = [];
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        // Initialize with 25 particles spread throughout the canvas
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * this.canvasHeight,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 20 + 10,
                opacity: Math.random() * 0.5 + 0.1
            });
        }
    }

    update(deltaTime) {
        this.particles.forEach(particle => {
            particle.y += particle.speed * deltaTime;
            if (particle.y > this.canvasHeight) {
                particle.y = -10;
                particle.x = Math.random() * this.canvasWidth;
            }
        });
    }

    render(ctx) {
        if (!ctx || !ctx.canvas) return;

        ctx.globalAlpha = 1;
        this.particles.forEach(particle => {
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = 'rgba(255, 140, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    updateCanvasSize(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }
}
