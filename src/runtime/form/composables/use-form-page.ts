import { computed, inject, provide, ref } from 'vue'
import type { InjectionKey } from 'vue'

import type { FormPageSectionState } from '../types'
import { getSchemaDirtyCheck } from '../utils/controls'
import {
  getFormPageNavigationTitle,
  getFormPageSections,
  isFormPageSectionVisible,
  resolveFormPageSectionState,
} from '../utils/page'
import { cloneFormValue } from '../utils/path'
import { useFormPageScroll } from './use-form-page-scroll'
import type { useFormRoot } from './use-form-root'

/**
 * State shared by a form page and its parts: the visible sections and where each stands, the
 * section in view, the navigation summary, and the actions a part can take on a section.
 */
export function useFormPage(params: {
  root: ReturnType<typeof useFormRoot>
  /** The page element, where the lookup of the scroll container starts. */
  element: () => HTMLElement | null
  hash: () => boolean
}) {
  const { root } = params
  const { runtime } = root
  const entries = computed(() =>
    getFormPageSections(root.schema.value).filter((entry) =>
      isFormPageSectionVisible(entry, runtime),
    ),
  )
  const requiredEnforced = computed(
    () => root.validationMode.value === true || root.validationMode.value === 'required',
  )
  /** Each visible section with where it stands. */
  const items = computed(() =>
    entries.value.map((entry, index) => ({
      entry,
      section: resolveFormPageSectionState({
        entry,
        index,
        input: root.input.value,
        requiredEnforced: requiredEnforced.value,
        runtime,
      }),
    })),
  )
  const sections = computed<readonly FormPageSectionState[]>(() =>
    items.value.map((item) => item.section),
  )
  /** Rings modified sections and marks them in the navigation, from `controls.dirtyCheck`. */
  const dirtyCheck = computed(() => getSchemaDirtyCheck(root.schema.value))
  const navigationTitle = computed(() => getFormPageNavigationTitle(root.schema.value))
  /** Sections that still need something before the form can be submitted. */
  const remaining = computed(
    () =>
      sections.value.filter((section) => !section.optional && section.status !== 'complete').length,
  )
  const modified = computed(() => sections.value.filter((section) => section.dirty).length)
  /** Height of the pinned header, which sections scroll under. */
  const stickyOffset = ref<number>(0)
  const scroll = useFormPageScroll({ hash: params.hash, root: params.element, sections })

  /** Puts the section's modified values back to the baseline and clears their errors. */
  async function resetSection(key: string) {
    const section = sections.value.find((candidate) => candidate.key === key)
    if (!section) {
      return
    }
    for (const path of section.dirtyPaths) {
      runtime.setValue(path, cloneFormValue(runtime.getInitialValue(path)))
      runtime.clearError(path)
    }
    await runtime.settleEffects()
  }

  return {
    active: scroll.active,
    cancel: root.cancel,
    dirtyCheck,
    items,
    modified,
    navigationTitle,
    register: scroll.register,
    remaining,
    resetSection,
    root,
    scrollTo: scroll.scrollTo,
    sections,
    stickyOffset,
  }
}

const formPageKey: InjectionKey<ReturnType<typeof useFormPage>> = Symbol('nuxt-ui-tools-form-page')

export function provideFormPage(page: ReturnType<typeof useFormPage>) {
  provide(formPageKey, page)
  return page
}

/** The page a part renders in. Parts only work inside `FormPage`. */
export function useFormPageContext() {
  const page = inject(formPageKey, null)
  if (!page) {
    throw new Error('Form page parts must be rendered inside <FormPage>.')
  }
  return page
}
