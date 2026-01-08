import { LootRegistry } from '../../entities/loot/LootRegistry.js';
import { SaveSystem } from '../SaveSystem.js';

/**
 * ResultsScreen - In-game modal for displaying level completion with animations
 * Features: Count-up stats, sequential loot reveal, dopamine-driven animations
 */
export class ResultsScreen {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.isShowing = false;
        this.resultType = null; // 'levelComplete' or 'gameOver'
        this.resultData = null;
        this.acquiredLoot = []; // Array of loot IDs acquired

        // Defeat screen motivational quotes
        this.defeatQuotes = [
            "A general who retreats fights another day.",
            "Victory is not measured by a single battle, but by the will to continue.",
            "The strongest generals are forged in the fires of defeat.",
            "Every great empire faced setbacks before reaching glory.",
            "This defeat is but a lesson. Learn it well.",
            "Regroup. Refocus. Rise stronger than before.",
            "The path to legend runs through valleys of failure.",
            "Your enemies celebrate now, make them regret it later.",
            "Defeat tests your resolve. Prove you have it.",
            "The realm needs a leader who rises after falling."
        ];
        this.selectedDefeatQuote = '';

        // Animation phases
        this.animationPhase = 'victory'; // victory, countup, loot, buttons
        this.phaseTime = 0;
        this.phaseDuration = {
            victory: 2.0,    // Sword clash VICTORY animation - 3 seconds
            countup: 3.0,    // Slower score counting
            loot: 4.0,       // Slower loot reveal
            buttons: 0.5
        };
        
        // Layout constants
        this.modalWidth = 800;
        this.modalHeight = 700;
        this.padding = 40;
        this.buttonWidth = 200;
        this.buttonHeight = 60;
        this.buttonGap = 40;

        // Stats for animation
        this.stats = {
            enemiesSlain: 0,
            goldEarned: 0,
            goldRemaining: 0,
            displayEnemiesSlain: 0,
            displayGoldEarned: 0,
            displayGoldRemaining: 0
        };

        // Loot animation state
        this.lootAnimationIndex = 0;
        this.lootAnimationTime = 0; // Track cumulative time for loot animation (doesn't reset on phase change)
        this.lootDisplayItems = []; // { lootId, x, y, animationTime }

        // Button state
        this.buttons = [];
        this.selectedButtonIndex = 0;

