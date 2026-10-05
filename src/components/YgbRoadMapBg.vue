<!--
 * [INPUT]: 依赖 visuals/roadMap 的原路线图引擎与 Vue 生命周期
 * [OUTPUT]: 对外提供云柜宝路线图背景渲染器
 * [POS]: 云柜宝 Hero 的 Vue 背景适配器，与 React 使用同一渲染算法
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 -->
<template><canvas ref="canvasRef" class="block h-full w-full" aria-hidden="true"></canvas></template>
<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { mountRoadMap } from "../visuals/roadMap";
const canvasRef = ref(null);
let cleanup;
onMounted(() => { cleanup = mountRoadMap(canvasRef.value); });
onUnmounted(() => cleanup?.());
</script>
