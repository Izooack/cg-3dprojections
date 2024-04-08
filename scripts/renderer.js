import * as CG from './transforms.js';
import { Matrix, Vector } from "./matrix.js";

const LEFT =   32; // binary 100000
const RIGHT =  16; // binary 010000
const BOTTOM = 8;  // binary 001000
const TOP =    4;  // binary 000100
const FAR =    2;  // binary 000010
const NEAR =   1;  // binary 000001
const FLOAT_EPSILON = 0.000001;

class Renderer {
    // canvas:              object ({id: __, width: __, height: __})
    // scene:               object (...see description on Canvas)
    constructor(canvas, scene) {
        this.canvas = document.getElementById(canvas.id);
        this.canvas.width = canvas.width;
        this.canvas.height = canvas.height;
        this.ctx = this.canvas.getContext('2d');
        this.scene = this.processScene(scene);
        this.enable_animation = false;  // <-- disabled for easier debugging; enable for animation
        this.start_time = null;
        this.prev_time = null;
        this.rotate = new Matrix(4, 4);
        this.rotationfactor = 0.01;
        this.center = new Vector(0, 0, 0);
    }

    //
    updateTransforms(time, delta_time) {
        // TODO: update any transformations needed for animation
        let x = new Matrix(4, 4);
        let y = new Matrix(4, 4);
        let z = new Matrix(4, 4);
        CG.mat4x4RotateX(x, this.rotationfactor * delta_time);
        CG.mat4x4RotateY(y, this.rotationfactor * delta_time);
        CG.mat4x4RotateZ(z, this.rotationfactor * delta_time);
    }

    //
    rotateLeft() {
        let v = new Vector(0, 1, 0);
        document.addEventListener('keydown', (rotateLeftHandler) => {
            if (rotateLeftHandler.key === 'ArrowLeft') {
                this.rotate = CG.mat4x4RotateX(v, -this.rotationfactor);
            }
        });
    }
    
    //
    rotateRight() {
        let v = new Vector(0, 1, 0);
        document.addEventListener('keydown', (rotateRightHandler) => {
            if (rotateRightHandler.key === 'ArrowRight') {
                this.rotate = CG.mat4x4RotateX(v, this.rotationfactor);
            }
        });
    }
    
    //
    moveLeft() {
        let n = new Vector(1, 0, 0);
        document.addEventListener('keydown', (moveLeftHandler) => {
            if (moveLeftHandler.key === 'A') {
                this.translate = CG.mat4x4Translate(n, -this.translationfactor);
            }
        });
    }
    
    //
    moveRight() {     
        let n = new Vector(1, 0, 0);
        document.addEventListener('keydown', (moveRightHandler) => {
            if (moveRightHandler.key === 'D') {
                this.translate = CG.mat4x4Translate(n, this.translationfactor);
            }
        });
    }
    
    //
    moveBackward() {
        let n = new Vector(0, 0, 1);
        document.addEventListener('keydown', (moveBackwardHandler) => {
            if (moveBackwardHandler.key === 'S') {
                this.translate = CG.mat4x4Translate(n, -this.translationfactor);
            }
        });
    }
    
    //
    moveForward() {
        let n = new Vector(0, 0, 1);
        document.addEventListener('keydown', (moveForwardHandler) => {
            if (moveForwardHandler.key === 'W') {
                this.translate = CG.mat4x4Translate(n, this.translationfactor);
            }
        });
    }

    //
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Load the scene data from the JSON file
        let sceneData = require('./sample_scene.json');

        // Extract the PRP, SRP, VUP, and clip values from the scene data
        let prp = sceneData.prp;
        let srp = sceneData.srp;
        let vup = sceneData.vup;
        let clip = sceneData.clip;

        // Compute the perspective projection matrix
        let perspectiveMatrix = mat4x4Perspective(prp, srp, vup, clip);