        // Particle effects
        this.particles = [];
    }

    /**
     * Show the results screen with specific data
     */
    show(type, data, acquiredLoot = []) {
        this.resultType = type;
        this.resultData = data;
        this.acquiredLoot = acquiredLoot;
        this.isShowing = true;
        this.phaseTime = 0;
        this.lootAnimationTime = 0; // Reset cumulative loot animation time
        this.lootAnimationIndex = 0;
        this.particles = [];
        this.selectedButtonIndex = 0;

        // For gameOver, skip victory animation and go straight to defeat screen
        if (type === 'gameOver') {
            this.animationPhase = 'defeat';
            // Select a random defeat quote
            this.selectedDefeatQuote = this.defeatQuotes[Math.floor(Math.random() * this.defeatQuotes.length)];
            // Play defeat music immediately
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.stopMusic();
                this.stateManager.audioManager.playSFX('defeat-tune');
            }
        } else {
            // For levelComplete, start with victory animation
            this.animationPhase = 'victory';
            // Play victory tune immediately at the start of the animation
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.stopMusic();
                this.stateManager.audioManager.playSFX('victory-tune');
            }
        }

        // Extract stats from result data
        this.stats = {
            enemiesSlain: data.enemiesSlain || 0,
            goldEarned: data.goldEarned || 0,
            goldRemaining: data.currentGold || 0,
            displayEnemiesSlain: 0,
            displayGoldEarned: 0,
            displayGoldRemaining: 0
        };

        // Calculate loot phase duration based on number of items (1 item per second)
        // Minimum 4 seconds, or longer if more items
        const itemsPerSecond = 1.0;
        const minLootDuration = 4.0;
        this.phaseDuration.loot = Math.max(minLootDuration, acquiredLoot.length / itemsPerSecond);

        // Setup buttons
        console.log('ResultsScreen.show() - Setting up buttons for type:', type);
        if (type === 'levelComplete') {
            this.buttons = [
                { label: 'RETURN TO SETTLEMENT', action: 'settlement' },
                { label: 'NEXT LEVEL', action: 'nextLevel' }
            ];
        } else {
            this.buttons = [
                { label: 'RETRY', action: 'retry' },
                { label: 'RETURN TO SETTLEMENT', action: 'settlement' }
            ];
        }
        console.log('ResultsScreen.show() - Buttons set:', this.buttons);
    }

    /**
     * Execute action when button is clicked
     */
    execute(action) {
        // Trim action string in case there's extra whitespace
        action = String(action).trim();
        console.log('ResultsScreen.execute() called with action:', action, '(type:', typeof action, ', length:', action.length, ')');
        this.isShowing = false;
        
        // Stop music
        if (this.stateManager.audioManager) {
            if (this.stateManager.audioManager.currentSFXTune) {
                this.stateManager.audioManager.currentSFXTune.pause();
                this.stateManager.audioManager.currentSFXTune.currentTime = 0;
                this.stateManager.audioManager.currentSFXTune = null;
            }
            this.stateManager.audioManager.stopMusic();
        }
        
        // Transfer loot to inventory
        this.transferLootToInventory();
        
        // Execute action
        switch (action) {
            case 'settlement':
                console.log('Going to settlement');
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playRandomSettlementTheme();
                }
                this.stateManager.changeState('settlementHub');
                break;
            case 'nextLevel':
                console.log('Going to next level');
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playRandomSettlementTheme();
                }
                this.stateManager.selectedLevelInfo = {
                    level: this.resultData.level + 1
                };
                this.stateManager.changeState('levelSelect');
                break;
            case 'retry':
                console.log('Retrying level');
                this.stateManager.changeState('game');
                break;
            case 'levelSelect':
                console.log('Going to level select');
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playRandomSettlementTheme();
                }
                this.stateManager.changeState('levelSelect');
                break;
        }
    }

    /**
     * Transfer loot to inventory
     */
    transferLootToInventory() {
        if (!this.acquiredLoot || this.acquiredLoot.length === 0) {
            // console.log('No loot to transfer');
            return;
        }

        if (!this.stateManager.playerInventory) {
            this.stateManager.playerInventory = [];
        }

        for (const lootId of this.acquiredLoot) {
            const existingItem = this.stateManager.playerInventory.find(
                item => item.lootId === lootId
            );

            if (existingItem) {
                existingItem.count = (existingItem.count || 1) + 1;
            } else {
                this.stateManager.playerInventory.push({
                    lootId: lootId,
                    count: 1
                });
            }
        }
        // console.log('Transferred loot to inventory:', this.stateManager.playerInventory);
    }

    /**
     * Update animations
     */
    update(deltaTime) {
        if (!this.isShowing) return;

        this.phaseTime += deltaTime;

        // Handle phase transitions for victory screen
        if (this.animationPhase === 'victory' && this.phaseTime >= this.phaseDuration.victory) {
            // Victory animation complete - move to countup
            this.animationPhase = 'countup';
            this.phaseTime = 0;
            console.log('Phase transition: victory -> countup');
        } else if (this.animationPhase === 'countup' && this.phaseTime >= this.phaseDuration.countup) {
            this.animationPhase = 'loot';
            this.phaseTime = 0;
            this.lootAnimationIndex = 0;
            console.log('Phase transition: countup -> loot, buttons are:', JSON.stringify(this.buttons));
        } else if (this.animationPhase === 'loot' && this.phaseTime >= this.phaseDuration.loot) {
            this.animationPhase = 'buttons';
            this.phaseTime = 0;
            // Don't reset lootAnimationTime - it continues for rendering
            console.log('Phase transition: loot -> buttons, buttons are:', JSON.stringify(this.buttons));
        }

        // Track cumulative loot animation time (continues even after phase transition)
        if (this.animationPhase === 'loot' || this.animationPhase === 'buttons') {
            this.lootAnimationTime += deltaTime;
        }

        // Update count-up animations
        if (this.animationPhase === 'countup') {
            const progress = this.phaseTime / this.phaseDuration.countup;
            this.stats.displayEnemiesSlain = Math.floor(this.stats.enemiesSlain * progress);
            this.stats.displayGoldEarned = Math.floor(this.stats.goldEarned * progress);
            this.stats.displayGoldRemaining = Math.floor(this.stats.goldRemaining * progress);
        } else if (this.animationPhase === 'loot' || this.animationPhase === 'buttons') {
            this.stats.displayEnemiesSlain = this.stats.enemiesSlain;
            this.stats.displayGoldEarned = this.stats.goldEarned;
            this.stats.displayGoldRemaining = this.stats.goldRemaining;
        }

        // Update loot animations - with stagger for pop-in effect
        if (this.animationPhase === 'loot') {
            const itemsPerSecond = 1.0; // Even slower reveal - matches renderLoot setting
            const expectedIndex = Math.floor(this.phaseTime * itemsPerSecond);
            
            while (this.lootAnimationIndex < expectedIndex && this.lootAnimationIndex < this.acquiredLoot.length) {
                const lootId = this.acquiredLoot[this.lootAnimationIndex];
                const lootInfo = LootRegistry.getLootType(lootId);
                this.spawnLootAnimation(this.lootAnimationIndex, lootInfo?.rarity === 'legendary');
                this.lootAnimationIndex++;
            }
        }

        // Update particle effects
        this.particles = this.particles.filter(p => {
            p.life -= deltaTime;
            return p.life > 0;
        });

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += p.gravity * deltaTime;
        }
    }

    /**
     * Spawn loot reveal animation
     */
    spawnLootAnimation(index, isLegendary = false) {
        const lootId = this.acquiredLoot[index];
        if (!lootId) return;

        // Play collect sound
        if (this.stateManager.audioManager) {
            if (isLegendary) {
                this.stateManager.audioManager.playSFX('legendary-drop');
            } else {
                this.stateManager.audioManager.playSFX('coin-collect');
            }
        }

        // Create particles - more for legendary
        const canvas = this.stateManager.canvas;
        const modalX = (canvas.width - this.modalWidth) / 2;
        const baseY = (canvas.height - this.modalHeight) / 2 + 200;
        const centerX = modalX + this.modalWidth / 2;
        
        const particleCount = isLegendary ? 12 : 6;
        const lifetime = isLegendary ? 0.8 : 0.5;
        const speed = isLegendary ? 280 : 200;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            this.particles.push({
                x: centerX,
                y: baseY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 300,
                life: lifetime,
                maxLife: lifetime,
                color: this.getRarityColor(lootId)
            });
        }
    }

    /**
     * Get rarity color for loot
     */
    getRarityColor(lootId) {
        const lootInfo = LootRegistry.getLootType(lootId);
        if (!lootInfo) return '#FFD700';

        const rarity = lootInfo.rarity;
        const colors = {
            'common': '#C9A961',
            'uncommon': '#4FC3F7',
            'rare': '#AB47BC',
            'epic': '#FF6F00',
            'legendary': '#FFD700'
        };
        return colors[rarity] || '#FFD700';
    }

    /**
     * Handle keyboard input
     */
    handleKeyPress(key) {
        if (!this.isShowing) return;

        // Only allow button interactions during buttons phase
        if (this.animationPhase !== 'buttons') return;

        if (key === 'ArrowLeft') {
            this.selectedButtonIndex = Math.max(0, this.selectedButtonIndex - 1);
        } else if (key === 'ArrowRight') {
            this.selectedButtonIndex = Math.min(this.buttons.length - 1, this.selectedButtonIndex + 1);
        } else if (key === 'Enter') {
            this.execute(this.buttons[this.selectedButtonIndex].action);
        }
    }

    /**
     * Handle click on modal
     */
    handleClick(x, y) {
        if (!this.isShowing) return;
        
        // Allow button clicks during buttons phase (normal results) or defeat phase
        if (this.animationPhase !== 'buttons' && this.animationPhase !== 'defeat') return;

        console.log('handleClick - checking buttons, current phase:', this.animationPhase, 'buttons count:', this.buttons.length);
        this.buttons.forEach((button, index) => {
            const pos = this.getButtonPosition(index);
            console.log(`Button ${index} (${button.action}): pos=`, pos, `click=(${x},${y})`);
            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {
                console.log(`Clicked button: ${button.action}`);
                this.execute(button.action);
            }
        });
    }

    /**
     * Get button position
     */
    getButtonPosition(index) {
        const canvas = this.stateManager.canvas;
        const isDefeatScreen = this.animationPhase === 'defeat';
        
        let buttonsStartX, buttonsY;
        
        if (isDefeatScreen) {
            // Center buttons on defeat screen
            const totalButtonWidth = this.buttons.length * this.buttonWidth + (this.buttons.length - 1) * this.buttonGap;
            buttonsStartX = (canvas.width - totalButtonWidth) / 2;
            buttonsY = canvas.height / 2 + 200;
        } else {
            // Normal results screen button positioning
            const modalX = (canvas.width - this.modalWidth) / 2;
            const modalY = (canvas.height - this.modalHeight) / 2;
            const totalButtonWidth = this.buttons.length * this.buttonWidth + (this.buttons.length - 1) * this.buttonGap;
            buttonsStartX = modalX + (this.modalWidth - totalButtonWidth) / 2;
            buttonsY = modalY + this.modalHeight - this.padding - this.buttonHeight;
        }

        return {
            x: buttonsStartX + index * (this.buttonWidth + this.buttonGap),
            y: buttonsY,
            width: this.buttonWidth,
            height: this.buttonHeight
        };
    }

    /**
     * Render the results screen
     */
    render(ctx) {
        if (!this.isShowing) return;

        const canvas = this.stateManager.canvas;
        const modalX = (canvas.width - this.modalWidth) / 2;
        const modalY = (canvas.height - this.modalHeight) / 2;

        // Draw defeat screen (no animations, just buttons and quote)
        if (this.animationPhase === 'defeat') {
            this.renderDefeatScreen(ctx, canvas);
        }
        // Draw victory animation
        else if (this.animationPhase === 'victory') {
            // Victory animation takes over the whole screen
            this.renderVictoryAnimation(ctx, canvas);
        }
        // Draw results screen (stats and loot)
        else {
            // Draw semi-transparent background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw modal background
            ctx.fillStyle = '#2A2A2A';
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.fillRect(modalX, modalY, this.modalWidth, this.modalHeight);
            ctx.strokeRect(modalX, modalY, this.modalWidth, this.modalHeight);

            // Render stats and loot panel content
            this.renderTitle(ctx, modalX, modalY);
            this.renderStats(ctx, modalX, modalY);
            
            // Always render loot once we're in the loot or buttons phase
            if (this.animationPhase === 'loot' || this.animationPhase === 'buttons') {
                this.renderLoot(ctx, modalX, modalY);
            }
            
            // Render buttons ONLY during buttons phase (not during loot to prevent flashing)
            if (this.animationPhase === 'buttons') {
                this.renderButtons(ctx, modalX, modalY);
            }
        }

        // Draw particles
        this.renderParticles(ctx);
    }

    /**
     * Render victory animation - sword clash with VICTORY text bursting out
     * Uses the exact sword clash animation from StartScreen for consistency
     */
    renderVictoryAnimation(ctx, canvas) {
        const progress = this.phaseTime / this.phaseDuration.victory;
        
        // Animation phases: 0-0.45 = sword clash, 0.45-1.0 = victory text burst
        const clashPhase = Math.min(progress / 0.45, 1.0);
        const victoryPhase = Math.max((progress - 0.45) / 0.55, 0);
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // Draw dark background overlay for contrast
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        
        // === SWORD CLASH PHASE (0-0.45) ===
        if (clashPhase < 1.0) {
            this.renderSwordClash(ctx, clashPhase);
        }
        
        // === VICTORY BURST PHASE (0.45-1.0) ===
        if (victoryPhase > 0) {
            this.renderVictoryBurst(ctx, victoryPhase);
        }
        
        ctx.restore();
    }

    /**
     * Render two swords clashing - using the exact medieval sword animation from StartScreen
     */
    renderSwordClash(ctx, progress) {
        // Matching the StartScreen animation timing
        const swordDuration = 0.7;
        const swordProgress = Math.min(progress / swordDuration, 1);
        
        // Sword movement - swords meet at 40% of sword phase
        const leftSwordProgress = Math.min(swordProgress / 0.4, 1.2);
        const rightSwordProgress = Math.min(swordProgress / 0.4, 1.2);
        
        // Calculate swing motion
        const leftSwingAngle = -Math.PI / 4 + (leftSwordProgress * 0.4);
        const rightSwingAngle = Math.PI / 4 - (rightSwordProgress * 0.4);
        
        // Draw swords
        ctx.globalAlpha = Math.min(1, swordProgress * 2);
        
        // Left sword
        const leftSwordX = -250 + (leftSwordProgress * 250);
        ctx.save();
        ctx.translate(leftSwordX, 0);
        ctx.rotate(leftSwingAngle);
        this.drawMedievalSword(ctx, 0, 0, '#c0c0c0', '#8b7355', 1.4);
        ctx.restore();

        // Right sword
        const rightSwordX = 250 - (rightSwordProgress * 250);
        ctx.save();
        ctx.translate(rightSwordX, 0);
        ctx.rotate(rightSwingAngle);
        this.drawMedievalSword(ctx, 0, 0, '#d4af37', '#8b7355', 1.4);
        ctx.restore();

        // Subtle clash flash at sword meeting point (matching StartScreen)
        if (swordProgress > 0.35) {
            const flashProgress = Math.min(1, (swordProgress - 0.35) / 0.15);
            const flashOpacity = (1 - flashProgress) * 0.3;
            
            ctx.globalAlpha = flashOpacity * 0.3;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 80 * flashProgress, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }

    /**
     * Draw a medieval sword with proper detail
     */
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

    /**
     * Render VICTORY text bursting out from sword clash with dopamine-inducing pop effect
     */
    renderVictoryBurst(ctx, progress) {
        // Pop-in flash effect: quick scale with dopamine flash
        const popDuration = 0.15; // 150ms pop-in effect
        const popProgress = Math.min(progress / popDuration, 1);
        
        // Quick bounce/pop-in using cubic ease-out
        const popScale = Math.pow(popProgress, 0.5) * (1 + (1 - popProgress) * 0.3);
        
        // After pop, smooth scale expansion
        const expandProgress = Math.max(0, (progress - popDuration) / (1 - popDuration));
        const expandScale = 1 + expandProgress * 0.3;
        
        // Combine pop and expand
        const baseScale = popProgress < 1 ? popScale : expandScale;
        const alpha = Math.min(progress * 2.5, 1);
        
        // === DOPAMINE FLASH EFFECT ===
        // Bright white flash on initial pop (0-0.1s)
        if (popProgress < 0.7) {
            const flashAlpha = (1 - popProgress) * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
            ctx.beginPath();
            ctx.arc(0, 0, 300 * popScale, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Radiant glow burst
        if (popProgress < 1) {
            const burstAlpha = (1 - popProgress) * 0.4;
            ctx.strokeStyle = `rgba(255, 215, 0, ${burstAlpha})`;
            ctx.lineWidth = 3;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const distance = 150 + popProgress * 100;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * distance, Math.sin(angle) * distance);
                ctx.stroke();
            }
        }
        
        // Draw VICTORY text
        ctx.save();
        ctx.scale(baseScale, baseScale);
        ctx.globalAlpha = alpha;
        
        // Medieval-themed font with strong presence
        ctx.font = 'bold 160px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Deep golden glow layers (creating depth and professionalism)
        ctx.globalAlpha = alpha * 0.4;
        for (let i = 30; i > 0; i -= 3) {
            const glossAlpha = (30 - i) / 30 * 0.3;
            ctx.fillStyle = `rgba(201, 169, 97, ${glossAlpha})`;
            ctx.lineWidth = i;
            ctx.strokeText('VICTORY!!', 0, 0);
        }
        
        // Primary brilliant gold text
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFD700';
        ctx.fillText('VICTORY!!', 0, 0);
        
        // Secondary outline for more definition
        ctx.strokeStyle = '#C9A961';
        ctx.lineWidth = 3;
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeText('VICTORY!!', 0, 0);
        
        // Shimmer particles around text
        ctx.globalAlpha = alpha;
        const shimmerCount = 20;
        for (let i = 0; i < shimmerCount; i++) {
            const angle = (i / shimmerCount) * Math.PI * 2 + progress * Math.PI;
            const baseDistance = 200;
            const distance = baseDistance + Math.sin(progress * Math.PI * 3 + angle) * 50;
            const sx = Math.cos(angle) * distance;
            const sy = Math.sin(angle) * distance;
            
            // Cycling shimmer colors (gold, white, bronze)
            const shimmerVariant = i % 3;
            let shimmerColor;
            if (shimmerVariant === 0) {
                shimmerColor = '#FFD700';
            } else if (shimmerVariant === 1) {
                shimmerColor = '#FFFFFF';
            } else {
                shimmerColor = '#C9A961';
            }
            
            ctx.fillStyle = shimmerColor;
            ctx.globalAlpha = alpha * Math.max(0, Math.sin(progress * Math.PI + angle)) * 0.8;
            ctx.beginPath();
            ctx.arc(sx, sy, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    /**
     * Render defeat screen with motivational quote
     */
    renderDefeatScreen(ctx, canvas) {
        // Draw dark background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Draw defeat title
        ctx.fillStyle = '#8B0000'; // Dark red
        ctx.font = 'bold 80px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DEFEAT', centerX, centerY - 150);

        // Draw motivational quote
        ctx.fillStyle = '#C9A961'; // Gold
        ctx.font = 'italic 28px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Word wrap the quote if needed
        const maxWidth = canvas.width - 200;
        const words = this.selectedDefeatQuote.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }

        const lineHeight = 40;
        const totalHeight = (lines.length - 1) * lineHeight;
        let yPos = centerY - 20 - totalHeight / 2;

        for (const line of lines) {
            ctx.fillText(line, centerX, yPos);
            yPos += lineHeight;
        }

        // Draw buttons
        this.renderButtons(ctx, 0, 0);
    }

    /**
     * Render title
     */
    renderTitle(ctx, modalX, modalY) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(
            this.resultType === 'levelComplete' ? 'LEVEL COMPLETE!' : 'MISSION FAILED',
            modalX + this.modalWidth / 2,
            modalY + this.padding
        );
    }

    /**
     * Render statistics with count-up animations
     */
    renderStats(ctx, modalX, modalY) {
        const startY = modalY + this.padding + 60;
        const lineHeight = 50;
        const leftX = modalX + this.padding + 50;
        const rightX = modalX + this.modalWidth / 2 + 50;

        ctx.font = '18px Arial';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        // Enemies slain
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Enemies Slain:', leftX, startY);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(this.stats.displayEnemiesSlain.toString(), leftX + 200, startY);

        // Gold earned
        ctx.font = '18px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Gold Earned:', rightX, startY);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(this.stats.displayGoldEarned.toString(), rightX + 150, startY);

        // Gold remaining
        ctx.font = '18px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Gold Remaining:', leftX, startY + lineHeight);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(this.stats.displayGoldRemaining.toString(), leftX + 200, startY + lineHeight);

        // Score (calculated from stats)
        const score = Math.floor(
            (this.stats.displayEnemiesSlain * 10) +
            (this.stats.displayGoldEarned * 0.5)
        );
        ctx.font = '18px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Score:', rightX, startY + lineHeight);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(score.toString(), rightX + 150, startY + lineHeight);
    }

    /**
     * Render loot items sequentially
     */
    renderLoot(ctx, modalX, modalY) {
        const startY = modalY + this.padding + 180;
        const itemsPerRow = 5;      // 5 items per row
        const itemsPerPage = 15;    // 3 rows x 5 items = 15 per page
        const itemWidth = 130;
        const itemHeight = 90;
        const itemGap = 8;
        const containerX = modalX + (this.modalWidth - (itemsPerRow * itemWidth + (itemsPerRow - 1) * itemGap)) / 2;
        const maxHeight = modalY + this.modalHeight - this.padding - 60; // Leave space for buttons

        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Calculate which items should be visible based on loot animation progress
        // Use lootAnimationTime which doesn't reset on phase transitions
        const lootTime = this.lootAnimationTime || 0;
        const itemsPerSecond = 1.0; // 1 item per second
        const itemShowDuration = 1 / itemsPerSecond;

        let displayedCount = 0; // Count of items actually rendered on this page
        let globalCount = 0;    // Global count across all items
        
        for (let i = 0; i < this.acquiredLoot.length; i++) {
            const lootId = this.acquiredLoot[i];
            const lootInfo = LootRegistry.getLootType(lootId);
            if (!lootInfo) continue;

            // Calculate which page this item belongs to
            const pageNumber = Math.floor(globalCount / itemsPerPage);
            const pageItemIndex = globalCount % itemsPerPage;
            
            // Only render items on page 0
            if (pageNumber > 0) {
                globalCount++;
                continue;
            }

            // Calculate position
            const row = Math.floor(pageItemIndex / itemsPerRow);
            const col = pageItemIndex % itemsPerRow;
            const itemX = containerX + col * (itemWidth + itemGap);
            const itemY = startY + row * (itemHeight + itemGap);

            // Check if this item would overflow past the modal bottom
            if (itemY + itemHeight > maxHeight) {
                break; // Stop rendering if it would overflow
            }

            // Check if this item has been revealed yet based on global timing
            const itemRevealTime = globalCount * itemShowDuration;
            if (lootTime < itemRevealTime) {
                globalCount++;
                continue; // Not yet revealed, skip rendering
            }

            // Item should be rendered - calculate animation
            const timeSinceReveal = lootTime - itemRevealTime;
            const popDuration = 0.35; // Pop animation duration
            let popProgress = Math.min(timeSinceReveal / popDuration, 1);
            
            // Ease-out cubic for pop animation
            popProgress = 1 - Math.pow(1 - popProgress, 3);

            // Calculate pop scale (0.3 to 1.0 for more dramatic effect)
            const scale = 0.3 + popProgress * 0.7;
            const alpha = Math.min(timeSinceReveal / 0.15, 1); // Fade in quickly

            // Draw splash particles around the popping item
            if (popProgress < 1) {
                const splashParticleCount = 8;
                for (let p = 0; p < splashParticleCount; p++) {
                    const angle = (p / splashParticleCount) * Math.PI * 2;
                    const distance = popProgress * 60; // Splash spreads outward
                    const px = itemX + itemWidth / 2 + Math.cos(angle) * distance;
                    const py = itemY + itemHeight / 2 + Math.sin(angle) * distance;
                    
                    const rarityColor = this.getRarityColor(lootId);
                    ctx.fillStyle = rarityColor;
                    ctx.globalAlpha = alpha * (1 - popProgress) * 0.6; // Fade out as animation progresses
                    ctx.fillRect(px - 2, py - 2, 4, 4); // Small splash dots
                }
            }

            // Save context for transform
            ctx.save();
            ctx.translate(itemX + itemWidth / 2, itemY + itemHeight / 2);
            ctx.scale(scale, scale);
            ctx.globalAlpha = alpha;
            ctx.translate(-(itemWidth / 2), -(itemHeight / 2));

            // Draw loot tile background
            const rarityColor = this.getRarityColor(lootId);
            const isLegendary = lootInfo.rarity === 'legendary';
            
            ctx.fillStyle = rarityColor;
            ctx.globalAlpha = 0.2 * alpha;
            ctx.fillRect(0, 0, itemWidth, itemHeight);
            ctx.globalAlpha = alpha;

            // Draw border
            ctx.strokeStyle = rarityColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, itemWidth, itemHeight);

            // Draw static golden glow for legendary items (no pulsating)
            if (isLegendary) {
                ctx.strokeStyle = '#FFD700';
                ctx.globalAlpha = 0.4 * alpha; // Constant glow, not pulsating
                ctx.lineWidth = 1;
                ctx.strokeRect(-4, -4, itemWidth + 8, itemHeight + 8);
                ctx.globalAlpha = alpha;
            }

            // Draw emblem
            ctx.fillStyle = rarityColor;
            ctx.font = 'bold 28px Arial';
            ctx.fillText(lootInfo.emblem || '?', itemWidth / 2, 18);

            // Draw name
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '10px Arial';
            const words = lootInfo.name.split(' ');
            const textY = 40;
            for (let j = 0; j < words.length; j++) {
                ctx.fillText(words[j], itemWidth / 2, textY + j * 12);
            }

            // Draw value
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 11px Arial';
            ctx.fillText(`${lootInfo.sellValue}g`, itemWidth / 2, itemHeight - 8);

            ctx.restore();
            globalCount++;
            displayedCount++;
        }
    }

    /**
     * Render buttons (appear after animations)
     */
    renderButtons(ctx, modalX, modalY) {
        // Determine button positioning based on whether we're on defeat or results screen
        const isDefeatScreen = this.animationPhase === 'defeat';
        const canvas = this.stateManager.canvas;
        
        let buttonY, startX;
        
        if (isDefeatScreen) {
            // Center buttons on the defeat screen
            buttonY = canvas.height / 2 + 200;
            const totalButtonWidth = this.buttons.length * this.buttonWidth + (this.buttons.length - 1) * this.buttonGap;
            startX = (canvas.width - totalButtonWidth) / 2;
        } else {
            // Normal results screen button positioning
            buttonY = modalY + this.modalHeight - this.padding - this.buttonHeight;
            const totalButtonWidth = this.buttons.length * this.buttonWidth + (this.buttons.length - 1) * this.buttonGap;
            startX = modalX + (this.modalWidth - totalButtonWidth) / 2;
        }

        console.log('renderButtons - button count:', this.buttons.length, 'positions:');
        this.buttons.forEach((button, index) => {
            const x = startX + index * (this.buttonWidth + this.buttonGap);
            console.log(`Button ${index} (${button.action}): x=${x}, y=${buttonY}, w=${this.buttonWidth}, h=${this.buttonHeight}`);
            
            // Button background
            const isSelected = index === this.selectedButtonIndex;
            ctx.fillStyle = isSelected ? '#FFD700' : '#4A4A4A';
            ctx.fillRect(x, buttonY, this.buttonWidth, this.buttonHeight);

            // Button border
            ctx.strokeStyle = isSelected ? '#FFFFFF' : '#FFD700';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.strokeRect(x, buttonY, this.buttonWidth, this.buttonHeight);

            // Button text
            ctx.fillStyle = isSelected ? '#000000' : '#FFD700';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(button.label, x + this.buttonWidth / 2, buttonY + this.buttonHeight / 2);
        });
    }

    /**
     * Render particle effects
     */
    renderParticles(ctx) {
        ctx.globalAlpha = 1;
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}
