export class BasicEnemy {
    constructor(path, health = 100, speed = 50) {
        this.path = path;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.currentPathIndex = 0;
        this.x = path && path.length > 0 ? path[0].x : 0;
        this.y = path && path.length > 0 ? path[0].y : 0;
        this.reachedEnd = false;
        
        // Animation and appearance properties
        this.animationTime = 0;
        this.tunicColor = this.getRandomTunicColor();
        
        console.log('BasicEnemy: Created at position', this.x, this.y, 'with path length', path ? path.length : 0);
    }
    
    getRandomTunicColor() {
        // Set of tunic colors for visual variety
        const tunicColors = [
            '#8B4513', // Brown
            '#4169E1', // Royal Blue
            '#DC143C', // Crimson Red
            '#2F4F4F', // Dark Slate Gray
            '#556B2F', // Dark Olive Green
            '#8B008B'  // Dark Magenta
        ];
        
        return tunicColors[Math.floor(Math.random() * tunicColors.length)];
    }
    
    updatePath(newPath) {
        if (!newPath || newPath.length === 0) {
            console.warn('BasicEnemy: Received invalid path');
            return;
        }
        
        const oldPath = this.path;
        this.path = newPath;
        
        // Try to maintain relative position on the new path
        if (oldPath && oldPath.length > 0 && this.currentPathIndex < oldPath.length) {
            // Calculate progress along old path
            const totalOldSegments = oldPath.length - 1;
            const progressRatio = this.currentPathIndex / Math.max(1, totalOldSegments);
            
            // Apply same progress to new path
            const totalNewSegments = this.path.length - 1;
            this.currentPathIndex = Math.floor(progressRatio * totalNewSegments);
            this.currentPathIndex = Math.max(0, Math.min(this.currentPathIndex, this.path.length - 2));
            
            // Update position to nearest point on new path
            if (this.currentPathIndex < this.path.length) {
                this.x = this.path[this.currentPathIndex].x;
                this.y = this.path[this.currentPathIndex].y;
            }
        } else {
            // Reset to start of new path
            this.currentPathIndex = 0;
            this.x = this.path[0].x;
            this.y = this.path[0].y;
        }
        
        console.log('BasicEnemy: Path updated, now at index', this.currentPathIndex, 'position', this.x, this.y);
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        if (this.reachedEnd || !this.path || this.path.length === 0) return;
        
        // Safety check for path index
        if (this.currentPathIndex >= this.path.length - 1) {
            this.reachedEnd = true;
            console.log('BasicEnemy: Reached end of path');
            return;
        }
        
        const target = this.path[this.currentPathIndex + 1];
        if (!target) {
            this.reachedEnd = true;
            console.log('BasicEnemy: No target waypoint, reached end');
            return;
        }
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);
        
        // Larger threshold for reaching waypoints to prevent getting stuck
        const reachThreshold = Math.max(5, this.speed * deltaTime * 2);
        
        if (distance < reachThreshold) {
            this.currentPathIndex++;
            // Snap to waypoint to prevent drift
            this.x = target.x;
            this.y = target.y;
            return;
        }
        
