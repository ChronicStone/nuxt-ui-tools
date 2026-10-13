import { mount } from '@vue/test-utils'
import type { DOMWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { defineFormSchema } from '#ui-tools/form'
import ChoiceCardLabel from '#ui-tools/form/fields/choice-card/choice-card-label.vue'

import { mountForm } from './harness'

const OPTIONS = [
  {
    description: 'Achète des tests',
    icon: 'i-lucide-building-2',
    label: 'Client',
    value: 'customer',
  },
  {
    description: 'Revend les tests',
    icon: 'i-lucide-users',
    label: 'Partenaire',
    value: 'partner',
  },
] as const

const radioSchema = defineFormSchema({
  fields: [
    {
      key: 'accountType',
      options: OPTIONS,
      props: { columns: '1 md:2 lg:3', icon: 'tile', indicator: 'corner' },
      type: 'radio-card',
    },
  ],
})

function switchLabel(selected: boolean) {
  return mount(ChoiceCardLabel, {
    props: {
      icon: 'i-lucide-users',
      label: 'Partenaire',
      mark: 'switch',
      selected,
      tile: true,
      value: 'partner',
    },
  })
}

describe('choice cards', () => {
  it('lays the cards out in a fixed grid whose column count follows the breakpoints', async () => {
    const wide = await mountForm({ breakpoint: 'xl', schema: radioSchema })
    const group = wide.wrapper.find('[data-ui="URadioGroup"]')

    expect(group.attributes('style')).toContain('--nut-choice-columns: 3')
    expect(group.attributes('data-slot-fieldset')).toContain(
      'grid-cols-[repeat(var(--nut-choice-columns),minmax(0,1fr))]',
    )
    expect(group.attributes('data-slot-fieldset')).toContain('gap-2.5')
    wide.unmount()

    const narrow = await mountForm({ breakpoint: 'md', schema: radioSchema })
    expect(narrow.wrapper.find('[data-ui="URadioGroup"]').attributes('style')).toContain(
      '--nut-choice-columns: 2',
    )
    narrow.unmount()
  })

  it('hides the Nuxt UI indicator for the corner check and keeps its own props off the group', async () => {
    const harness = await mountForm({ schema: radioSchema })
    const group = harness.wrapper.find('[data-ui="URadioGroup"]')

    expect(group.attributes('indicator')).toBe('hidden')
    expect(group.attributes('columns')).toBeUndefined()
    expect(group.attributes('icon')).toBeUndefined()
    // The card label draws the option icon (here as a tile): Nuxt UI's own icon stays hidden and
    // the tile layout stays aligned to the start.
    expect(group.attributes('data-slot-icon')).toContain('hidden')
    expect(group.attributes('data-slot-wrapper')).toContain('items-start')
    expect(group.attributes('data-slot-item')).toContain('relative')
    expect(group.attributes('data-slot-wrapper')).toContain('text-start')
    harness.unmount()
  })

  it('keeps option icons off checkbox cards and their check mark visible', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          { key: 'kinds', options: OPTIONS, props: { icon: 'tile' }, type: 'checkbox-card' },
        ],
      }),
    })
    const group = harness.wrapper.findComponent({ name: 'UCheckboxGroup' })
    const items: unknown = group.props('items')

    // The Nuxt UI icon of a checkbox is its check mark: hiding that slot, as a radio card does for
    // the copy of its option icon, would leave a filled box without a check.
    expect(Array.isArray(items) && items.length).toBe(2)
    expect(Array.isArray(items) && items.some((item) => Object.hasOwn(item, 'icon'))).toBe(false)
    expect(group.props('ui')).toMatchObject({ icon: '' })
    harness.unmount()
  })

  it('replaces the Nuxt UI indicator with a switch that follows the selection', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          {
            default: ['customer'],
            key: 'kinds',
            options: OPTIONS,
            props: { columns: 2, icon: 'tile', indicator: 'switch' },
            type: 'checkbox-card',
          },
        ],
      }),
    })
    const group = harness.wrapper.findComponent({ name: 'UCheckboxGroup' })
    const ui: unknown = group.props('ui')

    expect(group.props('indicator')).toBe('hidden')
    expect(typeof ui === 'object' && ui !== null && 'item' in ui && ui.item).toContain('relative')
    harness.unmount()

    const on = switchLabel(true)
    const off = switchLabel(false)

    expect(on.find('[data-choice-switch]').attributes('data-state')).toBe('checked')
    expect(off.find('[data-choice-switch]').attributes('data-state')).toBe('unchecked')
    expect(on.find('[data-choice-switch]').attributes('aria-hidden')).toBe('true')
    expect(on.find('[data-choice-tile]').attributes('data-value')).toBe('partner')
    expect(on.find('[data-choice-check]').exists()).toBe(false)
  })

  it('renders the icon in a tile and a check in the corner of a selected card', () => {
    const selected = mount(ChoiceCardLabel, {
      props: {
        mark: 'corner',
        icon: 'i-lucide-users',
        label: 'Partenaire',
        selected: true,
        tile: true,
      },
    })
    expect(selected.find('[data-choice-tile]').attributes('data-selected')).toBe('true')
    expect(selected.find('[data-choice-check]').exists()).toBe(true)
    expect(selected.text()).toContain('Partenaire')

    const other = mount(ChoiceCardLabel, {
      props: {
        mark: 'corner',
        icon: 'i-lucide-users',
        label: 'Partenaire',
        selected: false,
        tile: true,
      },
    })
    expect(other.find('[data-choice-tile]').attributes('data-selected')).toBeUndefined()
    expect(other.find('[data-choice-check]').exists()).toBe(false)

    const inline = mount(ChoiceCardLabel, {
      props: {
        mark: 'none',
        icon: 'i-lucide-users',
        label: 'Partenaire',
        selected: true,
        tile: false,
      },
    })
    expect(inline.find('[data-choice-tile]').exists()).toBe(false)
    expect(inline.find('[data-ui="UIcon"]').exists()).toBe(true)
  })
})

