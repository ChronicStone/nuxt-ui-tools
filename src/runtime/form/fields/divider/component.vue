<script setup lang="ts">
import { computed } from 'vue'

import USeparator from '@nuxt/ui/components/Separator.vue'

import type { FormDividerField } from '../../types'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormDividerField
  path: readonly string[]
}>()

const label = computed(() => resolveFormText(props.field.label))
</script>

<template>
  <USeparator :label="label" />
</template>
