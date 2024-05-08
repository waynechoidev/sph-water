#include "common.wgsl"

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
    } else { // q >= 2.0
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
            // Find neighbors
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
}