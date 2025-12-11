/**
 * PixiRenderer - Adapter class that provides Canvas 2D context-like API using Pixi.js
 * This allows existing code to work with minimal modifications
 */

export class PixiRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.app = null;
        this.stage = null;
        this.graphics = null;
        
        // State tracking for canvas 2D emulation
        this.fillStyle = '#000000';
        this.strokeStyle = '#000000';
        this.lineWidth = 1;
        this.font = '16px Arial';
        this.textAlign = 'left';
        this.textBaseline = 'top';
        this.globalAlpha = 1;
        
        // Shadow properties
        this.shadowColor = 'rgba(0, 0, 0, 0)';
        this.shadowBlur = 0;
        this.shadowOffsetX = 0;
        this.shadowOffsetY = 0;
        
        // Composite/blend properties
        this.globalCompositeOperation = 'source-over';
        
        // Line properties
        this.lineCap = 'butt';
        this.lineJoin = 'miter';
        this.miterLimit = 10;
        this.lineDashOffset = 0;
        this.lineDash = [];
        
        // Path tracking for beginPath/stroke/fill
        this.currentPath = [];
        this.isPathOpen = false;
        
        // Graphics objects pool for reuse
        this.graphicsPool = [];
        this.spriteCache = new Map();
        
        this.initializePixi();
    }
    
    initializePixi() {
        // Get the native Canvas 2D context as a fallback
        // This ensures the game works immediately while Pixi is available for future enhancements
        const ctx2d = this.canvas.getContext('2d');
        
        if (!ctx2d) {
            throw new Error('Failed to get Canvas 2D context');
        }
        
        // Store the 2D context for rendering
        this.ctx2d = ctx2d;
        
        // Configure the 2D context
        this.ctx2d.imageSmoothingEnabled = false;
        this.ctx2d.imageSmoothingQuality = 'low';
        
        // Create a mock stage for compatibility with Pixi-using code
        this.stage = PIXI.Container ? new PIXI.Container() : { children: [], addChild: () => {}, removeChildren: () => {} };
        
        // Create a mock app object
        this.app = {
            stage: this.stage,
            renderer: this.ctx2d,
            ticker: { autoStart: false }
        };
        
        this.isCanvas2D = true;
    }
    
    /**
     * Sync all drawing properties to the Canvas 2D context
     */
    _syncProperties() {
        if (!this.isCanvas2D || !this.ctx2d) return;
        
        this.ctx2d.shadowColor = this.shadowColor;
        this.ctx2d.shadowBlur = this.shadowBlur;
        this.ctx2d.shadowOffsetX = this.shadowOffsetX;
        this.ctx2d.shadowOffsetY = this.shadowOffsetY;
        this.ctx2d.globalCompositeOperation = this.globalCompositeOperation;
        this.ctx2d.lineCap = this.lineCap;
        this.ctx2d.lineJoin = this.lineJoin;
        this.ctx2d.miterLimit = this.miterLimit;
        this.ctx2d.lineDashOffset = this.lineDashOffset;
        this.ctx2d.setLineDash(this.lineDash);
        this.ctx2d.globalAlpha = this.globalAlpha;
    }
    
    /**
     * Clear the canvas with a color
     */
    clearRect(x, y, width, height) {
        if (this.isCanvas2D) {
            this.ctx2d.clearRect(x, y, width, height);
        } else {
            if (x === 0 && y === 0 && width === this.canvas.width && height === this.canvas.height) {
                // Full clear - remove all children
                this.stage.removeChildren();
            } else {
                // Partial clear
                const clearGraphic = new PIXI.Graphics();
                clearGraphic.beginFill(0x1a0f0a);
                clearGraphic.drawRect(x, y, width, height);
                clearGraphic.endFill();
                this.stage.addChild(clearGraphic);
            }
        }
    }
    
    /**
     * Fill a rectangle
     */
    fillRect(x, y, width, height) {
        if (this.isCanvas2D) {
            // Sync all properties
            this._syncProperties();
            
            this.ctx2d.fillStyle = this.fillStyle;
            this.ctx2d.fillRect(x, y, width, height);
        } else {
            const graphics = this.getGraphics();
            graphics.beginFill(this.parseColor(this.fillStyle));
            graphics.drawRect(x, y, width, height);
            graphics.endFill();
        }
    }
    
    /**
     * Stroke a rectangle
     */
    strokeRect(x, y, width, height) {
        if (this.isCanvas2D) {
            // Sync all properties
            this._syncProperties();
            
            this.ctx2d.strokeStyle = this.strokeStyle;
            this.ctx2d.lineWidth = this.lineWidth;
            this.ctx2d.strokeRect(x, y, width, height);
        } else {
            const graphics = this.getGraphics();
            graphics.lineStyle(this.lineWidth, this.parseColor(this.strokeStyle));
            graphics.drawRect(x, y, width, height);
        }
    }
    
    /**
     * Begin a new path
     */
    beginPath() {
        this.currentPath = [];
        this.isPathOpen = true;
    }
    
    /**
     * Move to a point (for paths)
     */
    moveTo(x, y) {
        if (!this.isPathOpen) {
            this.beginPath();
        }
        this.currentPath.push({ cmd: 'moveTo', x, y });
    }
    
    /**
     * Draw a line to a point
     */
    lineTo(x, y) {
        if (!this.isPathOpen) {
            this.beginPath();
        }
        this.currentPath.push({ cmd: 'lineTo', x, y });
    }
    
    /**
     * Draw an arc
     */
    arc(x, y, radius, startAngle, endAngle, counterclockwise = false) {
        if (!this.isPathOpen) {
            this.beginPath();
        }
        this.currentPath.push({ cmd: 'arc', x, y, radius, startAngle, endAngle, counterclockwise });
    }
    
    /**
     * Close the current path
     */
    closePath() {
        if (this.currentPath.length > 0) {
            this.currentPath.push({ cmd: 'closePath' });
        }
    }
    
    /**
     * Stroke the current path
     */
    stroke() {
        if (this.currentPath.length === 0) return;
        
        if (this.isCanvas2D) {
            // Sync all properties
            this._syncProperties();
            
            // Use Canvas 2D context
            this.ctx2d.strokeStyle = this.strokeStyle;
            this.ctx2d.lineWidth = this.lineWidth;
            this.ctx2d.beginPath();
            
            let firstPoint = true;
            for (const cmd of this.currentPath) {
                switch (cmd.cmd) {
                    case 'moveTo':
                        this.ctx2d.moveTo(cmd.x, cmd.y);
                        firstPoint = false;
                        break;
                    case 'lineTo':
                        if (firstPoint) {
                            this.ctx2d.moveTo(cmd.x, cmd.y);
                            firstPoint = false;
                        } else {
                            this.ctx2d.lineTo(cmd.x, cmd.y);
                        }
                        break;
                    case 'arc':
                        this.ctx2d.arc(cmd.x, cmd.y, cmd.radius, cmd.startAngle, cmd.endAngle, cmd.counterclockwise);
                        break;
                    case 'closePath':
                        this.ctx2d.closePath();
                        break;
                }
            }
            this.ctx2d.stroke();
            return;
        }
        
        // Pixi.js fallback
        const graphics = this.getGraphics();
        graphics.lineStyle(this.lineWidth, this.parseColor(this.strokeStyle), this.globalAlpha);
        this.executePath(graphics, true);
        graphics.stroke();
    }
    
    /**
     * Fill the current path
     */
    fill() {
        if (this.currentPath.length === 0) return;
        
        if (this.isCanvas2D) {
            // Sync all properties
            this._syncProperties();
            
            // Use Canvas 2D context
            this.ctx2d.fillStyle = this.fillStyle;
            this.ctx2d.beginPath();
            
            let firstPoint = true;
            for (const cmd of this.currentPath) {
                switch (cmd.cmd) {
                    case 'moveTo':
                        this.ctx2d.moveTo(cmd.x, cmd.y);
                        firstPoint = false;
                        break;
                    case 'lineTo':
                        if (firstPoint) {
                            this.ctx2d.moveTo(cmd.x, cmd.y);
                            firstPoint = false;
                        } else {
                            this.ctx2d.lineTo(cmd.x, cmd.y);
                        }
                        break;
                    case 'arc':
                        this.ctx2d.arc(cmd.x, cmd.y, cmd.radius, cmd.startAngle, cmd.endAngle, cmd.counterclockwise);
                        break;
                    case 'closePath':
                        this.ctx2d.closePath();
                        break;
                }
            }
            this.ctx2d.fill();
            return;
        }
        
        // Pixi.js fallback
        const graphics = this.getGraphics();
        graphics.beginFill(this.parseColor(this.fillStyle), this.globalAlpha);
        this.executePath(graphics, false);
        graphics.endFill();
    }
    
    /**
     * Execute a path on graphics object
     */
    executePath(graphics, isStroke = false) {
        if (this.isCanvas2D) {
            // Canvas 2D already handles paths via stroke() and fill()
            return;
        }
        
        // Pixi.js fallback
        let firstPoint = true;
        
        for (const cmd of this.currentPath) {
            switch (cmd.cmd) {
                case 'moveTo':
                    graphics.moveTo(cmd.x, cmd.y);
                    firstPoint = false;
                    break;
                case 'lineTo':
                    if (firstPoint) {
                        graphics.moveTo(cmd.x, cmd.y);
                        firstPoint = false;
                    } else {
                        graphics.lineTo(cmd.x, cmd.y);
                    }
                    break;
                case 'arc':
                    // For arcs, use circle drawing
                    graphics.arc(cmd.x, cmd.y, cmd.radius, cmd.startAngle, cmd.endAngle, cmd.counterclockwise);
                    break;
                case 'quadraticCurveTo':
                    if (firstPoint) {
                        graphics.moveTo(cmd.cpx, cmd.cpy);
                        firstPoint = false;
                    }
                    // Pixi doesn't have quadratic curves, approximate with arc
                    graphics.quadraticCurveTo(cmd.cpx, cmd.cpy, cmd.x, cmd.y);
                    break;
                case 'bezierCurveTo':
                    if (firstPoint) {
                        graphics.moveTo(cmd.cp1x, cmd.cp1y);
                        firstPoint = false;
                    }
                    graphics.bezierCurveTo(cmd.cp1x, cmd.cp1y, cmd.cp2x, cmd.cp2y, cmd.x, cmd.y);
                    break;
                case 'rect':
                    if (firstPoint) {
                        graphics.moveTo(cmd.x, cmd.y);
                        firstPoint = false;
                    }
                    graphics.drawRect(cmd.x, cmd.y, cmd.width, cmd.height);
                    break;
                case 'closePath':
                    // Pixi v8 handles this automatically
                    break;
            }
        }
    }
    
    /**
     * Draw text
     */
    fillText(text, x, y, maxWidth) {
        if (this.isCanvas2D) {
            // Sync all properties
            this._syncProperties();
            
            this.ctx2d.fillStyle = this.fillStyle;
            this.ctx2d.font = this.font;
            this.ctx2d.textAlign = this.textAlign;
            this.ctx2d.textBaseline = this.textBaseline;
            
            if (maxWidth !== undefined) {
                this.ctx2d.fillText(text, x, y, maxWidth);
            } else {
                this.ctx2d.fillText(text, x, y);
            }
        } else {
            const textStyle = new PIXI.TextStyle({
                fontFamily: this.parseFontFamily(this.font),
                fontSize: this.parseFontSize(this.font),
                fill: this.parseColor(this.fillStyle),
                align: this.textAlign,
                wordWrap: false
            });
            
            const pixiText = new PIXI.Text(text, textStyle);
            pixiText.x = x;
            pixiText.y = y;
            
            if (this.textAlign === 'center') {
                pixiText.anchor.x = 0.5;
            } else if (this.textAlign === 'right') {
                pixiText.anchor.x = 1;
            }
            
            this.stage.addChild(pixiText);
        }
    }
    
    /**
     * Stroke text
     */
    strokeText(text, x, y, maxWidth) {
        if (this.isCanvas2D) {
            // Sync all properties
            this._syncProperties();
            
            // Use Canvas 2D context
            this.ctx2d.font = this.font;
            this.ctx2d.strokeStyle = this.strokeStyle;
            this.ctx2d.textAlign = this.textAlign;
            this.ctx2d.textBaseline = this.textBaseline;
            this.ctx2d.lineWidth = this.lineWidth;
            
            if (maxWidth !== undefined) {
                this.ctx2d.strokeText(text, x, y, maxWidth);
            } else {
                this.ctx2d.strokeText(text, x, y);
            }
            return;
        }
        
        // Pixi.js fallback
        const textStyle = new PIXI.TextStyle({
            fontFamily: this.parseFontFamily(this.font),
            fontSize: this.parseFontSize(this.font),
            stroke: this.parseColor(this.strokeStyle),
            strokeThickness: this.lineWidth,
            align: this.textAlign,
            wordWrap: false
        });
        
        const pixiText = new PIXI.Text(text, textStyle);
        pixiText.x = x;
        pixiText.y = y;
        
        if (this.textAlign === 'center') {
            pixiText.anchor.x = 0.5;
        } else if (this.textAlign === 'right') {
            pixiText.anchor.x = 1;
        }
        
        this.stage.addChild(pixiText);
    }
    
    /**
     * Draw an image (sprite)
     */
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
        if (this.isCanvas2D) {
            // Use Canvas 2D context
            // Handle multiple argument patterns
            if (arguments.length === 3) {
                // drawImage(image, dx, dy)
                this.ctx2d.drawImage(image, sx, sy);
            } else if (arguments.length === 5) {
                // drawImage(image, dx, dy, dw, dh)
                this.ctx2d.drawImage(image, sx, sy, sw, sh);
            } else if (arguments.length === 9) {
                // drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
                this.ctx2d.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
            }
            return;
        }
        
        // Pixi.js fallback
        // Handle multiple argument patterns
        if (arguments.length === 3) {
            // drawImage(image, dx, dy)
            dx = sx;
            dy = sy;
            dw = image.width;
            dh = image.height;
        } else if (arguments.length === 5) {
            // drawImage(image, dx, dy, dw, dh)
            dw = sw;
            dh = sh;
            dx = sy;
            dy = sw;
        }
        
        let texture;
        if (image instanceof PIXI.Texture) {
            texture = image;
        } else if (typeof image === 'string') {
            // Cache textures by URL
            if (!this.spriteCache.has(image)) {
                this.spriteCache.set(image, PIXI.Texture.from(image));
            }
            texture = this.spriteCache.get(image);
        } else {
            return; // Cannot draw this image type
        }
        
        const sprite = new PIXI.Sprite(texture);
        sprite.x = dx;
        sprite.y = dy;
        sprite.width = dw || texture.width;
        sprite.height = dh || texture.height;
        
        this.stage.addChild(sprite);
    }
    
    /**
     * Save graphics state
     */
    save() {
        if (this.isCanvas2D) {
            // Save the Canvas 2D context state (including transforms!)
            this.ctx2d.save();
        }
        
        // Also store our properties for reference
        this._savedState = {
            fillStyle: this.fillStyle,
            strokeStyle: this.strokeStyle,
            lineWidth: this.lineWidth,
            font: this.font,
            textAlign: this.textAlign,
            textBaseline: this.textBaseline,
            globalAlpha: this.globalAlpha,
            lineCap: this.lineCap,
            lineJoin: this.lineJoin,
            miterLimit: this.miterLimit,
            lineDashOffset: this.lineDashOffset,
            lineDash: [...this.lineDash],
            shadowColor: this.shadowColor,
            shadowBlur: this.shadowBlur,
            shadowOffsetX: this.shadowOffsetX,
            shadowOffsetY: this.shadowOffsetY,
            globalCompositeOperation: this.globalCompositeOperation
        };
    }
    
    /**
     * Restore graphics state
     */
    restore() {
        if (this.isCanvas2D) {
            // Restore the Canvas 2D context state (including transforms!)
            this.ctx2d.restore();
        }
        
        // Also restore our properties
        if (this._savedState) {
            this.fillStyle = this._savedState.fillStyle;
            this.strokeStyle = this._savedState.strokeStyle;
            this.lineWidth = this._savedState.lineWidth;
            this.font = this._savedState.font;
            this.textAlign = this._savedState.textAlign;
            this.textBaseline = this._savedState.textBaseline;
            this.globalAlpha = this._savedState.globalAlpha;
            this.lineCap = this._savedState.lineCap;
            this.lineJoin = this._savedState.lineJoin;
            this.miterLimit = this._savedState.miterLimit;
            this.lineDashOffset = this._savedState.lineDashOffset;
            this.lineDash = [...this._savedState.lineDash];
            this.shadowColor = this._savedState.shadowColor;
            this.shadowBlur = this._savedState.shadowBlur;
            this.shadowOffsetX = this._savedState.shadowOffsetX;
            this.shadowOffsetY = this._savedState.shadowOffsetY;
            this.globalCompositeOperation = this._savedState.globalCompositeOperation;
        }
    }
    
    /**
     * Measure text width
     */
    measureText(text) {
        if (this.isCanvas2D) {
            // Use Canvas 2D context
            this.ctx2d.font = this.font;
            return this.ctx2d.measureText(text);
        }
        
        // Pixi.js fallback
        const textStyle = new PIXI.TextStyle({
            fontFamily: this.parseFontFamily(this.font),
            fontSize: this.parseFontSize(this.font)
        });
        
        const pixiText = new PIXI.Text(text, textStyle);
        return {
            width: pixiText.width
        };
    }
    
    /**
     * Parse CSS color to Pixi color number
     */
    parseColor(colorString) {
        if (typeof colorString === 'number') {
            return colorString;
        }
        
        if (colorString.startsWith('#')) {
            return parseInt(colorString.slice(1), 16);
        }
        
        if (colorString.startsWith('rgb')) {
            const match = colorString.match(/\d+/g);
            if (match && match.length >= 3) {
                const r = parseInt(match[0]);
                const g = parseInt(match[1]);
                const b = parseInt(match[2]);
                return (r << 16) | (g << 8) | b;
            }
        }
        
        return 0x000000;
    }
    
    /**
     * Parse font string for font family
     */
    parseFontFamily(fontString) {
        const parts = fontString.split(' ');
        return parts[parts.length - 1] || 'Arial';
    }
    
    /**
     * Parse font string for font size
     */
    parseFontSize(fontString) {
        const match = fontString.match(/(\d+)px/);
        return match ? parseInt(match[1]) : 16;
    }
    
    /**
     * Get or create a graphics object
     */
    getGraphics() {
        let graphics;
        if (this.graphicsPool.length > 0) {
            graphics = this.graphicsPool.pop();
            graphics.clear();
        } else {
            graphics = new PIXI.Graphics();
        }
        
        this.stage.addChild(graphics);
        return graphics;
    }
    
    /**
     * Return graphics object to pool
     */
    releaseGraphics(graphics) {
        this.stage.removeChild(graphics);
        this.graphicsPool.push(graphics);
    }
    
    /**
     * Render the stage
     */
    render() {
        // Using Canvas 2D rendering
        // Since we're using the native Canvas 2D context, rendering happens automatically
        // This method is here for API compatibility
    }
    
    /**
     * Resize canvas
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        if (!this.isCanvas2D && this.app && this.app.renderer) {
            this.app.renderer.resize(width, height);
        }
    }
    
    /**
     * Add a display object to the stage
     */
    addChild(child) {
        this.stage.addChild(child);
    }
    
    /**
     * Remove a display object from the stage
     */
    removeChild(child) {
        this.stage.removeChild(child);
    }
    
    /**
     * Get the Pixi stage for advanced usage
     */
    getStage() {
        return this.stage;
    }
    
    /**
     * Get the Pixi app for advanced usage
     */
    getApp() {
        return this.app;
    }
    
    /**
     * Clear all children and graphics
     */
    clear() {
        this.stage.removeChildren();
        this.graphicsPool = [];
    }
    
    /**
     * Get canvas width
     */
    get width() {
        return this.canvas.width;
    }
    
    /**
     * Get canvas height
     */
    get height() {
        return this.canvas.height;
    }
    
    /**
     * Emulate canvas properties for compatibility
     */
    get imageSmoothingEnabled() {
        return this._imageSmoothingEnabled !== false;
    }
    
    set imageSmoothingEnabled(value) {
        this._imageSmoothingEnabled = value;
    }
    
    get imageSmoothingQuality() {
        return this._imageSmoothingQuality || 'high';
    }
    
    set imageSmoothingQuality(value) {
        this._imageSmoothingQuality = value;
    }
    
    /**
     * Create a linear gradient
     */
    createLinearGradient(x0, y0, x1, y1) {
        if (this.isCanvas2D) {
            return this.ctx2d.createLinearGradient(x0, y0, x1, y1);
        }
        
        // Pixi.js fallback - return a simple color object
        return new CanvasGradient(this.ctx2d, 'linear', x0, y0, x1, y1);
    }
    
    /**
     * Create a radial gradient
     */
    createRadialGradient(x0, y0, r0, x1, y1, r1) {
        if (this.isCanvas2D) {
            return this.ctx2d.createRadialGradient(x0, y0, r0, x1, y1, r1);
        }
        
        // Pixi.js fallback - return a simple color object
        return new CanvasGradient(this.ctx2d, 'radial', x0, y0, r0, x1, y1, r1);
    }
    
    /**
     * Translate the context
     */
    translate(x, y) {
        if (this.isCanvas2D) {
            this.ctx2d.translate(x, y);
        }
        // Pixi.js would need more complex transform handling
    }
    
    /**
     * Rotate the context
     */
    rotate(angle) {
        if (this.isCanvas2D) {
            this.ctx2d.rotate(angle);
        }
        // Pixi.js would need more complex transform handling
    }
    
    /**
     * Scale the context
     */
    scale(x, y) {
        if (this.isCanvas2D) {
            this.ctx2d.scale(x, y);
        }
        // Pixi.js would need more complex transform handling
    }
    
    /**
     * Set transform matrix
     */
    setTransform(a, b, c, d, e, f) {
        if (this.isCanvas2D) {
            this.ctx2d.setTransform(a, b, c, d, e, f);
        }
    }
    
    /**
     * Apply transform matrix
     */
    transform(a, b, c, d, e, f) {
        if (this.isCanvas2D) {
            this.ctx2d.transform(a, b, c, d, e, f);
        }
    }
    
    /**
     * Reset transform to identity
     */
    resetTransform() {
        if (this.isCanvas2D) {
            this.ctx2d.resetTransform();
        }
    }
    
    /**
     * Create clipping region
     */
    clip(fillRule) {
        if (this.isCanvas2D) {
            this.ctx2d.clip(fillRule);
        }
    }
    
    /**
     * Draw an ellipse
     */
    ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise = false) {
        if (this.isCanvas2D) {
            this.ctx2d.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
        }
        // For path-based drawing, just use arc as fallback
    }
    
    /**
     * Draw a quadratic curve
     */
    quadraticCurveTo(cpx, cpy, x, y) {
        if (this.isCanvas2D) {
            this.ctx2d.quadraticCurveTo(cpx, cpy, x, y);
        } else {
            // Store for path execution if needed
            if (!this.isPathOpen) {
                this.beginPath();
            }
            this.currentPath.push({ cmd: 'quadraticCurveTo', cpx, cpy, x, y });
        }
    }
    
    /**
     * Draw a cubic bezier curve
     */
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        if (this.isCanvas2D) {
            this.ctx2d.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
        } else {
            // Store for path execution if needed
            if (!this.isPathOpen) {
                this.beginPath();
            }
            this.currentPath.push({ cmd: 'bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y });
        }
    }
    
    /**
     * Draw a rectangle path (not filled/stroked)
     */
    rect(x, y, width, height) {
        if (this.isCanvas2D) {
            this.ctx2d.rect(x, y, width, height);
        } else {
            if (!this.isPathOpen) {
                this.beginPath();
            }
            this.currentPath.push({ cmd: 'rect', x, y, width, height });
        }
    }
    
    /**
     * Check if point is in path
     */
    isPointInPath(x, y, fillRule) {
        if (this.isCanvas2D) {
            return this.ctx2d.isPointInPath(x, y, fillRule);
        }
        return false;
    }
    
    /**
     * Set the line dash pattern
     */
    setLineDash(segments) {
        if (this.isCanvas2D) {
            this.ctx2d.setLineDash(segments);
        }
        this.lineDash = segments || [];
    }
    
    /**
     * Get the current line dash pattern
     */
    getLineDash() {
        if (this.isCanvas2D) {
            return this.ctx2d.getLineDash();
        }
        return this.lineDash || [];
    }
}

// Canvas Gradient polyfill for Pixi.js fallback
class CanvasGradient {
    constructor(ctx, type, ...args) {
        this.type = type;
        this.ctx = ctx;
        this.colorStops = [];
        this._underlyingGradient = null;
        
        // Create the actual gradient if using Canvas 2D
        if (ctx && ctx.createLinearGradient) {
            if (type === 'linear') {
                this._underlyingGradient = ctx.createLinearGradient(...args);
            } else if (type === 'radial') {
                this._underlyingGradient = ctx.createRadialGradient(...args);
            }
        }
    }
    
    addColorStop(offset, color) {
        this.colorStops.push({ offset, color });
        if (this._underlyingGradient) {
            this._underlyingGradient.addColorStop(offset, color);
        }
    }
    
    toString() {
        return '[object CanvasGradient]';
    }
}
