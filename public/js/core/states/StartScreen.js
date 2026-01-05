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

        // Aggressive faster sword movement - swords meet at 40% instead of 70%
        const leftSwordProgress = Math.min(1, progress / 0.4) * 1.2; // Accelerates and overshoots slightly
        const rightSwordProgress = Math.min(1, progress / 0.4) * 1.2;
        
        // Calculate swing motion with more aggressive angles
        const leftSwingAngle = -Math.PI / 4 + (leftSwordProgress * 0.4); // Swings from -45° to -25°
        const rightSwingAngle = Math.PI / 4 - (rightSwordProgress * 0.4); // Swings from 45° to 25°
        
        // Draw detailed medieval swords crossing with aggressive swing
        ctx.globalAlpha = Math.min(1, progress * 1.8);
        
        // Left sword coming from left with swing (now pointing upward)
        const leftSwordX = centerX - 250 + (leftSwordProgress * 250);
        ctx.save();
        ctx.translate(leftSwordX, centerY);
        ctx.rotate(leftSwingAngle);
        this.drawMedievalSword(ctx, 0, 0, '#c0c0c0', '#8b7355', 1.4);
        ctx.restore();

        // Right sword coming from right with swing (now pointing upward)
        const rightSwordX = centerX + 250 - (rightSwordProgress * 250);
        ctx.save();
        ctx.translate(rightSwordX, centerY);
        ctx.rotate(rightSwingAngle);
        this.drawMedievalSword(ctx, 0, 0, '#d4af37', '#8b7355', 1.4);
        ctx.restore();

        // Clash flash and impact effect at peak collision (happens earlier now)
        if (progress > 0.35) {
            const flashProgress = Math.min(1, (progress - 0.35) / 0.25);
            const flashOpacity = (1 - flashProgress) * 0.8;
            
            // Bright white flash at clash point
            ctx.globalAlpha = flashOpacity * 0.7;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 100 * flashProgress, 0, Math.PI * 2);
            ctx.fill();
            
            // Secondary blue/white flash ring
            ctx.globalAlpha = flashOpacity * 0.5;
            ctx.strokeStyle = '#87ceeb';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 120 * flashProgress, 0, Math.PI * 2);
            ctx.stroke();

            // Golden light bursts
            ctx.globalAlpha = flashOpacity * 0.6;
            ctx.fillStyle = '#ffd700';
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const distance = 100 + flashProgress * 120;
                const bx = centerX + Math.cos(angle) * distance;
                const by = centerY + Math.sin(angle) * distance;
                ctx.fillRect(bx - 4, by - 4, 8, 8);
            }
        }

        // Explosive smoke effects from bottom of screen
        ctx.globalAlpha = Math.min(1, (progress > 0.4 ? 1 : 0));
        const smokeStartY = canvas.height;
        const smokeExplosionStrength = Math.min(1, (progress - 0.4) / 0.4);
        
        // Smoke circles blasting outward from bottom center
        for (let circleIdx = 0; circleIdx < Math.floor(smokeExplosionStrength * 25); circleIdx++) {
            const angle = (circleIdx / 25) * Math.PI * 2;
            const distance = 50 + smokeExplosionStrength * 350;
            const smokeX = centerX + Math.cos(angle) * distance;
            const smokeY = smokeStartY - Math.abs(Math.sin(angle)) * smokeExplosionStrength * canvas.height * 0.6;
            
            const smokeSize = 40 + Math.random() * 60;
            const smokeOpacity = 0.6 - (smokeExplosionStrength * 0.3);
            
            this.drawSmokeCloud(ctx, smokeX, smokeY, smokeSize, smokeOpacity);
        }

        // Dense smoke layer rising from bottom
        ctx.globalAlpha = Math.min(1, smokeExplosionStrength * 0.8);
        for (let x = -100; x < canvas.width + 100; x += 40) {
            for (let smokeIdx = 0; smokeIdx < 3; smokeIdx++) {
                const offsetX = x + Math.sin(progress * 8 + smokeIdx) * 40;
                const offsetY = smokeStartY - (smokeExplosionStrength * canvas.height * 0.5) - (smokeIdx * 60);
                const smokeSize = 80 + Math.random() * 40;
                
                this.drawSmokeCloud(ctx, offsetX, offsetY, smokeSize, 0.5 - smokeIdx * 0.1);
            }
        }

        // Shockwave circles expanding outward
        if (progress > 0.4) {
            ctx.globalAlpha = Math.min(1, (1 - (progress - 0.4) * 2) * 0.6);
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
            ctx.lineWidth = 3;
            
            const shockProgress = (progress - 0.4) / 0.6;
            for (let i = 1; i <= 3; i++) {
                const radius = 150 + (shockProgress * 300) - (i * 80);
                if (radius > 0) {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        // Sword clash spark particles - more aggressive
        if (progress > 0.35) {
            ctx.globalAlpha = Math.min(1, (1 - progress) * 1.5);
            const sparkCount = Math.floor((progress - 0.35) * 60);
            for (let i = 0; i < sparkCount; i++) {
                const angle = (i / sparkCount) * Math.PI * 2;
                const distance = 80 + (progress - 0.35) * 350;
                const sparkX = centerX + Math.cos(angle) * distance;
                const sparkY = centerY + Math.sin(angle) * distance;
                const sparkSize = 2 + Math.random() * 5;
                
                ctx.fillStyle = `rgba(255, ${200 + Math.floor(Math.random() * 55)}, 0, 1)`;
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Screen fade with flash
        ctx.globalAlpha = Math.min(1, progress);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Final screen flash/pop
        if (progress > 0.85) {
            const popProgress = (progress - 0.85) / 0.15;
            ctx.globalAlpha = (1 - popProgress) * 0.4;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.globalAlpha = 1;
    }

    drawSmokeCloud(ctx, x, y, size, opacity) {
        ctx.globalAlpha = opacity;
        
        // Multiple circles to create cloud effect
        const colors = [
            'rgba(150, 150, 150, 0.6)',
            'rgba(180, 180, 180, 0.4)',
            'rgba(120, 120, 120, 0.3)'
        ];
        
        // Main cloud body
        ctx.fillStyle = colors[0];
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Left bulge
        ctx.fillStyle = colors[1];
        ctx.beginPath();
        ctx.arc(x - size * 0.4, y - size * 0.2, size * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Right bulge
        ctx.beginPath();
        ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Top bulge
        ctx.fillStyle = colors[2];
        ctx.beginPath();
        ctx.arc(x, y - size * 0.5, size * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Bottom bulge
        ctx.beginPath();
        ctx.arc(x, y + size * 0.3, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMedievalSword(ctx, x, y, primaryColor, accentColor, scale = 1) {
        const bladeLength = 150 * scale;
        const bladeWidth = 18 * scale;
        const guardWidth = 60 * scale;
        const guardHeight = 10 * scale;
        const handleLength = 40 * scale;
        const pommelRadius = 10 * scale;

        // Blade pointing UPWARD (negative Y)
        ctx.fillStyle = primaryColor;
        // Main blade body
        ctx.beginPath();
        ctx.moveTo(x - bladeWidth / 2, y); // Bottom left
        ctx.lineTo(x + bladeWidth / 2, y); // Bottom right
        ctx.lineTo(x + bladeWidth / 3, y - bladeLength * 0.7); // Right edge towards tip
        ctx.lineTo(x, y - bladeLength); // Tip (pointy)
        ctx.lineTo(x - bladeWidth / 3, y - bladeLength * 0.7); // Left edge towards tip
        ctx.closePath();
        ctx.fill();
        
        // Blade shine (down the middle)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(x - bladeWidth / 5, y);
        ctx.lineTo(x + bladeWidth / 5, y);
        ctx.lineTo(x + bladeWidth / 8, y - bladeLength * 0.6);
        ctx.lineTo(x, y - bladeLength + 5);
        ctx.lineTo(x - bladeWidth / 8, y - bladeLength * 0.6);
        ctx.closePath();
        ctx.fill();

        // Cross guard (perpendicular to blade)
        ctx.fillStyle = accentColor;
        ctx.fillRect(x - guardWidth / 2, y + 2, guardWidth, guardHeight);

        // Guard decorative circles
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2.5 * scale;
        ctx.beginPath();
        ctx.arc(x - guardWidth / 3, y + guardHeight / 2, 5 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + guardWidth / 3, y + guardHeight / 2, 5 * scale, 0, Math.PI * 2);
        ctx.stroke();

        // Handle below guard
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x - bladeWidth / 2.5, y + guardHeight + 2, bladeWidth * 0.8, handleLength);

        // Handle grip lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(x - bladeWidth / 2.5, y + guardHeight + 2 + (i * 7));
            ctx.lineTo(x + bladeWidth / 2.5, y + guardHeight + 2 + (i * 7));
            ctx.stroke();
        }

        // Pommel at bottom
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(x, y + guardHeight + handleLength + 5, pommelRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Pommel highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x - 3, y + guardHeight + handleLength + 5 - 3, pommelRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Blade edge definition
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + bladeWidth / 2, y);
        ctx.lineTo(x + bladeWidth / 3, y - bladeLength * 0.7);
        ctx.lineTo(x, y - bladeLength);
        ctx.stroke();
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
