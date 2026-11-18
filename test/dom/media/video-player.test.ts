import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import AudioPlayer from '#ui-tools/media/components/audio-player.vue'
import VideoPlayer from '#ui-tools/media/components/video-player.vue'

let wrapper: ReturnType<typeof mount> | undefined
afterEach(() => wrapper?.unmount())

/** Gives the media element a known length and fires the metadata event, as a browser would. */
async function loadMetadata(element: HTMLMediaElement, duration: number) {
  await nextTick()
  Object.defineProperty(element, 'duration', { configurable: true, value: duration })
  element.dispatchEvent(new Event('durationchange'))
  element.dispatchEvent(new Event('loadedmetadata'))
  await nextTick()
}

describe('VideoPlayer', () => {
  it('shows the start overlay with its title, and controls only once playback started', () => {
    wrapper = mount(VideoPlayer, {
      attachTo: document.body,
      props: { src: '/tutorial.mp4', title: 'Bienvenue' },
    })

    expect(wrapper.find('video').attributes('src')).toBe('/tutorial.mp4')
    expect(wrapper.find('[data-video-player-start]').text()).toContain('Bienvenue')
    expect(wrapper.find('[data-file-preview-media-controls]').exists()).toBeFalsy()
    expect(wrapper.find('[data-video-player]').attributes('aria-label')).toBe('Bienvenue')
  })

  it('mutes with M while focused, and ignores keys when the keyboard is off', async () => {
    wrapper = mount(VideoPlayer, { attachTo: document.body, props: { src: '/tutorial.mp4' } })

    const frame = wrapper.find('[data-video-player]')
    const video = wrapper.find('video').element

    await frame.trigger('keydown', { key: 'm' })
    await nextTick()
    expect(video.muted).toBeTruthy()

    await wrapper.setProps({ keyboard: false })
    await frame.trigger('keydown', { key: 'm' })
    await nextTick()
    expect(video.muted).toBeTruthy()
    expect(frame.attributes('tabindex')).toBeUndefined()
  })

  it('counts a play from the start, shows the plays left, and locks once all are used', async () => {
    wrapper = mount(VideoPlayer, {
      attachTo: document.body,
      props: { src: '/listening.mp4', maxPlays: 2, plays: 1 },
    })

    expect(wrapper.find('[data-video-player-plays]').text()).toBe('1 lecture restante')

    await wrapper.find('[data-video-player-start]').trigger('click')
    await nextTick()
    expect(wrapper.emitted('update:plays')?.at(-1)).toEqual([2])

    wrapper.unmount()
    wrapper = mount(VideoPlayer, {
      attachTo: document.body,
      props: { src: '/listening.mp4', maxPlays: 2, plays: 2 },
    })
    expect(wrapper.find('[data-video-player-locked]').text()).toBe('Plus de lecture possible')
    expect(wrapper.find('[data-video-player-start]').exists()).toBeFalsy()
  })

  it('starts the clip at `start`, and turns the timeline into a progress bar when not seekable', async () => {
    wrapper = mount(VideoPlayer, {
      attachTo: document.body,
      props: { src: '/lecture.mp4', start: 12, end: 40, seekable: false },
    })
    const video = wrapper.find('video').element

    await loadMetadata(video, 60)
    expect(video.currentTime).toBe(12)

    await wrapper.find('[data-video-player-start]').trigger('click')
    await nextTick()
    expect(wrapper.find('[role="progressbar"]').exists()).toBeTruthy()
    expect(wrapper.find('[data-file-preview-time]').text()).toBe('0:00 / 0:28')
    expect(wrapper.find('video').attributes('disablepictureinpicture')).toBeDefined()

    video.currentTime = 35
    video.dispatchEvent(new Event('seeking'))
    await nextTick()
    expect(video.currentTime).toBe(12)
  })

  it('removes hidden controls and the speed menu, and offers the download', async () => {
    wrapper = mount(VideoPlayer, {
      attachTo: document.body,
      props: {
        src: '/lecture.mp4',
        hide: ['volume', 'time'],
        rates: false,
        download: { url: '/files/lecture.mp4', fileName: 'Cours 1.mp4' },
      },
    })

    await wrapper.find('[data-video-player-start]').trigger('click')
    await nextTick()
    expect(wrapper.find('[aria-label="Couper le son"]').exists()).toBeFalsy()
    expect(wrapper.find('[data-file-preview-time]').exists()).toBeFalsy()
    expect(wrapper.find('[aria-label="Vitesse de lecture"]').exists()).toBeFalsy()
    expect(wrapper.find('[data-media-download]').attributes('to')).toBe('/files/lecture.mp4')
    expect(wrapper.find('[data-media-download]').attributes('download')).toBe('Cours 1.mp4')
  })
  it('counts one play when metadata only loads after the first click (preload none)', async () => {
    wrapper = mount(VideoPlayer, {
      attachTo: document.body,
      props: { src: '/lazy.mp4', maxPlays: 2, preload: 'none' },
    })
    const video = wrapper.find('video').element

    await nextTick()
    await wrapper.find('[data-video-player-start]').trigger('click')
    await loadMetadata(video, 30)
    expect(wrapper.emitted('update:plays')).toHaveLength(1)
    expect(wrapper.find('[data-video-player-locked]').exists()).toBeFalsy()
  })

  it('ends the play instead of replaying it when the browser loops the video', async () => {
    wrapper = mount(VideoPlayer, {
      attachTo: document.body,
      props: { src: '/lecture.mp4', maxPlays: 1 },
    })
    const video = wrapper.find('video').element

    await loadMetadata(video, 30)
    await wrapper.find('[data-video-player-start]').trigger('click')
    await nextTick()
    video.loop = true
    video.currentTime = 0
    video.dispatchEvent(new Event('seeking'))
    await nextTick()
    expect(video.loop).toBeFalsy()
    expect(wrapper.emitted('ended')).toHaveLength(1)
    expect(wrapper.find('[data-video-player-locked]').exists()).toBeTruthy()
  })

  it('emits download for the host to save the file when `download` is true', async () => {
    wrapper = mount(VideoPlayer, {
      attachTo: document.body,
      props: { src: '/lecture.mp4', download: true },
    })

    await wrapper.find('[data-video-player-start]').trigger('click')
    await nextTick()
    await wrapper.find('[data-media-download]').trigger('click')
    expect(wrapper.emitted('download')).toHaveLength(1)
    expect(wrapper.find('[data-media-download]').attributes('to')).toBeUndefined()
  })
})

