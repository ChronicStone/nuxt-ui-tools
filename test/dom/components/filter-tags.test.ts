import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListFilterTags from '#ui-tools/table/components/data-list/data-list-filter-tags.vue'

import { must } from '../../helpers/must'
import { createAccountsSchema, STATUS_COLOR } from '../fixtures/accounts'
import { mountLoaded, texts } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

function mountTags(
  options: Partial<Parameters<typeof mountLoaded>[0]> & { tagProps?: Record<string, unknown> } = {},
) {
  return mountLoaded({
    schema: createAccountsSchema(),
    ...options,
    render: () => h(DataListFilterTags, { showAdd: true, showClear: true, ...options.tagProps }),
  })
}

describe('filter tags bar', () => {
  it('renders dormant tags dashed and the add-filter trigger', async () => {
    harness = await mountTags()
    const w = harness.wrapper
    expect(w.find('.nut-dl-tags').classes()).toContain('contents')
    const dormant = w.find('.nut-dl-tag--dormant')
    expect(dormant.exists()).toBeTruthy()
    expect(dormant.text()).toBe('Statut')
    expect(dormant.classes()).toContain('border-dashed')
    expect(dormant.attributes('data-variant')).toBe('ghost')
    expect(dormant.find('[data-ui="UIcon"]').exists()).toBeTruthy()
    expect(w.find('.nut-dl-tag--active').exists()).toBeFalsy()
    const add = w.find('.nut-dl-tag--add')
    expect([add.attributes('data-label'), add.attributes('data-icon')]).toStrictEqual([
      'Ajouter un filtre',
      'i-lucide-plus',
    ])
    expect(add.classes()).toContain('border-dashed')
    expect(w.find('.nut-dl-tag--clear').exists()).toBeFalsy()
  })

  it('renders active tags as plain text entries with colour dots', async () => {
    harness = await mountTags({
      schema: createAccountsSchema({ statusDefault: ['active', 'pending'] }),
    })
    const w = harness.wrapper
    const active = w.find('.nut-dl-tag--active')
    expect(active.exists()).toBeTruthy()
    expect([active.find('.nut-dl-tag__label').text(), texts(w, '.nut-dl-tag__text')]).toStrictEqual(
      ['Statut', ['Actif', 'En attente']],
    )
    const dots = w.findAll('.nut-dl-tag__dot')
    expect(dots).toHaveLength(2)
    expect(must(dots[0]).attributes('style')).toContain(STATUS_COLOR.active)
    expect(w.find('.nut-dl-tag__sep').exists()).toBeFalsy()
    expect(w.find('[data-ui="UBadge"]').exists()).toBeFalsy()
    const dismiss = w.find('.nut-dl-tag__dismiss')
    expect([dismiss.attributes('data-icon'), dismiss.attributes('aria-label')]).toStrictEqual([
      'i-lucide-chevron-down',
      'Statut',
    ])
    expect(w.find('.nut-dl-tag--clear').exists()).toBeFalsy()
  })

  it('promotes dynamic filters into removable tags and offers a reset', async () => {
    harness = await mountTags()
    harness.internals.filters.setOptionFilterValues({ key: 'country', values: ['FR', 'DE'] })
    await harness.flush()
    const w = harness.wrapper
    const active = w.find('.nut-dl-tag--active')
    expect([
      [active.find('.nut-dl-tag__label').text(), texts(active, '.nut-dl-tag__text')],
      active.findAll('.nut-dl-tag__sep').length,
    ]).toStrictEqual([['Pays', ['FR', 'DE']], 1])
    expect(active.find('[data-label="parmi"]').exists()).toBeTruthy()
    expect(active.find('[data-label="parmi"]').attributes('data-trailing-icon')).toBe(
      'i-lucide-chevron-down',
    )
    const dismiss = active.find('.nut-dl-tag__dismiss')
    expect([
      dismiss.attributes('data-icon'),
      w.find('.nut-dl-tag--clear').attributes('data-icon'),
      w.find('.nut-dl-tag--clear').text(),
    ]).toStrictEqual(['i-lucide-x', 'i-lucide-rotate-ccw', 'Réinitialiser'])

    await dismiss.trigger('click')
    await harness.flush()
    expect(harness.internals.filters.getFilterState({ key: 'country' })).toBeUndefined()
    await harness.until(() => !must(harness).wrapper.find('.nut-dl-tag--active').exists())

    harness.internals.filters.searchQuery.value = 'abc'
    await harness.flush()
    expect(w.find('.nut-dl-tag--clear').exists()).toBeTruthy()
    await w.find('.nut-dl-tag--clear').trigger('click')
    await harness.flush()
    expect(harness.internals.filters.searchQuery.value).toBe('')
  })

  it('walks the add-filter picker through match mode into an embedded editor', async () => {
    harness = await mountTags()
    const w = harness.wrapper
    await w.find('.nut-dl-tag--add').trigger('click')
    await harness.flush()
    expect(w.find('.nut-dl-picker__title').text()).toBe('Ajouter un filtre')
    expect(w.find('input[data-ui="UInput"]').exists()).toBeFalsy()
    const rows = w.findAll('[data-filter-stage-content] button.rounded-md')
    expect([
      rows.map((row) => row.text()),
      must(rows[0]).find('[data-ui="UIcon"]').attributes('data-name'),
      must(rows[0]!.findAll('[data-ui="UIcon"]').at(-1)).attributes('data-name'),
    ]).toStrictEqual([['Pays', 'Synchronisation EDOF'], 'i-lucide-plus', 'i-lucide-chevron-right'])

    await must(rows[0]).trigger('click')
    await harness.flush()
    expect(harness.internals.filterPresentation.dynamicSessionDefinition.value).toBeUndefined()
    const operators = w.findAll('[data-filter-stage-content] button')
    expect(operators.map((b) => b.text().replaceAll(/\s+/gu, ''))).toStrictEqual([
      'parmiin',
      'est=',
      "n'estpas≠",
    ])
    await must(operators[0]).trigger('click')
    await harness.flush()
    expect([
      harness.internals.filterPresentation.dynamicSessionDefinition.value?.key,
      w.find('.nut-dl-tag--add').attributes('data-label'),
    ]).toStrictEqual(['country', 'Pays'])
    await harness.until(() => must(harness).wrapper.find('.nut-dl-editor__head').exists())
    const head = w.find('.nut-dl-editor__head')
    expect(head.find('.nut-dl-editor__back').exists()).toBeTruthy()
    expect(head.text()).toContain('Pays')
    expect(head.text()).toContain('Effacer')
    await head.find('.nut-dl-editor__back').trigger('click')
    await harness.flush()
    expect(harness.internals.filterPresentation.dynamicSessionDefinition.value).toBeUndefined()
  })

  it('offers facet-only remote values in the dynamic filter editor', async () => {
    harness = await mountTags({ schema: createAccountsSchema({ embeddedFacets: true }) })
    const w = harness.wrapper

    await w.find('.nut-dl-tag--add').trigger('click')
    await harness.flush()
    await must(
      w
        .findAll('[data-filter-stage-content] button.rounded-md')
        .find((row) => row.text() === 'Pays'),
    ).trigger('click')
    await harness.flush()
    await must(w.findAll('[data-filter-stage-content] button')[0]).trigger('click')
    await harness.until(() => must(harness).wrapper.find('.nut-dl-editor__head').exists())

    expect(texts(w, '.nut-dl-option')).toStrictEqual(['FR20', 'DE20', 'ES20'])
  })

  it('applies filter tag props and add-filter picker options from the config layer', async () => {
    harness = await mountTags({
      schema: createAccountsSchema({ statusDefault: ['active'] }),
      ui: {
        addFilter: {
          props: { icon: 'kind', search: true, title: false, trigger: { label: 'Filtre' } },
        },
        filterTags: {
          props: { icon: false, trigger: { variant: 'outline' } },
          ui: { activeRoot: 'active-x', addTrigger: 'add-x', value: 'value-x' },
        },
      },
    })
    const w = harness.wrapper
    expect(w.find('.nut-dl-tag--active').classes()).toContain('active-x')
    expect(w.find('.nut-dl-tag__value').classes()).toContain('value-x')
    expect(w.find('.nut-dl-tag__label [data-ui="UIcon"]').exists()).toBeFalsy()
    const add = w.find('.nut-dl-tag--add')
    expect(add.attributes('data-label')).toBe('Filtre')
    expect(add.classes()).toContain('add-x')
    await add.trigger('click')
    await harness.flush()
    expect(w.find('.nut-dl-picker__title').exists()).toBeFalsy()
    expect(
      w.find('[data-filter-stage-content] input[data-ui="UInput"]').attributes('placeholder'),
    ).toBe('Rechercher des filtres...')
    const rowIcons = w.findAll(
      '[data-filter-stage-content] button.rounded-md [data-ui="UIcon"]:first-child',
    )
    expect(must(rowIcons[0]).attributes('data-name')).not.toBe('i-lucide-plus')
    await w.find('[data-filter-stage-content] input[data-ui="UInput"]').setValue('edof')
    await harness.flush()
    expect(texts(w, '[data-filter-stage-content] button.rounded-md')).toStrictEqual([
      'Synchronisation EDOF',
    ])
  })

  it('renders nothing when no tag or dynamic filters exist', async () => {
    const schema = createAccountsSchema()
    must(schema.filters).ui = []
    harness = await mountTags({ schema })
    expect(harness.wrapper.find('.nut-dl-tags').exists()).toBeFalsy()
  })
})

