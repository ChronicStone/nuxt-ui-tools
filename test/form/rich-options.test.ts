import { describe, expect, expectTypeOf, it } from 'vitest'
import { h } from 'vue'

import { defineFormField, defineFormSchema } from '#ui-tools/form'
import type {
  FormAutoCompleteField,
  FormCheckboxGroupField,
  FormOption,
  FormOptionRenderContext,
  FormOptionValueRenderContext,
  FormRadioField,
  FormSelectField,
  ResolvedFormOption,
} from '#ui-tools/form'

import {
  normalizeOptionItem,
  normalizeOptionItems,
  resolveOptionDescriptionIndent,
  resolveOptionLeading,
  toMenuItems,
} from '../../src/runtime/form/utils/options'

interface Currency extends FormOption<'EUR' | 'USD'> {
  symbol: string
}

describe('rich option normalization', () => {
  it('reads the icon, avatar, chip and suffix of an option', () => {
    const option = normalizeOptionItem({
      avatar: { alt: 'Camille Durand', src: '/camille.png', text: 'CD' },
      chip: { color: 'success' },
      icon: 'i-lucide-user',
      label: 'Camille',
      suffix: 'Directrice',
      value: 'camille',
    })

    expect(option).toMatchObject({
      avatar: { alt: 'Camille Durand', src: '/camille.png', text: 'CD' },
      chip: { color: 'success' },
      icon: 'i-lucide-user',
      label: 'Camille',
      suffix: 'Directrice',
      value: 'camille',
    })
  })

  it('resolves a lazy or numeric suffix and ignores one that is not text', () => {
    const [lazy, numeric, invalid] = normalizeOptionItems([
      { suffix: () => 'EUR', value: 'a' },
      { suffix: 12, value: 'b' },
      { suffix: { not: 'text' }, value: 'c' },
    ])

    expect([lazy?.suffix, numeric?.suffix, invalid?.suffix]).toStrictEqual(['EUR', '12', undefined])
  })

  it('keeps a chip without a color, and drops a color the chip cannot draw', () => {
    const [bare, unknown, notAnObject] = normalizeOptionItems([
      { chip: {}, value: 'a' },
      { chip: { color: 'fuchsia' }, value: 'b' },
      { chip: 'success', value: 'c' },
    ])

    expect(bare?.chip).toStrictEqual({ color: undefined })
    expect(unknown?.chip).toStrictEqual({ color: undefined })
    expect(notAnObject?.chip).toBeUndefined()
  })

  it('keeps the avatar text parts that are strings only', () => {
    const [option] = normalizeOptionItems([
      { avatar: { alt: 3, src: '/a.png', text: 'A' }, value: 'a' },
    ])

    expect(option?.avatar).toStrictEqual({ alt: undefined, src: '/a.png', text: 'A' })
  })

  it('hands back the authored option untouched, custom data included', () => {
    const authored: Currency = { label: 'Euro', symbol: '€', value: 'EUR' }

    const option = normalizeOptionItem(authored)

    expect(option.item).toBe(authored)
    expect(option.item).toStrictEqual({ label: 'Euro', symbol: '€', value: 'EUR' })
  })

  it('hands back a primitive option as the primitive, and keeps the authored object under mapped keys', () => {
    expect(normalizeOptionItem('FR').item).toBe('FR')
    expect(normalizeOptionItem(2).item).toBe(2)

    const authored = { id: 7, title: 'Catalog' }
    const option = normalizeOptionItem(authored, { label: 'title', value: 'id' })

    expect(option).toMatchObject({ label: 'Catalog', value: 7 })
    expect(option.item).toBe(authored)
  })

  it('reads the new fields from the options a source returns, groups included', () => {
    const options = normalizeOptionItems(
      [{ chip: { color: 'warning' }, group: 'Statuts', label: 'En attente', value: 'pending' }],
      { group: 'group' },
    )

    expect(options[0]).toMatchObject({
      chip: { color: 'warning' },
      group: 'Statuts',
      label: 'En attente',
    })
  })
})

const withOption = (patch: Partial<ResolvedFormOption>): ResolvedFormOption => ({
  label: 'A',
  value: 'a',
  ...patch,
})

describe('option leading visual', () => {
  it('draws the icon first, then the avatar, then the chip', () => {
    const avatar = { src: '/a.png' }
    const chip = { color: 'info' as const }

    expect(resolveOptionLeading(withOption({ avatar, chip, icon: 'i-lucide-star' }))).toBe('icon')
    expect(resolveOptionLeading(withOption({ avatar, chip }))).toBe('avatar')
    expect(resolveOptionLeading(withOption({ chip }))).toBe('chip')
    expect(resolveOptionLeading(withOption({}))).toBeUndefined()
  })

  it('lines the description of a radio option up under its label', () => {
    expect(resolveOptionDescriptionIndent(withOption({ icon: 'i-lucide-star' }))).toBe('ps-6')
    expect(resolveOptionDescriptionIndent(withOption({ chip: {} }))).toBe('ps-6')
    expect(resolveOptionDescriptionIndent(withOption({ avatar: { text: 'A' } }))).toBe('ps-8')
    expect(resolveOptionDescriptionIndent(withOption({}))).toBeUndefined()
  })
})

interface GroupedOption extends FormOption {
  group?: string
}

const resolve = (...options: GroupedOption[]) => normalizeOptionItems(options, { group: 'group' })

