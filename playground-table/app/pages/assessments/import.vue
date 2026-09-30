<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { extendUiToolsLocale, fr } from '#ui-tools/i18n'
import { spreadsheetSteps, useSpreadsheetImport, useSpreadsheetSteps } from '#ui-tools/spreadsheet'

import {
  TEST_CENTERS,
  assessmentsImport,
  cleanWorkbook,
  productsQuery,
  storedAssessments,
  vtestExportWorkbook,
} from '../../data/assessment-import'

const centerId = ref<string>('')
const center = computed(
  () => TEST_CENTERS.find((entry) => entry.id === centerId.value) ?? TEST_CENTERS[0]!,
)
const stored = computed(() => storedAssessments(center.value))
/** One assessment ProCertif has locked, to show a refusal from the server. */
const locked = computed(() => stored.value.at(-2)?.secureCode)

const importer = useSpreadsheetImport(assessmentsImport, {
  context: {
    center: () => center.value,
    products: productsQuery(),
    stored: () => stored.value,
  },
  async onSubmit({ rows, reportProgress }) {
    const rejected: { index: number; message: string }[] = []
    for (const [position, row] of rows.entries()) {
      if (position % 10 === 0) await new Promise((resolve) => setTimeout(resolve, 60))
      if (row.payload.secureCode === locked.value)
        rejected.push({
          index: row.index,
          message: 'Assessment verrouillé : le certificat a déjà été émis par ProCertif',
        })
      reportProgress(position + 1)
    }
    return { rejected }
  },
  submit: { batchSize: 50 },
})

const steps = useSpreadsheetSteps(importer, [
  {
    hint: 'Centre et affiliations',
    key: 'center',
    label: 'Centre de test',
    ready: () => Boolean(centerId.value),
  },
  spreadsheetSteps.file({ hint: 'Export VTest du centre' }),
  spreadsheetSteps.columns({ hint: 'Colonnes du fichier → champs', show: 'when-needed' }),
  spreadsheetSteps.values({ hint: 'Examens → produits, affiliations', label: 'Correspondances' }),
  spreadsheetSteps.review({ hint: 'Lignes valides et erreurs', label: 'Validation' }),
  spreadsheetSteps.submit({ hint: 'Résumé et lancement' }),
])

const locale = extendUiToolsLocale(fr, {
  messages: { spreadsheet: { nav: { import: 'Importer {count} assessments' } } },
})

const reviewing = computed(() => steps.current === 'review')
const matchedFields = computed(
  () => importer.columns.fields.filter((field) => field.status !== 'missing').length,
)

function loadSample(kind: 'clean' | 'export') {
  const file = kind === 'clean' ? cleanWorkbook(center.value) : vtestExportWorkbook(center.value)
  importer.file.load(file.binary, file.name)
}

function chooseCenter(id: string) {
  centerId.value = id
}
</script>

