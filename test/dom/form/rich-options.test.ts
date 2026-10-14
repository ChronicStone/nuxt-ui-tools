import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import { defineFormSchema } from '#ui-tools/form'
import type { FormOptionRenderContext, FormOptionValueRenderContext } from '#ui-tools/form'

import { mountForm } from './harness'
import type { FormHarness } from './harness'

let harness: FormHarness | undefined

afterEach(() => {
  harness?.unmount()
  harness = undefined
})

const currencies = [
  { description: 'Zone euro', label: 'Euro', suffix: 'EUR', symbol: '€', value: 'EUR' },
  { description: 'États-Unis', label: 'Dollar', suffix: 'USD', symbol: '$', value: 'USD' },
] as const

const people = [
  { avatar: { src: '/camille.png', text: 'CD' }, label: 'Camille Durand', value: 'camille' },
  { avatar: { text: 'LM' }, label: 'Louis Martin', suffix: 'RH', value: 'louis' },
] as const

const statuses = [
  { chip: { color: 'success' }, label: 'Actif', value: 'active' },
  { chip: { color: 'warning' }, label: 'En attente', value: 'pending' },
  { chip: {}, label: 'Brouillon', value: 'draft' },
] as const

/** The latest context a render function received for an option. */
function last<TContext>(contexts: readonly TContext[], match: (context: TContext) => boolean) {
  return contexts.filter(match).at(-1)
}

async function open(path: string) {
  const current = harness
  if (!current) throw new Error('mount a form first')
  await current.field(path).find('[data-ui-trigger]').trigger('click')
  await current.flush()
}

function item(path: string, value: string) {
  const current = harness
  if (!current) throw new Error('mount a form first')
  return current.field(path).find(`[data-ui-item="${value}"]`)
}

