<script setup lang="ts">
import type { FormHiddenField } from '../../types'

defineProps<{
  field: FormHiddenField
  path: readonly string[]
}>()
</script>

<template>
  <input type="hidden" :name="path.join('.')" />
</template>
