<script setup lang="ts">
import { useFormField } from '@nuxt/ui/composables/useFormField'
import { computed } from 'vue'

import type { FormObject } from '../../types'

const { id, ariaAttrs } = useFormField()
const attrs = computed<FormObject>(() => ({
  ...(ariaAttrs.value ?? {}),
  id: id.value,
}))
</script>

<template>
  <slot :attrs="attrs" />
</template>
