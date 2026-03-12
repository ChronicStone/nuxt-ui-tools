import type { TableSerializerDefinition } from '@lib/types'

export function defineTableSerializer<
  const TSerializer extends TableSerializerDefinition,
>(
  serializer: TSerializer,
): TSerializer {
  return serializer
}
