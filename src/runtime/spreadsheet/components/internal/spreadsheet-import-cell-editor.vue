<script setup lang="ts">
import { nextTick, onMounted, useTemplateRef } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

const props = defineProps<{
  /** Current text of the cell. */
  text: string
  /** Labels to pick from, for a select column. */
  choices?: readonly string[]
}>()
const emit = defineEmits<{ commit: [text: string, move?: 1 | -1]; cancel: [] }>()
const { t } = useUiToolsLocale()
const input = useTemplateRef<HTMLInputElement>('input')
const select = useTemplateRef<HTMLSelectElement>('select')
let done = false

onMounted(async () => {
  await nextTick()
  if (input.value) {
    input.value.focus({ preventScroll: true })
    input.value.select()
  } else select.value?.focus({ preventScroll: true })
})

function finish(text: string, move?: 1 | -1) {
  if (done) return
  done = true
  emit('commit', text.trim(), move)
}

function onKeydown(event: KeyboardEvent) {
  const target = event.target
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return
  if (event.key === 'Escape') {
    event.preventDefault()
    done = true
    emit('cancel')
  } else if (event.key === 'Enter') {
    event.preventDefault()
    finish(target.value)
  } else if (event.key === 'Tab') {
    event.preventDefault()
    finish(target.value, event.shiftKey ? -1 : 1)
  }
}

function onCommit(event: Event) {
  const target = event.target
  if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement)
    finish(target.value)
}
</script>

<template>
  <select
    v-if="choices"
    ref="select"
    class="block h-full w-full min-w-40 bg-transparent px-2.5 text-highlighted outline-none"
    @change="onCommit"
    @keydown="onKeydown"
    @blur="onCommit"
  >
    <option v-if="!choices.includes(text)" :value="text" selected>
      {{ text || t('spreadsheet.table.emptyCell') }}
    </option>
    <option v-for="choice in choices" :key="choice" :value="choice" :selected="choice === text">
      {{ choice }}
    </option>
  </select>
  <input
    v-else
    ref="input"
    :value="text"
    autocomplete="off"
    spellcheck="false"
    class="block h-full w-full min-w-40 bg-transparent px-3 text-highlighted outline-none"
    @keydown="onKeydown"
    @blur="onCommit"
  />
</template>
