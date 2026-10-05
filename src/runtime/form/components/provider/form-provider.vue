<script setup lang="ts">
import { provideFormApi } from '../../composables/use-form-api'
import { nativeConfirm, provideFormConfirm } from '../../composables/use-form-confirm'
import type { FormConfirmHandler } from '../../types'
import FormOverlayHost from './form-overlay-host.vue'

const props = defineProps<{
  /** Asks before discarding work, such as leaving a dirty form. Defaults to the native dialog. */
  confirm?: FormConfirmHandler
}>()

const formApi = provideFormApi()
const { formInstances } = formApi

provideFormConfirm((request) => (props.confirm ? props.confirm(request) : nativeConfirm(request)))
</script>

<template>
  <slot />

  <FormOverlayHost v-for="instance in formInstances" :key="instance.id" :instance="instance" />
</template>
