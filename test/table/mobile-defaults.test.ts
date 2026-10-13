import { describe, expect, it } from 'vitest'

import type { DataListUiConfig } from '#ui-tools/table/types'

import { DATA_LIST_MOBILE_DEFAULTS } from '../../src/runtime/table/constants/mobile'
import { layerDataListMobileDefaults } from '../../src/runtime/table/utils/mobile-defaults'

/** A checkbox keeps its size: its 44px tap area is a pseudo-element around it. */
const SELECT_AREA = expect.stringContaining('before:size-11')

describe('mobile touch-target defaults', () => {
  it('adds a 44px target to the slots of a config that names none of them', () => {
    const layered = layerDataListMobileDefaults({})
    expect(layered.refresh?.ui?.base).toBe('min-h-11 min-w-11')
    expect(layered.search?.ui).toStrictEqual({ base: 'min-h-11', clear: 'min-h-11 min-w-11' })
    expect(layered.selectionActions?.ui).toStrictEqual({
      action: 'h-11 min-w-11',
      dismiss: 'size-11',
      overflow: 'size-11',
    })
    expect(layered.table?.ui).toStrictEqual({
      emptyAction: 'min-h-11 min-w-11',
      rowAction: 'min-h-11 min-w-11',
      selectControl: SELECT_AREA,
    })
  })

  it('covers every part the registry names, and only through `ui` slots', () => {
    const layered = layerDataListMobileDefaults({})
    for (const [part, defaults] of Object.entries(DATA_LIST_MOBILE_DEFAULTS)) {
      expect(Object.keys(defaults)).toStrictEqual(['ui'])
      expect(layered).toHaveProperty([part, 'ui'], expect.objectContaining(defaults.ui))
    }
  })

  it('keeps the classes an app gives a slot and lets them win where they conflict', () => {
    const config: DataListUiConfig = {
      refresh: { ui: { base: 'rounded-full min-h-8' } },
      table: { ui: { emptyAction: 'font-bold' } },
    }
    const layered = layerDataListMobileDefaults(config)
    expect(layered.refresh?.ui?.base).toBe('min-w-11 rounded-full min-h-8')
    expect(layered.table?.ui).toStrictEqual({
      emptyAction: 'min-h-11 min-w-11 font-bold',
      rowAction: 'min-h-11 min-w-11',
      selectControl: SELECT_AREA,
    })
  })

  it('keeps everything else of a part, and every part it does not cover', () => {
    const config: DataListUiConfig = {
      density: 'compact',
      grid: { gap: 24 },
      layoutSwitch: {
        props: { icons: { grid: 'i-lucide-grid' } },
        size: 'sm',
        ui: { root: 'root-x' },
      },
    }
    const layered = layerDataListMobileDefaults(config)
    expect(layered.density).toBe('compact')
    expect(layered.grid).toStrictEqual({ gap: 24 })
    expect(layered.layoutSwitch).toStrictEqual({
      props: { icons: { grid: 'i-lucide-grid' } },
      size: 'sm',
      ui: { root: 'root-x', trigger: 'min-h-11 min-w-11' },
    })
  })

  it('does not change the config it is given', () => {
    const config: DataListUiConfig = { refresh: { ui: { base: 'app-x' } } }
    layerDataListMobileDefaults(config)
    expect(config).toStrictEqual({ refresh: { ui: { base: 'app-x' } } })
  })
})
