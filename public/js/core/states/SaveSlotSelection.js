import { SaveSystem } from '../SaveSystem.js';
import { ParticleSystem } from '../ParticleSystem.js';

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
        this.particleSystem = null;
        
        // Warning dialog state
        this.showWarning = false;
        this.warningSlotNumber = null;
        this.warningConfirmHovered = false;
        this.warningCancelHovered = false;
        
        // Name input dialog state
        this.showNameInput = false;
        this.nameInputValue = '';
        this.pendingSlotNumber = null;
        this.nameInputConfirmHovered = false;
        this.nameInputCancelHovered = false;
        this.maxNameLength = 20;
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
        
        // Reset hover states
        this.backButtonHovered = false;
        this.hoveredSlot = -1;
        
        // Reset warning dialog
        this.showWarning = false;
        this.warningSlotNumber = null;
        this.warningConfirmHovered = false;
        this.warningCancelHovered = false;
        
        // Reset name input dialog
        this.showNameInput = false;
        this.nameInputValue = '';
        this.pendingSlotNumber = null;
        this.nameInputConfirmHovered = false;
        this.nameInputCancelHovered = false;
        
        // Get or initialize shared particle system
        if (this.stateManager.canvas && this.stateManager.canvas.width > 0 && this.stateManager.canvas.height > 0) {
            this.particleSystem = ParticleSystem.getInstance(this.stateManager.canvas.width, this.stateManager.canvas.height);
        }
        
        // Play menu theme music
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playMusic('menu-theme');
        }

        this.setupMouseListeners();
    }

    exit() {
        this.removeMouseListeners();
        // Reset cursor to default
        if (this.stateManager.canvas) {
            this.stateManager.canvas.style.cursor = 'default';
        }
    }

    setupMouseListeners() {
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            // Account for CSS scaling
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            this.handleClick(x, y);
        };
        this.keyDownHandler = (e) => this.handleKeyDown(e);
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.stateManager.canvas.addEventListener('click', this.clickHandler);
        window.addEventListener('keydown', this.keyDownHandler);
    }

    removeMouseListeners() {
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.clickHandler) {
            this.stateManager.canvas.removeEventListener('click', this.clickHandler);
        }
        if (this.keyDownHandler) {
            window.removeEventListener('keydown', this.keyDownHandler);
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
        // Account for CSS scaling
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // If name input dialog is showing, handle name input button hovers
        if (this.showNameInput) {
            const canvas = this.stateManager.canvas;
            const panelWidth = 500;
            const panelHeight = 280;
            const panelX = (canvas.width - panelWidth) / 2;
            const panelY = (canvas.height - panelHeight) / 2;
            
            // Confirm button
            const confirmButtonX = panelX + panelWidth / 2 - 110;
            const confirmButtonY = panelY + panelHeight - 80;
            const buttonWidth = 100;
            const buttonHeight = 40;
            this.nameInputConfirmHovered = x >= confirmButtonX && x <= confirmButtonX + buttonWidth &&
                                           y >= confirmButtonY && y <= confirmButtonY + buttonHeight;
            
            // Cancel button
            const cancelButtonX = panelX + panelWidth / 2 + 10;
            this.nameInputCancelHovered = x >= cancelButtonX && x <= cancelButtonX + buttonWidth &&
                                          y >= confirmButtonY && y <= confirmButtonY + buttonHeight;
            
            this.stateManager.canvas.style.cursor = 
                (this.nameInputConfirmHovered || this.nameInputCancelHovered) ? 'pointer' : 'default';
            return;
        }

        // If warning dialog is showing, handle warning button hovers
        if (this.showWarning) {
            const canvas = this.stateManager.canvas;
            const panelWidth = 500;
            const panelHeight = 250;
            const panelX = (canvas.width - panelWidth) / 2;
            const panelY = (canvas.height - panelHeight) / 2;
            
            // Confirm button
            const confirmButtonX = panelX + panelWidth / 2 - 110;
            const confirmButtonY = panelY + panelHeight - 80;
            const buttonWidth = 100;
            const buttonHeight = 40;
            this.warningConfirmHovered = x >= confirmButtonX && x <= confirmButtonX + buttonWidth &&
                                        y >= confirmButtonY && y <= confirmButtonY + buttonHeight;
            
            // Cancel button
            const cancelButtonX = panelX + panelWidth / 2 + 10;
            this.warningCancelHovered = x >= cancelButtonX && x <= cancelButtonX + buttonWidth &&
                                       y >= cancelButtonY && y <= cancelButtonY + buttonHeight;
            
            this.stateManager.canvas.style.cursor = 
                (this.warningConfirmHovered || this.warningCancelHovered) ? 'pointer' : 'default';
            return;
        }

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
        // If name input dialog is showing, handle name input button clicks
        if (this.showNameInput) {
            const canvas = this.stateManager.canvas;
            const panelWidth = 500;
            const panelHeight = 280;
            const panelX = (canvas.width - panelWidth) / 2;
            const panelY = (canvas.height - panelHeight) / 2;
            
            // Confirm button
            const confirmButtonX = panelX + panelWidth / 2 - 110;
            const confirmButtonY = panelY + panelHeight - 80;
            const buttonWidth = 100;
            const buttonHeight = 40;
            
            if (x >= confirmButtonX && x <= confirmButtonX + buttonWidth &&
                y >= confirmButtonY && y <= confirmButtonY + buttonHeight) {
                this.confirmNameInput();
                return;
            }
            
            // Cancel button
            const cancelButtonX = panelX + panelWidth / 2 + 10;
            if (x >= cancelButtonX && x <= cancelButtonX + buttonWidth &&
                y >= confirmButtonY && y <= confirmButtonY + buttonHeight) {
                // Close name input dialog
                this.showNameInput = false;
                this.nameInputValue = '';
                this.pendingSlotNumber = null;
                this.nameInputConfirmHovered = false;
                this.nameInputCancelHovered = false;
                return;
            }
            return;
        }

        // If warning dialog is showing, handle warning button clicks
        if (this.showWarning) {
            const canvas = this.stateManager.canvas;
            const panelWidth = 500;
            const panelHeight = 250;
            const panelX = (canvas.width - panelWidth) / 2;
            const panelY = (canvas.height - panelHeight) / 2;
            
            // Confirm button
            const confirmButtonX = panelX + panelWidth / 2 - 110;
            const confirmButtonY = panelY + panelHeight - 80;
            const buttonWidth = 100;
            const buttonHeight = 40;
            
            if (x >= confirmButtonX && x <= confirmButtonX + buttonWidth &&
                y >= confirmButtonY && y <= confirmButtonY + buttonHeight) {
                // Wipe the slot completely first to ensure clean slate
                SaveSystem.wipeSaveSlot(this.warningSlotNumber);
                
                // Close warning dialog and show name input dialog
                const slotNum = this.warningSlotNumber;
                this.showWarning = false;
                this.warningSlotNumber = null;
                this.warningConfirmHovered = false;
                this.warningCancelHovered = false;
                
                // Show name input dialog
                this.showNameInput = true;
                this.pendingSlotNumber = slotNum;
                this.nameInputValue = '';
                return;
            }
            
            // Cancel button
            const cancelButtonX = panelX + panelWidth / 2 + 10;
            if (x >= cancelButtonX && x <= cancelButtonX + buttonWidth &&
                y >= confirmButtonY && y <= confirmButtonY + buttonHeight) {
                // Close warning dialog
                this.showWarning = false;
                this.warningSlotNumber = null;
                this.warningConfirmHovered = false;
                this.warningCancelHovered = false;
                return;
            }
            return;
        }

        const buttonPos = this.getBackButtonPosition();

        if (x >= buttonPos.x && x <= buttonPos.x + buttonPos.width &&
            y >= buttonPos.y && y <= buttonPos.y + buttonPos.height) {

            this.stateManager.changeState('startScreen');
            return;
        }

        // Check slot clicks
        this.slots.forEach((slotNum, index) => {
            const pos = this.getSlotPosition(index);

            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {

                // Check if slot is already taken
                const existingSave = SaveSystem.getSave(slotNum);
                if (existingSave) {
                    // Show warning dialog
                    this.showWarning = true;
                    this.warningSlotNumber = slotNum;
                } else {
                    // Show name input dialog for new game
                    this.showNameInput = true;
                    this.pendingSlotNumber = slotNum;
                    this.nameInputValue = '';
                }
            }
        });
    }

    handleKeyDown(e) {
        if (!this.showNameInput) return;
        
        if (e.key === 'Escape') {
            // Close name input dialog
            this.showNameInput = false;
            this.nameInputValue = '';
            this.pendingSlotNumber = null;
            this.nameInputConfirmHovered = false;
            this.nameInputCancelHovered = false;
            return;
        }
        
        if (e.key === 'Enter') {
            this.confirmNameInput();
            return;
        }
        
        if (e.key === 'Backspace') {
            this.nameInputValue = this.nameInputValue.slice(0, -1);
            return;
        }
        
        // Allow letters, numbers, spaces, and common punctuation
        if (e.key.length === 1 && this.nameInputValue.length < this.maxNameLength) {
            const validChars = /^[a-zA-Z0-9 \-_'.]$/;
            if (validChars.test(e.key)) {
                this.nameInputValue += e.key;
            }
        }
    }

    confirmNameInput() {
        const commanderName = this.nameInputValue.trim() || 'Commander';
        
        // Create new game in this slot with the entered commander name
        const newGameData = SaveSystem.createNewGameState(commanderName);
        SaveSystem.saveSettlementData(this.pendingSlotNumber, newGameData);

        // Set as current slot
        this.stateManager.currentSaveSlot = this.pendingSlotNumber;
        this.stateManager.currentSaveData = newGameData;

        // Close dialog and go to settlement hub
        this.showNameInput = false;
        this.nameInputValue = '';
        this.pendingSlotNumber = null;
        this.stateManager.changeState('settlementHub');
    }

    update(deltaTime) {
        this.animationTime += deltaTime;

        // Title fade in (faster - 0.4 seconds)
        if (this.animationTime > 0.1) {
            this.titleOpacity = Math.min(1, (this.animationTime - 0.1) / 0.4);
        }

        // Content fade in (faster - 0.5 seconds, starts at 0.3 seconds)
        if (this.animationTime > 0.3) {
            this.showContent = true;
            this.contentOpacity = Math.min(1, (this.animationTime - 0.3) / 0.5);
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

            // Reset canvas shadow properties to prevent persistent glow effects
            ctx.shadowColor = 'rgba(0, 0, 0, 0)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.globalAlpha = 1;

            // Background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#2a1a0f');
            gradient.addColorStop(1, '#1a0f0a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Render particles from shared system
            if (this.particleSystem) {
                this.particleSystem.render(ctx);
            }
            
            // Semi-transparent panel overlay for menu content
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;

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
            
            // Warning dialog for overwriting save
            if (this.showWarning) {
                this.renderWarningDialog(ctx);
            }
            
            // Name input dialog
            if (this.showNameInput) {
                this.renderNameInputDialog(ctx);
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
        const saveInfo = SaveSystem.getSaveInfo(slotNum);
        const isHovered = this.hoveredSlot === slotNum;
        const adjustedY = isHovered ? pos.y - 3 : pos.y;  // Move up when hovered

        // Slot background
        if (isHovered) {
            ctx.fillStyle = '#4a3a2a';
        } else {
            ctx.fillStyle = '#1a0f05';
        }
        ctx.fillRect(pos.x, adjustedY, pos.width, pos.height);

        // Slot border with glow on hover
        if (isHovered) {
            ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        ctx.strokeStyle = isHovered ? '#ffe700' : '#664422';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.strokeRect(pos.x, adjustedY, pos.width, pos.height);

        // Slot content
        ctx.textAlign = 'left';
        ctx.fillStyle = isHovered ? '#ffe700' : '#c9a876';
        ctx.font = 'bold 18px serif';
        
        // Display commander name if save exists, otherwise show slot number
        if (saveInfo.isEmpty) {
            ctx.fillText(`SLOT ${slotNum}`, pos.x + 20, adjustedY + 30);
            ctx.font = '14px serif';
            ctx.fillStyle = '#666';
            ctx.fillText('Empty Slot - Click to start new game', pos.x + 20, adjustedY + 55);
        } else {
            // Show commander name prominently
            ctx.fillText(saveInfo.commanderName || 'Commander', pos.x + 20, adjustedY + 30);
            
            // Show last saved date/time
            ctx.font = '14px serif';
            ctx.fillStyle = '#999';
            ctx.fillText(`Last saved: ${saveInfo.dateString}`, pos.x + 20, adjustedY + 55);
        }

        // Reset shadow properties
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    renderWarningDialog(ctx) {
        const canvas = this.stateManager.canvas;
        const panelWidth = 500;
        const panelHeight = 250;
        const panelX = (canvas.width - panelWidth) / 2;
        const panelY = (canvas.height - panelHeight) / 2;
        
        // Semi-transparent background overlay
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        
        // Panel background
        ctx.fillStyle = '#3a2f26';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Title
        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#ffe700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Overwrite Save?', canvas.width / 2, panelY + 30);
        
        // Message
        ctx.font = '16px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.fillText('This save slot already contains a game.', canvas.width / 2, panelY + 80);
        ctx.fillText('Do you want to overwrite it?', canvas.width / 2, panelY + 110);
        
        // Confirm button
        const confirmButtonX = panelX + panelWidth / 2 - 110;
        const confirmButtonY = panelY + panelHeight - 80;
        const buttonWidth = 100;
        const buttonHeight = 40;
        
        if (this.warningConfirmHovered) {
            ctx.fillStyle = '#ffe700';
        } else {
            ctx.fillStyle = '#d4af37';
        }
        ctx.fillRect(confirmButtonX, confirmButtonY, buttonWidth, buttonHeight);
        
        ctx.strokeStyle = this.warningConfirmHovered ? '#ffff00' : '#a67c52';
        ctx.lineWidth = this.warningConfirmHovered ? 2 : 1;
        ctx.strokeRect(confirmButtonX, confirmButtonY, buttonWidth, buttonHeight);
        
        ctx.font = 'bold 14px serif';
        ctx.fillStyle = '#1a0f05';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('YES', confirmButtonX + buttonWidth / 2, confirmButtonY + buttonHeight / 2);
        
        // Cancel button
        const cancelButtonX = panelX + panelWidth / 2 + 10;
        
        if (this.warningCancelHovered) {
            ctx.fillStyle = '#ffe700';
        } else {
            ctx.fillStyle = '#d4af37';
        }
        ctx.fillRect(cancelButtonX, confirmButtonY, buttonWidth, buttonHeight);
        
        ctx.strokeStyle = this.warningCancelHovered ? '#ffff00' : '#a67c52';
        ctx.lineWidth = this.warningCancelHovered ? 2 : 1;
        ctx.strokeRect(cancelButtonX, confirmButtonY, buttonWidth, buttonHeight);
        
        ctx.font = 'bold 14px serif';
        ctx.fillStyle = '#1a0f05';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NO', cancelButtonX + buttonWidth / 2, confirmButtonY + buttonHeight / 2);
    }

    renderNameInputDialog(ctx) {
        const canvas = this.stateManager.canvas;
        const panelWidth = 500;
        const panelHeight = 280;
        const panelX = (canvas.width - panelWidth) / 2;
        const panelY = (canvas.height - panelHeight) / 2;
        
        // Semi-transparent background overlay
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        
        // Panel background
        ctx.fillStyle = '#3a2f26';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Title
        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#ffe700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Enter Commander Name', canvas.width / 2, panelY + 30);
        
        // Subtitle
        ctx.font = '14px serif';
        ctx.fillStyle = '#999';
        ctx.fillText('(Press Enter to confirm, Escape to cancel)', canvas.width / 2, panelY + 65);
        
        // Text input box
        const inputBoxWidth = 350;
        const inputBoxHeight = 45;
        const inputBoxX = (canvas.width - inputBoxWidth) / 2;
        const inputBoxY = panelY + 100;
        
        // Input box background
        ctx.fillStyle = '#1a0f05';
        ctx.fillRect(inputBoxX, inputBoxY, inputBoxWidth, inputBoxHeight);
        
        // Input box border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(inputBoxX, inputBoxY, inputBoxWidth, inputBoxHeight);
        
        // Input text
        ctx.font = 'bold 20px serif';
        ctx.fillStyle = '#ffe700';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const displayText = this.nameInputValue || '';
        ctx.fillText(displayText, inputBoxX + 15, inputBoxY + inputBoxHeight / 2);
        
        // Blinking cursor
        const cursorBlink = Math.floor(Date.now() / 500) % 2 === 0;
        if (cursorBlink) {
            const textWidth = ctx.measureText(displayText).width;
            ctx.fillStyle = '#ffe700';
            ctx.fillRect(inputBoxX + 15 + textWidth + 2, inputBoxY + 10, 2, inputBoxHeight - 20);
        }
        
        // Character count
        ctx.font = '12px serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'right';
        ctx.fillText(`${this.nameInputValue.length}/${this.maxNameLength}`, inputBoxX + inputBoxWidth - 10, inputBoxY + inputBoxHeight + 20);
        
        // Confirm button
        const confirmButtonX = panelX + panelWidth / 2 - 110;
        const confirmButtonY = panelY + panelHeight - 80;
        const buttonWidth = 100;
        const buttonHeight = 40;
        
        if (this.nameInputConfirmHovered) {
            ctx.fillStyle = '#ffe700';
        } else {
            ctx.fillStyle = '#d4af37';
        }
        ctx.fillRect(confirmButtonX, confirmButtonY, buttonWidth, buttonHeight);
        
        ctx.strokeStyle = this.nameInputConfirmHovered ? '#ffff00' : '#a67c52';
        ctx.lineWidth = this.nameInputConfirmHovered ? 2 : 1;
        ctx.strokeRect(confirmButtonX, confirmButtonY, buttonWidth, buttonHeight);
        
        ctx.font = 'bold 14px serif';
        ctx.fillStyle = '#1a0f05';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CONFIRM', confirmButtonX + buttonWidth / 2, confirmButtonY + buttonHeight / 2);
        
        // Cancel button
        const cancelButtonX = panelX + panelWidth / 2 + 10;
        
        if (this.nameInputCancelHovered) {
            ctx.fillStyle = '#ffe700';
        } else {
            ctx.fillStyle = '#d4af37';
        }
        ctx.fillRect(cancelButtonX, confirmButtonY, buttonWidth, buttonHeight);
        
        ctx.strokeStyle = this.nameInputCancelHovered ? '#ffff00' : '#a67c52';
        ctx.lineWidth = this.nameInputCancelHovered ? 2 : 1;
        ctx.strokeRect(cancelButtonX, confirmButtonY, buttonWidth, buttonHeight);
        
        ctx.font = 'bold 14px serif';
        ctx.fillStyle = '#1a0f05';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CANCEL', cancelButtonX + buttonWidth / 2, confirmButtonY + buttonHeight / 2);
    }
}
