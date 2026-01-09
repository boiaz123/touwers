/**
 * ResolutionSettings - Fixed resolution options for the game
 * Manages fullscreen and resolution selection
 */
export class ResolutionSettings {
    // Fixed resolution - game always runs at 1920x1080
    static FIXED_RESOLUTION = { width: 1920, height: 1080 };
    static DEFAULT_RESOLUTION = '1920x1080';

    /**
     * Get saved resolution preference
     */
    static getSavedResolution() {
        try {
            const saved = localStorage.getItem('touwers_resolution');
            return saved || this.DEFAULT_RESOLUTION;
        } catch (e) {
            return this.DEFAULT_RESOLUTION;
        }
    }

    /**
     * Save resolution preference
     */
    static saveResolution(resolution) {
        try {
            localStorage.setItem('touwers_resolution', resolution);
        } catch (e) {
            console.warn('Could not save resolution preference:', e);
        }
    }

    /**
     * Get resolution dimensions - always returns fixed 1920x1080
     */
    static getResolution(key) {
        return this.FIXED_RESOLUTION;
    }

    /**
     * Check if fullscreen is supported
     */
    static isFullscreenSupported() {
        return !!(document.fullscreenEnabled || 
                  document.webkitFullscreenEnabled || 
                  document.mozFullScreenEnabled || 
                  document.msFullscreenEnabled);
    }

    /**
     * Request fullscreen
     */
    static async requestFullscreen(element) {
        try {
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                await element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                await element.msRequestFullscreen();
            }
            return true;
        } catch (err) {
            console.error('Fullscreen request failed:', err);
            return false;
        }
    }

    /**
     * Exit fullscreen
     */
    static async exitFullscreen() {
        try {
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                }
            }
            return true;
        } catch (err) {
            console.error('Fullscreen exit failed:', err);
            return false;
        }
    }

    /**
     * Check if currently in fullscreen
     */
    static isFullscreen() {
        return !!(document.fullscreenElement || 
                  document.webkitFullscreenElement || 
                  document.mozFullScreenElement || 
                  document.msFullscreenElement);
    }
}
