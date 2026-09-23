import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, reactive } from 'vue'

import { useDashboardFormat } from '#ui-tools/dashboard'
import DashboardStat from '#ui-tools/dashboard/components/dashboard-stat.vue'
import DashboardTotal from '#ui-tools/dashboard/components/dashboard-total.vue'

function withFormat(read: (format: ReturnType<typeof useDashboardFormat>) => unknown) {
  let result: unknown
  mount(
    defineComponent({
      setup() {
        result = read(useDashboardFormat())
        return () => h('div')
      },
    }),
  )
  return result
}

describe('dashboard formats in components', () => {
  it('prints a dash for a missing number, whatever the formatter', () => {
    expect(
      withFormat((format) => [
        format.ratio(null),
        format.percent(undefined),
        format.integer(Number.NaN),
        format.points(null),
        format.currency(null, 'EUR'),
      ]),
    ).toEqual(['—', '—', '—', '—', '—'])
  })

  it('formats currency amounts in whole units, in the dashboard locale', () => {
    expect(withFormat((format) => format.currency(12_345.6, 'EUR'))).toBe('12 346 €')
    expect(
      withFormat((format) => format.currency(12_345.6, 'EUR', { maximumFractionDigits: 2 })),
    ).toBe('12 345,60 €')
  })

  it('shows a dash for a total or a stat without a value', () => {
    const total = mount(DashboardTotal, { props: { label: 'Median', value: null } })
    expect(total.find('b').text()).toBe('—')

    const source = reactive({
      activate() {},
      data: { average: null as number | null },
      error: null,
      id: 'summary',
      refresh: () => Promise.resolve(),
      refreshing: false,
      state: 'ready' as const,
      updatedAt: 0,
    })
    const stat = mount(
      defineComponent({
        render: () =>
          h(DashboardStat<{ average: number | null }>, {
            label: 'Average price',
            source,
            value: (summary) => summary.average,
          }),
      }),
    )
    expect(stat.text()).toContain('Average price')
    expect(stat.text()).toContain('—')
  })
})
