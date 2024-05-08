var vn=Object.defineProperty;var gn=(n,e,o)=>e in n?vn(n,e,{enumerable:!0,configurable:!0,writable:!0,value:o}):n[e]=o;var p=(n,e,o)=>(gn(n,typeof e!="symbol"?e+"":e,o),o);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))t(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&t(a)}).observe(document,{childList:!0,subtree:!0});function o(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function t(i){if(i.ep)return;i.ep=!0;const r=o(i);fetch(i.href,r)}})();var hn=`struct VSOutput {
  @builtin(position) position: vec4f,
  @location(1) texCoord: vec2f,
  @location(2) color: vec3f,
  @location(3) posWorld: vec3f,
  @location(4) life: f32,
};

struct Point {
  @location(0) position: vec3f,
  @location(1) pressure: f32,
  @location(2) velocity: vec3f,
  @location(3) density: f32,
  @location(4) grid: vec3f,
  @location(5) life: f32,
  @location(6) force: vec3f,
};

struct Vertex {
  @location(0) position: vec3f,
  @location(1) color: vec3f,
  @location(2) texCoord: vec2f,
  @location(3) life: f32,
};

struct MatrixUniforms {
  view: mat4x4f,
  projection: mat4x4f,
};

struct Constant {
  @location(0) numOfVertexPerWorkgroup: f32,
  @location(1) tankGround: f32,
  @location(2) tankWall: f32,
  @location(3) radius: f32,
  @location(4) delta: f32,
}

struct Camera {
  position: vec3f,
  up: vec3f
};

@group(0) @binding(0) var<storage, read_write> inputVertex: array<Point>;
@group(0) @binding(1) var<storage, read_write> outputVertex: array<Vertex>;
@group(0) @binding(2) var<uniform> constant: Constant;
@group(0) @binding(3) var<uniform> camera: Camera;
  
@compute @workgroup_size(256)
fn computeSomething(
    @builtin(global_invocation_id) global_invocation_id : vec3<u32>,
) {
    let startIdx = i32(global_invocation_id.x) * i32(constant.numOfVertexPerWorkgroup);
    let endIdx = min(startIdx + i32(constant.numOfVertexPerWorkgroup), 256 * i32(constant.numOfVertexPerWorkgroup));
    
    var pos = array<vec2f, 6>(
        vec2(1.0, 1.0),
        vec2(-1.0, 1.0),
        vec2(-1.0, -1.0),
        vec2(1.0, 1.0),
        vec2(-1.0, -1.0),
        vec2(1.0, -1.0),
    );

    var tex = array<vec2f, 6>(
        vec2(1.0, 0.0),
        vec2(0.0, 0.0),
        vec2(0.0, 1.0),
        vec2(1.0, 0.0),
        vec2(0.0, 1.0),
        vec2(1.0, 1.0),
    );

    let up: vec3f = normalize(camera.up); 

    for (var idx = startIdx; idx < endIdx; idx++) {
        let input = inputVertex[idx];
        
        let front:vec3f = normalize(camera.position - input.position);
        let right:vec3f = normalize(cross(camera.up, front));
        let radius:f32 = constant.radius / 2;

        for (var i = 0; i < 6; i++) {
            let newPos:vec3f = input.position + pos[i].x * right.xyz * radius + pos[i].y * up.xyz * radius;
            outputVertex[idx * 6 + i] = Vertex(newPos, outputVertex[idx * 6 + i].color, tex[i], input.life);
        }
    }
}`,xn=`struct VSOutput {
  @builtin(position) position: vec4f,
  @location(1) texCoord: vec2f,
  @location(2) color: vec3f,
  @location(3) posWorld: vec3f,
  @location(4) life: f32,
};

struct Point {
  @location(0) position: vec3f,
  @location(1) pressure: f32,
  @location(2) velocity: vec3f,
  @location(3) density: f32,
  @location(4) grid: vec3f,
  @location(5) life: f32,
  @location(6) force: vec3f,
};

struct Vertex {
  @location(0) position: vec3f,
  @location(1) color: vec3f,
  @location(2) texCoord: vec2f,
  @location(3) life: f32,
};

struct MatrixUniforms {
  view: mat4x4f,
  projection: mat4x4f,
};

struct Constant {
  @location(0) numOfVertexPerWorkgroup: f32,
  @location(1) tankGround: f32,
  @location(2) tankWall: f32,
  @location(3) radius: f32,
  @location(4) delta: f32,
}

@group(0) @binding(0) var<storage, read_write> points: array<Point>;
@group(0) @binding(1) var<storage, read_write> lives: array<f32>;
@group(0) @binding(2) var<uniform> constant: Constant;

fn getGrid(pos:f32, limit:f32) -> f32{
    let step = limit / 5;
    for (var i = 1; i < 10; i++){
        if(pos < -limit + step * f32(i)){
            return f32(i);
        }  
    }
    return 10.0;
}

@compute @workgroup_size(256) fn computeSomething(
    @builtin(global_invocation_id) global_invocation_id : vec3u,
) {
    let startIdx = i32(global_invocation_id.x) * i32(constant.numOfVertexPerWorkgroup);
    let endIdx = min(startIdx + i32(constant.numOfVertexPerWorkgroup), 256 * i32(constant.numOfVertexPerWorkgroup));

    for (var idx = startIdx; idx < endIdx; idx++) {
        var point:Point = points[idx];
        var life:f32 = lives[idx];

        if(life == 1.0){
            points[idx].grid = vec3f(getGrid(point.position.x, constant.tankWall), getGrid(point.position.y, constant.tankWall), getGrid(point.position.z, -constant.tankGround));
            points[idx].life = life;
        }
    }
}`,_n=`struct VSOutput {
  @builtin(position) position: vec4f,
  @location(1) texCoord: vec2f,
  @location(2) color: vec3f,
  @location(3) posWorld: vec3f,
  @location(4) life: f32,
};

struct Point {
  @location(0) position: vec3f,
  @location(1) pressure: f32,
  @location(2) velocity: vec3f,
  @location(3) density: f32,
  @location(4) grid: vec3f,
  @location(5) life: f32,
  @location(6) force: vec3f,
};

struct Vertex {
  @location(0) position: vec3f,
  @location(1) color: vec3f,
  @location(2) texCoord: vec2f,
  @location(3) life: f32,
};

struct MatrixUniforms {
  view: mat4x4f,
  projection: mat4x4f,
};

struct Constant {
  @location(0) numOfVertexPerWorkgroup: f32,
  @location(1) tankGround: f32,
  @location(2) tankWall: f32,
  @location(3) radius: f32,
  @location(4) delta: f32,
}

@group(0) @binding(0) var<storage, read_write> points: array<Point>;
@group(0) @binding(1) var<uniform> constant: Constant;

const MASS:f32 = 1.0;
const PRESSURE_COEFF:f32 = 1.0;
const DENSITY_0:f32 = 1.0;

fn cubicSpline(q: f32) -> f32 {
    let coeff = 3.0 / (2.0 * 3.141592);

    if (q < 1.0) {
        return coeff * (2.0 / 3.0 - q * q + 0.5 * q * q * q);
    } else if (q < 2.0) {
        return coeff * pow(2.0 - q, 3.0) / 6.0;
    } else { 
        return 0.0;
    }
}

@compute @workgroup_size(256) fn computeSomething(
    @builtin(global_invocation_id) global_invocation_id : vec3u,
) {
    let startIdx = i32(global_invocation_id.x) * i32(constant.numOfVertexPerWorkgroup);
    let endIdx = min(startIdx + i32(constant.numOfVertexPerWorkgroup), 256 * i32(constant.numOfVertexPerWorkgroup));

    for (var idx = startIdx; idx < endIdx; idx++) {
        var x:Point = points[idx];

        if(x.life == 1.0){
            
            var neighbors = array<i32, 100>();
            var lengthOfNeighbors = 0;
            for(var j = 0; j < 256 * i32(constant.numOfVertexPerWorkgroup); j++){
                let y = points[j];
                if(x.grid.x == y.grid.x && x.grid.y == y.grid.y && x.grid.z == y.grid.z){
                    neighbors[lengthOfNeighbors] = j;
                    lengthOfNeighbors++;
                }
            }

            var density:f32 = 0.0;
            for(var i = 0; i < lengthOfNeighbors; i++){
                var y = points[neighbors[i]];
                if(y.life == 0){
                    continue;
                }

                let dist:f32 = length(x.position - y.position);

                if(dist >= constant.radius){
                    continue;
                }

                density += MASS * cubicSpline(dist * 2.0 / constant.radius);                
            }

            x.density = density;
            x.pressure = PRESSURE_COEFF * (pow(x.density / DENSITY_0, 2.0) - 1.0);
            points[idx] = x;
        }
    }
}`,mn=`struct VSOutput {
  @builtin(position) position: vec4f,
  @location(1) texCoord: vec2f,
  @location(2) color: vec3f,
  @location(3) posWorld: vec3f,
  @location(4) life: f32,
};

struct Point {
  @location(0) position: vec3f,
  @location(1) pressure: f32,
  @location(2) velocity: vec3f,
  @location(3) density: f32,
  @location(4) grid: vec3f,
  @location(5) life: f32,
  @location(6) force: vec3f,
};

struct Vertex {
  @location(0) position: vec3f,
  @location(1) color: vec3f,
  @location(2) texCoord: vec2f,
  @location(3) life: f32,
};

struct MatrixUniforms {
  view: mat4x4f,
  projection: mat4x4f,
};

struct Constant {
  @location(0) numOfVertexPerWorkgroup: f32,
  @location(1) tankGround: f32,
  @location(2) tankWall: f32,
  @location(3) radius: f32,
  @location(4) delta: f32,
}

@group(0) @binding(0) var<storage, read_write> points: array<Point>;
@group(0) @binding(1) var<uniform> constant: Constant;

const MASS:f32 = 1.0;
const VISCOSITY:f32 = 0.1;
const GRAVITY:vec3f = vec3f(0.0, -0.1, 0.0);

fn cubicSplineGrad(q: f32) -> f32 {
    let coeff = 3.0 / (2.0 * 3.141592);

    if (q < 1.0) {
        return coeff * (-2.0 * q + 1.5 * q * q);
    } else if (q < 2.0) {
        return coeff * -0.5 * (2.0 - q) * (2.0 - q);
    } else { 
        return 0.0;
    }
}

@compute @workgroup_size(256) fn computeSomething(
    @builtin(global_invocation_id) global_invocation_id : vec3u,
) {
    let startIdx = i32(global_invocation_id.x) * i32(constant.numOfVertexPerWorkgroup);
    let endIdx = min(startIdx + i32(constant.numOfVertexPerWorkgroup), 256 * i32(constant.numOfVertexPerWorkgroup));

    for (var idx = startIdx; idx < endIdx; idx++) {
        var x:Point = points[idx];

        if(x.life == 1.0){
            
            var neighbors = array<i32, 100>();
            var lengthOfNeighbors = 0;
            for(var j = 0; j < 256 * i32(constant.numOfVertexPerWorkgroup); j++){
                let y = points[j];
                if(x.grid.x == y.grid.x && x.grid.y == y.grid.y && x.grid.z == y.grid.z){
                    neighbors[lengthOfNeighbors] = j;
                    lengthOfNeighbors++;
                }
            }

            var pressureForce:vec3f = vec3f(0.0);
            var viscosityForce:vec3f = vec3f(0.0);
            var externalForces:vec3f = GRAVITY * x.density;

            let rho_i:f32 = x.density;
            let p_i:f32 = x.pressure;
            let x_i:vec3f = x.position;
            let v_i:vec3f = x.velocity;

            for(var i = 0; i < lengthOfNeighbors; i++){
                var y = points[neighbors[i]];
                if(y.life == 0){
                    continue;
                }

                let rho_j:f32 = y.density;
                let p_j:f32 = y.pressure;
                let x_j:vec3f = y.position;
                let x_ij = x_i - x_j;
                let v_j:vec3f = y.velocity;

                let dist:f32 = length(x_ij);

                if(dist >= constant.radius){
                    continue;
                }

                if (dist < 1e-3f){
                    continue;
                }

                let gradPressure =
                    rho_i * MASS *
                    (p_i / (rho_i * rho_i) + p_j / (rho_j * rho_j)) *
                    cubicSplineGrad(dist * 2.0f / constant.radius) *
                    (x_i - x_j) / dist;

                let laplacianVelocity =
                    2.0f * MASS / rho_j * (v_i - v_j) /
                    (dot(x_ij, x_ij) + 0.01f * constant.radius * constant.radius) *
                    cubicSplineGrad(dist * 2.0f / constant.radius) *
                    dot(x_ij, x_ij / dist);

                pressureForce -= MASS / rho_i * gradPressure;
                viscosityForce += MASS * VISCOSITY * laplacianVelocity;
            }

            var force = pressureForce + viscosityForce + externalForces;
            points[idx].force = force;
        }
    }
}`,bn=`struct VSOutput {
  @builtin(position) position: vec4f,
  @location(1) texCoord: vec2f,
  @location(2) color: vec3f,
  @location(3) posWorld: vec3f,
  @location(4) life: f32,
};

struct Point {
  @location(0) position: vec3f,
  @location(1) pressure: f32,
  @location(2) velocity: vec3f,
  @location(3) density: f32,
  @location(4) grid: vec3f,
  @location(5) life: f32,
  @location(6) force: vec3f,
};

struct Vertex {
  @location(0) position: vec3f,
  @location(1) color: vec3f,
  @location(2) texCoord: vec2f,
  @location(3) life: f32,
};

struct MatrixUniforms {
  view: mat4x4f,
  projection: mat4x4f,
};

struct Constant {
  @location(0) numOfVertexPerWorkgroup: f32,
  @location(1) tankGround: f32,
  @location(2) tankWall: f32,
  @location(3) radius: f32,
  @location(4) delta: f32,
}

@group(0) @binding(0) var<storage, read_write> points: array<Point>;
@group(0) @binding(1) var<uniform> constant: Constant;

const COR:f32 = 0.0;
const MASS:f32 = 1.0;

@compute @workgroup_size(256) fn computeSomething(
    @builtin(global_invocation_id) global_invocation_id : vec3u,
) {
    let startIdx = i32(global_invocation_id.x) * i32(constant.numOfVertexPerWorkgroup);
    let endIdx = min(startIdx + i32(constant.numOfVertexPerWorkgroup), 256 * i32(constant.numOfVertexPerWorkgroup));

    for (var idx = startIdx; idx < endIdx; idx++) {
        var point:Point = points[idx];

        if(point.life == 1.0){
            point.velocity += point.force * constant.delta / MASS;

            
            if (point.position.y < constant.tankGround && point.velocity.y < 0.0) {
                point.velocity.y *= -COR;
                point.position.y = constant.tankGround;
            }

            if (point.position.x < -constant.tankWall && point.velocity.x < 0.0) {
                point.velocity.x *= -COR;
                point.position.x = -constant.tankWall;
            }

            if (point.position.x > constant.tankWall && point.velocity.x > 0.0) {
                point.velocity.x *= -COR;
                point.position.x = constant.tankWall;
            }

            if (point.position.z < -constant.tankWall && point.velocity.z < 0.0) {
                point.velocity.z *= -COR;
                point.position.z = -constant.tankWall;
            }

            if (point.position.z > constant.tankWall && point.velocity.z > 0.0) {
                point.velocity.z *= -COR;
                point.position.z = constant.tankWall;
            }

            point.position += point.velocity * constant.delta;
            points[idx] = point;
        }
    }
}`,yn=`struct VSOutput {
  @builtin(position) position: vec4f,
  @location(1) texCoord: vec2f,
  @location(2) color: vec3f,
  @location(3) posWorld: vec3f,
  @location(4) life: f32,
};

struct Point {
  @location(0) position: vec3f,
  @location(1) pressure: f32,
  @location(2) velocity: vec3f,
  @location(3) density: f32,
  @location(4) grid: vec3f,
  @location(5) life: f32,
  @location(6) force: vec3f,
};

struct Vertex {
  @location(0) position: vec3f,
  @location(1) color: vec3f,
  @location(2) texCoord: vec2f,
  @location(3) life: f32,
};

struct MatrixUniforms {
  view: mat4x4f,
  projection: mat4x4f,
};

struct Constant {
  @location(0) numOfVertexPerWorkgroup: f32,
  @location(1) tankGround: f32,
  @location(2) tankWall: f32,
  @location(3) radius: f32,
  @location(4) delta: f32,
}

@group(0) @binding(0) var<uniform> uni: MatrixUniforms;

@vertex fn vs(
  input: Vertex,
) -> VSOutput {

  var output: VSOutput;
  output.position = uni.projection * uni.view * vec4f(input.position, 1.0);
  output.texCoord = input.texCoord;
  output.color = input.color;
  output.life = input.life;
  return output;
}`,Pn=`struct VSOutput {
  @builtin(position) position: vec4f,
  @location(1) texCoord: vec2f,
  @location(2) color: vec3f,
  @location(3) posWorld: vec3f,
  @location(4) life: f32,
};

struct Point {
  @location(0) position: vec3f,
  @location(1) pressure: f32,
  @location(2) velocity: vec3f,
  @location(3) density: f32,
  @location(4) grid: vec3f,
  @location(5) life: f32,
  @location(6) force: vec3f,
};

struct Vertex {
  @location(0) position: vec3f,
  @location(1) color: vec3f,
  @location(2) texCoord: vec2f,
  @location(3) life: f32,
};

struct MatrixUniforms {
  view: mat4x4f,
  projection: mat4x4f,
};

struct Constant {
  @location(0) numOfVertexPerWorkgroup: f32,
  @location(1) tankGround: f32,
  @location(2) tankWall: f32,
  @location(3) radius: f32,
  @location(4) delta: f32,
}
@fragment fn fs(input: VSOutput) -> @location(0) vec4f { 
	let dist:f32 = length(input.texCoord - vec2f(0.5, 0.5));

	if(dist > 0.5 || input.life == 0.0)
	{
		discard;
	}
		
	return vec4f(input.color, 1.0);
}`;class wn{constructor(e){p(this,"_canvas");p(this,"_adapter");p(this,"_device");p(this,"_context");p(this,"_encoder");p(this,"_pass");p(this,"_depthTexture");this._canvas=e}get device(){return this._device}async initialize(e,o){var t,i,r;if(this._canvas.style.width=`${e}px`,this._canvas.style.height=`${o}px`,this._canvas.width=e*2,this._canvas.height=o*2,this._adapter=await((t=navigator.gpu)==null?void 0:t.requestAdapter()),this._device=await((i=this._adapter)==null?void 0:i.requestDevice()),!this._device){const a="Your device does not support WebGPU.";console.error(a);const c=document.createElement("p");c.innerHTML=a,(r=document.querySelector("body"))==null||r.prepend(c)}this._context=this._canvas.getContext("webgpu"),this._context.configure({device:this._device,format:navigator.gpu.getPreferredCanvasFormat()})}setEncoder(){if(!this._device){console.error("RenderEnv was not initialized!");return}this._encoder=this._device.createCommandEncoder({label:"encoder"})}get encoder(){return this._encoder}getGraphicsPass(){(!this._context||!this._device)&&console.error("RenderEnv was not initialized!"),this._encoder||console.error("Encoder was not created!");const e=this._context.getCurrentTexture();(!this._depthTexture||this._depthTexture.width!==e.width||this._depthTexture.height!==e.height)&&(this._depthTexture&&this._depthTexture.destroy(),this._depthTexture=this._device.createTexture({size:[e.width,e.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}));const o={label:"render pass",colorAttachments:[{view:e.createView(),clearValue:[1,1,1,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}};return this._pass=this._encoder.beginRenderPass(o),this._pass}getComputePass(){return this._encoder||console.error("Encoder was not created!"),this._encoder.beginComputePass({label:"compute pass"})}finishEncoder(){this._device||console.error("RenderEnv was not initialized!"),this._encoder||console.error("Encoder was not created!");const e=this._encoder.finish();this._device.queue.submit([e])}}class En{constructor({label:e,device:o,vertexShader:t,fragmentShader:i}){p(this,"_label");p(this,"_pipeline");this._label=e,this._pipeline=o.createRenderPipeline({label:`${e} pipeline`,layout:"auto",vertex:{module:o.createShaderModule({label:`${e} vertex shader`,code:t}),buffers:[{arrayStride:12*Float32Array.BYTES_PER_ELEMENT,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:4*Float32Array.BYTES_PER_ELEMENT,format:"float32x3"},{shaderLocation:2,offset:8*Float32Array.BYTES_PER_ELEMENT,format:"float32x2"},{shaderLocation:3,offset:10*Float32Array.BYTES_PER_ELEMENT,format:"float32"}]}]},fragment:{module:o.createShaderModule({label:`${e} fragment shader`,code:i}),targets:[{format:navigator.gpu.getPreferredCanvasFormat()}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:"depth24plus"}})}getBindGroupLayout(e){return this._pipeline.getBindGroupLayout(e)}use(e){e||console.error(`GPURenderPassEncoder was not passed to ${this._label} pipeline`),e.setPipeline(this._pipeline)}}const I=1e-6;let _=typeof Float32Array<"u"?Float32Array:Array;const Mn=Math.PI/180;function N(n){return n*Mn}function Sn(){let n=new _(9);return _!=Float32Array&&(n[1]=0,n[2]=0,n[3]=0,n[5]=0,n[6]=0,n[7]=0),n[0]=1,n[4]=1,n[8]=1,n}function D(){let n=new _(16);return _!=Float32Array&&(n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0),n[0]=1,n[5]=1,n[10]=1,n[15]=1,n}function On(n){return n[0]=1,n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=1,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[10]=1,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function Bn(n,e,o){let t=Math.sin(o),i=Math.cos(o),r=e[4],a=e[5],c=e[6],s=e[7],v=e[8],u=e[9],d=e[10],l=e[11];return e!==n&&(n[0]=e[0],n[1]=e[1],n[2]=e[2],n[3]=e[3],n[12]=e[12],n[13]=e[13],n[14]=e[14],n[15]=e[15]),n[4]=r*i+v*t,n[5]=a*i+u*t,n[6]=c*i+d*t,n[7]=s*i+l*t,n[8]=v*i-r*t,n[9]=u*i-a*t,n[10]=d*i-c*t,n[11]=l*i-s*t,n}function Cn(n,e,o){let t=Math.sin(o),i=Math.cos(o),r=e[0],a=e[1],c=e[2],s=e[3],v=e[8],u=e[9],d=e[10],l=e[11];return e!==n&&(n[4]=e[4],n[5]=e[5],n[6]=e[6],n[7]=e[7],n[12]=e[12],n[13]=e[13],n[14]=e[14],n[15]=e[15]),n[0]=r*i-v*t,n[1]=a*i-u*t,n[2]=c*i-d*t,n[3]=s*i-l*t,n[8]=r*t+v*i,n[9]=a*t+u*i,n[10]=c*t+d*i,n[11]=s*t+l*i,n}function Gn(n,e,o,t,i){const r=1/Math.tan(e/2);if(n[0]=r/o,n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=r,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[11]=-1,n[12]=0,n[13]=0,n[15]=0,i!=null&&i!==1/0){const a=1/(t-i);n[10]=(i+t)*a,n[14]=2*i*t*a}else n[10]=-1,n[14]=-2*t;return n}const Tn=Gn;function Un(n,e,o,t){let i,r,a,c,s,v,u,d,l,f,m=e[0],x=e[1],h=e[2],C=t[0],G=t[1],T=t[2],P=o[0],A=o[1],k=o[2];return Math.abs(m-P)<I&&Math.abs(x-A)<I&&Math.abs(h-k)<I?On(n):(u=m-P,d=x-A,l=h-k,f=1/Math.sqrt(u*u+d*d+l*l),u*=f,d*=f,l*=f,i=G*l-T*d,r=T*u-C*l,a=C*d-G*u,f=Math.sqrt(i*i+r*r+a*a),f?(f=1/f,i*=f,r*=f,a*=f):(i=0,r=0,a=0),c=d*a-l*r,s=l*i-u*a,v=u*r-d*i,f=Math.sqrt(c*c+s*s+v*v),f?(f=1/f,c*=f,s*=f,v*=f):(c=0,s=0,v=0),n[0]=i,n[1]=c,n[2]=u,n[3]=0,n[4]=r,n[5]=s,n[6]=d,n[7]=0,n[8]=a,n[9]=v,n[10]=l,n[11]=0,n[12]=-(i*m+r*x+a*h),n[13]=-(c*m+s*x+v*h),n[14]=-(u*m+d*x+l*h),n[15]=1,n)}function y(){let n=new _(3);return _!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0),n}function Vn(n){let e=n[0],o=n[1],t=n[2];return Math.sqrt(e*e+o*o+t*t)}function S(n,e,o){let t=new _(3);return t[0]=n,t[1]=e,t[2]=o,t}function Rn(n,e){let o=e[0],t=e[1],i=e[2],r=o*o+t*t+i*i;return r>0&&(r=1/Math.sqrt(r)),n[0]=e[0]*r,n[1]=e[1]*r,n[2]=e[2]*r,n}function An(n,e){return n[0]*e[0]+n[1]*e[1]+n[2]*e[2]}function Y(n,e,o){let t=e[0],i=e[1],r=e[2],a=o[0],c=o[1],s=o[2];return n[0]=i*s-r*c,n[1]=r*a-t*s,n[2]=t*c-i*a,n}function V(n,e,o){let t=e[0],i=e[1],r=e[2],a=o[3]*t+o[7]*i+o[11]*r+o[15];return a=a||1,n[0]=(o[0]*t+o[4]*i+o[8]*r+o[12])/a,n[1]=(o[1]*t+o[5]*i+o[9]*r+o[13])/a,n[2]=(o[2]*t+o[6]*i+o[10]*r+o[14])/a,n}const kn=Vn;(function(){let n=y();return function(e,o,t,i,r,a){let c,s;for(o||(o=3),t||(t=0),i?s=Math.min(i*o+t,e.length):s=e.length,c=t;c<s;c+=o)n[0]=e[c],n[1]=e[c+1],n[2]=e[c+2],r(n,n,a),e[c]=n[0],e[c+1]=n[1],e[c+2]=n[2];return e}})();function zn(){let n=new _(4);return _!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0,n[3]=0),n}function Wn(n,e){let o=e[0],t=e[1],i=e[2],r=e[3],a=o*o+t*t+i*i+r*r;return a>0&&(a=1/Math.sqrt(a)),n[0]=o*a,n[1]=t*a,n[2]=i*a,n[3]=r*a,n}(function(){let n=zn();return function(e,o,t,i,r,a){let c,s;for(o||(o=4),t||(t=0),i?s=Math.min(i*o+t,e.length):s=e.length,c=t;c<s;c+=o)n[0]=e[c],n[1]=e[c+1],n[2]=e[c+2],n[3]=e[c+3],r(n,n,a),e[c]=n[0],e[c+1]=n[1],e[c+2]=n[2],e[c+3]=n[3];return e}})();function Z(){let n=new _(4);return _!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0),n[3]=1,n}function In(n,e,o){o=o*.5;let t=Math.sin(o);return n[0]=t*e[0],n[1]=t*e[1],n[2]=t*e[2],n[3]=Math.cos(o),n}function q(n,e,o,t){let i=e[0],r=e[1],a=e[2],c=e[3],s=o[0],v=o[1],u=o[2],d=o[3],l,f,m,x,h;return f=i*s+r*v+a*u+c*d,f<0&&(f=-f,s=-s,v=-v,u=-u,d=-d),1-f>I?(l=Math.acos(f),m=Math.sin(l),x=Math.sin((1-t)*l)/m,h=Math.sin(t*l)/m):(x=1-t,h=t),n[0]=x*i+h*s,n[1]=x*r+h*v,n[2]=x*a+h*u,n[3]=x*c+h*d,n}function Fn(n,e){let o=e[0]+e[4]+e[8],t;if(o>0)t=Math.sqrt(o+1),n[3]=.5*t,t=.5/t,n[0]=(e[5]-e[7])*t,n[1]=(e[6]-e[2])*t,n[2]=(e[1]-e[3])*t;else{let i=0;e[4]>e[0]&&(i=1),e[8]>e[i*3+i]&&(i=2);let r=(i+1)%3,a=(i+2)%3;t=Math.sqrt(e[i*3+i]-e[r*3+r]-e[a*3+a]+1),n[i]=.5*t,t=.5/t,n[3]=(e[r*3+a]-e[a*3+r])*t,n[r]=(e[r*3+i]+e[i*3+r])*t,n[a]=(e[a*3+i]+e[i*3+a])*t}return n}const an=Wn;(function(){let n=y(),e=S(1,0,0),o=S(0,1,0);return function(t,i,r){let a=An(i,r);return a<-.999999?(Y(n,e,i),kn(n)<1e-6&&Y(n,o,i),Rn(n,n),In(t,n,Math.PI),t):a>.999999?(t[0]=0,t[1]=0,t[2]=0,t[3]=1,t):(Y(n,i,r),t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=1+a,an(t,t))}})();(function(){let n=Z(),e=Z();return function(o,t,i,r,a,c){return q(n,t,a,c),q(e,i,r,c),q(o,n,e,2*c*(1-c)),o}})();(function(){let n=Sn();return function(e,o,t,i){return n[0]=t[0],n[3]=t[1],n[6]=t[2],n[1]=i[0],n[4]=i[1],n[7]=i[2],n[2]=-o[0],n[5]=-o[1],n[8]=-o[2],an(e,Fn(e,n))}})();function cn(){let n=new _(2);return _!=Float32Array&&(n[0]=0,n[1]=0),n}function nn(n,e){let o=new _(2);return o[0]=n,o[1]=e,o}function jn(n,e,o){return n[0]=e[0]+o[0],n[1]=e[1]+o[1],n}(function(){let n=cn();return function(e,o,t,i,r,a){let c,s;for(o||(o=2),t||(t=0),i?s=Math.min(i*o+t,e.length):s=e.length,c=t;c<s;c+=o)n[0]=e[c],n[1]=e[c+1],r(n,n,a),e[c]=n[0],e[c+1]=n[1];return e}})();class Ln{constructor({position:e,center:o,up:t}){p(this,"_position");p(this,"_center");p(this,"_up");p(this,"_rotate");p(this,"_isMobile");p(this,"_isDragging");p(this,"_initialX");p(this,"_initialY");this._position=e,this._center=o,this._up=t,this._rotate=nn(-10,25),this._isDragging=!1,this._initialX=0,this._initialY=0,this._isMobile=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),this.initializeEvent()}get position(){const e=this.getViewRotationMatrix(),o=y();return V(o,this._position,e),o}get up(){const e=this.getViewRotationMatrix(),o=y();return V(o,this._up,e),o}getViewMatrix(){const e=D(),o=this.getViewRotationMatrix(),t=y(),i=y(),r=y();return V(t,this._position,o),V(i,this._center,o),V(r,this._up,o),Un(e,t,i,r),e}initializeEvent(){const e=this._isMobile?"touchstart":"mousedown",o=this._isMobile?"touchmove":"mousemove",t=this._isMobile?"touchend":"mouseup";document.addEventListener(e,i=>{this._isDragging=!0,this._initialX=this._isMobile?i.touches[0].clientX:i.clientX,this._initialY=this._isMobile?i.touches[0].clientY:i.clientY}),document.addEventListener(o,i=>{if(this._isDragging){const r=this._isMobile?i.touches[0].clientX:i.clientX,a=this._isMobile?i.touches[0].clientY:i.clientY,c=r-this._initialX,s=a-this._initialY;this._rotate=jn(this._rotate,this._rotate,nn(s/10,c/10)),this._initialX=r,this._initialY=a}}),document.addEventListener(t,()=>{console.log(this._rotate),this._isDragging=!1})}getViewRotationMatrix(){const e=D();return Cn(e,e,N(this._rotate[1])),Bn(e,e,N(this._rotate[0])),e}}class en{static async loadImageBitmap(e){const t=await(await fetch(e)).blob();return await createImageBitmap(t,{colorSpaceConversion:"none"})}static async generateMips(e,o){let t=e;const i=[t];let r=0;for(;r<o&&(t.width>1||t.height>1);)t=await this.createNextMipLevelRgba8Unorm(t),i.push(t),r++;return i}static async createNextMipLevelRgba8Unorm(e){const o=Math.max(1,e.width/2|0),t=Math.max(1,e.height/2|0),i=document.createElement("canvas");i.width=o,i.height=t;const r=i.getContext("2d");if(!r)throw new Error("Unable to get 2D context");return r.drawImage(e,0,0,o,t),createImageBitmap(i)}}class Yn{constructor(e){p(this,"_device");p(this,"_texture");this._device=e}get view(){return this._texture||console.error("You need to initialize texture first!"),this._texture.createView({dimension:"cube"})}async initialize(e,o=0){const t=await Promise.all(e.map(en.loadImageBitmap));if(this._texture=this._device.createTexture({label:"yellow F on red",size:[t[0].width,t[0].height,t.length],mipLevelCount:o+1,format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT}),!this._texture){console.error("Failed to load texture");return}for(let i=0;i<6;i++)(await en.generateMips(t[i],o)).forEach((a,c)=>{this._device.queue.copyExternalImageToTexture({source:a,flipY:!1},{texture:this._texture,origin:[0,0,i],mipLevel:c},{width:a.width,height:a.height})})}}class R{constructor({label:e,device:o,computeShader:t}){p(this,"_label");p(this,"_pipeline");this._label=e,this._pipeline=o.createComputePipeline({label:`${e} compute pipeline`,layout:"auto",compute:{module:o.createShaderModule({label:`${e} compute shader`,code:t})}})}getBindGroupLayout(e){return this._pipeline.getBindGroupLayout(e)}use(e){e||console.error(`GPUComputePassEncoder was not passed to ${this._label} pipeline`),e.setPipeline(this._pipeline)}}const B=(n,e)=>Math.random()*(e-n)+n,tn=window.innerWidth,on=window.innerHeight,qn=-.5,Nn=.2,rn=4,sn=20,O=256*sn,Dn=.06,$n=.05;async function Xn(){const n=new wn(document.querySelector("canvas"));if(await n.initialize(tn,on),!n.device)return;const e="";await new Yn(n.device).initialize([e+"cubemap/px.jpg",e+"cubemap/nx.jpg",e+"cubemap/py.jpg",e+"cubemap/ny.jpg",e+"cubemap/pz.jpg",e+"cubemap/nz.jpg"]);const t=new R({label:"update grid",device:n.device,computeShader:xn}),i=new R({label:"update density",device:n.device,computeShader:_n}),r=new R({label:"update force",device:n.device,computeShader:mn}),a=new R({label:"movement",device:n.device,computeShader:bn}),c=new R({label:"billboard",device:n.device,computeShader:hn}),s=new En({label:"main",device:n.device,vertexShader:yn,fragmentShader:Pn}),v=[];for(let b=0;b<O;++b)v.push({position:S(B(-.02,.02),B(.48,.52),B(-.02,.02)),pressure:0,velocity:S(0,-.2,0),density:0,grid:y(),life:0,force:y()});const u=[];v.forEach(({position:b,pressure:E,velocity:M,density:g,grid:w,life:z,force:W})=>u.push(...b,E,...M,g,...w,z,...W,0));const d=new Float32Array(u),l=n.device.createBuffer({label:"point vertex buffer",size:d.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST});n.device.queue.writeBuffer(l,0,d);const f=[];for(let b=0;b<O;++b){const E=S(B(0,.3),B(0,.5),B(.7,1));for(let M=0;M<6;++M)f.push({position:y(),color:E,texCoord:cn(),life:0})}const m=[];f.forEach(({position:b,color:E,texCoord:M,life:g})=>m.push(...b,0,...E,0,...M,g,0));const x=new Float32Array(m),h=n.device.createBuffer({label:"billboard vertex buffer",size:O*12*Float32Array.BYTES_PER_ELEMENT*6,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST});n.device.queue.writeBuffer(h,0,x);const C=n.device.createBuffer({label:"frag uniforms",size:O*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),G=n.device.createBuffer({label:"matrix uniforms",size:32*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),T=n.device.createBuffer({label:"camera uniforms",size:8*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),P=n.device.createBuffer({label:"constant buffer",size:5*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});n.device.queue.writeBuffer(P,0,new Float32Array([sn,qn,Nn,Dn,$n]));const A=n.device.createBindGroup({label:"bind group for object",layout:s.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:G}}]}),k=n.device.createBindGroup({label:"compute update grid bind group",layout:t.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:C}},{binding:2,resource:{buffer:P}}]}),ln=n.device.createBindGroup({label:"compute update density bind group",layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:P}}]}),fn=n.device.createBindGroup({label:"compute update force bind group",layout:r.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:P}}]}),un=n.device.createBindGroup({label:"compute movement bind group",layout:a.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:P}}]}),dn=n.device.createBindGroup({label:"compute billboard bind group",layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:h}},{binding:2,resource:{buffer:P}},{binding:3,resource:{buffer:T}}]}),F=new Ln({position:S(0,0,2.5),center:S(0,0,0),up:S(0,1,0)}),$=D();Tn($,N(45),tn/on,.1,100);const X=new Float32Array(new Array(O).fill(0));let U=0,H=0,j=0,K=0;const pn=document.getElementById("info");async function J(){var z,W,Q;let b=performance.now(),E=b-H;if(E>1e3&&(K=j/(E/1e3),H=b,j=0),j++,pn.innerHTML=`${K.toFixed(2)} FPS</br>${U} Particles`,O>U){for(let L=U;L<U+rn;++L)X[L]=1;U+=rn}(z=n.device)==null||z.queue.writeBuffer(C,0,X);const M=F.getViewMatrix();(W=n.device)==null||W.queue.writeBuffer(G,0,new Float32Array([...M,...$])),(Q=n.device)==null||Q.queue.writeBuffer(T,0,new Float32Array([...F.position,0,...F.up,0])),n.setEncoder();const g=n.getComputePass();t.use(g),g.setBindGroup(0,k),g.dispatchWorkgroups(1,1),i.use(g),g.setBindGroup(0,ln),g.dispatchWorkgroups(1,1),r.use(g),g.setBindGroup(0,fn),g.dispatchWorkgroups(1,1),a.use(g),g.setBindGroup(0,un),g.dispatchWorkgroups(1,1),c.use(g),g.setBindGroup(0,dn),g.dispatchWorkgroups(1,1),g.end();const w=n.getGraphicsPass();s.use(w),w==null||w.setBindGroup(0,A),w.setVertexBuffer(0,h),w.draw(O*6),w.end(),n.finishEncoder(),requestAnimationFrame(J)}J()}Xn();
