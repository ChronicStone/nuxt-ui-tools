import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import { defineTableSchema, tableSource } from '#ui-tools/table'
import DataListFilterTags from '#ui-tools/table/components/data-list/data-list-filter-tags.vue'

import { must } from '../../helpers/must'
import { mountLoaded, rows, texts } from '../harness'
import type { Harness } from '../harness'

interface Account {
  id: string
  tagIds: string[]
  manager: string | null
  certification: string | null
}

const ACCOUNTS: Account[] = [
  { certification: 'toeic', id: 'a1', manager: 'Ada', tagIds: ['vip'] },
  { certification: null, id: 'a2', manager: null, tagIds: [] },
  { certification: 'linguaskill', id: 'a3', manager: 'Yaser', tagIds: ['fair'] },
  { certification: null, id: 'a4', manager: null, tagIds: ['vip', 'fair'] },
  { certification: 'toeic', id: 'a5', manager: 'Ada', tagIds: [] },
]

function createSchema() {
  return defineTableSchema({
    filters: {
      ui: (filter) => [
        filter.option('tagIds', {
          behavior: {
            commitMode: 'auto',
            defaultOperator: 'isAnyOf',
            operators: ['isAnyOf', 'isNot'],
          },
          display: { location: 'tag', order: 1 },
          editor: { searchable: true, selection: { mode: 'multiple' } },
          label: 'Tags',
          source: {
            none: { label: 'Sans tag' },
            options: [
              { label: 'VIP', value: 'vip' },
              { label: 'Salon', value: 'fair' },
            ],
          },
        }),
        filter.option('manager', {
          behavior: { commitMode: 'auto', defaultOperator: 'isAnyOf' },
          display: { location: 'tag', order: 2 },
          editor: { row: { showCounts: true }, selection: { mode: 'multiple' } },
          label: 'Responsable',
          source: { facet: 'exclude-self', none: { label: 'Sans responsable' } },
        }),
        filter.option('certification', {
          behavior: { commitMode: 'auto', defaultOperator: 'isAnyOf' },
          display: { location: 'tag', order: 3 },
          editor: {
            presentation: 'tree',
            selection: { mode: 'multiple' },
            tree: { expandedByDefault: true, selectable: 'leaf-only' },
          },
          label: 'Certification',
          source: {
            none: { label: 'Sans certification' },
            options: [
              {
                children: [
                  { label: 'TOEIC', value: 'toeic' },
                  { label: 'Linguaskill', value: 'linguaskill' },
                ],
                label: 'Anglais',
                value: 'english',
              },
            ],
          },
        }),
      ],
    },
    pagination: false,
    rowKey: 'id',
    source: tableSource({
      mode: 'client',
      query: () => ({ queryFn: () => ACCOUNTS, queryKey: ['filter-none-accounts'] }),
    }),
    table: { columns: (column) => [column.field('id', { label: 'Id' })] },
    tableKey: 'filter-none-accounts',
  })
}

let harness: Harness | undefined
afterEach(() => harness?.unmount())

async function mountTags(query?: Record<string, string>) {
  harness = await mountLoaded({
    query,
    render: () => h(DataListFilterTags, { showClear: true }),
    schema: createSchema(),
  })
  return harness
}

async function openEditor(current: Harness, label: string) {
  const tag = must(
    current.wrapper.findAll('.nut-dl-tag').find((node) => node.text().startsWith(label)),
  )
  const trigger =
    tag.element.tagName === 'BUTTON' ? tag.element : tag.element.querySelector('button')
  must(trigger).dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await current.flush()
  // A filter with several operators opens on its match mode first.
  const anyOf = current.wrapper
    .findAll('[data-filter-stage-content] button')
    .find((button) => button.text().startsWith('parmi'))
  if (anyOf) await anyOf.trigger('click')
  await current.until(() => current.wrapper.find('.nut-dl-editor__head, input').exists())
  await current.flush()
}

