<script setup lang="ts">
import { useAppConfig } from 'nuxt/app'
import { computed } from 'vue'

import { useFormOverlayController } from '../../composables/use-form-overlay-controller'
import { useFormOverlayLayout } from '../../composables/use-form-overlay-layout'
import type { FormValue } from '../../types'
import type { FormApiRuntimeInstance } from '../../types'
import {
  getFormDrawerConfig,
  getFormFullscreenConfig,
  getFormModalConfig,
} from '../../utils/overlay'
import { isRecord } from '../../utils/path'
import { mergeFormUi, resolveAppFormUi } from '../../utils/ui'
import DrawerLayout from '../layout/DrawerLayout.vue'
import FullscreenLayout from '../layout/FullscreenLayout.vue'
import ModalLayout from '../layout/ModalLayout.vue'
import FormRoot from '../root/Form.vue'

const props = defineProps<{
  instance: FormApiRuntimeInstance
}>()

const appConfig = useAppConfig()
const formUi = computed(() =>
  mergeFormUi(resolveAppFormUi(appConfig), resolveSchemaUi(props.instance.schema)),
)
const overlay = useFormOverlayController(props.instance)
const layout = useFormOverlayLayout(props.instance)
const drawerConfig = getFormDrawerConfig(props.instance.schema)
const fullscreenConfig = getFormFullscreenConfig(props.instance.schema)
const modalConfig = getFormModalConfig(props.instance.schema)

function resolveSchemaUi(schema: FormValue) {
  if (!isRecord(schema)) return undefined
  const value = Object.getOwnPropertyDescriptor(schema, 'ui')?.value
  return isRecord(value) ? value : undefined
}
</script>

<template>
  <DrawerLayout
    v-if="layout.isDrawer.value"
    :open="overlay.open.value"
    :title="overlay.title.value"
    :description="overlay.description.value"
    :dismissible="overlay.dismissible.value"
    :config="drawerConfig"
    :ui="formUi.drawer?.ui"
    @update:open="overlay.handleOpenUpdate"
    @after-close="overlay.resolveAfterClose"
  >
    <FormRoot
      :form="overlay.form"
      shell="drawer"
      :show-close-button="drawerConfig?.showCloseButton !== false"
      :ui="formUi"
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
    :config="fullscreenConfig"
    :ui="formUi.fullscreen?.ui"
    @update:open="overlay.handleOpenUpdate"
    @after-close="overlay.resolveAfterClose"
  >
    <FormRoot
      :form="overlay.form"
      shell="fullscreen"
      :show-close-button="fullscreenConfig?.showCloseButton !== false"
      :ui="formUi"
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
    :config="modalConfig"
    :ui="formUi.modal?.ui"
    @update:open="overlay.handleOpenUpdate"
    @after-close="overlay.resolveAfterClose"
  >
    <FormRoot
      :form="overlay.form"
      shell="modal"
      :show-close-button="modalConfig?.showCloseButton !== false"
      :ui="formUi"
      @submit="overlay.handleSubmitted"
      @cancel="overlay.handleCancelled"
    />
  </ModalLayout>
</template>
