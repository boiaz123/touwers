/**
 * WebGL Context Manager
 * Handles WebGL initialization, shader programs, and core rendering pipeline
 */
export class WebGLContext {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2', {
            alpha: true,
            antialias: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false
        });
        
        if (!this.gl) {
            throw new Error('WebGL2 not supported in this browser. Falling back to Canvas2D.');
        }
        
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.SCISSOR_TEST);
        
        this.programs = {};
        this.buffers = {};
        this.textures = {};
        this.framebuffers = {};
        
        this.initShaders();
        this.initBuffers();
        
        this.batchQueue = [];
        this.currentProgram = null;
        this.transformStack = [mat4.identity()];
        this.scissorStack = [];
    }
    
    initShaders() {
        // Basic shape shader (circles, rectangles, etc.)
        this.programs.shape = this.createProgram(
            `#version 300 es
            precision highp float;
            
            layout(location = 0) in vec2 position;
            layout(location = 1) in vec4 color;
            layout(location = 2) in vec2 center;
            layout(location = 3) in float radius;
            
            uniform mat4 projection;
            uniform mat4 view;
            
            out vec4 vertexColor;
            out vec2 fragCenter;
            out float fragRadius;
            out vec2 fragPos;
            
            void main() {
                vec4 worldPos = view * vec4(position, 0.0, 1.0);
                gl_Position = projection * worldPos;
                vertexColor = color;
                fragCenter = center;
                fragRadius = radius;
                fragPos = position;
            }`,
            `#version 300 es
            precision highp float;
            
            in vec4 vertexColor;
            in vec2 fragCenter;
            in float fragRadius;
            in vec2 fragPos;
            
            out vec4 outColor;
            
            void main() {
                float dist = distance(fragPos, fragCenter);
                float alpha = 1.0;
                
                // Smooth edge for anti-aliasing
                if (fragRadius > 0.0) {
                    alpha = smoothstep(fragRadius + 0.5, fragRadius - 0.5, dist);
                }
                
                outColor = vec4(vertexColor.rgb, vertexColor.a * alpha);
            }`
        );
        
        // Batched quad shader (for sprites and rectangles)
        this.programs.quad = this.createProgram(
            `#version 300 es
            precision highp float;
            
            layout(location = 0) in vec2 position;
            layout(location = 1) in vec2 texCoord;
            layout(location = 2) in vec4 color;
            
            uniform mat4 projection;
            uniform mat4 view;
            uniform mat4 model;
            
            out vec2 vTexCoord;
            out vec4 vColor;
            
            void main() {
                gl_Position = projection * view * model * vec4(position, 0.0, 1.0);
                vTexCoord = texCoord;
                vColor = color;
            }`,
            `#version 300 es
            precision highp float;
            
            in vec2 vTexCoord;
            in vec4 vColor;
            
            uniform sampler2D textureSampler;
            uniform bool useTexture;
            
            out vec4 outColor;
            
            void main() {
                if (useTexture) {
                    vec4 texColor = texture(textureSampler, vTexCoord);
                    outColor = texColor * vColor;
                } else {
                    outColor = vColor;
                }
            }`
        );
        
        // Line shader
        this.programs.line = this.createProgram(
            `#version 300 es
            precision highp float;
            
            layout(location = 0) in vec2 position;
            layout(location = 1) in vec4 color;
            
            uniform mat4 projection;
            uniform mat4 view;
            
            out vec4 vertexColor;
            
            void main() {
                gl_Position = projection * view * vec4(position, 0.0, 1.0);
                vertexColor = color;
            }`,
            `#version 300 es
            precision highp float;
            
            in vec4 vertexColor;
            
            out vec4 outColor;
            
            void main() {
                outColor = vertexColor;
            }`
        );
    }
    
    createProgram(vertexSource, fragmentSource) {
        const program = this.gl.createProgram();
        
        const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
        
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
            throw new Error('Failed to link WebGL program');
        }
        
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        
        return program;
    }
    
    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            throw new Error('Failed to compile WebGL shader');
        }
        
        return shader;
    }
    
    initBuffers() {
        // Quad buffer for rendering rectangles and sprites
        const quadVertices = new Float32Array([
            -0.5, -0.5, 0, 0,
             0.5, -0.5, 1, 0,
             0.5,  0.5, 1, 1,
            -0.5,  0.5, 0, 1
        ]);
        
        const quadIndices = new Uint16Array([0, 1, 2, 2, 3, 0]);
        
        this.buffers.quad = {
            vertices: this.createBuffer(quadVertices),
            indices: this.createBuffer(quadIndices, true),
            count: quadIndices.length
        };
    }
    
    createBuffer(data, isElementBuffer = false) {
        const buffer = this.gl.createBuffer();
        const target = isElementBuffer ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER;
        this.gl.bindBuffer(target, buffer);
        this.gl.bufferData(target, data, this.gl.STATIC_DRAW);
        return buffer;
    }
    
    createDynamicBuffer(size, isElementBuffer = false) {
        const buffer = this.gl.createBuffer();
        const target = isElementBuffer ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER;
        this.gl.bindBuffer(target, buffer);
        this.gl.bufferData(target, size, this.gl.DYNAMIC_DRAW);
        return buffer;
    }
    
    updateDynamicBuffer(buffer, data, offset = 0, isElementBuffer = false) {
        const target = isElementBuffer ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER;
        this.gl.bindBuffer(target, buffer);
        this.gl.bufferSubData(target, offset, data);
    }
    
    useProgram(programName) {
        const program = this.programs[programName];
        if (!program) throw new Error(`Program '${programName}' not found`);
        this.gl.useProgram(program);
        this.currentProgram = program;
        return program;
    }
    
    setUniform(name, type, ...values) {
        const location = this.gl.getUniformLocation(this.currentProgram, name);
        
        switch(type) {
            case 'float':
                this.gl.uniform1f(location, values[0]);
                break;
            case 'int':
                this.gl.uniform1i(location, values[0]);
                break;
            case 'vec2':
                this.gl.uniform2f(location, values[0], values[1]);
                break;
            case 'vec3':
                this.gl.uniform3f(location, values[0], values[1], values[2]);
                break;
            case 'vec4':
                this.gl.uniform4f(location, values[0], values[1], values[2], values[3]);
                break;
            case 'mat4':
                this.gl.uniformMatrix4fv(location, false, values[0]);
                break;
        }
    }
    
    clear(r = 0, g = 0, b = 0, a = 1) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    
    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    getWidth() {
        return this.canvas.width;
    }
    
    getHeight() {
        return this.canvas.height;
    }
}

// Simple matrix math utilities
const mat4 = {
    identity: () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]),
    ortho: (left, right, bottom, top, near, far) => {
        const result = mat4.identity();
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);
        result[0] = -2 * lr;
        result[5] = -2 * bt;
        result[10] = 2 * nf;
        result[12] = (left + right) * lr;
        result[13] = (top + bottom) * bt;
        result[14] = (far + near) * nf;
        return result;
    },
    translate: (out, x, y) => {
        out[12] = x;
        out[13] = y;
        return out;
    },
    scale: (out, x, y) => {
        out[0] *= x;
        out[5] *= y;
        return out;
    },
    multiply: (a, b) => {
        const result = mat4.identity();
        for (let i = 0; i < 16; i++) {
            result[i] = 0;
            for (let j = 0; j < 4; j++) {
                result[i] += a[i % 4 + j * 4] * b[j + (Math.floor(i / 4)) * 4];
            }
        }
        return result;
    }
};
