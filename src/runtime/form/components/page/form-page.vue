<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

import { provideFormPage, useFormPage } from '../../composables/use-form-page'
import { useFormRoot } from '../../composables/use-form-root'
import type {
  FormObject,
  FormPageSectionState,
  FormRendererController,
  FormUiConfig,
  FormValue,
} from '../../types'
import { mergeFormUiClass } from '../../utils/ui'
import FormPageHeader from './form-page-header.vue'
import FormPageNavigation from './form-page-navigation.vue'
import FormPageSections from './form-page-sections.vue'

/**
 * A form laid out as a page: a header with the title and the actions, a navigation that follows
 * the section in view, and one card per section. Render a schema from `defineFormPageSchema`.
 *
 * The page scrolls on its own, so give it a height (`h-full` in a layout that sizes its main
 * area). Put parts in the default slot to compose another layout: `FormPageHeader`,
 * `FormPageNavigation`, `FormPageSections`, and `FormPageActions` read the page they render in.
 *
 * @example
 * ```vue
 * <!-- const form = useForm({ schema: accountFormSchema(), onSubmit: createAccount }) -->
 * <UiFormPage :form />
 *
 * <UiFormPage :form>
 *   <UiFormPageHeader />
 *   <div class="grid grid-cols-[minmax(0,1fr)_240px] gap-6 p-6">
 *     <UiFormPageSections />
 *     <UiFormPageNavigation />
 *   </div>
 * </UiFormPage>
 * ```
 */
const {
  form,
  hash = true,
  ui = undefined,
} = defineProps<{
  form: FormRendererController
  /**
   * Records the section picked in the navigation in the URL hash (`#identity`), and opens the
   * page on the section the hash names. Defaults to `true`.
   */
  hash?: boolean
  /** Presentation overrides, merged after the app config and the schema `ui`. */
  ui?: FormUiConfig
}>()

const emit = defineEmits<{
  submit: [value: FormObject, result: { success: boolean; data?: FormValue }]
  cancel: [value: FormObject]
}>()

defineSlots<{
  /** Replaces the whole layout with parts of the page. */
  default?: () => unknown
  /** Slots of the default header: see `FormPageHeader`. */
  'header-leading'?: () => unknown
  'header-eyebrow'?: () => unknown
  'header-title'?: () => unknown
  'header-description'?: () => unknown
  'header-actions'?: () => unknown
  /** Slots of the default navigation: see `FormPageNavigation`. */
  'navigation-title'?: () => unknown
  'navigation-item'?: (props: {
    section: FormPageSectionState
    active: boolean
    select: () => void
  }) => unknown
  'navigation-footer'?: (props: {
    sections: readonly FormPageSectionState[]
    remaining: number
    modified: number
  }) => unknown
  /** Extra buttons in a section header: see `FormPageSections`. */
  'section-actions'?: (props: { section: FormPageSectionState }) => unknown
}>()

const element = useTemplateRef<HTMLFormElement>('element')
const root = useFormRoot({
  form: () => form,
  input: () => undefined,
  onCancelled: (value) => emit('cancel', value),
  onSubmitted: (value, result) => emit('submit', value, result),
  schema: () => undefined,
  syncInput: () => undefined,
  ui: () => ui,
  validate: () => undefined,
})
const page = provideFormPage(useFormPage({ element: () => element.value, hash: () => hash, root }))
const pageUi = computed(() => root.formUi.ui.value.page?.ui)
</script>

<template>
  <form
    ref="element"
    novalidate
    :class="
      mergeFormUiClass('@container/form-page h-full min-w-0 overflow-y-auto bg-muted', pageUi?.root)
    "
    :style="{ '--nut-form-page-header': `${page.stickyOffset.value}px` }"
    data-form-page
    @submit.prevent="root.submit"
  >
    <slot>
      <FormPageHeader>
        <template v-if="$slots['header-leading']" #leading>
          <slot name="header-leading" />
        </template>
        <template v-if="$slots['header-eyebrow']" #eyebrow>
          <slot name="header-eyebrow" />
        </template>
        <template v-if="$slots['header-title']" #title>
          <slot name="header-title" />
        </template>
        <template v-if="$slots['header-description']" #description>
          <slot name="header-description" />
        </template>
        <template v-if="$slots['header-actions']" #actions>
          <slot name="header-actions" />
        </template>
      </FormPageHeader>
      <div
        :class="
          mergeFormUiClass(
            'grid gap-4 px-4 pt-4 pb-16 @3xl/form-page:grid-cols-[200px_minmax(0,1fr)] @3xl/form-page:items-start @3xl/form-page:gap-7 @3xl/form-page:px-7 @3xl/form-page:pt-6 @3xl/form-page:pb-20 @5xl/form-page:grid-cols-[230px_minmax(0,760px)]',
            pageUi?.body,
          )
        "
      >
        <FormPageNavigation>
          <template v-if="$slots['navigation-title']" #title>
            <slot name="navigation-title" />
          </template>
          <template v-if="$slots['navigation-item']" #item="slotProps">
            <slot name="navigation-item" v-bind="slotProps" />
          </template>
          <template v-if="$slots['navigation-footer']" #footer="slotProps">
            <slot name="navigation-footer" v-bind="slotProps" />
          </template>
        </FormPageNavigation>
        <FormPageSections>
          <template v-if="$slots['section-actions']" #actions="slotProps">
            <slot name="section-actions" v-bind="slotProps" />
          </template>
        </FormPageSections>
      </div>
    </slot>
  </form>
</template>
