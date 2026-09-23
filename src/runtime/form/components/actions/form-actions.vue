<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useFormActionButtons } from '../../composables/use-form-action-buttons'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormAction, FormRuntime } from '../../types'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<{
  runtime: FormRuntime
  actions: readonly FormAction[]
}>()
const formUi = useFormUi()

const emit = defineEmits<{
  cancel: []
}>()

const buttons = useFormActionButtons({
  actions: () => props.actions,
  onCancel: () => emit('cancel'),
  runtime: props.runtime,
})
const actionsLeft = computed(() =>
  buttons.visible.value.filter((action) => buttons.slot(action) === 'left'),
)
const actionsRight = computed(() =>
  buttons.visible.value.filter((action) => buttons.slot(action) !== 'left'),
)

function actionButtonClass(action: FormAction) {
  return mergeFormUiClass(
    buttons.fills(action) ? 'flex-1 justify-center' : undefined,
    formUi.ui.value.actions?.ui?.button,
    action.class,
  )
}
</script>

<template>
  <div
    :class="
      mergeFormUiClass(
        'flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        formUi.ui.value.actions?.ui?.root,
      )
    "
  >
    <div
      v-if="actionsLeft.length"
      :class="
        mergeFormUiClass(
          'flex min-w-0 flex-1 flex-wrap items-center justify-start gap-2',
          formUi.ui.value.actions?.ui?.left,
        )
      "
    >
      <UButton
        v-for="(action, index) in actionsLeft"
        :key="action.key ?? index"
        v-bind="buttons.button(action)"
        :class="actionButtonClass(action)"
        @click="buttons.run(action)"
      />
    </div>

    <div
      v-if="actionsRight.length"
      :class="
        mergeFormUiClass(
          'flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2',
          formUi.ui.value.actions?.ui?.right,
        )
      "
    >
      <UButton
        v-for="(action, index) in actionsRight"
        :key="action.key ?? index"
        v-bind="buttons.button(action)"
        :class="actionButtonClass(action)"
        @click="buttons.run(action)"
      />
    </div>
  </div>
</template>
