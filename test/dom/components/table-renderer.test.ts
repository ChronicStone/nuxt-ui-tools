import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import TableRenderer from '#ui-tools/table/components/table/TableRenderer.vue'

import { must } from '../../helpers/must'
import { createAccounts, createAccountsSchema, createAuditSchema } from '../fixtures/accounts'
import { mountDataList, mountLoaded, texts } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

const rows60 = createAccounts(60)
function sum(key: 'contracts' | 'consumption') {
  return rows60.reduce((total, row) => total + row[key], 0)
}

async function mountTable(
  options: Parameters<typeof mountDataList>[0] & { tableProps?: Record<string, unknown> },
) {
  const mounted = await mountLoaded({
    ...options,
    render: () => h(TableRenderer, { height: '400px', ...options.tableProps }),
  })
  await mounted.until(
    () => mounted.wrapper.find('.nut-dl-table').attributes('data-loading') === 'false',
  )
  return mounted
}

function cssVar(h: Harness, name: string) {
  return (h.wrapper.find('.nut-dl-table').element as HTMLElement).style.getPropertyValue(name)
}

describe('TableRenderer skeleton and tokens', () => {
  it('renders typed skeleton rows while the first page loads', async () => {
    harness = await mountDataList({
      render: () => h(TableRenderer, { height: '400px' }),
      schema: createAccountsSchema({ delay: 80 }),
      settle: false,
    })
    await harness.flush(1)
    const root = harness.wrapper.find('.nut-dl-table')
    expect(root.attributes('data-loading')).toBe('true')
    const skeletons = harness.wrapper.findAll('tr.nut-dl-row--skeleton')
    expect(skeletons.length).toBeGreaterThanOrEqual(6)
    const first = must(skeletons[0])
    expect(first.attributes('style')).toContain('--nut-dl-i')
    expect(first.find('td:nth-child(1) .nut-dl-skeleton.size-4').exists()).toBeTruthy()
    expect(first.find('td[class*="nut-dl-td"]:nth-child(2) .size-7').exists()).toBeTruthy()
    const cells = first.findAll('td')
    expect(must(cells[2]).find('.rounded-full.size-\\[7px\\]').exists()).toBeTruthy()
    expect(must(cells[4]).find('.nut-dl-skeleton.size-4.rounded-\\[4px\\]').exists()).toBeTruthy()
    expect(must(cells[5]).find('.ml-auto').exists()).toBeTruthy()
    expect(must(cells.at(-1)).text()).toBe('')
    expect(harness.wrapper.find('tfoot').exists()).toBeFalsy()
    expect(harness.wrapper.find('tr.nut-dl-row:not(.nut-dl-row--skeleton)').exists()).toBeFalsy()
  })

  it('exposes size tokens and gutter as CSS variables', async () => {
    harness = await mountTable({ schema: createAccountsSchema() })
    expect(cssVar(harness, '--nut-dl-row-h')).toBe('44px')
    expect(cssVar(harness, '--nut-dl-head-h')).toBe('42px')
    expect(cssVar(harness, '--nut-dl-foot-h')).toBe('40px')
    expect(cssVar(harness, '--nut-dl-cell-x')).toBe('14px')
    expect(cssVar(harness, '--nut-dl-gutter')).toBe('14px')
    expect(cssVar(harness, '--nut-dl-font')).toBe('13px')
    expect(harness.wrapper.find('.nut-dl-table').attributes('data-size')).toBe('md')
    expect(harness.wrapper.find('.nut-dl-table').attributes('data-loading')).toBe('false')
    harness.unmount()

    harness = await mountTable({
      schema: createAccountsSchema(),
      ui: { table: { gutter: 20, size: 'sm' } },
    })
    expect(cssVar(harness, '--nut-dl-row-h')).toBe('36px')
    expect(cssVar(harness, '--nut-dl-gutter')).toBe('20px')
    expect(harness.wrapper.find('.nut-dl-table').attributes('data-size')).toBe('sm')
    harness.unmount()

    harness = await mountTable({
      schema: createAccountsSchema(),
      tableProps: { gutter: 8, size: 'lg' },
    })
    expect(cssVar(harness, '--nut-dl-row-h')).toBe('52px')
    expect(cssVar(harness, '--nut-dl-gutter')).toBe('8px')
  })
})

