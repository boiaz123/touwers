import { ParticleSystem } from '../ParticleSystem.js';

export class StartScreen {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.showContinue = false;
        this.titleOpacity = 0;
        this.subtitleOpacity = 0;
        this.continueOpacity = 0;
        this.transitionActive = false;
        this.transitionTime = 0;
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
        this.transitionActive = false;
        this.transitionTime = 0;
        
        // Get or initialize shared particle system
        if (this.stateManager.canvas && this.stateManager.canvas.width > 0 && this.stateManager.canvas.height > 0) {
            this.particleSystem = ParticleSystem.getInstance(this.stateManager.canvas.width, this.stateManager.canvas.height);
        }
        
        // Play menu theme music
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playMusic('menu-theme');
        }

        // Setup click listener
        this.setupClickListener();
    }

    exit() {
        this.removeClickListener();
    }

    setupClickListener() {
        this.clickHandler = (e) => {
            if (this.transitionActive) return;
            this.handleClick();
        };
        this.stateManager.canvas.addEventListener('click', this.clickHandler);
    }

    removeClickListener() {
        if (this.clickHandler) {
            this.stateManager.canvas.removeEventListener('click', this.clickHandler);
        }
    }

    handleClick() {
        if (this.showContinue || this.animationTime > 1) {
            // Start transition effect
            this.transitionActive = true;
            this.transitionTime = 0;

            // Transition to MainMenu after sword/flame animation completes
            setTimeout(() => this.stateManager.changeState('mainMenu'), 600);
        }
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Title fade in
        if (this.animationTime > 0.3) {
            this.titleOpacity = Math.min(1, (this.animationTime - 0.3) / 0.8);
        }
        
        // Subtitle fade in - after title is visible
        if (this.animationTime > 1.3) {
            this.subtitleOpacity = Math.min(1, (this.animationTime - 1.3) / 0.8);
        }
        
        // Show continue message - after subtitle
        if (this.animationTime > 2.3) {
            this.showContinue = true;
            this.continueOpacity = Math.min(1, (this.animationTime - 2.3) / 0.8);
        }

        // Update transition
        if (this.transitionActive) {
            this.transitionTime += deltaTime;
        }
        
        // Update shared particle system
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
        }
    }

    renderStylizedTitle(ctx, x, y, opacity) {
        ctx.globalAlpha = opacity;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const fontSize = 120;
        ctx.font = `bold italic ${fontSize}px serif`;

        // Deep shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText('TOUWERS', x + 4, y + 4);

        // Main golden text with gradient
        const gradient = ctx.createLinearGradient(x - 200, y - 60, x + 200, y + 60);
        gradient.addColorStop(0, '#ffd700');
        gradient.addColorStop(0.5, '#ffed4e');
        gradient.addColorStop(1, '#d4af37');
        ctx.fillStyle = gradient;
        ctx.fillText('TOUWERS', x, y);

        // Stroke for depth
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.strokeText('TOUWERS', x, y);

        // Top highlight edge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.strokeText('TOUWERS', x, y);

        ctx.globalAlpha = 1;
    }

    renderTransitionEffect(ctx) {
        const progress = Math.min(1, this.transitionTime / 0.6);
        const canvas = this.stateManager.canvas;

        if (progress < 0.01) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 - 50;

        // Draw detailed medieval swords crossing
        ctx.globalAlpha = Math.min(1, progress * 2);
        
        // Left sword coming from left
        const leftSwordX = centerX - 150 + (progress * 150);
        ctx.save();
        ctx.translate(leftSwordX, centerY);
        ctx.rotate(Math.PI / 6);
        this.drawMedievalSword(ctx, 0, 0, '#c0c0c0', '#8b7355');
        ctx.restore();

        // Right sword coming from right
        const rightSwordX = centerX + 150 - (progress * 150);
        ctx.save();
        ctx.translate(rightSwordX, centerY);
        ctx.rotate(-Math.PI / 6);
        this.drawMedievalSword(ctx, 0, 0, '#d4af37', '#8b7355');
        ctx.restore();

        // Detailed flames coming from bottom of screen
        ctx.globalAlpha = Math.min(1, (1 - progress) * 0.9);
        const flameStartY = canvas.height;
        
        for (let x = 0; x < canvas.width; x += 30) {
            for (let flameIdx = 0; flameIdx < 3; flameIdx++) {
                const offsetX = x + Math.sin(progress * 10 + flameIdx) * 20;
                const offsetY = flameStartY - progress * canvas.height * 0.7 - flameIdx * 40;
                const size = 50 * (1 - (offsetY + canvas.height) / canvas.height) * 0.8;
                
                if (size > 5) {
                    this.drawFlame(ctx, offsetX, offsetY, size);
                }
            }
        }

        // Spark particles from sword clash
        ctx.globalAlpha = Math.min(1, (1 - progress) * 0.8);
        const sparkCount = Math.floor(progress * 20);
        for (let i = 0; i < sparkCount; i++) {
            const angle = (i / sparkCount) * Math.PI * 2;
            const distance = 80 + progress * 150;
            const sparkX = centerX + Math.cos(angle) * distance;
            const sparkY = centerY + Math.sin(angle) * distance;
            const sparkSize = 2 + Math.random() * 3;
            
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Screen fade to black
        ctx.globalAlpha = progress * 0.7;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
    }

    drawMedievalSword(ctx, x, y, primaryColor, accentColor) {
        const bladeLength = 120;
        const bladeWidth = 15;
        const guardWidth = 50;
        const guardHeight = 8;
        const handleLength = 30;
        const pommelRadius = 8;

        // Blade
        ctx.fillStyle = primaryColor;
        ctx.fillRect(x - bladeWidth / 2, y - bladeLength / 2, bladeWidth, bladeLength);
        
        // Blade shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x - bladeWidth / 3, y - bladeLength / 2, bladeWidth / 5, bladeLength);

        // Cross guard (upper)
        ctx.fillStyle = accentColor;
        ctx.fillRect(x - guardWidth / 2, y - bladeLength / 2 - guardHeight, guardWidth, guardHeight);
        
        // Cross guard (lower)
        ctx.fillRect(x - guardWidth / 2, y - bladeLength / 2 + 2, guardWidth, guardHeight);

        // Guard decorative circles
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x - guardWidth / 3, y - bladeLength / 2, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + guardWidth / 3, y - bladeLength / 2, 4, 0, Math.PI * 2);
        ctx.stroke();

        // Handle
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - bladeWidth / 3, y - bladeLength / 2 + guardHeight, bladeWidth * 0.66, handleLength);

        // Handle grip lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x - bladeWidth / 3, y - bladeLength / 2 + guardHeight + (i * 8));
            ctx.lineTo(x + bladeWidth / 3, y - bladeLength / 2 + guardHeight + (i * 8));
            ctx.stroke();
        }

        // Pommel
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(x, y - bladeLength / 2 + guardHeight + handleLength, pommelRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Pommel highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x - 2, y - bladeLength / 2 + guardHeight + handleLength - 2, pommelRadius / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFlame(ctx, x, y, size) {
        const gradient = ctx.createRadialGradient(x, y + size / 2, 0, x, y + size / 2, size);
        gradient.addColorStop(0, 'rgba(255, 200, 0, 0.9)');
        gradient.addColorStop(0.3, 'rgba(255, 150, 0, 0.7)');
        gradient.addColorStop(0.6, 'rgba(255, 100, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Flame tip
        const tipGradient = ctx.createRadialGradient(x, y - size * 0.5, 0, x, y - size * 0.5, size * 0.6);
        tipGradient.addColorStop(0, 'rgba(255, 255, 100, 0.6)');
        tipGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = tipGradient;
        ctx.beginPath();
        ctx.ellipse(x, y - size * 0.3, size * 0.5, size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    render(ctx) {
        try {
            const canvas = this.stateManager.canvas;
            
            if (!canvas || !canvas.width || !canvas.height) {
                ctx.fillStyle = '#1a0f0a';
                ctx.fillRect(0, 0, 800, 600);
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

            // Render stylized title
            this.renderStylizedTitle(ctx, canvas.width / 2, canvas.height / 2 - 50, this.titleOpacity);

            // Subtitle (Defend the Realm)
            ctx.globalAlpha = this.subtitleOpacity;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'italic 28px serif';
            ctx.fillStyle = '#c9a876';
            ctx.fillText('Defend the Realm', canvas.width / 2, canvas.height / 2 + 20);

            // Continue message
            if (this.showContinue) {
                const flickerAlpha = this.continueOpacity * (0.5 + 0.5 * Math.sin(this.animationTime * 3));
                ctx.globalAlpha = flickerAlpha;
                ctx.font = '20px serif';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Press to Continue', canvas.width / 2, canvas.height / 2 + 120);
            }

            ctx.globalAlpha = 1;

            // Render transition effect
            if (this.transitionActive) {
                this.renderTransitionEffect(ctx);
            }
            
        } catch (error) {
            console.error('StartScreen render error:', error);
            ctx.fillStyle = '#1a0f0a';
            ctx.fillRect(0, 0, ctx.canvas.width || 800, ctx.canvas.height || 600);
            ctx.fillStyle = '#ff0000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('StartScreen Error', (ctx.canvas.width || 800) / 2, (ctx.canvas.height || 600) / 2);
        }
    }
}
