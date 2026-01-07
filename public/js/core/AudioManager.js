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
        this.boundMusicEndedHandler = null; // Store bound listener for proper removal
        
        // Volume settings (0.0 - 1.0)
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        
        // Track metadata
        this.musicRegistry = {};
        this.sfxRegistry = {};
        
        // Initialize audio
        this.initialize();
    }
    
    /**
     * Initialize the audio system
     */
    initialize() {
        // Create music element
        this.musicElement = new Audio();
        this.musicElement.loop = true;
        this.musicElement.volume = this.musicVolume;
        
        // Load registries from MusicRegistry and SFXRegistry
        this.loadRegistries();
        
        // console.log('AudioManager: Initialized');
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
        // console.log('AudioManager: Music registry loaded', Object.keys(this.musicRegistry));
    }
    
    /**
     * Register sound effects from registry
     * Called by SFXRegistry during initialization
     */
    setSFXRegistry(registry) {
        this.sfxRegistry = registry;
        // console.log('AudioManager: SFX registry loaded', Object.keys(this.sfxRegistry));
    }
    
    /**
     * Play a background music track
     * @param {string} trackName - Name of the track to play
     * @param {boolean} fadeIn - Whether to fade in (optional)
     */
    playMusic(trackName, fadeIn = false) {
        if (!this.musicRegistry[trackName]) {
            console.warn(`AudioManager: Music track '${trackName}' not found in registry`);
            return false;
        }
        
        const trackData = this.musicRegistry[trackName];
        
        // Don't restart if already playing
        if (this.currentMusicTrack === trackName && this.isMusicPlaying) {
            return true;
        }
        
        // Stop current music
        if (this.musicElement) {
            this.musicElement.pause();
            this.musicElement.currentTime = 0;
        }
        
        // Update track info
        this.currentMusicTrack = trackName;
        
        // Set up new track
        this.musicElement.src = trackData.path;
        this.musicElement.loop = trackData.loop !== false; // Default to true
        
        // Remove previous ended event listener if one exists
        if (this.boundMusicEndedHandler) {
            this.musicElement.removeEventListener('ended', this.boundMusicEndedHandler);
            this.boundMusicEndedHandler = null;
        }
        
        // If playlist mode is active, handle track ending to play next random track
        if (this.musicPlaylistMode && this.currentMusicCategory) {
            this.musicElement.loop = false; // Don't use built-in looping
            // Create a bound handler so we can remove it later
            this.boundMusicEndedHandler = () => this.playNextRandomTrackFromCategory();
            this.musicElement.addEventListener('ended', this.boundMusicEndedHandler);
        }
        
        // Play with optional fade
        if (fadeIn) {
            this.musicElement.volume = 0;
            this.musicElement.play().catch(err => {
                console.warn('AudioManager: Could not play music:', err);
            });
            this.fadeInMusic(this.musicVolume, 1000);
        } else {
            this.musicElement.play().catch(err => {
                console.warn('AudioManager: Could not play music:', err);
            });
        }
        
        this.isMusicPlaying = true;
        // console.log(`AudioManager: Playing music '${trackName}'`);
        
        return true;
    }
    
    /**
     * Start playing music from a specific category with random track selection
     * When a track ends, a new random track from the category will be selected
     * @param {string} category - The music category to play from (e.g., 'campaign')
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
        
        console.log(`AudioManager: Available tracks for category '${category}':`, tracks);
        
        // Set up category looping mode
        this.musicPlaylistMode = true;
        this.currentMusicCategory = category;
        
        // Pick and play a random track
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        console.log(`AudioManager: Selected random track from '${category}':`, randomTrack);
        return this.playMusic(randomTrack);
    }
    
    /**
     * Play next random track from current category
     * Called automatically when current track ends in playlist mode
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
        
        console.log(`AudioManager: Current track ended, playing next from '${this.currentMusicCategory}'`);
        console.log(`AudioManager: Available tracks:`, tracks);
        
        // Pick a random track (could be the same one, but that's okay for variety)
        const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
        console.log(`AudioManager: Selected next random track:`, randomTrack);
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
        
        // Remove ended event listener if it exists
        if (this.boundMusicEndedHandler) {
            this.musicElement.removeEventListener('ended', this.boundMusicEndedHandler);
            this.boundMusicEndedHandler = null;
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
        const startVolume = this.musicElement.volume;
        const startTime = Date.now();
        
        const fadeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.musicElement.volume = startVolume + (targetVolume - startVolume) * progress;
            
            if (progress >= 1) {
                clearInterval(fadeInterval);
                this.musicElement.volume = targetVolume;
            }
        }, 16); // ~60fps
    }
    
    /**
     * Fade out music over time
     * @param {number} duration - Duration in milliseconds
     * @param {function} callback - Optional callback when fade completes
     */
    fadeOutMusic(duration = 500, callback = null) {
        const startVolume = this.musicElement.volume;
        const startTime = Date.now();
        
        const fadeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.musicElement.volume = startVolume * (1 - progress);
            
            if (progress >= 1) {
                clearInterval(fadeInterval);
                this.musicElement.volume = 0;
                if (callback) {
                    callback();
                }
            }
        }, 16); // ~60fps
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
        
        try {
            // Stop previous tune if playing a new one
            if ((sfxName === 'victory-tune' || sfxName === 'defeat-tune') && this.currentSFXTune) {
                this.currentSFXTune.pause();
                this.currentSFXTune.currentTime = 0;
                this.currentSFXTune = null;
            }
            
            // Create new audio element for sound effect (allows multiple simultaneous plays)
            const sfxElement = new Audio();
            sfxElement.src = sfxData.path;
            sfxElement.volume = finalVolume;
            sfxElement.play().catch(err => {
                console.warn('AudioManager: Could not play SFX:', err);
            });
            
            // Track victory/defeat tunes so we can stop them
            if (sfxName === 'victory-tune' || sfxName === 'defeat-tune') {
                this.currentSFXTune = sfxElement;
            }
            
            // Clean up after playing
            sfxElement.addEventListener('ended', () => {
                sfxElement.pause();
                sfxElement.currentTime = 0;
                if (this.currentSFXTune === sfxElement) {
                    this.currentSFXTune = null;
                }
            }, { once: true });
            
            // console.log(`AudioManager: Playing SFX '${sfxName}'`);
            return true;
        } catch (error) {
            console.error('AudioManager: Error playing SFX:', error);
            return false;
        }
    }
    
    /**
     * Play a random settlement theme track
     * Chooses randomly from settlement songs and keeps it stored for looping
     * @returns {string} Name of the selected track
     */
    playRandomSettlementTheme() {
        const settlementTracks = Object.entries(this.musicRegistry)
            .filter(([_, data]) => data.category === 'settlement')
            .map(([name, _]) => name);
        
        if (settlementTracks.length === 0) {
            console.warn('AudioManager: No settlement tracks found');
            return null;
        }
        
        // Pick a random settlement track
        const randomTrack = settlementTracks[Math.floor(Math.random() * settlementTracks.length)];
        this.playMusic(randomTrack);
        return randomTrack;
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
     * Set music volume (0.0 - 1.0)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicElement) {
            this.musicElement.volume = this.musicVolume;
        }
    }
    
    /**
     * Set SFX volume (0.0 - 1.0)
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
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
        // console.log('AudioManager: Muted');
    }
    
    /**
     * Unmute all audio
     */
    unmute() {
        this.isMuted = false;
        if (this.musicElement) {
            this.musicElement.muted = false;
        }
        // console.log('AudioManager: Unmuted');
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
