import type { TableSerializerDefinition } from '../types/source'

export function defineTableSerializer<
  const TSerializer extends TableSerializerDefinition,
>(
  serializer: TSerializer,
): TSerializer {
  return serializer
}
