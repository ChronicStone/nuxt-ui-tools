<script setup lang="ts">
import type { ResolvedFormOption } from '../../types'

/** The secondary text at the end of an option, dimmed, with numbers that line up in a column. */
defineProps<{
  option: ResolvedFormOption
}>()
</script>

<template>
  <span
    v-if="option.suffix"
    class="shrink-0 whitespace-nowrap text-dimmed tabular-nums"
    data-form-option-suffix
  >
    {{ option.suffix }}
  </span>
</template>
