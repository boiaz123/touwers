/**
 * PixiRenderingHelper - Utility helper for common rendering patterns
 * Provides convenient methods for drawing game objects
 */

export class PixiRenderingHelper {
    constructor(pixiRenderer, spriteManager) {
        this.pixiRenderer = pixiRenderer;
        this.spriteManager = spriteManager;
    }
    
    /**
     * Draw a tower with range indicator
     */
    drawTower(tower, color = 0x8B4513) {
        const body = this.spriteManager.createCircle(
            tower.x, tower.y, 15, color, 0.8
        );
        
        if (tower.isSelected) {
            const outline = this.spriteManager.createCircleOutline(
                tower.x, tower.y, 16, 0xFFD700, 2, 1
            );
        }
        
        if (tower.target) {
            const range = this.spriteManager.createCircleOutline(
                tower.x, tower.y, tower.range, 0x8B4513, 1, 0.3
            );
        }
        
        return body;
    }
    
    /**
     * Draw an enemy
     */
    drawEnemy(enemy, color = 0xFF0000) {
        const body = this.spriteManager.createCircle(
            enemy.x, enemy.y, 10, color, 0.9
        );
        
        // Draw health bar
        if (enemy.health < enemy.maxHealth) {
            this.drawHealthBar(enemy.x, enemy.y - 20, 20, 4, enemy.health / enemy.maxHealth);
        }
        
        return body;
    }
    
    /**
     * Draw a health bar
     */
    drawHealthBar(x, y, width, height, healthPercent, emptyColor = 0x333333, filledColor = 0x00FF00) {
        // Background
        const bg = this.spriteManager.createRectangle(x - width/2, y, width, height, emptyColor, 0.8);
        
        // Health
        const filledWidth = width * healthPercent;
        const health = this.spriteManager.createRectangle(x - width/2, y, filledWidth, height, filledColor, 0.9);
        
        return { bg, health };
    }
    
    /**
     * Draw a projectile
     */
    drawProjectile(projectile, color = 0xFFFF00) {
        const size = projectile.size || 5;
        return this.spriteManager.createCircle(
            projectile.x, projectile.y, size, color, 0.9
        );
    }
    
    /**
     * Draw a line from one point to another (e.g., tower shooting)
     */
    drawLine(x1, y1, x2, y2, color = 0xFFFFFF, thickness = 2, alpha = 1) {
        return this.spriteManager.createLine(x1, y1, x2, y2, color, thickness, alpha);
    }
    
    /**
     * Draw text label
     */
    drawLabel(text, x, y, fontFamily = 'Arial', fontSize = 14, color = 0xFFFFFF) {
        return this.spriteManager.createText(text, x, y, fontFamily, fontSize, color, 'center');
    }
    
    /**
     * Draw a building outline
     */
    drawBuildingOutline(x, y, width, height, color = 0xFFFF00, thickness = 2) {
        const outline = new PIXI.Graphics();
        outline.lineStyle(thickness, color);
        outline.drawRect(x, y, width, height);
        this.pixiRenderer.addChild(outline);
        return outline;
    }
    
    /**
     * Draw a rectangular area (e.g., level bounds)
     */
    drawRectangle(x, y, width, height, fillColor = null, strokeColor = 0xFFFFFF, thickness = 1, alpha = 1) {
        const rect = new PIXI.Graphics();
        
        if (fillColor !== null) {
            rect.beginFill(fillColor, alpha);
            rect.drawRect(x, y, width, height);
            rect.endFill();
        }
        
        if (strokeColor !== null) {
            rect.lineStyle(thickness, strokeColor, alpha);
            rect.drawRect(x, y, width, height);
        }
        
        this.pixiRenderer.addChild(rect);
        return rect;
    }
    
    /**
     * Draw grid lines for debugging
     */
    drawGrid(gridSize, color = 0x444444, alpha = 0.3) {
        const width = this.pixiRenderer.width;
        const height = this.pixiRenderer.height;
        
        const grid = new PIXI.Graphics();
        grid.lineStyle(1, color, alpha);
        
        // Vertical lines
        for (let x = 0; x < width; x += gridSize) {
            grid.moveTo(x, 0);
            grid.lineTo(x, height);
        }
        
        // Horizontal lines
        for (let y = 0; y < height; y += gridSize) {
            grid.moveTo(0, y);
            grid.lineTo(width, y);
        }
        
        this.pixiRenderer.addChild(grid);
        return grid;
    }
    
    /**
     * Draw a particle effect
     */
    drawParticle(x, y, size = 5, color = 0xFF00FF, alpha = 1) {
        return this.spriteManager.createCircle(x, y, size, color, alpha);
    }
    
    /**
     * Draw multiple particles (explosion effect)
     */
    drawExplosion(x, y, particleCount = 10, radius = 30, color = 0xFF6600) {
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            const particle = this.drawParticle(px, py, 3, color, 0.8);
            particles.push(particle);
        }
        return particles;
    }
    
    /**
     * Draw a HUD element (rectangle with label)
     */
    drawHudElement(x, y, width, height, label, value, bgColor = 0x1a1a1a, textColor = 0xFFFFFF) {
        const bg = this.spriteManager.createRectangle(x, y, width, height, bgColor, 0.7);
        const labelText = this.spriteManager.createText(label, x + 5, y + 2, 'Arial', 12, 0x888888);
        const valueText = this.spriteManager.createText(String(value), x + width - 5, y + 2, 'Arial', 14, textColor, 'right');
        
        return { bg, labelText, valueText };
    }
    
    /**
     * Clear all rendered objects
     */
    clearAll() {
        this.spriteManager.clearSprites();
    }
    
    /**
     * Draw debug information
     */
    drawDebugInfo(x, y, fps = 0, drawCalls = 0, entityCount = 0) {
        const fontSize = 12;
        const lineHeight = 16;
        let currentY = y;
        
        const fpsText = this.spriteManager.createText(
            `FPS: ${Math.round(fps)}`, x, currentY, 'monospace', fontSize, 0x00FF00
        );
        currentY += lineHeight;
        
        const drawText = this.spriteManager.createText(
            `Draw Calls: ${drawCalls}`, x, currentY, 'monospace', fontSize, 0x00FF00
        );
        currentY += lineHeight;
        
        const entitiesText = this.spriteManager.createText(
            `Entities: ${entityCount}`, x, currentY, 'monospace', fontSize, 0x00FF00
        );
        
        return { fpsText, drawText, entitiesText };
    }
}
