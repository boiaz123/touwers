import { SaveSystem } from '../SaveSystem.js';
import { ParticleSystem } from '../ParticleSystem.js';

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
        this.particleSystem = null;
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
        
        // Get or initialize shared particle system
        if (this.stateManager.canvas && this.stateManager.canvas.width > 0 && this.stateManager.canvas.height > 0) {
            this.particleSystem = ParticleSystem.getInstance(this.stateManager.canvas.width, this.stateManager.canvas.height);
        }
        
        // Play menu theme music, but preserve settlement music if coming from settlementHub
        if (this.stateManager.audioManager) {
            const currentTrack = this.stateManager.audioManager.getCurrentTrack();
            const settlementTracks = this.stateManager.audioManager.getSettlementTracks ? this.stateManager.audioManager.getSettlementTracks() : [];
            
            // Only change music if we're not coming from settlement hub
            if (this.stateManager.previousState !== 'settlementHub' || !settlementTracks.includes(currentTrack)) {
                this.stateManager.audioManager.playMusic('menu-theme');
            }
        }

        this.setupMouseListeners();

        // Set controller to button navigation mode
        if (this.stateManager.inputManager) {
            this.stateManager.inputManager.setNavigationMode('buttons');
        }
    }

    exit() {
        this.removeMouseListeners();
    }

    // ============ GAMEPAD BUTTON NAVIGATION ============

    getButtonCount() {
        return this.slots.length + 1; // slots + back button
    }

    getFocusedButtonIndex() {
        for (let i = 0; i < this.slots.length; i++) {
            if (this.hoveredSlot === this.slots[i]) return i;
        }
        if (this.backButtonHovered) return this.slots.length;
        return -1;
    }

    focusButton(index) {
        this.hoveredSlot = -1;
        this.backButtonHovered = false;
        if (index >= 0 && index < this.slots.length) {
            this.hoveredSlot = this.slots[index];
        } else if (index === this.slots.length) {
            this.backButtonHovered = true;
        }
    }

    activateFocusedButton() {
        const idx = this.getFocusedButtonIndex();
        if (idx < 0) return;
        if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');

        if (idx < this.slots.length) {
            const slotNum = this.slots[idx];
            const saveData = SaveSystem.getSave(slotNum);
            if (saveData) {
                this.stateManager.currentSaveSlot = slotNum;
                this.stateManager.currentSaveData = saveData;
                this.stateManager.changeState('settlementHub');
            }
        } else {
            const targetState = this.stateManager.previousState || 'mainMenu';
            this.stateManager.changeState(targetState);
        }
    }

    setupMouseListeners() {
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.clickHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
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
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

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
            // Play button click SFX
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.playSFX('button-click');
            }

            // Navigate back to the state that opened this LoadGame
            // Use stateManager.previousState which is set during state transition
            const targetState = this.stateManager.previousState || 'mainMenu';
            this.stateManager.changeState(targetState);
            return;
        }

        // Check slot clicks
        this.slots.forEach((slotNum, index) => {
            const pos = this.getSlotPosition(index);

            if (x >= pos.x && x <= pos.x + pos.width &&
                y >= pos.y && y <= pos.y + pos.height) {
                
                // Play button click SFX
                if (this.stateManager.audioManager) {
                    this.stateManager.audioManager.playSFX('button-click');
                }

                const saveData = SaveSystem.getSave(slotNum);


                if (saveData) {
                    this.stateManager.currentSaveSlot = slotNum;
                    this.stateManager.currentSaveData = saveData;
                    
                    // All saves are now settlement-only (no mid-game saves)
                    // Always go to settlement hub to continue playing
                    this.stateManager.changeState('settlementHub');
                } else {
                }
            }
        });
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

            // Background - blue theme matching OptionsMenu
            const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGrad.addColorStop(0, '#13111F');
            bgGrad.addColorStop(1, '#0A0812');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Render particles from shared system
            if (this.particleSystem) {
                this.particleSystem.render(ctx);
            }
            
            // Dark overlay
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;

            // Back button - styled like OptionsMenu
            const buttonPos = this.getBackButtonPosition();
            const _backHovered = this.backButtonHovered;
            const _backAdjY = _backHovered ? buttonPos.y - 3 : buttonPos.y;
            const _backBg = ctx.createLinearGradient(0, _backAdjY, 0, _backAdjY + buttonPos.height);
            if (_backHovered) {
                _backBg.addColorStop(0, 'rgba(90, 74, 63, 0.98)');
                _backBg.addColorStop(0.5, 'rgba(74, 58, 47, 0.98)');
                _backBg.addColorStop(1, 'rgba(64, 48, 37, 0.98)');
            } else {
                _backBg.addColorStop(0, 'rgba(68, 48, 28, 0.85)');
                _backBg.addColorStop(0.5, 'rgba(48, 28, 8, 0.85)');
                _backBg.addColorStop(1, 'rgba(38, 18, 0, 0.85)');
            }
            ctx.fillStyle = _backBg;
            ctx.fillRect(buttonPos.x, _backAdjY, buttonPos.width, buttonPos.height);
            ctx.strokeStyle = _backHovered ? '#C8A84B' : 'rgba(130, 105, 55, 0.7)';
            ctx.lineWidth = _backHovered ? 2 : 1.5;
            ctx.strokeRect(buttonPos.x, _backAdjY, buttonPos.width, buttonPos.height);
            ctx.font = 'bold 16px Trebuchet MS, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText('Back', buttonPos.x + buttonPos.width / 2 + 1, _backAdjY + buttonPos.height / 2 + 1);
            ctx.fillStyle = _backHovered ? '#E8C96A' : '#B8954A';
            ctx.fillText('Back', buttonPos.x + buttonPos.width / 2, _backAdjY + buttonPos.height / 2);
            ctx.textBaseline = 'alphabetic';

            // Title
            ctx.globalAlpha = Math.max(0.1, this.titleOpacity);
            ctx.textAlign = 'center';
            ctx.font = 'bold 52px Georgia, serif';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillText('LOAD GAME', canvas.width / 2 + 2, 110 + 2);
            ctx.fillStyle = '#C8A84B';
            ctx.fillText('LOAD GAME', canvas.width / 2, 110);

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
        ctx.fillText(`SLOT ${slotNum}`, pos.x + 20, adjustedY + 30);

        if (saveInfo.isEmpty) {
            ctx.font = '14px serif';
            ctx.fillStyle = '#666';
            ctx.fillText(saveInfo.displayText, pos.x + 20, adjustedY + 55);
        } else {
            ctx.font = '16px serif';
            ctx.fillStyle = isHovered ? '#ffe700' : '#d4af37';
            ctx.fillText(saveInfo.displayText, pos.x + 20, adjustedY + 50);

            ctx.font = '12px serif';
            ctx.fillStyle = '#999';
            ctx.fillText(saveInfo.dateString, pos.x + 20, adjustedY + 65);
        }

        // Reset shadow properties
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}