const ACCOUNT_TYPES = [
  {
    description: 'Lycée, collège ou université',
    group: 'Organisation cliente',
    label: 'Établissement',
    value: 'school',
  },
  {
    description: 'Entreprise ou association',
    group: 'Organisation cliente',
    label: 'Entreprise',
    value: 'company',
  },
  {
    description: 'Revend les tests à ses clients',
    group: 'Partenaire',
    label: 'Revendeur',
    value: 'reseller',
  },
  {
    description: 'Apporte des clients',
    group: 'Partenaire',
    label: 'Apporteur',
    value: 'referrer',
  },
  {
    description: 'Fait passer les tests',
    group: 'Centre de test',
    label: 'Centre agréé',
    value: 'center',
  },
  {
    description: 'Fait passer les tests à distance',
    group: 'Centre de test',
    label: 'Centre distant',
    value: 'remote',
  },
  {
    description: 'Équipe ExAssess',
    group: 'Compte interne',
    label: 'Administrateur',
    value: 'admin',
  },
  { description: 'Aide les clients', group: 'Compte interne', label: 'Support', value: 'support' },
] as const

function groupedSchema(density?: 'compact') {
  return defineFormSchema({
    fields: [
      {
        key: 'accountType',
        options: ACCOUNT_TYPES,
        props: { columns: 2, density, icon: 'tile', indicator: 'corner' },
        type: 'radio-card',
      },
    ],
  })
}

function checkedValues(group: DOMWrapper<Element>) {
  return group
    .findAll('input')
    .flatMap((input) =>
      input.element instanceof HTMLInputElement && input.element.checked
        ? [input.element.value]
        : [],
    )
}

interface GroupFinder {
  findAll: (selector: string) => DOMWrapper<Element>[]
}

function summarizeGroups(wrapper: GroupFinder, component: 'URadioGroup' | 'UCheckboxGroup') {
  return wrapper.findAll(`[data-ui="${component}"]`).map((group) => ({
    checked: checkedValues(group),
    heading: group.find('[data-ui-legend]').exists()
      ? group.find('[data-ui-legend]').text()
      : undefined,
    values: group.findAll('input').map((input) => input.element.getAttribute('value')),
  }))
}

