<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, nextTick, useId, useTemplateRef, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { useFormPageContext } from '../../composables/use-form-page'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormPageSectionState } from '../../types'
import { mergeFormUiClass } from '../../utils/ui'

/**
 * Navigation of a form page: one entry per visible section, following the section in view.
 * An entry shows whether its section is complete, invalid, or still to fill, marks optional
 * sections, and, with `controls.dirtyCheck`, a dot on modified sections. The footer sums up
 * the sections left to complete, or the modified ones with dirty checking.
 *
 * From 768px of page width it is a pinned column; below, a row of chips that scrolls sideways.
 */
defineSlots<{
  /** Replaces the heading, which comes from the schema `navigation.title`. */
  title?: () => unknown
  /** Replaces an entry. Call `select` to scroll to the section. */
  item?: (props: { section: FormPageSectionState; active: boolean; select: () => void }) => unknown
  /** Replaces the summary under the entries. */
  footer?: (props: {
    sections: readonly FormPageSectionState[]
    remaining: number
    modified: number
  }) => unknown
}>()

/** Room left beside an entry scrolled into the row of chips. */
const CHIP_ROW_INSET = 16

const page = useFormPageContext()
const formUi = useFormUi()
const { code, t } = useUiToolsLocale()
const pageUi = computed(() => formUi.ui.value.page?.ui)
const titleId = useId()
const plurals = computed(() => new Intl.PluralRules(code.value))
const summary = computed(() => {
  if (page.dirtyCheck.value) {
    const count = page.modified.value
    if (!count) {
      return { text: t('form.page.unmodified') }
    }
    return sentence(count, isOne(count) ? 'form.page.modifiedOne' : 'form.page.modifiedOther')
  }
  const count = page.remaining.value
  return count ? sentence(count, 'form.page.remaining') : { text: t('form.page.complete') }
})

function isOne(count: number) {
  return plurals.value.select(count) === 'one'
}

/** Splits a summary around its bold "{count} sections" phrase. */
function sentence(count: number, message: string) {
  const [before = '', after = ''] = t(message).split('{count}')
  const phrase = t(isOne(count) ? 'form.page.sectionsOne' : 'form.page.sectionsOther', { count })
  return { after, before, phrase }
}

function dirtyShown(section: FormPageSectionState) {
  return page.dirtyCheck.value && section.dirty
}

function statusLabel(section: FormPageSectionState) {
  const status = t(`form.page.status.${section.status}`)
  return dirtyShown(section) ? `${status}, ${t('form.page.unsavedChanges')}` : status
}

// In a row of chips, keep the entry of the section in view visible by scrolling the row only.
const list = useTemplateRef<HTMLElement>('list')
watch(
  () => page.active.value,
  async (key) => {
    await nextTick()
    const row = list.value
    if (!row || !key || row.scrollWidth <= row.clientWidth) {
      return
    }
    const entry = [...row.children].find(
      (child) => child.getAttribute('data-form-page-entry') === key,
    )
    if (!entry) {
      return
    }
    const box = row.getBoundingClientRect()
    const rect = entry.getBoundingClientRect()
    const overflow =
      rect.left < box.left ? rect.left - box.left : Math.max(0, rect.right - box.right)
    if (overflow) {
      row.scrollBy?.({ behavior: 'smooth', left: overflow + Math.sign(overflow) * CHIP_ROW_INSET })
    }
  },
)

/** Scrolls to the section, leaving modified clicks (new tab, new window) to the browser. */
function select(event: MouseEvent, key: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }
  event.preventDefault()
  page.scrollTo(key, { focus: true })
}
</script>