        // For each model
        for (let model of this.models) {
            // For each vertex
            for (let vertex of model.vertices) {
                // transform endpoints to canonical view volume
                let transformedVertex = CG.mat4x4Multiply(perspectiveMatrix, vertex);

                // For each line segment in each edge
                for (let edge of model.edges) {
                    // clip in 3D
                    let clippedLine = this.clipLinePerspective({ pt0: transformedVertex, pt1: edge }, this.z_min);
                    if (clippedLine) {
                        // project to 2D
                        let projectedLine = this.projectTo2D(clippedLine);

                        // draw line
                        this.drawLine(projectedLine);
                    }
                }
            }
        }
        // TODO: implement drawing here!
        // For each model
        //   * For each vertex
        //     * transform endpoints to canonical view volume
        //   * For each line segment in each edge
        //     * clip in 3D
        //     * project to 2D (i.e. divide the endpoints by their w component)
        //     * translate/scale to viewport (i.e. window)
        //     * draw line
    }

    // Get outcode for a vertex
    // vertex:       Vector4 (transformed vertex in homogeneous coordinates)
    // z_min:        float (near clipping plane in canonical view volume)
    outcodePerspective(vertex, z_min) {
        let outcode = 0;
        if (vertex.x < (vertex.z - FLOAT_EPSILON)) {
            outcode += LEFT;
        }
        else if (vertex.x > (-vertex.z + FLOAT_EPSILON)) {
            outcode += RIGHT;
        }
        if (vertex.y < (vertex.z - FLOAT_EPSILON)) {
            outcode += BOTTOM;
        }
        else if (vertex.y > (-vertex.z + FLOAT_EPSILON)) {
            outcode += TOP;
        }
        if (vertex.z < (-1.0 - FLOAT_EPSILON)) {
            outcode += FAR;
        }
        else if (vertex.z > (z_min + FLOAT_EPSILON)) {
            outcode += NEAR;
        }
        return outcode;
    }

    // Clip line - should either return a new line (with two endpoints inside view volume)
    //             or null (if line is completely outside view volume)
    // line:         object {pt0: Vector4, pt1: Vector4}
    // z_min:        float (near clipping plane in canonical view volume)
    clipLinePerspective(line, z_min) {
        let result = null;
        let p0 = Vector3(line.pt0.x, line.pt0.y, line.pt0.z); 
        let p1 = Vector3(line.pt1.x, line.pt1.y, line.pt1.z);
        let out0 = this.outcodePerspective(p0, z_min);
        let out1 = this.outcodePerspective(p1, z_min);
        
        // TODO: implement clipping here!
        while (true) {
            if (!(out0 | out1)) { // Bitwise OR, if both outcodes are 0, trivially accept
                return result = { pt0: p0, pt1: p1 };
            } else if (out0 & out1) { // Bitwise AND, if not 0, trivially reject
                return result = null;
            } else {
                let out = out0 ? out0 : out1;
                let x, y, z;
    
                if (out & LEFT) { // point is to the left of the clip window
                    x = p0.x + (p1.x - p0.x) * (p0.z - p0.x) / (p1.z - p1.x);
                    y = p0.y + (p1.y - p0.y) * (p0.z - p0.x) / (p1.z - p1.x);
                    z = p0.z;
                } else if (out & RIGHT) { // point is to the right of the clip window
                    x = p0.x + (p1.x - p0.x) * (-p0.z - p0.x) / (p1.z - p1.x);
                    y = p0.y + (p1.y - p0.y) * (-p0.z - p0.x) / (p1.z - p1.x);
                    z = -p0.z;
                } else if (out & BOTTOM) { // point is below the clip window
                    x = p0.x + (p1.x - p0.x) * (p0.z - p0.y) / (p1.z - p1.y);
                    y = p0.y + (p1.y - p0.y) * (p0.z - p0.y) / (p1.z - p1.y);
                    z = p0.z;
                } else if (out & TOP) { // point is above the clip window
                    x = p0.x + (p1.x - p0.x) * (-p0.z - p0.y) / (p1.z - p1.y);
                    y = p0.y + (p1.y - p0.y) * (-p0.z - p0.y) / (p1.z - p1.y);
                    z = -p0.z;
                } else if (out & FAR) { // point is behind the viewer
                    x = p0.x + (p1.x - p0.x) * (-1.0 - p0.z) / (p1.z - p0.z);
                    y = p0.y + (p1.y - p0.y) * (-1.0 - p0.z) / (p1.z - p0.z);
                    z = -1.0;
                } else if (out & NEAR) { // point is in front of the viewer
                    x = p0.x + (p1.x - p0.x) * (z_min - p0.z) / (p1.z - p0.z);
                    y = p0.y + (p1.y - p0.y) * (z_min - p0.z) / (p1.z - p0.z);
                    z = z_min;
                }
    
                if (out === out0) { // update start point
                    p0 = new Vector4(x, y, z, 1);
                    out0 = this.outcodePerspective(p0, z_min);
                } else { // update end point
                    p1 = new Vector4(x, y, z, 1);
                    out1 = this.outcodePerspective(p1, z_min);
                }
            }
        }
    }

    //
    animate(timestamp) {
        // Get time and delta time for animation
        if (this.start_time === null) {
            this.start_time = timestamp;
            this.prev_time = timestamp;
        }
        let time = timestamp - this.start_time;
        let delta_time = timestamp - this.prev_time;

        // Update transforms for animation
        this.updateTransforms(time, delta_time);

        // Draw slide
        this.draw();

        // Invoke call for next frame in animation
        if (this.enable_animation) {
            window.requestAnimationFrame((ts) => {
                this.animate(ts);
            });
        }

        // Update previous time to current one for next calculation of delta time
        this.prev_time = timestamp;
    }

    //
    updateScene(scene) {
        this.scene = this.processScene(scene);
        if (!this.enable_animation) {
            this.draw();
        }
    }

    //
    processScene(scene) {
        let processed = {
            view: {
                prp: CG.Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]),
                srp: CG.Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]),
                vup: CG.Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]),
                clip: [...scene.view.clip]
            },
            models: []
        };

        for (let i = 0; i < scene.models.length; i++) {
            let model = { type: scene.models[i].type };
            if (model.type === 'generic') {
                model.vertices = [];
                model.edges = JSON.parse(JSON.stringify(scene.models[i].edges));
                for (let j = 0; j < scene.models[i].vertices.length; j++) {
                    model.vertices.push(CG.Vector4(scene.models[i].vertices[j][0],
                                                   scene.models[i].vertices[j][1],
                                                   scene.models[i].vertices[j][2],
                                                   1));
                    if (scene.models[i].hasOwnProperty('animation')) {
                        model.animation = JSON.parse(JSON.stringify(scene.models[i].animation));
                    }
                }
            }
            else {
                model.center = Vector4(scene.models[i].center[0],
                                       scene.models[i].center[1],
                                       scene.models[i].center[2],
                                       1);
                for (let key in scene.models[i]) {
                    if (scene.models[i].hasOwnProperty(key) && key !== 'type' && key != 'center') {
                        model[key] = JSON.parse(JSON.stringify(scene.models[i][key]));
                    }
                }
            }

            model.matrix = new Matrix(4, 4);
            processed.models.push(model);
        }

        return processed;
    }
    
    // x0:           float (x coordinate of p0)
    // y0:           float (y coordinate of p0)
    // x1:           float (x coordinate of p1)
    // y1:           float (y coordinate of p1)
    drawLine(x0, y0, x1, y1) {
        this.ctx.strokeStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.moveTo(x0, y0);
        this.ctx.lineTo(x1, y1);
        this.ctx.stroke();

        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(x0 - 2, y0 - 2, 4, 4);
        this.ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
    }
};

export { Renderer };