describe('TableRenderer structure', () => {
  it('renders headers, pinned seams, internal columns and body rows', async () => {
    harness = await mountTable({ schema: createAccountsSchema() })
    const w = harness.wrapper
    expect(texts(w, '.nut-dl-th__label')).toStrictEqual([
      'Nom',
      'Statut',
      'Pays',
      'EDOF',
      'Contrats',
      'Conso.',
    ])
    const select = w.find('th[data-col="__select"]')
    expect(select.classes()).toContain('nut-dl-th--selection')
    expect(select.classes()).toContain('nut-dl-pin--start')
    expect(select.find('input[type="checkbox"]').exists()).toBeTruthy()
    const name = w.find('th[data-col="name"]')
    expect(name.classes()).toStrictEqual(
      expect.arrayContaining(['nut-dl-pin', 'nut-dl-pin--start', 'nut-dl-pin--last-start']),
    )
    expect(name.attributes('style')).toContain('left: 44px')
    expect(name.find('.nut-dl-th__sort').attributes('data-name')).toBe('i-lucide-arrow-up')
    expect(name.find('.nut-dl-th__btn').classes()).toContain('nut-dl-th__btn--sorted')
    expect(w.find('th[data-col="status"] .nut-dl-th__sort').attributes('data-name')).toBe(
      'i-lucide-chevrons-up-down',
    )
    expect(w.find('th[data-col="name"] .nut-dl-rz').exists()).toBeTruthy()
    const actions = w.find('th[data-col="__row-actions"]')
    expect(actions.classes()).toStrictEqual(
      expect.arrayContaining(['nut-dl-th--actions', 'nut-dl-pin--end', 'nut-dl-pin--first-end']),
    )
    expect(actions.attributes('style')).toContain('right: 0px')

    const rows = w.findAll('tr.nut-dl-row:not(.nut-dl-row--skeleton)')
    expect(rows).toHaveLength(20)
    expect(must(rows[0]).attributes('data-row-id')).toBe('acc-1')
    expect(must(rows[0]).attributes('data-index')).toBe('0')
    expect(texts(w, 'td[data-col="name"] b.name').slice(0, 3)).toStrictEqual([
      'Compte 001',
      'Compte 002',
      'Compte 003',
    ])
    expect(texts(w, 'td[data-col="status"]').slice(0, 3)).toStrictEqual([
      'Actif',
      'En attente',
      'Inactif',
    ])
    expect(w.find('td[data-col="contracts"]').classes()).toContain('text-right')
    expect(w.find('td[data-col="contracts"] .nut-dl-td__inner').classes()).toContain('justify-end')
    expect(
      (w.find('td[data-col="country"]').element as HTMLElement).style.getPropertyValue(
        '--nut-dl-lines',
      ),
    ).toBe('2')
    expect(w.find('td[data-col="__row-actions"]').classes()).toContain('nut-dl-td--actions')
    expect(w.find('td[data-col="__row-actions"] .nut-dl-rowbtn').attributes('data-icon')).toBe(
      'i-lucide-ellipsis',
    )
    expect(w.find('.nut-dl-table').attributes('data-virtualized')).toBe('false')
    expect(w.find('colgroup col').attributes('style')).toContain('width: 44px')
  })

  it('reflects column visibility, ellipsis and ui slot classes', async () => {
    harness = await mountTable({
      schema: createAccountsSchema(),
      tableProps: {
        ui: {
          base: 'base-x',
          root: 'root-x',
          tbody: 'tbody-x',
          td: 'td-x',
          tfoot: 'tfoot-x',
          th: 'th-x',
          thead: 'thead-x',
          tr: 'tr-x',
          wrapper: 'wrap-x',
        },
      },
    })
    const w = harness.wrapper
    expect(w.find('.nut-dl-table').classes()).toContain('wrap-x')
    expect(w.find('.nut-dl-table__scroll').classes()).toContain('root-x')
    expect(w.find('table').classes()).toContain('base-x')
    expect(w.find('thead').classes()).toContain('thead-x')
    expect(w.find('tbody').classes()).toContain('tbody-x')
    expect(w.find('th[data-col="name"]').classes()).toContain('th-x')
    expect(w.find('td[data-col="name"]').classes()).toContain('td-x')
    expect(w.find('tr.nut-dl-row').classes()).toContain('tr-x')
    expect(w.find('tfoot').classes()).toContain('tfoot-x')
    expect(w.find('td[data-col="legalEntity"]').exists()).toBeFalsy()

    harness.internals.tableColumns.setVisibility({ columnId: 'legalEntity', visible: true })
    await harness.flush()
    expect(w.find('td[data-col="legalEntity"]').classes()).toContain('nut-dl-td--ellipsis')
    expect(texts(w, '.nut-dl-th__label')).toContain('Entité légale')
  })

  it('sorts from the header menu and marks the sorted header', async () => {
    harness = await mountTable({ schema: createAccountsSchema() })
    const w = harness.wrapper
    const status = w.find('th[data-col="status"]')
    const items = status.findAll('[data-ui-item]')
    expect(items.map((item) => item.text())).toStrictEqual([
      'Trier A → Z',
      'Trier Z → A',
      'Ne plus trier',
      'Épingler à gauche',
      'Épingler à droite',
      'Masquer la colonne',
    ])
    expect(status.find('[data-ui-item-label]').text()).toBe('Statut')
    await must(items[1]).trigger('click')
    await harness.flush()
    expect(harness.internals.tableColumns.getSortState({ columnId: 'status' })).toBe('desc')
    expect(w.find('th[data-col="status"] .nut-dl-th__sort').attributes('data-name')).toBe(
      'i-lucide-arrow-down',
    )
    expect(w.find('th[data-col="name"] .nut-dl-th__btn').classes()).not.toContain(
      'nut-dl-th__btn--sorted',
    )
    expect(w.find('td[data-col="status"]').text()).toBe('En attente')

    await must(w.find('th[data-col="status"]').findAll('[data-ui-item]').at(-1)).trigger('click')
    await harness.flush()
    expect(w.find('th[data-col="status"]').exists()).toBeFalsy()
  })

  it('toggles selection from header and row checkboxes', async () => {
    harness = await mountTable({ schema: createAccountsSchema() })
    const w = harness.wrapper
    await w.find('tr.nut-dl-row td[data-col="__select"] input').trigger('click')
    await harness.flush()
    expect(harness.internals.selection.selectedKeys.value).toStrictEqual(['acc-1'])
    expect(w.find('tr.nut-dl-row').classes()).toContain('nut-dl-row--selected')
    expect(w.find('th[data-col="__select"] input').attributes('data-indeterminate')).toBe('true')

    await w.find('th[data-col="__select"] input').trigger('click')
    await harness.flush()
    expect(harness.internals.selection.selectedCount.value).toBe(60)
    expect(w.findAll('tr.nut-dl-row--selected')).toHaveLength(20)
    await w.find('th[data-col="__select"] input').trigger('click')
    await harness.flush()
    expect(harness.internals.selection.selectedCount.value).toBe(0)
  })

  it('renders row action menus per row', async () => {
    harness = await mountTable({ schema: createAccountsSchema() })
    const cells = harness.wrapper.findAll('td[data-col="__row-actions"]')
    expect(
      must(cells[0])
        .findAll('[data-ui-item]')
        .map((item) => item.text()),
    ).toStrictEqual(['Voir la fiche'])
    expect(
      must(cells[1])
        .findAll('[data-ui-item]')
        .map((item) => item.text()),
    ).toStrictEqual(['Voir la fiche', 'Activer'])
  })

  it('virtualizes long pages', async () => {
    harness = await mountTable({ query: { 'p.size': '50' }, schema: createAccountsSchema() })
    const root = harness.wrapper.find('.nut-dl-table')
    expect(root.attributes('data-virtualized')).toBe('true')
    expect(
      harness.wrapper.findAll('tr.nut-dl-row:not(.nut-dl-row--skeleton)').length,
    ).toBeLessThanOrEqual(50)
  })
})

