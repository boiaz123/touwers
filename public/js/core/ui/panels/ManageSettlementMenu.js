import { SaveSystem } from '../../systems/SaveSystem.js';

// Import Tauri invoke for app control
let invoke = null;
if (typeof window !== 'undefined') {
    // Try to get invoke from Tauri API - will be null if not in Tauri
    if (window.__TAURI_INTERNALS__?.invoke) {
        invoke = window.__TAURI_INTERNALS__.invoke;
    }
}

/**
 * Manage Settlement Menu
 * Allows player to save, load, manage options, and quit
 */
export class ManageSettlementMenu {
    constructor(stateManager, settlementHub) {
        this.stateManager = stateManager;
        this.settlementHub = settlementHub;
        this.isOpen = false;
        this.animationProgress = 0;
        this.openTime = 0; // Track when menu was opened to prevent click-through
        this.activeWarningDialog = null; // 'quitSettlement', 'quitTouwers', or null
        this.warningDialogOpenTime = 0; // Timestamp when warning dialog was shown

        this.buttons = [
            { label: 'SAVE SETTLEMENT', action: 'save', hovered: false },
            { label: 'LOAD SETTLEMENT', action: 'load', hovered: false },
            { label: 'OPTIONS', action: 'options', hovered: false },
            { label: 'QUIT SETTLEMENT', action: 'quitSettlement', hovered: false },
            { label: 'QUIT TOUWERS', action: 'quitTouwers', hovered: false },
        ];
        this.closeButtonHovered = false;
        this.buttonWidth = 300;
        this.buttonHeight = 52;
        this.buttonMarginTop = 52;
        this.buttonGap = 10;
    }

