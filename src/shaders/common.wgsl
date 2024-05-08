struct VSOutput {
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