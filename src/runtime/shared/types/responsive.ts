import type { SplitLitteral } from './utils'

export type ResponsiveValueInput = string | number | boolean | (() => ResponsiveValueInput)

export type ResponsiveTransformKey =
  | 'string'
  | 'boolean'
  | 'integer'
  | 'float'
  | 'grid-cols'
  | 'grid-rows'
  | 'col'
  | 'row'
  | 'maxWidth'
  | 'maxHeight'

export type ResponsiveTransformer<TOutput> = (value: string) => TOutput

export interface ResponsiveBreakpointContext {
  breakpoint: string
  breakpointKeys: string[]
}

type ExtractResponsiveToken<TValue extends string> = TValue extends `${string}:${infer Output}`
  ? Output
  : TValue

export type InferResponsiveValue<TValue extends ResponsiveValueInput> =
  TValue extends string ? ExtractResponsiveToken<SplitLitteral<TValue, ' '>[number]> : TValue

export type ResponsiveTransformResult<TTransform> = TTransform extends ResponsiveTransformer<
  infer TOutput
>
  ? TOutput
  : TTransform extends 'boolean'
    ? boolean
    : TTransform extends 'integer' | 'float'
      ? number
      : string
