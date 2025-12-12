export class GameStateManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.states = {};
        this.currentState = null;
        this.currentStateName = null;
        
        // Save system properties
        this.currentSaveSlot = null;
        this.currentSaveData = null;
        this.previousState = null;
        
        // SaveSystem reference (will be set during game initialization)
        this.SaveSystem = null;
        
        // ResolutionManager reference (will be set during game initialization)
        this.resolutionManager = null;
        
        // Game reference (will be set during game initialization)
        this.game = null;
        
// console.log('GameStateManager: Constructor called with canvas:', canvas.width, 'x', canvas.height);
    }
    
    addState(name, state) {
// console.log('GameStateManager: Adding state:', name);
        this.states[name] = state;
// console.log('GameStateManager: State added successfully:', name);
    }
    
    changeState(stateName) {
// console.log(`GameStateManager: Attempting to change to state '${stateName}'`);
        
        if (!this.states[stateName]) {
            console.error(`GameStateManager: State '${stateName}' does not exist. Available states:`, Object.keys(this.states));
            return false;
        }
        
        try {
            // Exit current state
            if (this.currentStateName && this.states[this.currentStateName]) {
// console.log(`GameStateManager: Exiting state '${this.currentStateName}'`);
                if (this.states[this.currentStateName].exit) {
                    this.states[this.currentStateName].exit();
                }
            }
            
            // Enter new state
            this.currentStateName = stateName;
            this.currentState = this.states[stateName];
// console.log(`GameStateManager: Entering state '${stateName}'`);
            
            if (this.currentState.enter) {
                this.currentState.enter();
            }
            
// console.log(`GameStateManager: Successfully changed to state '${stateName}'`);
            return true;
        } catch (error) {
            console.error(`GameStateManager: Error changing to state '${stateName}':`, error);
            console.error('Stack trace:', error.stack);
            return false;
        }
    }
    
    handleClick(x, y) {
        try {
            if (this.currentState && this.currentState.handleClick) {
// console.log(`GameStateManager: Handling click at (${x}, ${y}) for state '${this.currentStateName}'`);
                this.currentState.handleClick(x, y);
            } else {
                console.warn(`GameStateManager: No click handler for state '${this.currentStateName}'`);
            }
        } catch (error) {
            console.error('GameStateManager: Error handling click:', error);
        }
    }
    
    update(deltaTime) {
        try {
            // Call performance monitor start if it exists
            if (this.currentState && this.currentState.performanceMonitor) {
                this.currentState.performanceMonitor.startFrame();
            }
            
            if (this.currentState && this.currentState.update) {
                this.currentState.update(deltaTime);
            }
            
            // Call performance monitor end update
            if (this.currentState && this.currentState.performanceMonitor) {
                this.currentState.performanceMonitor.endUpdate();
            }
        } catch (error) {
            console.error(`GameStateManager: Error in update for state '${this.currentStateName}':`, error);
        }
    }
    
    render() {
        try {
            if (this.currentState && this.currentState.render) {
                this.currentState.render(this.ctx);
            } else {
                // Fallback: render a debug screen
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`No render method for state: ${this.currentStateName}`, this.canvas.width / 2, this.canvas.height / 2);
            }
            
            // Call performance monitor end render
            if (this.currentState && this.currentState.performanceMonitor) {
                this.currentState.performanceMonitor.endRender();
            }
        } catch (error) {
            console.error(`GameStateManager: Error in render for state '${this.currentStateName}':`, error);
            // Fallback error screen
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Render Error', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillText(error.message, this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }
    
    get selectedLevelInfo() {
        return this._selectedLevelInfo;
    }
    
    
    set selectedLevelInfo(info) {
// console.log('GameStateManager: Setting selected level info:', info);
        this._selectedLevelInfo = info;
    }

    startNewGame() {
// console.log('GameStateManager: Starting new game');
        
        if (!this.SaveSystem) {
            console.error('GameStateManager: SaveSystem not initialized');
            return;
        }
        
        // Find first empty save slot
        let slotToUse = null;
        for (let i = 1; i <= 3; i++) {
            const save = this.SaveSystem.getSave(i);
            if (!save) {
                slotToUse = i;
                break;
            }
        }
        
        // If no empty slot, use slot 1
        if (!slotToUse) {
            slotToUse = 1;
        }
        
        // Create new game state
        const newGameData = this.SaveSystem.createNewGameState();
        this.SaveSystem.saveGame(slotToUse, newGameData);
        
        this.currentSaveSlot = slotToUse;
        this.currentSaveData = newGameData;
        
// console.log(`New game started in save slot ${slotToUse}`);
        
        this.changeState('levelSelect');
    }
}

