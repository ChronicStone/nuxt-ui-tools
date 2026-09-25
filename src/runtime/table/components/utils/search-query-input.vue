<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import { computed, ref, watch } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type { DataListControlSize, DataListInputProps, DataListSearchUi } from '../../types'

const props = defineProps<{
  placeholder: string
  loading?: boolean
  size: DataListControlSize
  ui?: DataListSearchUi
  inputProps?: DataListInputProps
}>()
const model = defineModel<string>({ required: true })
const { t } = useUiToolsLocale()
const localValue = ref<string>(model.value)
const input = ref<{ inputRef?: HTMLInputElement | null } | null>(null)

watch(
  model,
  (value) => {
    if (value === localValue.value) {
      return
    }
    localValue.value = value
  },
  { flush: 'sync' },
)

const inputAttrs = computed<Record<string, unknown>>(() => ({
  color: 'neutral',
  icon: 'i-lucide-search',
  variant: 'outline',
  ...props.inputProps,
}))
const clearable = computed(() => localValue.value.length > 0)

function commitValue() {
  if (localValue.value === model.value) {
    return
  }
  model.value = localValue.value
}

function clear() {
  localValue.value = ''
  model.value = ''
  input.value?.inputRef?.focus()
}
</script>

<template>
  <UInput
    ref="input"
    v-bind="inputAttrs"
    :model-value="localValue"
    :size="props.size"
    :loading="loading"
    :placeholder="placeholder"
    :ui="ui"
    class="nut-dl-search max-w-full shrink-0"
    @update:model-value="localValue = String($event ?? '')"
    @blur="commitValue"
    @keydown.enter.prevent="commitValue"
    @keydown.escape="clearable && clear()"
  >
    <template v-if="clearable" #trailing>
      <UButton
        color="neutral"
        variant="link"
        size="xs"
        icon="i-lucide-circle-x"
        :aria-label="t('table.controls.clearSearch')"
        :class="ui?.clear"
        class="nut-dl-search__clear -mr-1 text-dimmed hover:text-default"
        @mousedown.prevent
        @click="clear"
      />
    </template>
  </UInput>
</template>

<style>
.nut-dl-search input {
  text-overflow: ellipsis;
}
</style>
