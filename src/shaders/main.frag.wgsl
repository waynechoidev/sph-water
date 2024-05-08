// based on https://www.shadertoy.com/view/4dXGR4
#include "common.wgsl"
@fragment fn fs(input: VSOutput) -> @location(0) vec4f { 
	let dist:f32 = length(input.texCoord - vec2f(0.5, 0.5));

	if(dist > 0.5 || input.life == 0.0)
	{
		discard;
	}
		
	return vec4f(input.color, 1.0);
}