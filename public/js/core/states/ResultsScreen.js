import { LootRegistry } from '../../entities/loot/LootRegistry.js';

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

        // Animation phases
        this.animationPhase = 'intro'; // intro, countup, loot, buttons
        this.phaseTime = 0;
        this.phaseDuration = {
            intro: 0.5,
            countup: 2.5,
            loot: 2.5,
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
        this.lootDisplayItems = []; // { lootId, x, y, animationTime }

        // Button state
        this.buttons = [];
        this.selectedButtonIndex = 0;
        this.showButtons = false;

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
        this.animationPhase = 'intro';
        this.phaseTime = 0;
        this.showButtons = false;
        this.lootAnimationIndex = 0;
        this.particles = [];
        this.selectedButtonIndex = 0;

        // Extract stats from result data
        this.stats = {
            enemiesSlain: data.enemiesSlain || 0,
            goldEarned: data.goldEarned || 0,
            goldRemaining: data.currentGold || 0,
            displayEnemiesSlain: 0,
            displayGoldEarned: 0,
            displayGoldRemaining: 0
        };

        // Setup buttons
        if (type === 'levelComplete') {
            this.buttons = [
                { label: 'RETURN TO SETTLEMENT', action: 'settlement' },
                { label: 'NEXT LEVEL', action: 'nextLevel' }
            ];
        } else {
            this.buttons = [
                { label: 'RETRY', action: 'retry' },
                { label: 'LEVEL SELECT', action: 'levelSelect' }
            ];
        }

        // Play victory music
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.stopMusic();
            this.stateManager.audioManager.playSFX('victory-tune');
        }
    }

    /**
     * Hide the results screen and execute action
     */
    execute(action) {
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
            case 'nextLevel':
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playRandomSettlementTheme();
                }
                this.stateManager.selectedLevelInfo = {
                    level: this.resultData.level + 1
                };
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
    }

    /**
     * Update animations
     */
    update(deltaTime) {
        if (!this.isShowing) return;

        this.phaseTime += deltaTime;

        // Handle phase transitions
        if (this.animationPhase === 'intro' && this.phaseTime >= this.phaseDuration.intro) {
            this.animationPhase = 'countup';
            this.phaseTime = 0;
        } else if (this.animationPhase === 'countup' && this.phaseTime >= this.phaseDuration.countup) {
            this.animationPhase = 'loot';
            this.phaseTime = 0;
            this.lootAnimationIndex = 0;
        } else if (this.animationPhase === 'loot' && this.phaseTime >= this.phaseDuration.loot) {
            this.animationPhase = 'buttons';
            this.phaseTime = 0;
            this.showButtons = true;
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

        // Update loot animations
        if (this.animationPhase === 'loot') {
            const itemsPerSecond = 4;
            const expectedIndex = Math.floor(this.phaseTime * itemsPerSecond);
            
            while (this.lootAnimationIndex < expectedIndex && this.lootAnimationIndex < this.acquiredLoot.length) {
                this.spawnLootAnimation(this.lootAnimationIndex);
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
    spawnLootAnimation(index) {
        const lootId = this.acquiredLoot[index];
        if (!lootId) return;

        // Play collect sound
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playSFX('coin-collect');
        }

        // Create particles
        const canvas = this.stateManager.canvas;
        const modalX = (canvas.width - this.modalWidth) / 2;
        const baseY = (canvas.height - this.modalHeight) / 2 + 200;
        const centerX = modalX + this.modalWidth / 2;
        
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            this.particles.push({
                x: centerX,
                y: baseY,
                vx: Math.cos(angle) * 200,
                vy: Math.sin(angle) * 200,
                gravity: 300,
                life: 0.5,
                maxLife: 0.5,
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
        if (!this.isShowing || !this.showButtons) return;

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
        if (!this.isShowing || !this.showButtons) return;

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
        const modalX = (canvas.width - this.modalWidth) / 2;
        const modalY = (canvas.height - this.modalHeight) / 2;

        const totalButtonWidth = this.buttons.length * this.buttonWidth + (this.buttons.length - 1) * this.buttonGap;
        const buttonsStartX = modalX + (this.modalWidth - totalButtonWidth) / 2;
        const buttonsY = modalY + this.modalHeight - this.padding - this.buttonHeight;

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

        // Draw semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw modal background
        ctx.fillStyle = '#2A2A2A';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.fillRect(modalX, modalY, this.modalWidth, this.modalHeight);
        ctx.strokeRect(modalX, modalY, this.modalWidth, this.modalHeight);

        // Draw content based on phase
        const introProgress = Math.min(this.phaseTime / this.phaseDuration.intro, 1);
        
        if (this.animationPhase === 'intro') {
            this.renderIntroAnimation(ctx, modalX, modalY, introProgress);
        } else {
            this.renderTitle(ctx, modalX, modalY);
            this.renderStats(ctx, modalX, modalY);
            
            if (this.animationPhase === 'loot' || this.animationPhase === 'buttons') {
                this.renderLoot(ctx, modalX, modalY);
            }
            
            if (this.showButtons) {
                this.renderButtons(ctx, modalX, modalY);
            }
        }

        // Draw particles
        this.renderParticles(ctx);
    }

    /**
     * Render intro animation (title zoom in)
     */
    renderIntroAnimation(ctx, modalX, modalY, progress) {
        ctx.save();
        ctx.translate(
            modalX + this.modalWidth / 2,
            modalY + this.modalHeight / 2
        );

        const scale = 0.5 + progress * 0.5;
        const alpha = progress;

        ctx.globalAlpha = alpha;
        ctx.scale(scale, scale);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LEVEL COMPLETE!', 0, 0);

        ctx.restore();
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
        const itemsPerRow = 4;
        const itemWidth = 160;
        const itemHeight = 100;
        const itemGap = 10;
        const containerX = modalX + (this.modalWidth - (itemsPerRow * itemWidth + (itemsPerRow - 1) * itemGap)) / 2;

        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < this.acquiredLoot.length && i < 8; i++) {
            const lootId = this.acquiredLoot[i];
            const lootInfo = LootRegistry.getLootType(lootId);
            if (!lootInfo) continue;

            const row = Math.floor(i / itemsPerRow);
            const col = i % itemsPerRow;
            const itemX = containerX + col * (itemWidth + itemGap);
            const itemY = startY + row * (itemHeight + itemGap);

            // Draw loot tile
            const rarityColor = this.getRarityColor(lootId);
            ctx.fillStyle = rarityColor;
            ctx.globalAlpha = 0.2;
            ctx.fillRect(itemX, itemY, itemWidth, itemHeight);
            ctx.globalAlpha = 1;

            ctx.strokeStyle = rarityColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(itemX, itemY, itemWidth, itemHeight);

            // Draw emblem
            ctx.fillStyle = rarityColor;
            ctx.font = 'bold 32px Arial';
            ctx.fillText(lootInfo.emblem || '?', itemX + itemWidth / 2, itemY + 20);

            // Draw name
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px Arial';
            const words = lootInfo.name.split(' ');
            const textY = itemY + 45;
            for (let j = 0; j < words.length; j++) {
                ctx.fillText(words[j], itemX + itemWidth / 2, textY + j * 15);
            }

            // Draw value
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(`${lootInfo.sellValue}g`, itemX + itemWidth / 2, itemY + itemHeight - 12);
        }
    }

    /**
     * Render buttons (appear after animations)
     */
    renderButtons(ctx, modalX, modalY) {
        const buttonY = modalY + this.modalHeight - this.padding - this.buttonHeight;
        const totalButtonWidth = this.buttons.length * this.buttonWidth + (this.buttons.length - 1) * this.buttonGap;
        const startX = modalX + (this.modalWidth - totalButtonWidth) / 2;

        this.buttons.forEach((button, index) => {
            const x = startX + index * (this.buttonWidth + this.buttonGap);
            
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