describe('grouped choice cards', () => {
  it('lists radio cards under their headings in order of first appearance', async () => {
    const harness = await mountForm({ schema: groupedSchema() })

    expect(summarizeGroups(harness.wrapper, 'URadioGroup')).toStrictEqual([
      { checked: [], heading: 'Organisation cliente', values: ['school', 'company'] },
      { checked: [], heading: 'Partenaire', values: ['reseller', 'referrer'] },
      { checked: [], heading: 'Centre de test', values: ['center', 'remote'] },
      { checked: [], heading: 'Compte interne', values: ['admin', 'support'] },
    ])
    harness.unmount()
  })

  it('keeps the options of a group together when they are not authored side by side', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          {
            key: 'kind',
            options: [
              { group: 'B', label: 'B1', value: 'b1' },
              { group: 'A', label: 'A1', value: 'a1' },
              { group: 'B', label: 'B2', value: 'b2' },
            ],
            type: 'radio-card',
          },
        ],
      }),
    })

    expect(
      summarizeGroups(harness.wrapper, 'URadioGroup').map((group) => group.heading),
    ).toStrictEqual(['B', 'A'])
    expect(summarizeGroups(harness.wrapper, 'URadioGroup')[0]?.values).toStrictEqual(['b1', 'b2'])
    harness.unmount()
  })

  it('shows the selection in the group of the chosen option and moves it across groups', async () => {
    const harness = await mountForm({ input: { accountType: 'reseller' }, schema: groupedSchema() })
    const groups = () => summarizeGroups(harness.wrapper, 'URadioGroup')

    expect(groups().map((group) => group.checked)).toStrictEqual([[], ['reseller'], [], []])

    await harness.wrapper.find('input[value="center"]').setValue(true)
    await harness.flush()
    expect(harness.form.state.get('accountType')).toBe('center')
    expect(groups().map((group) => group.checked)).toStrictEqual([[], [], ['center'], []])

    await harness.wrapper.find('input[value="school"]').setValue(true)
    await harness.flush()
    expect(harness.form.state.get('accountType')).toBe('school')
    expect(groups().map((group) => group.checked)).toStrictEqual([['school'], [], [], []])
    harness.unmount()
  })

  it('renders an ungrouped list as one group without a heading', async () => {
    const harness = await mountForm({ schema: radioSchema })

    expect(summarizeGroups(harness.wrapper, 'URadioGroup')).toStrictEqual([
      { checked: [], heading: undefined, values: ['customer', 'partner'] },
    ])
    expect(harness.wrapper.find('[data-ui-legend]').exists()).toBe(false)
    harness.unmount()
  })

  it('resolves lazy headings and styles the heading and the stack through ui', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          {
            key: 'kind',
            options: [
              { group: () => 'Organisation', label: 'École', value: 'school' },
              { group: () => 'Partenaire', label: 'Revendeur', value: 'reseller' },
            ],
            props: { ui: { groups: 'gap-8', legend: 'text-xs uppercase' } },
            type: 'radio-card',
          },
        ],
      }),
    })
    const first = harness.wrapper.find('[data-ui="URadioGroup"]')

    expect(
      summarizeGroups(harness.wrapper, 'URadioGroup').map((group) => group.heading),
    ).toStrictEqual(['Organisation', 'Partenaire'])
    expect(first.attributes('data-slot-legend')).toContain('uppercase')
    expect(first.element.parentElement?.className).toContain('gap-8')
    harness.unmount()
  })

  it('keeps the selections of several checkbox groups and the order they were made in', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          {
            default: ['reseller'],
            key: 'kinds',
            options: ACCOUNT_TYPES,
            props: { columns: 2 },
            type: 'checkbox-card',
          },
        ],
      }),
    })
    const groups = () => summarizeGroups(harness.wrapper, 'UCheckboxGroup')

    expect(groups().map((group) => group.heading)).toStrictEqual([
      'Organisation cliente',
      'Partenaire',
      'Centre de test',
      'Compte interne',
    ])
    expect(groups().map((group) => group.checked)).toStrictEqual([[], ['string:reseller'], [], []])

    await harness.wrapper.find('input[value="string:school"]').setValue(true)
    await harness.wrapper.find('input[value="string:admin"]').setValue(true)
    await harness.wrapper.find('input[value="string:referrer"]').setValue(true)
    await harness.flush()
    expect(harness.form.state.get('kinds')).toStrictEqual([
      'reseller',
      'school',
      'admin',
      'referrer',
    ])

    await harness.wrapper.find('input[value="string:reseller"]').setValue(false)
    await harness.flush()
    expect(harness.form.state.get('kinds')).toStrictEqual(['school', 'admin', 'referrer'])
    expect(groups().map((group) => group.checked)).toStrictEqual([
      ['string:school'],
      ['string:referrer'],
      [],
      ['string:admin'],
    ])
    harness.unmount()
  })
})

