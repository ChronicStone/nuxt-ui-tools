import type { TableQueryStateFilterRule } from '../types'

export function resolvePanelDefaultRules(options: {
  definitions: Array<{ key: string }>
  getDefault: (key: string) => TableQueryStateFilterRule | undefined
}) {
  return options.definitions.flatMap((definition) => {
    const defaultRule = options.getDefault(definition.key)
    return defaultRule ? [{ ...defaultRule }] : []
  })
}

export function resolvePanelCommitRules(options: {
  currentRules: TableQueryStateFilterRule[]
  panelKeys: string[]
  panelRules: TableQueryStateFilterRule[]
}) {
  const panelKeySet = new Set(options.panelKeys)
  const preservedRules = options.currentRules.filter((rule) => !panelKeySet.has(rule.key))
  return [...preservedRules, ...options.panelRules.map((rule) => ({ ...rule }))]
}
