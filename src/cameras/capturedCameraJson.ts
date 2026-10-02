import type { CapturedCamera } from '../core/camera'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function readNumber(value: unknown, field: string): number {
  if (!isFiniteNumber(value)) throw new Error(`Invalid camera.intrinsics.${field}.`)
  return value
}

export function parseCapturedCameraJson(json: string): CapturedCamera {
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    throw new Error('Invalid camera JSON.')
  }

  if (!isRecord(value)) throw new Error('Invalid camera JSON.')
  const { id, name, sourceFrame, pose, intrinsics } = value

  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid camera.id.')
  }
  if ('name' in value && typeof name !== 'string') {
    throw new Error('Invalid camera.name.')
  }
  if ('sourceFrame' in value && typeof sourceFrame !== 'string') {
    throw new Error('Invalid camera.sourceFrame.')
  }
  if (!isRecord(pose)) throw new Error('Invalid camera.pose.')
  const { position, quaternion } = pose

  if (!Array.isArray(position) || position.length !== 3 || !position.every(isFiniteNumber)) {
    throw new Error('Invalid camera.pose.position.')
  }
  if (!Array.isArray(quaternion) || quaternion.length !== 4 || !quaternion.every(isFiniteNumber)) {
    throw new Error('Invalid camera.pose.quaternion.')
  }

  if (!isRecord(intrinsics)) throw new Error('Invalid camera.intrinsics.')
  const width = readNumber(intrinsics.width, 'width')
  const height = readNumber(intrinsics.height, 'height')
  const fx = readNumber(intrinsics.fx, 'fx')
  const fy = readNumber(intrinsics.fy, 'fy')
  const cx = readNumber(intrinsics.cx, 'cx')
  const cy = readNumber(intrinsics.cy, 'cy')
  const near = readNumber(intrinsics.near, 'near')
  const far = readNumber(intrinsics.far, 'far')

  if (width <= 0) throw new Error('Invalid camera.intrinsics.width.')
  if (height <= 0) throw new Error('Invalid camera.intrinsics.height.')
  if (fx <= 0) throw new Error('Invalid camera.intrinsics.fx.')
  if (fy <= 0) throw new Error('Invalid camera.intrinsics.fy.')
  if (near <= 0) throw new Error('Invalid camera.intrinsics.near.')
  if (far <= near) throw new Error('Invalid camera.intrinsics.far.')

  return {
    id,
    ...(typeof name === 'string' ? { name } : {}),
    ...(typeof sourceFrame === 'string' ? { sourceFrame } : {}),
    pose: {
      position: [position[0], position[1], position[2]],
      quaternion: [quaternion[0], quaternion[1], quaternion[2], quaternion[3]],
    },
    intrinsics: { width, height, fx, fy, cx, cy, near, far },
  }
}
