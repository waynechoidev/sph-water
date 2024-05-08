#include "common.wgsl"

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

            // Collision detection
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
}