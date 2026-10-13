import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListPagination from '#ui-tools/table/components/data-list/data-list-pagination.vue'

import { must } from '../../helpers/must'
import { createAccountsSchema, createAuditSchema } from '../fixtures/accounts'
import { mountDataList, mountLoaded } from '../harness'
import type { Harness } from '../harness'
import { localeCode } from '../stubs/nuxt-ui-locale'

let harness: Harness | undefined
afterEach(() => {
  harness?.unmount()
  localeCode.value = 'fr'
})

function mountFooter(
  options: Partial<Parameters<typeof mountLoaded>[0]> & {
    footerProps?: Record<string, unknown>
  } = {},
) {
  return mountLoaded({
    schema: createAccountsSchema(),
    ...options,
    render: () => h(DataListPagination, options.footerProps),
  })
}

describe('TableFooter desktop', () => {
  it('renders the localized range, page size chip and pager', async () => {
    harness = await mountFooter()
    const w = harness.wrapper
    expect(w.find('footer.nut-dl-footer').exists()).toBeTruthy()
    expect([
      w.find('.nut-dl-footer__range').text(),
      w.find('.nut-dl-footer__range').attributes('role'),
      w.find('.nut-dl-footer__size-label').text(),
    ]).toStrictEqual(['1–20 sur 60', 'status', 'Par page'])
    const select = w.find('select[data-ui="USelect"]')
    expect([
      select.findAll('option').map((option) => option.text()),
      (select.element as HTMLSelectElement).value,
      select.attributes('data-variant'),
    ]).toStrictEqual([['10', '20', '50'], '20', 'none'])
    const pager = w.find('[data-ui="UPagination"]')
    expect(pager.attributes()).toMatchObject({
      'data-active-variant': 'solid',
      'data-items-per-page': '20',
      'data-page': '1',
      'data-pages': '3',
      'data-total': '60',
      'data-variant': 'ghost',
    })
    expect(pager.classes()).toContain('nut-dl-pager')
    expect(w.find('.nut-dl-pager--compact').exists()).toBeFalsy()
  })

  it('changes pages and page size through the controls', async () => {
    harness = await mountFooter()
    const w = harness.wrapper
    await w.find('[data-ui-page="2"]').trigger('click')
    await harness.flush()
    expect([
      harness.internals.pagination.currentPage.value,
      w.find('.nut-dl-footer__range').text(),
    ]).toStrictEqual([2, '21–40 sur 60'])
    await w.find('[data-ui-page-next]').trigger('click')
    await harness.flush()
    expect(w.find('.nut-dl-footer__range').text()).toBe('41–60 sur 60')

    const select = w.find('select[data-ui="USelect"]')
    ;(select.element as HTMLSelectElement).value = '50'
    await select.trigger('change')
    await harness.flush()
    expect([
      harness.internals.pagination.pageSize.value,
      w.find('.nut-dl-footer__range').text(),
      w.find('[data-ui="UPagination"]').attributes('data-pages'),
    ]).toStrictEqual([50, '1–50 sur 60', '2'])
  })

  it('applies props layers and hides first/last buttons on demand', async () => {
    harness = await mountFooter({
      footerProps: { props: { pagination: { activeColor: 'primary' } } },
      ui: {
        pagination: {
          props: {
            firstLast: false,
            pageSize: { variant: 'outline' },
            pagination: { variant: 'outline' },
          },
          size: 'sm',
          ui: { button: 'btn-x', pageSize: 'size-x', root: 'root-x', summary: 'sum-x' },
        },
      },
    })
    const w = harness.wrapper
    const pager = w.find('[data-ui="UPagination"]')
    expect([
      pager.attributes('data-variant'),
      pager.attributes('data-active-color'),
      pager.attributes('data-size'),
    ]).toStrictEqual(['outline', 'primary', 'sm'])
    expect(pager.find('[data-ui-page-first]').classes()).toContain('hidden')
    expect(pager.find('[data-ui-page-last]').classes()).toContain('hidden')
    expect(pager.find('[data-ui-page="1"]').classes()).toContain('btn-x')
    expect(w.find('footer').classes()).toContain('root-x')
    expect(w.find('.nut-dl-footer__size').classes()).toContain('size-x')
    expect(w.find('.nut-dl-footer__range').classes()).toContain('sum-x')
    expect(w.find('select').attributes('data-variant')).toBe('outline')
  })

  it('shows a skeleton while booting and an empty label without rows', async () => {
    harness = await mountDataList({
      render: () => h(DataListPagination),
      schema: createAccountsSchema({ delay: 60 }),
      settle: false,
    })
    await harness.flush(1)
    expect(harness.wrapper.find('.nut-dl-footer__range-skeleton').exists()).toBeTruthy()
    expect(harness.wrapper.find('[data-ui="UPagination"]').exists()).toBeFalsy()
    expect(harness.wrapper.find('.nut-dl-footer__size').exists()).toBeFalsy()
    harness.unmount()

    harness = await mountFooter({ schema: createAccountsSchema({ rows: [] }) })
    expect(harness.wrapper.find('.nut-dl-footer__range').text()).toBe('0 résultat')
    expect(harness.wrapper.find('[data-ui="UPagination"]').exists()).toBeFalsy()
  })

  it('is not rendered for cursor pagination', async () => {
    harness = await mountFooter({ schema: createAuditSchema() })
    expect(harness.wrapper.find('footer').exists()).toBeFalsy()
  })

  it('honors the schema pagination visibility flags', async () => {
    harness = await mountFooter({
      schema: createAccountsSchema({
        pagination: {
          showPageSizePicker: false,
          showPagesCount: false,
          showPagesList: false,
        },
      }),
    })

    expect(harness.wrapper.find('footer').exists()).toBeFalsy()
  })
})

