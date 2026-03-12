import { inject, provide } from 'vue'
import type { InjectionKey, ComputedRef } from 'vue'
import type { GenericObject, TableSchema } from '../types'
import type { TableEffectiveFilterRule } from '../composables/use-table-filters'
import type { TableStateRefs, TableMetaRefs } from '../composables/use-table-state'

/**
 * The full internal store — provided by DataList and consumed by all child components.
 *
 * Contains reactive state refs, meta refs, derived filters, and the imperative refresh.
 *
 * Note: DataList is always the injection boundary. useTable does NOT call provide.
 * DataList calls provideTableInternals(store) in its own setup, ensuring each DataList
 * instance has its own isolated injection scope even when multiple tables are on the
 * same page.
 */
export interface TableInternalStore<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> {
  /** Resolved schema (plain object, not reactive source) */
  schema: TableSchema
  /** Mutable reactive user state refs — components read/write directly */
  stateRefs: TableStateRefs
  /** Reactive derived meta refs — source engine writes, components read */
  metaRefs: TableMetaRefs<TRow, TContext, TPageContext>
  /** Effective filter rules with provenance (computed) */
  effectiveFilters: ComputedRef<readonly TableEffectiveFilterRule[]>
  /** Imperative refresh — triggers a full source re-execution */
  refresh: () => Promise<void>
}

const TABLE_INJECTION_KEY: InjectionKey<TableInternalStore> = Symbol('table-v2-internals')

/**
 * Provides the table internals to the component subtree.
 * Always called from DataList's setup — never from user code.
 */
export function provideTableInternals(store: TableInternalStore): void {
  provide(TABLE_INJECTION_KEY, store)
}

/**
 * Injects the table internals. Must be called inside a component that is a
 * descendant of a DataList instance.
 *
 * Throws if no provider is found, because a component using this hook
 * outside of DataList is always a bug.
 */
export function useTableInternals(): TableInternalStore {
  const store = inject(TABLE_INJECTION_KEY)
  if (!store) {
    throw new Error(
      '[table] useTableInternals() was called outside of a <DataList> component. '
      + 'Make sure the component is rendered inside a DataList.',
    )
  }
  return store
}

/**
 * Raw inject — returns undefined if no provider found.
 * Used by components that may optionally be rendered inside or outside DataList.
 */
export function tryUseTableInternals(): TableInternalStore | undefined {
  return inject(TABLE_INJECTION_KEY)
}
