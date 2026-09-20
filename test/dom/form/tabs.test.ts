import { describe, expect, it, vi } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { mountForm } from './harness'
import type { FormHarness } from './harness'

function activeTab(harness: FormHarness) {
  return harness.wrapper.find('[data-form-tab]').attributes('data-form-tab')
}

function schema() {
  return defineFormSchema({
    fields: [
      {
        key: 'product',
        tabs: [
          {
            fields: [{ key: 'name', label: 'Nom', required: true, type: 'text' }],
            key: 'general',
            label: 'Général',
          },
          {
            fields: [{ key: 'price', label: 'Prix', required: true, type: 'number' }],
            key: 'pricing',
            label: 'Versions & tarifs',
          },
        ],
        type: 'tabs',
      },
    ],
  })
}

describe('tabs container', () => {
  it('renders the first tab, switches on click, and keeps every tab field in the output', async () => {
    const onSubmit = vi.fn<() => boolean>(() => true)
    const harness = await mountForm({
      input: { name: 'TOEIC', price: 129 },
      onSubmit,
      schema: schema(),
    })

    expect(activeTab(harness)).toBe('general')
    expect(harness.field('name').exists()).toBeTruthy()
    await harness.wrapper.find('[data-ui-tab="pricing"]').trigger('click')
    await harness.flush()
    expect(activeTab(harness)).toBe('pricing')

    await harness.submit()
    await harness.until(() => onSubmit.mock.calls.length === 1)
    expect(harness.output()).toStrictEqual({ name: 'TOEIC', price: 129 })
    harness.unmount()
  })

  it('reveals the tab that holds the first invalid field on submit', async () => {
    const onSubmit = vi.fn<() => boolean>(() => true)
    const harness = await mountForm({ input: { name: 'TOEIC' }, onSubmit, schema: schema() })

    expect(activeTab(harness)).toBe('general')
    await harness.submit()
    expect(onSubmit).not.toHaveBeenCalled()
    await harness.until(() => activeTab(harness) === 'pricing')
    expect(harness.field('price').exists()).toBeTruthy()
    harness.unmount()
  })
})