describe('select with rich options', () => {
  it('pads the control for a visual picked after mount, so it never covers the label', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'person', options: people, type: 'select' }],
      }),
    })
    const control = () => harness?.wrapper.findComponent({ name: 'USelectMenu' })
    expect(control()?.props('ui')?.base ?? '').not.toContain('ps-9')

    await open('person')
    await item('person', 'louis').trigger('click')
    await harness.flush()

    expect(control()?.props('ui')?.base).toContain('ps-9')
  })

  it('draws the leading visual, description, and suffix of each option in the menu', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'currency', options: currencies, type: 'select' }],
      }),
    })
    await open('currency')

    const euro = item('currency', 'EUR')
    expect(euro.find('[data-ui-slot="item-label"]').text()).toBe('Euro')
    expect(euro.find('[data-ui-slot="item-description"]').text()).toBe('Zone euro')
    expect(euro.find('[data-ui-slot="item-trailing"] [data-form-option-suffix]').text()).toBe('EUR')
    expect(euro.find('[data-form-option-leading]').exists()).toBeFalsy()
  })

  it('draws an icon in the menu', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [
          {
            key: 'type',
            options: [{ icon: 'i-lucide-school', label: 'École', value: 'school' }],
            type: 'select',
          },
        ],
      }),
    })
    await open('type')

    const icon = item('type', 'school').find(
      '[data-ui-slot="item-leading"] [data-form-option-leading="icon"]',
    )
    expect(icon.attributes('data-name')).toBe('i-lucide-school')
  })

  it('draws an avatar, named after the option when it gives no alt', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'person', options: people, type: 'select' }],
      }),
    })
    await open('person')

    const avatar = item('person', 'camille').find('[data-ui="UAvatar"]')
    expect(avatar.attributes()).toMatchObject({
      'data-alt': 'Camille Durand',
      'data-size': 'xs',
      'data-src': '/camille.png',
      'data-text': 'CD',
    })
  })

  it('draws a chip dot in the color of the option, primary by default', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'status', options: statuses, type: 'select' }],
      }),
    })
    await open('status')

    const chip = (value: string) => item('status', value).find('[data-ui="UChip"]')
    expect(chip('active').attributes('data-color')).toBe('success')
    expect(chip('pending').attributes('data-color')).toBe('warning')
    expect(chip('draft').attributes('data-color')).toBeUndefined()
    expect(chip('active').attributes()).toMatchObject({
      'data-inset': 'true',
      'data-standalone': 'true',
    })
  })

  it('draws one leading visual only, icon before avatar before chip', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [
          {
            key: 'rich',
            options: [
              {
                avatar: { text: 'A' },
                chip: { color: 'info' },
                icon: 'i-lucide-star',
                label: 'Tout',
                value: 'all',
              },
              { avatar: { text: 'B' }, chip: { color: 'info' }, label: 'Avatar', value: 'avatar' },
              { chip: { color: 'info' }, label: 'Chip', value: 'chip' },
            ],
            type: 'select',
          },
        ],
      }),
    })
    await open('rich')

    const kinds = (value: string) =>
      item('rich', value)
        .findAll('[data-form-option-leading]')
        .map((node) => node.attributes('data-form-option-leading'))
    expect(kinds('all')).toStrictEqual(['icon'])
    expect(kinds('avatar')).toStrictEqual(['avatar'])
    expect(kinds('chip')).toStrictEqual(['chip'])
  })

  it('shows the chosen option in the closed control with its leading visual and a dimmed suffix', async () => {
    harness = await mountForm({
      input: { currency: 'EUR' },
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'currency', options: currencies, type: 'select' }],
      }),
    })

    const control = harness.field('currency').find('[data-ui-trigger]')
    expect(control.find('[data-ui-slot="leading"]').exists()).toBeFalsy()
    expect(control.text()).toBe('Euro EUR')
    expect(control.find('[data-form-option-suffix]').text()).toBe('EUR')
  })

  it('shows the leading visual of the chosen option in the leading slot of the control', async () => {
    harness = await mountForm({
      input: { status: 'pending', person: 'louis' },
      schema: defineFormSchema({
        actions: [],
        fields: [
          { key: 'status', options: statuses, type: 'select' },
          { key: 'person', options: people, type: 'select' },
        ],
      }),
    })

    const chip = harness.field('status').find('[data-ui-slot="leading"] [data-ui="UChip"]')
    expect(chip.attributes('data-color')).toBe('warning')
    expect(harness.field('status').find('[data-ui-trigger]').text()).toBe('En attente')
    const avatar = harness.field('person').find('[data-ui-slot="leading"] [data-ui="UAvatar"]')
    expect(avatar.attributes('data-text')).toBe('LM')
    expect(harness.field('person').find('[data-ui-trigger]').text()).toBe('Louis Martin RH')
  })

  it('leaves the control as it was for an empty value and for plain options', async () => {
    harness = await mountForm({
      input: { country: 'FR' },
      schema: defineFormSchema({
        actions: [],
        fields: [
          { key: 'status', options: statuses, placeholder: 'Choisir un statut', type: 'select' },
          { key: 'country', options: ['FR', 'BE'], type: 'select' },
        ],
      }),
    })

    const empty = harness.field('status').find('[data-ui-trigger]')
    expect(empty.text()).toBe('Choisir un statut')
    expect(empty.find('[data-ui-slot="leading"]').exists()).toBeFalsy()
    const plain = harness.field('country').find('[data-ui-trigger]')
    expect(plain.text()).toBe('FR')
    expect(plain.find('[data-ui-slot="leading"]').exists()).toBeFalsy()
  })

  it('keeps the labels of a multiple selection', async () => {
    harness = await mountForm({
      input: { currencies: ['EUR', 'USD'] },
      schema: defineFormSchema({
        actions: [],
        fields: [
          { key: 'currencies', options: currencies, props: { multiple: true }, type: 'select' },
        ],
      }),
    })

    const control = harness.field('currencies').find('[data-ui-trigger]')
    expect(control.text()).toBe('Euro, Dollar')
    expect(control.find('[data-ui-slot="leading"]').exists()).toBeFalsy()
    expect(control.find('[data-form-option-suffix]').exists()).toBeFalsy()
    // One token per chosen option, in the order chosen.
    expect(control.findAll('[data-form-option-token]').map((token) => token.text())).toEqual([
      'Euro',
      'Dollar',
    ])
  })

  it('hands renderOption the resolved option, the authored item, and the state of the option', async () => {
    const contexts: FormOptionRenderContext[] = []
    harness = await mountForm({
      input: { currency: 'USD' },
      schema: defineFormSchema({
        actions: [],
        fields: [
          {
            key: 'currency',
            options: [...currencies, { disabled: true, label: 'Livre', value: 'GBP' }],
            renderOption: (context) => {
              contexts.push(context)
              return h('span', { 'data-custom': context.option.value }, `${context.option.label}!`)
            },
            type: 'select',
          },
        ],
      }),
    })
    await open('currency')

    const euro = item('currency', 'EUR')
    expect(euro.find('[data-custom="EUR"]').text()).toBe('Euro!')
    const byValue = (value: string) => last(contexts, (entry) => entry.option.value === value)
    expect(byValue('EUR')).toMatchObject({
      disabled: false,
      item: currencies[0],
      option: { label: 'Euro', suffix: 'EUR', value: 'EUR' },
      selected: false,
    })
    expect(byValue('EUR')?.item).toBe(currencies[0])
    expect(byValue('USD')?.selected).toBe(true)
    expect(byValue('GBP')?.disabled).toBe(true)
  })

  it('lets renderOption replace the leading visual, description, and suffix, and nothing else', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [
          {
            key: 'currency',
            options: [{ ...currencies[0], icon: 'i-lucide-euro' }],
            renderOption: ({ option }) => h('b', option.label),
            type: 'select',
          },
        ],
      }),
    })
    await open('currency')

    const euro = item('currency', 'EUR')
    expect(euro.find('[data-ui-slot="item-label"] b').text()).toBe('Euro')
    expect(euro.find('[data-form-option-leading]').exists()).toBeFalsy()
    expect(euro.find('[data-form-option-suffix]').exists()).toBeFalsy()
    expect(euro.attributes('aria-selected')).toBe('false')
    expect(
      harness
        .field('currency')
        .find('[data-ui="USelectMenu"]')
        .attributes('data-slot-itemdescription'),
    ).toBe('hidden')
  })

  it('selects an option drawn by renderOption', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [
          {
            key: 'currency',
            options: currencies,
            renderOption: ({ option }) => h('b', option.label),
            type: 'select',
          },
        ],
      }),
    })
    await open('currency')
    await item('currency', 'USD').trigger('click')
    await harness.flush()

    expect(harness.form.state.get('currency')).toBe('USD')
  })

  it('hands renderValue the chosen option and replaces how it reads in the control', async () => {
    const contexts: FormOptionValueRenderContext[] = []
    harness = await mountForm({
      input: { currency: 'EUR' },
      schema: defineFormSchema({
        actions: [],
        fields: [
          {
            key: 'currency',
            options: currencies,
            renderValue: (context) => {
              contexts.push(context)
              return h('span', { 'data-value': '' }, context.option.suffix)
            },
            type: 'select',
          },
        ],
      }),
    })

    const control = harness.field('currency').find('[data-ui-trigger]')
    expect(control.find('[data-value]').text()).toBe('EUR')
    expect(control.text()).toBe('EUR')
    expect(contexts.at(-1)?.item).toBe(currencies[0])
    expect(contexts.at(-1)).not.toHaveProperty('selected')
  })

  it('keeps the leading visual out of the control when renderValue draws the value', async () => {
    harness = await mountForm({
      input: { status: 'active' },
      schema: defineFormSchema({
        actions: [],
        fields: [
          {
            key: 'status',
            options: statuses,
            renderValue: ({ option }) => h('i', option.label),
            type: 'select',
          },
        ],
      }),
    })

    const control = harness.field('status').find('[data-ui-trigger]')
    expect(control.find('[data-ui-slot="leading"]').exists()).toBeFalsy()
    expect(control.find('i').text()).toBe('Actif')
  })

  it('keeps the labels of a multiple selection when renderValue is set', async () => {
    harness = await mountForm({
      input: { currencies: ['EUR', 'USD'] },
      schema: defineFormSchema({
        actions: [],
        fields: [
          {
            key: 'currencies',
            options: currencies,
            props: { multiple: true },
            renderValue: () => h('i', 'never'),
            type: 'select',
          },
        ],
      }),
    })

    expect(harness.field('currencies').find('[data-ui-trigger]').text()).toBe('Euro, Dollar')
  })

  it('lists plain string options exactly as before', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'country', options: ['FR', 'BE'], type: 'select' }],
      }),
    })
    await open('country')

    const fr = item('country', 'FR')
    expect(fr.text()).toBe('FR')
    expect(fr.find('[data-form-option-leading]').exists()).toBeFalsy()
    expect(fr.find('[data-form-option-suffix]').exists()).toBeFalsy()
    expect(fr.find('[data-ui-slot="item-description"]').exists()).toBeFalsy()
    expect(harness.field('country').findAll('[data-ui-group]')).toHaveLength(1)
    expect(harness.field('country').find('[data-ui-heading]').exists()).toBeFalsy()
  })
})

