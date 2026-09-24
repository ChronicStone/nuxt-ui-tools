import { afterEach, describe, expect, it } from 'vitest'

import { defineFormPageSchema } from '#ui-tools/form'
import type { FormPageSection } from '#ui-tools/form'

import { mountPage, unmountPage } from '../../dom/form/page-harness'
import { must } from '../../helpers/must'
import { settle } from '../dashboard/layout'

afterEach(unmountPage)

const SECTIONS = ['type', 'identity', 'contacts', 'address', 'billing'] as const

function tallSection(key: string): FormPageSection {
  return {
    fields: Array.from({ length: 6 }, (_, index) => ({
      key: `${key}${index}`,
      label: `${key} ${index}`,
      type: 'text' as const,
    })),
    key,
    label: key,
  }
}

const schema = defineFormPageSchema({
  header: { title: 'Nouveau compte' },
  navigation: { title: 'Création' },
  sections: SECTIONS.map(tallSection),
})

async function mountSized(width: number) {
  const harness = await mountPage({ schema, style: `height: 700px; width: ${width}px` })
  await settle()
  const page = must(document.querySelector<HTMLElement>('[data-form-page]'))
  return {
    ...harness,
    header: must(page.querySelector<HTMLElement>('[data-form-page-header]')),
    navigation: must(page.querySelector<HTMLElement>('[data-form-page-navigation]')),
    page,
    sections: must(page.querySelector<HTMLElement>('[data-form-page-sections]')),
  }
}

function offsetOf(page: HTMLElement) {
  return Number.parseFloat(getComputedStyle(page).getPropertyValue('--nut-form-page-offset'))
}

/** Scroll position that brings `section` to the line under the pinned header. */
function scrollTopFor(page: HTMLElement, section: HTMLElement) {
  const top = section.getBoundingClientRect().top - page.getBoundingClientRect().top
  return page.scrollTop + top - offsetOf(page)
}

async function scrollPage(page: HTMLElement, top: number) {
  page.scrollTop = top
  await settle()
  await new Promise((resolve) => setTimeout(resolve, 200))
  await settle()
}

async function until(predicate: () => boolean, timeout = 3000) {
  const started = performance.now()
  while (!predicate()) {
    if (performance.now() - started > timeout) {
      throw new Error('until(): timed out')
    }
    // oxlint-disable-next-line no-await-in-loop -- polling a smooth scroll frame by frame
    await settle()
  }
}

describe('form page layout', () => {
  it('lays the navigation beside the sections and pins both under the header on wide pages', async () => {
    const { header, navigation, page, sections, entry } = await mountSized(1200)

    expect(page.getBoundingClientRect().height).toBe(700)
    expect(page.scrollHeight).toBeGreaterThan(700)
    expect(navigation.getBoundingClientRect().right).toBeLessThanOrEqual(
      sections.getBoundingClientRect().left,
    )
    expect(navigation.getBoundingClientRect().top).toBeCloseTo(
      sections.getBoundingClientRect().top,
      0,
    )
    expect(entry('identity').getBoundingClientRect().top).toBeGreaterThan(
      entry('type').getBoundingClientRect().top,
    )
    expect(offsetOf(page)).toBe(header.offsetHeight + 24)

    await scrollPage(page, 900)
    expect(header.getBoundingClientRect().top).toBeCloseTo(page.getBoundingClientRect().top, 0)
    expect(navigation.getBoundingClientRect().top).toBeCloseTo(
      page.getBoundingClientRect().top + offsetOf(page),
      0,
    )
  })

  it('follows the section in view', async () => {
    const { entry, page, section } = await mountSized(1200)

    expect(entry('type').getAttribute('aria-current')).toBe('location')

    await scrollPage(page, scrollTopFor(page, section('address')))
    expect(entry('address').getAttribute('aria-current')).toBe('location')

    await scrollPage(page, scrollTopFor(page, section('identity')) + 40)
    expect(entry('identity').getAttribute('aria-current')).toBe('location')

    await scrollPage(page, page.scrollHeight)
    expect(entry('billing').getAttribute('aria-current')).toBe('location')
  })

  it('makes the section of a focused field current, even while the one above covers the top', async () => {
    const { entry, page } = await mountSized(1200)
    const input = must(page.querySelector<HTMLInputElement>('[data-form-field="address0"] input'))

    input.focus()
    await settle()
    await new Promise((resolve) => setTimeout(resolve, 300))
    await settle()

    expect(page.scrollTop).toBeGreaterThan(0)
    expect(entry('address').getAttribute('aria-current')).toBe('location')

    // Scrolling again hands the navigation back to the scrollspy.
    await scrollPage(page, 0)
    expect(entry('type').getAttribute('aria-current')).toBe('location')
  })

  it('scrolls a section to just below the pinned header from the navigation', async () => {
    const { entry, page, section } = await mountSized(1200)

    entry('contacts').click()
    await until(
      () =>
        Math.abs(
          section('contacts').getBoundingClientRect().top -
            (page.getBoundingClientRect().top + offsetOf(page)),
        ) < 2,
    )
    await new Promise((resolve) => setTimeout(resolve, 250))
    await settle()

    expect(entry('contacts').getAttribute('aria-current')).toBe('location')
    expect(window.location.hash).toBe('#contacts')
  })

  it('keeps a narrower navigation column beside the sections on mid-sized pages', async () => {
    const { navigation, sections } = await mountSized(900)

    expect(navigation.getBoundingClientRect().width).toBeCloseTo(200, 0)
    expect(navigation.getBoundingClientRect().right).toBeLessThanOrEqual(
      sections.getBoundingClientRect().left,
    )
  })

  it('turns the navigation into one scrolling row of chips on narrow pages', async () => {
    const { header, navigation, page, sections, entry } = await mountSized(420)

    expect(navigation.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      sections.getBoundingClientRect().top,
    )
    expect(entry('identity').getBoundingClientRect().top).toBeCloseTo(
      entry('type').getBoundingClientRect().top,
      0,
    )
    expect(getComputedStyle(must(navigation.querySelector('p'))).display).toBe('none')
    const row = must(navigation.querySelector<HTMLElement>('ul'))
    expect(getComputedStyle(row).flexWrap).toBe('nowrap')
    expect(row.scrollWidth).toBeGreaterThan(row.clientWidth)
    expect(getComputedStyle(header).position).not.toBe('sticky')
    expect(offsetOf(page)).toBe(24)
  })
})
