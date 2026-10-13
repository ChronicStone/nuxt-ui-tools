<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import { useResizeObserver } from '@vueuse/core'
import { computed, onBeforeUnmount, useTemplateRef } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { useFormPageContext } from '../../composables/use-form-page'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormValue } from '../../types'
import { getFormHeader } from '../../utils/overlay'
import { FORM_PAGE_COLUMN } from '../../utils/page-surface'
import { isRecord } from '../../utils/path'
import { resolveFormBoundaryText } from '../../utils/text'
import { mergeFormUiClass } from '../../utils/ui'
import FormPageActions from './form-page-actions.vue'

/**
 * Header of a form page: the schema `header` (eyebrow, title, description), an unsaved-changes
 * badge while a form with `controls.dirtyCheck` is modified, and the page actions. It stays
 * pinned while the page scrolls on wide layouts, and sections scroll to just below it. The badge
 * keeps its place while the form is unmodified, hidden, and does not grow its line, so the first
 * edit neither shifts the page nor resizes the pinned header. The header spans the page, but on a
 * page without a navigation its row takes the centered column of the body, so both share their
 * edges.
 */
defineSlots<{
  /** Before the heading, e.g. an avatar of the record. */
  leading?: () => unknown
  eyebrow?: () => unknown
  title?: () => unknown
  /** Replaces the description, keeping the unsaved-changes badge after it. */
  description?: () => unknown
  /** Replaces the page actions. */
  actions?: () => unknown
}>()

const page = useFormPageContext()
const formUi = useFormUi()
const { t } = useUiToolsLocale()
const pageUi = computed(() => formUi.ui.value.page?.ui)
const header = computed(() => getFormHeader(page.root.schema.value))
const eyebrow = computed(() => headerText(header.value, 'eyebrow'))
const title = computed(() => headerText(header.value, 'title'))
const description = computed(() => headerText(header.value, 'description'))
const unsaved = computed(() => page.dirtyCheck.value && page.root.runtime.isDirty.value)

/**
 * The header is a row of the heading and the actions. Beside a navigation it is the header itself;
 * without one, the header only draws the band (background, rule, pin) and a row inside it takes
 * the column of the body, with the padding that places its content on the body's content edges.
 */
const ROW =
  'flex flex-col gap-3 @3xl/form-page:flex-row @3xl/form-page:items-center @3xl/form-page:justify-between @3xl/form-page:gap-5'
const PADDING_X = 'px-4 @3xl/form-page:px-7'
const headerClass = computed(() => (page.navigationVisible.value ? `${ROW} ${PADDING_X}` : ''))
const rowClass = computed(() =>
  page.navigationVisible.value ? 'contents' : `${ROW} ${PADDING_X} ${FORM_PAGE_COLUMN}`,
)

// Sections scroll to just below the header while it is pinned.
const element = useTemplateRef<HTMLElement>('element')
useResizeObserver(element, () => {
  const node = element.value
  page.stickyOffset.value =
    node && getComputedStyle(node).position === 'sticky' ? node.offsetHeight : 0
})
onBeforeUnmount(() => {
  page.stickyOffset.value = 0
})

function headerText(config: FormValue, key: string) {
  return isRecord(config) ? resolveFormBoundaryText(config[key]) : undefined
}
</script>

<template>
  <header
    ref="element"
    :class="
      mergeFormUiClass(
        'z-10 border-b border-default bg-default py-4 @3xl/form-page:sticky @3xl/form-page:top-0 @3xl/form-page:pt-[18px] @3xl/form-page:pb-4',
        headerClass,
        pageUi?.header,
      )
    "
    data-form-page-header
  >
    <div :class="mergeFormUiClass(rowClass, pageUi?.headerRow)" data-form-page-header-row>
      <div :class="mergeFormUiClass('flex min-w-0 items-center gap-3.5', pageUi?.headerContent)">
        <slot name="leading" />
        <div :class="mergeFormUiClass('grid min-w-0 gap-1.5', pageUi?.heading)">
          <p
            v-if="eyebrow || $slots.eyebrow"
            :class="
              mergeFormUiClass(
                'text-[11px] font-semibold tracking-[0.08em] text-dimmed uppercase',
                pageUi?.eyebrow,
              )
            "
          >
            <slot name="eyebrow">{{ eyebrow }}</slot>
          </p>
          <h1
            v-if="title || $slots.title"
            :class="
              mergeFormUiClass(
                'm-0 truncate text-[22px] leading-[1.1] font-semibold tracking-[-0.025em] text-highlighted @3xl/form-page:text-[28px]',
                pageUi?.title,
              )
            "
          >
            <slot name="title">{{ title }}</slot>
          </h1>
          <div
            v-if="description || page.dirtyCheck.value || $slots.description"
            :class="
              mergeFormUiClass(
                'flex flex-wrap items-center gap-2.5 text-[13.5px] text-muted',
                pageUi?.meta,
              )
            "
          >
            <slot name="description">
              <span v-if="description">{{ description }}</span>
            </slot>
            <UBadge
              v-if="page.dirtyCheck.value"
              color="warning"
              variant="soft"
              :label="t('form.page.unsavedChanges')"
              :class="mergeFormUiClass(unsaved ? '-my-1' : '-my-1 invisible', pageUi?.unsaved)"
              :data-form-page-unsaved="unsaved ? '' : undefined"
            />
          </div>
        </div>
      </div>
      <slot name="actions">
        <FormPageActions />
      </slot>
    </div>
  </header>
</template>
