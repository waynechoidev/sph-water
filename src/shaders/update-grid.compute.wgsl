#include "common.wgsl"

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
}