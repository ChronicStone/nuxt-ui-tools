import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListFilterPanel from '#ui-tools/table/components/data-list/data-list-filter-panel.vue'

import { must } from '../../helpers/must'
import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded, texts } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

async function mountPanel(
  options: Partial<Parameters<typeof mountLoaded>[0]> & {
    panelProps?: Record<string, unknown>
    open?: boolean
  } = {},
) {
  const mounted = await mountLoaded({
    schema: createAccountsSchema({ panelFilters: true }),
    ...options,
    render: () => h(DataListFilterPanel, options.panelProps),
  })
  if (options.open !== false) {
    mounted.internals.filterPresentation.openPanel()
    await mounted.flush()
  }
  return mounted
}

describe('filter slideover trigger', () => {
  it('renders the trigger with icon, label and an active count badge', async () => {
    harness = await mountPanel({ open: false })
    const trigger = harness.wrapper.find('.nut-dl-fpanel-trigger')
    expect([
      trigger.attributes('data-icon'),
      trigger.attributes('data-variant'),
      trigger.attributes('aria-expanded'),
      trigger.text(),
    ]).toStrictEqual(['i-lucide-funnel', 'outline', 'false', 'Filtres'])
    expect(trigger.find('.nut-dl-fpanel-trigger__count').exists()).toBeFalsy()
    expect(harness.wrapper.find('[data-ui="USlideover"]').attributes('data-open')).toBe('false')

    harness.internals.filters.replaceFilters({
      rules: [{ key: 'country', operator: 'isAnyOf', value: ['FR'] }],
    })
    await harness.flush()
    expect(harness.wrapper.find('.nut-dl-fpanel-trigger__count').attributes('data-label')).toBe('1')
  })

  it('uses a labelled icon trigger on mobile', async () => {
    harness = await mountPanel({ breakpoint: 'sm', open: false })
    const trigger = harness.wrapper.find('.nut-dl-fpanel-trigger')
    expect([trigger.text(), trigger.attributes('aria-label'), trigger.attributes('data-square')]).toStrictEqual([
      '',
      'Filtres',
      'true',
    ])
    expect(trigger.find('.nut-dl-fpanel-trigger__content').exists()).toBeFalsy()
  })

  it('is not rendered without panel filters', async () => {
    harness = await mountLoaded({
      render: () => h(DataListFilterPanel),
      schema: createAccountsSchema(),
    })
    expect(harness.wrapper.find('.nut-dl-fpanel-trigger').exists()).toBeFalsy()
  })
})

