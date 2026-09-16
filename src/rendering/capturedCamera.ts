import * as THREE from 'three'
import type { CapturedCamera } from '../core/camera'

/**
 * Applies a captured camera with a custom projection matrix that preserves
 * fx, fy, cx, and cy exactly. Callers must reapply the captured camera after
 * any subsequent updateProjectionMatrix() call, which overwrites this matrix.
 */
export function applyCapturedCamera(
  camera: THREE.PerspectiveCamera,
  capturedCamera: CapturedCamera,
): void {
  const { pose, intrinsics } = capturedCamera
  const { width, height, fx, fy, cx, cy, near, far } = intrinsics

  camera.position.set(...pose.position)
  camera.quaternion.set(...pose.quaternion)
  camera.updateMatrixWorld()

  camera.near = near
  camera.far = far
  camera.aspect = width / height
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(height / (2 * fy)))

  const left = (-cx * near) / fx
  const right = ((width - cx) * near) / fx
  const top = (cy * near) / fy
  const bottom = (-(height - cy) * near) / fy

  camera.projectionMatrix.makePerspective(left, right, top, bottom, near, far)
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
}
