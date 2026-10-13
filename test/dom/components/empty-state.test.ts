import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import GridRenderer from '#ui-tools/table/components/grid/grid-renderer.vue'
import SummaryRenderer from '#ui-tools/table/components/summary/summary-renderer.vue'
import TableEmptyState from '#ui-tools/table/components/table/table-empty-state.vue'
import TableRenderer from '#ui-tools/table/components/table/table-renderer.vue'

import { must } from '../../helpers/must'
import { createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded } from '../harness'
import type { Harness } from '../harness'
import { localeCode } from '../stubs/nuxt-ui-locale'

/** A label that reads the locale when it is shown, as a consumer's `t(...)` does. */
function text(en: string, fr: string) {
  return () => (localeCode.value === 'en' ? en : fr)
}

let harness: Harness | undefined
afterEach(() => {
  harness?.unmount()
  localeCode.value = 'fr'
})

type MountOptions = Omit<Parameters<typeof mountLoaded>[0], 'render'>

function mountTable(options: MountOptions) {
  return mountLoaded({ ...options, render: () => h(TableRenderer, { height: '400px' }) })
}

function mountGrid(options: MountOptions) {
  return mountLoaded({
    ...options,
    query: { l: 'grid' },
    render: () => h(GridRenderer),
  })
}

function mountSummary(options: MountOptions) {
  return mountLoaded({
    breakpoint: 'sm',
    ...options,
    render: () => h(SummaryRenderer, { height: '400px' }),
  })
}

function emptyOf(mounted: Harness) {
  const empty = mounted.wrapper.find('.nut-dl-empty')
  const action = empty.find('.nut-dl-empty__actions [data-ui="UButton"]')
  const description = empty.find('.nut-dl-empty__description')
  return {
    action: action.exists() ? action.text() : undefined,
    description: description.exists() ? description.text() : undefined,
    icon: empty.find('.nut-dl-empty__icon').attributes('data-name'),
    title: empty.find('.nut-dl-empty__title').text(),
  }
}

