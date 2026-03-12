import type {
  GenericObject,
  MaybePromise,
  TableLayout,
  TableRowRenderParams,
} from './utils'
import type { TableSourceRequestContext } from './source'

export interface TableActionContext<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> {
  selectedRows: readonly TRow[]
  context: TContext
  pageContext: TPageContext
  request: TableSourceRequestContext<TRow>
}

export interface TableToolbarAction<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> {
  key: string
  label: string
  visible?: boolean | ((context: TContext) => boolean)
  action?: (
    context: TableActionContext<TRow, TContext, TPageContext>,
  ) => MaybePromise<unknown>
}

export interface TableBulkAction<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> extends TableToolbarAction<TRow, TContext, TPageContext> {
  requiresSelection?: boolean
}

export interface TableRowActionContext<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> extends TableRowRenderParams<TRow, TContext, TPageContext> {
  layout: TableLayout
}

export interface TableRowAction<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> {
  key: string
  label: string
  visible?: boolean | ((context: TableRowActionContext<TRow, TContext, TPageContext>) => boolean)
  action?: (
    context: TableRowActionContext<TRow, TContext, TPageContext>,
  ) => MaybePromise<unknown>
}
