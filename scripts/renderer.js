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
        this.enable_animation = true;  // disabled for easier debugging; enable for animation
        this.start_time = null;
        this.prev_time = null;
        this.rotate = new Matrix(4,4);
        this.rotfactor = 0.001;
        this.center = [0,0,0];

    }
    
    findCenter(vertices) {
        // console.log(vertices);
        let sumX = 0;
        let sumY = 0;
        let sumZ = 0;
        for (let i = 0; i < vertices.length; i++) {
          sumX += vertices[i].x;
          sumY += vertices[i].y;
          sumZ += vertices[i].z;
        }
    
        return { x: sumX / vertices.length, y: sumY / vertices.length, z: sumZ / vertices.length };
      }

    //
    updateTransforms(time, delta_time) {
        for (let model of this.scene.models) {
            if (model.animation !== null) {
                const revolutions = time / 1000;
                const center = this.findCenter(model.vertices);
                const rps = model.animation.rps;
                const axis = model.animation.axis;
    
                // Initialize matrices for transformations
                let translateToOrigin = new Matrix(4, 4);
                let rotate = new Matrix(4, 4);
                let translateBack = new Matrix(4, 4);
    
                // Translate to origin
                CG.mat4x4Translate(translateToOrigin, -center.x, -center.y, -center.z);
                
                // Apply rotation based on the specified axis
                const angle = revolutions * rps * 2 * Math.PI;
                if (axis === "y") {
                    CG.mat4x4RotateY(rotate, angle);
                } else if (axis === "x") {
                    CG.mat4x4RotateX(rotate, angle);
                } else if (axis === "z") {
                    CG.mat4x4RotateZ(rotate, angle);
                }
    
                // Translate back to original position
                CG.mat4x4Translate(translateBack, center.x, center.y, center.z);
    
                // Combine transformations
                model.matrix = Matrix.multiply([translateBack, rotate, translateToOrigin]);
            }
        }
    }
    
    
    
    

    //
    // rotateLeft() {
    //     let n = this.scene.view.prp.subtract(this.scene.view.srp);
    //     n.normalize();
    //     let u = this.scene.view.vup.cross(n);
    //     u.normalize();
    //     let v = n.cross(u);
    //     v.normalize();
    
    //     let alignUVNMatrix = new Matrix(4, 4);
    //     alignUVNMatrix.values = [
    //         [u.values[0], u.values[1], u.values[2], 0],
    //         [v.values[0], v.values[1], v.values[2], 0],
    //         [n.values[0], n.values[1], n.values[2], 0],
    //         [0, 0, 0, 1]
    //     ];

    //     let rotateMatrix = new Matrix(4, 4);
    //     rotateMatrix = CG.mat4x4RotateY(-0.1); // Create rotation matrix
    //     alignUVNMatrix = Matrix.multiply(alignUVNMatrix, rotateMatrix); // Apply rotation
    
    //     this.modelMatrix = Matrix.multiply(alignUVNMatrix, this.modelMatrix); // Update modelMatrix
    // }
    
    // rotateRight() {
    //     let n = this.scene.view.prp.subtract(this.scene.view.srp);
    //     n.normalize();
    //     let u = this.scene.view.vup.cross(n);
    //     u.normalize();
    //     let v = n.cross(u);
    //     v.normalize();
    
    //     let alignUVNMatrix = new Matrix(4, 4);
    //     alignUVNMatrix.values = [
    //         [u.values[0], u.values[1], u.values[2], 0],
    //         [v.values[0], v.values[1], v.values[2], 0],
    //         [n.values[0], n.values[1], n.values[2], 0],
    //         [0, 0, 0, 1]
    //     ];
        
    //     let rotateMatrix = new Matrix(4, 4);
    //     rotateMatrix = CG.mat4x4RotateY(0.1); // Create rotation matrix
    //     alignUVNMatrix = Matrix.multiply(alignUVNMatrix, rotateMatrix); // Apply rotation
    
    //     this.modelMatrix = Matrix.multiply(alignUVNMatrix, this.modelMatrix); // Update modelMatrix
    // }
    

    
    worldToLocal(point) {
        let prp = this.scene.view.prp;
        let srp = this.scene.view.srp;
        let vup = this.scene.view.vup;

        let n = prp.subtract(srp);
        n.normalize();
        let u = vup.cross(n);
        u.normalize();
        let v = n.cross(u);
        v.normalize();

        let translateMatrix = new Matrix(4, 4);
        CG.mat4x4Translate(translateMatrix, -prp.x, -prp.y, -prp.z);
        point = CG.Vector4(point.x, point.y, point.z, 1);

        let alignUVNMatrix = new Matrix(4, 4);
        alignUVNMatrix.values = [
            [u.x, u.y, u.z, 0],
            [v.x, v.y, v.z, 0],
            [n.x, n.y, n.z, 0],
            [0, 0, 0, 1]
        ];
        let alignUVNMatrixInverse = alignUVNMatrix.inverse();
        let vec4Point = Matrix.multiply([alignUVNMatrixInverse, translateMatrix, point]);
        return new CG.Vector3(vec4Point.x, vec4Point.y, vec4Point.z);
    }

    localToWorld(point) {
        let prp = this.scene.view.prp;
        let srp = this.scene.view.srp;
        let vup = this.scene.view.vup;

        let n = (prp.subtract(srp));
        n.normalize();
        let u = vup.cross(n);
        u.normalize();
        let v = n.cross(u);
        v.normalize();

        let translateMatrix = new Matrix(4, 4);
        CG.mat4x4Translate(translateMatrix, prp.x, prp.y, prp.z);
        point = CG.Vector4(point.x, point.y, point.z, 1);

        let alignUVNMatrix = new Matrix(4, 4);
        alignUVNMatrix.values = [
            [u.x, u.y, u.z, 0],
            [v.x, v.y, v.z, 0],
            [n.x, n.y, n.z, 0],
            [0, 0, 0, 1]
        ];
        let vec4Point = Matrix.multiply([translateMatrix, alignUVNMatrix, point]);
        return new CG.Vector3(vec4Point.x, vec4Point.y, vec4Point.z);
    }

    rotateLeft() {
        let local = this.worldToLocal(this.scene.view.srp);
        let rotateMatrix = new Matrix(4, 4);
        CG.mat4x4RotateY(rotateMatrix, -0.1);
        let point = CG.Vector4(local.x, local.y, local.z, 1);
        point = Matrix.multiply([rotateMatrix, point]);


        point = new CG.Vector3(point.x, point.y, point.z);
        let newSRP = this.localToWorld(point);
        this.scene.view.srp = newSRP;

        // this.rotateSmoothly(-0.1);
        
    }
    
    rotateRight() {
        let local = this.worldToLocal(this.scene.view.srp);
        let rotateMatrix = new Matrix(4, 4);
        CG.mat4x4RotateY(rotateMatrix, 0.1);
        let point = CG.Vector4(local.x, local.y, local.z, 1);
        point = Matrix.multiply([rotateMatrix, point]);



        point = new CG.Vector3(point.x, point.y, point.z);
        let newSRP = this.localToWorld(point);
        this.scene.view.srp = newSRP;

        // this.rotateSmoothly(0.1);
    }

    rotateSmoothly(angleIncrement) {
        const totalRotation = Math.abs(angleIncrement);
        const step = 0.01; // Adjust the step size for smoother or faster rotation
        let currentRotation = 0;
    
        let timer = setInterval(() => {
            if (currentRotation >= totalRotation) {
                clearInterval(timer);
            } else {
                let rotation = Math.min(step, totalRotation - currentRotation);
                this.applyRotation(rotation * Math.sign(angleIncrement));
                currentRotation += rotation;
            }
        }, 16); // Assuming 60 frames per second
    }
    
    applyRotation(angle) {
        let local = this.worldToLocal(this.scene.view.srp);
        let rotateMatrix = new Matrix(4, 4);
        CG.mat4x4RotateY(rotateMatrix, angle);
        let point = new CG.Vector4(local.x, local.y, local.z, 1);
        point = Matrix.multiply([rotateMatrix, point]);
        point = new CG.Vector3(point.x, point.y, point.z);
        let newSRP = this.localToWorld(point);
        this.scene.view.srp = newSRP;
    }
    
    
    
    
    //
    moveLeft() {
        let n = this.scene.view.prp.subtract(this.scene.view.srp);
        n.normalize();
        // n = norm(PRP - SRP)
        
        let u = this.scene.view.vup.cross(n);
        u.normalize();
        // u = norm(VUP x n)
    
        let v = n.cross(u);
        v.normalize();
        // v = n x u

        // use vector subtraction to move the camera to the left
        this.scene.view.srp = this.scene.view.srp.subtract(u);
        this.scene.view.prp = this.scene.view.prp.subtract(u);
    }
    
    //
    moveRight() {     
        let n = this.scene.view.prp.subtract(this.scene.view.srp);
        n.normalize();
        // n = norm(PRP - SRP)
        
        let u = this.scene.view.vup.cross(n);
        u.normalize();
        // u = norm(VUP x n)
    
        let v = n.cross(u);
        v.normalize();
        // v = n x u

        // use vector addition to move the camera to the right
        this.scene.view.srp = this.scene.view.srp.add(u);
        this.scene.view.prp = this.scene.view.prp.add(u);
    }
    
    //
    moveBackward() {
        let n = this.scene.view.prp.subtract(this.scene.view.srp);
        n.normalize();
        // n = norm(PRP - SRP)
        
        let u = this.scene.view.vup.cross(n);
        u.normalize();
        // u = norm(VUP x n)
    
        let v = n.cross(u);
        v.normalize();
        // v = n x u

        // use vector addition to move the camera backwards
        this.scene.view.srp = this.scene.view.srp.add(n);
        this.scene.view.prp = this.scene.view.prp.add(n);
    }
    
    //
    moveForward() {
        let n = this.scene.view.prp.subtract(this.scene.view.srp);
        n.normalize();
        // n = norm(PRP - SRP)
        
        let u = this.scene.view.vup.cross(n);
        u.normalize();
        // u = norm(VUP x n)
    
        let v = n.cross(u);
        v.normalize();
        // v = n x u

        // use vector subtraction to move the camera forwards
        this.scene.view.srp = this.scene.view.srp.subtract(n);
        this.scene.view.prp = this.scene.view.prp.subtract(n);
    }

    //
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // TODO: implement drawing here!
        // For each model
        //   * For each vertex
        //     * transform endpoints to canonical view volume
        //   * For each line segment in each edge
        //     * clip in 3D
        //     * project to 2D (i.e. divide the endpoints by their w component)
        //     * translate/scale to viewport (i.e. window)
        //     * draw line

        let Nper = CG.mat4x4Perspective(this.scene.view.prp, this.scene.view.srp, this.scene.view.vup, this.scene.view.clip);
        let Mper = CG.mat4x4MPer();

        // create a 4x4 matrix to translate/scale projected vertices to the viewport (window)
        let viewPortMatrix = CG.mat4x4Viewport(this.canvas.width, this.canvas.height);
        let clipOrigin = this.scene.view.clip;

        // Clip against canonical view frustum
        let z_min = -(clipOrigin[4] / clipOrigin[5]);

        // For each model
        for (let i = 0; i < this.scene.models.length; i++) {
            let model = this.scene.models[i];
            let vertexList = [];

            // Apply transformation matrix to every vertex in list
            // Creates a local copy

            for (let j = 0; j < model.vertices.length; j++) {
                vertexList.push(Matrix.multiply([model.matrix, model.vertices[j]]));
            }

            //   * For each vertex
            //     * transform endpoints to canonical view volume
            let canonicalVertices = [];
            for (let j = 0; j < model.vertices.length; j++) {
                canonicalVertices.push(Matrix.multiply([Nper, vertexList[j]]));
            }

            for (let j = 0; j < model.edges.length; j++) {
                let edges = model.edges[j];
                for (let k = 0; k < edges.length - 1; k++) {
                    let line = {pt0: canonicalVertices[edges[k]], pt1: canonicalVertices[edges[k + 1]]}
                    let clippedLine = this.clipLinePerspective(line, z_min);
                    if (clippedLine) {
                        let multipledMperMatrix1 = Matrix.multiply([Mper, clippedLine.pt0]);
                        let multipledMperMatrix2 = Matrix.multiply([Mper, clippedLine.pt1]);

                        let projectToWindow1 = Matrix.multiply([viewPortMatrix, multipledMperMatrix1]);
                        let projectToWindow2 = Matrix.multiply([viewPortMatrix, multipledMperMatrix2]);
                        this.drawLine(projectToWindow1.x / projectToWindow1.w,
                                        projectToWindow1.y / projectToWindow1.w,
                                        projectToWindow2.x / projectToWindow2.w,
                                        projectToWindow2.y / projectToWindow2.w);
                    }

                }
            }
        }
                
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
        let p0 = CG.Vector4(line.pt0.x, line.pt0.y, line.pt0.z, line.pt0.w);
        let p1 = CG.Vector4(line.pt1.x, line.pt1.y, line.pt1.z, line.pt1.w);
        let out0 = this.outcodePerspective(p0, z_min);
        let out1 = this.outcodePerspective(p1, z_min);
        
        // TODO: implement clipping here!
        while (true) {
            if (!(out0 | out1)) { // Bitwise OR function, if both outcodes are 0, we trivially accept
                return result = { pt0: p0, pt1: p1 };
            } else if (out0 & out1) { // Bitwise AND function, if not 0, we trivially reject
                return result;
            } else {
                let out = out0 ? out0 : out1;
                let x, y, z;
                let x0 = p0.x;
                let y0 = p0.y;
                let z0 = p0.z;
                let x1 = p1.x;
                let y1 = p1.y;
                let z1 = p1.z;
                let deltaX = p1.x - p0.x;
                let deltaY = p1.y - p0.y;
                let deltaZ = p1.z - p0.z;


                if (out & LEFT) {
                    let t = (-x0 + z0) / (deltaX - deltaZ);
                    x = x0 + t * deltaX;
                    y = y0 + t * deltaY;
                    z = z0 + t * deltaZ;
                    // console.log("Clip against LEFT");
                }

                if (out & RIGHT) {
                    let t = (x0 + z0) / (-deltaX - deltaZ);
                    x = x0 + t * deltaX;
                    y = y0 + t * deltaY;
                    z = z0 + t * deltaZ;
                    // console.log("Clip against RIGHT");
                }

                if (out & BOTTOM) {
                    let t = (-y0 + z0) / (deltaY - deltaZ);
                    y = y0 + t * deltaY;
                    x = x0 + t * deltaX;
                    z = z0 + t * deltaZ;
                    // console.log("Clip against BOTTOM");
                }

                if (out & TOP) {
                    let t = (y0 + z0) / (-deltaY - deltaZ);
                    y = y0 + t * deltaY;
                    x = x0 + t * deltaX;
                    z = z0 + t * deltaZ;
                    // console.log("Clip against TOP");
                }

                if (out & NEAR) {
                    let t = (z0 - z_min) / (-deltaZ);
                    z = z0 + t * deltaZ;
                    x = x0 + t * deltaX;
                    y = y0 + t * deltaY;
                    // console.log("Clip against NEAR");
                }

                if (out & FAR) {
                    let t = (-z0 - 1) / (deltaZ);
                    z = z0 + t * deltaZ;
                    x = x0 + t * deltaX;
                    y = y0 + t * deltaY;
                    // console.log("Clip against FAR");
                }

                if (out === out0) {
                    p0 = CG.Vector4(x, y, z, 1);
                    out0 = this.outcodePerspective(p0, z_min);
                } else {
                    p1 = CG.Vector4(x, y, z, 1);
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
                model.center = CG.Vector4(scene.models[i].center[0],
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
