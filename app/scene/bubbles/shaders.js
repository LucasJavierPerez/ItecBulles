// GLSL for the bubble overworld. Colors are written in sRGB without conversion (like
// the sky shader), except the illustration, which samples an sRGB texture (decoded to
// linear) and converts back with three's colorspace chunk.

// Ashima Arts / Stefan Gustavson 3D simplex noise (MIT).
const SIMPLEX_3D = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
      i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
      i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
`;

// Cycles the four Bulles bubble colors (#FFD333 #8C00FF #FF94B6 #FF0090).
const PALETTE = /* glsl */ `
  uniform vec3 uC0;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  vec3 palette(float t) {
    t = fract(t) * 4.0;
    vec3 c = mix(uC0, uC1, smoothstep(0.0, 1.0, clamp(t, 0.0, 1.0)));
    c = mix(c, uC2, smoothstep(0.0, 1.0, clamp(t - 1.0, 0.0, 1.0)));
    c = mix(c, uC3, smoothstep(0.0, 1.0, clamp(t - 2.0, 0.0, 1.0)));
    return mix(c, uC0, smoothstep(0.0, 1.0, clamp(t - 3.0, 0.0, 1.0)));
  }
`;

export const SHELL_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uWobble;
  uniform vec3 uHitPoint;
  uniform float uHitProgress;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vNoise;
  varying float vRipple;
  ${SIMPLEX_3D}

  void main() {
    vec3 n = normalize(position);
    float noise = snoise(n * 1.4 + vec3(uTime * 0.22 + uSeed));

    // Hover ripple: a ring that travels over the sphere from the hit point.
    float ripple = 0.0;
    if (uHitProgress > 0.0 && uHitProgress < 1.0) {
      float x = distance(n, uHitPoint) - uHitProgress * 2.4;
      ripple = sin(x * 22.0) * exp(-x * x * 16.0) * (1.0 - uHitProgress);
    }

    vec3 p = position + n * (noise * uWobble + ripple * 0.05);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * n);
    vViewDir = normalize(-mv.xyz);
    vNoise = noise;
    vRipple = ripple;
    gl_Position = projectionMatrix * mv;
  }
`;

export const SHELL_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uOpacity;
  uniform vec3 uTint;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vNoise;
  varying float vRipple;
  ${PALETTE}

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewDir);
    float facing = clamp(dot(n, v), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 2.2);

    // Iridescent rim: the palette slides with the view angle, noise and time.
    vec3 iri = palette(fresnel * 0.9 + vNoise * 0.25 + uTime * 0.05 + uSeed);
    vec3 color = mix(uTint, iri, smoothstep(0.05, 0.9, fresnel));

    // Soft key-light highlight, like a soap film catching the sun.
    vec3 l = normalize(vec3(-0.45, 0.6, 0.65));
    float spec = pow(max(dot(reflect(-l, n), v), 0.0), 48.0);
    color += spec;

    float alpha = 0.05 + fresnel * 0.85 + spec * 0.8 + abs(vRipple) * 0.35;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0) * uOpacity);
  }
`;

export const IMAGE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Illustration clipped to a circle; falls back to a flat color until (or unless)
// the texture loads.
export const IMAGE_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uHasMap;
  uniform vec3 uFallback;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    float r = length(vUv - 0.5);
    if (r > 0.5) discard;
    vec3 color = mix(uFallback, texture2D(uMap, vUv).rgb, uHasMap);
    gl_FragColor = vec4(color, smoothstep(0.5, 0.485, r) * uOpacity);
    #include <colorspace_fragment>
  }
`;

export const RIPPLE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Full-screen ripple: concentric waves grow from the clicked bubble until they
// cover the screen (progress .5), then a hole opens from the center to reveal it.
export const RIPPLE_FRAGMENT = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uCenter;
  uniform vec3 uCream;
  varying vec2 vUv;
  ${PALETTE}

  void main() {
    vec2 p = (vUv - uCenter) * vec2(uAspect, 1.0);
    float d = length(p);
    float maxR = length(vec2(max(uAspect, 1.0), 1.0)) * 1.2;

    float cover = clamp(uProgress * 2.0, 0.0, 1.0);
    float reveal = clamp(uProgress * 2.0 - 1.0, 0.0, 1.0);

    float front = cover * maxR;
    float inside = smoothstep(front, front - 0.2, d);
    float e = (d - front) * 10.0;
    float ring = exp(-e * e) * (1.0 - reveal);
    float h = (d - reveal * maxR) * 10.0;
    float hole = reveal > 0.0 ? smoothstep(reveal * maxR - 0.25, reveal * maxR, d) : 1.0;
    float holeRing = reveal > 0.0 ? exp(-h * h) : 0.0;

    float waves = sin(d * 38.0 - uTime * 7.0) * 0.5 + 0.5;
    vec3 iri = palette(d * 1.2 + uTime * 0.15);
    vec3 color = mix(uCream, iri, 0.25 * waves + 0.6 * max(ring, holeRing));

    float alpha = max(inside * hole, max(ring, holeRing * (1.0 - reveal)));
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0) * 0.96);
  }
`;