describe('AudioPlayer', () => {
  it('shows the bar at once and refuses to play once every play is used', () => {
    wrapper = mount(AudioPlayer, {
      attachTo: document.body,
      props: { src: '/dialogue.mp3', title: 'Dialogue', maxPlays: 1, plays: 1 },
    })

    expect(wrapper.find('[data-audio-player]').attributes('aria-label')).toBe('Dialogue')
    const play = wrapper.find('[data-file-preview-play]')
    expect(play.attributes('aria-label')).toBe('Plus de lecture possible')
    expect(play.attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-media-plays-left]').text()).toBe('Plus de lecture possible')
    expect(wrapper.find('[aria-label="Couper le son"]').exists()).toBeFalsy()
    expect(wrapper.find('[role="progressbar"]').exists()).toBeFalsy()
  })

  it('plays from the clip start and reports the clip as ended at `end`', async () => {
    wrapper = mount(AudioPlayer, {
      attachTo: document.body,
      props: { src: '/dialogue.mp3', start: 5, end: 20, seekable: false },
    })
    const audio = wrapper.find('audio').element

    await loadMetadata(audio, 90)
    await wrapper.find('[data-file-preview-play]').trigger('click')
    await nextTick()
    expect(audio.currentTime).toBe(5)
    expect(wrapper.emitted('update:plays')?.at(-1)).toEqual([1])
    expect(wrapper.find('[role="progressbar"]').exists()).toBeTruthy()

    audio.currentTime = 20
    audio.dispatchEvent(new Event('timeupdate'))
    await nextTick()
    await nextTick()
    expect(wrapper.emitted('ended')).toHaveLength(1)
  })
})
