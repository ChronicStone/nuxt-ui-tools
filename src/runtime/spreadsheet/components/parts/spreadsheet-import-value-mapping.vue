<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, shallowRef } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useSpreadsheetImporter } from '../../composables/use-spreadsheet-import-context'
import type {
  SpreadsheetImporter,
  SpreadsheetRecognizedValue,
  SpreadsheetValueAnswer,
  SpreadsheetValueQuestion,
  SpreadsheetValueScope,
} from '../../types'
import SpreadsheetImportValueRow from '../internal/spreadsheet-import-value-row.vue'

const props = defineProps<{
  importer?: SpreadsheetImporter
  /** `open`: only values without an answer; renders nothing when there are none. */
  only?: 'open'
  /** Hides the values found in the lists. */
  noRecognized?: boolean
}>()
defineSlots<{
  default?: (props: {
    questions: readonly SpreadsheetValueQuestion[]
    recognized: readonly SpreadsheetRecognizedValue[]
    answer: (question: SpreadsheetValueQuestion, answer: SpreadsheetValueAnswer) => void
  }) => unknown
  question?: (props: { question: SpreadsheetValueQuestion }) => unknown
}>()
const importer = useSpreadsheetImporter(() => props.importer)
const { t } = useUiToolsLocale()
const showRecognized = shallowRef<boolean>(false)

const questions = computed(() =>
  props.only === 'open' ? importer.value.values.open : importer.value.values.questions,
)
function scopeLabel(scope: SpreadsheetValueScope) {
  const conditions = scope.dependsOn
    .map((entry) =>
      t('spreadsheet.values.condition', { label: entry.label, values: entry.values.join(', ') }),
    )
    .join(' · ')
  return conditions ? t('spreadsheet.values.scope', { conditions }) : ''
}

/** Questions by field, then by set of options when the options depend on other columns. */
const groups = computed(() => {
  const list: {
    field: string
    label: string
    header: string
    scopes: { id: string; label: string; questions: SpreadsheetValueQuestion[] }[]
  }[] = []
  for (const question of questions.value) {
    let group = list.find((entry) => entry.field === question.field)
    if (!group) {
      group = {
        field: question.field,
        header: question.header,
        label: question.fieldLabel,
        scopes: [],
      }
      list.push(group)
    }
    const id = question.scope?.id ?? ''
    const scope = group.scopes.find((entry) => entry.id === id)
    if (scope) scope.questions.push(question)
    else
      group.scopes.push({
        id,
        label: question.scope ? scopeLabel(question.scope) : '',
        questions: [question],
      })
  }
  return list
})
const labels = computed(
  () => new Map(importer.value.columns.fields.map((field) => [field.path, field.label])),
)

function answer(question: SpreadsheetValueQuestion, value: SpreadsheetValueAnswer) {
  importer.value.values.answer(question, value)
}

function search(field: string) {
  return (text: string) => importer.value.values.search(field, text)
}
</script>

<template>
  <div
    v-if="importer.file.loaded && (only !== 'open' || questions.length)"
    data-spreadsheet-value-mapping
    class="grid gap-5"
  >
    <slot :questions="questions" :recognized="importer.values.recognized" :answer="answer">
      <p v-if="importer.values.loading" class="flex items-center gap-2 text-sm text-muted">
        <span
          class="size-3.5 animate-spin rounded-full border-2 border-accented border-t-primary"
        />
        {{ t('spreadsheet.values.loading') }}
      </p>
      <section v-for="group in groups" :key="group.field" class="grid gap-2">
        <div class="flex flex-wrap items-baseline gap-x-2">
          <h4 class="text-[11px] font-semibold tracking-[0.08em] text-dimmed uppercase">
            {{ group.label }}
          </h4>
          <span v-if="group.header" class="text-xs text-dimmed">· « {{ group.header }} »</span>
        </div>
        <div
          class="divide-y divide-default overflow-hidden rounded-xl border border-default bg-default"
        >
          <div
            class="hidden grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1.15fr)_6.5rem] gap-x-4 bg-elevated/50 px-4 py-2 text-[11.5px] font-medium text-muted sm:grid"
          >
            <span>{{ t('spreadsheet.values.value') }}</span>
            <span>{{ t('spreadsheet.values.rows') }}</span>
            <span>{{ t('spreadsheet.values.answer') }}</span>
            <span />
          </div>
          <template v-for="scope in group.scopes" :key="scope.id">
            <div
              v-if="scope.label"
              data-spreadsheet-value-scope
              class="flex items-center gap-2 bg-elevated/30 px-4 py-1.5 text-xs font-medium text-toned"
            >
              <UIcon name="i-lucide-split" class="size-3.5 shrink-0 text-dimmed" />
              <span class="truncate">{{ scope.label }}</span>
            </div>
            <template v-for="question in scope.questions" :key="question.id">
              <slot name="question" :question="question">
                <SpreadsheetImportValueRow
                  :question="question"
                  :choices="question.choices"
                  :search="search(question.field)"
                  @answer="(value) => answer(question, value)"
                />
              </slot>
            </template>
          </template>
        </div>
      </section>
      <div
        v-if="!groups.length && only !== 'open'"
        class="flex items-center gap-3 rounded-xl border border-default bg-default px-4 py-3.5"
      >
        <span
          class="grid size-8 shrink-0 place-items-center rounded-full bg-success/10 text-success"
        >
          <UIcon name="i-lucide-check" class="size-4" />
        </span>
        <span class="font-medium text-highlighted">{{ t('spreadsheet.values.nothing') }}</span>
      </div>
      <div
        v-if="!noRecognized && only !== 'open' && importer.values.recognized.length"
        class="overflow-hidden rounded-xl border border-default bg-default"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 py-3 text-start text-sm font-medium text-toned hover:bg-elevated/60"
          :aria-expanded="showRecognized"
          @click="showRecognized = !showRecognized"
        >
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4 text-dimmed transition-transform"
            :class="showRecognized ? 'rotate-90' : ''"
          />
          {{ t('spreadsheet.values.recognized', { count: importer.values.recognized.length }) }}
        </button>
        <ul v-if="showRecognized" class="divide-y divide-default border-t border-default">
          <li
            v-for="value in importer.values.recognized"
            :key="`${value.field}::${value.scope ?? ''}::${value.value}`"
            class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5 px-4 py-2.5 text-sm sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <span class="truncate text-xs text-dimmed">{{ labels.get(value.field) }}</span>
            <span class="truncate font-medium text-highlighted">{{ value.value }}</span>
            <span class="flex min-w-0 items-center gap-1.5 text-muted">
              <UIcon name="i-lucide-arrow-right" class="size-3.5 shrink-0 text-dimmed" />
              <span class="truncate">{{ value.option.label }}</span>
            </span>
            <span class="text-xs text-dimmed tabular-nums">{{
              t('spreadsheet.values.rowCount', { count: value.rows.length })
            }}</span>
          </li>
        </ul>
      </div>
    </slot>
  </div>
</template>