describe('select and auto-complete option groups', () => {
  const accountTypes = [
    {
      description: 'Lycées et universités',
      group: 'Organisation cliente',
      icon: 'i-lucide-school',
      label: 'École',
      value: 'school',
    },
    {
      description: 'Revend des licences',
      group: 'Partenaire',
      icon: 'i-lucide-handshake',
      label: 'Revendeur',
      value: 'reseller',
    },
    {
      description: 'Employeurs privés',
      group: 'Organisation cliente',
      icon: 'i-lucide-building-2',
      label: 'Entreprise',
      value: 'company',
    },
  ] as const

  const headings = (path: string) =>
    harness
      ?.field(path)
      .findAll('[data-ui-heading]')
      .map((node) => node.text())

  it('lists the inline options of a select under their headings, in order of first appearance', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'type', options: accountTypes, type: 'select' }],
      }),
    })
    await open('type')

    expect(headings('type')).toStrictEqual(['Organisation cliente', 'Partenaire'])
    const groups = harness.field('type').findAll('[data-ui-group]')
    expect(groups.map((group) => group.findAll('[data-ui-item]').length)).toStrictEqual([2, 1])
  })

  it('lists the inline options of an auto-complete under their headings', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'type', options: accountTypes, type: 'auto-complete' }],
      }),
    })
    await open('type')

    expect(headings('type')).toStrictEqual(['Organisation cliente', 'Partenaire'])
  })

  it('selects an option under a heading', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'type', options: accountTypes, type: 'select' }],
      }),
    })
    await open('type')
    await item('type', 'reseller').trigger('click')
    await harness.flush()

    expect(harness.form.state.get('type')).toBe('reseller')
  })

  it('lists every option together when groupKey is false', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ groupKey: false, key: 'type', options: accountTypes, type: 'select' }],
      }),
    })
    await open('type')

    expect(headings('type')).toStrictEqual([])
    expect(harness.field('type').findAll('[data-ui-group]')).toHaveLength(1)
  })

  it('does not group the records a function returns until groupKey names the heading', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [
          { key: 'plain', options: () => accountTypes, type: 'select' },
          {
            groupKey: 'section',
            key: 'mapped',
            options: () => accountTypes.map((entry) => ({ ...entry, section: entry.group })),
            type: 'select',
          },
        ],
      }),
    })

    await open('plain')
    expect(headings('plain')).toStrictEqual([])
    await open('mapped')
    expect(headings('mapped')).toStrictEqual(['Organisation cliente', 'Partenaire'])
  })

  it('keeps the icon and description of each grouped option', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'type', options: accountTypes, type: 'select' }],
      }),
    })
    await open('type')

    const school = item('type', 'school')
    expect(school.find('[data-form-option-leading="icon"]').attributes('data-name')).toBe(
      'i-lucide-school',
    )
    expect(school.find('[data-ui-slot="item-description"]').text()).toBe('Lycées et universités')
  })
})