describe('TableRenderer summaries', () => {
  it('renders the sticky summary row with label, count, derived and async cells', async () => {
    harness = await mountTable({ schema: createAccountsSchema({ rows: rows60 }) })
    const w = harness.wrapper
    const foot = w.find('tfoot.nut-dl-table__foot')
    expect(foot.exists()).toBeTruthy()
    expect(foot.find('td[data-col="name"] .nut-dl-tf__caption').text()).toBe('Total')
    expect(foot.find('td[data-col="name"] .nut-dl-tf__count').text()).toBe('60')
    expect(foot.find('td[data-col="name"]').classes()).toContain('nut-dl-pin--start')
    expect(foot.find('td[data-col="contracts"] .nut-dl-tf__value').text()).toBe(
      String(sum('contracts')),
    )
    expect(foot.find('td[data-col="contracts"]').classes()).toContain('text-right')
    expect(foot.find('td[data-col="status"]').text()).toBe('')
    await harness.until(() => !must(harness).internals.summaries.cell('consumption').loading)
    expect(w.find('tfoot td[data-col="consumption"] .nut-dl-tf__value').text()).toBe(
      `${sum('consumption')} t`,
    )
    expect(w.find('tfoot td[data-col="__select"]').classes()).toContain('nut-dl-tf--selection')
  })

  it('shows a skeleton while an async summary resolves and formats numbers per locale', async () => {
    const schema = createAccountsSchema({ rows: rows60 })
    const column = schema.table?.columns?.find((entry) => entry.key === 'consumption')
    let release: (value: number) => void = () => {}
    if (column) {
      column.summary = { resolve: () => new Promise<number>((resolve) => (release = resolve)) }
    }
    harness = await mountTable({ schema })
    expect(
      harness.wrapper.find('tfoot td[data-col="consumption"] .nut-dl-tf__skeleton').exists(),
    ).toBeTruthy()
    release(1_234_567)
    await harness.until(() =>
      must(harness).wrapper.find('tfoot td[data-col="consumption"] .nut-dl-tf__value').exists(),
    )
    expect(harness.wrapper.find('tfoot td[data-col="consumption"] .nut-dl-tf__value').text()).toBe(
      '1 234 567',
    )
  })

  it('uses a custom label and render function', async () => {
    const schema = createAccountsSchema({ rows: rows60 })
    must(schema.table).summaries = { label: 'Somme', scope: 'page' }
    const column = schema.table?.columns?.find((entry) => entry.key === 'contracts')
    if (column) {
      column.summary = {
        kind: 'sum',
        render: ({ value, scope }) => h('em', { class: 'custom' }, `${String(value)}/${scope}`),
      }
    }
    harness = await mountTable({ schema })
    const foot = harness.wrapper.find('tfoot')
    expect(foot.find('.nut-dl-tf__caption').text()).toBe('Somme')
    expect(foot.find('.nut-dl-tf__count').text()).toBe('20')
    expect(foot.find('td[data-col="contracts"] em.custom').text()).toBe(
      `${rows60.slice(0, 20).reduce((t, r) => t + r.contracts, 0)}/page`,
    )
  })
})

