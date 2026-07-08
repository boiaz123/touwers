/**
 * AudioManager - Centralized audio system for the game
 * Handles background music, sound effects, and audio state management
 */
export class AudioManager {
    constructor() {
        // Audio elements
        this.musicElement = null;
        this.soundElements = {};
        this.currentSFXTune = null; // Track currently playing SFX tunes like victory/defeat
        
        // State tracking
        this.currentMusicTrack = null;
        this.isMusicPlaying = false;
        this.isMuted = false;
        
        // Music playlist support
        this.currentMusicCategory = null; // For random track selection from category
        this.musicPlaylistMode = false; // If true, plays random tracks from category

        // Crossfade support: a second music element lets us overlap the outgoing
        // and incoming tracks instead of hard-cutting between them.
        this._musicElementB = null;
        this._playlistAdvanceHandlers = new WeakMap(); // el -> { onTimeUpdate, onEnded }
        this._crossfadeLeadTime = 1.5; // seconds before a playlist track ends to start the next one
        this._crossfadeDuration = 1200; // ms
        
        // Volume settings (0.0 - 1.0) – loaded from localStorage if available
        const _savedMusic = parseFloat(localStorage.getItem('touwers_musicVolume'));
        const _savedSFX   = parseFloat(localStorage.getItem('touwers_sfxVolume'));
        this.musicVolume = isNaN(_savedMusic) ? 0.7 : _savedMusic;
        this.sfxVolume   = isNaN(_savedSFX)   ? 0.8 : _savedSFX;
        
        // Track metadata
        this.musicRegistry = {};
        this.sfxRegistry = {};
        
        // SFX pool - fixed set of Audio elements to prevent unbounded DOM growth
        this._sfxPool = [];
        this._sfxPoolSize = 24;
        this._sfxPoolIndex = 0;
        this._sfxThrottles = new Map();
        this._sfxMinInterval = 80; // Min ms between same SFX name
        
        // Fade interval tracking
        this._fadeIntervalId = null;

        // Mobile autoplay-policy: set when a play() call is rejected with
        // NotAllowedError, consumed by the first user gesture to resume playback.
        this._pendingPlayRequest = false;

        // Initialize audio
        this.initialize();
    }
    
    /**
     * Initialize the audio system
     */
    initialize() {
        // Create music elements. Two elements let us crossfade: `musicElement` is always
        // the currently-audible "front" track; `_musicElementB` is the silent "back" element
        // used to preload/fade in the next track before swapping roles.
        this.musicElement = new Audio();
        this.musicElement.volume = this.musicVolume;
        this._musicElementB = new Audio();
        this._musicElementB.volume = 0;

        // Create SFX pool
        for (let i = 0; i < this._sfxPoolSize; i++) {
            this._sfxPool[i] = new Audio();
        }
        
        // Load registries from MusicRegistry and SFXRegistry
        this.loadRegistries();

        // Mobile WebViews reject play() before a user gesture; resume on the first one.
        this._setupGestureUnlock();
    }

    /**
     * Retry any autoplay-policy-blocked play() call on the first user gesture.
     * Needed for Android/mobile WebViews, which are stricter than desktop about
     * audio playback before the user has interacted with the page.
     */
    _setupGestureUnlock() {
        const tryResume = () => {
            if (!this._pendingPlayRequest || !this.musicElement) return;
            this._pendingPlayRequest = false;
            this.musicElement.play().catch(err => {
                console.warn('AudioManager: gesture-triggered resume failed:', err);
            });
        };
        document.addEventListener('touchstart', tryResume, { passive: true });
        document.addEventListener('pointerdown', tryResume, { passive: true });
        document.addEventListener('keydown', tryResume);
    }
    
    /**
     * Load music and SFX registries
     * This will be called by the MusicRegistry and SFXRegistry
     */
    loadRegistries() {
        // Registries will populate this through setMusicRegistry() and setSFXRegistry()
    }
    
