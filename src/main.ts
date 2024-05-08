import billboard_compute from "@/shaders/billboard.compute.wgsl";
import update_grid_compute from "@/shaders/update-grid.compute.wgsl";
import update_density_compute from "@/shaders/update-density.compute.wgsl";
import update_force_compute from "@/shaders/update-force.compute.wgsl";
import movement_compute from "@/shaders/movement.compute.wgsl";
import main_vert from "@/shaders/main.vert.wgsl";
import main_frag from "@/shaders/main.frag.wgsl";
import RenderEnv from "@/engine/render-env";
import Pipeline from "@/engine/pipeline";
import { vec3, mat4, vec2 } from "@external/glmatrix/index";
import { toRadian } from "@external/glmatrix/common.js";
import Camera from "./engine/camera";
import { Point, Vertex } from "./engine/common";
import ComputePipeline from "./engine/compute-pipeline";
import { getRandomFloat } from "./utils";

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const TANK_GROUND = -0.5;
const TANK_WALL = 0.2;
const CREATE_PARTICLE_PER_FRAME = 4;
const NUM_OF_VERTEX_PER_WORKGROUP = 10;
const NUM_OF_PARTICLE = 256 * NUM_OF_VERTEX_PER_WORKGROUP;
const RADIUS = 0.06;
const DELTA = 0.05;

