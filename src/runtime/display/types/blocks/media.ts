import type {
  DisplayAction,
  DisplayBlockBase,
  DisplayContent,
  DisplayText,
  DisplayUrl,
} from '../shared'

export type DisplayMediaSlot =
  | 'root'
  | 'frame'
  | 'image'
  | 'caption'
  | 'grid'
  | 'tile'
  | 'overflow'
  | 'play'
  | 'duration'
  | 'title'
  | 'page'
  | 'body'
  | 'name'
  | 'meta'
  | 'actions'
  | 'domain'
  | 'description'
  | 'thumbnail'

export interface DisplayMediaImage {
  src: string
  alt?: string
}

export interface DisplayMediaProps extends DisplayBlockBase<DisplayMediaSlot> {
  /**
   * `image` and `video` show one file, `gallery` a grid of `images`, `document` a file card with
   * a page preview, and `link` a link preview card. Defaults to `image`.
   */
  variant?: 'image' | 'gallery' | 'video' | 'document' | 'link'
  /** Image or video file, or the document to open: a URL, or a function returning one. */
  src?: DisplayUrl
  alt?: string
  caption?: DisplayContent
  images?: readonly DisplayMediaImage[]
  /** `gallery`: tiles shown before the `+N` one. Defaults to `3`. */
  max?: number
  /** `video` poster, `document` first page, or `link` image. */
  thumbnail?: string
  title?: DisplayContent
  /** `video` length, such as `2:14`. */
  duration?: DisplayText
  /** `document` file name. Defaults to the last segment of `src`. */
  name?: string
  /** `document` size in bytes. */
  size?: number
  /** `document` MIME type. */
  type?: string
  /** `document` page count. */
  pages?: number
  /** `link` address, or a function returning it. */
  href?: DisplayUrl
  description?: DisplayContent
  /** CSS aspect ratio of `image`, `gallery` and `video`. Defaults to `16 / 9`. */
  aspect?: string
  /** Opens images and documents in the file preview. Defaults to `true`. */
  preview?: boolean
  /** `document` buttons. Default to "Open" and "Download". */
  actions?: readonly DisplayAction[]
}