    /**
     * Register music tracks from registry
     * Called by MusicRegistry during initialization
     */
    setMusicRegistry(registry) {
        this.musicRegistry = registry;
    }
    
    /**
     * Register sound effects from registry
     * Called by SFXRegistry during initialization
     */
    setSFXRegistry(registry) {
        this.sfxRegistry = registry;
    }
    
    /**
     * Play a background music track. If another track is already playing, this
     * crossfades smoothly (both tracks overlap briefly) instead of hard-cutting.
     * @param {string} trackName - Name of the track to play
     * @param {boolean} fadeIn - Whether to fade in from silence (only applies when nothing is currently playing)
     */
    playMusic(trackName, fadeIn = false) {
        if (!this.musicRegistry[trackName]) {
            console.warn(`AudioManager: Music track '${trackName}' not found in registry`);
            return false;
        }

        const trackData = this.musicRegistry[trackName];

        // Don't restart if already playing this exact track
        if (this.currentMusicTrack === trackName && this.isMusicPlaying) {
            return true;
        }

        const wasPlaying = this.isMusicPlaying && this.currentMusicTrack;
        this.currentMusicTrack = trackName;
        this.isMusicPlaying = true;

        if (wasPlaying) {
            this._crossfadeToTrack(trackData, trackName, this._crossfadeDuration);
        } else {
            this._startTrackOnElement(this.musicElement, trackData, trackName, fadeIn);
        }

        return true;
    }

    /**
     * Load and play a track on a given audio element from silence (no second track overlapping).
     */
    _startTrackOnElement(el, trackData, trackName, fadeIn) {
        this._clearPlaylistAdvanceListener(el);

        el.pause();
        el.currentTime = 0;
        el.src = trackData.path;
        el.load();

        let shouldLoop = trackData.loop !== false; // Default to true
        if (this.musicPlaylistMode && this.currentMusicCategory) {
            shouldLoop = false; // Playlist mode advances manually instead of looping a single track
        }
        el.loop = shouldLoop;

        const playAudio = () => {
            el.removeEventListener('canplaythrough', playAudio);
            if (fadeIn) {
                el.volume = 0;
                el.play().catch(err => this._handlePlayError(err));
                this._fade(el, el.volume, this.musicVolume, 1000);
            } else {
                el.volume = this.musicVolume;
                el.play().catch(err => this._handlePlayError(err));
            }
            this._attachPlaylistAdvanceListener(el, trackName);
        };

        if (el.readyState >= 2) {
            playAudio();
        } else {
            el.addEventListener('canplaythrough', playAudio, { once: true });
        }
    }

    /**
     * Crossfade from the currently active music element to a new track on the backup
     * element, then swap which element is considered "active".
     */
    _crossfadeToTrack(trackData, trackName, duration) {
        const oldEl = this.musicElement;
        const newEl = this._musicElementB;

        this._clearPlaylistAdvanceListener(newEl);

        newEl.pause();
        newEl.currentTime = 0;
        newEl.src = trackData.path;
        newEl.load();
        newEl.volume = 0;

        let shouldLoop = trackData.loop !== false;
        if (this.musicPlaylistMode && this.currentMusicCategory) {
            shouldLoop = false;
        }
        newEl.loop = shouldLoop;

        const start = () => {
            newEl.removeEventListener('canplaythrough', start);
            newEl.play().catch(err => this._handlePlayError(err));

            this._crossfade(oldEl, newEl, duration, () => {
                oldEl.pause();
                oldEl.currentTime = 0;
            });

            // Swap roles: the newly-playing element becomes the active one
            this.musicElement = newEl;
            this._musicElementB = oldEl;

            this._attachPlaylistAdvanceListener(newEl, trackName);
        };

        if (newEl.readyState >= 2) {
            start();
        } else {
            newEl.addEventListener('canplaythrough', start, { once: true });
        }
    }

    _handlePlayError(err) {
        console.warn('AudioManager: Could not play music:', err);
        if (err && err.name === 'NotAllowedError') this._pendingPlayRequest = true;
    }