<template>
  <div class="ex-import">
    <header class="ex-import-head">
      <nav class="ex-crumbs" aria-label="Fil d’Ariane">
        <NuxtLink to="/dashboard">Assessments</NuxtLink>
        <UIcon name="i-lucide-chevron-right" class="size-3" />
        <span>Importer</span>
      </nav>
      <div class="ex-import-id">
        <span class="ex-import-tile"
          ><UIcon name="i-lucide-file-spreadsheet" class="size-5.5"
        /></span>
        <div>
          <h1>Importer des assessments</h1>
          <p>Fichier Excel d’un centre de test → passages, scores CECRL, certificats.</p>
        </div>
      </div>
    </header>

    <NutSpreadsheetImportRoot :importer="importer" :steps="steps" :locale="locale">
      <div class="ex-import-body" :class="{ 'ex-import-body--wide': reviewing }">
        <aside class="ex-import-rail">
          <NutSpreadsheetImportStepper orientation="vertical" :compact="reviewing" />
        </aside>

        <div class="grid min-w-0 content-start gap-4">
          <section class="ex-panel">
            <NutSpreadsheetImportStep>
              <template #center>
                <ImportPanelHeader
                  title="Centre de test"
                  hint="Ses groupes d’affiliation deviennent des colonnes du fichier"
                />
                <div class="grid gap-2.5 sm:grid-cols-2">
                  <button
                    v-for="entry in TEST_CENTERS"
                    :key="entry.id"
                    type="button"
                    class="ex-center"
                    :class="{ 'ex-center--on': entry.id === centerId }"
                    :aria-pressed="entry.id === centerId"
                    @click="chooseCenter(entry.id)"
                  >
                    <span class="flex items-center gap-2">
                      <b>{{ entry.name }}</b>
                      <UIcon
                        v-if="entry.id === centerId"
                        name="i-lucide-circle-check"
                        class="ms-auto size-4.5 text-primary"
                      />
                    </span>
                    <small class="font-mono">{{ entry.vtestId }}</small>
                    <span class="flex flex-wrap gap-1">
                      <span
                        v-for="group in entry.affiliationGroups"
                        :key="group.slug"
                        class="ex-chip"
                        >{{ group.name }}</span
                      >
                    </span>
                  </button>
                </div>
              </template>

              <template #file>
                <ImportPanelHeader
                  title="Fichier d’import"
                  :hint="`Export VTest de ${center.name}`"
                >
                  <NutSpreadsheetImportTemplateButton
                    v-if="!importer.file.loaded"
                    label="Modèle Excel"
                    filename="modele-assessments"
                  />
                </ImportPanelHeader>
                <template v-if="importer.file.loaded">
                  <NutSpreadsheetImportFileCard />
                  <NutSpreadsheetImportSourceSettings />
                </template>
                <template v-else>
                  <NutSpreadsheetImportDropzone />
                  <div class="ex-samples">
                    <UIcon name="i-lucide-flask-conical" class="size-4 shrink-0 text-dimmed" />
                    <span>Fichiers d’exemple</span>
                    <UButton
                      size="xs"
                      color="neutral"
                      variant="outline"
                      label="Fait avec le modèle"
                      @click="loadSample('clean')"
                    />
                    <UButton
                      size="xs"
                      color="neutral"
                      variant="outline"
                      label="Export VTest brut"
                      @click="loadSample('export')"
                    />
                  </div>
                  <NutSpreadsheetImportExpectedColumns />
                </template>
              </template>

              <template #columns>
                <ImportPanelHeader
                  title="Colonnes"
                  :hint="`${matchedFields} champs sur ${importer.columns.fields.length} trouvés dans ${importer.file.name}`"
                />
                <NutSpreadsheetImportColumnMapping />
              </template>

              <template #values>
                <ImportPanelHeader
                  title="Correspondances"
                  hint="Chaque choix s’applique à toutes les lignes qui utilisent la valeur"
                />
                <NutSpreadsheetImportValueMapping />
              </template>

              <template #review>
                <ImportPanelHeader
                  title="Validation"
                  :hint="`${importer.file.name} · ${importer.rows.all.length} lignes lues`"
                >
                  <NutSpreadsheetImportExportButton />
                </ImportPanelHeader>
                <NutSpreadsheetImportStats>
                  <template #extra>
                    <NutSpreadsheetImportStat
                      :value="importer.rows.distinct('examName').length"
                      label="examens distincts"
                    />
                    <NutSpreadsheetImportStat
                      :value="center.affiliationGroups.length"
                      label="groupes d’affiliation"
                    />
                  </template>
                </NutSpreadsheetImportStats>
                <div class="ex-grid">
                  <NutSpreadsheetImportTableToolbar />
                  <div
                    class="grid min-w-0"
                    :class="importer.review.inspected ? 'xl:grid-cols-[minmax(0,1fr)_23rem]' : ''"
                  >
                    <NutSpreadsheetImportTable height="32rem" />
                    <NutSpreadsheetImportRowInspector
                      v-if="importer.review.inspected"
                      height="32rem"
                      class="border-default max-xl:border-t xl:border-s"
                    />
                  </div>
                </div>
              </template>

              <template #submit>
                <NutSpreadsheetImportProgress v-if="importer.submit.status !== 'idle'" />
                <template v-else>
                  <ImportPanelHeader
                    title="Prêt à importer"
                    hint="Vérifiez le résumé avant de lancer"
                  />
                  <NutSpreadsheetImportSummary>
                    <template #rows>
                      <div
                        class="grid grid-cols-[minmax(0,14rem)_minmax(0,1fr)] gap-4 border-b border-default py-2.5 text-sm"
                      >
                        <dt class="text-muted">Centre</dt>
                        <dd class="text-highlighted">
                          {{ center.name }} ·
                          <span class="font-mono text-xs">{{ center.vtestId }}</span>
                        </dd>
                      </div>
                      <div
                        class="grid grid-cols-[minmax(0,14rem)_minmax(0,1fr)] gap-4 border-b border-default py-2.5 text-sm"
                      >
                        <dt class="text-muted">Après import</dt>
                        <dd class="text-highlighted">
                          Génération des certificats · synchronisation ProCertif
                        </dd>
                      </div>
                    </template>
                  </NutSpreadsheetImportSummary>
                  <p class="ex-note">
                    <UIcon name="i-lucide-info" class="size-4 shrink-0" />
                    L’import tourne en tâche de fond. Vous suivez sa progression ici et pouvez
                    continuer à travailler.
                  </p>
                </template>
              </template>
            </NutSpreadsheetImportStep>
          </section>
          <NutSpreadsheetImportStepNav cancel-to="/dashboard" />
        </div>
      </div>
    </NutSpreadsheetImportRoot>
  </div>