describe('TableFooter compact', () => {
  it('collapses to prev/next controls with a page indicator on mobile', async () => {
    harness = await mountFooter({ breakpoint: 'sm' })
    const w = harness.wrapper
    const pager = w.find('.nut-dl-pager--compact')
    expect(pager.exists()).toBeTruthy()
    expect(w.find('.nut-dl-footer__size').exists()).toBeFalsy()
    expect(w.find('[data-ui="UPagination"]').exists()).toBeFalsy()
    expect(pager.find('.nut-dl-pager__of').text()).toBe('1 / 3')
    const buttons = pager.findAll('[data-ui="UButton"]')
    expect(must(buttons[0]).attributes('disabled')).toBeDefined()
    expect([
      must(buttons[0]).attributes('data-icon'),
      must(buttons[0]).attributes('data-square'),
      must(buttons[0]).attributes('aria-label'),
    ]).toStrictEqual(['i-lucide-chevron-left', 'true', 'Page précédente'])
    await must(buttons[1]).trigger('click')
    await harness.flush()
    expect([
      pager.find('.nut-dl-pager__of').text(),
      w.find('.nut-dl-footer__range').text(),
    ]).toStrictEqual(['2 / 3', '21–40 sur 60'])
  })

  it('forwards named slots to the footer', async () => {
    harness = await mountLoaded({
      render: () =>
        h(DataListPagination, null, {
          navigation: (scope: { state: { pageCount: number } }) =>
            h('nav', { class: 'custom-nav' }, String(scope.state.pageCount)),
          'page-size': (scope: { pageSize: number }) =>
            h('i', { class: 'custom-size' }, String(scope.pageSize)),
        }),
      schema: createAccountsSchema(),
    })
    expect(harness.wrapper.find('.custom-nav').text()).toBe('3')
    expect(harness.wrapper.find('.custom-size').text()).toBe('20')
    expect(harness.wrapper.find('[data-ui="UPagination"]').exists()).toBeFalsy()
  })
})

function pagerNames(mounted: Harness) {
  const pager = mounted.wrapper.find('[data-ui="UPagination"]')
  const nameOf = (selector: string) =>
    pager.find(`${selector} [data-ui="UButton"]`).attributes('aria-label')
  return {
    pages: pager
      .findAll('[data-ui-page]')
      .map((item) => item.find('[data-ui="UButton"]').attributes('aria-label')),
    steps: [
      nameOf('[data-ui-page-first]'),
      nameOf('[data-ui-page-prev]'),
      nameOf('[data-ui-page-next]'),
      nameOf('[data-ui-page-last]'),
    ],
  }
}

