import { describe, expect, it, vi } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { mountForm } from './harness'
import type { FormHarness } from './harness'

function expandedItems(harness: FormHarness, path: string) {
  return harness
    .field(path)
    .findAll('[data-form-array-item][data-expanded="true"]')
    .map((item) => item.attributes('data-form-array-item'))
}

function trigger(harness: FormHarness, path: string, index: number) {
  return harness.field(path).find(`[data-form-array-item="${index}"] button[aria-expanded]`)
}

function collapsedSchema() {
  return defineFormSchema({
    fields: [
      {
        actions: { addItem: false, deleteItem: false },
        fields: [{ key: 'name', label: 'Block name', required: true, type: 'text' }],
        key: 'blocks',
        summaryTemplate: (item) => String(item.name ?? '').length,
        type: 'array-collapse',
      },
    ],
  })
}

function accordionSchema() {
  return defineFormSchema({
    actions: [],
    fields: [
      {
        accordion: true,
        addItemLabel: 'Add block',
        confirmDelete: false,
        defaultExpanded: 'first',
        fields: [{ key: 'name', label: 'Block name', type: 'text' }],
        key: 'blocks',
        type: 'array-collapse',
      },
    ],
  })
}

describe('array collapse', () => {
  it('starts collapsed, shows the summary, and toggles items from the header', async () => {
    const harness = await mountForm({
      input: { blocks: [{ name: 'Ready' }, { name: '' }] },
      schema: collapsedSchema(),
    })

    expect(expandedItems(harness, 'blocks')).toStrictEqual([])
    expect(harness.field('blocks').find('[data-form-array-summary="0"]').text()).toBe('5')

    await trigger(harness, 'blocks', 0).trigger('click')
    expect(expandedItems(harness, 'blocks')).toStrictEqual(['0'])
    expect(trigger(harness, 'blocks', 0).attributes('aria-expanded')).toBe('true')
    await trigger(harness, 'blocks', 0).trigger('click')
    expect(expandedItems(harness, 'blocks')).toStrictEqual([])
    harness.unmount()
  })

  it('reveals the item that fails validation on submit', async () => {
    const onSubmit = vi.fn<() => boolean>(() => true)
    const harness = await mountForm({
      input: { blocks: [{ name: 'Ready' }, { name: '' }] },
      onSubmit,
      schema: collapsedSchema(),
    })

    await harness.submit()
    expect(onSubmit).not.toHaveBeenCalled()
    await harness.until(() => expandedItems(harness, 'blocks').includes('1'))
    expect(expandedItems(harness, 'blocks')).toStrictEqual(['1'])
    await harness.flush()
    expect(trigger(harness, 'blocks', 1).classes()).toContain('text-error')
    harness.unmount()
  })

  it('keeps a single item open in accordion mode and expands the added item', async () => {
    const harness = await mountForm({
      input: { blocks: [{ name: 'One' }, { name: 'Two' }] },
      schema: accordionSchema(),
    })

    expect(expandedItems(harness, 'blocks')).toStrictEqual(['0'])
    await trigger(harness, 'blocks', 1).trigger('click')
    expect(expandedItems(harness, 'blocks')).toStrictEqual(['1'])

    await harness.button('Add block').trigger('click')
    await harness.until(() => harness.wrapper.findAll('[data-form-array-item]').length === 3)
    expect(expandedItems(harness, 'blocks')).toStrictEqual(['2'])

    await harness.setInput('blocks.2.name', 'Three')
    expect(harness.output()).toStrictEqual({
      blocks: [{ name: 'One' }, { name: 'Two' }, { name: 'Three' }],
    })
    harness.unmount()
  })

  it('removes an item and keeps the expanded state on the remaining items', async () => {
    const harness = await mountForm({
      input: { blocks: [{ name: 'One' }, { name: 'Two' }, { name: 'Three' }] },
      schema: accordionSchema(),
    })
    await trigger(harness, 'blocks', 2).trigger('click')
    expect(expandedItems(harness, 'blocks')).toStrictEqual(['2'])

    await harness.wrapper
      .find('[data-form-array-item="0"] [data-icon="i-lucide-trash-2"]')
      .trigger('click')
    await harness.until(() => harness.wrapper.findAll('[data-form-array-item]').length === 2)
    expect(harness.output()).toStrictEqual({ blocks: [{ name: 'Two' }, { name: 'Three' }] })
    expect(expandedItems(harness, 'blocks')).toStrictEqual(['1'])
    harness.unmount()
  })
})
