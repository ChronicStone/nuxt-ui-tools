<script setup lang="ts">
const route = useRoute()

await navigateTo({ path: '/perf/form', query: route.query }, { replace: true })
</script>

<template>
  <div />
</template>
