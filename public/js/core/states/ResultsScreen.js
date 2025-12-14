/**
 * ResultsScreen - In-game modal for displaying level completion or game over results
 * Displays statistics and offers navigation options
 */
export class ResultsScreen {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.opacity = 0;
        this.resultType = null; // 'levelComplete' or 'gameOver'
        this.resultData = null;
        this.selectedButtonIndex = 0;
        this.buttons = [];
        this.isShowing = false;

        // Layout constants
        this.modalWidth = 600;
        this.modalHeight = 500;
        this.padding = 30;
        this.buttonWidth = 180;
        this.buttonHeight = 50;
        this.buttonGap = 30;
    }

    /**
     * Show the results screen with specific data
     * @param {string} type - 'levelComplete' or 'gameOver'
     * @param {object} data - Game result data
     */
    show(type, data) {
        this.resultType = type;
        this.resultData = data;
        this.animationTime = 0;
        this.opacity = 0;
        this.isShowing = true;
        this.selectedButtonIndex = 0;

        // Setup buttons based on result type
        if (type === 'levelComplete') {
            this.buttons = [
                { label: 'NEXT LEVEL', action: 'nextLevel' },
                { label: 'LEVEL SELECT', action: 'levelSelect' }
            ];
        } else {
            this.buttons = [
                { label: 'RETRY', action: 'retry' },
                { label: 'LEVEL SELECT', action: 'levelSelect' }
            ];
        }
    }

    /**
     * Hide the results screen and execute the selected action
     */
    execute(action) {
        this.isShowing = false;
        
        switch (action) {
            case 'nextLevel':
                // Increment level for next level selection
                this.stateManager.selectedLevelInfo = {
                    level: this.resultData.level + 1
                };
                this.stateManager.changeState('levelSelect');
                break;
            case 'retry':
                // Retry current level - don't increment
                this.stateManager.changeState('game');
                break;
            case 'levelSelect':
                this.stateManager.changeState('levelSelect');
                break;
        }
    }

    /**
     * Handle keyboard navigation (if needed)
     */
    handleKeyPress(key) {
        if (!this.isShowing) return;
        
        if (key === 'ArrowLeft') {
            this.selectedButtonIndex = Math.max(0, this.selectedButtonIndex - 1);
        } else if (key === 'ArrowRight') {
            this.selectedButtonIndex = Math.min(this.buttons.length - 1, this.selectedButtonIndex + 1);
        } else if (key === 'Enter') {
            this.execute(this.buttons[this.selectedButtonIndex].action);
        }
    }

    /**
     * Handle click on results modal
     */
    handleClick(x, y) {
        if (!this.isShowing || this.opacity < 0.8) return;

        this.buttons.forEach((button, index) => {
            const pos = this.getButtonPosition(index);
            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {
                this.execute(button.action);
            }
        });
    }

    /**
     * Calculate button position
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
     * Update animation
     */
    update(deltaTime) {
        if (!this.isShowing) return;

        this.animationTime += deltaTime;
        // Fade in over 0.3 seconds
        this.opacity = Math.min(1, this.animationTime / 0.3);
    }

    /**
     * Render the results modal
     */
    render(ctx) {
        if (!this.isShowing || this.opacity === 0) return;

        const canvas = this.stateManager.canvas;
        const modalX = (canvas.width - this.modalWidth) / 2;
        const modalY = (canvas.height - this.modalHeight) / 2;

        // Semi-transparent background overlay
        ctx.globalAlpha = this.opacity * 0.7;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Modal background with border
        ctx.globalAlpha = this.opacity;
        
        // Gradient background
        const gradient = ctx.createLinearGradient(modalX, modalY, modalX, modalY + this.modalHeight);
        gradient.addColorStop(0, '#2a2015');
        gradient.addColorStop(1, '#1a1010');
        ctx.fillStyle = gradient;
        ctx.fillRect(modalX, modalY, this.modalWidth, this.modalHeight);

        // Golden border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(modalX, modalY, this.modalWidth, this.modalHeight);

        // Inner border decoration
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 1;
        ctx.strokeRect(modalX + 2, modalY + 2, this.modalWidth - 4, this.modalHeight - 4);

        // Title
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 32px serif';
        ctx.textAlign = 'center';
        const titleY = modalY + this.padding + 30;
        
        if (this.resultType === 'levelComplete') {
            ctx.fillText('VICTORY!', canvas.width / 2, titleY);
        } else {
            ctx.fillText('GAME OVER', canvas.width / 2, titleY);
        }

        // Stats section
        const statsY = titleY + 60;
        ctx.font = '18px serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#c9a876';

        if (this.resultData) {
            const statsX = modalX + this.padding;
            const lineHeight = 28;
            let currentY = statsY;

            // Display different stats based on result type
            if (this.resultType === 'levelComplete') {
                ctx.fillText(`Level: ${this.resultData.level}`, statsX, currentY);
                currentY += lineHeight;
                ctx.fillText(`Waves Completed: ${this.resultData.wavesCompleted}`, statsX, currentY);
                currentY += lineHeight;
                ctx.fillText(`Health Remaining: ${this.resultData.health}`, statsX, currentY);
                currentY += lineHeight;
                ctx.fillText(`Gold Earned: ${this.resultData.gold}`, statsX, currentY);
            } else {
                ctx.fillText(`Level: ${this.resultData.level}`, statsX, currentY);
                currentY += lineHeight;
                ctx.fillText(`Wave Reached: ${this.resultData.wave}`, statsX, currentY);
                currentY += lineHeight;
                ctx.fillText(`Gold Earned: ${this.resultData.gold}`, statsX, currentY);
            }
        }

        // Buttons
        ctx.globalAlpha = this.opacity;
        this.buttons.forEach((button, index) => {
            const pos = this.getButtonPosition(index);
            const isSelected = index === this.selectedButtonIndex;

            // Button background
            const buttonGradient = ctx.createLinearGradient(pos.y, pos.y + pos.height, 0, 0);
            if (isSelected) {
                buttonGradient.addColorStop(0, '#8b7355');
                buttonGradient.addColorStop(0.5, '#a89968');
                buttonGradient.addColorStop(1, '#9a8960');
            } else {
                buttonGradient.addColorStop(0, '#5a4a3a');
                buttonGradient.addColorStop(0.5, '#7a6a5a');
                buttonGradient.addColorStop(1, '#6a5a4a');
            }
            ctx.fillStyle = buttonGradient;
            ctx.fillRect(pos.x, pos.y, pos.width, pos.height);

            // Button border
            ctx.strokeStyle = isSelected ? '#ffd700' : '#d4af37';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

            // Button text
            ctx.font = 'bold 16px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isSelected ? '#ffe700' : '#d4af37';
            ctx.fillText(button.label, pos.x + pos.width / 2, pos.y + pos.height / 2);
        });

        ctx.globalAlpha = 1;
    }
}