    drawCornerTrim(ctx, x, y, size = 20, isTopLeft = true, isTopRight = false, isBottomLeft = false, isBottomRight = false) {
        const cornerSize = size;

        // Draw corner rectangle with golden color
        ctx.fillStyle = '#d4af37';

        if (isTopLeft) {
            ctx.fillRect(x, y, cornerSize, 3);
            ctx.fillRect(x, y, 3, cornerSize);
        } else if (isTopRight) {
            ctx.fillRect(x - cornerSize, y, cornerSize, 3);
            ctx.fillRect(x - 3, y, 3, cornerSize);
        } else if (isBottomLeft) {
            ctx.fillRect(x, y - 3, cornerSize, 3);
            ctx.fillRect(x, y - cornerSize, 3, cornerSize);
        } else if (isBottomRight) {
            ctx.fillRect(x - cornerSize, y - 3, cornerSize, 3);
            ctx.fillRect(x - 3, y - cornerSize, 3, cornerSize);
        }

        // Add a small decorative gem/circle in each corner
        ctx.fillStyle = '#ffd700';
        const gemSize = 5;
        if (isTopLeft) {
            ctx.beginPath();
            ctx.arc(x + gemSize, y + gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (isTopRight) {
            ctx.beginPath();
            ctx.arc(x - gemSize, y + gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (isBottomLeft) {
            ctx.beginPath();
            ctx.arc(x + gemSize, y - gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (isBottomRight) {
            ctx.beginPath();
            ctx.arc(x - gemSize, y - gemSize, gemSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    open() {
        this.isOpen = true;
        this.animationProgress = 0;
        this.openTime = Date.now(); // Record when menu was opened
        this.activeWarningDialog = null; // Clear any existing warning dialog state
    }

    close() {
        this.isOpen = false;
        this.activeWarningDialog = null;
        this.settlementHub.closePopup();
    }

    update(deltaTime) {
        if (this.isOpen && this.animationProgress < 1) {
            this.animationProgress += deltaTime * 2;
        }
    }

    updateHoverState(x, y) {
        const canvas = this.stateManager.canvas;

        if (this.activeWarningDialog) {
            this.updateWarningDialogHoverState(x, y);
            return;
        }

        const menuPadding = 30;
        const menuWidth = this.buttonWidth + menuPadding * 2;
        const menuHeight = this.buttons.length * (this.buttonHeight + this.buttonGap) + this.buttonMarginTop + menuPadding * 2;
        const menuX = canvas.width / 2 - menuWidth / 2;
        const menuY = canvas.height / 2 - menuHeight / 2;

        this.buttons.forEach((button, index) => {
            const buttonX = menuX + menuPadding;
            const buttonY = menuY + this.buttonMarginTop + index * (this.buttonHeight + this.buttonGap);
            button.hovered = x >= buttonX && x <= buttonX + this.buttonWidth &&
                           y >= buttonY && y <= buttonY + this.buttonHeight;
        });

        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        this.closeButtonHovered = x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
                                   y >= closeButtonY && y <= closeButtonY + closeButtonSize;

        this.stateManager.canvas.style.cursor =
            (this.buttons.some(b => b.hovered) || this.closeButtonHovered) ? 'pointer' : 'default';
    }

    updateWarningDialogHoverState(x, y) {
        const canvas = this.stateManager.canvas;
        const dialogWidth = 480;
        const dialogHeight = 220;
        const dialogX = canvas.width / 2 - dialogWidth / 2;
        const dialogY = canvas.height / 2 - dialogHeight / 2;
        const buttonWidth = 130;
        const buttonHeight = 45;
        const buttonGap = 15;

        // Button positions in warning dialog
        const totalButtonWidth = buttonWidth * 3 + buttonGap * 2;
        const buttonsStartX = dialogX + (dialogWidth - totalButtonWidth) / 2;

        const cancelX = buttonsStartX;
        const cancelY = dialogY + 130;

        const saveQuitX = buttonsStartX + buttonWidth + buttonGap;
        const saveQuitY = dialogY + 130;

        const quitX = buttonsStartX + (buttonWidth + buttonGap) * 2;
        const quitY = dialogY + 130;

        const cancelHovered = x >= cancelX && x <= cancelX + buttonWidth && y >= cancelY && y <= cancelY + buttonHeight;
        const saveQuitHovered = x >= saveQuitX && x <= saveQuitX + buttonWidth && y >= saveQuitY && y <= saveQuitY + buttonHeight;
        const quitHovered = x >= quitX && x <= quitX + buttonWidth && y >= quitY && y <= quitY + buttonHeight;

        this.warningCancelHovered = cancelHovered;
        this.warningSaveQuitHovered = saveQuitHovered;
        this.warningQuitHovered = quitHovered;

        this.stateManager.canvas.style.cursor = (cancelHovered || saveQuitHovered || quitHovered) ? 'pointer' : 'default';
    }

    handleClick(x, y) {
        // Prevent registering clicks for 200ms after opening to avoid click-through
        const timeSinceOpen = Date.now() - this.openTime;
        if (timeSinceOpen < 200) {
            return;
        }

        const canvas = this.stateManager.canvas;

        if (this.activeWarningDialog) {
            this.handleWarningDialogClick(x, y);
            return;
        }

        const menuPadding = 30;
        const menuWidth = this.buttonWidth + menuPadding * 2;
        const menuHeight = this.buttons.length * (this.buttonHeight + this.buttonGap) + this.buttonMarginTop + menuPadding * 2;
        const menuX = canvas.width / 2 - menuWidth / 2;
        const menuY = canvas.height / 2 - menuHeight / 2;

        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        if (x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
            y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.playSFX('button-click');
            }
            this.close();
            return;
        }

        for (let i = 0; i < this.buttons.length; i++) {
            const button = this.buttons[i];
            const buttonX = menuX + menuPadding;
            const buttonY = menuY + this.buttonMarginTop + i * (this.buttonHeight + this.buttonGap);

            if (x >= buttonX && x <= buttonX + this.buttonWidth &&
                y >= buttonY && y <= buttonY + this.buttonHeight) {

                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }

                this.handleButtonAction(button.action);
                return;
            }
        }
    }

    handleWarningDialogClick(x, y) {
        // Prevent click-through from the button that opened the warning dialog
        if (Date.now() - this.warningDialogOpenTime < 150) {
            return;
        }
        const canvas = this.stateManager.canvas;
        const dialogWidth = 480;
        const dialogHeight = 220;
        const dialogX = canvas.width / 2 - dialogWidth / 2;
        const dialogY = canvas.height / 2 - dialogHeight / 2;
        const buttonWidth = 130;
        const buttonHeight = 45;
        const buttonGap = 15;

        // Button positions
        const totalButtonWidth = buttonWidth * 3 + buttonGap * 2;
        const buttonsStartX = dialogX + (dialogWidth - totalButtonWidth) / 2;

        const cancelX = buttonsStartX;
        const cancelY = dialogY + 130;

        const saveQuitX = buttonsStartX + buttonWidth + buttonGap;
        const saveQuitY = dialogY + 130;

        const quitX = buttonsStartX + (buttonWidth + buttonGap) * 2;
        const quitY = dialogY + 130;

        // Check Cancel button — also triggers on clicks outside the dialog entirely
        const insideDialog = x >= dialogX && x <= dialogX + dialogWidth &&
                             y >= dialogY && y <= dialogY + dialogHeight;
        const onCancel = x >= cancelX && x <= cancelX + buttonWidth &&
                         y >= cancelY && y <= cancelY + buttonHeight;

        if (onCancel || !insideDialog) {
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.playSFX('button-click');
            }
            this.close();
            return;
        }

        // Check Save & Quit button
        if (x >= saveQuitX && x <= saveQuitX + buttonWidth && y >= saveQuitY && y <= saveQuitY + buttonHeight) {
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.playSFX('button-click');
            }
            this.executeWarningAction('saveAndQuit');
            return;
        }

        // Check Quit button
        if (x >= quitX && x <= quitX + buttonWidth && y >= quitY && y <= quitY + buttonHeight) {
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.playSFX('button-click');
            }
            this.executeWarningAction('quit');
            return;
        }
    }

    handleButtonAction(action) {
        switch (action) {
            case 'save':
                this.saveSettlement();
                break;
            case 'load':
                this.loadSettlement();
                break;
            case 'options':
                this.openOptions();
                break;
            case 'quitSettlement':
                this.activeWarningDialog = 'quitSettlement';
                this.warningDialogOpenTime = Date.now();
                break;
            case 'quitTouwers':
                this.activeWarningDialog = 'quitTouwers';
                this.warningDialogOpenTime = Date.now();
                break;
            case 'close':
                this.close();
                break;
        }
    }

    async saveSettlement() {
        // Save the current settlement state to the active save slot
        if (this.stateManager.currentSaveSlot && this.stateManager.currentSaveData) {
            const settlementData = {
                playerGold: this.stateManager.playerGold || 0,
                playerInventory: this.stateManager.playerInventory || [],
                upgrades: this.stateManager.upgradeSystem ? this.stateManager.upgradeSystem.serialize() : { purchasedUpgrades: [] },
                marketplace: this.stateManager.marketplaceSystem ? this.stateManager.marketplaceSystem.serialize() : { consumables: {} },
                    workshop: this.stateManager.workshopSystem ? this.stateManager.workshopSystem.serialize() : { unlockedEnemyTypes: [], unlockedCampaignThemes: [], tokens: {} },
                statistics: this.stateManager.gameStatistics ? this.stateManager.gameStatistics.serialize() : {},
                achievements: this.stateManager.achievementSystem ? this.stateManager.achievementSystem.serialize() : { unlockedIds: [] },
                lastPlayedLevel: this.stateManager.currentSaveData.lastPlayedLevel,
                unlockedLevels: this.stateManager.currentSaveData.unlockedLevels,
                completedLevels: this.stateManager.currentSaveData.completedLevels,
                completedCampaigns: this.stateManager.currentSaveData.completedCampaigns,
                unlockedCampaigns: this.stateManager.currentSaveData.unlockedCampaigns,
                unlockSystem: this.stateManager.currentSaveData.unlockSystem
            };
            SaveSystem.updateAndSaveSettlementData(this.stateManager.currentSaveSlot, settlementData);
            // Write to disk — explicit player save action
            await SaveSystem.persistToFile(this.stateManager.currentSaveSlot);
        }

        // Close the menu
        this.close();
    }

    loadSettlement() {
        // Close menu and transition to load screen
        this.close();

        // Set previous state so options menu knows to return here
        this.stateManager.previousState = 'settlementHub';
        this.stateManager.changeState('loadGame');
    }

    openOptions() {
        // Close this menu and open options
        this.close();

        // Set previous state so options menu knows to return to settlement hub
        this.stateManager.previousState = 'settlementHub';
        this.stateManager.changeState('options');
    }

    async executeWarningAction(action) {
        switch (action) {
            case 'quit':
                if (this.activeWarningDialog === 'quitSettlement') {
                    this.quitSettlement();
                } else if (this.activeWarningDialog === 'quitTouwers') {
                    this.quitTouwers(); // Will execute async in background
                }
                break;
            case 'saveAndQuit':
                // Save settlement state before quitting
                if (this.stateManager.currentSaveSlot && this.stateManager.currentSaveData) {
                    const settlementData = {
                        playerGold: this.stateManager.playerGold || 0,
                        playerInventory: this.stateManager.playerInventory || [],
                        upgrades: this.stateManager.upgradeSystem ? this.stateManager.upgradeSystem.serialize() : { purchasedUpgrades: [] },
                        marketplace: this.stateManager.marketplaceSystem ? this.stateManager.marketplaceSystem.serialize() : { consumables: {} },
                    workshop: this.stateManager.workshopSystem ? this.stateManager.workshopSystem.serialize() : { unlockedEnemyTypes: [], unlockedCampaignThemes: [], tokens: {} },
                        statistics: this.stateManager.gameStatistics ? this.stateManager.gameStatistics.serialize() : {},
                        achievements: this.stateManager.achievementSystem ? this.stateManager.achievementSystem.serialize() : { unlockedIds: [] },
                        lastPlayedLevel: this.stateManager.currentSaveData.lastPlayedLevel,
                        unlockedLevels: this.stateManager.currentSaveData.unlockedLevels,
                        completedLevels: this.stateManager.currentSaveData.completedLevels,
                        completedCampaigns: this.stateManager.currentSaveData.completedCampaigns,
                        unlockedCampaigns: this.stateManager.currentSaveData.unlockedCampaigns,
                        unlockSystem: this.stateManager.currentSaveData.unlockSystem
                    };
                    SaveSystem.updateAndSaveSettlementData(this.stateManager.currentSaveSlot, settlementData);
                    // Write to disk — explicit player save action
                    await SaveSystem.persistToFile(this.stateManager.currentSaveSlot);
                }
                if (this.activeWarningDialog === 'quitSettlement') {
                    this.quitSettlement();
                } else if (this.activeWarningDialog === 'quitTouwers') {
                    this.quitTouwers(); // Will execute async in background
                }
                break;
        }
    }

    quitSettlement() {
        this.stateManager.changeState('mainMenu');
    }

    async quitTouwers() {
        try {

            // Trigger game shutdown cleanup first
            if (this.stateManager && this.stateManager.game && this.stateManager.game.shutdown) {
                this.stateManager.game.shutdown();
            }

            // Give a brief moment for cleanup to propagate
            await new Promise(resolve => setTimeout(resolve, 100));

            // Check if invoke is available
            if (invoke) {
                try {
                    const result = await invoke('close_app');
                } catch (invokeError) {
                    throw invokeError;
                }
            } else {
                // Fallback - attempt window.close() even though it will likely fail
                window.close();
            }
        } catch (error) {
            const errMsg = 'SettlementHub: Error - ' + error.message;
            console.error(errMsg, error);
        }
    }

    render(ctx) {
        const canvas = this.stateManager.canvas;

        // Menu dimensions
        const menuPadding = 30;
        const menuWidth = this.buttonWidth + menuPadding * 2;
        const menuHeight = this.buttons.length * (this.buttonHeight + this.buttonGap) + this.buttonMarginTop + menuPadding * 2;
        const menuX = canvas.width / 2 - menuWidth / 2;
        const menuY = canvas.height / 2 - menuHeight / 2;

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Menu background with border
        ctx.fillStyle = '#2a1a0f';
        ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

        // Menu border
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

        // Decorative corner trim - same gold bracket + gem style used by the
        // other settlement menus (Upgrades & Marketplace, Arcane Library,
        // Musical Scores), so this panel reads as part of the same set.
        this.drawCornerTrim(ctx, menuX, menuY, 20, true, false, false, false);
        this.drawCornerTrim(ctx, menuX + menuWidth, menuY, 20, false, true, false, false);
        this.drawCornerTrim(ctx, menuX, menuY + menuHeight, 20, false, false, true, false);
        this.drawCornerTrim(ctx, menuX + menuWidth, menuY + menuHeight, 20, false, false, false, true);

        // Menu title
        ctx.font = 'bold 22px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Title shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText('MANAGE SETTLEMENT', menuX + menuWidth / 2 + 1, menuY + 12 + 1);

        // Title
        ctx.fillStyle = '#ffd700';
        ctx.fillText('MANAGE SETTLEMENT', menuX + menuWidth / 2, menuY + 12);

        // Render buttons
        this.buttons.forEach((button, index) => {
            const buttonX = menuX + menuPadding;
            const buttonY = menuY + this.buttonMarginTop + index * (this.buttonHeight + this.buttonGap);

            // Button background gradient
            const bgGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + this.buttonHeight);
            bgGradient.addColorStop(0, button.hovered ? '#5a4030' : '#44301c');
            bgGradient.addColorStop(1, button.hovered ? '#3a2410' : '#261200');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(buttonX, buttonY, this.buttonWidth, this.buttonHeight);

            // Button border - highlight when hovered
            ctx.strokeStyle = button.hovered ? '#ffd700' : '#8b7355';
            ctx.lineWidth = button.hovered ? 3 : 2;
            ctx.strokeRect(buttonX, buttonY, this.buttonWidth, this.buttonHeight);

            // Top highlight line for beveled effect
            ctx.strokeStyle = button.hovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(buttonX, buttonY);
            ctx.lineTo(buttonX + this.buttonWidth, buttonY);
            ctx.stroke();

            // Inset shadow
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(buttonX, buttonY + this.buttonHeight);
            ctx.lineTo(buttonX + this.buttonWidth, buttonY + this.buttonHeight);
            ctx.stroke();

            // Button text
            ctx.font = 'bold 15px Trebuchet MS, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Text shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText(button.label, buttonX + this.buttonWidth / 2 + 1, buttonY + this.buttonHeight / 2 + 1);

            // Main text
            ctx.fillStyle = button.hovered ? '#ffd700' : '#d4af37';
            ctx.fillText(button.label, buttonX + this.buttonWidth / 2, buttonY + this.buttonHeight / 2);
        });

        // Close (X) button — top-right corner, same style as other menus
        const closeButtonX = menuX + menuWidth - 35;
        const closeButtonY = menuY + 10;
        const closeButtonSize = 25;
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.closeButtonHovered ? '#ff6666' : '#cc0000';
        ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('×', closeButtonX + closeButtonSize / 2, closeButtonY + closeButtonSize / 2 + 1);
        ctx.restore();

        // Render warning dialog if active
        if (this.activeWarningDialog) {
            this.renderWarningDialog(ctx);
        }

        ctx.globalAlpha = 1;
    }

    renderWarningDialog(ctx) {
        const canvas = this.stateManager.canvas;
        const dialogWidth = 480;
        const dialogHeight = 220;
        const dialogX = canvas.width / 2 - dialogWidth / 2;
        const dialogY = canvas.height / 2 - dialogHeight / 2;
        const buttonWidth = 130;
        const buttonHeight = 45;
        const buttonGap = 15;

        // Full-screen click-blocker overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Dialog background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);

        // Dialog border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);

        // Dialog title
        const titleText = this.activeWarningDialog === 'quitSettlement'
            ? 'QUIT SETTLEMENT?'
            : 'QUIT TOUWERS?';

        ctx.font = 'bold 24px serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Title shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(titleText, dialogX + dialogWidth / 2 + 1, dialogY + 18 + 1);

        // Title
        ctx.fillStyle = '#ffd700';
        ctx.fillText(titleText, dialogX + dialogWidth / 2, dialogY + 18);

        // Warning message
        const messageText = this.activeWarningDialog === 'quitSettlement'
            ? 'Return to main menu?'
            : 'Close the game?';

        ctx.font = '16px Arial';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(messageText, dialogX + dialogWidth / 2, dialogY + 65);

        // Buttons in warning dialog - centered row
        const totalButtonWidth = buttonWidth * 3 + buttonGap * 2;
        const buttonsStartX = dialogX + (dialogWidth - totalButtonWidth) / 2;

        const cancelX = buttonsStartX;
        const cancelY = dialogY + 130;

        const saveQuitX = buttonsStartX + buttonWidth + buttonGap;
        const saveQuitY = dialogY + 130;

        const quitX = buttonsStartX + (buttonWidth + buttonGap) * 2;
        const quitY = dialogY + 130;

        // Helper function to render warning dialog buttons
        const renderWarningButton = (x, y, label, hovered) => {
            // Button background
            const bgGradient = ctx.createLinearGradient(x, y, x, y + buttonHeight);
            bgGradient.addColorStop(0, hovered ? '#5a4030' : '#44301c');
            bgGradient.addColorStop(1, hovered ? '#3a2410' : '#261200');
            ctx.fillStyle = bgGradient;
            ctx.fillRect(x, y, buttonWidth, buttonHeight);

            // Border
            ctx.strokeStyle = hovered ? '#ffd700' : '#8b7355';
            ctx.lineWidth = hovered ? 3 : 2;
            ctx.strokeRect(x, y, buttonWidth, buttonHeight);

            // Top highlight
            ctx.strokeStyle = hovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + buttonWidth, y);
            ctx.stroke();

            // Inset shadow
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y + buttonHeight);
            ctx.lineTo(x + buttonWidth, y + buttonHeight);
            ctx.stroke();

            // Text
            ctx.font = 'bold 13px Trebuchet MS, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText(label, x + buttonWidth / 2 + 1, y + buttonHeight / 2 + 1);
            ctx.fillStyle = hovered ? '#ffd700' : '#d4af37';
            ctx.fillText(label, x + buttonWidth / 2, y + buttonHeight / 2);
        };

        renderWarningButton(cancelX, cancelY, 'CANCEL', this.warningCancelHovered);
        renderWarningButton(saveQuitX, saveQuitY, 'SAVE & QUIT', this.warningSaveQuitHovered);
        renderWarningButton(quitX, quitY, 'QUIT', this.warningQuitHovered);
    }
}
