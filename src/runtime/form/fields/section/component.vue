<script setup lang="ts">
import { computed } from 'vue'

import { useFormRuntimeContext } from '../../composables/use-form-runtime'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormSectionField } from '../../types'
import { resolveFormText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<{
  field: FormSectionField
  path: readonly string[]
}>()

const form = useFormRuntimeContext()
const formUi = useFormUi()
const label = computed(() => resolveFormText(props.field.label))
const description = computed(() => resolveFormText(props.field.description))
const isFirst = computed(() => form.currentFields.value[0]?.key === props.field.key)
</script>

<template>
  <div
    :class="
      mergeFormUiClass(
        'flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1',
        isFirst ? undefined : 'mt-1 border-t border-default pt-4',
        formUi.ui.value.section?.ui?.root,
      )
    "
    data-form-section
  >
    <h3
      :class="
        mergeFormUiClass(
          'text-[11px] font-semibold uppercase tracking-[0.08em] text-dimmed',
          formUi.ui.value.section?.ui?.label,
        )
      "
    >
      {{ label }}
    </h3>
    <p
      v-if="description"
      :class="mergeFormUiClass('text-[13px] text-muted', formUi.ui.value.section?.ui?.description)"
    >
      {{ description }}
    </p>
  </div>
</template>
