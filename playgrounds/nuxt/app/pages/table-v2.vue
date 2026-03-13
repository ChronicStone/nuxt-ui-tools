<script setup lang="ts">
import DataList from '../../../../packages/table/src/components/DataList.vue'
import { useTable } from '../../../../packages/table/src'
import { tableSchema } from '../composables/useTablePlaygroundSchema'

const { classes } = usePlaygroundAppearance()
const table = useTable(tableSchema)
</script>

<template>
  <section :class="classes.pageStack">
    <div :class="classes.panel">
      <div :class="classes.panelMeta">
        <UBadge color="primary" variant="soft" label="DataList V2" />
        <UBadge color="neutral" variant="subtle" label="Table Playground" />
      </div>

      <div :class="classes.panelCopy">
        <h2 :class="classes.panelTitle">Compact renderer preview</h2>
        <p :class="classes.panelText">
          The playground is back on the original shell, and the table now leans on Nuxt UI defaults so it can inherit the current theme cleanly.
        </p>
      </div>

      <DataList
        :table="table"
        :height="'38rem'"
        title="Users"
        description="Remote employees schema rendered through the V2 DataList shell."
      />
    </div>
  </section>
</template>
