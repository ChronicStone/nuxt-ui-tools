import { describe, expect, expectTypeOf, it } from 'vitest'

import type { FormUiConfig } from '#ui-tools/form'

import { mergeFormUi, mergeFormUiClass } from '../../src/runtime/form/utils/ui'

describe('form UI', () => {
  it('uses Nuxt UI class conflict resolution in override order', () => {
    expect(mergeFormUiClass('h-8 px-2', 'h-9 px-3', 'h-10')).toBe('px-3 h-10')
  })

  it('merges app, schema, and rendered-form slots without dropping sibling defaults', () => {
    const ui = mergeFormUi(
      {
        density: 'compact',
        fields: { select: { size: 'sm', ui: { base: 'rounded-sm', value: 'truncate' } } },
        field: { ui: { label: 'font-medium', container: 'mt-1' } },
        matrix: { ui: { cell: 'px-2', control: 'max-w-48' } },
      },
      {
        control: { size: 'lg' },
        fields: { select: { class: 'max-w-80', ui: { base: 'rounded-lg' } } },
        field: { ui: { label: 'font-semibold' } },
        matrix: { ui: { cell: 'px-4' } },
      },
    )

    expect(ui.control?.size).toBe('lg')
    expect(ui.fields?.select).toEqual({
      size: 'sm',
      class: 'max-w-80',
      ui: { base: 'rounded-lg', value: 'truncate' },
    })
    expect(ui.field?.ui).toEqual({ label: 'font-semibold', container: 'mt-1' })
    expect(ui.matrix?.ui).toEqual({ cell: 'px-4', control: 'max-w-48' })
  })

  it('types every release presentation concern from one root config', () => {
    const ui: FormUiConfig = {
      density: 'comfortable',
      control: { size: 'md', ui: { base: 'rounded-sm' } },
      fields: {
        select: { size: 'sm', class: 'max-w-96', ui: { base: 'rounded-md' } },
        upload: { class: 'min-h-36' },
      },
      root: { ui: { viewport: 'px-6', footer: 'sticky bottom-0' } },
      field: { ui: { label: 'text-xs', body: 'gap-1' } },
      actions: { ui: { right: 'gap-2', button: 'rounded-md' } },
      group: { ui: { base: 'w-fit' } },
      tree: { ui: { link: 'rounded-sm', selectionControl: 'text-secondary' } },
      treeSelect: { ui: { trigger: 'max-w-80', tree: 'max-h-96' } },
      matrix: { ui: { columnHeader: 'text-center', cell: 'p-2' } },
      arrayList: { ui: { item: 'shadow-none', add: 'justify-self-end' } },
      arrayTable: { ui: { headerCell: 'h-10', control: 'justify-center' } },
      modal: { ui: { content: 'sm:max-w-5xl' } },
      drawer: { ui: { content: 'md:max-w-2xl' } },
      fullscreen: { ui: { content: 'bg-elevated' } },
    }

    expectTypeOf(ui).toEqualTypeOf<FormUiConfig>()
  })
})