const radioRowsSchema = defineFormSchema({
  fields: [
    {
      confirmDelete: false,
      fields: [{ key: 'kind', label: 'Compte', options: ACCOUNT_TYPES, type: 'radio-card' }],
      key: 'rows',
      type: 'array-table',
    },
  ],
})

const checkboxRowsSchema = defineFormSchema({
  fields: [
    {
      confirmDelete: false,
      fields: [{ key: 'kinds', label: 'Comptes', options: ACCOUNT_TYPES, type: 'checkbox-card' }],
      key: 'rows',
      type: 'array-table',
    },
  ],
})

function groupAttributes(
  row: GroupFinder,
  component: 'URadioGroup' | 'UCheckboxGroup',
  name: string,
) {
  return row.findAll(`[data-ui="${component}"]`).map((group) => group.attributes(name))
}

describe('choice card groups in table cells', () => {
  it('gives every radio group of a cell its own id and keeps the control id on the first', async () => {
    const harness = await mountForm({
      input: { rows: [{ kind: 'school' }, { kind: 'center' }] },
      schema: radioRowsSchema,
    })
    await harness.until(() => harness.wrapper.findAll('tbody tr').length === 2)
    const ids = harness.wrapper
      .findAll('tbody tr')
      .map((row) => groupAttributes(row, 'URadioGroup', 'id'))

    expect(ids.map((rowIds) => rowIds.length)).toStrictEqual([4, 4])
    expect(new Set(ids.flat()).size).toBe(8)
    for (const [control, ...others] of ids) {
      expect(control).toBeTruthy()
      expect(others).toStrictEqual([`${control}-1`, `${control}-2`, `${control}-3`])
    }
    harness.unmount()
  })

  it('gives every checkbox group of a cell its own id and keeps the control id on the first', async () => {
    const harness = await mountForm({
      input: { rows: [{ kinds: ['school'] }, { kinds: [] }] },
      schema: checkboxRowsSchema,
    })
    await harness.until(() => harness.wrapper.findAll('tbody tr').length === 2)
    const ids = harness.wrapper
      .findAll('tbody tr')
      .map((row) => groupAttributes(row, 'UCheckboxGroup', 'id'))

    expect(ids.map((rowIds) => rowIds.length)).toStrictEqual([4, 4])
    expect(new Set(ids.flat()).size).toBe(8)
    for (const [control, ...others] of ids) {
      expect(control).toBeTruthy()
      expect(others).toStrictEqual([`${control}-1`, `${control}-2`, `${control}-3`])
    }
    harness.unmount()
  })

  it('keeps the field marker and the accessible name on every group', async () => {
    const harness = await mountForm({
      input: { rows: [{ kind: 'school' }] },
      schema: radioRowsSchema,
    })
    await harness.until(() => harness.wrapper.findAll('tbody tr').length === 1)
    const row = harness.wrapper.find('tbody tr')

    expect(groupAttributes(row, 'URadioGroup', 'data-form-field')).toStrictEqual(
      Array.from({ length: 4 }, () => 'rows.0.kind'),
    )
    expect(groupAttributes(row, 'URadioGroup', 'aria-label')).toStrictEqual(
      Array.from({ length: 4 }, () => 'Compte'),
    )
    harness.unmount()
  })
})

