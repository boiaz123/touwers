/**
 * ResolutionSettings - Resolution options for the game
 * Manages resolution selection and fullscreen
 */
export class ResolutionSettings {
    // Available render resolutions - canvas internal pixel count
    static RESOLUTIONS = {
        '1280x720':  { label: '1280×720  (HD 720p)',       width: 1280, height: 720  },
        '1600x900':  { label: '1600×900  (HD+ 900p)',      width: 1600, height: 900  },
        '1920x1080': { label: '1920×1080 (Full HD 1080p)', width: 1920, height: 1080 },
        '2560x1440': { label: '2560×1440 (QHD 1440p)',     width: 2560, height: 1440 },
    };

    // Fallback if a stored key is no longer valid
    static FIXED_RESOLUTION = { width: 1920, height: 1080 };
    static DEFAULT_RESOLUTION = '1920x1080';

    /**
     * Get saved resolution preference key
     */
    static getSavedResolution() {
        try {
            const saved = localStorage.getItem('touwers_resolution');
            return (saved && this.RESOLUTIONS[saved]) ? saved : this.DEFAULT_RESOLUTION;
        } catch (e) {
            return this.DEFAULT_RESOLUTION;
        }
    }

    /**
     * Save resolution preference key
     */
    static saveResolution(resolution) {
        try {
            localStorage.setItem('touwers_resolution', resolution);
        } catch (e) {
            console.warn('Could not save resolution preference:', e);
        }
    }

    /**
     * Get resolution dimensions for a given key
     */
    static getResolution(key) {
        return this.RESOLUTIONS[key] || this.FIXED_RESOLUTION;
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
