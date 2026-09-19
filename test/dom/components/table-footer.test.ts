import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListPagination from '#ui-tools/table/components/data-list/DataListPagination.vue'

import { createAccountsSchema, createAuditSchema } from '../fixtures/accounts'
import { mountDataList, mountLoaded, type Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

const mountFooter = (options: Partial<Parameters<typeof mountLoaded>[0]> & { footerProps?: Record<string, unknown> } = {}) =>
  mountLoaded({ schema: createAccountsSchema(), ...options, render: () => h(DataListPagination, options.footerProps) })

describe('TableFooter desktop', () => {
  it('renders the localized range, page size chip and pager', async () => {
    harness = await mountFooter()
    const w = harness.wrapper
    expect(w.find('footer.nut-dl-footer').exists()).toBe(true)
    expect(w.find('.nut-dl-footer__range').text()).toBe('1–20 sur 60')
    expect(w.find('.nut-dl-footer__range').attributes('role')).toBe('status')
    expect(w.find('.nut-dl-footer__size-label').text()).toBe('Par page')
    const select = w.find('select[data-ui="USelect"]')
    expect(select.findAll('option').map((option) => option.text())).toEqual(['10', '20', '50'])
    expect((select.element as HTMLSelectElement).value).toBe('20')
    expect(select.attributes('data-variant')).toBe('none')
    const pager = w.find('[data-ui="UPagination"]')
    expect(pager.attributes()).toMatchObject({ 'data-page': '1', 'data-pages': '3', 'data-total': '60', 'data-items-per-page': '20', 'data-variant': 'ghost', 'data-active-variant': 'solid' })
    expect(pager.classes()).toContain('nut-dl-pager')
    expect(w.find('.nut-dl-pager--compact').exists()).toBe(false)
  })

  it('changes pages and page size through the controls', async () => {
    harness = await mountFooter()
    const w = harness.wrapper
    await w.find('[data-ui-page="2"]').trigger('click')
    await harness.flush()
    expect(harness.internals.pagination.currentPage.value).toBe(2)
    expect(w.find('.nut-dl-footer__range').text()).toBe('21–40 sur 60')
    await w.find('[data-ui-page-next]').trigger('click')
    await harness.flush()
    expect(w.find('.nut-dl-footer__range').text()).toBe('41–60 sur 60')

    const select = w.find('select[data-ui="USelect"]')
    ;(select.element as HTMLSelectElement).value = '50'
    await select.trigger('change')
    await harness.flush()
    expect(harness.internals.pagination.pageSize.value).toBe(50)
    expect(w.find('.nut-dl-footer__range').text()).toBe('1–50 sur 60')
    expect(w.find('[data-ui="UPagination"]').attributes('data-pages')).toBe('2')
  })

  it('applies props layers and hides first/last buttons on demand', async () => {
    harness = await mountFooter({
      ui: { pagination: { size: 'sm', props: { pagination: { variant: 'outline' }, pageSize: { variant: 'outline' }, firstLast: false }, ui: { root: 'root-x', button: 'btn-x', pageSize: 'size-x', summary: 'sum-x' } } },
      footerProps: { props: { pagination: { activeColor: 'primary' } } },
    })
    const w = harness.wrapper
    const pager = w.find('[data-ui="UPagination"]')
    expect(pager.attributes('data-variant')).toBe('outline')
    expect(pager.attributes('data-active-color')).toBe('primary')
    expect(pager.attributes('data-size')).toBe('sm')
    expect(pager.find('[data-ui-page-first]').classes()).toContain('hidden')
    expect(pager.find('[data-ui-page-last]').classes()).toContain('hidden')
    expect(pager.find('[data-ui-page="1"]').classes()).toContain('btn-x')
    expect(w.find('footer').classes()).toContain('root-x')
    expect(w.find('.nut-dl-footer__size').classes()).toContain('size-x')
    expect(w.find('.nut-dl-footer__range').classes()).toContain('sum-x')
    expect(w.find('select').attributes('data-variant')).toBe('outline')
  })

  it('shows a skeleton while booting and an empty label without rows', async () => {
    harness = await mountDataList({ schema: createAccountsSchema({ delay: 60 }), settle: false, render: () => h(DataListPagination) })
    await harness.flush(1)
    expect(harness.wrapper.find('.nut-dl-footer__range-skeleton').exists()).toBe(true)
    expect(harness.wrapper.find('[data-ui="UPagination"]').exists()).toBe(false)
    expect(harness.wrapper.find('.nut-dl-footer__size').exists()).toBe(false)
    harness.unmount()

    harness = await mountFooter({ schema: createAccountsSchema({ rows: [] }) })
    expect(harness.wrapper.find('.nut-dl-footer__range').text()).toBe('0 résultat')
    expect(harness.wrapper.find('[data-ui="UPagination"]').exists()).toBe(false)
  })

  it('is not rendered for cursor pagination', async () => {
    harness = await mountFooter({ schema: createAuditSchema() })
    expect(harness.wrapper.find('footer').exists()).toBe(false)
  })
})

describe('TableFooter compact', () => {
  it('collapses to prev/next controls with a page indicator on mobile', async () => {
    harness = await mountFooter({ breakpoint: 'sm' })
    const w = harness.wrapper
    const pager = w.find('.nut-dl-pager--compact')
    expect(pager.exists()).toBe(true)
    expect(w.find('.nut-dl-footer__size').exists()).toBe(false)
    expect(w.find('[data-ui="UPagination"]').exists()).toBe(false)
    expect(pager.find('.nut-dl-pager__of').text()).toBe('1 / 3')
    const buttons = pager.findAll('[data-ui="UButton"]')
    expect(buttons[0]!.attributes('disabled')).toBeDefined()
    expect(buttons[0]!.attributes('data-icon')).toBe('i-lucide-chevron-left')
    expect(buttons[0]!.attributes('data-square')).toBe('true')
    expect(buttons[0]!.attributes('aria-label')).toBe('Page précédente')
    await buttons[1]!.trigger('click')
    await harness.flush()
    expect(pager.find('.nut-dl-pager__of').text()).toBe('2 / 3')
    expect(w.find('.nut-dl-footer__range').text()).toBe('21–40 sur 60')
  })

  it('forwards named slots to the footer', async () => {
    harness = await mountLoaded({
      schema: createAccountsSchema(),
      render: () =>
        h(DataListPagination, null, {
          navigation: (scope: { state: { pageCount: number } }) => h('nav', { class: 'custom-nav' }, String(scope.state.pageCount)),
          'page-size': (scope: { pageSize: number }) => h('i', { class: 'custom-size' }, String(scope.pageSize)),
        }),
    })
    expect(harness.wrapper.find('.custom-nav').text()).toBe('3')
    expect(harness.wrapper.find('.custom-size').text()).toBe('20')
    expect(harness.wrapper.find('[data-ui="UPagination"]').exists()).toBe(false)
  })
})
