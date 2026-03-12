import type {
  GenericObject,
  MaybePromise,
  RenderableType,
  TableLayout,
  TableRowRenderParams,
} from './utils'

export interface TableActionContext<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TRequest = unknown,
> {
  selectedRows: readonly TRow[]
  context: TContext
  pageContext: TPageContext
  request: TRequest
}

export interface TableToolbarAction<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TRequest = unknown,
> {
  key: string
  label: string | (() => RenderableType)
  visible?: boolean | ((context: TContext) => boolean)
  action?: (
    context: TableActionContext<TRow, TContext, TPageContext, TRequest>,
  ) => MaybePromise<unknown>
}

export interface TableBulkAction<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TRequest = unknown,
> extends TableToolbarAction<TRow, TContext, TPageContext, TRequest> {
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
  label: string | (() => RenderableType)
  visible?: boolean | ((context: TableRowActionContext<TRow, TContext, TPageContext>) => boolean)
  action?: (context: TableRowActionContext<TRow, TContext, TPageContext>) => MaybePromise<unknown>
}
