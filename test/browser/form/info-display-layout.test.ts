import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'

import { defineFormSchema } from '#ui-tools/form'

import { mountForm } from '../../dom/form/harness'
import type { FormHarness } from '../../dom/form/harness'
import { must } from '../../helpers/must'
import { settle } from '../dashboard/layout'

let harness: FormHarness | null = null

afterEach(() => {
  harness?.unmount()
  harness = null
})

const schema = defineFormSchema({
  fields: [
    { default: 'TOEIC Listening & Reading', key: 'test', label: 'Test', type: 'text' },
    { default: '30', key: 'seats', label: 'Candidates', type: 'text' },
    {
      dependencies: ['seats'],
      display: 'breakdown',
      key: 'quote',
      layout: { span: 1 },
      props: ({ deps }) => ({
        lines: [
          {
            detail: `${deps.get<string>('seats')} × €96.00`,
            label: 'Licences for the autumn campaign',
            value: '€2,880.00',
          },
          { detail: '10 %', label: 'Volume discount', tone: 'success', value: '−€288.00' },
        ],
        total: { label: 'Total including VAT', value: '€3,110.40' },
      }),
      type: 'info',
    },
    {
      display: 'meter',
      key: 'credits',
      layout: { span: 1 },
      props: { label: 'Contract credits', max: 120, value: 114 },
      type: 'info',
    },
    {
      display: 'facts',
      key: 'facts',
      props: {
        items: [
          { label: 'Reference', value: 'CT-2026-0148' },
          { label: 'Owner', value: 'Camille Laurent' },
          { label: 'Centres', value: 4 },
          { label: 'Company ID', value: '552 100 554 00025' },
        ],
        layout: 'grid',
      },
      type: 'info',
    },
    {
      display: 'code',
      hint: 'Read only',
      key: 'webLink',
      label: 'Web link',
      layout: { span: 1 },
      props: {
        value: 'https://example.com/documents/2026/very-long-signed-address',
        variant: 'value',
      },
      type: 'info',
    },
  ],
  layout: { columns: '1 md:2', fieldSpan: 1, gap: 16 },
})

async function mountAt(width: number) {
  await page.viewport(width, 900)
  harness = await mountForm({ breakpoint: width < 768 ? 'sm' : 'xl', schema })
  await settle()
  return harness
}

function box(path: string) {
  return must(
    document.querySelector<HTMLElement>(`[data-form-field="${path}"]`),
  ).getBoundingClientRect()
}

function block(path: string) {
  return must(document.querySelector<HTMLElement>(`[data-form-field="${path}"] [data-display]`))
}

function fitsItsField(path: string) {
  const field = box(path)
  const element = block(path)
  const rect = element.getBoundingClientRect()
  return (
    rect.left >= field.left - 0.5 &&
    rect.right <= field.right + 0.5 &&
    element.scrollWidth <= element.clientWidth + 1
  )
}

describe('info field display blocks in a form', () => {
  it('sets display fields side by side in the grid at 1440 px', async () => {
    await mountAt(1440)
    const quote = box('quote')
    const credits = box('credits')
    expect(Math.abs(quote.top - credits.top)).toBeLessThan(1)
    expect(credits.left).toBeGreaterThan(quote.right)
    expect(box('facts').width).toBeGreaterThan(quote.width * 1.8)

    const factValues = [...block('facts').querySelectorAll<HTMLElement>('[data-display-value]')]
    expect(
      Math.abs(
        must(factValues[0]).getBoundingClientRect().top -
          must(factValues[1]).getBoundingClientRect().top,
      ),
    ).toBeLessThan(1)

    const label = must(
      document.querySelector<HTMLElement>(
        '[data-form-field="webLink"] label, [data-form-field="webLink"] [data-ui="UFormField"]',
      ),
    )
    expect(label.textContent).toContain('Web link')
    expect(block('webLink').getBoundingClientRect().top).toBeGreaterThan(box('webLink').top)
    for (const path of ['quote', 'credits', 'facts', 'webLink'])
      expect(fitsItsField(path)).toBe(true)
  })

  it('stacks display fields and keeps every block inside its field at 390 px', async () => {
    await mountAt(390)
    const quote = box('quote')
    const credits = box('credits')
    expect(credits.top).toBeGreaterThanOrEqual(quote.bottom)
    expect(Math.abs(quote.left - credits.left)).toBeLessThan(1)
    for (const path of ['quote', 'credits', 'facts', 'webLink'])
      expect(fitsItsField(path)).toBe(true)

    // A long label wraps rather than running under its value.
    const values = [...block('quote').querySelectorAll<HTMLElement>('.whitespace-nowrap')]
    expect(values.length).toBeGreaterThanOrEqual(3)
    for (const value of values)
      expect(value.getBoundingClientRect().right).toBeLessThanOrEqual(quote.right + 0.5)
  })
})
