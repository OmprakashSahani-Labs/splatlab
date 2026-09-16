export type Vector3 = readonly [number, number, number]

/** Quaternion components in [x, y, z, w] order. */
export type Quaternion = readonly [number, number, number, number]

export interface CameraPose {
  readonly position: Vector3
  readonly quaternion: Quaternion
}

export interface PerspectiveCameraIntrinsics {
  readonly width: number
  readonly height: number
  readonly fx: number
  readonly fy: number
  readonly cx: number
  readonly cy: number
  readonly near: number
  readonly far: number
}

export interface CapturedCamera {
  readonly id: string
  readonly name?: string
  readonly sourceFrame?: string
  readonly pose: CameraPose
  readonly intrinsics: PerspectiveCameraIntrinsics
}
