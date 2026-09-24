<script setup lang="ts">
import UBadge from '@nuxt/ui/components/Badge.vue'
import UButton from '@nuxt/ui/components/Button.vue'
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
const dirty = computed(() => page.dirtyCheck.value && props.section.dirty)

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
    :class="
      mergeFormUiClass(
        'flex min-w-0 scroll-mt-[calc(var(--nut-form-page-header,0px)+var(--nut-form-page-gap,24px))] flex-col gap-[18px] rounded-xl border border-default bg-default px-5 pt-5 pb-6 transition-[border-color,box-shadow] duration-200 @3xl/form-page:px-6 @3xl/form-page:pt-[22px] data-[dirty]:border-primary data-[dirty]:ring-4 data-[dirty]:ring-primary/20',
        pageUi?.section,
      )
    "
  >
    <header
      :class="
        mergeFormUiClass('flex flex-wrap items-center gap-x-3 gap-y-1', pageUi?.sectionHeader)
      "
    >
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
        :class="mergeFormUiClass('m-0 text-[13px] text-muted', pageUi?.sectionDescription)"
      >
        {{ section.description }}
      </p>
      <UBadge
        v-if="section.optional"
        color="neutral"
        variant="soft"
        :label="t('form.page.optional')"
        :class="mergeFormUiClass('capitalize', pageUi?.sectionOptional)"
      />
      <div
        v-if="dirty || $slots.actions"
        :class="mergeFormUiClass('ms-auto flex items-center gap-2', pageUi?.sectionActions)"
      >
        <slot name="actions" :section />
        <UButton
          v-if="dirty"
          type="button"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-rotate-ccw"
          :label="t('form.page.resetSection')"
          :class="pageUi?.sectionReset"
          data-form-page-reset
          @click="page.resetSection(section.key)"
        />
      </div>
    </header>
    <div :class="mergeFormUiClass('min-w-0', pageUi?.sectionBody)" :style="grid.style.value">
      <FormFieldRenderer
        v-for="field in entry.section.fields"
        :key="field.key"
        :field="field"
        :parent-path="[]"
      />
    </div>
  </section>
</template>
