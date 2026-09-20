<script setup lang="ts">
import DateFamilyField from '../date-family/component.vue'
import type { FormDateField } from './types'

const props = defineProps<{
  field: FormDateField
  path: readonly string[]
}>()
</script>

<template>
  <DateFamilyField :field="props.field" :path="props.path" />
</template>
