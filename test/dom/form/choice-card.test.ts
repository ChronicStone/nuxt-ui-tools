import { mount } from '@vue/test-utils'
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

  it('keeps option icons off checkbox cards, whose Nuxt UI icon is the check mark', async () => {
    const harness = await mountForm({
      schema: defineFormSchema({
        fields: [
          { key: 'kinds', options: OPTIONS, props: { icon: 'tile' }, type: 'checkbox-card' },
        ],
      }),
    })
    const items: unknown = harness.wrapper.findComponent({ name: 'UCheckboxGroup' }).props('items')

    expect(Array.isArray(items) && items.length).toBe(2)
    expect(Array.isArray(items) && items.some((item) => Object.hasOwn(item, 'icon'))).toBe(false)
    harness.unmount()
  })

  it('renders the icon in a tile and a check in the corner of a selected card', () => {
    const selected = mount(ChoiceCardLabel, {
      props: {
        corner: true,
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
        corner: true,
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
        corner: false,
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
