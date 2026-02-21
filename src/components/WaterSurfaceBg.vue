<template>
  <canvas ref="canvasRef" class="block h-full w-full" aria-hidden="true"></canvas>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useTheme } from "../composables/useTheme";

const canvasRef = ref(null);
const { isDark } = useTheme();

let gl = null;
let program = null;
let timeLoc = null;
let resolutionLoc = null;
let themeLoc = null;
let rafId = 0;
let resizeObserver = null;
let intersectionObserver = null;
let visibilityHandler = null;
let stopThemeWatch = null;
let inViewport = true;
let docVisible = true;
let reduceMotion = false;
let width = 0;
let height = 0;
let lastFrameTime = 0;
let resizeTimeout = null;

const TARGET_FPS = 30;
const MIN_FRAME_MS = 1000 / TARGET_FPS;
const getSafeDpr = () => Math.min(devicePixelRatio || 1, 2);

// PS Vita / PSP XMB 波浪 - 高还原度复刻 (ref: fchavonet/creative_coding-xmb_wave_background)
const vertexSource = `
  attribute vec2 aVertexPosition;
  void main() {
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);
  }
`;

const fragmentSource = `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform bool uLightMode;

  const float waveWidthFactor = 1.5;

  vec3 calcSine(vec2 uv, float speed, float frequency, float amplitude, float phaseShift, float verticalOffset, vec3 baseColor, float lineWidth, float sharpness, bool invertFalloff) {
    float angle = uTime * speed * frequency * -1.0 + (phaseShift + uv.x) * 2.0;
    float waveY = sin(angle) * amplitude + verticalOffset;
    float deltaY = waveY - uv.y;
    float distanceVal = distance(waveY, uv.y);
    if (invertFalloff) {
      if (deltaY > 0.0) distanceVal = distanceVal * 4.0;
    } else {
      if (deltaY < 0.0) distanceVal = distanceVal * 4.0;
    }
    float smoothVal = smoothstep(lineWidth * waveWidthFactor, 0.0, distanceVal);
    float scaleVal = pow(smoothVal, sharpness);
    return min(baseColor * scaleVal, baseColor);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;

    vec3 baseCol = uLightMode ? vec3(0.35, 0.55, 0.82) : vec3(0.25, 0.45, 0.75);
    vec3 accumulatedColor = vec3(0.0);
    accumulatedColor += calcSine(uv, 0.2, 0.20, 0.28, 0.0, 0.5, baseCol, 0.1, 15.0, false);
    accumulatedColor += calcSine(uv, 0.4, 0.40, 0.22, 0.0, 0.5, baseCol, 0.1, 17.0, false);
    accumulatedColor += calcSine(uv, 0.3, 0.60, 0.2, 0.0, 0.5, baseCol, 0.05, 23.0, false);
    accumulatedColor += calcSine(uv, 0.1, 0.26, 0.1, 0.0, 0.3, baseCol, 0.1, 17.0, true);
    accumulatedColor += calcSine(uv, 0.3, 0.36, 0.1, 0.0, 0.3, baseCol, 0.1, 17.0, true);
    accumulatedColor += calcSine(uv, 0.5, 0.46, 0.1, 0.0, 0.3, baseCol, 0.05, 23.0, true);
    accumulatedColor += calcSine(uv, 0.2, 0.58, 0.08, 0.0, 0.3, baseCol, 0.2, 15.0, true);

    float maxChannel = max(accumulatedColor.r, max(accumulatedColor.g, accumulatedColor.b));
    if (maxChannel <= 0.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    vec3 outputColor = accumulatedColor;

    float a = min(1.0, maxChannel * 1.1);
    gl_FragColor = vec4(outputColor, a);
  }
`;

const compileShader = (gl, source, type) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const initWebGL = () => {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  width = Math.max(1, rect.width || 1);
  height = Math.max(1, rect.height || 1);

  const dpr = getSafeDpr();
  canvasRef.value.width = Math.round(width * dpr);
  canvasRef.value.height = Math.round(height * dpr);
  gl = canvasRef.value.getContext("webgl") || canvasRef.value.getContext("experimental-webgl");
  if (!gl) return;

  const vs = compileShader(gl, vertexSource, gl.VERTEX_SHADER);
  const fs = compileShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
  if (!vs || !fs) return;

  program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

  gl.useProgram(program);
  const posLoc = gl.getAttribLocation(program, "aVertexPosition");
  timeLoc = gl.getUniformLocation(program, "uTime");
  resolutionLoc = gl.getUniformLocation(program, "uResolution");
  themeLoc = gl.getUniformLocation(program, "uLightMode");

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.viewport(0, 0, canvasRef.value.width, canvasRef.value.height);
};

const setMode = () => {
  if (!gl || !themeLoc) return;
  const light = !isDark.value;
  gl.clearColor(0, 0, 0, 0);
  gl.uniform1i(themeLoc, light ? 1 : 0);
};

const render = (timeMs) => {
  if (!gl || !program) return;
  const elapsed = timeMs - lastFrameTime;
  if (elapsed >= MIN_FRAME_MS) {
    lastFrameTime = timeMs;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(timeLoc, timeMs * 0.001);
    gl.uniform2f(resolutionLoc, width, height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  rafId = requestAnimationFrame(render);
};

const updateLoopState = () => {
  if (inViewport && docVisible && !reduceMotion) {
    if (!rafId) {
      lastFrameTime = 0;
      rafId = requestAnimationFrame(render);
    }
  } else {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }
};

const doResize = () => {
  if (!canvasRef.value || !gl) return;
  const rect = canvasRef.value.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  if (!width || !height) return;
  const dpr = getSafeDpr();
  canvasRef.value.width = Math.round(width * dpr);
  canvasRef.value.height = Math.round(height * dpr);
  gl.viewport(0, 0, canvasRef.value.width, canvasRef.value.height);
};

const resize = () => {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(doResize, 120);
};

onMounted(() => {
  reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  docVisible = !document.hidden;
  initWebGL();
  setMode();

  resizeObserver = new ResizeObserver(resize);
  if (canvasRef.value) resizeObserver.observe(canvasRef.value);

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      inViewport = entries.some((e) => e.isIntersecting);
      updateLoopState();
    },
    { threshold: 0.01 }
  );
  if (canvasRef.value) intersectionObserver.observe(canvasRef.value);

  visibilityHandler = () => {
    docVisible = !document.hidden;
    updateLoopState();
  };
  document.addEventListener("visibilitychange", visibilityHandler);

  updateLoopState();
  stopThemeWatch = watch(isDark, () => setMode());
});

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId);
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeObserver?.disconnect?.();
  intersectionObserver?.disconnect?.();
  document.removeEventListener("visibilitychange", visibilityHandler);
  stopThemeWatch?.();
  gl = null;
  program = null;
});
</script>