describe('auto-complete with rich options', () => {
  it('draws avatars in the menu and the avatar of the chosen person in the control', async () => {
    harness = await mountForm({
      input: { person: 'camille' },
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'person', options: people, type: 'auto-complete' }],
      }),
    })

    const control = harness.field('person').find('[data-ui-trigger]')
    expect(
      control.find('[data-ui-slot="leading"] [data-ui="UAvatar"]').attributes('data-src'),
    ).toBe('/camille.png')
    await open('person')
    expect(item('person', 'louis').find('[data-ui="UAvatar"]').attributes('data-text')).toBe('LM')
    expect(item('person', 'louis').find('[data-form-option-suffix]').text()).toBe('RH')
  })

  it('hands renderOption the context and replaces the content of each option', async () => {
    const contexts: FormOptionRenderContext[] = []
    harness = await mountForm({
      input: { person: 'louis' },
      schema: defineFormSchema({
        actions: [],
        fields: [
          {
            key: 'person',
            options: people,
            renderOption: (context) => {
              contexts.push(context)
              return h('b', context.option.label)
            },
            type: 'auto-complete',
          },
        ],
      }),
    })
    await open('person')

    const louis = item('person', 'louis')
    expect(louis.find('b').text()).toBe('Louis Martin')
    expect(louis.find('[data-form-option-leading]').exists()).toBeFalsy()
    expect(last(contexts, (entry) => entry.option.value === 'louis')).toMatchObject({
      item: people[1],
      selected: true,
    })
    expect(last(contexts, (entry) => entry.option.value === 'camille')?.selected).toBe(false)
  })
})

