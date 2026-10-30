/** A text track of a video: subtitles or captions, in one language. */
export interface VideoPlayerTrack {
  src: string
  srcLang: string
  label: string
  kind?: TextTrackKind
  default?: boolean
}