describe('menu items', () => {
  const loadMore = { label: 'Chargement', show: false }

  it('keeps ungrouped options as the flat list they always were', () => {
    const options = normalizeOptionItems(['FR', 'BE'])

    expect(toMenuItems(options, loadMore)).toStrictEqual(options)
  })

  it('appends the load-more row to a flat list', () => {
    const options = normalizeOptionItems(['FR'])
    const items = toMenuItems(options, { label: 'Chargement', show: true })

    expect(items).toHaveLength(2)
    expect(items.at(-1)).toMatchObject({ disabled: true, label: 'Chargement' })
  })

  it('lists grouped options in arrays that start with their heading', () => {
    const options = resolve(
      { group: 'Organisation cliente', label: 'École', value: 'school' },
      { group: 'Partenaire', label: 'Revendeur', value: 'reseller' },
      { group: 'Organisation cliente', label: 'Entreprise', value: 'company' },
    )

    const items = toMenuItems(options, loadMore)

    expect(items).toMatchObject([
      [
        { label: 'Organisation cliente', type: 'label' },
        { label: 'École', value: 'school' },
        { label: 'Entreprise', value: 'company' },
      ],
      [
        { label: 'Partenaire', type: 'label' },
        { label: 'Revendeur', value: 'reseller' },
      ],
    ])
  })

  it('keeps the options without a group together, with no heading', () => {
    const options = resolve(
      { label: 'Sans groupe', value: 'none' },
      { group: 'Partenaire', label: 'Revendeur', value: 'reseller' },
    )

    const items = toMenuItems(options, loadMore)

    expect(items).toMatchObject([
      [{ label: 'Sans groupe', value: 'none' }],
      [
        { label: 'Partenaire', type: 'label' },
        { label: 'Revendeur', value: 'reseller' },
      ],
    ])
  })

  it('puts the load-more row last, in a group of its own', () => {
    const options = resolve({ group: 'Partenaire', label: 'Revendeur', value: 'reseller' })

    const items = toMenuItems(options, { label: 'Chargement', show: true })

    expect(items).toHaveLength(2)
    expect(items.at(-1)).toMatchObject([{ disabled: true, label: 'Chargement' }])
  })
})

describe('menu items and the Nuxt UI search', () => {
  it('keeps a heading only while its group has a match', async () => {
    const { useFilter } = await import('@nuxt/ui/composables/useFilter')
    const options = normalizeOptionItems(
      [
        { group: 'Organisation cliente', label: 'École', value: 'school' },
        { group: 'Organisation cliente', label: 'Entreprise', value: 'company' },
        { group: 'Partenaire', label: 'Revendeur', value: 'reseller' },
        { group: 'Centre de test', label: 'Centre', value: 'center' },
      ],
      { group: 'group' },
    )
    const groups = toMenuItems(options, { label: '', show: false }).flatMap((group) =>
      Array.isArray(group) ? [group] : [],
    )
    const { filterGroups } = useFilter()
    const filter = (term: string) =>
      filterGroups(groups, term, {
        fields: ['label'],
        isStructural: (item) => item.type === 'label',
      }).map((group) => group.map((item) => item.label))

    expect(filter('')).toHaveLength(3)
    expect(filter('revend')).toStrictEqual([['Partenaire', 'Revendeur']])
    expect(filter('ent')).toStrictEqual([
      ['Organisation cliente', 'Entreprise'],
      ['Centre de test', 'Centre'],
    ])
    expect(filter('zzz')).toStrictEqual([])
  })
})

describe('option render functions', () => {
  it('type the context with the option type of the field', () => {
    const select = {
      key: 'currency',
      options: [{ label: 'Euro', symbol: '€', value: 'EUR' }],
      renderOption: ({ item, option }) => h('span', `${item.symbol} ${option.label}`),
      renderValue: ({ item }) => h('span', item.symbol),
      type: 'select',
    } satisfies FormSelectField<object, object, 'EUR' | 'USD', Currency>

    expectTypeOf(select.renderOption)
      .parameter(0)
      .toEqualTypeOf<FormOptionRenderContext<Currency>>()
    expectTypeOf(select.renderValue)
      .parameter(0)
      .toEqualTypeOf<FormOptionValueRenderContext<Currency>>()
  })

  it('exist on the four option fields only', () => {
    expectTypeOf<FormSelectField['renderOption']>().not.toBeUndefined()
    expectTypeOf<FormAutoCompleteField['renderValue']>().not.toBeUndefined()
    expectTypeOf<FormRadioField['renderOption']>().not.toBeUndefined()
    expectTypeOf<FormCheckboxGroupField['renderOption']>().not.toBeUndefined()
    expectTypeOf<FormRadioField>().not.toHaveProperty('renderValue')
    expectTypeOf<FormCheckboxGroupField>().not.toHaveProperty('renderValue')
  })

  it('give the option, its authored item, and its state to renderOption', () => {
    expectTypeOf<FormOptionRenderContext>()
      .toHaveProperty('option')
      .toEqualTypeOf<ResolvedFormOption>()
    expectTypeOf<FormOptionRenderContext['selected']>().toEqualTypeOf<boolean>()
    expectTypeOf<FormOptionRenderContext['disabled']>().toEqualTypeOf<boolean>()
  })

  it('stay optional on an inline schema', () => {
    const field = defineFormField({
      key: 'status',
      options: [{ chip: { color: 'success' }, label: 'Actif', value: 'active' }],
      type: 'select',
    })
    const schema = defineFormSchema({
      fields: [
        {
          key: 'person',
          options: [{ avatar: { text: 'CD' }, label: 'Camille', suffix: 'RH', value: 'camille' }],
          type: 'auto-complete',
        },
      ],
    })

    expect(field.type).toBe('select')
    expect(schema.fields).toHaveLength(1)
  })
})