const ids = (current: Harness) => rows<Account>(current).map((row) => row.id)
const optionLabels = (current: Harness) => texts(current.wrapper, '.nut-dl-option')

describe('source.none option', () => {
  it('leads the list in its own section and filters rows with no value', async () => {
    const current = await mountTags()
    await openEditor(current, 'Tags')
    expect(optionLabels(current)).toStrictEqual(['Sans tag', 'VIP', 'Salon'])
    const none = must(current.wrapper.findAll('.nut-dl-option')[0])
    expect(none.find('[data-ui="UIcon"]').attributes('data-name')).toBe('i-lucide-circle-slash')
    expect(none.element.nextElementSibling?.className).toContain('border-t')

    await none.trigger('click')
    await current.flush()
    expect([
      current.internals.filters.getFilterState({ key: 'tagIds' })?.value,
      ids(current),
      current.query()['f.ui.tagIds'],
    ]).toStrictEqual([['~none'], ['a2', 'a5'], '~none'])
  })

  it('ORs with picked values and keeps its row first', async () => {
    const current = await mountTags()
    current.internals.filters.setOptionFilterValues({ key: 'tagIds', values: ['vip', '~none'] })
    await current.flush()
    expect(ids(current)).toStrictEqual(['a1', 'a2', 'a4', 'a5'])
    expect(texts(current.wrapper, '.nut-dl-tag__text')).toStrictEqual(['VIP', 'Sans tag'])

    await openEditor(current, 'Tags')
    expect(optionLabels(current)).toStrictEqual(['Sans tag', 'VIP', 'Salon'])
  })

  it('keeps only rows with a value, none of them picked, under isNot', async () => {
    const current = await mountTags()
    current.internals.filters.setOptionFilterValues({
      key: 'tagIds',
      operator: 'isNot',
      values: ['vip', '~none'],
    })
    await current.flush()
    expect(ids(current)).toStrictEqual(['a3'])
  })

  it('keeps the none row while the search matches its own label only', async () => {
    const current = await mountTags()
    await openEditor(current, 'Tags')
    const input = current.wrapper.find('input')
    await input.setValue('sa')
    await current.flush()
    expect(optionLabels(current)).toStrictEqual(['Sans tag', 'Salon'])
    await input.setValue('vip')
    await current.flush()
    expect(optionLabels(current)).toStrictEqual(['VIP'])
  })

  it('shows the facet missing count on the none row', async () => {
    const current = await mountTags()
    await openEditor(current, 'Responsable')
    await current.until(() => optionLabels(current)[0]?.startsWith('Sans responsable') ?? false)
    expect(optionLabels(current)).toStrictEqual(['Sans responsable2', 'Ada2', 'Yaser1'])
  })

  it('reads ~none back from the URL and labels the chip', async () => {
    const current = await mountTags({ 'f.ui.tagIds': '~none,fair' })
    expect([
      current.internals.filters.getFilterState({ key: 'tagIds' })?.value,
      ids(current),
      texts(current.wrapper, '.nut-dl-tag__text'),
    ]).toStrictEqual([
      ['~none', 'fair'],
      ['a2', 'a3', 'a4', 'a5'],
      ['Sans tag', 'Salon'],
    ])
  })

  it('leads the tree presentation with the none leaf and a divider', async () => {
    const current = await mountTags()
    await openEditor(current, 'Certification')
    const treeRows = current.wrapper.findAll(
      '[data-filter-stage-content] .rounded-md, .grid > .rounded-md',
    )
    const labels = treeRows.map((row) => row.text().trim())
    expect(labels.slice(0, 2)).toStrictEqual(['Sans certification', 'Anglais'])
    expect(must(treeRows[0]).element.nextElementSibling?.className).toContain('border-t')

    must(treeRows[0]).element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await current.flush()
    expect(ids(current)).toStrictEqual(['a2', 'a4'])
  })
})