</template>

<style scoped>
.ex-import {
  min-height: 100%;
  overflow: auto;
  --nut-sheet-accent-fg: #1f1d1a;
}
.ex-import-head {
  background: var(--ex-surface);
  border-bottom: 1px solid var(--ui-border);
  padding: 18px 28px 18px;
}
.ex-crumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--ui-text-muted);
  margin-bottom: 16px;
}
.ex-crumbs a:hover {
  color: var(--ui-text);
}
.ex-crumbs span {
  color: var(--ui-text);
}
.ex-import-id {
  display: flex;
  align-items: center;
  gap: 16px;
}
.ex-import-tile {
  width: 52px;
  height: 52px;
  border-radius: 13px;
  background: var(--ex-selection);
  color: var(--nut-dl-accent-ink);
  display: grid;
  place-items: center;
  flex: none;
}
.ex-import-id h1 {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.1;
  margin: 0;
}
.ex-import-id p {
  margin: 6px 0 0;
  color: var(--ui-text-muted);
  font-size: 13.5px;
}
.ex-import-body {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  padding: 24px 28px 64px;
  max-width: 1120px;
  transition:
    grid-template-columns 0.25s ease,
    max-width 0.25s ease;
}
.ex-import-body--wide {
  grid-template-columns: 52px minmax(0, 1fr);
  max-width: 1600px;
}
.ex-import-rail {
  position: sticky;
  top: 20px;
  min-width: 0;
}
.ex-panel {
  background: var(--ex-surface);
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  padding: 22px 24px 24px;
  min-width: 0;
}
.ex-grid {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
}
.ex-center {
  display: grid;
  gap: 6px;
  text-align: start;
  padding: 14px 16px;
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  background: var(--ex-surface);
  transition: border-color 0.12s;
}
.ex-center:hover {
  border-color: var(--ui-border-accented);
}
.ex-center--on {
  border-color: var(--ui-primary);
  background: var(--ex-selection);
  box-shadow: 0 0 0 3px var(--ex-ring);
}
.ex-center b {
  font-size: 14px;
  font-weight: 600;
}
.ex-center small {
  color: var(--ui-text-muted);
  font-size: 12px;
}
.ex-chip {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--ex-chip);
  color: var(--ex-ink-soft);
  font-size: 11px;
  font-weight: 600;
}
.ex-samples {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--ui-bg-muted);
  color: var(--ui-text-muted);
  font-size: 12.5px;
}
.ex-note {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 9px;
  background: var(--ui-bg-muted);
  color: var(--ui-text-toned);
  font-size: 13px;
}
@media (max-width: 1023px) {
  .ex-import-head {
    padding: 14px 16px;
  }
  .ex-import-body,
  .ex-import-body--wide {
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
    padding: 16px 16px 48px;
  }
  .ex-import-rail {
    position: static;
  }
  .ex-panel {
    padding: 16px;
  }
}
</style>