describe('filter slideover content', () => {
  it('opens with a title, result count, captioned sections and typed fields', async () => {
    harness = await mountPanel()
    const w = harness.wrapper
    const panel = w.find('[data-ui="USlideover"]')
    expect([panel.attributes('data-open'), panel.attributes('data-side')]).toStrictEqual([
      'true',
      'right',
    ])
    expect(panel.attributes('data-slot-content')).toContain('max-w-[480px]')
    expect([
      w.find('.nut-dl-fpanel__title').text(),
      w.find('.nut-dl-fpanel__results').text(),
      w.find('.nut-dl-fpanel__close').attributes('aria-label'),
      texts(w, '.nut-dl-fpanel__caption'),
      texts(w, '.nut-dl-fpanel__label'),
      w.find('.nut-dl-fpanel__matching').text(),
      w.find('.nut-dl-fpanel__reset').attributes('data-label'),
    ]).toStrictEqual([
      'Filtres',
      '60 résultats',
      'Fermer',
      ['Identité', 'Volumes'],
      ['Pays', 'Entité légale', 'Contrats'],
      '60 résultats correspondent',
      'Réinitialiser',
    ])
    expect(w.find('.nut-dl-fpanel__reset').attributes('disabled')).toBeDefined()
    expect([
      w.find('.nut-dl-fpanel__apply').attributes('data-label'),
      w.find('.nut-dl-fpanel__apply').attributes('data-color'),
      w.find('input[data-ui="UInput"]').attributes('placeholder'),
    ]).toStrictEqual(['Appliquer', 'primary', 'Entité…'])
    expect(w.find('input[data-ui="UInputNumber"]').exists()).toBeTruthy()
  })

  it('renders option filters as chips with counts and drafts until apply', async () => {
    harness = await mountPanel()
    const w = harness.wrapper
    const chips = w.findAll('.nut-dl-chip')
    expect([
      chips.map((chip) => chip.find('.nut-dl-chip__label').text()),
      chips.map((chip) => chip.find('.nut-dl-chip__count').text()),
      must(chips[0]).attributes('aria-pressed'),
    ]).toStrictEqual([['FR', 'DE', 'ES'], ['20', '20', '20'], 'false'])
    expect(w.find('.nut-dl-fpanel__meta').exists()).toBeFalsy()

    await must(chips[0]).trigger('click')
    await harness.flush()
    expect(w.find('.nut-dl-chip[data-value="FR"]').classes()).toContain('nut-dl-chip--active')
    expect([
      [
        w.find('.nut-dl-chip[data-value="FR"]').attributes('aria-pressed'),
        w.find('.nut-dl-fpanel__meta').text(),
        w.find('.nut-dl-fpanel__field').attributes('data-active'),
      ],
      harness.internals.filters.getFilterState({ key: 'country' }),
      w.find('.nut-dl-fpanel__reset').attributes('disabled'),
    ]).toStrictEqual([['true', '1 sélectionnés', 'true'], undefined, undefined])

    await w.find('.nut-dl-chip[data-value="DE"]').trigger('click')
    await harness.flush()
    expect(w.find('.nut-dl-fpanel__meta').text()).toBe('2 sélectionnés')
    await w.find('.nut-dl-fpanel__apply').trigger('click')
    await harness.flush()
    expect(harness.internals.filterPresentation.panelOpen.value).toBeFalsy()
    expect([
      harness.internals.filters.getFilterState({ key: 'country' })?.value,
      harness.internals.queryContent.data.value.rowCount,
      w.find('.nut-dl-fpanel-trigger__count').attributes('data-label'),
    ]).toStrictEqual([['FR', 'DE'], 40, '1'])
  })

  it('edits text and number fields and resets the draft', async () => {
    harness = await mountPanel()
    const w = harness.wrapper
    await w.find('input[data-ui="UInput"]').setValue('Entité 1')
    await harness.flush()
    expect(
      harness.internals.filterPresentation.getPanelDraftFilterState({ key: 'legalEntity' }),
    ).toMatchObject({ operator: 'contains', value: 'Entité 1' })
    await w.find('input[data-ui="UInputNumber"]').setValue('3')
    await harness.flush()
    expect(
      harness.internals.filterPresentation.getPanelDraftFilterState({ key: 'contracts' }),
    ).toMatchObject({ operator: 'is', value: 3 })
    await w.find('.nut-dl-fpanel__reset').trigger('click')
    await harness.flush()
    expect(
      harness.internals.filterPresentation.getPanelDraftFilterState({ key: 'legalEntity' }),
    ).toBeUndefined()
    expect(
      harness.internals.filterPresentation.getPanelDraftFilterState({ key: 'contracts' }),
    ).toBeUndefined()
    expect((w.find('input[data-ui="UInput"]').element as HTMLInputElement).value).toBe('')
  })

  it('commits live and swaps the primary action to done', async () => {
    harness = await mountPanel({ panelProps: { commitMode: 'live' } })
    const w = harness.wrapper
    expect(w.find('.nut-dl-fpanel__apply').attributes('data-label')).toBe('Terminé')
    await w.find('.nut-dl-chip[data-value="ES"]').trigger('click')
    await harness.flush()
    expect([
      harness.internals.filters.getFilterState({ key: 'country' })?.value,
      harness.internals.queryContent.data.value.rowCount,
      w.find('.nut-dl-fpanel__matching').text(),
      w.find('.nut-dl-fpanel__results').text(),
      w.find('.nut-dl-chip[data-value="ES"] .nut-dl-chip__count').text(),
    ]).toStrictEqual([['ES'], 20, '20 résultats correspondent', '20 résultats', '20'])
    await w.find('.nut-dl-fpanel__apply').trigger('click')
    await harness.flush()
    expect(harness.internals.filterPresentation.panelOpen.value).toBeFalsy()
    expect(harness.internals.filters.getFilterState({ key: 'country' })?.value).toStrictEqual([
      'ES',
    ])
  })

  it('closes from the header button and reopens with the committed state', async () => {
    harness = await mountPanel()
    await harness.wrapper.find('.nut-dl-fpanel__close').trigger('click')
    await harness.flush()
    expect(harness.internals.filterPresentation.panelOpen.value).toBeFalsy()
    harness.internals.filters.replaceFilters({
      rules: [{ key: 'country', operator: 'isAnyOf', value: ['DE'] }],
    })
    await harness.flush()
    await harness.wrapper.find('.nut-dl-fpanel-trigger').trigger('click')
    await harness.flush()
    expect(harness.internals.filterPresentation.panelOpen.value).toBeTruthy()
    expect(harness.wrapper.find('.nut-dl-chip[data-value="DE"]').classes()).toContain(
      'nut-dl-chip--active',
    )
  })

  it('renders inline in panel mode with the same footer', async () => {
    harness = await mountPanel({ open: false, panelProps: { mode: 'panel' } })
    const w = harness.wrapper
    expect(w.find('[data-ui="USlideover"]').exists()).toBeFalsy()
    expect(w.find('.nut-dl-fpanel--inline').exists()).toBeTruthy()
    expect(harness.internals.filterPresentation.panelOpen.value).toBeTruthy()
    expect(texts(w, '.nut-dl-fpanel__label')).toStrictEqual(['Pays', 'Entité légale', 'Contrats'])
    expect(w.find('.nut-dl-fpanel__apply').exists()).toBeTruthy()
    harness.unmount()
    harness = await mountPanel({ open: false, panelProps: { commitMode: 'live', mode: 'panel' } })
    expect(harness.wrapper.find('.nut-dl-fpanel__apply').exists()).toBeFalsy()
    expect(harness.wrapper.find('.nut-dl-fpanel__matching').exists()).toBeTruthy()
  })

  it('applies props and ui layers, including the chip threshold', async () => {
    harness = await mountPanel({
      panelProps: {
        description: 'Affinez la liste.',
        props: { clear: { variant: 'link' } },
        ui: { title: 'title-x' },
      },
      ui: {
        filterPanel: {
          props: {
            apply: { color: 'neutral' },
            chips: 2,
            count: false,
            trigger: { label: 'Affiner', variant: 'soft' },
          },
          size: 'sm',
          ui: { chip: 'chip-x', content: 'content-x', field: 'field-x', sectionTitle: 'cap-x' },
        },
      },
    })
    const w = harness.wrapper
    const trigger = w.find('.nut-dl-fpanel-trigger')
    expect([
      trigger.attributes('data-variant'),
      trigger.attributes('data-size'),
      trigger.text(),
    ]).toStrictEqual(['soft', 'sm', 'Affiner'])
    expect(w.find('[data-ui="USlideover"]').attributes('data-slot-content')).toContain('content-x')
    expect(w.find('.nut-dl-fpanel__title').classes()).toContain('title-x')
    expect(w.find('.nut-dl-fpanel__description').text()).toBe('Affinez la liste.')
    expect(w.find('.nut-dl-fpanel__caption').classes()).toContain('cap-x')
    expect(w.find('.nut-dl-fpanel__field').classes()).toContain('field-x')
    expect(w.find('.nut-dl-chip').exists()).toBeFalsy()
    expect(w.find('[data-ui="UPopover"] [data-ui="UButton"]').exists()).toBeTruthy()
    expect([
      w.find('.nut-dl-fpanel__apply').attributes('data-color'),
      w.find('.nut-dl-fpanel__reset').attributes('data-variant'),
    ]).toStrictEqual(['neutral', 'link'])
    harness.internals.filters.replaceFilters({
      rules: [{ key: 'country', operator: 'isAnyOf', value: ['FR'] }],
    })
    await harness.flush()
    expect(w.find('.nut-dl-fpanel-trigger__count').exists()).toBeFalsy()
  })

  it('hides counts when no facet source backs the options', async () => {
    const schema = createAccountsSchema({ panelFilters: true })
    const country = must(schema.filters!.ui!.find((definition) => definition.key === 'country'))
    Object.assign(country, {
      source: {
        options: (country as unknown as { source: { options: unknown[] } }).source.options,
      },
    })
    harness = await mountPanel({ schema })
    expect(harness.wrapper.findAll('.nut-dl-chip')).toHaveLength(3)
    expect(harness.wrapper.find('.nut-dl-chip__count').exists()).toBeFalsy()
  })

  it('renders boolean filters as two chips', async () => {
    const schema = createAccountsSchema({ panelFilters: true })
    const edof = must(schema.filters!.ui!.find((definition) => definition.key === 'edofSync'))
    edof.display = { group: 'Volumes', location: 'panel', order: 6 }
    Object.assign(edof, { source: { facet: 'exclude-self' } })
    harness = await mountPanel({ schema })
    const w = harness.wrapper
    const field = must(w.findAll('.nut-dl-fpanel__field').at(-1))
    expect(field.find('.nut-dl-fpanel__label').text()).toBe('Synchronisation EDOF')
    const chips = field.findAll('.nut-dl-chip')
    expect([
      chips.map((chip) => chip.find('.nut-dl-chip__label').text()),
      chips.map((chip) => chip.find('.nut-dl-chip__count').text()),
    ]).toStrictEqual([
      ['Oui', 'Non'],
      ['30', '30'],
    ])
    await must(chips[0]).trigger('click')
    await harness.flush()
    expect(
      harness.internals.filterPresentation.getPanelDraftFilterState({ key: 'edofSync' })?.value,
    ).toBeTruthy()
    expect(field.find('.nut-dl-chip[data-value="true"]').classes()).toContain('nut-dl-chip--active')
    await field.find('.nut-dl-chip[data-value="true"]').trigger('click')
    await harness.flush()
    expect(
      harness.internals.filterPresentation.getPanelDraftFilterState({ key: 'edofSync' }),
    ).toBeUndefined()
  })
})