describe('radio and checkbox group with rich options', () => {
  const plans = [
    {
      description: 'Pour démarrer',
      icon: 'i-lucide-rocket',
      label: 'Starter',
      suffix: '0 €',
      value: 'starter',
    },
    {
      avatar: { text: 'SC' },
      description: 'Pour les équipes',
      label: 'Scale',
      value: 'scale',
    },
    { chip: { color: 'error' }, label: 'Sur mesure', value: 'custom' },
    { label: 'Aucun visuel', value: 'plain' },
  ] as const

  const row = (path: string, value: string) => {
    const current = harness
    if (!current) throw new Error('mount a form first')
    return current.field(path).find(`[data-ui-option="${value}"], [data-ui-radio="${value}"]`)
  }

  it('lines the leading visual, the label, and the suffix up in the label of a radio', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'plan', options: plans, type: 'radio' }],
      }),
    })

    const starter = row('plan', 'starter')
    const line = starter.find('[data-form-option-row]')
    expect(line.find('[data-form-option-leading="icon"]').attributes('data-name')).toBe(
      'i-lucide-rocket',
    )
    expect(line.text()).toBe('Starter0 €')
    expect(line.find('[data-form-option-suffix]').text()).toBe('0 €')
    expect(row('plan', 'scale').find('[data-ui="UAvatar"]').attributes('data-alt')).toBe('Scale')
    expect(row('plan', 'custom').find('[data-ui="UChip"]').attributes('data-color')).toBe('error')
  })

  it('keeps the description under the label, indented past the leading visual', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'plan', options: plans, type: 'radio' }],
      }),
    })

    const description = (value: string) => row('plan', value).find('[data-ui-description]')
    expect(description('starter').text()).toBe('Pour démarrer')
    expect(description('starter').classes()).toContain('ps-6')
    expect(description('scale').classes()).toContain('ps-8')
  })

  it('renders an option without a visual or a suffix as its plain label', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [
          { key: 'plan', options: plans, type: 'radio' },
          { key: 'country', options: ['FR', 'BE'], type: 'radio' },
        ],
      }),
    })

    expect(row('plan', 'plain').find('[data-form-option-row]').exists()).toBeFalsy()
    expect(row('plan', 'plain').text()).toBe('Aucun visuel')
    expect(row('country', 'FR').text()).toBe('FR')
    expect(row('country', 'FR').find('[data-ui-description]').exists()).toBeFalsy()
  })

  it('keeps the radio working: choosing an option writes its value', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'plan', options: plans, type: 'radio' }],
      }),
    })
    await row('plan', 'scale').find('input').setValue(true)
    await harness.flush()

    expect(harness.form.state.get('plan')).toBe('scale')
  })

  it('hands renderOption of a radio the context and replaces label, description, and suffix', async () => {
    const contexts: FormOptionRenderContext[] = []
    harness = await mountForm({
      input: { plan: 'scale' },
      schema: defineFormSchema({
        actions: [],
        fields: [
          {
            key: 'plan',
            options: plans,
            renderOption: (context) => {
              contexts.push(context)
              return h('em', context.option.label)
            },
            type: 'radio',
          },
        ],
      }),
    })

    const starter = row('plan', 'starter')
    expect(starter.find('em').text()).toBe('Starter')
    expect(starter.find('[data-form-option-leading]').exists()).toBeFalsy()
    expect(starter.find('[data-form-option-suffix]').exists()).toBeFalsy()
    expect(starter.find('[data-ui-description]').exists()).toBeFalsy()
    expect(last(contexts, (entry) => entry.option.value === 'scale')).toMatchObject({
      disabled: false,
      item: plans[1],
      selected: true,
    })
    expect(last(contexts, (entry) => entry.option.value === 'starter')?.selected).toBe(false)
  })

  it('draws the rich label of a checkbox group and keeps the selection working', async () => {
    harness = await mountForm({
      input: { plans: ['starter'] },
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'plans', options: plans, type: 'checkbox-group' }],
      }),
    })

    const starter = row('plans', 'string:starter')
    expect(starter.find('[data-form-option-row]').text()).toBe('Starter0 €')
    expect(starter.find('[data-ui-description]').classes()).toContain('ps-6')
    expect(row('plans', 'string:plain').text()).toBe('Aucun visuel')

    await row('plans', 'string:scale').find('input').setValue(true)
    await harness.flush()
    expect(harness.form.state.get('plans')).toStrictEqual(['starter', 'scale'])
  })

  it('hands renderOption of a checkbox group the selected state of each option', async () => {
    const contexts: FormOptionRenderContext[] = []
    harness = await mountForm({
      input: { plans: ['scale'] },
      schema: defineFormSchema({
        actions: [],
        fields: [
          {
            key: 'plans',
            options: plans,
            renderOption: (context) => {
              contexts.push(context)
              return h('em', context.option.label)
            },
            type: 'checkbox-group',
          },
        ],
      }),
    })

    expect(row('plans', 'string:scale').find('em').text()).toBe('Scale')
    expect(last(contexts, (entry) => entry.option.value === 'scale')?.selected).toBe(true)
    expect(last(contexts, (entry) => entry.option.value === 'starter')).toMatchObject({
      item: plans[0],
      selected: false,
    })
  })

  it('does not hand the checkbox the icon of an option as its check mark', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'plans', options: plans, type: 'checkbox-group' }],
      }),
    })

    expect(row('plans', 'string:starter').attributes('data-icon')).toBeUndefined()
    expect(row('plans', 'string:starter').attributes('icon')).toBeUndefined()
  })
})

