import { computed, ref, shallowRef } from 'vue'
import type { Ref, ComputedRef, ShallowRef } from 'vue'
import type {
  GenericObject,
  TableLayout,
  TablePaginationState,
  TableSortingRule,
} from '../types'

// ---------------------------------------------------------------------------
// User-controlled state refs — one ref per logical piece
// ---------------------------------------------------------------------------

export interface TableStateRefs<
  TFilterKey extends string = string,
  TSortKey extends string = string,
  TView extends string = string,
> {
  layout: Ref<TableLayout>
  pagination: Ref<TablePaginationState>
  sorting: Ref<TableSortingRule<TSortKey>[]>
  filters: Ref<Partial<Record<TFilterKey, unknown>>>
  search: Ref<string>
  activeView: Ref<TView | undefined>
  selectedRowKeys: Ref<(string | number)[]>
}

export function createTableStateRefs<
  TFilterKey extends string = string,
  TSortKey extends string = string,
  TView extends string = string,
>(initial?: {
  layout?: TableLayout
  pagination?: Partial<TablePaginationState>
  sorting?: TableSortingRule<TSortKey>[]
  filters?: Partial<Record<TFilterKey, unknown>>
  search?: string
  activeView?: TView
  selectedRowKeys?: (string | number)[]
}): TableStateRefs<TFilterKey, TSortKey, TView> {
  return {
    layout: ref<TableLayout>(initial?.layout ?? 'table') as Ref<TableLayout>,
    pagination: ref<TablePaginationState>({
      page: initial?.pagination?.page ?? 1,
      pageSize: initial?.pagination?.pageSize ?? 25,
    }),
    sorting: ref<TableSortingRule<TSortKey>[]>(
      (initial?.sorting ?? []) as TableSortingRule<TSortKey>[],
    ) as Ref<TableSortingRule<TSortKey>[]>,
    filters: ref<Partial<Record<TFilterKey, unknown>>>(
      (initial?.filters ?? {}) as Partial<Record<TFilterKey, unknown>>,
    ) as Ref<Partial<Record<TFilterKey, unknown>>>,
    search: ref<string>(initial?.search ?? '') as Ref<string>,
    activeView: ref<TView | undefined>(initial?.activeView ?? undefined) as Ref<TView | undefined>,
    selectedRowKeys: ref<(string | number)[]>(initial?.selectedRowKeys ?? []),
  }
}

// ---------------------------------------------------------------------------
// Derived / runtime meta refs — one ref per logical piece
// ---------------------------------------------------------------------------

export interface TableMetaRefs<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> {
  // Data
  rows: ShallowRef<readonly TRow[]>
  rowCount: Ref<number>
  pageCount: Ref<number>
  // Selection (derived)
  selectedRows: ShallowRef<readonly TRow[]>
  selectedCount: Ref<number>
  // Loading phases
  isLoadingContext: Ref<boolean>
  isLoadingData: Ref<boolean>
  isLoadingPageContext: Ref<boolean>
  isLoading: ComputedRef<boolean>
  // Error phases
  errorContext: Ref<Error | null>
  errorData: Ref<Error | null>
  errorPageContext: Ref<Error | null>
  error: ComputedRef<Error | null>
  // Resolved async data
  context: ShallowRef<TContext>
  pageContext: ShallowRef<TPageContext>
}

export function createTableMetaRefs<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
>(): TableMetaRefs<TRow, TContext, TPageContext> {
  const isLoadingContext = ref(false)
  const isLoadingData = ref(false)
  const isLoadingPageContext = ref(false)

  const errorContext = ref<Error | null>(null)
  const errorData = ref<Error | null>(null)
  const errorPageContext = ref<Error | null>(null)

  return {
    rows: shallowRef<readonly TRow[]>([]),
    rowCount: ref(0),
    pageCount: ref(0),
    selectedRows: shallowRef<readonly TRow[]>([]),
    selectedCount: ref(0),
    isLoadingContext,
    isLoadingData,
    isLoadingPageContext,
    isLoading: computed(() => isLoadingContext.value || isLoadingData.value || isLoadingPageContext.value),
    errorContext,
    errorData,
    errorPageContext,
    error: computed(() => errorContext.value ?? errorData.value ?? errorPageContext.value ?? null),
    context: shallowRef<TContext>({} as TContext),
    pageContext: shallowRef<TPageContext>({} as TPageContext),
  }
}
