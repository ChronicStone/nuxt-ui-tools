import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import { defineTableSchema, tableSource } from '#ui-tools/table'
import TableRenderer from '#ui-tools/table/components/table/table-renderer.vue'

import { createAuditSchema } from '../../dom/fixtures/accounts'
import { mountDataList, mountLoaded } from '../../dom/harness'
import type { Harness } from '../../dom/harness'
import { must } from '../../helpers/must'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

function frame() {
  return h('div', { style: { display: 'flex', flexDirection: 'column', height: '520px' } }, [
    h(TableRenderer, { class: 'min-h-0 flex-1', fill: true }),
  ])
}

async function centerOffset(harness: Harness, selector: string) {
  const w = harness.wrapper
  await Promise.all(
    must(w.find(selector).element)
      .getAnimations({ subtree: true })
      .map((animation) => animation.finished),
  )
  const scroll = w.find('.nut-dl-table__scroll').element.getBoundingClientRect()
  const head = w.find('thead').element.getBoundingClientRect()
  const state = must(w.find(selector).element)
  const first = must(state.firstElementChild).getBoundingClientRect()
  const last = must(state.lastElementChild).getBoundingClientRect()
  const bodyCenter = (head.bottom + scroll.bottom) / 2
  const contentCenter = (first.top + last.bottom) / 2
  return {
    bottomGap: Math.round(scroll.bottom - state.getBoundingClientRect().bottom),
    offset: Math.abs(contentCenter - bodyCenter),
  }
}

describe('table states in fill mode', () => {
  it('centers the empty state in the body below the header', async () => {
    harness = await mountLoaded({ render: frame, schema: createAuditSchema({ total: 0 }) })
    await harness.until(() => harness!.wrapper.find('.nut-dl-empty').exists(), 4000)

    expect(await centerOffset(harness, '.nut-dl-empty')).toStrictEqual({
      bottomGap: 0,
      offset: expect.closeTo(0, 0),
    })
  })

  it('centers the error state in the body below the header', async () => {
    const schema = defineTableSchema({
      rowKey: 'id',
      source: tableSource({
        mode: 'client',
        query: () => ({
          queryFn: async () => {
            throw new Error('unavailable')
          },
          queryKey: ['failing-list'],
        }),
      }),
      table: { columns: (column) => [column.field('name', { label: 'Name' })] },
      tableKey: 'failing-list',
    })
    harness = await mountDataList({ render: frame, schema })
    await harness.until(() => harness!.wrapper.find('.nut-dl-error').exists(), 4000)

    expect(await centerOffset(harness, '.nut-dl-error')).toStrictEqual({
      bottomGap: 0,
      offset: expect.closeTo(0, 0),
    })
  })
})