describe('first-use empty state', () => {
  const calls: string[] = []
  const schema = (extra: Parameters<typeof createAccountsSchema>[0] = {}) =>
    createAccountsSchema({
      empty: {
        action: { label: 'Créer un compte', onClick: () => calls.push('create') },
        description: 'Les comptes que vous créez apparaîtront ici.',
        icon: 'i-lucide-building-2',
        title: 'Aucun compte pour le moment',
      },
      rows: [],
      ...extra,
    })

  it('invites the first record in the table', async () => {
    calls.length = 0
    harness = await mountTable({ schema: schema() })
    expect(emptyOf(harness)).toStrictEqual({
      action: 'Créer un compte',
      description: 'Les comptes que vous créez apparaîtront ici.',
      icon: 'i-lucide-building-2',
      title: 'Aucun compte pour le moment',
    })
    const action = harness.wrapper.find('.nut-dl-empty__actions [data-ui="UButton"]')
    expect([
      action.attributes('data-color'),
      action.attributes('data-size'),
      action.classes(),
    ]).toStrictEqual(['primary', 'md', expect.arrayContaining(['nut-dl-empty__action'])])
    await action.trigger('click')
    expect(calls).toStrictEqual(['create'])
  })

  it('invites the first record in the grid', async () => {
    calls.length = 0
    harness = await mountGrid({ schema: schema() })
    const empty = harness.wrapper.find('.nut-dl-grid__state .nut-dl-empty')
    expect(empty.exists()).toBeTruthy()
    expect(emptyOf(harness).title).toBe('Aucun compte pour le moment')
    await empty.find('.nut-dl-empty__actions [data-ui="UButton"]').trigger('click')
    expect(calls).toStrictEqual(['create'])
  })

  it('invites the first record in summary rows', async () => {
    calls.length = 0
    harness = await mountSummary({ schema: schema({ summary: true }) })
    expect(harness.wrapper.find('.nut-dl-summary__state .nut-dl-empty').exists()).toBeTruthy()
    expect(emptyOf(harness).action).toBe('Créer un compte')
    await harness.wrapper.find('.nut-dl-empty__actions [data-ui="UButton"]').trigger('click')
    expect(calls).toStrictEqual(['create'])
  })

  it('passes any button prop through, including a link target', async () => {
    harness = await mountTable({
      schema: createAccountsSchema({
        empty: {
          action: {
            color: 'neutral',
            icon: 'i-lucide-plus',
            label: 'Nouveau compte',
            size: 'lg',
            to: '/accounts/new',
            variant: 'outline',
          },
        },
        rows: [],
      }),
    })
    const action = harness.wrapper.find('.nut-dl-empty__actions [data-ui="UButton"]')
    expect([
      action.text(),
      action.attributes('data-icon'),
      action.attributes('data-color'),
      action.attributes('data-size'),
      action.attributes('data-variant'),
      action.attributes('to'),
    ]).toStrictEqual([
      'Nouveau compte',
      'i-lucide-plus',
      'neutral',
      'lg',
      'outline',
      '/accounts/new',
    ])
  })

  it('keeps the localized default for what the schema leaves out', async () => {
    harness = await mountTable({
      schema: createAccountsSchema({ empty: { title: 'Aucun compte' }, rows: [] }),
    })
    expect(emptyOf(harness)).toMatchObject({
      action: undefined,
      icon: 'i-lucide-inbox',
      title: 'Aucun compte',
    })
    expect(emptyOf(harness).description).toContain('apparaîtront ici')
  })

  it('reads the title, description and label lazily, so they follow the locale', async () => {
    localeCode.value = 'en'
    harness = await mountTable({
      schema: createAccountsSchema({
        empty: {
          action: { label: text('Create an account', 'Créer un compte') },
          description: text('Accounts you create show up here.', 'Vos comptes apparaîtront ici.'),
          title: text('No accounts yet', 'Aucun compte'),
        },
        rows: [],
      }),
    })
    expect(emptyOf(harness)).toMatchObject({
      action: 'Create an account',
      description: 'Accounts you create show up here.',
      title: 'No accounts yet',
    })
    localeCode.value = 'fr'
    await harness.flush()
    expect(emptyOf(harness)).toMatchObject({
      action: 'Créer un compte',
      description: 'Vos comptes apparaîtront ici.',
      title: 'Aucun compte',
    })
  })

  it('hides the second line on `description: false`', async () => {
    harness = await mountTable({
      schema: createAccountsSchema({
        empty: { action: { label: 'Créer' }, description: false },
        rows: [],
      }),
    })
    const empty = harness.wrapper.find('.nut-dl-empty')
    expect(empty.find('.nut-dl-empty__description').exists()).toBeFalsy()
    expect(empty.find('.nut-dl-empty__actions').exists()).toBeTruthy()
  })

  it('layers the schema over the app configuration, field by field', async () => {
    harness = await mountTable({
      schema: createAccountsSchema({ empty: { title: 'Aucun compte' }, rows: [] }),
      ui: {
        table: {
          props: {
            empty: {
              action: { label: 'Importer' },
              description: false,
              icon: 'i-lucide-ghost',
              title: 'Vide',
            },
          },
        },
      },
    })
    expect(emptyOf(harness)).toStrictEqual({
      action: 'Importer',
      description: undefined,
      icon: 'i-lucide-ghost',
      title: 'Aucun compte',
    })
  })

  it('offers the reset, never the first-use action, while filters hide every record', async () => {
    calls.length = 0
    harness = await mountTable({ schema: schema({ rows: undefined }) })
    harness.internals.filters.searchQuery.value = 'zzz'
    await harness.until(() => must(harness).wrapper.find('.nut-dl-empty').exists())
    expect(emptyOf(harness)).toMatchObject({
      action: 'Réinitialiser les filtres',
      icon: 'i-lucide-search-x',
      title: 'Aucun résultat pour ces filtres',
    })
    expect(harness.wrapper.findAll('.nut-dl-empty__actions [data-ui="UButton"]')).toHaveLength(1)
    await harness.wrapper.find('.nut-dl-empty__actions [data-ui="UButton"]').trigger('click')
    await harness.until(() => !must(harness).wrapper.find('.nut-dl-empty').exists())
    expect(harness.internals.filters.searchQuery.value).toBe('')
    expect(calls).toStrictEqual([])
  })

  it('merges the touch-target class of `ui.table.ui.emptyAction` onto both buttons', async () => {
    harness = await mountTable({
      schema: schema(),
      ui: { table: { ui: { emptyAction: 'action-x' } } },
    })
    expect(
      harness.wrapper.find('.nut-dl-empty__actions [data-ui="UButton"]').classes(),
    ).toStrictEqual(expect.arrayContaining(['nut-dl-empty__action', 'action-x']))
    harness.unmount()

    harness = await mountTable({
      schema: createAccountsSchema(),
      ui: { table: { ui: { emptyAction: 'action-x' } } },
    })
    harness.internals.filters.searchQuery.value = 'zzz'
    await harness.until(() => must(harness).wrapper.find('.nut-dl-empty').exists())
    expect(
      harness.wrapper.find('.nut-dl-empty__actions [data-ui="UButton"]').classes(),
    ).toStrictEqual(expect.arrayContaining(['nut-dl-empty__action', 'action-x']))
  })

  it('lets the `actions` slot replace the buttons', async () => {
    harness = await mountLoaded({
      render: () =>
        h(TableEmptyState, null, {
          actions: () => h('a', { class: 'custom' }, 'Importer un fichier'),
        }),
      schema: schema(),
    })
    const actions = harness.wrapper.find('.nut-dl-empty__actions')
    expect(actions.find('a.custom').text()).toBe('Importer un fichier')
    expect(actions.find('[data-ui="UButton"]').exists()).toBeFalsy()
  })
})
