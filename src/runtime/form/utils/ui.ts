import { twMerge } from 'tailwind-merge'

import type {
  FormFieldControlConfigs,
  FormUiClass,
  FormUiConfig,
  FormUiPartConfig,
  FormValue,
} from '../types'
import { isObject } from './predicate'

/** Merges form slot classes with the same conflict resolution used by Nuxt UI. */
export function mergeFormUiClass(defaults?: FormUiClass, root?: FormUiClass, local?: FormUiClass) {
  return twMerge(defaults, root, local)
}

export function mergeFormUi(...configs: readonly (FormUiConfig | undefined)[]): FormUiConfig {
  return configs.reduce<FormUiConfig>(mergeFormUiPair, {})
}

export function resolveAppFormUi(config: FormValue): FormUiConfig | undefined {
  if (!isObject(config)) return undefined
  const nuxtUiTools = Object.getOwnPropertyDescriptor(config, 'nuxtUiTools')?.value
  if (!isObject(nuxtUiTools)) return undefined
  const form = Object.getOwnPropertyDescriptor(nuxtUiTools, 'form')?.value
  return isFormUiConfig(form) ? form : undefined
}

function mergeFormUiPair(current: FormUiConfig, next: FormUiConfig | undefined): FormUiConfig {
  if (!next) return current
  return {
    ...current,
    ...next,
    control: {
      ...current.control,
      ...next.control,
      ui: { ...current.control?.ui, ...next.control?.ui },
    },
    fields: mergeFieldControls(current.fields, next.fields),
    root: mergePart(current.root, next.root),
    field: mergePart(current.field, next.field),
    actions: mergePart(current.actions, next.actions),
    group: mergePart(current.group, next.group),
    tree: mergePart(current.tree, next.tree),
    treeSelect: mergePart(current.treeSelect, next.treeSelect),
    matrix: mergePart(current.matrix, next.matrix),
    arrayList: mergePart(current.arrayList, next.arrayList),
    arrayTable: mergePart(current.arrayTable, next.arrayTable),
    modal: mergePart(current.modal, next.modal),
    drawer: mergePart(current.drawer, next.drawer),
    fullscreen: mergePart(current.fullscreen, next.fullscreen),
  }
}

function mergeFieldControls(
  current: FormFieldControlConfigs | undefined,
  next: FormFieldControlConfigs | undefined,
): FormFieldControlConfigs {
  const merged: FormFieldControlConfigs = { ...current }
  if (!next) return merged

  for (const type in next) {
    const config = next[type]
    if (!config) continue
    merged[type] = {
      ...merged[type],
      ...config,
      ui: { ...merged[type]?.ui, ...config.ui },
    }
  }

  return merged
}

function mergePart<TUi extends object>(
  current: FormUiPartConfig<TUi> | undefined,
  next: FormUiPartConfig<TUi> | undefined,
): FormUiPartConfig<TUi> {
  return {
    ...current,
    ...next,
    ui: Object.assign({}, current?.ui, next?.ui),
  }
}

function isFormUiConfig(value: FormValue): value is FormUiConfig {
  return Boolean(value) && isObject(value)
}