describe('chosen values with their visuals', () => {
  it('draws each chosen option of a multiple select as a token with its chip', async () => {
    harness = await mountForm({
      input: { statuses: ['active', 'draft'] },
      schema: defineFormSchema({
        actions: [],
        fields: [{ key: 'statuses', options: statuses, props: { multiple: true }, type: 'select' }],
      }),
    })

    const tokens = harness.field('statuses').findAll('[data-form-option-token]')
    expect(tokens.map((token) => token.text())).toEqual(['Actif', 'Brouillon'])
    for (const token of tokens) {
      expect(token.find('[data-form-option-leading="chip"]').exists()).toBe(true)
    }
  })

  it('shows the placeholder, not tokens, while a multiple select is empty', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [
          {
            key: 'statuses',
            options: statuses,
            placeholder: 'Choisir des statuts',
            props: { multiple: true },
            type: 'select',
          },
        ],
      }),
    })

    const control = harness.field('statuses').find('[data-ui-trigger]')
    expect(control.find('[data-form-option-tokens]').exists()).toBe(false)
    expect(control.text()).toBe('Choisir des statuts')
  })

  it('draws the visual of each option in the tags of a multiple auto-complete', async () => {
    harness = await mountForm({
      input: { statuses: ['active', 'pending'] },
      schema: defineFormSchema({
        actions: [],
        fields: [
          { key: 'statuses', options: statuses, props: { multiple: true }, type: 'auto-complete' },
        ],
      }),
    })

    const tags = harness.field('statuses').findAll('[data-form-option-token-content]')
    expect(tags.map((tag) => tag.text())).toEqual(['Actif', 'En attente'])
    for (const tag of tags) {
      expect(tag.find('[data-form-option-leading="chip"]').exists()).toBe(true)
    }
  })

  it('draws the icon of each option of a switch group before its label', async () => {
    harness = await mountForm({
      schema: defineFormSchema({
        actions: [],
        fields: [
          {
            key: 'channels',
            options: [
              { icon: 'i-lucide-mail', label: 'E-mail', value: 'email' },
              { label: 'SMS', value: 'sms' },
            ],
            type: 'switch-group',
          },
        ],
      }),
    })

    const field = harness.field('channels')
    expect(field.find('[data-form-option-leading="icon"]').exists()).toBe(true)
    expect(field.text()).toContain('E-mail')
    expect(field.text()).toContain('SMS')
  })

  it('shows the visual of the chosen option on a tree select, and tokens when several are', async () => {
    const regions = [
      {
        children: [
          { chip: { color: 'success' }, label: 'Paris', value: 'paris' },
          { chip: { color: 'warning' }, label: 'Lyon', value: 'lyon' },
        ],
        icon: 'i-lucide-map',
        label: 'France',
        value: 'fr',
      },
    ] as const

    harness = await mountForm({
      input: { city: 'lyon', cities: ['paris', 'lyon'] },
      schema: defineFormSchema({
        actions: [],
        fields: [
          { key: 'city', options: regions, type: 'tree-select' },
          { key: 'cities', options: regions, props: { multiple: true }, type: 'tree-select' },
        ],
      }),
    })

    const single = harness.field('city')
    expect(single.find('[data-form-option-leading="chip"]').exists()).toBe(true)
    expect(single.text()).toContain('Lyon')
    const tokens = harness.field('cities').findAll('[data-form-option-token]')
    expect(tokens.map((token) => token.text())).toEqual(['Paris', 'Lyon'])
  })
})
