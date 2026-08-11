<script setup lang="ts">
import { provideFormApi } from '../../composables/use-form-api'
import FormOverlayHost from './FormOverlayHost.vue'

const formApi = provideFormApi()
const formInstances = formApi.formInstances
</script>

<template>
  <slot />

  <FormOverlayHost v-for="instance in formInstances" :key="instance.id" :instance="instance" />
</template>
