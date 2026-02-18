<template>
  <RouterLink
    class="group grid grid-cols-12 gap-6 border-b border-line/12 py-7 transition-colors hover:border-ink/55 hover:text-ink"
    :to="to"
  >
    <div class="col-span-12 text-sm text-muted max-md:col-span-12 md:col-span-3">
      <div class="text-[15px] font-medium text-ink">{{ primaryMeta }}</div>
      <div class="mt-2 text-sm text-muted">{{ secondaryMeta }}</div>
    </div>
    <div class="col-span-12 md:col-span-9">
      <div class="text-[17px] font-medium text-ink">{{ title }}</div>
      <div class="mt-2 text-sm text-muted">{{ lead }}</div>
    </div>
  </RouterLink>
</template>

<script setup>
defineProps({
  to: {
    type: [String, Object],
    default: "/",
  },
  title: {
    type: String,
    default: "",
  },
  lead: {
    type: String,
    default: "",
  },
  primaryMeta: {
    type: String,
    default: "",
  },
  secondaryMeta: {
    type: String,
    default: "",
  },
});
</script>
