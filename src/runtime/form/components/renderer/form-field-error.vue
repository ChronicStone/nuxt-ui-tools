<script setup lang="ts">
import { computed } from 'vue'

import { useFormRuntimeContext } from '../../composables/use-form-runtime'

const props = defineProps<{
  path: readonly string[]
  class?: string
}>()

const form = useFormRuntimeContext()
const message = computed(() => form.getFieldError(props.path))
</script>

<template>
  <p v-if="message" :class="props.class" :data-form-cell-error="path.join('.')">
    {{ message }}
  </p>
</template>