<template>
  <nav
    :aria-labelledby="page.navigationTitle.value || $slots.title ? titleId : undefined"
    :aria-label="page.navigationTitle.value || $slots.title ? undefined : t('form.page.navigation')"
    :class="
      mergeFormUiClass(
        'flex min-w-0 flex-col gap-3.5 @3xl/form-page:sticky @3xl/form-page:top-[calc(var(--nut-form-page-header,0px)+var(--nut-form-page-gap,24px))]',
        pageUi?.navigation,
      )
    "
    data-form-page-navigation
  >
    <div :class="mergeFormUiClass('flex min-w-0 flex-col gap-2', pageUi?.navigationGroup)">
      <p
        v-if="page.navigationTitle.value || $slots.title"
        :id="titleId"
        :class="
          mergeFormUiClass(
            'hidden px-2.5 text-[11px] font-semibold tracking-[0.08em] text-dimmed uppercase @3xl/form-page:block',
            pageUi?.navigationTitle,
          )
        "
      >
        <slot name="title">{{ page.navigationTitle.value }}</slot>
      </p>
      <ul
        ref="list"
        role="list"
        :class="
          mergeFormUiClass(
            'm-0 flex list-none gap-1.5 overflow-x-auto p-0 [scrollbar-width:none] @3xl/form-page:flex-col @3xl/form-page:gap-0.5 @3xl/form-page:overflow-visible',
            pageUi?.navigationList,
          )
        "
      >
        <li
          v-for="section in page.sections.value"
          :key="section.key"
          :data-form-page-entry="section.key"
          :class="mergeFormUiClass('shrink-0 @3xl/form-page:shrink', pageUi?.navigationEntry)"
        >
          <slot
            name="item"
            :section
            :active="section.key === page.active.value"
            :select="() => page.scrollTo(section.key, { focus: true })"
          >
            <a
              :href="`#${section.key}`"
              :aria-current="section.key === page.active.value ? 'location' : undefined"
              :data-active="section.key === page.active.value || undefined"
              :data-state="section.status"
              :data-dirty="dirtyShown(section) || undefined"
              :class="
                mergeFormUiClass(
                  'group flex h-8 min-w-0 items-center gap-2 rounded-md border border-default bg-default px-2.5 text-[12.5px] font-medium text-muted no-underline transition-colors hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-[active]:border-primary data-[active]:bg-primary/10 data-[active]:text-highlighted @3xl/form-page:h-9 @3xl/form-page:gap-2.5 @3xl/form-page:rounded-[7px] @3xl/form-page:border-transparent @3xl/form-page:bg-transparent @3xl/form-page:text-[13.5px] @3xl/form-page:hover:bg-elevated @3xl/form-page:data-[active]:border-transparent @3xl/form-page:data-[active]:bg-default @3xl/form-page:data-[active]:font-semibold @3xl/form-page:data-[active]:shadow-[inset_2px_0_0_var(--ui-primary)]',
                  pageUi?.navigationItem,
                )
              "
              @click="select($event, section.key)"
            >
              <span
                :data-state="section.status"
                aria-hidden="true"
                :class="
                  mergeFormUiClass(
                    'grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] border-accented text-[10px] leading-none font-bold group-data-[active]:border-primary data-[state=complete]:border-(--ui-text-highlighted) data-[state=complete]:bg-(--ui-text-highlighted) data-[state=complete]:text-(--ui-bg) data-[state=invalid]:border-error data-[state=invalid]:bg-error data-[state=invalid]:text-inverted group-data-[active]:data-[state=complete]:border-primary group-data-[active]:data-[state=complete]:bg-primary group-data-[active]:data-[state=complete]:text-inverted',
                    pageUi?.navigationIndicator,
                  )
                "
              >
                <UIcon
                  v-if="section.status === 'complete'"
                  name="i-lucide-check"
                  :class="mergeFormUiClass('size-2.5', pageUi?.navigationIndicatorIcon)"
                />
                <template v-else-if="section.status === 'invalid'">!</template>
                <span
                  v-else
                  :class="
                    mergeFormUiClass(
                      'hidden size-1.5 rounded-full bg-primary group-data-[active]:block',
                      pageUi?.navigationIndicatorMarker,
                    )
                  "
                />
              </span>
              <span
                :class="
                  mergeFormUiClass(
                    'whitespace-nowrap @3xl/form-page:min-w-0 @3xl/form-page:flex-1 @3xl/form-page:truncate',
                    pageUi?.navigationLabel,
                  )
                "
              >
                {{ section.label }}
              </span>
              <span class="sr-only">{{ statusLabel(section) }}</span>
              <span
                v-if="dirtyShown(section)"
                aria-hidden="true"
                :class="
                  mergeFormUiClass(
                    'size-1.5 shrink-0 rounded-full bg-primary',
                    pageUi?.navigationDirty,
                  )
                "
                data-form-page-dirty
              />
              <span
                v-else-if="section.optional && section.status !== 'complete'"
                :class="
                  mergeFormUiClass(
                    'hidden shrink-0 text-[11px] font-normal text-dimmed @3xl/form-page:inline',
                    pageUi?.navigationOptional,
                  )
                "
              >
                {{ t('form.page.optional') }}
              </span>
            </a>
          </slot>
        </li>
      </ul>
    </div>
    <div :class="mergeFormUiClass('hidden px-2.5 @3xl/form-page:block', pageUi?.navigationFooter)">
      <div
        :class="
          mergeFormUiClass(
            'border-t border-muted pt-3.5 text-[12.5px] leading-normal text-muted',
            pageUi?.navigationSummary,
          )
        "
        data-form-page-summary
      >
        <slot
          name="footer"
          :sections="page.sections.value"
          :remaining="page.remaining.value"
          :modified="page.modified.value"
        >
          <template v-if="'phrase' in summary">
            {{ summary.before
            }}<b
              :class="
                mergeFormUiClass('font-semibold text-highlighted', pageUi?.navigationSummaryCount)
              "
              >{{ summary.phrase }}</b
            >{{ summary.after }}
          </template>
          <template v-else>{{ summary.text }}</template>
        </slot>
      </div>
    </div>
  </nav>
</template>
