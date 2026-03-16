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
        
        // Delay before showing the screen (5 seconds to let animations/loot finish)
        this.showDelay = 0;
        this.showDelayTime = 0;
        this.showDelayTimestamp = undefined;

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
            victory: 2.8,    // Sword clash + cinematic VICTORY text animation
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
    show(type, data, acquiredLoot = [], lootManager = null) {
        this.resultType = type;
        this.resultData = data;
        this.acquiredLoot = acquiredLoot;
        this.lootManager = lootManager; // Store reference to get latest loot
        this.isShowing = false; // Don't show yet - wait for delay
        this.phaseTime = 0;
        this.lootAnimationTime = 0; // Reset cumulative loot animation time
        this.lootAnimationIndex = 0;
        this.particles = [];
        this.selectedButtonIndex = 0;
        
        // Set delay before showing screen (3 seconds for level complete, 0 for game over)
        if (type === 'levelComplete') {
            this.showDelay = 3.0; // 3 seconds of real time
            this.showDelayTime = 0;
            this.showDelayTimestamp = undefined;
        } else {
            this.showDelay = 0;
            this.isShowing = true; // Show immediately for game over
        }

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
            // For levelComplete, start with victory animation phase
            this.animationPhase = 'victory';
        }

        // Extract stats from result data
        this.stats = {
            enemiesSlain: data.enemiesSlain || 0,
            goldEarned: data.goldEarned || 0,
            goldRemaining: data.currentGold || 0,
            timeTaken: data.timeTaken || 0,
            displayEnemiesSlain: 0,
            displayGoldEarned: 0,
            displayGoldRemaining: 0,
            displayTimeTaken: 0,
            displayScore: 0
        };

        // Calculate loot phase duration based on number of items (1 item per second)
        // No minimum - duration matches exactly the number of items
        const itemsPerSecond = 1.0;
        this.phaseDuration.loot = acquiredLoot.length / itemsPerSecond;

        // Setup buttons
        if (type === 'levelComplete') {
            if (data.noNextLevel) {
                // Last level of campaign - only return to settlement
                this.buttons = [
                    { label: 'RETURN TO SETTLEMENT', action: 'settlement' }
                ];
            } else {
                this.buttons = [
                    { label: 'RETURN TO SETTLEMENT', action: 'settlement' },
                    { label: 'RETURN TO CAMPAIGN MAP', action: 'campaignMap' }
                ];
            }
        } else {
            this.buttons = [
                { label: 'RETRY', action: 'retry' },
                { label: 'RETURN TO SETTLEMENT', action: 'settlement' }
            ];
        }
    }

    /**
     * Execute action when button is clicked
     */
    execute(action) {
        // Trim action string in case there's extra whitespace
        action = String(action).trim();
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
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playRandomSettlementTheme();
                }
                this.stateManager.changeState('settlementHub');
                break;
            case 'campaignMap':
            case 'nextLevel':
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playRandomSettlementTheme();
                }
                this.stateManager.changeState('levelSelect');
                break;
            case 'retry':
                this.stateManager.changeState('game');
                break;
            case 'levelSelect':
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
        // NOTE: Level gold is NOT transferred to settlement. Level gold is ephemeral.
        // Only marketplace gold (from selling items) persists between levels.
    }

    /**
     * Update animations
     */
    update(deltaTime) {
        // Handle delay before showing screen (for levelComplete only)
        if (this.showDelay > 0 && !this.isShowing) {
            // Use real time for the delay
            const currentRealTimestamp = performance.now() / 1000; // Convert to seconds
            if (this.showDelayTimestamp === undefined) {
                this.showDelayTimestamp = currentRealTimestamp;
            }
            
            const elapsedRealTime = currentRealTimestamp - this.showDelayTimestamp;
            if (elapsedRealTime >= this.showDelay) {
                // Delay complete - show the screen now
                // Update acquired loot to include any collected during the delay
                if (this.lootManager) {
                    this.acquiredLoot = this.lootManager.getCollectedLoot();
                }
                
                this.isShowing = true;
                this.showDelay = 0;
                
                // For levelComplete, play victory tune at the start of the animation
                if (this.resultType === 'levelComplete' && this.stateManager.audioManager) {
                    this.stateManager.audioManager.stopMusic();
                    this.stateManager.audioManager.playSFX('victory-tune');
                }
            } else {
                // Still waiting - don't update screen yet
                return;
            }
        }
        
        if (!this.isShowing) return;

        this.phaseTime += deltaTime;

        // Handle phase transitions for victory screen
        if (this.animationPhase === 'victory' && this.phaseTime >= this.phaseDuration.victory) {
            // Victory animation complete - move to countup
            this.animationPhase = 'countup';
            this.phaseTime = 0;
        } else if (this.animationPhase === 'countup' && this.phaseTime >= this.phaseDuration.countup) {
            this.animationPhase = 'loot';
            this.phaseTime = 0;
            this.lootAnimationIndex = 0;
        } else if (this.animationPhase === 'loot' && this.phaseTime >= this.phaseDuration.loot) {
            this.animationPhase = 'buttons';
            this.phaseTime = 0;
            // Don't reset lootAnimationTime - it continues for rendering
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
            this.stats.displayTimeTaken = this.stats.timeTaken;
            // Score counts up in the final 35% of countup — appears after other stats
            const scoreDelay = 0.65;
            const scoreProgress = Math.max(0, Math.min((progress - scoreDelay) / (1.0 - scoreDelay), 1));
            const finalScore = Math.floor(this.stats.enemiesSlain * 10 + this.stats.goldEarned * 0.5);
            this.stats.displayScore = Math.floor(finalScore * scoreProgress);
        } else if (this.animationPhase === 'loot' || this.animationPhase === 'buttons') {
            this.stats.displayEnemiesSlain = this.stats.enemiesSlain;
            this.stats.displayGoldEarned = this.stats.goldEarned;
            this.stats.displayGoldRemaining = this.stats.goldRemaining;
            this.stats.displayTimeTaken = this.stats.timeTaken;
            this.stats.displayScore = Math.floor(this.stats.enemiesSlain * 10 + this.stats.goldEarned * 0.5);
        }

        // Update loot animations - synced with lootAnimationTime to match renderLoot timing
        if (this.animationPhase === 'loot') {
            const itemsPerSecond = 1.0;
            const expectedIndex = Math.floor(this.lootAnimationTime * itemsPerSecond);

            while (this.lootAnimationIndex <= expectedIndex && this.lootAnimationIndex < this.acquiredLoot.length) {
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
     * Spawn loot reveal animation with splash particles
     */
    spawnLootAnimation(index, isLegendary = false) {
        const lootId = this.acquiredLoot[index];
        if (!lootId) return;

        // Play collect sound
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playSFX('loot-collect');
        }

        // Calculate item's screen position for splash particles
        const canvas = this.stateManager.canvas;
        const modalX = (canvas.width - this.modalWidth) / 2;
        const modalY = (canvas.height - this.modalHeight) / 2;
        const startY = modalY + this.padding + 214;
        const itemsPerRow = 5;
        const itemsPerPage = 15;
        const itemWidth = 130;
        const itemHeight = 92;
        const itemGap = 8;
        const containerX = modalX + (this.modalWidth - (itemsPerRow * itemWidth + (itemsPerRow - 1) * itemGap)) / 2;
        const pageItemIndex = index % itemsPerPage;
        const row = Math.floor(pageItemIndex / itemsPerRow);
        const col = pageItemIndex % itemsPerRow;
        const cx = containerX + col * (itemWidth + itemGap) + itemWidth / 2;
        const cy = startY + row * (itemHeight + itemGap) + itemHeight / 2;

        // Spawn radial splash particles in rarity color
        const lootInfo = LootRegistry.getLootType(lootId);
        const rarityColor = this.getRarityColor(lootId);
        const count = isLegendary ? 22 : (lootInfo?.rarity === 'epic' || lootInfo?.rarity === 'rare' ? 15 : 10);

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const speed = 70 + Math.random() * 110;
            const life = 0.35 + Math.random() * 0.3;
            this.particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                gravity: 150,
                life: life,
                maxLife: life,
                color: rarityColor,
                size: 2 + Math.random() * 3
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

        // Allow button interactions from countup phase onwards (not during victory animation)
        if (this.animationPhase === 'victory') return;

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
        
        // Allow button clicks from countup phase onwards, and on defeat screen
        if (this.animationPhase === 'victory') return;

        this.buttons.forEach((button, index) => {
            const pos = this.getButtonPosition(index);
            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {
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
        
        const bW = 220;
        const bH = 48;
        const bGap = 32;

        if (isDefeatScreen) {
            const tot = this.buttons.length * bW + (this.buttons.length - 1) * bGap;
            buttonsStartX = (canvas.width - tot) / 2;
            buttonsY = canvas.height / 2 + 200;
        } else {
            const modalX = (canvas.width - this.modalWidth) / 2;
            const modalY = (canvas.height - this.modalHeight) / 2;
            const tot = this.buttons.length * bW + (this.buttons.length - 1) * bGap;
            buttonsStartX = modalX + (this.modalWidth - tot) / 2;
            buttonsY = modalY + this.modalHeight - this.padding - bH - 4;
        }

        return {
            x: buttonsStartX + index * (bW + bGap),
            y: buttonsY,
            width: bW,
            height: bH
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
            // === BACKGROUND ===
            ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Subtle vignette
            const vignette = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, canvas.height * 0.25,
                canvas.width / 2, canvas.height / 2, canvas.height * 0.75
            );
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // === STONE PILLARS (drawn before modal so modal overlaps pillar edges) ===
            if (this.resultType === 'levelComplete') {
                this.renderStonePillars(ctx, modalX, modalY);
            }

            // === MODAL BACKGROUND (dark navy gradient) ===
            const modalGrad = ctx.createLinearGradient(modalX, modalY, modalX, modalY + this.modalHeight);
            modalGrad.addColorStop(0, '#1C1A2E');
            modalGrad.addColorStop(0.5, '#18192A');
            modalGrad.addColorStop(1, '#111120');
            ctx.fillStyle = modalGrad;
            ctx.fillRect(modalX, modalY, this.modalWidth, this.modalHeight);

            // Modal border - muted gold, no glow
            ctx.strokeStyle = 'rgba(160, 130, 60, 0.75)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(modalX, modalY, this.modalWidth, this.modalHeight);

            // Inner border inset
            ctx.strokeStyle = 'rgba(140, 115, 50, 0.25)';
            ctx.lineWidth = 1;
            ctx.strokeRect(modalX + 5, modalY + 5, this.modalWidth - 10, this.modalHeight - 10);

            // Corner markers (small L-shaped marks, no diamonds)
            const cMark = 12;
            ctx.strokeStyle = 'rgba(180, 145, 60, 0.6)';
            ctx.lineWidth = 1.5;
            for (const [cx2, cy2, sx, sy] of [
                [modalX, modalY, 1, 1], [modalX + this.modalWidth, modalY, -1, 1],
                [modalX, modalY + this.modalHeight, 1, -1], [modalX + this.modalWidth, modalY + this.modalHeight, -1, -1]
            ]) {
                ctx.beginPath();
                ctx.moveTo(cx2 + sx * cMark, cy2);
                ctx.lineTo(cx2, cy2);
                ctx.lineTo(cx2, cy2 + sy * cMark);
                ctx.stroke();
            }

            // === CONTENT ===
            this.renderStats(ctx, modalX, modalY);

            // Render loot once we're in the loot or buttons phase
            if (this.animationPhase === 'loot' || this.animationPhase === 'buttons') {
                this.renderLoot(ctx, modalX, modalY);
            }

            // Render buttons from countup onwards (immediately visible)
            if (this.animationPhase === 'countup' || this.animationPhase === 'loot' || this.animationPhase === 'buttons') {
                this.renderButtons(ctx, modalX, modalY);
            }

            // === CLOTH BANNER (drawn last - on top of everything) ===
            if (this.resultType === 'levelComplete') {
                this.renderClothBanner(ctx, modalX, modalY);
            } else {
                // For gameOver (shouldn't normally reach here, but just in case)
                this.renderResultsTitle(ctx, modalX, modalY);
            }
        }

        // Draw particles
        this.renderParticles(ctx);
    }

    /**
     * Render victory animation - sword clash then cinematic VICTORY text reveal
     */
    renderVictoryAnimation(ctx, canvas) {
        const progress = this.phaseTime / this.phaseDuration.victory;

        // Split: 0-0.38 = sword clash, 0.38-1.0 = cinematic victory text
        const clashPhase = Math.min(progress / 0.38, 1.0);
        const victoryPhase = Math.max((progress - 0.38) / 0.62, 0);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // Dark background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

        // Subtle golden radial glow in center
        const bgGlow = ctx.createRadialGradient(0, 0, 20, 0, 0, 400);
        bgGlow.addColorStop(0, 'rgba(180, 130, 20, 0.18)');
        bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bgGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 400, 0, Math.PI * 2);
        ctx.fill();

        // === SWORD CLASH PHASE (0-0.38): full clash animation ===
        if (clashPhase < 1.0) {
            this.renderSwordClash(ctx, clashPhase);
        }

        // === SWORDS LINGER CROSSED IN BACKGROUND after clash ===
        if (clashPhase >= 1.0 && victoryPhase < 1.0) {
            const swordFade = Math.max(0, 1 - victoryPhase * 2.2) * 0.45;
            if (swordFade > 0) {
                // Left sword crossed
                ctx.save();
                ctx.globalAlpha = swordFade;
                ctx.translate(-28, 30);
                ctx.rotate(-Math.PI / 5);
                this.drawMedievalSword(ctx, 0, 0, '#c0c0c0', '#8b7355', 1.3);
                ctx.restore();
                // Right sword crossed
                ctx.save();
                ctx.globalAlpha = swordFade;
                ctx.translate(28, 30);
                ctx.rotate(Math.PI / 5);
                this.drawMedievalSword(ctx, 0, 0, '#d4af37', '#8b7355', 1.3);
                ctx.restore();
            }
        }

        // === VICTORY TEXT PHASE (0.38-1.0): cinematic slide-in ===
        if (victoryPhase > 0) {
            this.renderVictoryBurst(ctx, victoryPhase, canvas);
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
     * Render VICTORY text - cinematic drop from top with shockwave and embers
     */
    renderVictoryBurst(ctx, progress, canvas) {
        // === PHASE 1 (0 - 0.4): Text drops from top with elastic ease ===
        const dropDuration = 0.4;
        const dropProgress = Math.min(progress / dropDuration, 1);

        // Elastic ease-out: overshoots slightly then settles
        const elasticEase = (t) => {
            if (t <= 0) return 0;
            if (t >= 1) return 1;
            return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
        };

        const dropEased = elasticEase(dropProgress);
        const dropStartY = -380;
        const textY = dropStartY * (1 - dropEased); // moves from -380 to 0

        // === PHASE 2 (0.32 - 0.55): Impact shockwave ===
        const impactStart = 0.32;
        if (progress > impactStart) {
            const ip = Math.min((progress - impactStart) / 0.22, 1);

            // Bright golden impact flash
            const flashAlpha = Math.max(0, (1 - ip) * 0.55);
            const flashGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 320);
            flashGrad.addColorStop(0, `rgba(255, 255, 180, ${flashAlpha})`);
            flashGrad.addColorStop(0.35, `rgba(255, 200, 0, ${flashAlpha * 0.6})`);
            flashGrad.addColorStop(1, 'rgba(255, 140, 0, 0)');
            ctx.fillStyle = flashGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 340, 0, Math.PI * 2);
            ctx.fill();

            // Three expanding shockwave rings
            for (let r = 0; r < 3; r++) {
                const delay = r * 0.08;
                const rp = Math.min(Math.max((progress - impactStart - delay) / 0.38, 0), 1);
                if (rp > 0) {
                    const ringAlpha = Math.max(0, (1 - rp) * 0.75);
                    const ringRadius = rp * (180 + r * 70);
                    ctx.strokeStyle = `rgba(212, 175, 55, ${ringAlpha})`;
                    ctx.lineWidth = Math.max(0.5, 3 - r * 0.8);
                    ctx.beginPath();
                    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            // Radial spark beams
            const beamAlpha = Math.max(0, (1 - ip) * 0.55);
            if (beamAlpha > 0.02) {
                for (let i = 0; i < 18; i++) {
                    const angle = (i / 18) * Math.PI * 2 + Math.PI / 18;
                    const innerR = 70 * ip;
                    const outerR = (130 + (i % 3) * 50) * ip;
                    ctx.strokeStyle = i % 2 === 0
                        ? `rgba(255, 215, 0, ${beamAlpha})`
                        : `rgba(255, 165, 0, ${beamAlpha * 0.7})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
                    ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
                    ctx.stroke();
                }
            }
        }

        // === DRAW VICTORY TEXT ===
        ctx.save();
        ctx.translate(0, textY);

        // Text becomes visible as it descends
        const textAlpha = Math.min(dropProgress * 3.5, 1);

        // Subtle scale pulse after landing (gentle breathing effect)
        const postLand = Math.max((progress - dropDuration) / (1 - dropDuration), 0);
        const pulseScale = 1 + Math.sin(postLand * Math.PI * 1.8) * 0.025;
        ctx.scale(pulseScale, pulseScale);

        ctx.font = 'bold 148px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // === GOLDEN GLOW HALO ===
        ctx.globalAlpha = textAlpha * 0.45;
        for (let i = 28; i > 0; i -= 5) {
            ctx.strokeStyle = `rgba(255, 180, 0, ${(28 - i) / 28 * 0.18})`;
            ctx.lineWidth = i;
            ctx.strokeText('VICTORY', 0, 0);
        }

        // === DROP SHADOW ===
        ctx.globalAlpha = textAlpha * 0.6;
        ctx.fillStyle = 'rgba(60, 40, 0, 0.85)';
        ctx.fillText('VICTORY', 4, 6);

        // === MAIN TEXT - rich gold ===
        ctx.globalAlpha = textAlpha;
        ctx.fillStyle = '#FFD700';
        ctx.fillText('VICTORY', 0, 0);

        // === METALLIC OUTLINE ===
        ctx.strokeStyle = '#7A5C10';
        ctx.lineWidth = 4;
        ctx.globalAlpha = textAlpha * 0.85;
        ctx.strokeText('VICTORY', 0, 0);

        // === TOP HIGHLIGHT - 3D metallic shine ===
        ctx.globalAlpha = textAlpha * 0.35;
        ctx.fillStyle = '#FFFDE7';
        ctx.fillText('VICTORY', 0, -9);

        ctx.restore();

        // === PHASE 3 (0.5 - 1.0): Orbiting embers ===
        if (progress > 0.5) {
            const emberPhase = (progress - 0.5) / 0.5;
            const emberCount = 10;
            for (let i = 0; i < emberCount; i++) {
                const baseAngle = (i / emberCount) * Math.PI * 2;
                const angle = baseAngle + progress * 1.4 + Math.sin(progress * 2.5 + i) * 0.3;
                const orbit = 155 + Math.sin(progress * 3.5 + i * 1.3) * 22;
                const ex = Math.cos(angle) * orbit;
                const ey = Math.sin(angle) * orbit + textY * (1 - emberPhase);
                const eAlpha = Math.max(0, 0.75 * Math.sin(emberPhase * Math.PI + i * 0.5));
                if (eAlpha < 0.02) continue;
                ctx.globalAlpha = eAlpha;
                ctx.fillStyle = i % 3 === 0 ? '#FFD700' : (i % 3 === 1 ? '#FF8C00' : '#FFF176');
                ctx.beginPath();
                ctx.arc(ex, ey, 3 + (i % 3), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    }

    /**
     * Draw a small medieval star for heraldic effects
     */
    drawMedievalStar(ctx, x, y, size) {
        const points = 5;
        const innerRadius = size * 0.4;
        const outerRadius = size;
        
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
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
     * Render title - styled header band
     */
    renderTitle(ctx, modalX, modalY) {
        const headerH = 68;
        const cx = modalX + this.modalWidth / 2;

        // Header band gradient
        const hGrad = ctx.createLinearGradient(modalX, modalY, modalX + this.modalWidth, modalY + headerH);
        hGrad.addColorStop(0, 'rgba(60, 45, 5, 0.85)');
        hGrad.addColorStop(0.5, 'rgba(110, 80, 10, 0.9)');
        hGrad.addColorStop(1, 'rgba(60, 45, 5, 0.85)');
        ctx.fillStyle = hGrad;
        ctx.fillRect(modalX, modalY, this.modalWidth, headerH);

        // Thin gold separator line at bottom of header
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(modalX + 16, modalY + headerH - 1);
        ctx.lineTo(modalX + this.modalWidth - 16, modalY + headerH - 1);
        ctx.stroke();

        // Small decorative diamonds on separator
        const diamondPositions = [modalX + 80, cx, modalX + this.modalWidth - 80];
        ctx.fillStyle = '#D4AF37';
        for (const dx of diamondPositions) {
            ctx.save();
            ctx.translate(dx, modalY + headerH - 1);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-4, -4, 8, 8);
            ctx.restore();
        }

        const titleText = this.resultType === 'levelComplete' ? 'LEVEL COMPLETE' : 'MISSION FAILED';
        const titleColor = this.resultType === 'levelComplete' ? '#FFD700' : '#FF6B6B';

        // Shadow
        ctx.font = 'bold 34px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillText(titleText, cx + 2, modalY + headerH / 2 + 2);

        // Main title
        ctx.fillStyle = titleColor;
        ctx.fillText(titleText, cx, modalY + headerH / 2);

        // Subtle highlight
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(titleText, cx, modalY + headerH / 2 - 3);
        ctx.globalAlpha = 1;
    }

    /**
     * Render plain title bar for non-victory screens (e.g. game over)
     */
    renderResultsTitle(ctx, modalX, modalY) {
        const headerH = 68;
        const cx = modalX + this.modalWidth / 2;
        const hGrad = ctx.createLinearGradient(modalX, modalY, modalX + this.modalWidth, modalY + headerH);
        hGrad.addColorStop(0, 'rgba(60, 20, 20, 0.85)');
        hGrad.addColorStop(0.5, 'rgba(100, 30, 30, 0.9)');
        hGrad.addColorStop(1, 'rgba(60, 20, 20, 0.85)');
        ctx.fillStyle = hGrad;
        ctx.fillRect(modalX, modalY, this.modalWidth, headerH);
        ctx.strokeStyle = '#A04040';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(modalX + 16, modalY + headerH - 1);
        ctx.lineTo(modalX + this.modalWidth - 16, modalY + headerH - 1);
        ctx.stroke();
        ctx.font = 'bold 34px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText('MISSION FAILED', cx + 2, modalY + headerH / 2 + 2);
        ctx.fillStyle = '#FF6B6B';
        ctx.fillText('MISSION FAILED', cx, modalY + headerH / 2);
    }

    /**
     * Render stone pillars flanking the modal
     */
    renderStonePillars(ctx, modalX, modalY) {
        const pillarW = 42;
        const pillarAbove = 100;
        const pillarTotalH = this.modalHeight + pillarAbove;
        const leftPX = modalX - pillarW;
        const rightPX = modalX + this.modalWidth;
        const pillarTopY = modalY - pillarAbove;

        this.drawStonePillar(ctx, leftPX, pillarTopY, pillarW, pillarTotalH);
        this.drawStonePillar(ctx, rightPX, pillarTopY, pillarW, pillarTotalH);
    }

    /**
     * Draw a single stone pillar at (x,y) with given width and height
     */
    drawStonePillar(ctx, x, y, w, h) {
        const capH = 22;
        const capX = x - 10;
        const capW = w + 20;

        // Pillar capital
        const capGrad = ctx.createLinearGradient(capX, y, capX + capW, y);
        capGrad.addColorStop(0, '#484440');
        capGrad.addColorStop(0.4, '#7A7268');
        capGrad.addColorStop(0.6, '#7A7268');
        capGrad.addColorStop(1, '#484440');
        ctx.fillStyle = capGrad;
        ctx.fillRect(capX, y, capW, capH);

        // Sub-capital groove
        ctx.fillStyle = 'rgba(30, 28, 24, 0.7)';
        ctx.fillRect(x - 5, y + capH, w + 10, 5);

        // Pillar shaft
        const shaftGrad = ctx.createLinearGradient(x, y + capH + 5, x + w, y + capH + 5);
        shaftGrad.addColorStop(0, '#4A4640');
        shaftGrad.addColorStop(0.15, '#6A6560');
        shaftGrad.addColorStop(0.5, '#787068');
        shaftGrad.addColorStop(0.85, '#5A5550');
        shaftGrad.addColorStop(1, '#3A3830');
        ctx.fillStyle = shaftGrad;
        ctx.fillRect(x, y + capH + 5, w, h - capH - 5);

        // Horizontal stone block lines
        const blockH = 28;
        ctx.save();
        ctx.strokeStyle = 'rgba(20, 18, 14, 0.65)';
        ctx.lineWidth = 1;
        for (let by = y + capH + 5 + blockH; by < y + h; by += blockH) {
            ctx.beginPath();
            ctx.moveTo(x, by);
            ctx.lineTo(x + w, by);
            ctx.stroke();
            // Mortar highlight
            ctx.strokeStyle = 'rgba(165, 150, 120, 0.12)';
            ctx.beginPath();
            ctx.moveTo(x, by + 1);
            ctx.lineTo(x + w, by + 1);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(20, 18, 14, 0.65)';
        }
        ctx.restore();

        // Left-edge highlight
        ctx.fillStyle = 'rgba(220, 205, 175, 0.08)';
        ctx.fillRect(x, y + capH + 5, 4, h - capH - 5);
        // Right-edge shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(x + w - 4, y + capH + 5, 4, h - capH - 5);

        // Capital top border
        ctx.strokeStyle = 'rgba(130, 115, 85, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(capX, y, capW, capH);
    }

    /**
     * Render the cloth victory banner stretched between the two pillar tops
     */
    renderClothBanner(ctx, modalX, modalY) {
        const pillarW = 42;
        const pillarAbove = 100;
        const leftCapRightEdge = modalX - pillarW + pillarW + 10;   // = modalX + 10
        const rightCapLeftEdge = modalX + this.modalWidth - 10;
        const bannerX = leftCapRightEdge;
        const bannerW = rightCapLeftEdge - bannerX;
        const bannerY = modalY - pillarAbove + 8;
        const bannerH = 78;
        const droop = 14;
        const scallops = 4;

        ctx.save();

        // === Cloth shape path ===
        ctx.beginPath();
        // Top edge with slight natural sag
        ctx.moveTo(bannerX, bannerY);
        ctx.bezierCurveTo(
            bannerX + bannerW * 0.33, bannerY + droop * 0.25,
            bannerX + bannerW * 0.67, bannerY + droop * 0.25,
            bannerX + bannerW, bannerY
        );
        // Right side
        ctx.lineTo(bannerX + bannerW, bannerY + bannerH);
        // Scalloped bottom
        const scW = bannerW / scallops;
        for (let i = scallops; i > 0; i--) {
            const sx = bannerX + i * scW;
            const ex = bannerX + (i - 1) * scW;
            ctx.bezierCurveTo(
                sx - scW * 0.25, bannerY + bannerH + droop,
                ex + scW * 0.25, bannerY + bannerH + droop,
                ex, bannerY + bannerH
            );
        }
        ctx.lineTo(bannerX, bannerY);
        ctx.closePath();

        // Cloth fill - deep crimson
        const clothGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX, bannerY + bannerH + droop);
        clothGrad.addColorStop(0, '#6B1515');
        clothGrad.addColorStop(0.3, '#7E1D1D');
        clothGrad.addColorStop(0.7, '#5A1010');
        clothGrad.addColorStop(1, '#3E0A0A');
        ctx.fillStyle = clothGrad;
        ctx.fill();

        // Side shadow overlays for fold depth
        ctx.save();
        ctx.clip();
        const leftFold = ctx.createLinearGradient(bannerX, bannerY, bannerX + 30, bannerY);
        leftFold.addColorStop(0, 'rgba(0,0,0,0.35)');
        leftFold.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = leftFold;
        ctx.fillRect(bannerX, bannerY, 30, bannerH + droop + 10);
        const rightFold = ctx.createLinearGradient(bannerX + bannerW - 30, bannerY, bannerX + bannerW, bannerY);
        rightFold.addColorStop(0, 'rgba(0,0,0,0)');
        rightFold.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = rightFold;
        ctx.fillRect(bannerX + bannerW - 30, bannerY, 30, bannerH + droop + 10);
        ctx.restore();

        // Gold border on cloth
        ctx.strokeStyle = 'rgba(185, 150, 55, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Top gold trim bar
        ctx.strokeStyle = '#C8A84B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bannerX, bannerY);
        ctx.bezierCurveTo(
            bannerX + bannerW * 0.33, bannerY + droop * 0.25,
            bannerX + bannerW * 0.67, bannerY + droop * 0.25,
            bannerX + bannerW, bannerY
        );
        ctx.stroke();

        // Gold fringe threads at scallop tips
        ctx.strokeStyle = 'rgba(200, 168, 75, 0.7)';
        ctx.lineWidth = 1;
        for (let i = 0; i < scallops; i++) {
            const tipX = bannerX + (i + 0.5) * scW;
            const tipY = bannerY + bannerH + droop;
            const fringeCount = 5;
            for (let f = 0; f < fringeCount; f++) {
                const fx = tipX + (f - (fringeCount - 1) / 2) * 4;
                ctx.beginPath();
                ctx.moveTo(fx, tipY - 4);
                ctx.lineTo(fx, tipY + 8);
                ctx.stroke();
            }
        }

        // === VICTORY TEXT ===
        const cx = bannerX + bannerW / 2;
        const ty = bannerY + bannerH / 2 + 4;
        ctx.font = 'bold 30px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Dark drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillText('You are Victorious', cx + 2, ty + 2);

        // Subtle gold under-glow
        ctx.shadowColor = 'rgba(220, 185, 80, 0.3)';
        ctx.shadowBlur = 6;

        // Main parchment text
        ctx.fillStyle = '#F2DEB3';
        ctx.fillText('You are Victorious', cx, ty);

        ctx.shadowBlur = 0;

        // Very subtle white highlight
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('You are Victorious', cx, ty - 2);
        ctx.globalAlpha = 1;

        ctx.restore();
    }

    /**
     * Render statistics with count-up animations - styled rows
     */
    renderStats(ctx, modalX, modalY) {
        const sectionY = modalY + 32;
        const sectionH = 104;
        const rowH = 46;
        const colW = this.modalWidth / 2;

        // Stats section background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(modalX, sectionY, this.modalWidth, sectionH);

        // Bottom divider of stats section
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(modalX + 16, sectionY + sectionH);
        ctx.lineTo(modalX + this.modalWidth - 16, sectionY + sectionH);
        ctx.stroke();

        // Format time (MM:SS, no count-up — time is immediately visible)
        const tSecs = Math.floor((this.stats.displayTimeTaken || 0) % 60);
        const tMins = Math.floor((this.stats.displayTimeTaken || 0) / 60);
        const timeStr = `${tMins}:${tSecs.toString().padStart(2, '0')}`;

        const statsData = [
            {
                drawIcon: (cx, cy) => this._drawSkullIcon(ctx, cx, cy, 14),
                label: 'Enemies Slain',
                value: this.stats.displayEnemiesSlain.toString(),
                col: 0, row: 0
            },
            {
                drawIcon: (cx, cy) => this._drawHourglassIcon(ctx, cx, cy, 14),
                label: 'Time Taken',
                value: timeStr,
                col: 1, row: 0
            },
            {
                drawIcon: (cx, cy) => this._drawCoinStackIcon(ctx, cx, cy, 14, 3),
                label: 'Gold Earned',
                value: this.stats.displayGoldEarned.toString() + 'g',
                col: 0, row: 1
            },
            {
                drawIcon: (cx, cy) => this._drawCoinStackIcon(ctx, cx, cy, 14, 2),
                label: 'Gold Remaining',
                value: this.stats.displayGoldRemaining.toString() + 'g',
                col: 1, row: 1
            }
        ];

        ctx.textBaseline = 'middle';
        for (const stat of statsData) {
            const cellX = modalX + stat.col * colW;
            const cellY = sectionY + stat.row * rowH;

            // Alternating row tint
            if (stat.row % 2 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.03)';
                ctx.fillRect(cellX, cellY, colW, rowH);
            }

            // Vertical divider between columns
            if (stat.col === 1) {
                ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cellX, cellY + 4);
                ctx.lineTo(cellX, cellY + rowH - 4);
                ctx.stroke();
            }

            const iconX = cellX + 14;
            const midY = cellY + rowH / 2;

            // Draw custom icon
            stat.drawIcon(iconX, midY);

            // Label
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(200, 190, 170, 0.9)';
            ctx.fillText(stat.label, iconX + 20, midY);

            // Value — right-aligned inside cell
            ctx.font = 'bold 20px Georgia, serif';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFD700';
            ctx.fillText(stat.value, cellX + colW - 20, midY);
        }

        // === SCORE BANNER — decorated medieval battle score banner ===
        const scoreAreaY = sectionY + sectionH;
        const scoreAreaH = 50;
        const scoreCX = modalX + this.modalWidth / 2;
        const scoreMidY = scoreAreaY + scoreAreaH / 2;

        // Parchment-style banner background
        const bannerBG = ctx.createLinearGradient(modalX, scoreAreaY, modalX, scoreAreaY + scoreAreaH);
        bannerBG.addColorStop(0, 'rgba(42, 28, 8, 0.95)');
        bannerBG.addColorStop(0.5, 'rgba(62, 44, 12, 0.98)');
        bannerBG.addColorStop(1, 'rgba(35, 22, 5, 0.95)');
        ctx.fillStyle = bannerBG;
        ctx.fillRect(modalX, scoreAreaY, this.modalWidth, scoreAreaH);

        // Outer gold border lines (top and bottom)
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.72)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(modalX + 6, scoreAreaY + 3);
        ctx.lineTo(modalX + this.modalWidth - 6, scoreAreaY + 3);
        ctx.moveTo(modalX + 6, scoreAreaY + scoreAreaH - 3);
        ctx.lineTo(modalX + this.modalWidth - 6, scoreAreaY + scoreAreaH - 3);
        ctx.stroke();

        // Diamond corner ornaments
        ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
        [[modalX + 6, scoreAreaY + 3], [modalX + this.modalWidth - 6, scoreAreaY + 3],
         [modalX + 6, scoreAreaY + scoreAreaH - 3], [modalX + this.modalWidth - 6, scoreAreaY + scoreAreaH - 3]
        ].forEach(([ox, oy]) => {
            ctx.beginPath();
            ctx.moveTo(ox, oy - 3.5); ctx.lineTo(ox + 3.5, oy);
            ctx.lineTo(ox, oy + 3.5); ctx.lineTo(ox - 3.5, oy);
            ctx.closePath(); ctx.fill();
        });

        const displayScore = this.stats.displayScore || 0;
        const finalScore = Math.floor(this.stats.enemiesSlain * 10 + this.stats.goldEarned * 0.5);
        const scoreRatio = finalScore > 0 ? displayScore / finalScore : 1;

        // "BATTLE SCORE" label — left-aligned inside the banner
        const labelX = modalX + 28;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.font = 'bold 11px Georgia, serif';
        ctx.fillStyle = 'rgba(195, 170, 105, 0.82)';
        ctx.fillText('BATTLE SCORE', labelX, scoreMidY);

        // Center: large score value — true center of the full banner
        ctx.save();
        ctx.translate(scoreCX, scoreMidY);
        const scoreScale = 1.0 + scoreRatio * 0.15;
        ctx.scale(scoreScale, scoreScale);
        ctx.font = 'bold 30px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Glow halo
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 5 + scoreRatio * 22;
        ctx.fillStyle = 'rgba(255, 245, 140, 0.35)';
        ctx.fillText(displayScore.toString(), 1, 1);
        ctx.shadowBlur = 0;
        // Gradient gold fill
        const numGrad = ctx.createLinearGradient(0, -15, 0, 15);
        numGrad.addColorStop(0, '#FFF5A0');
        numGrad.addColorStop(0.4, '#FFD700');
        numGrad.addColorStop(1, '#C89000');
        ctx.fillStyle = numGrad;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 4 + scoreRatio * 14;
        ctx.fillText(displayScore.toString(), 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();

        ctx.textAlign = 'left';
    }

    _drawSkullIcon(ctx, cx, cy, size) {
        ctx.save();
        const r = size * 0.52;
        // Skull dome
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.12, r, Math.PI, 0, false);
        ctx.lineTo(cx + r * 0.78, cy + r * 0.42);
        ctx.lineTo(cx - r * 0.78, cy + r * 0.42);
        ctx.closePath();
        const dg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.4, 0, cx, cy, r);
        dg.addColorStop(0, '#EDE5CC');
        dg.addColorStop(1, '#A89878');
        ctx.fillStyle = dg;
        ctx.fill();
        ctx.strokeStyle = '#6A5438';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        // Eye sockets
        for (const s of [-1, 1]) {
            ctx.beginPath();
            ctx.ellipse(cx + s * r * 0.32, cy - r * 0.09, r * 0.19, r * 0.22, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#1A0A00';
            ctx.fill();
        }
        // Nose cavity
        ctx.beginPath();
        ctx.moveTo(cx, cy + r * 0.08);
        ctx.lineTo(cx - r * 0.1, cy + r * 0.22);
        ctx.lineTo(cx + r * 0.1, cy + r * 0.22);
        ctx.closePath();
        ctx.fillStyle = '#2A1800';
        ctx.fill();
        // Jaw rectangle
        ctx.fillStyle = '#C8BEA8';
        ctx.fillRect(cx - r * 0.56, cy + r * 0.38, r * 1.12, r * 0.26);
        ctx.strokeStyle = '#6A5438';
        ctx.lineWidth = 0.7;
        ctx.strokeRect(cx - r * 0.56, cy + r * 0.38, r * 1.12, r * 0.26);
        // Teeth gaps
        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.56 + i * r * 0.37, cy + r * 0.38);
            ctx.lineTo(cx - r * 0.56 + i * r * 0.37, cy + r * 0.64);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawHourglassIcon(ctx, cx, cy, size) {
        ctx.save();
        const hs = size * 0.44;
        const neck = size * 0.09;
        // Top triangle (sand running down)
        ctx.beginPath();
        ctx.moveTo(cx - hs, cy - hs);
        ctx.lineTo(cx + hs, cy - hs);
        ctx.lineTo(cx + neck, cy);
        ctx.lineTo(cx - neck, cy);
        ctx.closePath();
        const tg = ctx.createLinearGradient(cx, cy - hs, cx, cy);
        tg.addColorStop(0, '#C89828');
        tg.addColorStop(1, '#8B6010');
        ctx.fillStyle = tg;
        ctx.fill();
        ctx.strokeStyle = '#5A3808';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // Bottom triangle (sand accumulated)
        ctx.beginPath();
        ctx.moveTo(cx - neck, cy);
        ctx.lineTo(cx + neck, cy);
        ctx.lineTo(cx + hs, cy + hs);
        ctx.lineTo(cx - hs, cy + hs);
        ctx.closePath();
        const bg = ctx.createLinearGradient(cx, cy, cx, cy + hs);
        bg.addColorStop(0, '#A07818');
        bg.addColorStop(1, '#5A3808');
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = '#5A3808';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // Sand highlight in bottom
        ctx.beginPath();
        ctx.moveTo(cx - hs * 0.55, cy + hs);
        ctx.lineTo(cx + hs * 0.55, cy + hs);
        ctx.lineTo(cx + hs * 0.2, cy + hs * 0.55);
        ctx.lineTo(cx - hs * 0.2, cy + hs * 0.55);
        ctx.closePath();
        ctx.fillStyle = 'rgba(240, 200, 80, 0.45)';
        ctx.fill();
        // Frame bars top and bottom
        ctx.fillStyle = '#4A2C06';
        ctx.fillRect(cx - hs - 1, cy - hs - 2, hs * 2 + 2, 3);
        ctx.fillRect(cx - hs - 1, cy + hs - 1, hs * 2 + 2, 3);
        ctx.restore();
    }

    _drawCoinStackIcon(ctx, cx, cy, size, count) {
        ctx.save();
        const rx = size * 0.44;
        const ry = rx * 0.28;
        const step = size * 0.2;
        const baseY = cy + (count - 1) * step * 0.5;
        for (let i = count - 1; i >= 0; i--) {
            const coinY = baseY - i * step;
            // Coin side (bottom edge darker strip for 3D look)
            ctx.beginPath();
            ctx.ellipse(cx, coinY + ry * 0.6, rx, ry * 0.55, 0, 0, Math.PI);
            ctx.fillStyle = '#7A4A00';
            ctx.fill();
            // Coin face
            ctx.beginPath();
            ctx.ellipse(cx, coinY, rx, ry, 0, 0, Math.PI * 2);
            const cg = ctx.createRadialGradient(cx - rx * 0.3, coinY - ry * 0.35, 0, cx, coinY, rx);
            cg.addColorStop(0, '#FFE060');
            cg.addColorStop(0.5, '#D4A020');
            cg.addColorStop(1, '#7A4A00');
            ctx.fillStyle = cg;
            ctx.fill();
            ctx.strokeStyle = '#5A3400';
            ctx.lineWidth = 0.7;
            ctx.stroke();
            // Coin glint
            ctx.beginPath();
            ctx.ellipse(cx - rx * 0.22, coinY - ry * 0.25, rx * 0.28, ry * 0.28, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 245, 160, 0.4)';
            ctx.fill();
        }
        ctx.restore();
    }

    _drawCrossedSwordsIcon(ctx, cx, cy, size) {
        ctx.save();
        ctx.translate(cx, cy);
        const bladeLen = size * 1.0;
        const handleLen = size * 0.45;
        const colors = ['#C8C8C8', '#D4AF37'];
        const angles = [Math.PI * 0.28, -Math.PI * 0.28];
        for (let i = 0; i < 2; i++) {
            ctx.save();
            ctx.rotate(angles[i]);
            // Blade
            ctx.beginPath();
            ctx.moveTo(-bladeLen, -1.5);
            ctx.lineTo(-bladeLen, 1.5);
            ctx.lineTo(bladeLen * 0.12, 0.8);
            ctx.lineTo(bladeLen * 0.16, 0);
            ctx.lineTo(bladeLen * 0.12, -0.8);
            ctx.closePath();
            ctx.fillStyle = colors[i];
            ctx.fill();
            ctx.strokeStyle = 'rgba(20,10,0,0.35)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            // Guard
            ctx.fillStyle = '#9B7120';
            ctx.fillRect(-size * 0.12, -size * 0.22, size * 0.24, size * 0.44);
            ctx.strokeStyle = '#5A3800';
            ctx.lineWidth = 0.6;
            ctx.strokeRect(-size * 0.12, -size * 0.22, size * 0.24, size * 0.44);
            // Handle
            ctx.fillStyle = '#4A2808';
            ctx.fillRect(size * 0.12, -size * 0.08, handleLen, size * 0.16);
            ctx.restore();
        }
        ctx.restore();
    }

    _drawSpoilsChestIcon(ctx, cx, cy, size, flipCoins = false) {
        ctx.save();
        const w = size * 0.95;
        const h = size * 0.72;
        const bx = cx - w / 2;
        const by = cy - h * 0.38;

        // Chest body
        const bg = ctx.createLinearGradient(bx, by + h * 0.32, bx, by + h);
        bg.addColorStop(0, '#C8930A');
        bg.addColorStop(1, '#8B5E0A');
        ctx.fillStyle = bg;
        ctx.fillRect(bx, by + h * 0.32, w, h * 0.68);
        ctx.strokeStyle = '#5A3808';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by + h * 0.32, w, h * 0.68);

        // Chest lid
        const lg = ctx.createLinearGradient(bx, by, bx, by + h * 0.34);
        lg.addColorStop(0, '#FFD700');
        lg.addColorStop(1, '#C87505');
        ctx.fillStyle = lg;
        ctx.fillRect(bx, by, w, h * 0.34);
        ctx.strokeStyle = '#5A3808';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, w, h * 0.34);

        // Metal bands on lid
        ctx.strokeStyle = '#C87505';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(bx + w * 0.32, by + h * 0.34);
        ctx.lineTo(bx + w * 0.32, by + h);
        ctx.moveTo(bx + w * 0.68, by + h * 0.34);
        ctx.lineTo(bx + w * 0.68, by + h);
        ctx.stroke();

        // Lock/clasp
        ctx.beginPath();
        ctx.arc(cx, by + h * 0.31, size * 0.075, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#8B5E0A';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Scattered gold coins to one side
        const coinDir = flipCoins ? -1 : 1;
        const coinPositions = [
            { dx: coinDir * w * 0.58, dy: -h * 0.06 },
            { dx: coinDir * w * 0.74, dy:  h * 0.12 },
            { dx: coinDir * w * 0.62, dy:  h * 0.28 }
        ];
        coinPositions.forEach(c => {
            ctx.beginPath();
            ctx.arc(cx + c.dx, by + h * 0.5 + c.dy, size * 0.09, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.strokeStyle = '#8B5E0A';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        });

        ctx.restore();
    }

    /**
     * Render loot items sequentially with pagination support
     */
    renderLoot(ctx, modalX, modalY) {
        // === SPOILS SECTION HEADER — treasure chest icons flanking title ===
        const headerY = modalY + 200;
        const cx = modalX + this.modalWidth / 2;

        ctx.font = 'bold 13px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(212, 175, 55, 0.92)';
        ctx.fillText('SPOILS OF WAR', cx, headerY);

        // Treasure chest icons flanking the header text
        const labelW = ctx.measureText('SPOILS OF WAR').width;
        this._drawSpoilsChestIcon(ctx, cx - labelW / 2 - 22, headerY, 18, true);
        this._drawSpoilsChestIcon(ctx, cx + labelW / 2 + 22, headerY, 18, false);

        // Decorative lines stretching from chests to modal edges
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(modalX + 20, headerY);
        ctx.lineTo(cx - labelW / 2 - 40, headerY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + labelW / 2 + 40, headerY);
        ctx.lineTo(modalX + this.modalWidth - 20, headerY);
        ctx.stroke();

        const startY = modalY + this.padding + 214;
        const itemsPerRow = 5;      // 5 items per row
        const itemsPerPage = 15;    // 3 rows x 5 items = 15 per page
        const itemWidth = 130;
        const itemHeight = 92;
        const itemGap = 8;
        const containerX = modalX + (this.modalWidth - (itemsPerRow * itemWidth + (itemsPerRow - 1) * itemGap)) / 2;
        const maxHeight = modalY + this.modalHeight - this.padding - 72; // Leave space for buttons

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
        
        // Determine current page based on how many items have been revealed
        const itemsRevealed = Math.floor(lootTime * itemsPerSecond);
        // Cap the page at the actual number of pages that have content
        const maxPages = Math.ceil(this.acquiredLoot.length / itemsPerPage);
        const currentPage = Math.min(Math.floor(itemsRevealed / itemsPerPage), maxPages - 1);
        
        for (let i = 0; i < this.acquiredLoot.length; i++) {
            const lootId = this.acquiredLoot[i];
            const lootInfo = LootRegistry.getLootType(lootId);
            if (!lootInfo) { globalCount++; continue; }

            // Calculate which page this item belongs to
            const pageNumber = Math.floor(globalCount / itemsPerPage);
            const pageItemIndex = globalCount % itemsPerPage;
            
            // Only render items on the current page
            if (pageNumber !== currentPage) {
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

            // Elastic bounce-in scale (0 → 1.18 → 1.0)
            const bounceDuration = 0.32;
            const bounceT = Math.min(timeSinceReveal / bounceDuration, 1);
            const bounceScale = bounceT >= 1 ? 1 : (
                bounceT < 0.55
                    ? (bounceT / 0.55) * 1.18          // overshoot to 1.18
                    : 1.18 - (bounceT - 0.55) / 0.45 * 0.18  // settle back to 1.0
            );

            const alpha = Math.min(timeSinceReveal / 0.18, 1);
            const isRare = lootInfo && (lootInfo.rarity === 'rare' || lootInfo.rarity === 'epic' || lootInfo.rarity === 'legendary');

            // Save context - apply bounce scale centered on tile
            ctx.save();
            ctx.translate(itemX + itemWidth / 2, itemY + itemHeight / 2);
            ctx.scale(bounceScale, bounceScale);
            ctx.translate(-itemWidth / 2, -itemHeight / 2);
            ctx.globalAlpha = alpha;

            const rarityColor = this.getRarityColor(lootId);
            const isLegendary = lootInfo && lootInfo.rarity === 'legendary';

            // === TILE BACKGROUND ===
            const tileGrad = ctx.createLinearGradient(0, 0, 0, itemHeight);
            tileGrad.addColorStop(0, 'rgba(30, 28, 50, 0.95)');
            tileGrad.addColorStop(1, 'rgba(18, 16, 32, 0.98)');
            ctx.fillStyle = tileGrad;
            ctx.fillRect(0, 0, itemWidth, itemHeight);

            // Rarity color tint overlay (subtle)
            ctx.fillStyle = rarityColor;
            ctx.globalAlpha = 0.1 * alpha;
            ctx.fillRect(0, 0, itemWidth, itemHeight);
            ctx.globalAlpha = alpha;

            // === BORDER ===
            ctx.strokeStyle = rarityColor;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(0, 0, itemWidth, itemHeight);

            // Entrance glow (during bounce)
            if (bounceT < 1.0) {
                const glowStr = Math.sin(bounceT * Math.PI) * 0.7;
                ctx.save();
                ctx.shadowColor = rarityColor;
                ctx.shadowBlur = 14 * glowStr;
                ctx.strokeStyle = rarityColor;
                ctx.globalAlpha = alpha * glowStr * 0.8;
                ctx.lineWidth = 2;
                ctx.strokeRect(-2, -2, itemWidth + 4, itemHeight + 4);
                ctx.restore();
                ctx.globalAlpha = alpha;
            }

            // Legendary extra golden shimmer
            if (isLegendary) {
                ctx.save();
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 8;
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(-4, -4, itemWidth + 8, itemHeight + 8);
                ctx.restore();
            }

            // Rare+ outer ring
            if (isRare) {
                ctx.strokeStyle = rarityColor;
                ctx.globalAlpha = alpha * 0.3;
                ctx.lineWidth = 1;
                ctx.strokeRect(-5, -5, itemWidth + 10, itemHeight + 10);
                ctx.globalAlpha = alpha;
            }

            // === TOP COLOR BAR (rarity indicator) ===
            ctx.fillStyle = rarityColor;
            ctx.globalAlpha = 0.55 * alpha;
            ctx.fillRect(0, 0, itemWidth, 4);
            ctx.globalAlpha = alpha;

            // === EMBLEM ===
            ctx.fillStyle = rarityColor;
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (typeof lootInfo.drawIcon === 'function') {
                lootInfo.drawIcon(ctx, itemWidth / 2, 24, 28);
            } else {
                ctx.fillText(lootInfo.emblem || '?', itemWidth / 2, 24);
            }

            // === NAME ===
            ctx.fillStyle = '#E8E0D0';
            ctx.font = '10px Arial';
            const nameWords = lootInfo.name.split(' ');
            const nameStartY = 44;
            for (let j = 0; j < nameWords.length && j < 3; j++) {
                ctx.fillText(nameWords[j], itemWidth / 2, nameStartY + j * 12);
            }

            // === VALUE ===
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 11px Georgia, serif';
            ctx.fillText(`${lootInfo.sellValue}g`, itemWidth / 2, itemHeight - 8);

            // Thin bottom separator
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(4, itemHeight - 18);
            ctx.lineTo(itemWidth - 4, itemHeight - 18);
            ctx.stroke();

            ctx.restore();
            globalCount++;
            displayedCount++;
        }
    }

    /**
     * Render buttons - styled with gradient and glow
     */
    renderButtons(ctx, modalX, modalY) {
        const isDefeatScreen = this.animationPhase === 'defeat';
        const canvas = this.stateManager.canvas;

        let buttonY, startX;
        const bW = 220;
        const bH = 48;
        const bGap = 32;

        if (isDefeatScreen) {
            buttonY = canvas.height / 2 + 200;
            const tot = this.buttons.length * bW + (this.buttons.length - 1) * bGap;
            startX = (canvas.width - tot) / 2;
        } else {
            buttonY = modalY + this.modalHeight - this.padding - bH - 4;
            const tot = this.buttons.length * bW + (this.buttons.length - 1) * bGap;
            startX = modalX + (this.modalWidth - tot) / 2;
        }

        this.buttons.forEach((button, index) => {
            const x = startX + index * (bW + bGap);
            const isSelected = index === this.selectedButtonIndex;

            ctx.save();

            // Outer glow for selected
            if (isSelected) {
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 14;
            }

            // Button gradient fill
            const btnGrad = ctx.createLinearGradient(x, buttonY, x, buttonY + bH);
            if (isSelected) {
                btnGrad.addColorStop(0, '#FFF176');
                btnGrad.addColorStop(0.45, '#FFD700');
                btnGrad.addColorStop(1, '#B8860B');
            } else {
                btnGrad.addColorStop(0, '#3A3550');
                btnGrad.addColorStop(0.5, '#2A2540');
                btnGrad.addColorStop(1, '#1E1A30');
            }
            ctx.fillStyle = btnGrad;
            ctx.fillRect(x, buttonY, bW, bH);

            // Border
            ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(212, 175, 55, 0.7)';
            ctx.lineWidth = isSelected ? 2 : 1.5;
            ctx.strokeRect(x, buttonY, bW, bH);

            // Inner highlight line at top
            ctx.strokeStyle = isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 3, buttonY + 2);
            ctx.lineTo(x + bW - 3, buttonY + 2);
            ctx.stroke();

            ctx.restore();

            // Text shadow
            ctx.font = 'bold 13px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillText(button.label, x + bW / 2 + 1, buttonY + bH / 2 + 1);

            // Button label
            ctx.fillStyle = isSelected ? '#1A1200' : '#D4AF37';
            ctx.fillText(button.label, x + bW / 2, buttonY + bH / 2);
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
            ctx.arc(p.x, p.y, p.size !== undefined ? p.size : 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}
