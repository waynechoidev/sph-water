export type Point = {
  position: vec3;
  pressure: number;
  velocity: vec3;
  density: number;
  grid: vec3;
  life: number;
  force: vec3;
};

export type Vertex = {
  position: vec3;
  color: vec3;
  texCoord: vec2;
  life: number;
};
