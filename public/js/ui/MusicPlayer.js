/**
 * MusicPlayer - In-game music player UI component
 * Displays in the sidebar when the Musical Equipment upgrade is purchased
 * Medieval-themed with control buttons
 */
export class MusicPlayer {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.stateManager = uiManager.stateManager;
        this.audioManager = this.stateManager.audioManager;
        this.isMinimized = false;
        this.volume = 0.7;
        this.isPlaying = true;
        this.currentTrackName = 'Settlement Ambiance';
        
        // Create the UI container
        this.createUI();
    }

    createUI() {
        // Check if already created
        if (document.getElementById('music-player-container')) {
            return;
        }

        const container = document.createElement('div');
        container.id = 'music-player-container';
        container.className = 'music-player-container';
        container.innerHTML = `
            <div class="music-player">
                <div class="music-player-header">
                    <span class="music-player-title">🎵 Music Player</span>
                    <button class="music-player-minimize-btn" title="Minimize">−</button>
                </div>
                <div class="music-player-content">
                    <div class="music-player-track-info">
                        <span class="music-player-track-name">Now Playing: Settlement</span>
                    </div>
                    <div class="music-player-controls">
                        <button class="music-player-btn music-player-prev" title="Previous Track">⏮</button>
                        <button class="music-player-btn music-player-play-pause" title="Play/Pause">⏵</button>
                        <button class="music-player-btn music-player-next" title="Next Track">⏭</button>
                    </div>
                    <div class="music-player-volume">
                        <span class="music-player-volume-label">🔊</span>
                        <input type="range" class="music-player-volume-slider" min="0" max="100" value="70" title="Volume">
                    </div>
                </div>
            </div>
        `;

        // Find the sidebar and insert before the bottom section
        const sidebar = document.getElementById('tower-sidebar');
        if (sidebar) {
            const sidebarBottom = sidebar.querySelector('.sidebar-bottom');
            if (sidebarBottom) {
                sidebar.insertBefore(container, sidebarBottom);
            } else {
                sidebar.appendChild(container);
            }
        }

        // Attach event listeners
        this.setupEventListeners();

        // Add styles
        this.applyStyles();
    }

    setupEventListeners() {
        const playPauseBtn = document.querySelector('.music-player-play-pause');
        const prevBtn = document.querySelector('.music-player-prev');
        const nextBtn = document.querySelector('.music-player-next');
        const minimizeBtn = document.querySelector('.music-player-minimize-btn');
        const volumeSlider = document.querySelector('.music-player-volume-slider');

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousTrack());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextTrack());
        }
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        }
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => this.setVolume(parseInt(e.target.value)));
        }
    }

    togglePlayPause() {
        if (!this.audioManager) return;

        this.isPlaying = !this.isPlaying;
        const btn = document.querySelector('.music-player-play-pause');

        if (this.isPlaying) {
            this.audioManager.resumeMusic();
            if (btn) btn.textContent = '⏸';
        } else {
            this.audioManager.pauseMusic();
            if (btn) btn.textContent = '⏵';
        }
    }

    previousTrack() {
        if (!this.audioManager) return;
        this.audioManager.playPreviousTrack();
        this.updateTrackName();
    }

    nextTrack() {
        if (!this.audioManager) return;
        this.audioManager.playNextTrack();
        this.updateTrackName();
    }

    setVolume(value) {
        this.volume = value / 100;
        if (this.audioManager) {
            this.audioManager.setMusicVolume(this.volume);
        }
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        const content = document.querySelector('.music-player-content');
        const container = document.getElementById('music-player-container');

        if (this.isMinimized) {
            if (content) content.style.display = 'none';
            if (container) container.classList.add('minimized');
        } else {
            if (content) content.style.display = 'flex';
            if (container) container.classList.remove('minimized');
        }
    }

    updateTrackName() {
        const trackName = document.querySelector('.music-player-track-name');
        if (trackName && this.audioManager) {
            const currentTrack = this.audioManager.getCurrentTrack();
            const displayName = currentTrack ? currentTrack.replace('.mp3', '').replace(/-/g, ' ') : 'Settlement';
            trackName.textContent = `Now Playing: ${displayName}`;
        }
    }

    applyStyles() {
        const styleId = 'music-player-styles';
        if (document.getElementById(styleId)) {
            return;
        }

        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            .music-player-container {
                margin: 12px 0;
                padding: 0 8px;
            }

            .music-player {
                background: linear-gradient(135deg, #2a1810 0%, #3d2817 100%);
                border: 2px solid #8b7355;
                border-radius: 8px;
                padding: 10px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                font-family: 'Arial', sans-serif;
            }

            .music-player-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                padding-bottom: 8px;
                border-bottom: 1px solid rgba(255, 200, 100, 0.3);
            }

            .music-player-title {
                font-size: 13px;
                font-weight: bold;
                color: #ffc864;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            }

            .music-player-minimize-btn {
                background: transparent;
                border: 1px solid #8b7355;
                color: #daa520;
                width: 24px;
                height: 24px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.2s ease;
            }

            .music-player-minimize-btn:hover {
                background: rgba(139, 115, 85, 0.3);
                border-color: #ffc864;
            }

            .music-player-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .music-player-track-info {
                text-align: center;
                padding: 4px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            }

            .music-player-track-name {
                font-size: 11px;
                color: #e8d5c4;
                display: block;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .music-player-controls {
                display: flex;
                justify-content: center;
                gap: 4px;
            }

            .music-player-btn {
                background: linear-gradient(135deg, #4a3620 0%, #5a4630 100%);
                border: 1px solid #8b7355;
                color: #ffc864;
                width: 32px;
                height: 32px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .music-player-btn:hover {
                background: linear-gradient(135deg, #5a4630 0%, #6a5640 100%);
                border-color: #ffc864;
                transform: scale(1.05);
            }

            .music-player-btn:active {
                transform: scale(0.95);
            }

            .music-player-volume {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
            }

            .music-player-volume-label {
                font-size: 12px;
                color: #ffc864;
                flex-shrink: 0;
            }

            .music-player-volume-slider {
                flex: 1;
                height: 4px;
                border-radius: 2px;
                background: linear-gradient(to right, rgba(255, 200, 100, 0.2), rgba(255, 200, 100, 0.4));
                outline: none;
                cursor: pointer;
                -webkit-appearance: none;
                appearance: none;
            }

            .music-player-volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ffc864 0%, #daa520 100%);
                border: 1px solid #8b7355;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
            }

            .music-player-volume-slider::-moz-range-thumb {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ffc864 0%, #daa520 100%);
                border: 1px solid #8b7355;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
            }

            .music-player-container.minimized .music-player {
                padding: 6px 10px;
            }

            .music-player-container.minimized .music-player-header {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
            }

            .music-player-container.minimized .music-player-title {
                font-size: 12px;
            }

            .music-player-container.minimized .music-player-minimize-btn {
                width: 20px;
                height: 20px;
                font-size: 12px;
            }
        `;

        document.head.appendChild(styles);
    }

    destroy() {
        const container = document.getElementById('music-player-container');
        if (container) {
            container.remove();
        }
    }
}
