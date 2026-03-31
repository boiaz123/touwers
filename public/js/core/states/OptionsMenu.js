import { ParticleSystem } from '../ParticleSystem.js';
import { ControlsScreen } from '../../ui/ControlsScreen.js';

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
        
        // Options state
        this.musicVolume = 0.7; // Will be overridden in enter() from AudioManager
        this.sfxVolume = 1.0;   // Will be overridden in enter() from AudioManager
        
        // Button states
        this.buttons = {
            back: { hovered: false },
            visitProducer: { hovered: false },
            controls: { hovered: false }
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
        const startX = canvas.width / 2 - 100;
        
        this.musicVolumeSlider.x = startX;
        this.musicVolumeSlider.y = canvas.height / 2 - 30;
        
        this.sfxVolumeSlider.x = startX;
        this.sfxVolumeSlider.y = canvas.height / 2 + 30;
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
        
        // Check controls button
        const controlsY = canvas.height / 2 + 70;
        const controlsWidth = 280;
        const controlsPos = { x: centerX - controlsWidth / 2, y: controlsY, width: controlsWidth, height: 42 };
        this.buttons.controls.hovered = x >= controlsPos.x && x <= controlsPos.x + controlsPos.width &&
                                        y >= controlsPos.y && y <= controlsPos.y + controlsPos.height;

        // Check producer button
        const producerY = canvas.height / 2 + 130;
        const producerWidth = 280;
        const producerPos = { x: centerX - producerWidth / 2, y: producerY, width: producerWidth, height: 45 };
        this.buttons.visitProducer.hovered = x >= producerPos.x && x <= producerPos.x + producerPos.width &&
                                             y >= producerPos.y && y <= producerPos.y + producerPos.height;

        this.stateManager.canvas.style.cursor = 
            this.buttons.back.hovered || this.buttons.visitProducer.hovered || this.buttons.controls.hovered ? 'pointer' : 'default';
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
        
        // Check controls button
        const controlsY = canvas.height / 2 + 70;
        const controlsWidth = 280;
        const controlsPos = { x: centerX - controlsWidth / 2, y: controlsY, width: controlsWidth, height: 42 };
        if (x >= controlsPos.x && x <= controlsPos.x + controlsPos.width &&
            y >= controlsPos.y && y <= controlsPos.y + controlsPos.height) {
            this.openControlsScreen();
            return;
        }

        // Check producer button
        const producerY = canvas.height / 2 + 130;
        const producerWidth = 280;
        const producerPos = { x: centerX - producerWidth / 2, y: producerY, width: producerWidth, height: 45 };
        if (x >= producerPos.x && x <= producerPos.x + producerPos.width &&
            y >= producerPos.y && y <= producerPos.y + producerPos.height) {
            if (typeof window !== 'undefined' && window.__TAURI__) {
                window.__TAURI__.shell.open('https://www.patreon.com/c/LilysLittleGames');
            } else {
                window.open('https://www.patreon.com/c/LilysLittleGames', '_blank');
            }
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
            bgGrad.addColorStop(0, '#13111F');
            bgGrad.addColorStop(1, '#0A0812');
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
            const panelW = 520;
            const panelH = 440;
            const panelX = canvas.width / 2 - panelW / 2;
            const panelY = canvas.height / 2 - panelH / 2 + 30;

            // Panel background
            const panelGrad = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
            panelGrad.addColorStop(0, 'rgba(22, 20, 35, 0.97)');
            panelGrad.addColorStop(1, 'rgba(12, 10, 22, 0.97)');
            ctx.fillStyle = panelGrad;
            ctx.fillRect(panelX, panelY, panelW, panelH);

            // Panel border
            ctx.strokeStyle = 'rgba(150, 120, 60, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(panelX, panelY, panelW, panelH);

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

            // ===== TITLE =====
            ctx.globalAlpha = Math.max(0.05, this.titleOpacity);
            ctx.font = 'bold 52px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            // shadow
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillText('OPTIONS', canvas.width / 2 + 2, panelY - 18 + 2);
            // main
            ctx.fillStyle = '#C8A84B';
            ctx.fillText('OPTIONS', canvas.width / 2, panelY - 18);
            ctx.globalAlpha = 1;

            // Divider under title
            const divY = panelY + 28;
            ctx.strokeStyle = 'rgba(150, 120, 60, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(panelX + 20, divY);
            ctx.lineTo(panelX + panelW - 20, divY);
            ctx.stroke();

            // ===== CONTENT =====
            if (this.showContent) {
                ctx.globalAlpha = this.contentOpacity;

                const centerX = canvas.width / 2;
                this.updateSliderPositions();

                // Section label
                ctx.font = '13px Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(180, 155, 100, 0.7)';
                ctx.fillText('\u266a  AUDIO  \u266a', centerX, this.musicVolumeSlider.y - 52);

                this.renderSlider(ctx, this.musicVolumeSlider, this.musicVolume, 'Music Volume');
                this.renderSlider(ctx, this.sfxVolumeSlider, this.sfxVolume, 'Sound Effects');

                // Divider
                ctx.strokeStyle = 'rgba(120, 100, 55, 0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(panelX + 30, panelY + panelH - 112);
                ctx.lineTo(panelX + panelW - 30, panelY + panelH - 112);
                ctx.stroke();

                // Controls button
                const controlsY = canvas.height / 2 + 70;
                const controlsWidth = 280;
                const controlsPos = { x: centerX - controlsWidth / 2, y: controlsY, width: controlsWidth, height: 42 };
                this.renderButton(ctx, controlsPos, 'Controls', this.buttons.controls.hovered);

                // Producer button
                const producerY = canvas.height / 2 + 130;
                const producerWidth = 280;
                const producerPos = { x: centerX - producerWidth / 2, y: producerY, width: producerWidth, height: 42 };
                this.renderButton(ctx, producerPos, '\u2764  Support the Developer', this.buttons.visitProducer.hovered);
            }

            ctx.globalAlpha = 1;

        } catch (error) {
            console.error('OptionsMenu render error:', error);
        }
    }
}
