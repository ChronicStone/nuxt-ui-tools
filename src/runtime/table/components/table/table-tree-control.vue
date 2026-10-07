<script setup lang="ts">
/**
 * The control column's cell, left to right: one gutter per level of depth, the chevron, the
 * row's checkbox.
 *
 * The column is as wide as the deepest loaded row needs, so every row shares one width and the
 * first data column starts at the same x on all of them; indentation happens inside this cell. The
 * chevron's and the checkbox's footprints are always reserved, so a childless or unselectable row
 * keeps its place.
 *
 * Everything is drawn inside one absolutely positioned layer, so the rails run the full height of
 * the row however tall its other cells are. The cell itself has no border: `__rule` draws the
 * row's separator the full width of the cell, like every other cell's, and comes first in the layer
 * so the rails paint over it instead of being cut by it.
 */
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useTableInternals } from '../../composables/use-table-internals'
import type { TableTreeNode } from '../../types'
import { getTreeLineage, getTreeRails } from '../../utils/tree'
import TableSelectionControl from './table-selection-control.vue'

const props = defineProps<{
  node: TableTreeNode
  expanded: boolean
  /** The row's position in the rendered list: a lit rail stops at the row under the pointer. */
  index: number
  selected: boolean
  /** Whether the row carries a checkbox; its width is reserved either way. */
  checkbox: boolean
}>()
const emit = defineEmits<{ toggle: []; select: [event: MouseEvent] }>()

const { t } = useUiToolsLocale()
const { tree } = useTableInternals()

/**
 * How each gutter sits on the path to the row under the pointer, one character per gutter: `t` for
 * the row where the path turns into its chevron, `v` for the rows above it that the path runs
 * past, `-` for a gutter off the path. A string, so a row only re-renders when its own answer
 * changes.
 */
const lineage = computed(() => getTreeLineage(props.node))
const rails = computed(() => getTreeRails(props.node))
const lit = computed(() => {
  let states = ''
  for (let position = 0; position < props.node.depth; position += 1) {
    const group = lineage.value[position]
    const until = group === undefined ? -1 : tree.litUntil(group.id)
    states += props.index === until ? 't' : props.index < until ? 'v' : '-'
  }
  return states
})
const onPath = computed(() => tree.isOnPath(props.node.id))

const gutters = computed(() =>
  Array.from({ length: props.node.depth }, (_, position) => {
    const own = position === props.node.depth - 1
    return {
      /* This row's own level: down from the top, then a rounded turn toward the chevron. */
      elbow: own,
      lit: lit.value[position],
      position,
      /* An ancestor with a sibling still to come keeps its rail running through this row. */
      rail: !own && rails.value[position] === true,
      /* Siblings follow, so this row's own rail carries on below the turn. */
      tail: own && !props.node.isLast,
    }
  }),
)

function onKeydown(event: KeyboardEvent) {
  const opens = event.key === 'ArrowRight' && !props.expanded
  const closes = event.key === 'ArrowLeft' && props.expanded
  if (!opens && !closes) return
  event.preventDefault()
  emit('toggle')
}
</script>

<template>
  <div class="nut-dl-tree" :class="{ 'nut-dl-tree--leaf': !node.hasChildren }">
    <span class="nut-dl-tree__rule" aria-hidden="true" />
    <span
      v-for="gutter in gutters"
      :key="gutter.position"
      class="nut-dl-tree__gutter"
      :class="{
        'nut-dl-tree__gutter--elbow': gutter.elbow,
        'nut-dl-tree__gutter--rail': gutter.rail,
        'nut-dl-tree__gutter--tail': gutter.tail,
      }"
      :data-lit="gutter.lit === '-' ? undefined : gutter.lit"
      aria-hidden="true"
    />
    <span
      class="nut-dl-tree__node"
      :data-open="expanded || undefined"
      :data-path="onPath || undefined"
    >
      <button
        v-if="node.hasChildren"
        type="button"
        class="nut-dl-tree__toggle"
        :aria-expanded="expanded"
        :aria-label="expanded ? t('table.tree.collapse') : t('table.tree.expand')"
        @click.stop="emit('toggle')"
        @keydown="onKeydown"
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
          <path
            d="m9 18 6-6-6-6"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <!--
        A childless row keeps the chevron's footprint empty, so every elbow and rail lines up with
        its siblings that do have one. This branch and the shared width in `.nut-dl-tree__slot`
        are the whole decision: drop both to let childless rows pull left instead.
      -->
      <span v-else class="nut-dl-tree__slot" aria-hidden="true" />
    </span>
    <span class="nut-dl-tree__check">
      <TableSelectionControl
        v-if="checkbox"
        :model-value="selected"
        :ariaLabel="t('table.tree.selectRow')"
        @toggle="emit('select', $event)"
      />
    </span>
  </div>
