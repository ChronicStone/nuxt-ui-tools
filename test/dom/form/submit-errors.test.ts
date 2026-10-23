import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, onErrorCaptured, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { defineFormPageSchema, defineFormSchema } from '#ui-tools/form'
import FormPage from '#ui-tools/form/components/page/form-page.vue'
import FormProvider from '#ui-tools/form/components/provider/form-provider.vue'
import Form from '#ui-tools/form/components/root/form.vue'
import { useForm } from '#ui-tools/form/composables/use-form'
import type { FormController, FormValue } from '#ui-tools/form/types'

import { setAppConfig, setBreakpoint } from '../nuxt-state'

const pageSchema = defineFormPageSchema({
  header: { title: 'Facture' },
  sections: [
    {
      fields: [{ key: 'reference', label: 'Référence', type: 'text' }],
      key: 'main',
      label: 'Facture',
    },
  ],
})
const inlineSchema = defineFormSchema({
  fields: [{ key: 'reference', label: 'Référence', type: 'text' }],
})

/** Mounts a form under an error boundary, the way a Nuxt page sits in `NuxtErrorBoundary`. */
async function mountUnderBoundary(mode: 'page' | 'inline', onSubmit: () => Promise<never>) {
  setBreakpoint('xl')
  setAppConfig({})
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ component: { render: () => h('div') }, path: '/' }],
  })
  await router.push('/')
  await router.isReady()
  const appErrors: FormValue[] = []
  let form: FormController<unknown, FormValue> | undefined
  const Host = defineComponent({
    setup() {
      const controller = useForm({ onSubmit, schema: mode === 'page' ? pageSchema : inlineSchema })
      form = controller
      return () =>
        mode === 'page' ? h(FormPage, { form: controller }) : h(Form, { form: controller })
    },
  })
  const Boundary = defineComponent({
    setup(_, { slots }) {
      const caught = ref<boolean>(false)
      onErrorCaptured(() => {
        caught.value = true
        return false
      })
      return () =>
        caught.value ? h('p', { 'data-testid': 'error-page' }, 'Error page') : slots.default?.()
    },
  })
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(Boundary, null, { default: () => h(FormProvider, null, { default: () => h(Host) }) }),
    }),
    {
      attachTo: document.body,
      global: {
        config: { errorHandler: (error: FormValue) => void appErrors.push(error) },
        plugins: [router, [VueQueryPlugin, { queryClient: new QueryClient() }]],
        stubs: { Transition: true, TransitionGroup: true },
      },
    },
  )
  await flushPromises()
  return { appErrors, form: () => form, wrapper }
}

describe('a submit handler that rejects', () => {
  it.each(['page', 'inline'] as const)(
    'keeps the %s form and its values, ends submitting, and reaches the app error handler',
    async (mode) => {
      const failure = new Error('Evoliz refused the invoice')
      const onSubmit = vi.fn(() => Promise.reject(failure))
      const { appErrors, form, wrapper } = await mountUnderBoundary(mode, onSubmit)

      await wrapper.find('[data-form-field="reference"] input').setValue('FAC-2026-0042')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(onSubmit).toHaveBeenCalledOnce()
      expect(wrapper.find('[data-testid="error-page"]').exists()).toBe(false)
      expect(
        wrapper.find<HTMLInputElement>('[data-form-field="reference"] input').element.value,
      ).toBe('FAC-2026-0042')
      expect(form()?.isSubmitting.value).toBe(false)
      expect(appErrors).toEqual([failure])
      wrapper.unmount()
    },
  )
})
