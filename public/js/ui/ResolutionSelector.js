/**
 * ResolutionSelector - UI component for selecting game resolution
 */
import { ResolutionSettings } from '../core/ResolutionSettings.js';

export class ResolutionSelector {
    constructor(game) {
        this.game = game;
        this.container = null;
        this.isVisible = false;
    }

    /**
     * Create and show the resolution selector
     */
    show() {
        if (this.isVisible) return;

        // Create container
        this.container = document.createElement('div');
        this.container.id = 'resolution-selector-modal';
        this.container.className = 'resolution-modal';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        // Create dialog box
        const dialog = document.createElement('div');
        dialog.className = 'resolution-dialog';
        dialog.style.cssText = `
            background: #2a1a0f;
            border: 3px solid #d4af37;
            border-radius: 10px;
            padding: 30px;
            min-width: 400px;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.9);
            text-align: center;
        `;

        // Title
        const title = document.createElement('h2');
        title.textContent = 'Select Resolution';
        title.style.cssText = `
            color: #d4af37;
            margin-bottom: 20px;
            font-size: 24px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        `;
        dialog.appendChild(title);

        // Resolution buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 20px;
        `;

        const currentResolution = ResolutionSettings.getSavedResolution();

        Object.entries(ResolutionSettings.RESOLUTIONS).forEach(([key, resolution]) => {
            const button = document.createElement('button');
            button.className = 'resolution-btn';
            button.textContent = resolution.label;
            button.style.cssText = `
                padding: 12px 20px;
                background: ${key === currentResolution ? '#d4af37' : '#3a2a1f'};
                color: ${key === currentResolution ? '#000' : '#d4af37'};
                border: 2px solid #d4af37;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                text-shadow: ${key === currentResolution ? 'none' : '1px 1px 2px rgba(0,0,0,0.5)'};
            `;

            button.onmouseover = (e) => {
                if (key !== currentResolution) {
                    e.target.style.background = '#5a4a3f';
                }
            };

            button.onmouseout = (e) => {
                if (key !== currentResolution) {
                    e.target.style.background = '#3a2a1f';
                }
            };

            button.onclick = () => this.selectResolution(key);
            buttonContainer.appendChild(button);
        });

        dialog.appendChild(buttonContainer);

        // Fullscreen checkbox
        const fullscreenContainer = document.createElement('div');
        fullscreenContainer.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 20px;
            color: #d4af37;
            font-size: 16px;
        `;

        if (ResolutionSettings.isFullscreenSupported()) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'fullscreen-checkbox';
            checkbox.style.cssText = `
                width: 18px;
                height: 18px;
                cursor: pointer;
            `;
            checkbox.checked = ResolutionSettings.isFullscreen();

            const label = document.createElement('label');
            label.htmlFor = 'fullscreen-checkbox';
            label.textContent = 'Fullscreen Mode';
            label.style.cssText = `
                cursor: pointer;
                user-select: none;
            `;

            checkbox.onchange = (e) => this.toggleFullscreen(e.target.checked);

            fullscreenContainer.appendChild(checkbox);
            fullscreenContainer.appendChild(label);
            dialog.appendChild(fullscreenContainer);
        }

        // Info text
        const info = document.createElement('p');
        info.textContent = 'Game will restart with new resolution';
        info.style.cssText = `
            color: #c9a876;
            font-size: 14px;
            margin-bottom: 20px;
        `;
        dialog.appendChild(info);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            padding: 10px 30px;
            background: #3a2a1f;
            color: #d4af37;
            border: 2px solid #d4af37;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        closeBtn.onmouseover = (e) => {
            e.target.style.background = '#5a4a3f';
        };

        closeBtn.onmouseout = (e) => {
            e.target.style.background = '#3a2a1f';
        };

        closeBtn.onclick = () => this.hide();
        dialog.appendChild(closeBtn);

        this.container.appendChild(dialog);
        document.body.appendChild(this.container);
        this.isVisible = true;
    }

    /**
     * Hide the selector
     */
    hide() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.isVisible = false;
    }

    /**
     * Select a resolution
     */
    selectResolution(key) {
        const resolution = ResolutionSettings.getResolution(key);
        ResolutionSettings.saveResolution(key);
        
// console.log(`Resolution selected: ${key} (${resolution.width}x${resolution.height})`);
        
        // Apply game resolution (Tauri handles window sizing via fullscreen mode)
        if (this.game && this.game.applyResolution) {
            this.game.applyResolution(resolution.width, resolution.height);
        }
        
        this.hide();
    }

    /**
     * Toggle fullscreen mode
     */
    async toggleFullscreen(enable) {
        // Use HTML5 fullscreen API (Tauri runs in fullscreen by default)
        if (enable) {
            const success = await ResolutionSettings.requestFullscreen(document.documentElement);
            if (success) {
// console.log('Fullscreen enabled');
            }
        } else {
            await ResolutionSettings.exitFullscreen();
// console.log('Fullscreen disabled');
        }
    }

    /**
     * Destroy the selector
     */
    destroy() {
        this.hide();
    }
}
