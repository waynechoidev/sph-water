#include "common.wgsl"

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

    let up: vec3f = normalize(camera.up); // Using camera up vector from uniform

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
}