</template>

<style>
.nut-dl-tree {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: stretch;
  padding-left: var(--nut-dl-tree-lead);
  /* A rail sits on the chevron's centre line, so a child's elbow drops out of its parent's chevron
     exactly; the turn stops just short of the chevron it points at. */
  --nut-dl-tree-axis: calc(var(--nut-dl-tree-toggle) / 2);
  --nut-dl-tree-arm: calc(var(--nut-dl-tree-gutter) - var(--nut-dl-tree-axis) + 1px);
}
.nut-dl-tree--leaf {
  /* With no chevron to meet, the elbow runs on to the middle of the empty slot. */
  --nut-dl-tree-arm: var(--nut-dl-tree-gutter);
}

/* ── rails ──────────────────────────────────────────────────── */
/*
 * Three colours per gutter, so the hover path can light exactly its own stretch: the vertical, the
 * turn toward a chevron, and the tail that carries on to the next sibling. A gutter the path runs
 * past (`v`) lights its vertical and tail; the one it turns in (`t`) lights the vertical and the
 * turn, and leaves the tail, which leads away from the path, as it was.
 */
.nut-dl-tree__gutter {
  --nut-dl-tree-vertical: var(--nut-dl-rail);
  --nut-dl-tree-turn: var(--nut-dl-rail);
  --nut-dl-tree-tail: var(--nut-dl-rail);
  position: relative;
  flex: none;
  align-self: stretch;
  width: var(--nut-dl-tree-gutter);
}
.nut-dl-tree__gutter[data-lit='v'] {
  --nut-dl-tree-vertical: var(--nut-dl-rail-lit);
  --nut-dl-tree-tail: var(--nut-dl-rail-lit);
}
.nut-dl-tree__gutter[data-lit='t'] {
  --nut-dl-tree-vertical: var(--nut-dl-rail-lit);
  --nut-dl-tree-turn: var(--nut-dl-rail-lit);
}
.nut-dl-tree__gutter--rail::before,
.nut-dl-tree__gutter--tail::after {
  content: '';
  position: absolute;
  left: var(--nut-dl-tree-axis);
  width: 1px;
  transition: background-color 0.14s ease;
}
.nut-dl-tree__gutter--rail::before {
  background: var(--nut-dl-tree-vertical);
}
.nut-dl-tree__gutter--tail::after {
  background: var(--nut-dl-tree-tail);
}
.nut-dl-tree__gutter--rail::before {
  top: 0;
  bottom: 0;
}
.nut-dl-tree__gutter--tail::after {
  top: 50%;
  bottom: 0;
}
.nut-dl-tree__gutter--elbow::before {
  content: '';
  position: absolute;
  top: 0;
  left: var(--nut-dl-tree-axis);
  box-sizing: border-box;
  width: var(--nut-dl-tree-arm);
  height: 50%;
  border-bottom: 1px solid var(--nut-dl-tree-turn);
  border-left: 1px solid var(--nut-dl-tree-vertical);
  border-bottom-left-radius: var(--nut-dl-rail-radius);
  transition: border-color 0.14s ease;
}