        const moveDistance = this.speed * deltaTime;
        this.x += (dx / distance) * moveDistance;
        this.y += (dy / distance) * moveDistance;
    }
    
    takeDamage(amount) {
        this.health -= amount;
    }
    
    isDead() {
        return this.health <= 0;
    }
    
    render(ctx) {
        // Auto-scale enemy size based on canvas resolution
        const baseSize = Math.max(6, Math.min(14, ctx.canvas.width / 150));
        
        // Calculate walking animation with natural variation
        const walkCycle = Math.sin(this.animationTime * 8) * 0.5;
        const bobAnimation = Math.sin(this.animationTime * 8) * 0.3; // Vertical bob
        const shoulderSway = Math.sin(this.animationTime * 8 + Math.PI / 4) * 0.2; // Subtle shoulder rotation
        
        // Create more complex arm movement patterns for natural variation
        const armSwingFreq = this.animationTime * 8;
        
        // Left arm: leading swing with acceleration/deceleration
        const leftArmBase = Math.sin(armSwingFreq) * 0.6;
        const leftArmBend = Math.sin(armSwingFreq * 2) * 0.15; // Elbow bend variation
        const leftArmTwist = Math.cos(armSwingFreq + Math.PI / 6) * 0.25; // Wrist twist
        
        // Right arm: follows with phase offset, different amplitude
        const rightArmBase = Math.sin(armSwingFreq + Math.PI) * 0.55; // Opposite phase, slightly less amplitude
        const rightArmBend = Math.sin(armSwingFreq * 2 + Math.PI / 3) * 0.18; // Different frequency for variety
        const rightArmTwist = Math.cos(armSwingFreq + Math.PI / 3) * 0.22; // Different phase
        
        // Enemy shadow - 3D perspective with slight angle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + baseSize * 1.6, baseSize * 0.9, baseSize * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.save();
        ctx.translate(this.x, this.y + bobAnimation);
        
        // --- BODY STRUCTURE WITH 3D PERSPECTIVE ---
        
        // Back/depth layer (darker, slightly offset)
        ctx.fillStyle = this.darkenColor(this.tunicColor, 0.2);
        ctx.fillRect(-baseSize * 0.65, -baseSize * 0.75, baseSize * 1.3, baseSize * 1.1);
        
        // Main tunic/body with 3D shading
        const bodyGradient = ctx.createLinearGradient(-baseSize * 0.6, -baseSize * 0.8, baseSize * 0.6, baseSize * 0.4);
        bodyGradient.addColorStop(0, this.tunicColor);
        bodyGradient.addColorStop(0.5, this.tunicColor);
        bodyGradient.addColorStop(1, this.darkenColor(this.tunicColor, 0.15));
        
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(-baseSize * 0.6, -baseSize * 0.8, baseSize * 1.2, baseSize * 1.2);
        
        // Tunic outline for definition
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(-baseSize * 0.6, -baseSize * 0.8, baseSize * 1.2, baseSize * 1.2);
        
        // Center seam for 3D effect
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -baseSize * 0.8);
        ctx.lineTo(0, baseSize * 0.4);
        ctx.stroke();
        
        // Side highlight for roundness
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(-baseSize * 0.55, -baseSize * 0.7, baseSize * 0.2, baseSize * 0.8);
        
        // --- HEAD WITH 3D PERSPECTIVE ---
        
        // Head shadow/depth layer
        ctx.fillStyle = '#C4A575';
        ctx.beginPath();
        ctx.arc(baseSize * 0.05, -baseSize * 1.15, baseSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
        
        // Main head with gradient for roundness
        const headGradient = ctx.createRadialGradient(-baseSize * 0.1, -baseSize * 1.25, baseSize * 0.2, 0, -baseSize * 1.2, baseSize * 0.6);
        headGradient.addColorStop(0, '#E8D4B8');
        headGradient.addColorStop(0.6, '#DDBEA9');
        headGradient.addColorStop(1, '#C9A876');
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Head outline
        ctx.strokeStyle = '#B8956A';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // --- HELMET ---
        
        // Helmet with 3D perspective (front face brighter)
        const helmetGradient = ctx.createLinearGradient(-baseSize * 0.6, -baseSize * 1.3, baseSize * 0.6, -baseSize * 0.9);
        helmetGradient.addColorStop(0, '#808080');
        helmetGradient.addColorStop(0.5, '#696969');
        helmetGradient.addColorStop(1, '#505050');
        
        ctx.fillStyle = helmetGradient;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.62, Math.PI * 0.95, Math.PI * 2.05);
        ctx.fill();
        
        // Helmet rim - metallic edge
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-baseSize * 0.62, -baseSize * 1.2);
        ctx.lineTo(baseSize * 0.62, -baseSize * 1.2);
        ctx.stroke();
        
        // Helmet highlight for shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(-baseSize * 0.15, -baseSize * 1.35, baseSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Helmet front plate detail
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, -baseSize * 1.2, baseSize * 0.58, Math.PI, Math.PI * 2);
        ctx.stroke();
        
        // --- LEFT ARM WITH FRONTAL 3D MOVEMENT ---
        
        const leftShoulderX = -baseSize * 0.5;
        const leftShoulderY = -baseSize * 0.35;
        
        // Left arm: forward/back movement (Y axis) with side-to-side offset (X axis)
        // When arm swings forward, it comes toward camera and extends downward
        // When arm swings back, it goes away and slightly upward
        const leftSwingForward = leftArmBase; // -0.6 to 0.6: negative = forward, positive = back
        const leftArmDropAmount = -leftSwingForward * 0.7; // Forward swing drops arm down
        const leftArmForwardOffset = leftSwingForward * 0.3; // Slight horizontal offset for depth
        
        // Elbow position (middle of arm)
        const leftElbowX = leftShoulderX + leftArmForwardOffset * baseSize * 0.4;
        const leftElbowY = leftShoulderY + baseSize * 0.45 + leftArmDropAmount * baseSize * 0.3;
        
        // Wrist position (extended arm)
        const leftWristX = leftElbowX + leftArmForwardOffset * baseSize * 0.35;
        const leftWristY = leftElbowY + (baseSize * 0.6 + leftArmBend * baseSize * 0.15);
        
        // Left arm shadow (darker when moving back/away)
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.1 + Math.max(0, leftSwingForward) * 0.15})`;
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(leftShoulderX + 0.5, leftShoulderY + 0.5);
        ctx.lineTo(leftElbowX + 0.5, leftElbowY + 0.5);
        ctx.lineTo(leftWristX + 0.5, leftWristY + 0.5);
        ctx.stroke();
        
        // Upper arm (shoulder to elbow)
        const leftUpperArmGradient = ctx.createLinearGradient(leftShoulderX, leftShoulderY, leftElbowX, leftElbowY);
        leftUpperArmGradient.addColorStop(0, '#E8D4B8');
        leftUpperArmGradient.addColorStop(1, `rgba(201, 168, 118, ${0.9 + Math.abs(leftSwingForward) * 0.1})`);
        
        ctx.strokeStyle = leftUpperArmGradient;
        ctx.lineWidth = baseSize * 0.32;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftShoulderX, leftShoulderY);
        ctx.lineTo(leftElbowX, leftElbowY);
        ctx.stroke();
        
        // Lower arm (elbow to wrist) - slightly thinner
        const leftLowerArmGradient = ctx.createLinearGradient(leftElbowX, leftElbowY, leftWristX, leftWristY);
        leftLowerArmGradient.addColorStop(0, `rgba(232, 212, 184, ${0.95 + Math.abs(leftSwingForward) * 0.05})`);
        leftLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = leftLowerArmGradient;
        ctx.lineWidth = baseSize * 0.26;
        ctx.beginPath();
        ctx.moveTo(leftElbowX, leftElbowY);
        ctx.lineTo(leftWristX, leftWristY);
        ctx.stroke();
        
        // Left hand - rotates with arm swing
        const leftHandAlpha = 0.9 + Math.abs(leftSwingForward) * 0.1;
        ctx.fillStyle = `rgba(221, 190, 169, ${leftHandAlpha})`;
        ctx.beginPath();
        ctx.arc(leftWristX, leftWristY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        
        // Left hand fingers (show direction of swing)
        ctx.strokeStyle = `rgba(201, 168, 118, ${leftHandAlpha})`;
        ctx.lineWidth = 0.5;
        const leftFingerAngle = Math.atan2(leftWristY - leftElbowY, leftWristX - leftElbowX) + Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(leftWristX, leftWristY);
        ctx.lineTo(leftWristX + Math.cos(leftFingerAngle) * baseSize * 0.1, leftWristY + Math.sin(leftFingerAngle) * baseSize * 0.1);
        ctx.stroke();
        
        // --- RIGHT ARM WITH FRONTAL 3D MOVEMENT ---
        
        const rightShoulderX = baseSize * 0.5;
        const rightShoulderY = -baseSize * 0.35;
        
        // Right arm: opposite swing (when left goes forward, right goes back)
        const rightSwingForward = rightArmBase; // Opposite phase
        const rightArmDropAmount = -rightSwingForward * 0.7;
        const rightArmForwardOffset = rightSwingForward * 0.3;
        
        // Elbow position (middle of arm)
        const rightElbowX = rightShoulderX + rightArmForwardOffset * baseSize * 0.4;
        const rightElbowY = rightShoulderY + baseSize * 0.45 + rightArmDropAmount * baseSize * 0.3;
        
        // Wrist position (extended arm)
        const rightWristX = rightElbowX + rightArmForwardOffset * baseSize * 0.35;
        const rightWristY = rightElbowY + (baseSize * 0.6 + rightArmBend * baseSize * 0.15);
        
        // Right arm shadow (darker when moving back/away)
        ctx.strokeStyle = `rgba(0, 0, 0, ${0.1 + Math.max(0, rightSwingForward) * 0.15})`;
        ctx.lineWidth = baseSize * 0.3;
        ctx.beginPath();
        ctx.moveTo(rightShoulderX + 0.5, rightShoulderY + 0.5);
        ctx.lineTo(rightElbowX + 0.5, rightElbowY + 0.5);
        ctx.lineTo(rightWristX + 0.5, rightWristY + 0.5);
        ctx.stroke();
        
        // Upper arm (shoulder to elbow)
        const rightUpperArmGradient = ctx.createLinearGradient(rightShoulderX, rightShoulderY, rightElbowX, rightElbowY);
        rightUpperArmGradient.addColorStop(0, '#E8D4B8');
        rightUpperArmGradient.addColorStop(1, `rgba(201, 168, 118, ${0.9 + Math.abs(rightSwingForward) * 0.1})`);
        
        ctx.strokeStyle = rightUpperArmGradient;
        ctx.lineWidth = baseSize * 0.32;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(rightShoulderX, rightShoulderY);
        ctx.lineTo(rightElbowX, rightElbowY);
        ctx.stroke();
        
        // Lower arm (elbow to wrist) - slightly thinner
        const rightLowerArmGradient = ctx.createLinearGradient(rightElbowX, rightElbowY, rightWristX, rightWristY);
        rightLowerArmGradient.addColorStop(0, `rgba(232, 212, 184, ${0.95 + Math.abs(rightSwingForward) * 0.05})`);
        rightLowerArmGradient.addColorStop(1, '#C9A876');
        
        ctx.strokeStyle = rightLowerArmGradient;
        ctx.lineWidth = baseSize * 0.26;
        ctx.beginPath();
        ctx.moveTo(rightElbowX, rightElbowY);
        ctx.lineTo(rightWristX, rightWristY);
        ctx.stroke();
        
        // Right hand - rotates with arm swing
        const rightHandAlpha = 0.9 + Math.abs(rightSwingForward) * 0.1;
        ctx.fillStyle = `rgba(221, 190, 169, ${rightHandAlpha})`;
        ctx.beginPath();
        ctx.arc(rightWristX, rightWristY, baseSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        
        // Right hand fingers (show direction of swing)
        ctx.strokeStyle = `rgba(201, 168, 118, ${rightHandAlpha})`;
        ctx.lineWidth = 0.5;
        const rightFingerAngle = Math.atan2(rightWristY - rightElbowY, rightWristX - rightElbowX) - Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(rightWristX, rightWristY);
        ctx.lineTo(rightWristX + Math.cos(rightFingerAngle) * baseSize * 0.1, rightWristY + Math.sin(rightFingerAngle) * baseSize * 0.1);
        ctx.stroke();
        
        // --- LEGS WITH NATURAL STRIDE ---
        
        // Left leg - follows left arm
        const leftHipX = -baseSize * 0.25;
        const leftHipY = baseSize * 0.35;
        
        const leftLegAngle = walkCycle * 0.35; // Reduced from 0.55 for slower movement
        const leftFootX = leftHipX + Math.sin(leftLegAngle) * baseSize * 0.7; // Reduced from 0.9
        const leftFootY = leftHipY + Math.cos(leftLegAngle) * baseSize * 0.8; // Reduced from 1.0
        
        // Left leg shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * 0.25;
        ctx.beginPath();
        ctx.moveTo(leftHipX + 1, leftHipY + 1);
        ctx.lineTo(leftFootX + 1, leftFootY + 1);
        ctx.stroke();
        
        // Left leg
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = baseSize * 0.25;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftHipX, leftHipY);
        ctx.lineTo(leftFootX, leftFootY);
        ctx.stroke();
        
        // Right leg - opposite stride
        const rightHipX = baseSize * 0.25;
        const rightHipY = baseSize * 0.35;
        
        const rightLegAngle = -walkCycle * 0.35; // Reduced from 0.55 for slower movement
        const rightFootX = rightHipX + Math.sin(rightLegAngle) * baseSize * 0.7; // Reduced from 0.9
        const rightFootY = rightHipY + Math.cos(rightLegAngle) * baseSize * 0.8; // Reduced from 1.0
        
        // Right leg shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = baseSize * 0.25;
        ctx.beginPath();
        ctx.moveTo(rightHipX + 1, rightHipY + 1);
        ctx.lineTo(rightFootX + 1, rightFootY + 1);
        ctx.stroke();
        
        // Right leg
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = baseSize * 0.25;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightHipX, rightHipY);
        ctx.lineTo(rightFootX, rightFootY);
        ctx.stroke();
        
        // --- BOOTS ---
        
        // Left boot
        ctx.fillStyle = '#1C1C1C';
        ctx.beginPath();
        ctx.ellipse(leftFootX, leftFootY + baseSize * 0.15, baseSize * 0.2, baseSize * 0.15, walkCycle * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Right boot
        ctx.fillStyle = '#1C1C1C';
        ctx.beginPath();
        ctx.ellipse(rightFootX, rightFootY + baseSize * 0.15, baseSize * 0.2, baseSize * 0.15, -walkCycle * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Health bar background
        const barWidth = baseSize * 3;
        const barHeight = Math.max(2, baseSize * 0.4);
        const barY = this.y - baseSize * 2.2;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        // Health bar
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
        
        // Health bar border
        ctx.strokeStyle = '#2F2F2F';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth/2, barY, barWidth, barHeight);
    }
    
    darkenColor(color, factor) {
        // Helper method to darken colors for 3D shading
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            const newR = Math.max(0, Math.floor(r * (1 - factor)));
            const newG = Math.max(0, Math.floor(g * (1 - factor)));
            const newB = Math.max(0, Math.floor(b * (1 - factor)));
            
            return `rgb(${newR}, ${newG}, ${newB})`;
        }
        return color;
    }
}
