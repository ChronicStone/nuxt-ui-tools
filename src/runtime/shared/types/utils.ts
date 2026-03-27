import type { VNodeChild } from 'vue'

export type Not<T, R> = T extends R ? never : R

export type Primitive = string | number | symbol

export type GenericObject = Record<Primitive, unknown>

export type BuildTuple<L extends number, T extends any[] = []> = T['length'] extends L
  ? T
  : BuildTuple<L, [...T, any]>

export type DecrementDepth<N extends number> =
  BuildTuple<N> extends [any, ...infer Rest] ? Rest['length'] : 0

export type MaybePromise<T> = T | Promise<T>

export type NestedPaths<T, MaxDepth extends number = 10> = [MaxDepth] extends [0]
  ? never
  : T extends Array<infer U>
    ? `${NestedPaths<U, DecrementDepth<MaxDepth>>}`
    : T extends object
      ? {
          [K in keyof T & (string | number)]: K extends string
            ? `${K}` | `${K}.${NestedPaths<T[K], DecrementDepth<MaxDepth>>}`
            : never
        }[keyof T & (string | number)]
      : never

export type NestedPathsForType<T, P, MaxDepth extends number = 8> = [MaxDepth] extends [0]
  ? never
  : T extends object
    ? T extends Array<any>
      ? never
      : {
          [K in keyof T & (string | number)]: T[K] extends infer V
            ? V extends Array<any>
              ? V extends P
                ? `${K}`
                : never
              : V extends P
                ? `${K}` | `${K}.${NestedPathsForType<V, P, DecrementDepth<MaxDepth>>}`
                : V extends object
                  ? `${K}.${NestedPathsForType<V, P, DecrementDepth<MaxDepth>>}`
                  : never
            : never
        }[keyof T & (string | number)]
    : never

export type NonNullableDeep<T> = T extends null | undefined ? never : T

export type NonEmptyArray<T> = [T, ...T[]]

export type DeepRequired<T> = {
  [P in keyof T]-?: DeepRequired<NonNullableDeep<T[P]>>
}

export type RemoveNeverProps<T> = {
  [K in keyof T as T[K] extends never | undefined ? never : K]: T[K]
}

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never

export type Narrowable = string | number | boolean | symbol | object | undefined | null

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RenderFunction<T extends any[]> = (...args: T) => VNodeChild

export type IsObject<T> = T extends object ? (T extends any[] ? never : T) : never

export type RenderableType = string | number | VNodeChild | null | undefined
export type LazyTextValue = string | number | (() => string | number)

export type InferParams<T> = T extends (params: infer P) => any ? P : never

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type DeepPrettify<T> =
  T extends Array<infer U>
    ? Array<DeepPrettify<U>>
    : T extends object
      ? { [K in keyof T]: DeepPrettify<T[K]> } & {}
      : T

export type PathToObject<Path extends string, Output> = Path extends `${infer First}.${infer Rest}`
  ? { [K in First]: PathToObject<Rest, Output> }
  : { [K in Path]: Output }

export type RemoveDotKeys<T> =
  T extends Array<infer U>
    ? Array<RemoveDotKeys<U>>
    : {
        [K in keyof T as K extends `${string}.${string}` ? never : K]: T[K] extends object
          ? RemoveDotKeys<T[K]>
          : T[K]
      }

export type DeepTransformNestedPaths<T> = DeepPrettify<
  RemoveDotKeys<
    {
      [K in keyof T]: T[K] extends Array<infer U>
        ? Array<DeepTransformNestedPaths<U>>
        : T[K] extends object
          ? DeepTransformNestedPaths<T[K]>
          : T[K]
    } & UnionToIntersection<
      {
        [K in Extract<keyof T, string>]: PathToObject<
          K,
          T[K] extends Array<infer U>
            ? U extends object
              ? Array<DeepTransformNestedPaths<U>>
              : T[K]
            : T[K] extends object
              ? DeepTransformNestedPaths<T[K]>
              : T[K]
        >
      }[Extract<keyof T, string>]
    >
  >
>

export type SplitLitteral<String extends string, Divider extends string> = string extends String
  ? string[]
  : String extends ''
    ? []
    : String extends `${infer T}${Divider}${infer U}`
      ? [T, ...SplitLitteral<U, Divider>]
      : [String]

export type HasParameters<T> = T extends (...args: []) => any ? false : true

export type DeepOmit<T, K extends string> = K extends `${infer First}.${infer Rest}`
  ? First extends keyof T
    ? T[First] extends (infer U)[]
      ? Omit<T, First> & { [P in First]: DeepOmit<U, Rest>[] }
      : Omit<T, First> & { [P in First]: DeepOmit<T[First], Rest> }
    : T
  : Omit<T, K>

export type DeepPick<T, K extends string> = UnionToIntersection<
  K extends K
    ? K extends `${infer First}.${infer Rest}`
      ? First extends keyof T
        ? T[First] extends (infer U)[]
          ? { [P in First]: DeepPick<U, Rest>[] }
          : { [P in First]: DeepPick<T[First], Rest> }
        : never
      : Pick<T, K & keyof T>
    : never
>

export type TypeFromPath<T extends GenericObject, Path extends string> = {
  [K in Path]: K extends keyof T
    ? T[K]
    : K extends `${infer P}.${infer S}`
      ? T[P] extends GenericObject
        ? TypeFromPath<T[P], S>
        : never
      : never
}[Path]

export type DeepTransform<T, FromType, ToType> = T extends FromType
  ? ToType
  : T extends Array<infer U>
    ? Array<DeepTransform<U, FromType, ToType>>
    : T extends (...args: any[]) => any
      ? T
      : T extends object
        ? {
            [K in keyof T]: DeepTransform<T[K], FromType, ToType>
          }
        : T

export type DeepRemoveIndexSignature<T> = T extends object
  ? T extends Array<infer U>
    ? Array<DeepRemoveIndexSignature<U>>
    : {
        [K in keyof T as string extends K
          ? never
          : number extends K
            ? never
            : K]: DeepRemoveIndexSignature<T[K]>
      }
  : T

export type PartialPick<T, K extends keyof T> = Partial<Pick<T, K>>
