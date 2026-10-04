<!--
 * [INPUT]: 依赖 vue-router 的 RouterView 与全局样式
 * [OUTPUT]: 对外提供应用根组件，承载所有路由页面
 * [POS]: 应用入口的根壳层，负责把路由树挂载到 DOM
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 -->
<template>
  <RouterView />
</template>
