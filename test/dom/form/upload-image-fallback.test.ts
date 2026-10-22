import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FormFilePreview from '#ui-tools/form/components/utils/form-file-preview.vue'
import UploadItem from '#ui-tools/form/fields/upload/upload-item.vue'
import type { FormUploadItem } from '#ui-tools/form/fields/upload/use-upload-items'

function storedLogo(thumbnail: string): FormUploadItem {
  return {
    description: null,
    error: null,
    key: 'logo',
    name: 'logo.png',
    openable: true,
    progress: null,
    resolving: false,
    size: 2048,
    status: 'stored',
    thumbnail,
    type: 'image/png',
  }
}

describe('upload image fallback', () => {
  it('shows the file icon when a stored thumbnail fails, and tries a new thumbnail again', async () => {
    const wrapper = mount(UploadItem, {
      props: { item: storedLogo('https://files.example/expired.png') },
    })
    await wrapper.find('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-ui="UIcon"]').exists()).toBe(true)
    await wrapper.setProps({ item: storedLogo('https://files.example/fresh.png') })
    expect(wrapper.find('img').attributes('src')).toBe('https://files.example/fresh.png')
  })

  it('shows the file icon when a picked image preview fails, and resets with the next file', async () => {
    const image = new File(['x'], 'photo.png', { type: 'image/png' })
    const wrapper = mount(FormFilePreview, {
      props: { file: image, index: 0, removeFile: () => undefined },
    })
    expect(wrapper.find('img').exists()).toBe(true)
    await wrapper.find('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    await wrapper.setProps({ file: new File(['y'], 'other.png', { type: 'image/png' }) })
    expect(wrapper.find('img').exists()).toBe(true)
  })
})
