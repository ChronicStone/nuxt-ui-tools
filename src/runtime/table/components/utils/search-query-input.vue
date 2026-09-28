<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UInput from '@nuxt/ui/components/Input.vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type { DataListControlSize, DataListInputProps, DataListSearchUi } from '../../types'

const props = withDefaults(
  defineProps<{
    placeholder: string
    loading?: boolean
    size: DataListControlSize
    ui?: DataListSearchUi
    inputProps?: DataListInputProps
    /** Milliseconds of typing inactivity before the query is applied. */
    debounce?: number
  }>(),
  { debounce: 300 },
)
const model = defineModel<string>({ required: true })
const { t } = useUiToolsLocale()
const localValue = ref<string>(model.value)
const input = ref<{ inputRef?: HTMLInputElement | null } | null>(null)
let pending: ReturnType<typeof setTimeout> | undefined

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

function cancelPending() {
  clearTimeout(pending)
  pending = undefined
}

function commitValue() {
  cancelPending()
  if (localValue.value === model.value) {
    return
  }
  model.value = localValue.value
}

function updateValue(value: unknown) {
  localValue.value = String(value ?? '')
  cancelPending()
  pending = setTimeout(commitValue, props.debounce)
}

function clear() {
  cancelPending()
  localValue.value = ''
  model.value = ''
  input.value?.inputRef?.focus()
}

onBeforeUnmount(cancelPending)
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
    @update:model-value="updateValue"
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
