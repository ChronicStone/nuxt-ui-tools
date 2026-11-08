import { afterEach, describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'

import { mountForm } from './harness'
import type { FormHarness } from './harness'

let harness: FormHarness | undefined

afterEach(() => {
  harness?.unmount()
  harness = undefined
})

const options = [
  { label: 'Paris', value: 'paris' },
  { label: 'Lyon', value: 'lyon' },
]

async function mountSelect(field: { label?: string; placeholder?: string }) {
  harness = await mountForm({
    schema: defineFormSchema({
      actions: [],
      fields: [{ key: 'city', options, type: 'select', ...field }],
    }),
  })
  return harness
}

/** The select control: the element Nuxt UI draws the trigger button in. */
function control(current: FormHarness) {
  return current.field('city').find('[data-ui="USelectMenu"]')
}

describe('select accessible name', () => {
  it('points the trigger at the field label instead of leaving the generic name', async () => {
    const current = await mountSelect({ label: 'Ville' })
    const labelledby = control(current).attributes('aria-labelledby')
    const label = labelledby ? current.wrapper.element.querySelector(`[id="${labelledby}"]`) : null

    expect(label?.textContent?.trim()).toBe('Ville')
    expect(label?.closest('label')).not.toBeNull()
    expect(control(current).attributes('aria-label')).toBeUndefined()
  })

  it('names a field without a label from its placeholder, then its key', async () => {
    const withPlaceholder = await mountSelect({ placeholder: 'Choisir une ville' })
    expect(control(withPlaceholder).attributes('aria-label')).toBe('Choisir une ville')
    expect(control(withPlaceholder).attributes('aria-labelledby')).toBeUndefined()
    withPlaceholder.unmount()

    const bare = await mountSelect({})
    expect(control(bare).attributes('aria-label')).toBe('city')
    expect(control(bare).attributes('aria-labelledby')).toBeUndefined()
  })
})
