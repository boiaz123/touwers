import { ParticleSystem } from '../ParticleSystem.js';

// Import Tauri invoke for app control
let invoke = null;
if (typeof window !== 'undefined') {
    // Try to get invoke from Tauri API - will be null if not in Tauri
    if (window.__TAURI_INTERNALS__?.invoke) {
        invoke = window.__TAURI_INTERNALS__.invoke;
    }
}

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
        this.swordSoundPlayed = false; // Track if sword sound has been played
        
        // Menu buttons
        this.buttons = [
            { label: 'NEW GAME', action: 'newGame', hovered: false },
            { label: 'LOAD GAME', action: 'loadGame', hovered: false },
            { label: 'OPTIONS', action: 'options', hovered: false },
            { label: 'QUIT GAME', action: 'quitGame', hovered: false }
        ];
        this.buttonWidth = 220;
        this.buttonHeight = 50;
        this.buttonGap = 15;
        this.mouseMoveHandler = null;
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
        
        // Check if we're returning from options or loadGame menus
        // If so, skip to the post-transition button menu state
        const returningFromMenu = this.stateManager.previousState === 'options' || 
                                  this.stateManager.previousState === 'loadGame' ||
                                  this.stateManager.previousState === 'saveSlotSelection';
        
        if (returningFromMenu) {
            // Skip to post-transition state (buttons visible)
            this.animationTime = 0;
            this.showContinue = false;
            this.titleOpacity = 1;
            this.subtitleOpacity = 1;
            this.continueOpacity = 0;
            this.transitionActive = false;
            this.transitionTime = 3;  // Jump to post-transition state
            this.swordSoundPlayed = false;
        } else {
            // Normal reset for initial entry
            this.animationTime = 0;
            this.showContinue = false;
            this.titleOpacity = 0;
            this.subtitleOpacity = 0;
            this.continueOpacity = 0;
            this.transitionActive = false;
            this.transitionTime = 0;
            this.swordSoundPlayed = false;
        }
        
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
            const rect = this.stateManager.canvas.getBoundingClientRect();
            // Account for CSS scaling
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            this.handleClick(x, y);
        };
        this.mouseMoveHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            // Account for CSS scaling
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            this.handleMouseMove(x, y);
        };
        this.stateManager.canvas.addEventListener('click', this.clickHandler);
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
    }

    removeClickListener() {
        if (this.clickHandler) {
            this.stateManager.canvas.removeEventListener('click', this.clickHandler);
        }
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        }
    }

    getButtonPosition(index) {
        const canvas = this.stateManager.canvas;
        const startY = canvas.height / 2 + 80;
        return {
            x: canvas.width / 2 - this.buttonWidth / 2,
            y: startY + index * (this.buttonHeight + this.buttonGap),
            width: this.buttonWidth,
            height: this.buttonHeight
        };
    }

    handleMouseMove(x, y) {
        // Handle mouse hover only after transition completes
        if (this.transitionTime >= 3) {
            this.buttons.forEach((button, index) => {
                const pos = this.getButtonPosition(index);
                button.hovered = x >= pos.x && x <= pos.x + pos.width && 
                                 y >= pos.y && y <= pos.y + pos.height;
            });

            this.stateManager.canvas.style.cursor = 
                this.buttons.some(b => b.hovered) ? 'pointer' : 'default';
        } else {
            this.stateManager.canvas.style.cursor = 'default';
        }
    }

    handleClick(x, y) {
        // Before transition: if showing continue message AND transition hasn't started, start transition
        if (!this.transitionActive && this.showContinue && this.animationTime > 1 && this.transitionTime === 0) {
            this.transitionActive = true;
            this.transitionTime = 0;
            this.swordSoundPlayed = false; // Reset sound flag when starting new transition
            return;
        }

        // While animating: don't handle clicks
        if (this.transitionActive) {
            return;
        }

        // After transition completes (transitionTime >= 3): handle button clicks
        if (this.transitionTime >= 3) {
            for (let i = 0; i < this.buttons.length; i++) {
                const button = this.buttons[i];
                const pos = this.getButtonPosition(i);
                
                if (x >= pos.x && x <= pos.x + pos.width && 
                    y >= pos.y && y <= pos.y + pos.height) {
                    // Play button click SFX
                    if (this.stateManager.audioManager) {
                        this.stateManager.audioManager.playSFX('button-click');
                    }
                    this.handleButtonAction(button.action);
                    return;
                }
            }
        }
    }

    handleButtonAction(action) {
        switch (action) {
            case 'newGame':
                this.stateManager.startNewGame();
                break;
            case 'loadGame':
                this.stateManager.changeState('loadGame');
                break;
            case 'options':
                this.stateManager.previousState = 'startScreen';
                this.stateManager.changeState('options');
                break;
            case 'quitGame':
                this.quitGame();
                break;
        }
    }

    async quitGame() {
        try {
            // Helper to log both to console and localStorage
            const log = (msg) => {
                console.log(msg);
                // Also store in localStorage as backup
                try {
                    let logs = localStorage.getItem('touwers_quit_logs') || '';
                    const timestamp = new Date().toISOString();
                    logs += `[${timestamp}] ${msg}\n`;
                    localStorage.setItem('touwers_quit_logs', logs);
                } catch (e) {
                    // localStorage might fail
                }
            };
            
            log('StartScreen: quitGame called');
            
            // Trigger game shutdown cleanup first
            if (this.stateManager && this.stateManager.game && this.stateManager.game.shutdown) {
                log('StartScreen: Calling game.shutdown()');
                this.stateManager.game.shutdown();
                log('StartScreen: game.shutdown() completed');
            }
            
            // Give a brief moment for cleanup to propagate
            await new Promise(resolve => setTimeout(resolve, 100));
            log('StartScreen: Cleanup delay complete');
            
            // Check if invoke is available
            if (invoke) {
                log('StartScreen: invoke function available, calling close_app');
                try {
                    const result = await invoke('close_app');
                    log('StartScreen: invoke returned: ' + JSON.stringify(result));
                } catch (invokeError) {
                    log('StartScreen: invoke failed: ' + invokeError.message);
                    throw invokeError;
                }
            } else {
                log('StartScreen: invoke not available, cannot close app via Tauri');
                // Fallback - attempt window.close() even though it will likely fail
                window.close();
            }
        } catch (error) {
            const errMsg = 'StartScreen: Error - ' + error.message;
            console.error(errMsg, error);
            
            try {
                let logs = localStorage.getItem('touwers_quit_logs') || '';
                const timestamp = new Date().toISOString();
                logs += `[${timestamp}] ${errMsg}\n`;
                logs += `[${timestamp}] Stack: ${error.stack}\n`;
                localStorage.setItem('touwers_quit_logs', logs);
            } catch (e) {
                // localStorage might fail
            }
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
            
            // Play sword sound at 0.3 of sword phase (0.21 seconds into transition)
            const swordDuration = 0.7; // 0.7 seconds
            const swordSoundTime = swordDuration * 0.3; // 0.3 of sword phase
            if (!this.swordSoundPlayed && this.transitionTime >= swordSoundTime && this.transitionTime < swordSoundTime + deltaTime) {
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('sword-smoke');
                }
                this.swordSoundPlayed = true;
            }
            
            // After 3-second transition completes, transition time stays at 3 seconds (final state)
            if (this.transitionTime >= 3) {
                this.transitionTime = 3;
                this.transitionActive = false; // Animation complete, allow button clicks
            }
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
        const totalDuration = 3; // Total transition time - 3 seconds
        const progress = Math.min(1, this.transitionTime / totalDuration);

        if (progress < 0.01) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 + 80; // Moved down below "Defend the Realm" text

        // PHASE 1: Sword clash (0 - 0.7 seconds)
        const swordDuration = 0.7 / totalDuration; // 0.7 seconds out of 3
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

        // PHASE 2: Smoke appearance and fade (0.7 - 2 seconds)
        const smokeStartTime = swordDuration; // 0.7 seconds / 3
        const smokeDuration = (1.3 / totalDuration); // 1.3 seconds of smoke effect
        
        if (progress >= smokeStartTime && progress < (smokeStartTime + smokeDuration)) {
            const smokePhaseProgress = (progress - smokeStartTime) / smokeDuration;
            
            // Render buttons right away as smoke appears
            const buttonRenderStartTime = 0.05 / 1.3; // 0.05 seconds into 1.3 second phase
            if (smokePhaseProgress >= buttonRenderStartTime) {
                ctx.globalAlpha = 1;
                this.renderMenuButtons(ctx);
            }
            
            // NOW render dense natural smoke clouds covering entire bottom half
            // This will be drawn ON TOP of the buttons
            ctx.globalAlpha = 1;
            
            // Create a dense, natural-looking smoke screen with many overlapping clouds
            const cloudCount = 50; // Many clouds for full coverage
            for (let i = 0; i < cloudCount; i++) {
                // Distribute clouds across entire bottom half with variation
                const col = i % 10;
                const row = Math.floor(i / 10);
                
                // Grid-based placement with smooth variation for natural look
                const baseX = (col + 0.5) * (canvas.width / 10) + Math.sin(i * 0.3) * 40;
                const baseY = (canvas.height * 0.45) + (row * (canvas.height * 0.18)) + Math.cos(i * 0.2) * 35;
                
                // More consistent cloud sizes for natural look
                const cloudSize = 100 + Math.sin(i * 0.5) * 25;
                
                // Smoke appears quickly (0.1 second), then fades gradually
                let cloudOpacity = 0.45;
                const fillDuration = 0.1 / 1.3; // 0.1 seconds into smoke phase
                const fadeDuration = 1.0 / 1.3; // 1.0 second gradual fade
                const fadeStartInPhase = fillDuration; // Fade starts right after fill
                
                if (smokePhaseProgress < fillDuration) {
                    // Filling phase - clouds appear quickly (first 0.1 second)
                    cloudOpacity = 0.45 * (smokePhaseProgress / fillDuration);
                } else if (smokePhaseProgress > fadeStartInPhase) {
                    // Fading phase - smooth gradual fade out
                    const fadeProgress = (smokePhaseProgress - fadeStartInPhase) / fadeDuration;
                    cloudOpacity = 0.45 * Math.max(0, 1 - fadeProgress);
                } else {
                    cloudOpacity = 0.45; // Full opacity between fill and fade (minimal)
                }
                
                this.drawSilkySmokeCloud(ctx, baseX, baseY, cloudSize, cloudOpacity, i);
            }

            // Additional larger background clouds for complete coverage and depth
            for (let y = canvas.height * 0.4; y < canvas.height; y += 100) {
                for (let x = 0; x < canvas.width; x += 150) {
                    const cloudSize = 130 + Math.sin(x * 0.008) * 35;
                    
                    let cloudOpacity = 0.35;
                    const fillDuration = 0.1 / 1.3;
                    const fadeDuration = 1.0 / 1.3;
                    const fadeStartInPhase = fillDuration;
                    
                    if (smokePhaseProgress < fillDuration) {
                        cloudOpacity = 0.35 * (smokePhaseProgress / fillDuration);
                    } else if (smokePhaseProgress > fadeStartInPhase) {
                        const fadeProgress = (smokePhaseProgress - fadeStartInPhase) / fadeDuration;
                        cloudOpacity = 0.35 * Math.max(0, 1 - fadeProgress);
                    } else {
                        cloudOpacity = 0.35;
                    }
                    
                    if (cloudOpacity > 0) {
                        this.drawSilkySmokeCloud(ctx, x, y, cloudSize, cloudOpacity, x + y);
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

    drawSilkySmokeCloud(ctx, x, y, size, opacity, seed) {
        if (opacity <= 0) return;
        
        ctx.globalAlpha = opacity;
        
        // Very subtle, natural smoke colors - no harsh grays
        const colors = [
            'rgba(165, 165, 165, 0.6)',  // Main body - lighter and more opaque
            'rgba(175, 175, 175, 0.5)',  // Secondary
            'rgba(150, 150, 150, 0.4)',  // Transition
            'rgba(155, 155, 155, 0.3)'   // Wisps
        ];
        
        // Main spherical cloud body - soft and billowing
        ctx.fillStyle = colors[0];
        ctx.beginPath();
        ctx.arc(x, y, size * 0.98, 0, Math.PI * 2);
        ctx.fill();

        // Multiple smooth, natural bulges for fluffy appearance
        ctx.fillStyle = colors[1];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            // Smooth sine wave for consistent bulge sizes - no flickering
            const bulgeVariation = Math.sin(seed * 0.4 + angle) * 0.12 + Math.cos(seed * 0.2 + angle) * 0.08;
            const radius = size * (0.68 + bulgeVariation);
            const bx = x + Math.cos(angle) * radius;
            const by = y + Math.sin(angle) * radius;
            const bulgeSize = size * (0.58 + bulgeVariation * 0.5);
            ctx.beginPath();
            ctx.arc(bx, by, bulgeSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Top billowing formation - three peaks for natural mushroom look
        ctx.fillStyle = colors[2];
        // Left top
        ctx.beginPath();
        ctx.arc(x - size * 0.4, y - size * 0.5, size * 0.72, 0, Math.PI * 2);
        ctx.fill();
        // Center top - tallest
        ctx.beginPath();
        ctx.arc(x, y - size * 0.65, size * 0.82, 0, Math.PI * 2);
        ctx.fill();
        // Right top
        ctx.beginPath();
        ctx.arc(x + size * 0.4, y - size * 0.5, size * 0.72, 0, Math.PI * 2);
        ctx.fill();
        
        // Additional soft filler spheres for silky smooth transition
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + (seed * 0.1);
            const fillX = x + Math.cos(angle) * size * 0.3;
            const fillY = y + Math.sin(angle) * size * 0.25;
            const fillSize = size * (0.4 + Math.sin(seed * 0.3 + i) * 0.1);
            ctx.beginPath();
            ctx.arc(fillX, fillY, fillSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Wispy, feathered edges for soft silky appearance
        ctx.globalAlpha = opacity * 0.2;
        ctx.fillStyle = colors[3];
        for (let i = 0; i < 8; i++) {
            // Smooth continuous variation - no random flickering
            const wispAngle = (i / 8) * Math.PI * 2;
            const wispDistance = size * (0.5 + Math.sin(seed * 0.3 + wispAngle) * 0.2);
            const wispX = x + Math.cos(wispAngle) * wispDistance;
            const wispY = y + Math.sin(wispAngle) * wispDistance;
            const wispSize = size * (0.3 + Math.cos(seed * 0.4 + i * 0.6) * 0.1);
            ctx.beginPath();
            ctx.arc(wispX, wispY, wispSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Very subtle outer wisps for softness
        ctx.globalAlpha = opacity * 0.08;
        for (let i = 0; i < 6; i++) {
            const outerAngle = (i / 6) * Math.PI * 2 + (seed * 0.2);
            const outerDistance = size * (0.8 + Math.sin(seed * 0.25 + i) * 0.3);
            const outerX = x + Math.cos(outerAngle) * outerDistance;
            const outerY = y + Math.sin(outerAngle) * outerDistance;
            const outerSize = size * (0.25 + Math.cos(seed * 0.5 + i) * 0.08);
            ctx.beginPath();
            ctx.arc(outerX, outerY, outerSize, 0, Math.PI * 2);
            ctx.fill();
        }
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

            // Continue message - only show before transition starts
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
            
            // After transition completes, show menu buttons
            if (this.transitionTime >= 3) {
                this.renderMenuButtons(ctx);
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

        // Render all buttons
        ctx.globalAlpha = 1;
        for (let i = 0; i < this.buttons.length; i++) {
            const button = this.buttons[i];
            const pos = this.getButtonPosition(i);
            this.renderControlButton(ctx, pos.x, pos.y, pos.width, pos.height, button.label, button.hovered);
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
