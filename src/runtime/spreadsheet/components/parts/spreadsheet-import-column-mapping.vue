<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, shallowRef, watch, watchEffect } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useSpreadsheetImporter } from '../../composables/use-spreadsheet-import-context'
import type { SpreadsheetFieldState, SpreadsheetHeaderCell, SpreadsheetImporter } from '../../types'
import SpreadsheetImportColumnRow from '../internal/spreadsheet-import-column-row.vue'

const props = withDefaults(
  defineProps<{
    importer?: SpreadsheetImporter
    /** `missing`: only fields without a column; renders nothing when every field has one. */
    only?: 'missing'
    /** Missing fields first, the others folded. Defaults to `true`. */
    groupByStatus?: boolean
    /** Offers a column whose values fit a missing field. Defaults to `true`. */
    suggestions?: boolean
  }>(),
  { groupByStatus: true, only: undefined, suggestions: true },
)
defineSlots<{
  default?: (props: {
    fields: readonly SpreadsheetFieldState[]
    headers: readonly SpreadsheetHeaderCell[]
    assign: (field: string, header: number) => void
    ignore: (field: string) => void
    reset: (field: string) => void
  }) => unknown
  field?: (props: { field: SpreadsheetFieldState }) => unknown
}>()
const importer = useSpreadsheetImporter(() => props.importer)
const { t } = useUiToolsLocale()
const open = shallowRef<boolean>(false)

const fields = computed(() => importer.value.columns.fields.filter((field) => !field.from))
// Fields missing when the list first rendered stay on top while they get fixed.
const attentionPaths = shallowRef<ReadonlySet<string>>(new Set())
watch(
  () => importer.value.columns.headers,
  () => {
    attentionPaths.value = new Set()
  },
)
watchEffect(() => {
  if (!importer.value.file.loaded) return
  const missing = fields.value.filter(
    (field) => field.status === 'missing' && !attentionPaths.value.has(field.path),
  )
  if (missing.length)
    attentionPaths.value = new Set([...attentionPaths.value, ...missing.map((field) => field.path)])
})
const attention = computed(() =>
  fields.value.filter(
    (field) => attentionPaths.value.has(field.path) || field.status === 'missing',
  ),
)
const others = computed(() => fields.value.filter((field) => !attention.value.includes(field)))
const sections = computed(() => {
  const list: { key: string; label: string; fields: SpreadsheetFieldState[] }[] = []
  for (const field of others.value) {
    const key = field.group?.path ?? ''
    const section = list.find((entry) => entry.key === key)
    if (section) section.fields.push(field)
    else list.push({ fields: [field], key, label: field.group?.label ?? '' })
  }
  return list.sort((left, right) => (left.key ? 1 : 0) - (right.key ? 1 : 0))
})
const unused = computed(() => importer.value.columns.unusedHeaders.map((header) => header.text))
const visible = computed(
  () =>
    importer.value.file.loaded &&
    (props.only === 'missing' ? attention.value.length > 0 : fields.value.length > 0),
)

function assign(field: string, header: number) {
  importer.value.columns.assign(field, header)
}

function ignore(field: string) {
  importer.value.columns.ignore(field)
}

function reset(field: string) {
  importer.value.columns.reset(field)
}
</script>

<template>
  <div v-if="visible" data-spreadsheet-column-mapping class="grid gap-4">
    <slot
      :fields="fields"
      :headers="importer.columns.headers"
      :assign="assign"
      :ignore="ignore"
      :reset="reset"
    >
      <div
        v-if="attention.length || !groupByStatus"
        class="divide-y divide-default overflow-hidden rounded-xl border border-default bg-default"
      >
        <template v-for="field in groupByStatus ? attention : fields" :key="field.path">
          <slot name="field" :field="field">
            <SpreadsheetImportColumnRow
              :field="field"
              :headers="importer.columns.headers"
              :suggestions="suggestions"
              @assign="(header) => assign(field.path, header)"
              @ignore="ignore(field.path)"
              @reset="reset(field.path)"
            />
          </slot>
        </template>
      </div>
      <div
        v-else-if="only !== 'missing'"
        class="flex items-center gap-3 rounded-xl border border-default bg-default px-4 py-3.5"
      >
        <span
          class="grid size-8 shrink-0 place-items-center rounded-full bg-success/10 text-success"
        >
          <UIcon name="i-lucide-check" class="size-4" />
        </span>
        <span class="font-medium text-highlighted">{{ t('spreadsheet.columns.allFound') }}</span>
      </div>

      <div
        v-if="groupByStatus && only !== 'missing' && others.length"
        class="overflow-hidden rounded-xl border border-default bg-default"
      >
        <button
          type="button"
          class="flex w-full items-center gap-2 px-4 py-3 text-start text-sm font-medium text-toned hover:bg-elevated/60"
          :aria-expanded="open"
          @click="open = !open"
        >
          <UIcon
            name="i-lucide-chevron-right"
            class="size-4 text-dimmed transition-transform"
            :class="open ? 'rotate-90' : ''"
          />
          {{
            t('spreadsheet.columns.found', {
              count: others.filter((field) => field.status === 'matched').length,
            })
          }}
        </button>
        <div v-if="open" class="border-t border-default">
          <template v-for="section in sections" :key="section.key">
            <div
              v-if="section.label"
              class="border-b border-default bg-elevated/50 px-4 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-dimmed uppercase"
            >
              {{ section.label }}
            </div>
            <div class="divide-y divide-default border-b border-default last:border-b-0">
              <template v-for="field in section.fields" :key="field.path">
                <slot name="field" :field="field">
                  <SpreadsheetImportColumnRow
                    :field="field"
                    :headers="importer.columns.headers"
                    :suggestions="suggestions"
                    @assign="(header) => assign(field.path, header)"
                    @ignore="ignore(field.path)"
                    @reset="reset(field.path)"
                  />
                </slot>
              </template>
            </div>
          </template>
        </div>
      </div>

      <p v-if="only !== 'missing' && unused.length" class="text-sm text-muted">
        {{ t('spreadsheet.columns.unused', { columns: unused.join(', ') }) }}
      </p>
    </slot>
  </div>
</template>
