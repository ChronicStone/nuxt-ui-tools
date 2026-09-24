<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useFormActionButtons } from '../../composables/use-form-action-buttons'
import { useFormActions } from '../../composables/use-form-actions'
import { useFormPageContext } from '../../composables/use-form-page'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormAction } from '../../types'
import { mergeFormUiClass } from '../../utils/ui'

/**
 * Buttons of the schema `actions` in one row, in the authored order. `cancel` asks
 * before leaving a modified form when `controls.confirmNavOnDirty` is set, then the page emits
 * `cancel`; a custom action with a `link` navigates instead.
 */
const page = useFormPageContext()
const formUi = useFormUi()
const pageUi = computed(() => formUi.ui.value.page?.ui)
const actions = useFormActions({ runtime: page.root.runtime, slot: () => 'right' })
const buttons = useFormActionButtons({
  actions: () => actions.value,
  onCancel: page.cancel,
  runtime: page.root.runtime,
})

function buttonClass(action: FormAction) {
  return mergeFormUiClass(
    buttons.fills(action) ? 'flex-1 justify-center' : undefined,
    formUi.ui.value.actions?.ui?.button,
    action.class,
  )
}
</script>

<template>
  <div
    :class="mergeFormUiClass('flex shrink-0 flex-wrap items-center gap-2', pageUi?.actions)"
    data-form-page-actions
  >
    <UButton
      v-for="(action, index) in buttons.visible.value"
      :key="action.key ?? index"
      v-bind="buttons.button(action)"
      :class="buttonClass(action)"
      @click="buttons.run(action)"
    />
  </div>
</template>
