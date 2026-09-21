<script setup lang="ts">
import { CurveType } from '@unovis/ts'
import VisArea from '@unovis/vue/components/area'
import VisLine from '@unovis/vue/components/line'
import VisPlotline from '@unovis/vue/components/plotline'
import VisScatter from '@unovis/vue/components/scatter'

import type { DashboardChartDatum } from '../../../types'
import type { DashboardXyLayer } from './xy-layers'

/**
 * Line-side marks of one value axis: area fills, dashed comparison lines, solid lines, their point
 * markers, and reference lines. Rendered inside a `VisXYContainer`, which registers them.
 */
defineProps<{
  layer: DashboardXyLayer
  data: DashboardChartDatum[]
}>()

const x = (datum: DashboardChartDatum) => datum.index
const dash = () => [4, 5]
const surface = () => 'var(--ui-bg)'
</script>

<template>
  <VisArea
    v-for="area in layer.areas"
    :key="`area-${area.key}`"
    :data="area.data"
    :x="x"
    :y="area.y"
    :color="area.color"
    :opacity="area.opacity"
    :curve-type="CurveType.MonotoneX"
  />
  <VisLine
    v-if="layer.dashed.count"
    :data="data"
    :x="x"
    :y="layer.dashed.y"
    :color="layer.dashed.color"
    :line-dash-array="dash"
    :line-width="1.5"
    :curve-type="CurveType.MonotoneX"
  />
  <VisLine
    v-if="layer.solid.count"
    :data="data"
    :x="x"
    :y="layer.solid.y"
    :color="layer.solid.color"
    :line-width="2"
    :curve-type="CurveType.MonotoneX"
  />
  <VisScatter
    v-for="dots in layer.dots"
    :key="`dots-${dots.key}`"
    :data="dots.data"
    :x="x"
    :y="dots.y"
    :size="5.2"
    :color="surface"
    :stroke-color="dots.stroke"
    :stroke-width="1.6"
  />
  <VisPlotline
    v-for="reference in layer.references"
    :key="reference.key"
    axis="y"
    :value="reference.value"
    :line-style="[2, 4]"
    :line-width="1"
    color="var(--nut-dash-ref)"
    :label-text="reference.text"
    :label-position="reference.position"
    :label-offset-x="4"
    :label-offset-y="7"
    label-color="var(--nut-dash-ref-label)"
    :label-size="10"
  />
</template>
