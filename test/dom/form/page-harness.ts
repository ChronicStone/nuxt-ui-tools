import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import type { VNodeChild } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import FormPage from '#ui-tools/form/components/page/form-page.vue'
import FormProvider from '#ui-tools/form/components/provider/form-provider.vue'
import { useForm } from '#ui-tools/form/composables/use-form'
import type { FormController, FormObject, FormSubmitHandler, FormValue } from '#ui-tools/form/types'

import { setAppConfig, setBreakpoint } from '../nuxt-state'

export interface PageHarness {
  wrapper: VueWrapper
  form: FormController<unknown, FormValue>
  submitted: FormObject[]
  flush: () => Promise<void>
  section: (key: string) => HTMLElement
  entry: (key: string) => HTMLElement
  setValue: (path: string, value: string) => Promise<void>
  summary: () => string
}

let mounted: VueWrapper | undefined

export async function flush() {
  for (let round = 0; round < 3; round += 1) {
    // oxlint-disable-next-line no-await-in-loop -- settling rounds must run sequentially
    await nextTick()
    // oxlint-disable-next-line no-await-in-loop -- settling rounds must run sequentially
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0)
    })
  }
}

/** Mounts a `FormPage` for `schema`, in a box of the given `style` when set. */
export async function mountPage(options: {
  schema: FormValue
  input?: FormObject
  onSubmit?: FormSubmitHandler<FormObject, FormValue>
  layout?: () => VNodeChild
  style?: string
}): Promise<PageHarness> {
  setBreakpoint('xl')
  setAppConfig({})
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ component: { render: () => h('div') }, path: '/' }],
  })
  await router.push('/')
  await router.isReady()
  const submitted: FormObject[] = []
  let form: FormController<unknown, FormValue> | undefined
  const Page = defineComponent({
    setup() {
      const controller = useForm({
        input: options.input,
        onSubmit: options.onSubmit,
        schema: options.schema,
      })
      form = controller
      return () => {
        const page = h(
          FormPage,
          { form: controller, onSubmit: (value: FormObject) => submitted.push(value) },
          options.layout ? { default: options.layout } : undefined,
        )
        return options.style ? h('div', { style: options.style }, [page]) : page
      }
    },
  })
  const wrapper = mount(
    defineComponent({ setup: () => () => h(FormProvider, null, { default: () => h(Page) }) }),
    {
      attachTo: document.body,
      global: {
        plugins: [router, [VueQueryPlugin, { queryClient: new QueryClient() }]],
        stubs: { Transition: true, TransitionGroup: true },
      },
    },
  )
  mounted = wrapper

  const root: Element = wrapper.element

  function find(selector: string) {
    const element = root.querySelector<HTMLElement>(selector)
    if (!element) {
      throw new Error(`${selector} is not rendered`)
    }
    return element
  }

  await flush()
  if (!form) {
    throw new Error('The page did not mount')
  }
  return {
    entry: (key) => find(`[data-form-page-navigation] a[href="#${key}"]`),
    flush,
    form,
    async setValue(path, value) {
      await wrapper.find(`[data-form-field="${path}"] input`).setValue(value)
      await flush()
    },
    section: (key) => find(`[data-form-page-section="${key}"]`),
    submitted,
    summary: () =>
      find('[data-form-page-summary]').textContent?.replaceAll(/\s+/gu, ' ').trim() ?? '',
    wrapper,
  }
}

/** Unmounts the page and clears the hash it may have written. */
export function unmountPage() {
  mounted?.unmount()
  mounted = undefined
  window.history.replaceState(null, '', '/')
}
