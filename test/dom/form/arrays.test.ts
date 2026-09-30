import { describe, expect, it, vi } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'
import { isNumber } from '#ui-tools/shared/utils/predicate'

import { must } from '../../helpers/must'
import { mountForm } from './harness'

describe('array table mutation', () => {
  it('adds, validates, submits, and removes rows while keeping virtual fields in sync', async () => {
    const onSubmit = vi.fn<() => boolean>(() => true)
    const schema = defineFormSchema({
      fields: [
        {
          addItemLabel: 'Add line',
          confirmDelete: false,
          fields: [
            { key: 'description', label: 'Description', required: true, type: 'text' },
            {
              key: 'amountInCents',
              label: 'Amount',
              transform: {
                input: (value) => (isNumber(value) ? value / 100 : null),
                output: (value) => Math.round((value ?? 0) * 100),
              },
              type: 'number',
            },
          ],
          key: 'lines',
          type: 'array-table',
          virtualFields: { position: (index) => index + 1 },
        },
      ],
    })
    const harness = await mountForm({
      input: { lines: [{ amountInCents: 1200, description: 'First line' }] },
      onSubmit,
      schema,
    })

    await harness.until(() => harness.wrapper.findAll('tbody tr').length === 1)
    expect(harness.output()).toStrictEqual({
      lines: [{ amountInCents: 1200, description: 'First line', position: 1 }],
    })

    await harness.button('Add line').trigger('click')
    await harness.until(() => harness.wrapper.findAll('tbody tr').length === 2)
    await harness.submit()
    expect(onSubmit).not.toHaveBeenCalled()
    await harness.until(() =>
      harness.form.errors.value.some((error) => error.path === 'lines.1.description'),
    )

    await harness.setInput('lines.1.description', 'Second line')
    await harness.setInput('lines.1.amountInCents', '25.5')
    await harness.submit()
    await harness.until(() => onSubmit.mock.calls.length === 1)
    expect(harness.output()).toStrictEqual({
      lines: [
        { amountInCents: 1200, description: 'First line', position: 1 },
        { amountInCents: 2550, description: 'Second line', position: 2 },
      ],
    })

    await harness.wrapper.find('tbody tr [data-icon="i-lucide-trash-2"]').trigger('click')
    await harness.until(() => harness.wrapper.findAll('tbody tr').length === 1)
    expect(harness.output()).toStrictEqual({
      lines: [{ amountInCents: 2550, description: 'Second line', position: 1 }],
    })
    harness.unmount()
  })

  it('highlights an invalid cell and moves its message to a tooltip', async () => {
    const schema = defineFormSchema({
      fields: [
        {
          fields: [{ key: 'label', label: 'Label', required: true, type: 'text' }],
          key: 'rows',
          type: 'array-table',
        },
      ],
    })
    const harness = await mountForm({ input: { rows: [{ label: '' }] }, schema })
    await harness.submit()
    await harness.until(() => harness.form.errors.value.length === 1)
    expect(harness.form.errors.value[0]?.path).toBe('rows.0.label')

    const cell = harness.wrapper.find('[data-form-cell-invalid="rows.0.label"]')
    expect(cell.exists()).toBeTruthy()
    expect(cell.classes()).toContain('relative')
    expect(cell.find('[data-ui-error]').classes()).toContain('sr-only')
    expect(harness.wrapper.find('[data-ui-tooltip-content]').text()).toBe('Ce champ est requis')
    expect(harness.wrapper.find('[data-ui="UTooltip"]').attributes('data-open')).toBeUndefined()

    await cell.find('input').trigger('focusin')
    await harness.flush()
    expect(harness.wrapper.find('[data-ui="UTooltip"]').attributes('data-open')).toBe('')
    harness.unmount()
  })

  it('sizes the actions column to the buttons a row shows', async () => {
    const rows = (draggable: boolean) =>
      defineFormSchema({
        fields: [
          {
            fields: [{ key: 'label', label: 'Label', type: 'text' }],
            key: 'rows',
            props: { draggable },
            type: 'array-table',
          },
        ],
      })
    const actionsWidth = async (draggable: boolean) => {
      const harness = await mountForm({
        input: { rows: [{ label: 'A' }] },
        schema: rows(draggable),
      })
      const header = harness.wrapper.findAll('thead th').at(-1)
      const width = header?.attributes('style')
      harness.unmount()
      return width
    }

    expect(await actionsWidth(false)).toContain('width: 38px')
    expect(await actionsWidth(true)).toContain('width: 62px')
  })

  it('mounts a cell tooltip only while the cell is invalid', async () => {
    const schema = defineFormSchema({
      fields: [
        {
          fields: [{ key: 'label', label: 'Label', required: true, type: 'text' }],
          key: 'rows',
          type: 'array-table',
        },
      ],
    })
    const harness = await mountForm({ input: { rows: [{ label: 'A' }, { label: 'B' }] }, schema })
    await harness.submit()
    await harness.flush()
    expect(harness.wrapper.findAll('[data-ui="UTooltip"]')).toHaveLength(0)
    harness.unmount()
  })
})

describe('array list items', () => {
  it('names each remove button after its item and removes the right card', async () => {
    const schema = defineFormSchema({
      fields: [
        {
          confirmDelete: false,
          fields: [{ key: 'name', label: 'Name', type: 'text' }],
          headerTemplate: (item, index) => `Center ${index + 1} · ${String(item.name)}`,
          key: 'centers',
          props: { draggable: false },
          type: 'array-list',
        },
      ],
    })
    const harness = await mountForm({
      input: { centers: [{ name: 'Lyon' }, { name: 'Paris' }] },
      schema,
    })

    const removeLabels = () =>
      harness.wrapper
        .findAll('[data-form-array-item] [data-icon="i-lucide-trash-2"]')
        .map((button) => button.attributes('aria-label'))
    await harness.until(() => removeLabels().length === 2)
    expect(removeLabels()).toStrictEqual([
      'Supprimer Center 1 · Lyon',
      'Supprimer Center 2 · Paris',
    ])

    await must(
      harness.wrapper.findAll('[data-form-array-item] [data-icon="i-lucide-trash-2"]')[0],
    ).trigger('click')
    await harness.until(() => removeLabels().length === 1)
    expect(removeLabels()).toStrictEqual(['Supprimer Center 1 · Paris'])
    expect(harness.output()).toStrictEqual({ centers: [{ name: 'Paris' }] })
    harness.unmount()
  })
})
