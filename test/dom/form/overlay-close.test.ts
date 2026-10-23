import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { defineFormSchema } from '#ui-tools/form'
import FormProvider from '#ui-tools/form/components/provider/form-provider.vue'
import { useFormApi } from '#ui-tools/form/composables/use-form-api'
import type {
  FormApiController,
  FormConfirmHandler,
  FormControlsConfig,
} from '#ui-tools/form/types'

import { mountForm } from './harness'

async function settle() {
  for (let round = 0; round < 4; round += 1) {
    // oxlint-disable-next-line no-await-in-loop -- settling rounds must run sequentially
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0)
    })
  }
}

async function mountOverlayHost(confirm: FormConfirmHandler) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ component: { render: () => h('div') }, path: '/' }],
  })
  await router.push('/')
  const captured: { api?: FormApiController } = {}
  const Probe = defineComponent({
    setup() {
      captured.api = useFormApi()
      return () => h('p', 'probe')
    },
  })
  const wrapper = mount(() => h(FormProvider, { confirm }, { default: () => h(Probe) }), {
    attachTo: document.body,
    global: {
      plugins: [router, [VueQueryPlugin, { queryClient: new QueryClient() }]],
      stubs: { Transition: true, TransitionGroup: true },
    },
  })
  const { api } = captured
  if (!api) {
    throw new Error('Form provider did not mount')
  }
  return { api, wrapper }
}

function schema(controls?: FormControlsConfig) {
  return defineFormSchema({
    actions: [{ key: 'cancel', label: 'Cancel' }],
    controls,
    fields: [{ key: 'name', label: 'Name', type: 'text' }],
  })
}

async function openModal(confirm: FormConfirmHandler, controls?: FormControlsConfig) {
  const host = await mountOverlayHost(confirm)
  const result = host.api.createForm(schema(controls), { id: 'edit', mode: 'modal' })
  await settle()
  const modal = host.wrapper.findComponent({ name: 'UModal' })
  return {
    ...host,
    dismiss: async () => {
      modal.vm.$emit('update:open', false)
      await settle()
    },
    finish: async () => {
      modal.vm.$emit('after:leave')
      return await result
    },
    isOpen: () => modal.props('open') !== false,
    type: async (value: string) => {
      await host.wrapper.find('[data-form-field="name"] input').setValue(value)
      await settle()
    },
  }
}

describe('overlay forms with unsaved changes', () => {
  it('asks before Escape or an outside click closes a modified modal, and stays open when refused', async () => {
    const confirm = vi.fn(async () => false)
    const overlay = await openModal(confirm)

    await overlay.type('Typed name')
    await overlay.dismiss()

    expect(confirm).toHaveBeenCalledExactlyOnceWith({
      kind: 'unsaved-changes',
      message: expect.any(String),
    })
    expect(overlay.isOpen()).toBe(true)
    expect(overlay.wrapper.find('[data-form-field="name"] input').element).toHaveProperty(
      'value',
      'Typed name',
    )

    confirm.mockResolvedValue(true)
    await overlay.dismiss()
    expect(overlay.isOpen()).toBe(false)
    await expect(overlay.finish()).resolves.toMatchObject({
      formData: { name: 'Typed name' },
      isCompleted: false,
    })
    overlay.wrapper.unmount()
  })

  it('asks before the close button and the Cancel action discard the changes', async () => {
    const confirm = vi.fn(async () => false)
    const overlay = await openModal(confirm)

    await overlay.type('Typed name')
    const buttons = overlay.wrapper.findAll('button')
    await buttons
      .find((button) => button.attributes('aria-label') === 'Fermer le formulaire')
      ?.trigger('click')
    await settle()
    await buttons.find((button) => button.text().trim() === 'Cancel')?.trigger('click')
    await settle()

    expect(confirm).toHaveBeenCalledTimes(2)
    expect(overlay.isOpen()).toBe(true)
    overlay.wrapper.unmount()
  })

  it('closes a form that was never edited at once', async () => {
    const confirm = vi.fn(async () => false)
    const overlay = await openModal(confirm)

    await overlay.dismiss()

    expect(confirm).not.toHaveBeenCalled()
    expect(overlay.isOpen()).toBe(false)
    overlay.wrapper.unmount()
  })

  it('closes a modified form at once when the schema opts out', async () => {
    const confirm = vi.fn(async () => false)
    const overlay = await openModal(confirm, { confirmNavOnDirty: false })

    await overlay.type('Typed name')
    await overlay.dismiss()

    expect(confirm).not.toHaveBeenCalled()
    expect(overlay.isOpen()).toBe(false)
    overlay.wrapper.unmount()
  })

  it('keeps inline forms closing without a question unless the schema asks', async () => {
    const confirm = vi.fn(async () => false)
    const harness = await mountForm({ confirm, schema: schema() })

    await harness.setInput('name', 'Typed name')
    await harness.button('Cancel').trigger('click')
    await harness.until(() => harness.cancelled.length === 1)

    expect(confirm).not.toHaveBeenCalled()
    harness.unmount()
  })
})

describe('form action api.close', () => {
  it('cancels the form the way its Cancel action does', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        actions: [{ action: ({ api }) => api.close(), key: 'close', label: 'Close' }],
        fields: [{ key: 'name', label: 'Name', type: 'text' }],
      }),
    })

    await harness.button('Close').trigger('click')
    await harness.until(() => harness.cancelled.length === 1)

    expect(harness.cancelled).toStrictEqual([{ name: null }])
    harness.unmount()
  })

  it('closes an overlay form after confirming its unsaved changes', async () => {
    const confirm = vi.fn(async () => true)
    const host = await mountOverlayHost(confirm)
    const result = host.api.createForm(
      defineFormSchema({
        actions: [{ action: ({ api }) => api.close(), key: 'close', label: 'Close' }],
        fields: [{ key: 'name', label: 'Name', type: 'text' }],
      }),
      { mode: 'drawer' },
    )
    await settle()

    await host.wrapper.find('[data-form-field="name"] input').setValue('Typed name')
    await settle()
    await host.wrapper
      .findAll('button')
      .find((button) => button.text().trim() === 'Close')
      ?.trigger('click')
    await settle()

    expect(confirm).toHaveBeenCalledOnce()
    const drawer = host.wrapper.findComponent({ name: 'UDrawer' })
    expect(drawer.props('open')).toBe(false)
    drawer.vm.$emit('animation-end', false)
    await expect(result).resolves.toMatchObject({ isCompleted: false })
    host.wrapper.unmount()
  })
})
