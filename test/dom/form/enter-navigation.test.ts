import { describe, expect, it, vi } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { mountForm } from './harness'
import type { FormHarness } from './harness'

function focusControl(harness: FormHarness, path: string) {
  const element = harness.control(path).element
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Field "${path}" has no focusable control`)
  }
  element.focus()
  return element
}

describe('form Enter navigation', () => {
  it('focuses the next field and submits from the last field', async () => {
    const onSubmit = vi.fn()
    const harness = await mountForm({
      onSubmit,
      schema: defineFormSchema({
        fields: [
          { key: 'first', label: 'First', type: 'text' },
          { key: 'second', label: 'Second', type: 'text' },
        ],
      }),
    })

    focusControl(harness, 'first')
    await harness.control('first').trigger('keydown', { key: 'Enter' })
    await harness.until(() => document.activeElement === harness.control('second').element, 500)
    expect(onSubmit).not.toHaveBeenCalled()

    await harness.control('second').trigger('keydown', { key: 'Enter' })
    await harness.until(() => onSubmit.mock.calls.length === 1, 500)
    harness.unmount()
  })

  it('skips disabled controls and advances through a stepped form', async () => {
    const onSubmit = vi.fn()
    const harness = await mountForm({
      onSubmit,
      schema: defineFormSchema({
        steps: [
          {
            fields: [
              { key: 'first', label: 'First', type: 'text' },
              { key: 'disabled', label: 'Disabled', disabled: () => true, type: 'text' },
              { key: 'last', label: 'Last', type: 'text' },
            ],
            key: 'one',
          },
          { fields: [{ key: 'final', label: 'Final', type: 'text' }], key: 'two' },
        ],
      }),
    })

    focusControl(harness, 'first')
    await harness.control('first').trigger('keydown', { key: 'Enter' })
    expect(harness.control('disabled').attributes('disabled')).toBeDefined()
    await harness.until(() => document.activeElement === harness.control('last').element, 500)
    await harness.control('last').trigger('keydown', { key: 'Enter' })
    await harness.until(() => harness.wrapper.find('[data-form-field="final"]').exists(), 500)
    expect(onSubmit).not.toHaveBeenCalled()

    await harness.control('final').trigger('keydown', { key: 'Enter' })
    await harness.until(() => onSubmit.mock.calls.length === 1, 500)
    harness.unmount()
  })

  it('leaves multiline input and modified Enter to their native behavior', async () => {
    const onSubmit = vi.fn()
    const harness = await mountForm({
      onSubmit,
      schema: defineFormSchema({
        fields: [
          { key: 'notes', label: 'Notes', type: 'textarea' },
          { key: 'next', label: 'Next', type: 'text' },
        ],
      }),
    })

    const notes = focusControl(harness, 'notes')
    const multilineEnter = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
    })
    notes.dispatchEvent(multilineEnter)
    expect(multilineEnter.defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(notes)

    const next = focusControl(harness, 'next')
    const modifiedEnter = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      key: 'Enter',
    })
    next.dispatchEvent(modifiedEnter)
    expect(modifiedEnter.defaultPrevented).toBe(false)
    expect(onSubmit).not.toHaveBeenCalled()
    harness.unmount()
  })
})