async function main() {
  // Initialize
  const env = new RenderEnv(
    document.querySelector("canvas") as HTMLCanvasElement
  );
  await env.initialize(WIDTH, HEIGHT);
  if (!env.device) {
    return;
  }

  // Pipelines
  const computeUpdateGridPipeline = new ComputePipeline({
    label: "update grid",
    device: env.device,
    computeShader: update_grid_compute,
  });

  const computeUpdateDensityPipeline = new ComputePipeline({
    label: "update density",
    device: env.device,
    computeShader: update_density_compute,
  });

  const computeUpdateForcePipeline = new ComputePipeline({
    label: "update force",
    device: env.device,
    computeShader: update_force_compute,
  });

  const computeMovementPipeline = new ComputePipeline({
    label: "movement",
    device: env.device,
    computeShader: movement_compute,
  });

  const computeBillboardPipeline = new ComputePipeline({
    label: "billboard",
    device: env.device,
    computeShader: billboard_compute,
  });

  const mainPipeline = new Pipeline({
    label: "main",
    device: env.device,
    vertexShader: main_vert,
    fragmentShader: main_frag,
  });

  const points: Point[] = [];
  for (let i = 0; i < NUM_OF_PARTICLE; ++i) {
    points.push({
      position: vec3.fromValues(
        getRandomFloat(-0.02, 0.02),
        getRandomFloat(0.48, 0.52),
        getRandomFloat(-0.02, 0.02)
      ),
      pressure: 0,
      velocity: vec3.fromValues(0, -0.2, 0),
      density: 0,
      grid: vec3.create(),
      life: 0,
      force: vec3.create(),
    });
  }
  const pointValues: number[] = [];
  points.forEach(
    ({ position, pressure, velocity, density, grid, life, force }) =>
      pointValues.push(
        ...position,
        pressure,
        ...velocity,
        density,
        ...grid,
        life,
        ...force,
        0
      )
  );
  const pointData = new Float32Array(pointValues);
  const pointBuffer = env.device.createBuffer({
    label: "point vertex buffer",
    size: pointData.byteLength,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });
  env.device.queue.writeBuffer(pointBuffer, 0, pointData);

  const vertices: Vertex[] = [];
  for (let i = 0; i < NUM_OF_PARTICLE; ++i) {
    const color = vec3.fromValues(
      getRandomFloat(0, 0.3),
      getRandomFloat(0, 0.5),
      getRandomFloat(0.7, 1)
    );
    for (let j = 0; j < 6; ++j) {
      vertices.push({
        position: vec3.create(),
        color: color,
        texCoord: vec2.create(),
        life: 0,
      });
    }
  }
  const verticesValues: number[] = [];
  vertices.forEach(({ position, color, texCoord, life }) =>
    verticesValues.push(...position, 0, ...color, 0, ...texCoord, life, 0)
  );
  const verticesData = new Float32Array(verticesValues);
  const billboardBuffer = env.device.createBuffer({
    label: "billboard vertex buffer",
    size: NUM_OF_PARTICLE * 12 * Float32Array.BYTES_PER_ELEMENT * 6,
    usage:
      GPUBufferUsage.VERTEX |
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });
  env.device.queue.writeBuffer(billboardBuffer, 0, verticesData);

  const lifeBuffer = env.device.createBuffer({
    label: "frag uniforms",
    size: NUM_OF_PARTICLE * Float32Array.BYTES_PER_ELEMENT,
    usage:
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.COPY_DST,
  });

  const matrixUniformBuffer = env.device.createBuffer({
    label: "matrix uniforms",
    size: (16 + 16) * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const cameraUniformBuffer = env.device.createBuffer({
    label: "camera uniforms",
    size: (3 + 1 + 3 + 1) * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const constantBuffer = env.device.createBuffer({
    label: "constant buffer",
    size: 5 * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  env.device.queue.writeBuffer(
    constantBuffer,
    0,
    new Float32Array([
      NUM_OF_VERTEX_PER_WORKGROUP,
      TANK_GROUND,
      TANK_WALL,
      RADIUS,
      DELTA,
    ])
  );

  // Bind Groups
  const bindGroup = env.device.createBindGroup({
    label: "bind group for object",
    layout: mainPipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: matrixUniformBuffer } }],
  });

  const computeUpdateGridBindGroup = env.device.createBindGroup({
    label: "compute update grid bind group",
    layout: computeUpdateGridPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: pointBuffer } },
      { binding: 1, resource: { buffer: lifeBuffer } },
      {
        binding: 2,
        resource: { buffer: constantBuffer },
      },
    ],
  });

  const computeUpdateDensityBindGroup = env.device.createBindGroup({
    label: "compute update density bind group",
    layout: computeUpdateDensityPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: pointBuffer } },
      {
        binding: 1,
        resource: { buffer: constantBuffer },
      },
    ],
  });

  const computeUpdateForceBindGroup = env.device.createBindGroup({
    label: "compute update force bind group",
    layout: computeUpdateForcePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: pointBuffer } },
      {
        binding: 1,
        resource: { buffer: constantBuffer },
      },
    ],
  });

  const computeMovementBindGroup = env.device.createBindGroup({
    label: "compute movement bind group",
    layout: computeMovementPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: pointBuffer } },
      {
        binding: 1,
        resource: { buffer: constantBuffer },
      },
    ],
  });

  const computeBillboardBindGroup = env.device.createBindGroup({
    label: "compute billboard bind group",
    layout: computeBillboardPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: pointBuffer } },
      { binding: 1, resource: { buffer: billboardBuffer } },
      {
        binding: 2,
        resource: { buffer: constantBuffer },
      },
      { binding: 3, resource: { buffer: cameraUniformBuffer } },
    ],
  });

  // View
  const camera = new Camera({
    position: vec3.fromValues(0, 0, 2.5),
    center: vec3.fromValues(0, 0, 0),
    up: vec3.fromValues(0, 1, 0),
  });

  // Projection
  const projection = mat4.create();
  mat4.perspective(projection, toRadian(45), WIDTH / HEIGHT, 0.1, 100);

  const lives = new Float32Array(new Array(NUM_OF_PARTICLE).fill(0));
  let pointer = 0;

  let lastTime = 0;
  let frameCount = 0;
  let fps = 0;

  const info = document.getElementById("info") as HTMLElement;

  async function render() {
    let currentTime = performance.now();
    let elapsedTime = currentTime - lastTime;
    if (elapsedTime > 1000) {
      fps = frameCount / (elapsedTime / 1000);
      lastTime = currentTime;
      frameCount = 0;
    }
    frameCount++;

    info.innerHTML = `${fps.toFixed(2)} FPS</br>${pointer} Particles`;

    if (NUM_OF_PARTICLE > pointer) {
      for (let i = pointer; i < pointer + CREATE_PARTICLE_PER_FRAME; ++i) {
        lives[i] = 1;
      }
      pointer += CREATE_PARTICLE_PER_FRAME;
    }
    env.device?.queue.writeBuffer(lifeBuffer, 0, lives);

    const view = camera.getViewMatrix();
    env.device?.queue.writeBuffer(
      matrixUniformBuffer,
      0,
      new Float32Array([...view, ...projection])
    );

    env.device?.queue.writeBuffer(
      cameraUniformBuffer,
      0,
      new Float32Array([...camera.position, 0, ...camera.up, 0])
    );

    env.setEncoder();

    // Compute
    const computePass = env.getComputePass();

    computeUpdateGridPipeline.use(computePass);
    computePass.setBindGroup(0, computeUpdateGridBindGroup);
    computePass.dispatchWorkgroups(1, 1);

    computeUpdateDensityPipeline.use(computePass);
    computePass.setBindGroup(0, computeUpdateDensityBindGroup);
    computePass.dispatchWorkgroups(1, 1);

    computeUpdateForcePipeline.use(computePass);
    computePass.setBindGroup(0, computeUpdateForceBindGroup);
    computePass.dispatchWorkgroups(1, 1);

    computeMovementPipeline.use(computePass);
    computePass.setBindGroup(0, computeMovementBindGroup);
    computePass.dispatchWorkgroups(1, 1);

    computeBillboardPipeline.use(computePass);
    computePass.setBindGroup(0, computeBillboardBindGroup);
    computePass.dispatchWorkgroups(1, 1);

    computePass.end();

    // Graphics
    const mainPass = env.getGraphicsPass();

    mainPipeline.use(mainPass);
    mainPass?.setBindGroup(0, bindGroup);
    mainPass.setVertexBuffer(0, billboardBuffer);
    mainPass.draw(NUM_OF_PARTICLE * 6);

    mainPass.end();

    env.finishEncoder();

    requestAnimationFrame(render);
  }

  render();
}

main();
