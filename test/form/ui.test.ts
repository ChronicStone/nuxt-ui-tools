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
        field: { ui: { container: 'mt-1', label: 'font-medium' } },
        fields: { select: { size: 'sm', ui: { base: 'rounded-sm', value: 'truncate' } } },
        matrix: { ui: { cell: 'px-2', control: 'max-w-48' } },
      },
      {
        control: { size: 'lg' },
        field: { ui: { label: 'font-semibold' } },
        fields: { select: { class: 'max-w-80', ui: { base: 'rounded-lg' } } },
        matrix: { ui: { cell: 'px-4' } },
      },
    )

    expect(ui.control?.size).toBe('lg')
    expect(ui.fields?.select).toStrictEqual({
      class: 'max-w-80',
      size: 'sm',
      ui: { base: 'rounded-lg', value: 'truncate' },
    })
    expect(ui.field?.ui).toStrictEqual({ container: 'mt-1', label: 'font-semibold' })
    expect(ui.matrix?.ui).toStrictEqual({ cell: 'px-4', control: 'max-w-48' })
  })

  it('types every release presentation concern from one root config', () => {
    const ui: FormUiConfig = {
      actions: { ui: { button: 'rounded-md', right: 'gap-2' } },
      arrayList: { ui: { add: 'justify-self-end', item: 'shadow-none' } },
      arrayTable: { ui: { control: 'justify-center', headerCell: 'h-10' } },
      control: { size: 'md', ui: { base: 'rounded-sm' } },
      density: 'comfortable',
      drawer: { ui: { content: 'md:max-w-2xl' } },
      field: { ui: { body: 'gap-1', label: 'text-xs' } },
      fields: {
        select: { class: 'max-w-96', size: 'sm', ui: { base: 'rounded-md' } },
        upload: { class: 'min-h-36' },
      },
      fullscreen: { ui: { content: 'bg-elevated' } },
      group: { ui: { base: 'w-fit' } },
      matrix: { ui: { cell: 'p-2', columnHeader: 'text-center' } },
      modal: { ui: { content: 'sm:max-w-5xl' } },
      root: { ui: { footer: 'sticky bottom-0', viewport: 'px-6' } },
      tree: { ui: { link: 'rounded-sm', selectionControl: 'text-secondary' } },
      treeSelect: { ui: { tree: 'max-h-96', trigger: 'max-w-80' } },
    }

    expectTypeOf(ui).toEqualTypeOf<FormUiConfig>()
  })
})