describe('TableFooter accessible names', () => {
  it('names the step buttons and every page in the locale', async () => {
    harness = await mountFooter()
    expect(pagerNames(harness)).toStrictEqual({
      pages: ['Page 1 sur 3', 'Page 2 sur 3', 'Page 3 sur 3'],
      steps: ['Première page', 'Page précédente', 'Page suivante', 'Dernière page'],
    })
    expect(
      harness.wrapper
        .findAll('.nut-dl-pager [data-ui="UButton"]')
        .map((button) => button.attributes('data-icon')),
    ).toStrictEqual([
      'i-lucide-chevrons-left',
      'i-lucide-chevron-left',
      undefined,
      undefined,
      undefined,
      'i-lucide-chevron-right',
      'i-lucide-chevrons-right',
    ])
  })

  it('follows the locale', async () => {
    localeCode.value = 'en'
    harness = await mountFooter()
    expect(pagerNames(harness)).toStrictEqual({
      pages: ['Page 1 of 3', 'Page 2 of 3', 'Page 3 of 3'],
      steps: ['First page', 'Previous page', 'Next page', 'Last page'],
    })
    harness.unmount()

    harness = await mountFooter({ breakpoint: 'sm' })
    expect(
      harness.wrapper
        .findAll('.nut-dl-pager--compact [data-ui="UButton"]')
        .map((button) => button.attributes('aria-label')),
    ).toStrictEqual(['Previous page', 'Next page'])
  })

  it('keeps page links and icons from the pagination props', async () => {
    harness = await mountFooter({
      footerProps: {
        props: {
          pagination: {
            firstIcon: 'i-lucide-arrow-left-to-line',
            to: (page: number) => `/accounts?page=${page}`,
          },
        },
      },
    })
    const pager = harness.wrapper.find('[data-ui="UPagination"]')
    expect([
      pager.find('[data-ui-page-first] [data-ui="UButton"]').attributes('data-icon'),
      ...['first', 'prev', 'next', 'last'].map((slot) =>
        pager.find(`[data-ui-page-${slot}] [data-ui="UButton"]`).attributes('to'),
      ),
      ...pager.findAll('[data-ui-page] [data-ui="UButton"]').map((item) => item.attributes('to')),
    ]).toStrictEqual([
      'i-lucide-arrow-left-to-line',
      '/accounts?page=1',
      undefined,
      '/accounts?page=2',
      '/accounts?page=3',
      '/accounts?page=1',
      '/accounts?page=2',
      '/accounts?page=3',
    ])
  })
})

function footerParts(mounted: Harness) {
  return Array.from(mounted.wrapper.find('footer').element.children, (child) =>
    [...child.classList].find((name) => name.startsWith('nut-dl-footer__')),
  )
}

describe('TableFooter view toggle', () => {
  it('sits between the range and the pager as a text button', async () => {
    harness = await mountFooter({
      breakpoint: 'sm',
      schema: createAccountsSchema({ summary: true }),
    })
    expect(footerParts(harness)).toStrictEqual([
      'nut-dl-footer__lead',
      'nut-dl-footer__view',
      'nut-dl-footer__pages',
    ])
    const toggle = harness.wrapper.find('.nut-dl-footer__view .nut-dl-view-toggle')
    expect([toggle.text(), toggle.attributes('data-variant')]).toStrictEqual([
      'Vue tableau',
      'link',
    ])
    await toggle.trigger('click')
    await harness.flush()
    expect([
      harness.internals.rowSummary.active.value,
      harness.wrapper.find('.nut-dl-footer__view .nut-dl-view-toggle').text(),
    ]).toStrictEqual([false, 'Vue liste'])
  })

  it('is left out where the list cannot read as summary rows', async () => {
    harness = await mountFooter({ schema: createAccountsSchema({ summary: true }) })
    expect(footerParts(harness)).toStrictEqual(['nut-dl-footer__lead', 'nut-dl-footer__pages'])
    harness.unmount()

    harness = await mountFooter({ breakpoint: 'sm' })
    expect(harness.wrapper.find('.nut-dl-footer__view').exists()).toBeFalsy()
  })

  it('follows summary rows onto a larger viewport when the schema asks for them there', async () => {
    harness = await mountFooter({ schema: createAccountsSchema({ summary: { enabled: true } }) })
    expect(harness.wrapper.find('.nut-dl-footer__view .nut-dl-view-toggle').text()).toBe(
      'Vue tableau',
    )
  })

  it('can be replaced through its slot', async () => {
    harness = await mountLoaded({
      render: () =>
        h(DataListPagination, null, {
          'view-toggle': () => h('i', { class: 'custom-toggle' }, 'Basculer'),
        }),
      breakpoint: 'sm',
      schema: createAccountsSchema({ summary: true }),
    })
    expect(harness.wrapper.find('.nut-dl-footer__view .custom-toggle').text()).toBe('Basculer')
    expect(harness.wrapper.find('.nut-dl-view-toggle').exists()).toBeFalsy()
  })

  it('keeps the footer for the toggle alone when every other control is off', async () => {
    harness = await mountFooter({
      breakpoint: 'sm',
      schema: createAccountsSchema({
        pagination: { showPageSizePicker: false, showPagesCount: false, showPagesList: false },
        summary: true,
      }),
    })
    expect(footerParts(harness)).toStrictEqual(['nut-dl-footer__lead', 'nut-dl-footer__view'])
    expect(harness.wrapper.find('.nut-dl-view-toggle').exists()).toBeTruthy()
  })
})
