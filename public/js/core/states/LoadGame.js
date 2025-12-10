import { SaveSystem } from '../SaveSystem.js';

export class LoadGame {
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

// console.log('LoadGame: constructor called');
    }

    enter() {
// console.log('LoadGame: enter called');

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

// console.log('LoadGame: Back button clicked');
            this.stateManager.changeState('mainMenu');
            return;
        }

        // Check slot clicks
        this.slots.forEach((slotNum, index) => {
            const pos = this.getSlotPosition(index);

            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {

                const saveData = SaveSystem.getSave(slotNum);

                if (saveData) {
// console.log(`LoadGame: Loading save from slot ${slotNum}`, saveData);
                    this.stateManager.currentSaveSlot = slotNum;
                    this.stateManager.currentSaveData = saveData;
                    this.stateManager.changeState('levelSelect');
                } else {
// console.log(`LoadGame: Slot ${slotNum} is empty`);
                }
            }
        });
    }

    update(deltaTime) {
        this.animationTime += deltaTime;

        // Title fade in
        if (this.animationTime > 0.3) {
            this.titleOpacity = Math.min(1, (this.animationTime - 0.3) / 0.7);
        }

        // Content fade in
        if (this.animationTime > 1) {
            this.showContent = true;
            this.contentOpacity = Math.min(1, (this.animationTime - 1) / 0.7);
        }
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
            ctx.fillText('LOAD GAME', canvas.width / 2, 100);
            ctx.strokeText('LOAD GAME', canvas.width / 2, 100);

            // Slots
            if (this.showContent) {
                ctx.globalAlpha = this.contentOpacity;

                this.slots.forEach((slotNum, index) => {
                    this.renderSaveSlot(ctx, slotNum, index);
                });
            }

            ctx.globalAlpha = 1;

        } catch (error) {
            console.error('LoadGame render error:', error);
            ctx.fillStyle = '#2a1a0f';
            ctx.fillRect(0, 0, ctx.canvas.width || 800, ctx.canvas.height || 600);
            ctx.fillStyle = '#ff0000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('LoadGame Error', (ctx.canvas.width || 800) / 2, (ctx.canvas.height || 600) / 2);
        }
    }

    renderSaveSlot(ctx, slotNum, index) {
        const pos = this.getSlotPosition(index);
        const saveInfo = SaveSystem.getSaveInfo(slotNum);
        const isHovered = this.hoveredSlot === slotNum;

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

        if (saveInfo.isEmpty) {
            ctx.font = '14px serif';
            ctx.fillStyle = '#666';
            ctx.fillText(saveInfo.displayText, pos.x + 20, pos.y + 55);
        } else {
            ctx.font = '16px serif';
            ctx.fillStyle = '#d4af37';
            ctx.fillText(saveInfo.displayText, pos.x + 20, pos.y + 50);

            ctx.font = '12px serif';
            ctx.fillStyle = '#999';
            ctx.fillText(saveInfo.dateString, pos.x + 20, pos.y + 65);
        }
    }
}
