import { ParticleSystem } from '../ParticleSystem.js';
import { ControlsScreen } from '../../ui/ControlsScreen.js';
import { ResolutionSelector } from '../../ui/ResolutionSelector.js';
import { ResolutionSettings } from '../ResolutionSettings.js';
import { SaveSystem } from '../SaveSystem.js';

export class OptionsMenu {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.titleOpacity = 0;
        this.contentOpacity = 0;
        this.showContent = false;
        this.backButtonHovered = false;
        this.particleSystem = null;
        this.controlsScreen = null;
        this.resolutionSelector = null;

        // Options state
        this.musicVolume = 0.7; // Will be overridden in enter() from AudioManager
        this.sfxVolume = 1.0;   // Will be overridden in enter() from AudioManager
        
        // Button states
        this.buttons = {
            back: { hovered: false },
            controls: { hovered: false },
            resolution: { hovered: false },
            visitProducer: { hovered: false },
        };
        
        // Slider states
        this.musicVolumeSlider = { x: 0, y: 0, width: 200, height: 20, isDragging: false };
        this.sfxVolumeSlider = { x: 0, y: 0, width: 200, height: 20, isDragging: false };
    }

    enter() {
        // Keep current UI state
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

        // Read current volumes from AudioManager so sliders show actual state
        if (this.stateManager.audioManager) {
            this.musicVolume = this.stateManager.audioManager.getMusicVolume();
            this.sfxVolume   = this.stateManager.audioManager.getSFXVolume();
        }
        
        // Initialize slider positions
        this.updateSliderPositions();
        
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
    }

    exit() {
        this.removeMouseListeners();
        if (this.resolutionSelector) {
            this.resolutionSelector.hide();
        }
    }

    // ============ GAMEPAD BUTTON NAVIGATION ============

    getButtonCount() {
        return 4; // Back, Controls, Resolution, Visit Producer
    }

    getFocusedButtonIndex() {
        if (this.buttons.back.hovered) return 0;
        if (this.buttons.controls.hovered) return 1;
        if (this.buttons.resolution.hovered) return 2;
        if (this.buttons.visitProducer.hovered) return 3;
        return -1;
    }

    focusButton(index) {
        this.buttons.back.hovered       = (index === 0);
        this.buttons.controls.hovered   = (index === 1);
        this.buttons.resolution.hovered = (index === 2);
        this.buttons.visitProducer.hovered = (index === 3);
    }

    activateFocusedButton() {
        const idx = this.getFocusedButtonIndex();
        if (idx < 0) return;
        if (this.stateManager.audioManager) this.stateManager.audioManager.playSFX('button-click');
        const actionMap = ['back', 'controls', 'resolution', 'visitProducer'];
        this._activateButton(actionMap[idx]);
    }

    _activateButton(buttonName) {
        if (buttonName === 'back') {
            const prevState = this.stateManager.previousState || 'mainMenu';
            this.stateManager.changeState(prevState);
        } else if (buttonName === 'controls') {
            if (!this.controlsScreen) {
                this.controlsScreen = new ControlsScreen(this.stateManager.inputManager, this.stateManager.audioManager);
            }
            this.controlsScreen.show();
        } else if (buttonName === 'resolution') {
            this.openResolutionSelector();
        } else if (buttonName === 'visitProducer') {
            this.openProducerLink();
        }
    }

    openProducerLink() {
        const url = 'https://www.patreon.com/c/LilysLittleGames';
        const tauriInvoke = SaveSystem.getTauriInvoke();
        if (tauriInvoke) {
            tauriInvoke('open_external_url', { url }).catch(err => {
                console.warn('Failed to open external URL via Tauri:', err);
            });
        } else {
            window.open(url, '_blank');
        }
    }

    openResolutionSelector() {
        if (!this.resolutionSelector) {
            this.resolutionSelector = new ResolutionSelector(this.stateManager.game);
        }
        this.resolutionSelector.show();
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
        this.mouseDownHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            this.handleMouseDown(x, y);
        };
        this.mouseUpHandler = () => this.handleMouseUp();
        this.mouseMoveSliderHandler = (e) => {
            const rect = this.stateManager.canvas.getBoundingClientRect();
            const scaleX = this.stateManager.canvas.width / rect.width;
            const scaleY = this.stateManager.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            this.handleSliderDrag(x);
        };
        
        this.stateManager.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.stateManager.canvas.addEventListener('click', this.clickHandler);
        this.stateManager.canvas.addEventListener('mousedown', this.mouseDownHandler);
        document.addEventListener('mouseup', this.mouseUpHandler);
        document.addEventListener('mousemove', this.mouseMoveSliderHandler);
    }

    removeMouseListeners() {
        if (this.mouseMoveHandler) {
            this.stateManager.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.clickHandler) {
            this.stateManager.canvas.removeEventListener('click', this.clickHandler);
        }
        if (this.mouseDownHandler) {
            this.stateManager.canvas.removeEventListener('mousedown', this.mouseDownHandler);
        }
        if (this.mouseUpHandler) {
            document.removeEventListener('mouseup', this.mouseUpHandler);
        }
        if (this.mouseMoveSliderHandler) {
            document.removeEventListener('mousemove', this.mouseMoveSliderHandler);
        }
    }

    updateSliderPositions() {
        const canvas = this.stateManager.canvas;
        const panelH = 385;
        const panelY = canvas.height / 2 - Math.round(panelH / 2);
        const startX = canvas.width / 2 - 100;

        this.musicVolumeSlider.x = startX;
        this.musicVolumeSlider.y = panelY + 110;

        this.sfxVolumeSlider.x = startX;
        this.sfxVolumeSlider.y = panelY + 155;
    }

    getBackButtonPosition() {
        const canvas = this.stateManager.canvas;
        return {
            x: canvas.width - 180,
            y: 20,
            width: 160,
            height: 50
        };
    }

    handleMouseMove(e) {
        const rect = this.stateManager.canvas.getBoundingClientRect();
        const scaleX = this.stateManager.canvas.width / rect.width;
        const scaleY = this.stateManager.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const backPos = this.getBackButtonPosition();
        this.buttons.back.hovered = x >= backPos.x && x <= backPos.x + backPos.width &&
                                    y >= backPos.y && y <= backPos.y + backPos.height;

        const canvas = this.stateManager.canvas;
        const centerX = canvas.width / 2;
        const panelH = 385;
        const panelY = canvas.height / 2 - Math.round(panelH / 2);
        const btnW = 300;

        // Controls button
        const controlsPos = { x: centerX - btnW / 2, y: panelY + 212, width: btnW, height: 42 };
        this.buttons.controls.hovered = x >= controlsPos.x && x <= controlsPos.x + controlsPos.width &&
                                        y >= controlsPos.y && y <= controlsPos.y + controlsPos.height;

        // Resolution button
        const resolutionPos = { x: centerX - btnW / 2, y: panelY + 264, width: btnW, height: 42 };
        this.buttons.resolution.hovered = x >= resolutionPos.x && x <= resolutionPos.x + resolutionPos.width &&
                                          y >= resolutionPos.y && y <= resolutionPos.y + resolutionPos.height;

        // Producer button
        const producerPos = { x: centerX - btnW / 2, y: panelY + 328, width: btnW, height: 42 };
        this.buttons.visitProducer.hovered = x >= producerPos.x && x <= producerPos.x + producerPos.width &&
                                             y >= producerPos.y && y <= producerPos.y + producerPos.height;

        this.stateManager.canvas.style.cursor =
            this.buttons.back.hovered || this.buttons.controls.hovered ||
            this.buttons.resolution.hovered || this.buttons.visitProducer.hovered
                ? 'pointer' : 'default';
    }

    handleMouseDown(x, y) {
        // Check if clicking on music volume slider
        const musicSliderKnobX = this.musicVolumeSlider.x + (this.musicVolume * this.musicVolumeSlider.width);
        if (Math.abs(x - musicSliderKnobX) < 15 && 
            y >= this.musicVolumeSlider.y - 15 && y <= this.musicVolumeSlider.y + 15) {
            this.musicVolumeSlider.isDragging = true;
        }
        
        // Check if clicking on sfx volume slider
        const sfxSliderKnobX = this.sfxVolumeSlider.x + (this.sfxVolume * this.sfxVolumeSlider.width);
        if (Math.abs(x - sfxSliderKnobX) < 15 && 
            y >= this.sfxVolumeSlider.y - 15 && y <= this.sfxVolumeSlider.y + 15) {
            this.sfxVolumeSlider.isDragging = true;
        }
    }

    handleMouseUp() {
        this.musicVolumeSlider.isDragging = false;
        this.sfxVolumeSlider.isDragging = false;
    }

    handleSliderDrag(x) {
        if (this.musicVolumeSlider.isDragging) {
            const relativeX = Math.max(0, Math.min(x - this.musicVolumeSlider.x, this.musicVolumeSlider.width));
            this.musicVolume = relativeX / this.musicVolumeSlider.width;
            // Update actual music volume
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.setMusicVolume(this.musicVolume);
            }
        }
        
        if (this.sfxVolumeSlider.isDragging) {
            const relativeX = Math.max(0, Math.min(x - this.sfxVolumeSlider.x, this.sfxVolumeSlider.width));
            this.sfxVolume = relativeX / this.sfxVolumeSlider.width;
            // Update actual sfx volume
            if (this.stateManager.audioManager) {
                this.stateManager.audioManager.setSFXVolume(this.sfxVolume);
            }
        }
    }

    handleClick(x, y) {
        const backPos = this.getBackButtonPosition();
        if (x >= backPos.x && x <= backPos.x + backPos.width &&
            y >= backPos.y && y <= backPos.y + backPos.height) {
            const previousState = this.stateManager.previousState || 'mainMenu';
            this.stateManager.changeState(previousState);
            return;
        }

        const canvas = this.stateManager.canvas;
        const centerX = canvas.width / 2;
        const panelH = 385;
        const panelY = canvas.height / 2 - Math.round(panelH / 2);
        const btnW = 300;

        // Controls button
        const controlsPos = { x: centerX - btnW / 2, y: panelY + 212, width: btnW, height: 42 };
        if (x >= controlsPos.x && x <= controlsPos.x + controlsPos.width &&
            y >= controlsPos.y && y <= controlsPos.y + controlsPos.height) {
            this.openControlsScreen();
            return;
        }

        // Resolution button
        const resolutionPos = { x: centerX - btnW / 2, y: panelY + 264, width: btnW, height: 42 };
        if (x >= resolutionPos.x && x <= resolutionPos.x + resolutionPos.width &&
            y >= resolutionPos.y && y <= resolutionPos.y + resolutionPos.height) {
            this.openResolutionSelector();
            return;
        }

        // Producer button
        const producerPos = { x: centerX - btnW / 2, y: panelY + 328, width: btnW, height: 42 };
        if (x >= producerPos.x && x <= producerPos.x + producerPos.width &&
            y >= producerPos.y && y <= producerPos.y + producerPos.height) {
            this.openProducerLink();
            return;
        }
    }

    openControlsScreen() {
        if (!this.controlsScreen) {
            this.controlsScreen = new ControlsScreen(
                this.stateManager.inputManager,
                this.stateManager.audioManager
            );
        }
        this.controlsScreen.show();
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

    renderButton(ctx, pos, label, isHovered, isSelected = false) {
        const adjustedY = isHovered ? pos.y - 3 : pos.y;
        
        // Background gradient
        if (isSelected) {
            const bgGrad = ctx.createLinearGradient(0, adjustedY, 0, adjustedY + pos.height);
            bgGrad.addColorStop(0, 'rgba(120, 90, 60, 0.98)');
            bgGrad.addColorStop(0.5, 'rgba(100, 70, 40, 0.98)');
            bgGrad.addColorStop(1, 'rgba(90, 60, 30, 0.98)');
            ctx.fillStyle = bgGrad;
        } else if (isHovered) {
            const bgGrad = ctx.createLinearGradient(0, adjustedY, 0, adjustedY + pos.height);
            bgGrad.addColorStop(0, 'rgba(90, 74, 63, 0.98)');
            bgGrad.addColorStop(0.5, 'rgba(74, 58, 47, 0.98)');
            bgGrad.addColorStop(1, 'rgba(64, 48, 37, 0.98)');
            ctx.fillStyle = bgGrad;
        } else {
            const bgGrad = ctx.createLinearGradient(0, adjustedY, 0, adjustedY + pos.height);
            bgGrad.addColorStop(0, 'rgba(68, 48, 28, 0.85)');
            bgGrad.addColorStop(0.5, 'rgba(48, 28, 8, 0.85)');
            bgGrad.addColorStop(1, 'rgba(38, 18, 0, 0.85)');
            ctx.fillStyle = bgGrad;
        }
        
        ctx.fillRect(pos.x, adjustedY, pos.width, pos.height);

        // Border - no glow shadow
        ctx.strokeStyle = (isSelected || isHovered) ? '#C8A84B' : 'rgba(130, 105, 55, 0.7)';
        ctx.lineWidth = (isSelected || isHovered) ? 2 : 1.5;
        ctx.strokeRect(pos.x, adjustedY, pos.width, pos.height);

        // Top highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pos.x + 1, adjustedY + 1);
        ctx.lineTo(pos.x + pos.width - 1, adjustedY + 1);
        ctx.stroke();

        // Button text
        ctx.font = 'bold 16px Trebuchet MS, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(label, pos.x + pos.width / 2 + 1, adjustedY + pos.height / 2 + 1);

        // Main text
        ctx.fillStyle = (isSelected || isHovered) ? '#E8C96A' : '#B8954A';
        ctx.fillText(label, pos.x + pos.width / 2, adjustedY + pos.height / 2);

        ctx.shadowColor = 'rgba(0,0,0,0)';
        ctx.shadowBlur = 0;
    }

    renderSlider(ctx, slider, value, label) {
        const sliderHeight = 5;
        const knobRadius = 9;
        
        // Label
        ctx.font = '15px Arial, sans-serif';
        ctx.fillStyle = 'rgba(210, 195, 170, 0.9)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, slider.x - 16, slider.y);
        
        // Track background
        ctx.fillStyle = 'rgba(20, 18, 30, 0.85)';
        ctx.strokeStyle = 'rgba(100, 90, 70, 0.7)';
        ctx.lineWidth = 1;
        ctx.fillRect(slider.x, slider.y - sliderHeight / 2, slider.width, sliderHeight);
        ctx.strokeRect(slider.x, slider.y - sliderHeight / 2, slider.width, sliderHeight);
        
        // Filled portion
        const fillW = slider.width * value;
        if (fillW > 0) {
            const fillGrad = ctx.createLinearGradient(slider.x, 0, slider.x + fillW, 0);
            fillGrad.addColorStop(0, 'rgba(140, 105, 40, 0.9)');
            fillGrad.addColorStop(1, 'rgba(200, 155, 55, 0.9)');
            ctx.fillStyle = fillGrad;
            ctx.fillRect(slider.x, slider.y - sliderHeight / 2, fillW, sliderHeight);
        }
        
        // Knob
        const knobX = slider.x + slider.width * value;
        ctx.fillStyle = '#C8A84B';
        ctx.beginPath();
        ctx.arc(knobX, slider.y, knobRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(knobX, slider.y, knobRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Percentage label
        ctx.font = '13px Arial, sans-serif';
        ctx.fillStyle = 'rgba(200, 170, 100, 0.85)';
        ctx.textAlign = 'left';
        ctx.fillText(`${Math.round(value * 100)}%`, slider.x + slider.width + 14, slider.y);
    }

    render(ctx) {
        try {
            const canvas = this.stateManager.canvas;

            if (!canvas || !canvas.width || !canvas.height) {
                ctx.fillStyle = '#0E0C1A';
                ctx.fillRect(0, 0, 800, 600);
                return;
            }

            ctx.shadowColor = 'rgba(0,0,0,0)';
            ctx.shadowBlur = 0;

            // ===== BACKGROUND =====
            const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGrad.addColorStop(0, '#1a0f0a');
            bgGrad.addColorStop(1, '#0a0505');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Floating particles
            if (this.particleSystem) {
                this.particleSystem.render(ctx);
            }

            // Dark overlay
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;

            // ===== PANEL =====
            const panelW = 460;
            const panelH = 385;
            const panelX = canvas.width / 2 - panelW / 2;
            const panelY = canvas.height / 2 - Math.round(panelH / 2);

            // Panel drop shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
            ctx.shadowBlur = 20;
            ctx.fillStyle = 'rgba(0,0,0,0.01)';
            ctx.fillRect(panelX + 4, panelY + 4, panelW, panelH);
            ctx.shadowColor = 'rgba(0,0,0,0)';
            ctx.shadowBlur = 0;

            // Panel background
            const panelGrad = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
            panelGrad.addColorStop(0, 'rgba(38, 22, 12, 0.97)');
            panelGrad.addColorStop(1, 'rgba(18, 8, 4, 0.97)');
            ctx.fillStyle = panelGrad;
            ctx.fillRect(panelX, panelY, panelW, panelH);

            // Header strip
            const headerH = 52;
            const headerGrad = ctx.createLinearGradient(panelX, panelY, panelX, panelY + headerH);
            headerGrad.addColorStop(0, 'rgba(60, 36, 18, 0.98)');
            headerGrad.addColorStop(1, 'rgba(44, 26, 12, 0.98)');
            ctx.fillStyle = headerGrad;
            ctx.fillRect(panelX, panelY, panelW, headerH);

            // Panel border
            ctx.strokeStyle = 'rgba(150, 120, 60, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(panelX, panelY, panelW, panelH);

            // Header divider
            ctx.strokeStyle = 'rgba(150, 120, 60, 0.55)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(panelX + 1, panelY + headerH);
            ctx.lineTo(panelX + panelW - 1, panelY + headerH);
            ctx.stroke();

            // Corner marks
            const cSize = 10;
            ctx.strokeStyle = 'rgba(180, 145, 65, 0.8)';
            ctx.lineWidth = 1.5;
            for (const [cx2, cy2, sx, sy] of [
                [panelX, panelY, 1, 1], [panelX + panelW, panelY, -1, 1],
                [panelX, panelY + panelH, 1, -1], [panelX + panelW, panelY + panelH, -1, -1]
            ]) {
                ctx.beginPath();
                ctx.moveTo(cx2 + sx * cSize, cy2);
                ctx.lineTo(cx2, cy2);
                ctx.lineTo(cx2, cy2 + sy * cSize);
                ctx.stroke();
            }

            // ===== BACK BUTTON =====
            const backPos = this.getBackButtonPosition();
            this.renderButton(ctx, backPos, 'Back', this.buttons.back.hovered);

            // ===== TITLE inside header =====
            ctx.globalAlpha = Math.max(0.05, this.titleOpacity);
            ctx.font = 'bold 24px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillText('O P T I O N S', canvas.width / 2 + 1, panelY + headerH / 2 + 1);
            ctx.fillStyle = '#C8A84B';
            ctx.fillText('O P T I O N S', canvas.width / 2, panelY + headerH / 2);
            ctx.globalAlpha = 1;

            // ===== CONTENT =====
            if (this.showContent) {
                ctx.globalAlpha = this.contentOpacity;

                const centerX = canvas.width / 2;
                this.updateSliderPositions();

                // AUDIO section label with decorative lines
                const audioY = panelY + 80;
                ctx.font = '11px Georgia, serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(180, 155, 100, 0.7)';
                ctx.fillText('A U D I O', centerX, audioY);
                const audioHalfW = ctx.measureText('A U D I O').width / 2;
                ctx.strokeStyle = 'rgba(150, 120, 60, 0.35)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(panelX + 30, audioY);
                ctx.lineTo(centerX - audioHalfW - 10, audioY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(centerX + audioHalfW + 10, audioY);
                ctx.lineTo(panelX + panelW - 30, audioY);
                ctx.stroke();

                this.renderSlider(ctx, this.musicVolumeSlider, this.musicVolume, 'Music Volume');
                this.renderSlider(ctx, this.sfxVolumeSlider, this.sfxVolume, 'Sound Effects');

                const btnW = 300;

                // Section divider
                ctx.strokeStyle = 'rgba(120, 100, 55, 0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(panelX + 20, panelY + 198);
                ctx.lineTo(panelX + panelW - 20, panelY + 198);
                ctx.stroke();

                // Controls button
                const controlsPos = { x: centerX - btnW / 2, y: panelY + 212, width: btnW, height: 42 };
                this.renderButton(ctx, controlsPos, 'Controls', this.buttons.controls.hovered);

                // Resolution button \u2014 shows currently active resolution
                const savedRes = ResolutionSettings.getSavedResolution();
                const resLabel = 'Resolution: ' + savedRes.replace('x', '\u00d7');
                const resolutionPos = { x: centerX - btnW / 2, y: panelY + 264, width: btnW, height: 42 };
                this.renderButton(ctx, resolutionPos, resLabel, this.buttons.resolution.hovered);

                // Bottom divider
                ctx.strokeStyle = 'rgba(120, 100, 55, 0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(panelX + 20, panelY + 316);
                ctx.lineTo(panelX + panelW - 20, panelY + 316);
                ctx.stroke();

                // Support button
                const producerPos = { x: centerX - btnW / 2, y: panelY + 328, width: btnW, height: 42 };
                this.renderButton(ctx, producerPos, 'Support the Developer', this.buttons.visitProducer.hovered);
            }

            ctx.globalAlpha = 1;

        } catch (error) {
            console.error('OptionsMenu render error:', error);
        }
    }
}
