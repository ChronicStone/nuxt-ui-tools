<script setup lang="ts">
const WIDTHS = [62, 84, 45, 91, 70, 38, 77, 58, 88, 49, 66, 80]
</script>

<template>
  <div class="absolute inset-0 flex flex-col gap-2.5 bg-default px-6 py-5" aria-hidden="true">
    <span
      v-for="(width, position) in WIDTHS"
      :key="position"
      class="block h-2.5 animate-pulse rounded bg-accented"
      :style="{ width: `${width}%` }"
    />
  </div>
</template>