describe('mobile filter sheet', () => {
  it('replaces the tags with a bottom sheet listing every filter', async () => {
    harness = await mountTags({
      breakpoint: 'sm',
      schema: createAccountsSchema({ statusDefault: ['active'] }),
    })
    const w = harness.wrapper
    expect(w.find('.nut-dl-tag--dormant').exists()).toBeFalsy()
    const trigger = w.find('.nut-dl-sheet-trigger')
    expect(trigger.text()).toBe('')
    expect(trigger.attributes('data-icon')).toBe('i-lucide-funnel')
    expect(trigger.attributes('aria-label')).toBe('Filtres')
    expect(trigger.find('[data-ui="UBadge"]').exists()).toBeFalsy()
    expect(w.find('[data-ui="UDrawer"]').attributes('data-open')).toBe('false')

    await trigger.trigger('click')
    await harness.flush()
    expect(w.find('.nut-dl-sheet__title').text()).toBe('Filtres')
    const rows = w.findAll('.nut-dl-sheet__row')
    expect(rows.map((row) => row.find('.flex-1').text())).toStrictEqual([
      'Statut',
      'Pays',
      'Synchronisation EDOF',
    ])
    expect(must(rows[0]).find('.nut-dl-sheet__value').text()).toContain('Actif')
    expect(must(rows[0]).find('.nut-dl-sheet__value .rounded-full').attributes('style')).toContain(
      STATUS_COLOR.active,
    )
    expect([
      must(rows[1]).find('.nut-dl-sheet__value').text(),
      w.find('.nut-dl-sheet__footer button:last-child').text(),
    ]).toStrictEqual(['', 'Terminé'])
    expect(w.find('.nut-dl-sheet__footer button:first-child').attributes('disabled')).toBeDefined()

    await must(rows[1]).trigger('click')
    await harness.flush()
    const detail = w.find('.nut-dl-sheet__detail')
    expect(detail.exists()).toBeTruthy()
    expect(detail.text()).toContain('Pays')
    expect(detail.find('button.text-primary').attributes('disabled')).toBeDefined()
    expect(detail.find('.nut-dl-editor__head').exists()).toBeFalsy()
    await detail.find('[data-ui="UButton"][data-icon="i-lucide-arrow-left"]').trigger('click')
    await harness.flush()
    expect(w.find('.nut-dl-sheet__detail').exists()).toBeFalsy()
  })

  it('shows the active count and clears everything from the footer', async () => {
    harness = await mountTags({ breakpoint: 'sm' })
    harness.internals.filters.setOptionFilterValues({ key: 'country', values: ['FR'] })
    harness.internals.filters.searchQuery.value = 'x'
    await harness.flush()
    const w = harness.wrapper
    expect(w.find('.nut-dl-sheet-trigger [data-ui="UBadge"]').attributes('data-label')).toBe('1')
    await w.find('.nut-dl-sheet-trigger').trigger('click')
    await harness.flush()
    await w.find('.nut-dl-sheet__footer button:first-child').trigger('click')
    await harness.flush()
    expect(harness.internals.filters.hasActiveUiFilters.value).toBeFalsy()
    expect(harness.internals.filters.searchQuery.value).toBe('')
  })

  it('keeps inline tags on mobile when asked', async () => {
    harness = await mountTags({ breakpoint: 'sm', tagProps: { mobile: 'tags' } })
    expect(harness.wrapper.find('.nut-dl-sheet-trigger').exists()).toBeFalsy()
    expect(harness.wrapper.find('.nut-dl-tag--dormant').exists()).toBeTruthy()
  })
})
