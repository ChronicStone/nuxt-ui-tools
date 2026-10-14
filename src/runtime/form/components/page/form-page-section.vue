<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, onBeforeUnmount, onMounted, useId, useTemplateRef } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { useFormGridLayout } from '../../composables/use-form-layout'
import { useFormPageContext } from '../../composables/use-form-page'
import { provideFormRuntime } from '../../composables/use-form-runtime'
import { useFormUi } from '../../composables/use-form-ui'
import type { FormPageSectionEntry, FormPageSectionState } from '../../types'
import { resolveFormLayoutConfig } from '../../utils/layout'
import { mergeFormUiClass } from '../../utils/ui'
import FormFieldRenderer from '../renderer/form-field-renderer.vue'

const props = defineProps<{
  entry: FormPageSectionEntry
  section: FormPageSectionState
}>()

defineSlots<{
  actions?: (props: { section: FormPageSectionState }) => unknown
}>()

const page = useFormPageContext()
const formUi = useFormUi()
const { t } = useUiToolsLocale()
const { runtime } = page.root
const pageUi = computed(() => formUi.ui.value.page?.ui)
const titleId = useId()
/**
 * Modified under `controls.dirtyCheck`. The reset button keeps its place while the section is
 * unmodified, hidden, and the ring is inset, so a section that becomes modified neither grows nor
 * reflows; on narrow pages the description moves under the title row, which holds the button.
 */
const dirty = computed(() => page.dirtyCheck.value && props.section.dirty)
/**
 * Where the section stands, at the end of its heading with the `page.status` UI option. An
 * optional section with nothing entered shows its "Facultatif" tag there too, so every status
 * sits in the same place.
 */
const status = computed(() => {
  if (!page.statusVisible.value) {
    return undefined
  }
  if (props.section.status === 'optional') {
    return { color: 'neutral', icon: undefined, label: t('form.page.status.optional') } as const
  }
  if (props.section.status === 'complete') {
    return {
      color: 'success',
      icon: 'i-lucide-check',
      label: t('form.page.status.complete'),
    } as const
  }
  if (props.section.status === 'invalid') {
    return {
      color: 'error',
      icon: 'i-lucide-circle-alert',
      label: t('form.page.status.invalid'),
    } as const
  }
  const { missing, required } = props.section
  return {
    color: 'neutral',
    icon: undefined,
    label: t('form.page.progress', { filled: required - missing, required }),
  } as const
})
/** On a spanned page the section takes its columns once the sections area is wide enough. */
const spanClass = computed(() =>
  page.spanned.value
    ? 'col-span-12 @3xl/form-sections:col-span-(--nut-form-page-section-span)'
    : '',
)

// The section scopes the grid its fields lay out in, the way a step does.
const layout = computed(() =>
  resolveFormLayoutConfig(runtime.currentLayout.value, props.entry.section.layout),
)
provideFormRuntime({ ...runtime, currentLayout: layout })
const grid = useFormGridLayout({ layout })

const element = useTemplateRef<HTMLElement>('element')
let unregister: (() => void) | undefined
onMounted(() => {
  if (element.value) {
    unregister = page.register(props.section.key, element.value)
  }
})
onBeforeUnmount(() => unregister?.())
</script>

<template>
  <section
    :id="section.key"
    ref="element"
    :aria-labelledby="titleId"
    :data-form-page-section="section.key"
    :data-state="section.status"
    :data-dirty="dirty || undefined"
    :style="{
      scrollMarginTop: `calc(${page.stickyOffset.value}px + var(--nut-form-page-gap, 24px))`,
      '--nut-form-page-section-span': page.spanned.value ? String(section.span) : undefined,
    }"
    :class="
      mergeFormUiClass(
        `flex min-w-0 flex-col ${spanClass} ${page.surfaceClasses.value.section}`,
        pageUi?.section,
      )
    "
  >
    <header
      :class="
        mergeFormUiClass(
          `flex flex-wrap items-center gap-x-3 gap-y-1 ${page.surfaceClasses.value.sectionHeader}`,
          pageUi?.sectionHeader,
        )
      "
    >
      <span
        v-if="section.icon"
        :class="
          mergeFormUiClass(
            'grid size-8 shrink-0 place-items-center rounded-lg bg-elevated text-muted',
            pageUi?.sectionIcon,
          )
        "
        aria-hidden="true"
        data-form-page-section-icon
      >
        <UIcon :name="section.icon" class="size-4" />
      </span>
      <h2
        :id="titleId"
        tabindex="-1"
        :class="
          mergeFormUiClass(
            'm-0 text-lg font-semibold tracking-[-0.015em] text-highlighted focus:outline-none',
            pageUi?.sectionTitle,
          )
        "
        data-form-page-section-title
      >
        {{ section.label }}
      </h2>
      <p
        v-if="section.description"
        :class="
          mergeFormUiClass(
            `m-0 text-[13px] text-muted ${page.surfaceClasses.value.sectionDescription}`,
            pageUi?.sectionDescription,
          )
        "
      >
        {{ section.description }}
      </p>
      <UBadge
        v-if="section.status === 'optional' && !status"
        color="neutral"
        variant="soft"
        :label="t('form.page.status.optional')"
        :class="pageUi?.sectionOptional"
        data-form-page-optional
      />
      <div
        v-if="status || page.dirtyCheck.value || $slots.actions"
        :class="mergeFormUiClass('ms-auto -my-1.5 flex items-center gap-2', pageUi?.sectionActions)"
      >
        <UBadge
          v-if="status"
          :color="status.color"
          variant="soft"
          :icon="status.icon"
          :label="status.label"
          :class="
            mergeFormUiClass(
              section.status === 'optional' ? pageUi?.sectionOptional : undefined,
              pageUi?.sectionStatus,
            )
          "
          :data-form-page-status="section.status"
          :data-form-page-optional="section.status === 'optional' ? '' : undefined"
        />
        <slot name="actions" :section />
        <UButton
          v-if="page.dirtyCheck.value"
          type="button"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-rotate-ccw"
          :label="t('form.page.resetSection')"
          :class="mergeFormUiClass(dirty ? undefined : 'invisible', pageUi?.sectionReset)"
          :data-form-page-reset="dirty ? '' : undefined"
          @click="page.resetSection(section.key)"
        />
      </div>
    </header>
    <div
      :class="
        mergeFormUiClass(`min-w-0 ${page.surfaceClasses.value.sectionBody}`, pageUi?.sectionBody)
      "
      :style="grid.style.value"
    >
      <FormFieldRenderer
        v-for="field in entry.section.fields"
        :key="field.key"
        :field="field"
        :parent-path="[]"
      />
    </div>
  </section>
</template>