    /**
     * In playlist mode, schedule the next random track to start crossfading shortly
     * before the current one ends, so there's no silent gap between songs.
     */
    _attachPlaylistAdvanceListener(el, trackName) {
        this._clearPlaylistAdvanceListener(el);
        if (!(this.musicPlaylistMode && this.currentMusicCategory)) return;

        let triggered = false;
        const advance = () => {
            if (triggered) return;
            triggered = true;
            this.playNextRandomTrackFromCategory();
        };

        const onTimeUpdate = () => {
            if (triggered) return;
            const dur = el.duration;
            if (!dur || !isFinite(dur)) return;
            if (dur - el.currentTime <= this._crossfadeLeadTime) {
                advance();
            }
        };
        const onEnded = () => advance();

        el.addEventListener('timeupdate', onTimeUpdate);
        el.addEventListener('ended', onEnded);
        this._playlistAdvanceHandlers.set(el, { onTimeUpdate, onEnded });
    }

    _clearPlaylistAdvanceListener(el) {
        const handlers = this._playlistAdvanceHandlers.get(el);
        if (handlers) {
            el.removeEventListener('timeupdate', handlers.onTimeUpdate);
            el.removeEventListener('ended', handlers.onEnded);
            this._playlistAdvanceHandlers.delete(el);
        }
    }

    /**
     * Start playing music from a specific category with random track selection.
     * When a track is about to end, a new random track from the category will crossfade in.
     * If this category is already playing, the current track is left alone so it can
     * continue uninterrupted (e.g. campaign map music continuing into the level).
     * @param {string} category - The music category to play from (e.g., 'campaign-1')
     */
    playMusicCategory(category) {
        // Get all tracks in this category
        const tracks = Object.entries(this.musicRegistry)
            .filter(([_, data]) => data.category === category)
            .map(([name, _]) => name);

        if (tracks.length === 0) {
            console.warn(`AudioManager: No music tracks found for category '${category}'`);
            return false;
        }

        // Already playing this category - let the current track continue instead of
        // jumping to a new random one (e.g. selecting a level on a campaign map that's
        // already playing that campaign's music).
        if (this.musicPlaylistMode && this.currentMusicCategory === category && this.isMusicPlaying) {
            return true;
        }

        // Set up category looping mode
        this.musicPlaylistMode = true;
        this.currentMusicCategory = category;

        // Pick and play a random track
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        return this.playMusic(randomTrack);
    }

    /**
     * Play next random track from current category
     * Called automatically shortly before the current track ends in playlist mode
     */
    playNextRandomTrackFromCategory() {
        if (!this.musicPlaylistMode || !this.currentMusicCategory) {
            console.warn('AudioManager: Not in playlist mode or no category set');
            return;
        }

        // Get all tracks in this category
        const tracks = Object.entries(this.musicRegistry)
            .filter(([_, data]) => data.category === this.currentMusicCategory)
            .map(([name, _]) => name);

        if (tracks.length === 0) {
            console.warn(`AudioManager: No music tracks found for category '${this.currentMusicCategory}'`);
            this.musicPlaylistMode = false;
            return;
        }


        // Filter out the currently playing track to ensure we play a different one
        const differentTracks = tracks.filter(track => track !== this.currentMusicTrack);

        if (differentTracks.length === 0) {
            // If only one track exists, replay it
            this.playMusic(tracks[0]);
            return;
        }

        // Pick a random track from the remaining options
        const randomTrack = differentTracks[Math.floor(Math.random() * differentTracks.length)];
        this.playMusic(randomTrack);
    }

