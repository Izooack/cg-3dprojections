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
        this.enable_animation = false;  // disabled for easier debugging; enable for animation
        this.start_time = null;
        this.prev_time = null;
        this.rotate = new Matrix(4, 4);
        this.rotationfactor = 0.1;
        this.translate = new Matrix(4, 4);
        this.translationfactor = 0.1;
        this.center = new Vector(3);
    }
    
    

    //
    updateTransforms(time, delta_time) {
        // TODO: update any transformations needed for animation
        let x = new Matrix(4, 4);
        let y = new Matrix(4, 4);
        let z = new Matrix(4, 4);

        // for (let i = 0; i < this.scene.models.length; i++) {
        //     if (this.scene.models[i].hasOwnProperty('animation')) {
        //         let model = this.scene.models[i];
        //         let center = this.scene.models[i].center;
        //     }

        // }
        CG.mat4x4RotateX(x, this.rotationfactor * time);
        CG.mat4x4RotateY(y, this.rotationfactor * time);
        CG.mat4x4RotateZ(z, this.rotationfactor * time);

        // In order to rotate around the center of the model,
        // First rotate the model around the origin
        // Then translate the model to its center

        // this.rotate = Matrix.multiply([x, y, z]);
    }

    //
    rotateLeft() {
        let n = this.scene.view.prp.subtract(this.scene.view.srp);
        n.normalize();
        let u = this.scene.view.vup.cross(n);
        u.normalize();
        let v = n.cross(u);
        v.normalize();
    
        let alignUVNMatrix = new Matrix(4, 4);
        alignUVNMatrix.values = [[u.values[0], u.values[1], u.values[2], 0],
                                 [v.values[0], v.values[1], v.values[2], 0],
                                 [n.values[0], n.values[1], n.values[2], 0],
                                 [0, 0, 0, 1]];
    
        // Multiply the current rotation matrix with the alignment matrix
        this.rotate = CG.mat4x4Multiply(this.rotate, alignUVNMatrix);

        // let u_axis = this.scene.view.vup.cross(this.scene.view.srp);
        // u_axis.normalize();
        // this.scene.view.vup = this.scene.view.vup.subtract(u_axis);
        // this.draw();
    }
    
    rotateRight() {
        let n = this.scene.view.prp.subtract(this.scene.view.srp);
        n.normalize();
        let u = this.scene.view.vup.cross(n);
        u.normalize();
        let v = n.cross(u);
        v.normalize();
    
        let alignUVNMatrix = new Matrix(4, 4);
        alignUVNMatrix.values = [[u.values[0], u.values[1], u.values[2], 0],
                                 [v.values[0], v.values[1], v.values[2], 0],
                                 [n.values[0], n.values[1], n.values[2], 0],
                                 [0, 0, 0, 1]];
    
        // Multiply the current rotation matrix with the alignment matrix
        this.rotate = CG.mat4x4Multiply(this.rotate, alignUVNMatrix);

        // let u_axis = this.scene.view.vup.cross(this.scene.view.srp);
        // u_axis.normalize();
        // this.scene.view.vup = this.scene.view.vup.add(u_axis);
        // this.draw();
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
        this.draw();
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
        this.draw();
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
        this.draw();
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
        this.draw();
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
        let MNper = Matrix.multiply(Mper, Nper);


        // create a 4x4 matrix to translate/scale projected vertices to the viewport (window)
        let viewPortMatrix = CG.mat4x4Viewport(this.canvas.width, this.canvas.height);
        let clipOrigin = this.scene.view.clip;

        let canonical_Vertices = [];
        let clippedVertices = [];

        // Clip against canonical view frustum
        let z_min = -(clipOrigin[4] / clipOrigin[5]);
        // Left: x = z
        // Right: x = -z
        // Bottom: y = z
        // Top: y = -z
        // Front: z = z_min
        // Back: z = -1

        // Assume you use type Generic with vertices and edges

        // For each model
        for (let i = 0; i < this.scene.models.length; i++) {
            // For each vertex

            // if (this.scene.models[i].type === 'cube') {
            //     let cubeCenter = this.scene.models[i].center;
            //     let cubeVertices = this.scene.models[i].vertices;
            //     // From the center point of the cube
            //     // create the 8 vertices on the outside of the cube
                
            // }

            // if (this.scene.models[i].type === 'cone') {
            //     let coneCenter = this.scene.models[i].center;
            // }

            // if (this.scene.models[i].type === 'cylinder') {
            //     let cylinderCenter = this.scene.models[i].center;
            // }

            // if (this.scene.models[i].type === 'sphere') {
            //     let sphereCenter = this.scene.models[i].center;
            // }

            if (this.scene.models[i].type === 'generic') {

                for (let vertex of this.scene.models[i].vertices) {
                    console.log(vertex.className);
                    // transform endpoints to canonical view volume
                    let transformedVertex = Matrix.multiply([Nper, vertex]);
                    canonical_Vertices.push(transformedVertex);
                }

                // For each line segment in each edge
                for (let edge of this.scene.models[i].edges) {
                    // clip in 3D
                    console.log(edge);

                    for (let j = 0; j < edge.length - 1; j++) {
                        // if statement that checks for the last itme in the edge list
                        // so that the point loops back to the beginning
                        console.log(edge[j]);
                        console.log(edge[j+1]);
                        let point0 = new Matrix (4,4);
                        point0 = canonical_Vertices[edge[j]];

                        // print out each of the points into the console, you can see it
                        let point1 = canonical_Vertices[edge[j+1]];

                        // let clippedVertices = this.clipLinePerspective(point0, z_min);
                        // let clippedVertices = this.clipLinePerspective(point1, z_min);

                        console.log(point0);
                        let multipledMperMatrix1 = Matrix.multiply([Mper, point0]);
                        let multipledMperMatrix2 = Matrix.multiply([Mper, point1]);

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
        // let p0 = new Vector(4); 
        // p0.values = [line.pt0.x, line.pt0.y, line.pt0.z, line.pt0.w];
        // let p1 = new Vector(4);
        // p1.values = [line.pt1.x, line.pt1.y, line.pt1.z, line.pt1.w];

        // What is the correct way to initialize a Vector?
        // Should I use Vector 3 or Vector 4?

        // This is the example given in the code:
        // let v1 = new Vector(3);
        // let v2 = new Vector(3);
        // v1.values = [2, 1, -5];
        // v2.values = [6, -4, 9];
        // let v3 = v1.cross(v2);

        let p0 = Vector3(line.pt0.x, line.pt0.y, line.pt0.z);
        let p1 = Vector3(line.pt1.x, line.pt1.y, line.pt1.z);
        let out0 = this.outcodePerspective(p0, z_min);
        let out1 = this.outcodePerspective(p1, z_min);
        
        // TODO: implement clipping here!
        while (true) {
            if (!(out0 | out1)) { // Bitwise OR, if both outcodes are 0, trivially accept
                return result = { pt0: p0, pt1: p1 };
            } else if (out0 & out1) { // Bitwise AND, if not 0, trivially reject
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
                    console.log("Clip against LEFT");
                }

                if (out & RIGHT) {
                    let t = (x0 + z0) / (-deltaX - deltaZ);
                    x = x0 + t * deltaX;
                    console.log("Clip against RIGHT");
                }

                if (out & BOTTOM) {
                    let t = (-y0 + z0) / (deltaY - deltaZ);
                    y = y0 + t * deltaY;
                    console.log("Clip against BOTTOM");
                }

                if (out & TOP) {
                    let t = (y0 + z0) / (-deltaY - deltaZ);
                    y = y0 + t * deltaY;
                    console.log("Clip against TOP");
                }

                if (out & NEAR) {
                    let t = (z0 - z_min) / (-deltaZ);
                    z = z0 + t * deltaZ;
                    console.log("Clip against NEAR");
                }

                if (out & FAR) {
                    let t = (-z0 - 1) / (deltaZ);
                    z = z0 + t * deltaZ;
                    console.log("Clip against FAR");
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
