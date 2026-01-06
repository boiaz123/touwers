export class OptionsMenu {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.animationTime = 0;
        this.titleOpacity = 0;
        this.contentOpacity = 0;
        this.showContent = false;
        this.backButtonHovered = false;
        
        // Options state
        this.musicVolume = 0.7; // Default 70%
        this.sfxVolume = 1.0; // Default 100%
        this.graphicsQuality = 'medium'; // low, medium, high
        
        // Button states
        this.buttons = {
            back: { hovered: false },
            graphicsLow: { hovered: false },
            graphicsMedium: { hovered: false },
            graphicsHigh: { hovered: false },
            visitProducer: { hovered: false }
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
        
        // Initialize slider positions
        this.updateSliderPositions();
        
        // Play menu theme music
        if (this.stateManager.audioManager) {
            this.stateManager.audioManager.playMusic('menu-theme');
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
        this.musicVolumeSlider.y = canvas.height / 2 - 80;
        
        this.sfxVolumeSlider.x = startX;
        this.sfxVolumeSlider.y = canvas.height / 2 - 20;
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
        
        // Check graphics buttons
        const graphicsButtonY = canvas.height / 2 + 50;
        const graphicsButtonWidth = 80;
        const graphicsGap = 20;
        const graphicsStartX = centerX - (graphicsButtonWidth * 3 + graphicsGap * 2) / 2;
        
        const lowPos = { x: graphicsStartX, y: graphicsButtonY, width: graphicsButtonWidth, height: 40 };
        const mediumPos = { x: graphicsStartX + graphicsButtonWidth + graphicsGap, y: graphicsButtonY, width: graphicsButtonWidth, height: 40 };
        const highPos = { x: graphicsStartX + (graphicsButtonWidth + graphicsGap) * 2, y: graphicsButtonY, width: graphicsButtonWidth, height: 40 };
        
        this.buttons.graphicsLow.hovered = x >= lowPos.x && x <= lowPos.x + lowPos.width &&
                                           y >= lowPos.y && y <= lowPos.y + lowPos.height;
        this.buttons.graphicsMedium.hovered = x >= mediumPos.x && x <= mediumPos.x + mediumPos.width &&
                                              y >= mediumPos.y && y <= mediumPos.y + mediumPos.height;
        this.buttons.graphicsHigh.hovered = x >= highPos.x && x <= highPos.x + highPos.width &&
                                            y >= highPos.y && y <= highPos.y + highPos.height;
        
        // Check producer button
        const producerY = canvas.height / 2 + 140;
        const producerWidth = 240;
        const producerPos = { x: centerX - producerWidth / 2, y: producerY, width: producerWidth, height: 45 };
        this.buttons.visitProducer.hovered = x >= producerPos.x && x <= producerPos.x + producerPos.width &&
                                             y >= producerPos.y && y <= producerPos.y + producerPos.height;

        this.stateManager.canvas.style.cursor = 
            this.buttons.back.hovered || this.buttons.graphicsLow.hovered || 
            this.buttons.graphicsMedium.hovered || this.buttons.graphicsHigh.hovered || 
            this.buttons.visitProducer.hovered ? 'pointer' : 'default';
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
        
        // Check graphics buttons
        const graphicsButtonY = canvas.height / 2 + 50;
        const graphicsButtonWidth = 80;
        const graphicsGap = 20;
        const graphicsStartX = centerX - (graphicsButtonWidth * 3 + graphicsGap * 2) / 2;
        
        const lowPos = { x: graphicsStartX, y: graphicsButtonY, width: graphicsButtonWidth, height: 40 };
        const mediumPos = { x: graphicsStartX + graphicsButtonWidth + graphicsGap, y: graphicsButtonY, width: graphicsButtonWidth, height: 40 };
        const highPos = { x: graphicsStartX + (graphicsButtonWidth + graphicsGap) * 2, y: graphicsButtonY, width: graphicsButtonWidth, height: 40 };
        
        if (x >= lowPos.x && x <= lowPos.x + lowPos.width && y >= lowPos.y && y <= lowPos.y + lowPos.height) {
            this.graphicsQuality = 'low';
            return;
        }
        if (x >= mediumPos.x && x <= mediumPos.x + mediumPos.width && y >= mediumPos.y && y <= mediumPos.y + mediumPos.height) {
            this.graphicsQuality = 'medium';
            return;
        }
        if (x >= highPos.x && x <= highPos.x + highPos.width && y >= highPos.y && y <= highPos.y + highPos.height) {
            this.graphicsQuality = 'high';
            return;
        }
        
        // Check producer button
        const producerY = canvas.height / 2 + 140;
        const producerWidth = 240;
        const producerPos = { x: centerX - producerWidth / 2, y: producerY, width: producerWidth, height: 45 };
        if (x >= producerPos.x && x <= producerPos.x + producerPos.width &&
            y >= producerPos.y && y <= producerPos.y + producerPos.height) {
            // TODO: Open Game Producer page when implemented
            console.log('Visit Game Producer page - coming soon!');
            return;
        }
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

        // Border with glow on hover
        if (isHovered) {
            ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        ctx.strokeStyle = (isSelected || isHovered) ? '#ffe700' : '#7a6038';
        ctx.lineWidth = (isSelected || isHovered) ? 3 : 2;
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
        ctx.fillStyle = (isSelected || isHovered) ? '#ffe700' : '#d4af37';
        ctx.fillText(label, pos.x + pos.width / 2, adjustedY + pos.height / 2);

        // Reset shadow properties
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    renderSlider(ctx, slider, value, label) {
        const sliderHeight = 4;
        const knobRadius = 10;
        
        // Label
        ctx.font = 'bold 16px serif';
        ctx.fillStyle = '#c9a876';
        ctx.textAlign = 'right';
        ctx.fillText(label, slider.x - 20, slider.y - 5);
        
        // Slider background
        ctx.fillStyle = 'rgba(40, 30, 20, 0.8)';
        ctx.fillRect(slider.x, slider.y - sliderHeight / 2, slider.width, sliderHeight);
        
        // Slider border
        ctx.strokeStyle = '#7a6038';
        ctx.lineWidth = 1;
        ctx.strokeRect(slider.x, slider.y - sliderHeight / 2, slider.width, sliderHeight);
        
        // Slider fill (progress)
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(slider.x, slider.y - sliderHeight / 2, slider.width * value, sliderHeight);
        
        // Knob
        const knobX = slider.x + slider.width * value;
        ctx.fillStyle = '#ffe700';
        ctx.beginPath();
        ctx.arc(knobX, slider.y, knobRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Knob border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(knobX, slider.y, knobRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Value display
        ctx.font = '14px serif';
        ctx.fillStyle = '#d4af37';
        ctx.textAlign = 'left';
        const percentage = Math.round(value * 100);
        ctx.fillText(`${percentage}%`, slider.x + slider.width + 20, slider.y + 5);
    }

    render(ctx) {
        try {
            const canvas = this.stateManager.canvas;

            if (!canvas || !canvas.width || !canvas.height) {
                ctx.fillStyle = '#2a1a0f';
                ctx.fillRect(0, 0, 800, 600);
                return;
            }

            // Reset shadow properties
            ctx.shadowColor = 'rgba(0, 0, 0, 0)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Background
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#2a1a0f');
            gradient.addColorStop(1, '#1a0f0a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Back button
            const backPos = this.getBackButtonPosition();
            this.renderButton(ctx, backPos, 'BACK', this.buttons.back.hovered);

            // Title
            ctx.globalAlpha = Math.max(0.1, this.titleOpacity);
            ctx.textAlign = 'center';
            ctx.font = 'bold 64px serif';
            ctx.fillStyle = '#d4af37';
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 2;
            ctx.fillText('OPTIONS', canvas.width / 2, 100);
            ctx.strokeText('OPTIONS', canvas.width / 2, 100);

            // Content
            if (this.showContent) {
                ctx.globalAlpha = this.contentOpacity;

                const centerX = canvas.width / 2;
                this.updateSliderPositions();

                // Music Volume
                ctx.font = '18px serif';
                ctx.fillStyle = '#c9a876';
                ctx.textAlign = 'center';
                ctx.fillText('Audio Settings', centerX, canvas.height / 2 - 130);

                this.renderSlider(ctx, this.musicVolumeSlider, this.musicVolume, 'Music Volume');
                this.renderSlider(ctx, this.sfxVolumeSlider, this.sfxVolume, 'Sound Effects');

                // Graphics Quality
                ctx.font = '18px serif';
                ctx.fillStyle = '#c9a876';
                ctx.textAlign = 'center';
                ctx.fillText('Graphics Quality', centerX, canvas.height / 2 + 20);

                const graphicsButtonY = canvas.height / 2 + 50;
                const graphicsButtonWidth = 80;
                const graphicsGap = 20;
                const graphicsStartX = centerX - (graphicsButtonWidth * 3 + graphicsGap * 2) / 2;

                const lowPos = { x: graphicsStartX, y: graphicsButtonY, width: graphicsButtonWidth, height: 40 };
                const mediumPos = { x: graphicsStartX + graphicsButtonWidth + graphicsGap, y: graphicsButtonY, width: graphicsButtonWidth, height: 40 };
                const highPos = { x: graphicsStartX + (graphicsButtonWidth + graphicsGap) * 2, y: graphicsButtonY, width: graphicsButtonWidth, height: 40 };

                this.renderButton(ctx, lowPos, 'LOW', this.buttons.graphicsLow.hovered, this.graphicsQuality === 'low');
                this.renderButton(ctx, mediumPos, 'MEDIUM', this.buttons.graphicsMedium.hovered, this.graphicsQuality === 'medium');
                this.renderButton(ctx, highPos, 'HIGH', this.buttons.graphicsHigh.hovered, this.graphicsQuality === 'high');

                // Producer button
                const producerY = canvas.height / 2 + 140;
                const producerWidth = 240;
                const producerPos = { x: centerX - producerWidth / 2, y: producerY, width: producerWidth, height: 45 };
                this.renderButton(ctx, producerPos, 'VISIT GAME PRODUCER PAGE', this.buttons.visitProducer.hovered);
            }

            ctx.globalAlpha = 1;

        } catch (error) {
            console.error('OptionsMenu render error:', error);
            ctx.fillStyle = '#2a1a0f';
            ctx.fillRect(0, 0, ctx.canvas.width || 800, ctx.canvas.height || 600);
            ctx.fillStyle = '#ff0000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('OptionsMenu Error', (ctx.canvas.width || 800) / 2, (ctx.canvas.height || 600) / 2);
        }
    }
}
