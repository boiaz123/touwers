/**
 * ResolutionSettings - Fixed resolution options for the game
 * Manages fullscreen and resolution selection
 */
export class ResolutionSettings {
    // Available resolutions
    static RESOLUTIONS = {
        '1280x720': { width: 1280, height: 720, label: '720p' },
        '1920x1080': { width: 1920, height: 1080, label: '1080p (Recommended)' },
        '2560x1440': { width: 2560, height: 1440, label: '1440p (QHD)' },
        '3840x2160': { width: 3840, height: 2160, label: '2160p (4K)' }
    };

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
     * Get resolution dimensions
     */
    static getResolution(key) {
        return this.RESOLUTIONS[key] || this.RESOLUTIONS[this.DEFAULT_RESOLUTION];
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
