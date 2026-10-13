import { describe, expect, expectTypeOf, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'
import type {
  ExtractFormOutput,
  FormChoiceCardDensity,
  FormChoiceCardOption,
  FormChoiceCardProps,
  FormText,
} from '#ui-tools/form'

import {
  choiceCardGroupAttrs,
  groupChoiceCardItems,
} from '../../src/runtime/form/fields/choice-card/utils'

interface Item {
  value: string
  group?: string
}

function summarize(items: readonly Item[]) {
  return groupChoiceCardItems(items).map((group) => ({
    heading: group.heading,
    values: group.items.map((item) => item.value),
  }))
}

describe('choice card groups', () => {
  it('keeps an ungrouped list as one headingless group', () => {
    expect(summarize([{ value: 'a' }, { value: 'b' }])).toStrictEqual([
      { heading: undefined, values: ['a', 'b'] },
    ])
  })

  it('keeps an empty list as one empty group, so an empty field still renders', () => {
    expect(summarize([])).toStrictEqual([{ heading: undefined, values: [] }])
  })

  it('orders the headings by first appearance and keeps each option order', () => {
    expect(
      summarize([
        { group: 'Partenaire', value: 'reseller' },
        { group: 'Organisation cliente', value: 'school' },
        { group: 'Partenaire', value: 'distributor' },
        { group: 'Centre de test', value: 'center' },
        { group: 'Organisation cliente', value: 'company' },
      ]),
    ).toStrictEqual([
      { heading: 'Partenaire', values: ['reseller', 'distributor'] },
      { heading: 'Organisation cliente', values: ['school', 'company'] },
      { heading: 'Centre de test', values: ['center'] },
    ])
  })

  it('places the options without a group where the first of them appears', () => {
    expect(
      summarize([
        { value: 'internal' },
        { group: 'Partenaire', value: 'reseller' },
        { value: 'support' },
      ]),
    ).toStrictEqual([
      { heading: undefined, values: ['internal', 'support'] },
      { heading: 'Partenaire', values: ['reseller'] },
    ])
  })

  it('treats a blank group like no group and ignores surrounding spaces', () => {
    expect(
      summarize([
        { group: '  ', value: 'a' },
        { group: ' Partenaire ', value: 'b' },
        { group: 'Partenaire', value: 'c' },
      ]),
    ).toStrictEqual([
      { heading: undefined, values: ['a'] },
      { heading: 'Partenaire', values: ['b', 'c'] },
    ])
  })
})

describe('choice card group attributes', () => {
  const control = { 'aria-label': 'Compte', 'data-form-field': 'rows.0.kind', id: 'v-3' }

  it('keeps the control attributes untouched on the first group', () => {
    expect(choiceCardGroupAttrs(control, 0)).toBe(control)
  })

  it('derives an id from the position for each later group and keeps every other attribute', () => {
    expect(choiceCardGroupAttrs(control, 1)).toStrictEqual({ ...control, id: 'v-3-1' })
    expect(choiceCardGroupAttrs(control, 2)).toStrictEqual({ ...control, id: 'v-3-2' })
  })

  it('does not invent an id: a group without one generates its own', () => {
    const attrs = { size: 'md' }

    expect(choiceCardGroupAttrs(attrs, 2)).toBe(attrs)
  })

  it('leaves the attributes it was given untouched', () => {
    choiceCardGroupAttrs(control, 1)

    expect(control.id).toBe('v-3')
  })
})

describe('choice card typing', () => {
  it('types the heading and icon of an option and the density of the cards', () => {
    expectTypeOf<FormChoiceCardOption['group']>().toEqualTypeOf<FormText | undefined>()
    expectTypeOf<FormChoiceCardOption['icon']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<FormChoiceCardProps['density']>().toEqualTypeOf<
      FormChoiceCardDensity | undefined
    >()
    expectTypeOf<FormChoiceCardDensity>().toEqualTypeOf<'default' | 'compact'>()
  })

  it('keeps the option values narrow when options carry headings and icons', () => {
    const schema = defineFormSchema({
      fields: [
        {
          key: 'accountType',
          options: [
            { group: 'Partenaire', icon: 'i-lucide-users', label: 'Revendeur', value: 'reseller' },
            { group: () => 'Compte interne', label: 'Support', value: 'support' },
          ],
          props: { density: 'compact', icon: 'tile' },
          type: 'radio-card',
        },
        {
          key: 'kinds',
          options: [{ group: 'Centre de test', label: 'Centre', value: 'center' }],
          type: 'checkbox-card',
        },
      ],
    })

    expectTypeOf<ExtractFormOutput<typeof schema>>().toMatchTypeOf<{
      accountType: 'reseller' | 'support' | null
      kinds: readonly 'center'[] | null
    }>()
    expect(schema.fields).toHaveLength(2)
  })
})