    /**
     * Stop background music
     * @param {boolean} fadeOut - Whether to fade out (optional)
     */
    stopMusic(fadeOut = false) {
        if (!this.musicElement) return;

        // Stop playlist mode
        this.musicPlaylistMode = false;
        this.currentMusicCategory = null;

        this._clearPlaylistAdvanceListener(this.musicElement);
        this._clearPlaylistAdvanceListener(this._musicElementB);

        // In case a crossfade was mid-flight, silence and stop the backup element too
        if (this._fadeIntervalId) {
            clearInterval(this._fadeIntervalId);
            this._fadeIntervalId = null;
        }
        if (this._musicElementB) {
            this._musicElementB.pause();
            this._musicElementB.currentTime = 0;
            this._musicElementB.volume = 0;
        }

        if (fadeOut) {
            this.fadeOutMusic(500, () => {
                this.musicElement.pause();
                this.musicElement.currentTime = 0;
                this.isMusicPlaying = false;
                this.currentMusicTrack = null;
            });
        } else {
            this.musicElement.pause();
            this.musicElement.currentTime = 0;
            this.isMusicPlaying = false;
            this.currentMusicTrack = null;
        }
    }

    /**
     * Pause current music
     */
    pauseMusic() {
        if (this.musicElement && this.isMusicPlaying) {
            this.musicElement.pause();
            this.isMusicPlaying = false;
        }
    }

    /**
     * Resume paused music
     */
    resumeMusic() {
        if (this.musicElement && !this.isMusicPlaying && this.currentMusicTrack) {
            this.musicElement.play().catch(err => {
                console.warn('AudioManager: Could not resume music:', err);
                if (err && err.name === 'NotAllowedError') this._pendingPlayRequest = true;
            });
            this.isMusicPlaying = true;
        }
    }

    /**
     * Fade in music over time
     * @param {number} targetVolume - Target volume (0.0 - 1.0)
     * @param {number} duration - Duration in milliseconds
     */
    fadeInMusic(targetVolume, duration = 1000) {
        this._fade(this.musicElement, this.musicElement.volume, targetVolume, duration, null);
    }

    /**
     * Fade out music over time
     * @param {number} duration - Duration in milliseconds
     * @param {function} callback - Optional callback when fade completes
     */
    fadeOutMusic(duration = 500, callback = null) {
        this._fade(this.musicElement, this.musicElement.volume, 0, duration, () => {
            this.musicElement.volume = 0;
            if (callback) callback();
        });
    }