describe('compact choice cards', () => {
  it('shrinks the cards and keeps the density prop off the Nuxt UI group', async () => {
    const harness = await mountForm({ schema: groupedSchema('compact') })
    const group = harness.wrapper.find('[data-ui="URadioGroup"]')

    expect(group.attributes('density')).toBeUndefined()
    expect(group.attributes('data-slot-item')).toContain('p-2.5')
    expect(group.attributes('data-slot-item')).toContain('items-center')
    expect(group.attributes('data-slot-fieldset')).toContain('gap-2')
    expect(group.attributes('data-slot-fieldset')).not.toContain('gap-2.5')
    expect(group.attributes('data-slot-label')).toContain('grid')
    expect(group.attributes('data-slot-wrapper')).toContain('min-w-0')
    // Nuxt UI centers the wrapper of a card with a hidden indicator: the label must fill it.
    expect(group.attributes('data-slot-wrapper')).toContain('items-stretch')
    // Compact never stacks the tile above the label: the wrapper keeps its default layout.
    expect(group.attributes('data-slot-wrapper')).not.toContain('flex-col')
    harness.unmount()
  })

  it('renders the description in the card label instead of the Nuxt UI group', async () => {
    const compact = await mountForm({ schema: groupedSchema('compact') })
    const card = compact.wrapper.find('[data-ui-radio="school"]')

    expect(card.find('[data-ui-description]').exists()).toBe(false)
    expect(card.find('[data-choice-title]').text()).toBe('Établissement')
    expect(card.find('[data-choice-description]').text()).toBe('Lycée, collège ou université')
    expect(card.find('[data-choice-description]').attributes('title')).toBe(
      'Lycée, collège ou université',
    )
    compact.unmount()

    const regular = await mountForm({ schema: groupedSchema() })
    const regularCard = regular.wrapper.find('[data-ui-radio="school"]')
    expect(regularCard.find('[data-ui-description]').text()).toBe('Lycée, collège ou université')
    expect(regularCard.find('[data-choice-description]').exists()).toBe(false)
    regular.unmount()
  })

  it('does the same for checkbox cards', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          {
            key: 'kinds',
            options: ACCOUNT_TYPES,
            props: { density: 'compact', icon: 'tile' },
            type: 'checkbox-card',
          },
        ],
      }),
    })
    const card = harness.wrapper.find('[data-ui-option="string:school"]')

    expect(card.find('[data-ui-description]').exists()).toBe(false)
    expect(card.find('[data-choice-description]').text()).toBe('Lycée, collège ou université')
    harness.unmount()
  })

  it('lays the label out as a smaller tile, a truncated title, and a truncated description', () => {
    const label = mount(ChoiceCardLabel, {
      props: {
        compact: true,
        description: 'Lycée, collège ou université',
        icon: 'i-lucide-school',
        label: 'Établissement',
        mark: 'corner',
        selected: true,
        tile: true,
        value: 'school',
      },
    })

    expect(label.find('[data-choice-tile]').classes()).toEqual(
      expect.arrayContaining(['size-7', 'row-span-2', 'col-start-1']),
    )
    expect(label.find('[data-choice-tile]').classes()).not.toContain('size-8')
    expect(label.find('[data-choice-title]').classes()).toEqual(
      expect.arrayContaining(['truncate', 'col-start-2']),
    )
    expect(label.find('[data-choice-title]').attributes('title')).toBe('Établissement')
    expect(label.find('[data-choice-description]').classes()).toEqual(
      expect.arrayContaining(['truncate', 'col-start-2']),
    )
    expect(label.find('[data-choice-check]').classes()).toEqual(
      expect.arrayContaining(['top-1/2', '-translate-y-1/2']),
    )
  })

  it('puts a bare icon beside the title and skips the description line when there is none', () => {
    const label = mount(ChoiceCardLabel, {
      props: {
        compact: true,
        icon: 'i-lucide-school',
        label: 'Établissement',
        mark: 'none',
        selected: false,
        tile: false,
      },
    })

    expect(label.find('[data-choice-tile]').exists()).toBe(false)
    expect(label.find('[data-ui="UIcon"]').classes()).toEqual(
      expect.arrayContaining(['row-span-2', 'size-4']),
    )
    expect(label.find('[data-choice-description]').exists()).toBe(false)
  })
})
