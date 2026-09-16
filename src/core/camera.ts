export type Vector3 = readonly [number, number, number]

/** Quaternion components in [x, y, z, w] order. */
export type Quaternion = readonly [number, number, number, number]

/**
 * Camera-to-world transform: position is the camera center in SplatLab world
 * coordinates; quaternion rotates camera-local coordinates into world coordinates
 * with components in [x, y, z, w] order.
 * Camera-local axes follow Three.js/OpenGL: +X right, +Y up, -Z forward.
 */
export interface CameraPose {
  readonly position: Vector3
  readonly quaternion: Quaternion
}

/**
 * Undistorted pinhole camera intrinsics. Width and height are image dimensions,
 * fx and fy are focal lengths, and cx and cy are principal-point coordinates,
 * all in pixels. Image coordinates start at the top-left, with +X right and +Y down.
 * Near and far are positive clipping distances in camera-space units.
 * Source importers must convert external camera conventions into this normalized
 * representation.
 */
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

/** Renderer-independent normalized camera consumed by rendering adapters. */
export interface CapturedCamera {
  readonly id: string
  readonly name?: string
  readonly sourceFrame?: string
  readonly pose: CameraPose
  readonly intrinsics: PerspectiveCameraIntrinsics
}