/* ── chevron ────────────────────────────────────────────────── */
.nut-dl-tree__node {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  align-self: stretch;
}
/* The stub joining an open branch to the first rail of its children. */
.nut-dl-tree__node::after {
  content: '';
  position: absolute;
  top: calc(50% + var(--nut-dl-tree-axis) + 1px);
  bottom: 0;
  left: var(--nut-dl-tree-axis);
  width: 1px;
  background: var(--nut-dl-rail);
  opacity: 0;
  transition:
    opacity 0.16s ease,
    background-color 0.14s ease;
}
.nut-dl-tree__node[data-open]::after {
  opacity: 1;
}
.nut-dl-tree__node[data-path]::after {
  background: var(--nut-dl-rail-lit);
}
.nut-dl-tree__toggle,
.nut-dl-tree__slot {
  flex: none;
  width: var(--nut-dl-tree-toggle);
  height: var(--nut-dl-tree-toggle);
}
.nut-dl-tree__toggle {
  position: relative;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: var(--nut-dl-rail-radius);
  background: transparent;
  color: var(--ui-text-dimmed);
  cursor: pointer;
  outline: none;
  transition:
    background-color 0.12s ease,
    color 0.12s ease,
    transform 0.12s ease;
}
/* A touch-sized target around a small mark. */
.nut-dl-tree__toggle::before {
  content: '';
  position: absolute;
  inset: -8px -5px;
}
.nut-dl-tree__toggle:hover {
  background: var(--nut-dl-toggle-hover);
  color: var(--ui-text-highlighted);
}
.nut-dl-tree__toggle:active {
  background: color-mix(in srgb, var(--ui-text) 10%, var(--nut-dl-toggle-hover));
  transform: scale(0.9);
}
.nut-dl-tree__toggle:focus-visible {
  outline: 2px solid var(--nut-dl-accent);
  outline-offset: 1px;
}
.nut-dl-tree__toggle[aria-expanded='true'] {
  color: var(--ui-text-toned);
}
.nut-dl-tree__toggle svg {
  transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.nut-dl-tree__toggle[aria-expanded='true'] svg {
  transform: rotate(90deg);
}

/* ── checkbox ───────────────────────────────────────────────── */
/* Its width is held whether or not this row has one. */
.nut-dl-tree__check {
  display: flex;
  flex: none;
  align-items: center;
  align-self: stretch;
  width: var(--nut-dl-tree-check);
  margin-left: var(--nut-dl-tree-gap);
}

/* ── row separator ──────────────────────────────────────────── */
/* The same hairline every other cell has. Rails and stubs are positioned after it, so they cross
   it unbroken. */
.nut-dl-tree__rule {
  position: absolute;
  inset: auto 0 0;
  height: 1px;
  background: var(--nut-dl-line-soft);
}
.nut-dl-table__table tbody:has(+ tfoot) > .nut-dl-row:last-child .nut-dl-tree__rule {
  display: none;
}

/* ── the column ─────────────────────────────────────────────── */
.nut-dl-row > .nut-dl-td.nut-dl-td--tree,
.nut-dl-row > .nut-dl-td.nut-dl-td--tree:first-child {
  padding: 0;
  border-bottom: 0;
}
.nut-dl-td--tree:not(.nut-dl-pin) {
  position: relative;
}
.nut-dl-th--tree .nut-dl-th__static {
  padding-right: 0;
  padding-left: var(--nut-dl-tree-lead);
}

/* ── a branch opening or closing ────────────────────────────── */
/*
 * Opacity and a few pixels of translate on the rows themselves, never a height: a height change
 * under a virtualizer makes it re-measure every frame. The stagger step matches STAGGER_MS in
 * use-table-tree.
 */
.nut-dl-row--reveal {
  animation: nut-dl-tree-reveal 0.19s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: calc(var(--nut-dl-tree-i, 0) * 24ms);
}
.nut-dl-row--conceal {
  animation: nut-dl-tree-conceal 0.12s ease-in both;
  pointer-events: none;
}
@keyframes nut-dl-tree-reveal {
  from {
    opacity: 0;
    transform: translateY(calc(var(--nut-dl-tree-shift) * -1));
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes nut-dl-tree-conceal {
  from {
    opacity: 1;
    transform: none;
  }
  to {
    opacity: 0;
    transform: translateY(calc(var(--nut-dl-tree-shift) * -1));
  }
}

@media (prefers-reduced-motion: reduce) {
  .nut-dl-row--reveal,
  .nut-dl-row--conceal {
    animation: none;
  }
  .nut-dl-tree__toggle,
  .nut-dl-tree__toggle svg,
  .nut-dl-tree__node::after,
  .nut-dl-tree__gutter--rail::before,
  .nut-dl-tree__gutter--tail::after,
  .nut-dl-tree__gutter--elbow::before {
    transition: none;
  }
}
</style>
