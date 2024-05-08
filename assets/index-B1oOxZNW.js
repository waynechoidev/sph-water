var un=Object.defineProperty;var dn=(n,e,i)=>e in n?un(n,e,{enumerable:!0,configurable:!0,writable:!0,value:i}):n[e]=i;var g=(n,e,i)=>(dn(n,typeof e!="symbol"?e+"":e,i),i);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))t(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&t(c)}).observe(document,{childList:!0,subtree:!0});function i(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function t(o){if(o.ep)return;o.ep=!0;const r=i(o);fetch(o.href,r)}})();var pn=`struct VSOutput {
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
}`,vn=`struct VSOutput {
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
}`,gn=`struct VSOutput {
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
}`,hn=`struct VSOutput {
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

const COR:f32 = 0.1;
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
@fragment fn fs(input: VSOutput) -> @location(0) vec4f { 
	let dist:f32 = length(input.texCoord - vec2f(0.5, 0.5));

	if(dist > 0.5 || input.life == 0.0)
	{
		discard;
	}
		
	return vec4f(input.color, 1.0);
}`;class yn{constructor(e){g(this,"_canvas");g(this,"_adapter");g(this,"_device");g(this,"_context");g(this,"_encoder");g(this,"_pass");g(this,"_depthTexture");this._canvas=e}get device(){return this._device}async initialize(e,i){var t,o,r;if(this._canvas.style.width=`${e}px`,this._canvas.style.height=`${i}px`,this._canvas.width=e*2,this._canvas.height=i*2,this._adapter=await((t=navigator.gpu)==null?void 0:t.requestAdapter()),this._device=await((o=this._adapter)==null?void 0:o.requestDevice()),!this._device){const c="Your device does not support WebGPU.";console.error(c);const a=document.createElement("p");a.innerHTML=c,(r=document.querySelector("body"))==null||r.prepend(a)}this._context=this._canvas.getContext("webgpu"),this._context.configure({device:this._device,format:navigator.gpu.getPreferredCanvasFormat()})}setEncoder(){if(!this._device){console.error("RenderEnv was not initialized!");return}this._encoder=this._device.createCommandEncoder({label:"encoder"})}get encoder(){return this._encoder}getGraphicsPass(){(!this._context||!this._device)&&console.error("RenderEnv was not initialized!"),this._encoder||console.error("Encoder was not created!");const e=this._context.getCurrentTexture();(!this._depthTexture||this._depthTexture.width!==e.width||this._depthTexture.height!==e.height)&&(this._depthTexture&&this._depthTexture.destroy(),this._depthTexture=this._device.createTexture({size:[e.width,e.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}));const i={label:"render pass",colorAttachments:[{view:e.createView(),clearValue:[1,1,1,1],loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:this._depthTexture.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}};return this._pass=this._encoder.beginRenderPass(i),this._pass}getComputePass(){return this._encoder||console.error("Encoder was not created!"),this._encoder.beginComputePass({label:"compute pass"})}finishEncoder(){this._device||console.error("RenderEnv was not initialized!"),this._encoder||console.error("Encoder was not created!");const e=this._encoder.finish();this._device.queue.submit([e])}}class bn{constructor({label:e,device:i,vertexShader:t,fragmentShader:o}){g(this,"_label");g(this,"_pipeline");this._label=e,this._pipeline=i.createRenderPipeline({label:`${e} pipeline`,layout:"auto",vertex:{module:i.createShaderModule({label:`${e} vertex shader`,code:t}),buffers:[{arrayStride:12*Float32Array.BYTES_PER_ELEMENT,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:4*Float32Array.BYTES_PER_ELEMENT,format:"float32x3"},{shaderLocation:2,offset:8*Float32Array.BYTES_PER_ELEMENT,format:"float32x2"},{shaderLocation:3,offset:10*Float32Array.BYTES_PER_ELEMENT,format:"float32"}]}]},fragment:{module:i.createShaderModule({label:`${e} fragment shader`,code:o}),targets:[{format:navigator.gpu.getPreferredCanvasFormat()}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{depthWriteEnabled:!0,depthCompare:"less-equal",format:"depth24plus"}})}getBindGroupLayout(e){return this._pipeline.getBindGroupLayout(e)}use(e){e||console.error(`GPURenderPassEncoder was not passed to ${this._label} pipeline`),e.setPipeline(this._pipeline)}}const F=1e-6;let _=typeof Float32Array<"u"?Float32Array:Array;const Pn=Math.PI/180;function N(n){return n*Pn}function En(){let n=new _(9);return _!=Float32Array&&(n[1]=0,n[2]=0,n[3]=0,n[5]=0,n[6]=0,n[7]=0),n[0]=1,n[4]=1,n[8]=1,n}function D(){let n=new _(16);return _!=Float32Array&&(n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0),n[0]=1,n[5]=1,n[10]=1,n[15]=1,n}function wn(n){return n[0]=1,n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=1,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[10]=1,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,n}function Mn(n,e,i){let t=Math.sin(i),o=Math.cos(i),r=e[4],c=e[5],a=e[6],s=e[7],p=e[8],l=e[9],u=e[10],d=e[11];return e!==n&&(n[0]=e[0],n[1]=e[1],n[2]=e[2],n[3]=e[3],n[12]=e[12],n[13]=e[13],n[14]=e[14],n[15]=e[15]),n[4]=r*o+p*t,n[5]=c*o+l*t,n[6]=a*o+u*t,n[7]=s*o+d*t,n[8]=p*o-r*t,n[9]=l*o-c*t,n[10]=u*o-a*t,n[11]=d*o-s*t,n}function Sn(n,e,i){let t=Math.sin(i),o=Math.cos(i),r=e[0],c=e[1],a=e[2],s=e[3],p=e[8],l=e[9],u=e[10],d=e[11];return e!==n&&(n[4]=e[4],n[5]=e[5],n[6]=e[6],n[7]=e[7],n[12]=e[12],n[13]=e[13],n[14]=e[14],n[15]=e[15]),n[0]=r*o-p*t,n[1]=c*o-l*t,n[2]=a*o-u*t,n[3]=s*o-d*t,n[8]=r*t+p*o,n[9]=c*t+l*o,n[10]=a*t+u*o,n[11]=s*t+d*o,n}function On(n,e,i,t,o){const r=1/Math.tan(e/2);if(n[0]=r/i,n[1]=0,n[2]=0,n[3]=0,n[4]=0,n[5]=r,n[6]=0,n[7]=0,n[8]=0,n[9]=0,n[11]=-1,n[12]=0,n[13]=0,n[15]=0,o!=null&&o!==1/0){const c=1/(t-o);n[10]=(o+t)*c,n[14]=2*o*t*c}else n[10]=-1,n[14]=-2*t;return n}const Bn=On;function Gn(n,e,i,t){let o,r,c,a,s,p,l,u,d,f,m=e[0],x=e[1],h=e[2],G=t[0],P=t[1],T=t[2],U=i[0],R=i[1],k=i[2];return Math.abs(m-U)<F&&Math.abs(x-R)<F&&Math.abs(h-k)<F?wn(n):(l=m-U,u=x-R,d=h-k,f=1/Math.sqrt(l*l+u*u+d*d),l*=f,u*=f,d*=f,o=P*d-T*u,r=T*l-G*d,c=G*u-P*l,f=Math.sqrt(o*o+r*r+c*c),f?(f=1/f,o*=f,r*=f,c*=f):(o=0,r=0,c=0),a=u*c-d*r,s=d*o-l*c,p=l*r-u*o,f=Math.sqrt(a*a+s*s+p*p),f?(f=1/f,a*=f,s*=f,p*=f):(a=0,s=0,p=0),n[0]=o,n[1]=a,n[2]=l,n[3]=0,n[4]=r,n[5]=s,n[6]=u,n[7]=0,n[8]=c,n[9]=p,n[10]=d,n[11]=0,n[12]=-(o*m+r*x+c*h),n[13]=-(a*m+s*x+p*h),n[14]=-(l*m+u*x+d*h),n[15]=1,n)}function b(){let n=new _(3);return _!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0),n}function Vn(n){let e=n[0],i=n[1],t=n[2];return Math.sqrt(e*e+i*i+t*t)}function S(n,e,i){let t=new _(3);return t[0]=n,t[1]=e,t[2]=i,t}function Cn(n,e){let i=e[0],t=e[1],o=e[2],r=i*i+t*t+o*o;return r>0&&(r=1/Math.sqrt(r)),n[0]=e[0]*r,n[1]=e[1]*r,n[2]=e[2]*r,n}function An(n,e){return n[0]*e[0]+n[1]*e[1]+n[2]*e[2]}function q(n,e,i){let t=e[0],o=e[1],r=e[2],c=i[0],a=i[1],s=i[2];return n[0]=o*s-r*a,n[1]=r*c-t*s,n[2]=t*a-o*c,n}function C(n,e,i){let t=e[0],o=e[1],r=e[2],c=i[3]*t+i[7]*o+i[11]*r+i[15];return c=c||1,n[0]=(i[0]*t+i[4]*o+i[8]*r+i[12])/c,n[1]=(i[1]*t+i[5]*o+i[9]*r+i[13])/c,n[2]=(i[2]*t+i[6]*o+i[10]*r+i[14])/c,n}const Tn=Vn;(function(){let n=b();return function(e,i,t,o,r,c){let a,s;for(i||(i=3),t||(t=0),o?s=Math.min(o*i+t,e.length):s=e.length,a=t;a<s;a+=i)n[0]=e[a],n[1]=e[a+1],n[2]=e[a+2],r(n,n,c),e[a]=n[0],e[a+1]=n[1],e[a+2]=n[2];return e}})();function Un(){let n=new _(4);return _!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0,n[3]=0),n}function Rn(n,e){let i=e[0],t=e[1],o=e[2],r=e[3],c=i*i+t*t+o*o+r*r;return c>0&&(c=1/Math.sqrt(c)),n[0]=i*c,n[1]=t*c,n[2]=o*c,n[3]=r*c,n}(function(){let n=Un();return function(e,i,t,o,r,c){let a,s;for(i||(i=4),t||(t=0),o?s=Math.min(o*i+t,e.length):s=e.length,a=t;a<s;a+=i)n[0]=e[a],n[1]=e[a+1],n[2]=e[a+2],n[3]=e[a+3],r(n,n,c),e[a]=n[0],e[a+1]=n[1],e[a+2]=n[2],e[a+3]=n[3];return e}})();function Z(){let n=new _(4);return _!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0),n[3]=1,n}function kn(n,e,i){i=i*.5;let t=Math.sin(i);return n[0]=t*e[0],n[1]=t*e[1],n[2]=t*e[2],n[3]=Math.cos(i),n}function Y(n,e,i,t){let o=e[0],r=e[1],c=e[2],a=e[3],s=i[0],p=i[1],l=i[2],u=i[3],d,f,m,x,h;return f=o*s+r*p+c*l+a*u,f<0&&(f=-f,s=-s,p=-p,l=-l,u=-u),1-f>F?(d=Math.acos(f),m=Math.sin(d),x=Math.sin((1-t)*d)/m,h=Math.sin(t*d)/m):(x=1-t,h=t),n[0]=x*o+h*s,n[1]=x*r+h*p,n[2]=x*c+h*l,n[3]=x*a+h*u,n}function Wn(n,e){let i=e[0]+e[4]+e[8],t;if(i>0)t=Math.sqrt(i+1),n[3]=.5*t,t=.5/t,n[0]=(e[5]-e[7])*t,n[1]=(e[6]-e[2])*t,n[2]=(e[1]-e[3])*t;else{let o=0;e[4]>e[0]&&(o=1),e[8]>e[o*3+o]&&(o=2);let r=(o+1)%3,c=(o+2)%3;t=Math.sqrt(e[o*3+o]-e[r*3+r]-e[c*3+c]+1),n[o]=.5*t,t=.5/t,n[3]=(e[r*3+c]-e[c*3+r])*t,n[r]=(e[r*3+o]+e[o*3+r])*t,n[c]=(e[c*3+o]+e[o*3+c])*t}return n}const rn=Rn;(function(){let n=b(),e=S(1,0,0),i=S(0,1,0);return function(t,o,r){let c=An(o,r);return c<-.999999?(q(n,e,o),Tn(n)<1e-6&&q(n,i,o),Cn(n,n),kn(t,n,Math.PI),t):c>.999999?(t[0]=0,t[1]=0,t[2]=0,t[3]=1,t):(q(n,o,r),t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=1+c,rn(t,t))}})();(function(){let n=Z(),e=Z();return function(i,t,o,r,c,a){return Y(n,t,c,a),Y(e,o,r,a),Y(i,n,e,2*a*(1-a)),i}})();(function(){let n=En();return function(e,i,t,o){return n[0]=t[0],n[3]=t[1],n[6]=t[2],n[1]=o[0],n[4]=o[1],n[7]=o[2],n[2]=-i[0],n[5]=-i[1],n[8]=-i[2],rn(e,Wn(e,n))}})();function cn(){let n=new _(2);return _!=Float32Array&&(n[0]=0,n[1]=0),n}function nn(n,e){let i=new _(2);return i[0]=n,i[1]=e,i}function zn(n,e,i){return n[0]=e[0]+i[0],n[1]=e[1]+i[1],n}(function(){let n=cn();return function(e,i,t,o,r,c){let a,s;for(i||(i=2),t||(t=0),o?s=Math.min(o*i+t,e.length):s=e.length,a=t;a<s;a+=i)n[0]=e[a],n[1]=e[a+1],r(n,n,c),e[a]=n[0],e[a+1]=n[1];return e}})();class Fn{constructor({position:e,center:i,up:t}){g(this,"_position");g(this,"_center");g(this,"_up");g(this,"_rotate");g(this,"_isMobile");g(this,"_isDragging");g(this,"_initialX");g(this,"_initialY");this._position=e,this._center=i,this._up=t,this._rotate=nn(-10,25),this._isDragging=!1,this._initialX=0,this._initialY=0,this._isMobile=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),this.initializeEvent()}get position(){const e=this.getViewRotationMatrix(),i=b();return C(i,this._position,e),i}get up(){const e=this.getViewRotationMatrix(),i=b();return C(i,this._up,e),i}getViewMatrix(){const e=D(),i=this.getViewRotationMatrix(),t=b(),o=b(),r=b();return C(t,this._position,i),C(o,this._center,i),C(r,this._up,i),Gn(e,t,o,r),e}initializeEvent(){const e=this._isMobile?"touchstart":"mousedown",i=this._isMobile?"touchmove":"mousemove",t=this._isMobile?"touchend":"mouseup";document.addEventListener(e,o=>{this._isDragging=!0,this._initialX=this._isMobile?o.touches[0].clientX:o.clientX,this._initialY=this._isMobile?o.touches[0].clientY:o.clientY}),document.addEventListener(i,o=>{if(this._isDragging){const r=this._isMobile?o.touches[0].clientX:o.clientX,c=this._isMobile?o.touches[0].clientY:o.clientY,a=r-this._initialX,s=c-this._initialY;this._rotate=zn(this._rotate,this._rotate,nn(s/10,a/10)),this._initialX=r,this._initialY=c}}),document.addEventListener(t,()=>{this._isDragging=!1})}getViewRotationMatrix(){const e=D();return Sn(e,e,N(this._rotate[1])),Mn(e,e,N(this._rotate[0])),e}}class A{constructor({label:e,device:i,computeShader:t}){g(this,"_label");g(this,"_pipeline");this._label=e,this._pipeline=i.createComputePipeline({label:`${e} compute pipeline`,layout:"auto",compute:{module:i.createShaderModule({label:`${e} compute shader`,code:t})}})}getBindGroupLayout(e){return this._pipeline.getBindGroupLayout(e)}use(e){e||console.error(`GPUComputePassEncoder was not passed to ${this._label} pipeline`),e.setPipeline(this._pipeline)}}const B=(n,e)=>Math.random()*(e-n)+n,en=window.innerWidth,tn=window.innerHeight,In=-.5,Ln=/Android/i.test(navigator.userAgent)?.1:.2,on=4,an=/Android/i.test(navigator.userAgent)?5:20,O=256*an,jn=.06,qn=.05;async function Yn(){const n=new yn(document.querySelector("canvas"));if(await n.initialize(en,tn),!n.device)return;const e=new A({label:"update grid",device:n.device,computeShader:vn}),i=new A({label:"update density",device:n.device,computeShader:gn}),t=new A({label:"update force",device:n.device,computeShader:xn}),o=new A({label:"movement",device:n.device,computeShader:hn}),r=new A({label:"billboard",device:n.device,computeShader:pn}),c=new bn({label:"main",device:n.device,vertexShader:_n,fragmentShader:mn}),a=[];for(let y=0;y<O;++y)a.push({position:S(B(-.02,.02),B(.48,.52),B(-.02,.02)),pressure:0,velocity:S(0,-.2,0),density:0,grid:b(),life:0,force:b()});const s=[];a.forEach(({position:y,pressure:w,velocity:M,density:v,grid:E,life:W,force:z})=>s.push(...y,w,...M,v,...E,W,...z,0));const p=new Float32Array(s),l=n.device.createBuffer({label:"point vertex buffer",size:p.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST});n.device.queue.writeBuffer(l,0,p);const u=[];for(let y=0;y<O;++y){const w=S(B(0,.3),B(0,.5),B(.7,1));for(let M=0;M<6;++M)u.push({position:b(),color:w,texCoord:cn(),life:0})}const d=[];u.forEach(({position:y,color:w,texCoord:M,life:v})=>d.push(...y,0,...w,0,...M,v,0));const f=new Float32Array(d),m=n.device.createBuffer({label:"billboard vertex buffer",size:O*12*Float32Array.BYTES_PER_ELEMENT*6,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST});n.device.queue.writeBuffer(m,0,f);const x=n.device.createBuffer({label:"frag uniforms",size:O*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST}),h=n.device.createBuffer({label:"matrix uniforms",size:32*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),G=n.device.createBuffer({label:"camera uniforms",size:8*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),P=n.device.createBuffer({label:"constant buffer",size:5*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});n.device.queue.writeBuffer(P,0,new Float32Array([an,In,Ln,jn,qn]));const T=n.device.createBindGroup({label:"bind group for object",layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:h}}]}),U=n.device.createBindGroup({label:"compute update grid bind group",layout:e.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:x}},{binding:2,resource:{buffer:P}}]}),R=n.device.createBindGroup({label:"compute update density bind group",layout:i.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:P}}]}),k=n.device.createBindGroup({label:"compute update force bind group",layout:t.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:P}}]}),sn=n.device.createBindGroup({label:"compute movement bind group",layout:o.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:P}}]}),ln=n.device.createBindGroup({label:"compute billboard bind group",layout:r.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:m}},{binding:2,resource:{buffer:P}},{binding:3,resource:{buffer:G}}]}),I=new Fn({position:S(0,0,2.5),center:S(0,0,0),up:S(0,1,0)}),$=D();Bn($,N(45),en/tn,.1,100);const X=new Float32Array(new Array(O).fill(0));let V=0,H=0,L=0,K=0;const fn=document.getElementById("info");async function J(){var W,z,Q;let y=performance.now(),w=y-H;if(w>1e3&&(K=L/(w/1e3),H=y,L=0),L++,fn.innerHTML=`${K.toFixed(2)} FPS</br>${V} Particles`,O>V){for(let j=V;j<V+on;++j)X[j]=1;V+=on}(W=n.device)==null||W.queue.writeBuffer(x,0,X);const M=I.getViewMatrix();(z=n.device)==null||z.queue.writeBuffer(h,0,new Float32Array([...M,...$])),(Q=n.device)==null||Q.queue.writeBuffer(G,0,new Float32Array([...I.position,0,...I.up,0])),n.setEncoder();const v=n.getComputePass();e.use(v),v.setBindGroup(0,U),v.dispatchWorkgroups(1,1),i.use(v),v.setBindGroup(0,R),v.dispatchWorkgroups(1,1),t.use(v),v.setBindGroup(0,k),v.dispatchWorkgroups(1,1),o.use(v),v.setBindGroup(0,sn),v.dispatchWorkgroups(1,1),r.use(v),v.setBindGroup(0,ln),v.dispatchWorkgroups(1,1),v.end();const E=n.getGraphicsPass();c.use(E),E==null||E.setBindGroup(0,T),E.setVertexBuffer(0,m),E.draw(O*6),E.end(),n.finishEncoder(),requestAnimationFrame(J)}J()}Yn();
