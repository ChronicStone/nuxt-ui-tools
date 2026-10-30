import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import VideoPlayer from '#ui-tools/media/components/video-player.vue'

let wrapper: ReturnType<typeof mount> | undefined
afterEach(() => wrapper?.unmount())

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
})
