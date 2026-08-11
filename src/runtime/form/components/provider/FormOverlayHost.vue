<script setup lang="ts">
import { useFormOverlayController } from '../../composables/use-form-overlay-controller'
import { useFormOverlayLayout } from '../../composables/use-form-overlay-layout'
import type { FormApiRuntimeInstance } from '../../types'
import DrawerLayout from '../layout/DrawerLayout.vue'
import FullscreenLayout from '../layout/FullscreenLayout.vue'
import ModalLayout from '../layout/ModalLayout.vue'
import FormRoot from '../root/Form.vue'

const props = defineProps<{
  instance: FormApiRuntimeInstance
}>()

const overlay = useFormOverlayController(props.instance)
const layout = useFormOverlayLayout(props.instance)
</script>

<template>
  <DrawerLayout
    v-if="layout.isDrawer.value"
    :open="overlay.open.value"
    :title="overlay.title.value"
    :description="overlay.description.value"
    :dismissible="overlay.dismissible.value"
    @update:open="overlay.handleOpenUpdate"
    @after-close="overlay.resolveAfterClose"
  >
    <FormRoot
      :form="overlay.form"
      shell="drawer"
      @submit="overlay.handleSubmitted"
      @cancel="overlay.handleCancelled"
    />
  </DrawerLayout>

  <FullscreenLayout
    v-else-if="layout.isFullscreen.value"
    :open="overlay.open.value"
    :title="overlay.title.value"
    :description="overlay.description.value"
    :dismissible="overlay.dismissible.value"
    @update:open="overlay.handleOpenUpdate"
    @after-close="overlay.resolveAfterClose"
  >
    <FormRoot
      :form="overlay.form"
      shell="fullscreen"
      @submit="overlay.handleSubmitted"
      @cancel="overlay.handleCancelled"
    />
  </FullscreenLayout>

  <ModalLayout
    v-else
    :open="overlay.open.value"
    :title="overlay.title.value"
    :description="overlay.description.value"
    :dismissible="overlay.dismissible.value"
    @update:open="overlay.handleOpenUpdate"
    @after-close="overlay.resolveAfterClose"
  >
    <FormRoot
      :form="overlay.form"
      shell="modal"
      @submit="overlay.handleSubmitted"
      @cancel="overlay.handleCancelled"
    />
  </ModalLayout>
</template>