describe('TableRenderer empty state', () => {
  it('renders the plain empty state without rows', async () => {
    harness = await mountTable({ schema: createAccountsSchema({ rows: [] }) })
    const empty = harness.wrapper.find('.nut-dl-empty')
    expect(empty.exists()).toBeTruthy()
    expect(empty.attributes('role')).toBe('status')
    expect(empty.find('.nut-dl-empty__icon').attributes('data-name')).toBe('i-lucide-inbox')
    expect(empty.find('.nut-dl-empty__title').text()).toBe('Rien à afficher pour l’instant')
    expect(empty.find('.nut-dl-empty__description').text()).toContain('apparaîtront ici')
    expect(empty.find('.nut-dl-empty__actions').exists()).toBeFalsy()
    expect(harness.wrapper.find('tfoot').exists()).toBeFalsy()
    expect(harness.wrapper.find('.nut-dl-table').attributes('data-loading')).toBe('false')
  })

  it('renders the filtered empty state with a working reset action', async () => {
    harness = await mountTable({ schema: createAccountsSchema() })
    harness.internals.filters.searchQuery.value = 'zzz'
    await harness.until(() => must(harness).wrapper.find('.nut-dl-empty').exists())
    const empty = harness.wrapper.find('.nut-dl-empty')
    expect(empty.find('.nut-dl-empty__icon').attributes('data-name')).toBe('i-lucide-search-x')
    expect(empty.find('.nut-dl-empty__title').text()).toBe('Aucun résultat pour ces filtres')
    const reset = empty.find('.nut-dl-empty__actions [data-ui="UButton"]')
    expect(reset.attributes('data-label')).toBe('Réinitialiser les filtres')
    expect(reset.attributes('data-icon')).toBe('i-lucide-rotate-ccw')
    await reset.trigger('click')
    await harness.until(() => !must(harness).wrapper.find('.nut-dl-empty').exists())
    expect(harness.internals.filters.searchQuery.value).toBe('')
    expect(harness.wrapper.findAll('tr.nut-dl-row:not(.nut-dl-row--skeleton)')).toHaveLength(20)
  })

  it('honours empty state overrides from the ui config', async () => {
    harness = await mountTable({
      schema: createAccountsSchema({ rows: [] }),
      ui: {
        table: {
          props: { empty: { description: false, icon: 'i-lucide-ghost', title: 'Vide' } },
          ui: { empty: 'empty-x' },
        },
      },
    })
    const empty = harness.wrapper.find('.nut-dl-empty')
    expect(empty.classes()).toContain('empty-x')
    expect(empty.find('.nut-dl-empty__title').text()).toBe('Vide')
    expect(empty.find('.nut-dl-empty__description').exists()).toBeFalsy()
    expect(empty.find('.nut-dl-empty__icon').attributes('data-name')).toBe('i-lucide-ghost')
  })
})

describe('TableRenderer cursor mode', () => {
  it('auto-loads following pages when every row fits and shows a loading-more row meanwhile', async () => {
    harness = await mountTable({
      schema: createAuditSchema({ delay: 60, pageSize: 20, total: 45 }),
    })
    await harness.until(() => must(harness).wrapper.find('.nut-dl-row--loading-more').exists())
    expect(harness.wrapper.find('.nut-dl-loading-more').text()).toBe('Chargement…')
    expect(harness.wrapper.find('.nut-dl-loading-more .nut-dl-spinner').exists()).toBeTruthy()
    await harness.until(() => must(harness).internals.pagination.loadedCount.value === 45, 4000)
    await harness.until(() => !must(harness).wrapper.find('.nut-dl-row--loading-more').exists())
    expect(harness.wrapper.find('.nut-dl-table').attributes('data-virtualized')).toBe('true')
    expect(harness.internals.pagination.canNextPage.value).toBeFalsy()
  })
})
