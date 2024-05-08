#include "common.wgsl"

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
}