<script setup lang="ts">
import { ref } from 'vue'

const VIDEO = '/media/lesson.mp4'
const AUDIO = '/media/dialogue.mp3'

const lessonPlays = ref(0)
const listeningPlays = ref(0)
const lessonEnded = ref(0)
</script>

<template>
  <PlaygroundContent mode="document">
    <section class="mx-auto grid w-full max-w-4xl gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <header class="grid max-w-2xl gap-3">
        <p class="font-mono text-[11px] font-medium tracking-[0.18em] text-muted uppercase">
          File preview
        </p>
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted">Media players</h1>
        <p class="m-0 text-sm leading-6 text-muted">
          <code>UiVideoPlayer</code> and <code>UiAudioPlayer</code> share one control bar and one
          set of rules: a clip between <code>start</code> and <code>end</code>, a play limit, a
          locked timeline, custom speeds, hidden controls and a download button.
        </p>
      </header>

      <section id="video-default" class="grid gap-3">
        <h2 class="m-0 text-base font-semibold text-highlighted">Video, default</h2>
        <NutVideoPlayer
          :src="VIDEO"
          title="Leçon 1 : présentation"
          :tracks="[
            { src: '/media/lesson.fr.vtt', srcLang: 'fr', label: 'Français', default: true },
            { src: '/media/lesson.en.vtt', srcLang: 'en', label: 'English' },
          ]"
          class="aspect-video rounded-lg"
        />
      </section>

      <section id="video-rules" class="grid gap-3">
        <h2 class="m-0 text-base font-semibold text-highlighted">Video with rules</h2>
        <p class="m-0 text-sm text-muted">
          Clip 0:05 to 0:30, no seeking, 2 plays, speeds 0.75× to 1.25×, download. Plays used:
          {{ lessonPlays }} · ended {{ lessonEnded }} times.
        </p>
        <NutVideoPlayer
          v-model:plays="lessonPlays"
          :src="VIDEO"
          title="Compréhension orale"
          :start="5"
          :end="30"
          :seekable="false"
          :max-plays="2"
          :rates="[0.75, 1, 1.25]"
          :download="{ url: VIDEO, fileName: 'Compréhension orale.mp4' }"
          class="aspect-video rounded-lg"
          @ended="lessonEnded += 1"
        />
      </section>

      <section id="video-locked" class="grid gap-3">
        <h2 class="m-0 text-base font-semibold text-highlighted">Video, every play used</h2>
        <NutVideoPlayer
          :src="VIDEO"
          title="Compréhension orale"
          :max-plays="1"
          :plays="1"
          class="aspect-video rounded-lg"
        />
      </section>

      <section id="video-minimal" class="grid gap-3">
        <h2 class="m-0 text-base font-semibold text-highlighted">Video, minimal bar</h2>
        <p class="m-0 text-sm text-muted">
          <code>hide</code> removes volume, captions, picture in picture and full screen;
          <code>:rates="false"</code> removes the speed menu.
        </p>
        <NutVideoPlayer
          :src="VIDEO"
          :hide="['volume', 'captions', 'pictureInPicture', 'fullscreen']"
          :rates="false"
          class="aspect-video rounded-lg"
        />
      </section>

      <section id="audio" class="grid gap-3">
        <h2 class="m-0 text-base font-semibold text-highlighted">Audio</h2>
        <NutAudioPlayer :src="AUDIO" title="Dialogue" />
        <p class="m-0 text-sm text-muted">
          No seeking, 2 plays, download. Plays used: {{ listeningPlays }}.
        </p>
        <NutAudioPlayer
          v-model:plays="listeningPlays"
          :src="AUDIO"
          title="Dialogue à écouter"
          :seekable="false"
          :max-plays="2"
          :download="{ url: AUDIO, fileName: 'Dialogue.mp3' }"
        />
        <p class="m-0 text-sm text-muted">Every play used.</p>
        <NutAudioPlayer :src="AUDIO" title="Dialogue" :max-plays="1" :plays="1" />
      </section>
    </section>
  </PlaygroundContent>
</template>
