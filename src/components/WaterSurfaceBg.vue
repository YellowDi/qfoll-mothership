<!--
 * [INPUT]: 依赖 visuals/waterSurface 原 WebGL 引擎、Vue 生命周期与主题
 * [OUTPUT]: 对外提供水面 WebGL 背景
 * [POS]: 水环境 Hero 的 Vue 背景适配器，与 React 使用同一着色器
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 -->
<template><canvas ref="canvasRef" class="block h-full w-full" aria-hidden="true"></canvas></template>
<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import { useTheme } from "../composables/useTheme";
import { mountWaterSurface } from "../visuals/waterSurface";
const canvasRef = ref(null);
const { isDark } = useTheme();
let cleanup;
onMounted(() => { cleanup = mountWaterSurface(canvasRef.value, () => isDark.value); });
onBeforeUnmount(() => cleanup?.());
</script>
