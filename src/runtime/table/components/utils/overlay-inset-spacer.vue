<script setup lang="ts">
import { useDataListOverlayInset } from '../../composables/use-data-list-overlay-inset'

const inset = useDataListOverlayInset()
</script>

<template>
  <div
    v-if="inset?.bottom.value"
    class="nut-dl-overlay-inset shrink-0"
    aria-hidden="true"
    :style="{ height: `${inset.bottom.value}px` }"
  />
</template>
