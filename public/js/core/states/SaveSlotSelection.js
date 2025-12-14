import { SaveSystem } from '../SaveSystem.js';

/**
 * SaveSlotSelection State
 * Displayed after player selects "New Game"
 * Player chooses which save slot to use for their new game
 */
export class SaveSlotSelection {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.titleOpacity = 0;
        this.contentOpacity = 0;
        this.showContent = false;
        this.backButtonHovered = false;
        this.hoveredSlot = -1;
        this.slots = [1, 2, 3];
        this.slotButtonWidth = 300;
        this.slotButtonHeight = 80;
        this.slotButtonGap = 40;
    }

    enter() {
        // Hide game UI
        const statsBar = document.getElementById('stats-bar');
        const sidebar = document.getElementById('tower-sidebar');

        if (statsBar) {
            statsBar.style.display = 'none';
        }
        if (sidebar) {
            sidebar.style.display = 'none';
        }

        // Reset animation
        this.animationTime = 0;
        this.showContent = false;
        this.titleOpacity = 0;
        this.contentOpacity = 0;
        this.backButtonHovered = false;
        this.hoveredSlot = -1;

        this.setupMouseListeners();
    }

    exit() {
        this.removeMouseListeners();
    }

    setupMouseListeners() {
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        };
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.stateManager.canvas.addEventListener('click', this.clickHandler);
    }

    removeMouseListeners() {
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.clickHandler) {
            this.stateManager.canvas.removeEventListener('click', this.clickHandler);
        }
    }

    getBackButtonPosition() {
        const canvas = this.stateManager.canvas;
        return {
            x: canvas.width - 150,
            y: 20,
            width: 130,
            height: 40
        };
    }

    getSlotPosition(slotIndex) {
        const canvas = this.stateManager.canvas;
        const totalHeight = this.slots.length * this.slotButtonHeight + (this.slots.length - 1) * this.slotButtonGap;
        const startY = (canvas.height - totalHeight) / 2;

        return {
            x: canvas.width / 2 - this.slotButtonWidth / 2,
            y: startY + slotIndex * (this.slotButtonHeight + this.slotButtonGap),
            width: this.slotButtonWidth,
            height: this.slotButtonHeight
        };
    }

    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const buttonPos = this.getBackButtonPosition();
        this.backButtonHovered = x >= buttonPos.x && x <= buttonPos.x + buttonPos.width &&
                               y >= buttonPos.y && y <= buttonPos.y + buttonPos.height;

        // Check slot hover
        this.hoveredSlot = -1;
        this.slots.forEach((slotNum, index) => {
            const pos = this.getSlotPosition(index);
            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {
                this.hoveredSlot = slotNum;
            }
        });

        this.stateManager.canvas.style.cursor = 
            (this.backButtonHovered || this.hoveredSlot !== -1) ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        const buttonPos = this.getBackButtonPosition();

        if (x >= buttonPos.x && x <= buttonPos.x + buttonPos.width &&
            y >= buttonPos.y && y <= buttonPos.y + buttonPos.height) {

            this.stateManager.changeState('mainMenu');
            return;
        }

        // Check slot clicks
        this.slots.forEach((slotNum, index) => {
            const pos = this.getSlotPosition(index);

            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {

                // Create new game in this slot
                const newGameData = SaveSystem.createNewGameState();
                SaveSystem.saveGame(slotNum, newGameData);

                // Set as current slot
                this.stateManager.currentSaveSlot = slotNum;
                this.stateManager.currentSaveData = newGameData;

                // Go to level select
                this.stateManager.changeState('levelSelect');
            }
        });
    }

    update(deltaTime) {
        this.animationTime += deltaTime;

        // Title is immediately visible
        this.titleOpacity = 1;

        // Content is immediately visible
        this.showContent = true;
        this.contentOpacity = 1;
    }

    render(ctx) {
        try {
            const canvas = this.stateManager.canvas;

            if (!canvas || !canvas.width || !canvas.height) {
                ctx.fillStyle = '#2a1a0f';
                ctx.fillRect(0, 0, 800, 600);
                return;
            }

            // Background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#2a1a0f');
            gradient.addColorStop(1, '#1a0f0a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Back button
            const buttonPos = this.getBackButtonPosition();
            ctx.fillStyle = this.backButtonHovered ? '#66BB6A' : '#4CAF50';
            ctx.fillRect(buttonPos.x, buttonPos.y, buttonPos.width, buttonPos.height);

            ctx.strokeStyle = this.backButtonHovered ? '#d4af37' : '#2E7D32';
            ctx.lineWidth = this.backButtonHovered ? 2 : 1;
            ctx.strokeRect(buttonPos.x, buttonPos.y, buttonPos.width, buttonPos.height);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px serif';
            ctx.textAlign = 'center';
            ctx.fillText('BACK', buttonPos.x + buttonPos.width / 2, buttonPos.y + buttonPos.height / 2 + 4);

            // Title
            ctx.globalAlpha = Math.max(0.1, this.titleOpacity);
            ctx.textAlign = 'center';
            ctx.font = 'bold 64px serif';
            ctx.fillStyle = '#d4af37';
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 2;
            ctx.fillText('NEW GAME', canvas.width / 2, 100);
            ctx.strokeText('NEW GAME', canvas.width / 2, 100);

            // Subtitle
            ctx.font = '18px serif';
            ctx.fillStyle = '#c9a876';
            ctx.fillText('Select a save slot', canvas.width / 2, 145);

            // Slots
            if (this.showContent) {
                ctx.globalAlpha = this.contentOpacity;

                this.slots.forEach((slotNum, index) => {
                    this.renderSaveSlot(ctx, slotNum, index);
                });
            }

            ctx.globalAlpha = 1;

        } catch (error) {
            console.error('SaveSlotSelection render error:', error);
            ctx.fillStyle = '#2a1a0f';
            ctx.fillRect(0, 0, ctx.canvas.width || 800, ctx.canvas.height || 600);
            ctx.fillStyle = '#ff0000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SaveSlotSelection Error', (ctx.canvas.width || 800) / 2, (ctx.canvas.height || 800) / 2);
        }
    }

    renderSaveSlot(ctx, slotNum, index) {
        const pos = this.getSlotPosition(index);
        const isHovered = this.hoveredSlot === slotNum;
        const existingSave = SaveSystem.getSave(slotNum);

        // Slot background
        ctx.fillStyle = isHovered ? '#3a2a1a' : '#1a0f05';
        ctx.fillRect(pos.x, pos.y, pos.width, pos.height);

        // Slot border
        ctx.strokeStyle = isHovered ? '#d4af37' : '#664422';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.strokeRect(pos.x, pos.y, pos.width, pos.height);

        // Slot content
        ctx.textAlign = 'left';
        ctx.fillStyle = isHovered ? '#d4af37' : '#c9a876';
        ctx.font = 'bold 18px serif';
        ctx.fillText(`SLOT ${slotNum}`, pos.x + 20, pos.y + 30);

        if (existingSave) {
            const date = new Date(existingSave.timestamp);
            const dateString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            ctx.font = '16px serif';
            ctx.fillStyle = '#d4af37';
            ctx.fillText(`Progress: Level ${existingSave.lastPlayedLevel}`, pos.x + 20, pos.y + 50);

            ctx.font = '12px serif';
            ctx.fillStyle = '#999';
            ctx.fillText(`Last played: ${dateString}`, pos.x + 20, pos.y + 65);
        } else {
            ctx.font = '14px serif';
            ctx.fillStyle = '#666';
            ctx.fillText('Empty Slot - Click to start new game', pos.x + 20, pos.y + 55);
        }
    }
}
