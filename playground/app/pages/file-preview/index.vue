<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'

import type { FilePreviewFile, FilePreviewModeInput } from '#ui-tools/file-preview'
import { defineFormSchema, useForm } from '#ui-tools/form'

import { createFilePreviewSamples } from '../../lib/file-preview-samples'

const MODES = ['auto', 'modal', 'drawer', 'fullscreen'] as const

const filePreview = useFilePreview()
const samples = shallowRef<readonly FilePreviewFile[]>([])
const mode = ref<(typeof MODES)[number]>('auto')

function containerMode(): FilePreviewModeInput | undefined {
  return mode.value === 'auto' ? undefined : mode.value
}

function openOne(file: FilePreviewFile) {
  filePreview.open(file, { mode: containerMode() })
}

function openAll(index = 0) {
  filePreview.open(samples.value, { index, mode: containerMode() })
}

const form = useForm({
  schema: defineFormSchema({
    actions: [],
    fields: [
      {
        key: 'documents',
        label: 'Documents',
        output: 'object',
        props: { multiple: true },
        type: 'upload',
        upload: {
          handler: async ({ files }) => {
            const file = files[0]
            return file ? { name: file.name, size: file.size, type: file.type } : null
          },
        },
      },
    ],
  }),
})

onMounted(async () => {
  samples.value = await createFilePreviewSamples()
})
</script>

<template>
  <PlaygroundContent mode="document">
    <section class="mx-auto grid w-full max-w-4xl gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header class="grid max-w-2xl gap-3">
        <p class="font-mono text-[11px] font-medium tracking-[0.18em] text-muted uppercase">
          File preview
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Renderers</h1>
        <p class="text-sm leading-6 text-muted">
          <code>useFilePreview().open()</code> picks a renderer and a container for each file. Media
          open in a modal, documents in a drawer, and phones always get fullscreen. The last sample
          fails once to show Retry.
        </p>
      </header>

      <div class="flex flex-wrap items-center gap-3">
        <UFieldGroup>
          <UButton
            v-for="option in MODES"
            :key="option"
            :label="option"
            color="neutral"
            :variant="mode === option ? 'solid' : 'outline'"
            size="sm"
            class="capitalize"
            @click="mode = option"
          />
        </UFieldGroup>
        <UButton
          icon="i-lucide-gallery-horizontal"
          label="Open all as a gallery"
          size="sm"
          :disabled="samples.length === 0"
          @click="openAll()"
        />
      </div>

      <ul class="m-0 grid list-none divide-y divide-default rounded-lg border border-default p-0">
        <li
          v-for="(file, index) in samples"
          :key="file.name"
          class="flex items-center gap-3 px-3 py-2.5"
        >
          <span class="min-w-0 flex-1 truncate text-sm text-highlighted">{{ file.name }}</span>
          <UButton
            label="Open"
            size="xs"
            color="neutral"
            variant="outline"
            @click="openOne(file)"
          />
          <UButton
            label="In gallery"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="openAll(index)"
          />
        </li>
        <li v-if="samples.length === 0" class="px-3 py-6 text-center text-sm text-muted">
          Generating samples…
        </li>
      </ul>

      <section class="grid gap-3">
        <h2 class="text-base font-semibold text-highlighted">Upload field</h2>
        <p class="m-0 text-sm text-muted">
          With the provider mounted, opening an uploaded file previews the field's files as a
          gallery, straight from the browser's copy.
        </p>
        <NutForm :form="form" />
      </section>
    </section>
  </PlaygroundContent>
</template>
