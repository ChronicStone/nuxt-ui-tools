/** A text track of a video: subtitles or captions, in one language. */
export interface VideoPlayerTrack {
  src: string
  srcLang: string
  label: string
  kind?: TextTrackKind
  default?: boolean
}

/** A control of the player's bar that `hide` can remove. */
export type MediaPlayerControl =
  | 'time'
  | 'volume'
  | 'rate'
  | 'captions'
  | 'pictureInPicture'
  | 'fullscreen'
  | 'download'

/** The file behind the player's download button. */
export interface MediaPlayerDownload {
  url: string
  /** Name the browser saves the file under. */
  fileName?: string
}

/** Where playback stands, measured inside the clip (`start` to `end`), in seconds. */
export interface MediaPlayerProgress {
  /** Seconds since the clip start. */
  position: number
  /** Length of the clip. */
  length: number
  /** Raw position in the file. */
  currentTime: number
}

/** Options both `UiVideoPlayer` and `UiAudioPlayer` take. */
export interface MediaPlayerOptions {
  src: string
  /** Read by assistive technology; the video shows it over the poster before playback starts. */
  title?: string
  /** Space or K plays and pauses, M mutes, F toggles full screen while the player has focus. */
  keyboard?: boolean
  /** Drops the volume slider; by default the player compacts itself below 480 px. */
  compact?: boolean
  /** False turns the timeline into a progress bar: the viewer cannot skip ahead or back. */
  seekable?: boolean
  /** Plays allowed, each counted when playback starts from the clip start; 0 means no limit. */
  maxPlays?: number
  /** Clip start, in seconds into the file. Playback starts there. */
  start?: number
  /** Clip end, in seconds into the file. Playback stops there and counts as ended. */
  end?: number
  /** Speeds the speed menu offers; `false` removes the menu. */
  rates?: readonly number[] | false
  /** Controls to remove from the bar. */
  hide?: readonly MediaPlayerControl[]
  /** A download button: a file to link to, or `true` to emit `download` and let the host save it. */
  download?: MediaPlayerDownload | true
  /** Starts playing once the file is ready; browsers only allow it muted. */
  autoplay?: boolean
  /** Restarts the clip when it ends; each restart counts as a play. */
  loop?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  crossorigin?: '' | 'anonymous' | 'use-credentials'
  /** Shows the player but refuses to play. */
  disabled?: boolean
}