    /**
     * Ramp a single element's volume from startVolume to targetVolume over duration ms.
     */
    _fade(el, startVolume, targetVolume, duration, onComplete) {
        if (this._fadeIntervalId) {
            clearInterval(this._fadeIntervalId);
            this._fadeIntervalId = null;
        }

        const startTime = Date.now();

        this._fadeIntervalId = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            el.volume = startVolume + (targetVolume - startVolume) * progress;

            if (progress >= 1) {
                clearInterval(this._fadeIntervalId);
                this._fadeIntervalId = null;
                el.volume = targetVolume;
                if (onComplete) onComplete();
            }
        }, 16);
    }

    /**
     * Simultaneously fade oldEl out to silence and newEl in to the current music
     * volume, so the two tracks overlap instead of leaving a gap.
     */
    _crossfade(oldEl, newEl, duration, onComplete) {
        if (this._fadeIntervalId) {
            clearInterval(this._fadeIntervalId);
            this._fadeIntervalId = null;
        }

        const startTime = Date.now();
        const oldStartVolume = oldEl.volume;
        const targetVolume = this.musicVolume;

        this._fadeIntervalId = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            oldEl.volume = oldStartVolume * (1 - progress);
            newEl.volume = targetVolume * progress;

            if (progress >= 1) {
                clearInterval(this._fadeIntervalId);
                this._fadeIntervalId = null;
                oldEl.volume = 0;
                newEl.volume = targetVolume;
                if (onComplete) onComplete();
            }
        }, 16);
    }

    /**
     * Play a sound effect
     * @param {string} sfxName - Name of the sound effect
     * @param {number} volume - Optional volume override (0.0 - 1.0)
     */
    playSFX(sfxName, volume = null) {
        if (!this.musicRegistry[sfxName] && !this.sfxRegistry[sfxName]) {
            console.warn(`AudioManager: Sound effect '${sfxName}' not found in registry`);
            return false;
        }
        
        const sfxData = this.sfxRegistry[sfxName] || this.musicRegistry[sfxName];
        const finalVolume = volume !== null ? volume : this.sfxVolume;
        
        // Throttle: skip if same SFX played too recently (except tunes)
        if (sfxName !== 'victory-tune' && sfxName !== 'defeat-tune') {
            const now = performance.now();
            const lastPlayed = this._sfxThrottles.get(sfxName) || 0;
            if (now - lastPlayed < this._sfxMinInterval) {
                return false;
            }
            this._sfxThrottles.set(sfxName, now);
            // Prune stale entries when the map grows large
            if (this._sfxThrottles.size > 50) {
                const cutoff = now - 5000;
                for (const [key, ts] of this._sfxThrottles) {
                    if (ts < cutoff) this._sfxThrottles.delete(key);
                }
            }
        }
        
        try {
            // Stop previous tune if playing a new one
            if ((sfxName === 'victory-tune' || sfxName === 'defeat-tune') && this.currentSFXTune) {
                this.currentSFXTune.pause();
                this.currentSFXTune.currentTime = 0;
                this.currentSFXTune = null;
            }
            
            // Get next pool element (round-robin)
            const sfxElement = this._sfxPool[this._sfxPoolIndex];
            this._sfxPoolIndex = (this._sfxPoolIndex + 1) % this._sfxPoolSize;
            
            // Stop if currently playing something
            sfxElement.pause();
            sfxElement.currentTime = 0;
            
            sfxElement.src = sfxData.path;
            sfxElement.volume = finalVolume;
            sfxElement.play().catch(err => {
                console.warn('AudioManager: Could not play SFX:', err);
            });
            
            // Track victory/defeat tunes so we can stop them
            if (sfxName === 'victory-tune' || sfxName === 'defeat-tune') {
                this.currentSFXTune = sfxElement;
            }
            
            return true;
        } catch (error) {
            console.error('AudioManager: Error playing SFX:', error);
            return false;
        }
    }
    
    /**
     * Play a random settlement theme track, then keep rotating through different
     * settlement songs (crossfading, never repeating the one that just played) instead
     * of looping the same track forever.
     * @returns {string} Name of the selected track
     */
    playRandomSettlementTheme() {
        if (this.getSettlementTracks().length === 0) {
            console.warn('AudioManager: No settlement tracks found');
            return null;
        }
        return this.playMusicCategory('settlement');
    }

    /**
     * Play a different settlement theme when returning from a level (picked to avoid
     * whatever was just playing), then keep rotating through the settlement playlist.
     * @returns {string} Name of the selected track
     */
    playDifferentSettlementTheme() {
        const tracks = this.getSettlementTracks();
        if (tracks.length === 0) { console.warn('AudioManager: No settlement tracks found'); return null; }
        const track = this._pickRandomTrack(tracks, this.currentMusicTrack) || this._pickRandomTrack(tracks);
        if (!track) return null;
        this.musicPlaylistMode = true;
        this.currentMusicCategory = 'settlement';
        return this.playMusic(track);
    }

    _pickRandomTrack(trackList, exclude = null) {
        const candidates = exclude ? trackList.filter(t => t !== exclude) : trackList;
        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    /**
     * Get all settlement theme tracks
     * @returns {Array} Array of settlement track names
     */
    getSettlementTracks() {
        return Object.entries(this.musicRegistry)
            .filter(([_, data]) => data.category === 'settlement')
            .map(([name, _]) => name);
    }
    
    /**
     * Get all campaign tracks
     * @returns {Array} Array of campaign track names
     */
    getCampaignTracks() {
        return Object.entries(this.musicRegistry)
            .filter(([_, data]) => data.category === 'campaign')
            .map(([name, _]) => name);
    }

    /**
     * Play next settlement theme track
     * Cycles to the next settlement track or wraps around to first
     */
    playNextSettlementTheme() {
        const settlementTracks = this.getSettlementTracks();
        if (settlementTracks.length === 0) {
            console.warn('AudioManager: No settlement tracks found');
            return;
        }

        // Find current track index
        const currentIndex = settlementTracks.indexOf(this.currentMusicTrack);
        const nextIndex = (currentIndex + 1) % settlementTracks.length;
        this.playMusic(settlementTracks[nextIndex]);
    }

    /**
     * Play previous settlement theme track
     * Cycles to the previous settlement track or wraps around to last
     */
    playPreviousSettlementTheme() {
        const settlementTracks = this.getSettlementTracks();
        if (settlementTracks.length === 0) {
            console.warn('AudioManager: No settlement tracks found');
            return;
        }

        // Find current track index
        const currentIndex = settlementTracks.indexOf(this.currentMusicTrack);
        const prevIndex = (currentIndex - 1 + settlementTracks.length) % settlementTracks.length;
        this.playMusic(settlementTracks[prevIndex]);
    }

    /**
     * Get all playable music tracks (settlement + campaign, excluding menu and results)
     * @returns {Array} Array of playable track names
     */
    getPlayableTracks() {
        return Object.entries(this.musicRegistry)
            .filter(([_, data]) => data.category === 'settlement' || data.category === 'campaign')
            .map(([name, _]) => name);
    }

    /**
     * Play next playable track (settlement or campaign)
     * Cycles to the next track or wraps around to first
     */
    playNextTrack() {
        const playableTracks = this.getPlayableTracks();
        if (playableTracks.length === 0) {
            console.warn('AudioManager: No playable tracks found');
            return;
        }

        // Find current track index
        const currentIndex = playableTracks.indexOf(this.currentMusicTrack);
        const nextIndex = (currentIndex + 1) % playableTracks.length;
        this.playMusic(playableTracks[nextIndex]);
    }

    /**
     * Play previous playable track (settlement or campaign)
     * Cycles to the previous track or wraps around to last
     */
    playPreviousTrack() {
        const playableTracks = this.getPlayableTracks();
        if (playableTracks.length === 0) {
            console.warn('AudioManager: No playable tracks found');
            return;
        }

        // Find current track index
        const currentIndex = playableTracks.indexOf(this.currentMusicTrack);
        const prevIndex = (currentIndex - 1 + playableTracks.length) % playableTracks.length;
        this.playMusic(playableTracks[prevIndex]);
    }

    /**
     * Set music volume (0.0 - 1.0)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicElement) {
            this.musicElement.volume = this.musicVolume;
        }
        // Don't touch _musicElementB's volume here - it's either silent (idle) or
        // mid-crossfade, and _crossfade() drives its volume toward this.musicVolume already.
        try { localStorage.setItem('touwers_musicVolume', String(this.musicVolume)); } catch(e) {}
    }
    
    /**
     * Set SFX volume (0.0 - 1.0)
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        try { localStorage.setItem('touwers_sfxVolume', String(this.sfxVolume)); } catch(e) {}
    }
    
    /**
     * Get current music volume
     */
    getMusicVolume() {
        return this.musicVolume;
    }
    
    /**
     * Get current SFX volume
     */
    getSFXVolume() {
        return this.sfxVolume;
    }
    
    /**
     * Mute all audio
     */
    mute() {
        this.isMuted = true;
        if (this.musicElement) {
            this.musicElement.muted = true;
        }
        if (this._musicElementB) {
            this._musicElementB.muted = true;
        }
    }

    /**
     * Unmute all audio
     */
    unmute() {
        this.isMuted = false;
        if (this.musicElement) {
            this.musicElement.muted = false;
        }
        if (this._musicElementB) {
            this._musicElementB.muted = false;
        }
    }
    
    /**
     * Get mute state
     */
    isMutedState() {
        return this.isMuted;
    }
    
    /**
     * Get current playing track name
     */
    getCurrentTrack() {
        return this.currentMusicTrack;
    }
    
    /**
     * Check if music is currently playing
     */
    isPlaying() {
        return this.isMusicPlaying;
    }
}
