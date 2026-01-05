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

            // Transition to MainMenu after full 7-second animation completes
            setTimeout(() => this.stateManager.changeState('mainMenu'), 7000);
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
        const canvas = this.stateManager.canvas;
        const totalDuration = 7; // Total transition time - 7 seconds
        const progress = Math.min(1, this.transitionTime / totalDuration);

        if (progress < 0.01) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 - 50;

        // PHASE 1: Sword clash (0 - 2 seconds)
        const swordDuration = 2 / totalDuration; // 2 seconds out of 7
        if (progress < swordDuration) {
            const swordProgress = progress / swordDuration;
            
            // Sword movement - swords meet at 40% of sword phase
            const leftSwordProgress = Math.min(1, swordProgress / 0.4) * 1.2;
            const rightSwordProgress = Math.min(1, swordProgress / 0.4) * 1.2;
            
            // Calculate swing motion
            const leftSwingAngle = -Math.PI / 4 + (leftSwordProgress * 0.4);
            const rightSwingAngle = Math.PI / 4 - (rightSwordProgress * 0.4);
            
            // Draw swords
            ctx.globalAlpha = Math.min(1, swordProgress * 2);
            
            // Left sword
            const leftSwordX = centerX - 250 + (leftSwordProgress * 250);
            ctx.save();
            ctx.translate(leftSwordX, centerY);
            ctx.rotate(leftSwingAngle);
            this.drawMedievalSword(ctx, 0, 0, '#c0c0c0', '#8b7355', 1.4);
            ctx.restore();

            // Right sword
            const rightSwordX = centerX + 250 - (rightSwordProgress * 250);
            ctx.save();
            ctx.translate(rightSwordX, centerY);
            ctx.rotate(rightSwingAngle);
            this.drawMedievalSword(ctx, 0, 0, '#d4af37', '#8b7355', 1.4);
            ctx.restore();

            // Subtle clash flash at sword meeting point
            if (swordProgress > 0.35) {
                const flashProgress = Math.min(1, (swordProgress - 0.35) / 0.15);
                const flashOpacity = (1 - flashProgress) * 0.3;
                
                ctx.globalAlpha = flashOpacity * 0.3;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(centerX, centerY, 80 * flashProgress, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // PHASE 2: Smoke appearance and fade (2 - 7 seconds)
        const smokeStartTime = swordDuration; // 2 seconds / 7
        const smokeDuration = (5 / totalDuration); // 5 seconds of smoke effect
        
        if (progress >= smokeStartTime && progress < (smokeStartTime + smokeDuration)) {
            const smokePhaseProgress = (progress - smokeStartTime) / smokeDuration;
            
            // Render buttons ONLY after 1 second into smoke (1 second into 5 second phase = 0.2)
            // Draw them FIRST so smoke appears on top
            const buttonRenderStartTime = 1 / 5; // 0.2
            if (smokePhaseProgress >= buttonRenderStartTime) {
                ctx.globalAlpha = 1;
                this.renderMenuButtons(ctx);
            }
            
            // NOW render dense natural smoke clouds covering entire bottom half
            // This will be drawn ON TOP of the buttons
            ctx.globalAlpha = 1;
            
            // Create a dense, natural-looking smoke screen with many overlapping clouds
            const cloudCount = 40; // Many clouds for full coverage
            for (let i = 0; i < cloudCount; i++) {
                // Distribute clouds across entire bottom half with variation
                const col = i % 8;
                const row = Math.floor(i / 8);
                
                // Grid-based placement with smooth variation for natural look
                const baseX = (col + 0.5) * (canvas.width / 8) + Math.sin(i * 0.5) * 60;
                const baseY = (canvas.height * 0.4) + (row * (canvas.height * 0.15)) + Math.cos(i * 0.3) * 50;
                
                const cloudSize = 90 + Math.sin(i * 0.7) * 40;
                
                // Smoke fills quickly (over first part of phase), then fades
                let cloudOpacity = 0.4;
                if (smokePhaseProgress < 0.2) {
                    // Filling phase - clouds appear
                    cloudOpacity = 0.4 * (smokePhaseProgress / 0.2);
                } else {
                    // After 1 second into smoke (which is 0.2 of 5 second smoke phase)
                    // Start fading if past the 1-second mark
                    const fadeStartInPhase = 0.2; // 1 second into 5 second phase
                    if (smokePhaseProgress > fadeStartInPhase) {
                        const fadeProgress = (smokePhaseProgress - fadeStartInPhase) / (1 - fadeStartInPhase);
                        cloudOpacity = 0.4 * (1 - fadeProgress);
                    } else {
                        cloudOpacity = 0.4; // Full opacity until fade starts
                    }
                }
                
                this.drawHazySmokeCloud(ctx, baseX, baseY, cloudSize, cloudOpacity, i);
            }

            // Additional larger background clouds for complete coverage
            for (let y = canvas.height * 0.35; y < canvas.height; y += 80) {
                for (let x = 0; x < canvas.width; x += 120) {
                    const cloudSize = 120 + Math.sin(x * 0.01) * 40;
                    
                    let cloudOpacity = 0.3;
                    if (smokePhaseProgress < 0.2) {
                        cloudOpacity = 0.3 * (smokePhaseProgress / 0.2);
                    } else {
                        const fadeStartInPhase = 0.2;
                        if (smokePhaseProgress > fadeStartInPhase) {
                            const fadeProgress = (smokePhaseProgress - fadeStartInPhase) / (1 - fadeStartInPhase);
                            cloudOpacity = 0.3 * (1 - fadeProgress);
                        } else {
                            cloudOpacity = 0.3;
                        }
                    }
                    
                    if (cloudOpacity > 0) {
                        this.drawHazySmokeCloud(ctx, x, y, cloudSize, cloudOpacity, x + y);
                    }
                }
            }
        }

        // Continue showing buttons after transition completes (opacity set to 1 in renderMenuButtons)
        if (progress >= (smokeStartTime + smokeDuration)) {
            this.renderMenuButtons(ctx);
        }

        ctx.globalAlpha = 1;
    }

    drawHazySmokeCloud(ctx, x, y, size, opacity, seed) {
        if (opacity <= 0) return;
        
        ctx.globalAlpha = opacity;
        
        // Soft hazy smoke - more subtle colors for silky smooth appearance
        const colors = [
            'rgba(130, 130, 130, 0.5)',
            'rgba(145, 145, 145, 0.4)',
            'rgba(155, 155, 155, 0.35)',
            'rgba(140, 140, 140, 0.3)'
        ];
        
        // Main spherical cloud body - smooth and round
        ctx.fillStyle = colors[0];
        ctx.beginPath();
        ctx.arc(x, y, size * 0.95, 0, Math.PI * 2);
        ctx.fill();

        // Smooth overlapping bulges for natural spherical appearance
        ctx.fillStyle = colors[1];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            // Smooth sine wave for consistent bulge sizes - no flickering
            const bulgeVariation = Math.sin(seed * 0.3 + angle) * 0.08;
            const bx = x + Math.cos(angle) * size * 0.65;
            const by = y + Math.sin(angle) * size * 0.55;
            const bulgeSize = size * (0.55 + bulgeVariation);
            ctx.beginPath();
            ctx.arc(bx, by, bulgeSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Smoother top formation - more spherical, less horizontal
        ctx.fillStyle = colors[2];
        // Left top curve
        ctx.beginPath();
        ctx.arc(x - size * 0.35, y - size * 0.45, size * 0.65, 0, Math.PI * 2);
        ctx.fill();
        // Center top
        ctx.beginPath();
        ctx.arc(x, y - size * 0.55, size * 0.75, 0, Math.PI * 2);
        ctx.fill();
        // Right top curve
        ctx.beginPath();
        ctx.arc(x + size * 0.35, y - size * 0.45, size * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Subtle smooth wisps for natural atmospheric effect
        ctx.globalAlpha = opacity * 0.15;
        ctx.fillStyle = colors[3];
        for (let i = 0; i < 3; i++) {
            // Use sine for smooth continuous variation instead of random
            const wispX = x + Math.cos(seed * 0.2 + i) * size * 0.4;
            const wispY = y + Math.sin(seed * 0.2 + i) * size * 0.35;
            const wispSize = size * (0.25 + Math.cos(seed * 0.4 + i * 0.5) * 0.08);
            ctx.beginPath();
            ctx.arc(wispX, wispY, wispSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawDetailedSmokeCloud(ctx, x, y, size, opacity, seed) {
        if (opacity <= 0) return;
        
        ctx.globalAlpha = opacity;
        
        // Subtle smoke colors
        const colors = [
            'rgba(160, 160, 160, 0.5)',
            'rgba(180, 180, 180, 0.4)',
            'rgba(140, 140, 140, 0.3)',
            'rgba(170, 170, 170, 0.25)'
        ];
        
        // Main cloud body - soft and diffuse
        const variance = Math.sin(seed * 0.7) * 0.15;
        ctx.fillStyle = colors[0];
        ctx.beginPath();
        ctx.arc(x, y, size * (0.85 + variance), 0, Math.PI * 2);
        ctx.fill();

        // Left bulge - gentle
        ctx.fillStyle = colors[1];
        ctx.beginPath();
        ctx.arc(x - size * 0.45, y - size * 0.1, size * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Right bulge - gentle
        ctx.beginPath();
        ctx.arc(x + size * 0.45, y - size * 0.1, size * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Top bulge - softer
        ctx.fillStyle = colors[2];
        ctx.beginPath();
        ctx.arc(x, y - size * 0.5, size * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Bottom bulge - light
        ctx.fillStyle = colors[3];
        ctx.beginPath();
        ctx.arc(x, y + size * 0.3, size * 0.55, 0, Math.PI * 2);
        ctx.fill();

        // Very subtle wisps for natural flow
        ctx.globalAlpha = opacity * 0.3;
        ctx.fillStyle = colors[1];
        for (let i = 0; i < 2; i++) {
            const wispX = x + (Math.cos(seed + i) * size * 0.35);
            const wispY = y + (Math.sin(seed + i) * size * 0.25);
            ctx.beginPath();
            ctx.arc(wispX, wispY, size * 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
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

            // Render stylized title (ALWAYS visible, even during transition)
            this.renderStylizedTitle(ctx, canvas.width / 2, canvas.height / 2 - 50, this.titleOpacity);

            // Subtitle (Defend the Realm)
            ctx.globalAlpha = this.subtitleOpacity;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'italic 28px serif';
            ctx.fillStyle = '#c9a876';
            ctx.fillText('Defend the Realm', canvas.width / 2, canvas.height / 2 + 20);

            // Continue message
            if (this.showContinue && !this.transitionActive) {
                const flickerAlpha = this.continueOpacity * (0.5 + 0.5 * Math.sin(this.animationTime * 3));
                ctx.globalAlpha = flickerAlpha;
                ctx.font = '20px serif';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Press to Continue', canvas.width / 2, canvas.height / 2 + 120);
            }

            ctx.globalAlpha = 1;

            // Render transition effect (smoke on top of everything except title)
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

    renderMenuButtons(ctx) {
        const canvas = this.stateManager.canvas;
        const buttonWidth = 220;
        const buttonHeight = 50;
        const buttonGap = 15;
        const startY = canvas.height / 2 + 80;

        const buttons = ['NEW GAME', 'LOAD GAME', 'OPTIONS', 'QUIT GAME'];

        // During transition, buttons are behind smoke but fully opaque
        // After transition, they stay visible
        ctx.globalAlpha = 1;
        for (let i = 0; i < buttons.length; i++) {
            const buttonY = startY + (i * (buttonHeight + buttonGap));
            const buttonX = canvas.width / 2 - buttonWidth / 2;

            this.renderControlButton(ctx, buttonX, buttonY, buttonWidth, buttonHeight, buttons[i], false);
        }
        ctx.globalAlpha = 1;
    }

    renderControlButton(ctx, x, y, width, height, text, isHovered) {
        // Button background gradient
        const bgGradient = ctx.createLinearGradient(x, y, x, y + height);
        bgGradient.addColorStop(0, '#44301c');
        bgGradient.addColorStop(1, '#261200');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(x, y, width, height);

        // Button border - outset style
        ctx.strokeStyle = isHovered ? '#ffd700' : '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Top highlight line for beveled effect
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.stroke();

        // Inset shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.stroke();

        // Button text
        ctx.fillStyle = isHovered ? '#ffd700' : '#d4af37';
        ctx.font = 'bold 20px Trebuchet MS, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(text, x + width / 2 + 1, y + height / 2 + 1);
        
        // Main text
        ctx.fillStyle = isHovered ? '#ffd700' : '#d4af37';
        ctx.fillText(text, x + width / 2, y + height / 2);
    }
}
