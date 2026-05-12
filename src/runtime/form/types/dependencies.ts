import type { DeepPrettify, PathToObject, UnionToIntersection } from '../../shared/types/utils'
import type { FormObject } from './utils'

type DependencySource<TDependency> = TDependency extends readonly [infer TSource, infer _TTarget]
  ? TSource extends string ? TSource : never
  : TDependency extends string ? TDependency : never

type DependencyTarget<TDependency> = TDependency extends readonly [infer _TSource, infer TTarget]
  ? TTarget extends string ? TTarget : never
  : TDependency extends string ? TDependency : never

type PathValue<TSource, TPath extends string> = TPath extends '$root'
  ? TSource
  : TPath extends `$parent${string}`
    ? unknown
    : TPath extends `${infer THead}.${infer TTail}`
      ? THead extends keyof TSource
        ? PathValue<TSource[THead], TTail>
        : unknown
      : TPath extends keyof TSource
        ? TSource[TPath]
        : unknown

type DependencyObject<TDependency, TState> = DependencyTarget<TDependency> extends infer TTarget
  ? TTarget extends string
    ? PathToObject<TTarget, PathValue<TState, DependencySource<TDependency>>>
    : {}
  : {}

type DependenciesValue<TDependencies, TState> = TDependencies extends readonly unknown[]
  ? UnionToIntersection<DependencyObject<TDependencies[number], TState>>
  : {}

/**
 * Extracts the `deps` object made available to callbacks for a single field.
 *
 * Pass the form internal state as the second type argument to resolve dependency values from
 * absolute dotted paths. `$parent` dependencies intentionally resolve to `unknown` at this layer
 * because their final type depends on where a reusable field is mounted.
 *
 * @example
 * ```ts
 * type State = { password: string | null, profile: { country: 'FR' | 'BE' | null } }
 * type Deps = ExtractFormFieldDependencies<{
 *   dependencies: ['password', ['profile.country', 'country']]
 * }, State>
 * // { password: string | null, country: 'FR' | 'BE' | null }
 * ```
 */
export type ExtractFormFieldDependencies<TField, TState = FormObject> = TField extends {
  readonly dependencies: infer TDependencies
}
  ? DeepPrettify<DependenciesValue<TDependencies, TState>>
  : {}
