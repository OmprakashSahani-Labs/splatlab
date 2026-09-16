import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import type { CapturedCamera } from '../core/camera'
import { applyCapturedCamera } from './capturedCamera'

const capturedCamera: CapturedCamera = {
  id: 'camera-1',
  pose: {
    position: [1, 2, 3],
    quaternion: [0, 0, 0, 1],
  },
  intrinsics: {
    width: 800,
    height: 600,
    fx: 700,
    fy: 710,
    cx: 420,
    cy: 280,
    near: 0.1,
    far: 100,
  },
}

describe('applyCapturedCamera', () => {
  it('applies the camera-to-world pose and updates matrixWorld', () => {
    const camera = new THREE.PerspectiveCamera()
    camera.quaternion.set(0, 1, 0, 0)

    applyCapturedCamera(camera, capturedCamera)

    expect(camera.position.toArray()).toEqual([1, 2, 3])
    expect(camera.quaternion.toArray()).toEqual([0, 0, 0, 1])
    expect(camera.matrixWorld.elements).toEqual(
      new THREE.Matrix4().makeTranslation(1, 2, 3).elements,
    )
  })

  it('sets the perspective metadata from the intrinsics', () => {
    const camera = new THREE.PerspectiveCamera()
    applyCapturedCamera(camera, capturedCamera)

    expect(camera.near).toBe(0.1)
    expect(camera.far).toBe(100)
    expect(camera.aspect).toBeCloseTo(800 / 600, 12)
    expect(camera.fov).toBeCloseTo(
      THREE.MathUtils.radToDeg(2 * Math.atan(600 / (2 * 710))),
      12,
    )
  })

  it('builds the exact calibrated projection matrix', () => {
    const camera = new THREE.PerspectiveCamera()
    applyCapturedCamera(camera, capturedCamera)

    const left = (-420 * 0.1) / 700
    const right = ((800 - 420) * 0.1) / 700
    const top = (280 * 0.1) / 710
    const bottom = (-(600 - 280) * 0.1) / 710
    const expected = new THREE.Matrix4().makePerspective(
      left, right, top, bottom, 0.1, 100,
    )

    expected.elements.forEach((value, index) => {
      expect(camera.projectionMatrix.elements[index]).toBeCloseTo(value, 12)
    })
  })

  it('sets the inverse of the projection matrix', () => {
    const camera = new THREE.PerspectiveCamera()
    applyCapturedCamera(camera, capturedCamera)

    const product = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.projectionMatrixInverse,
    )

    new THREE.Matrix4().elements.forEach((value, index) => {
      expect(product.elements[index]).toBeCloseTo(value, 12)
    })
  })

  it('preserves the off-center principal point in both projection offsets', () => {
    const camera = new THREE.PerspectiveCamera()
    applyCapturedCamera(camera, capturedCamera)

    expect(camera.projectionMatrix.elements[8]).not.toBeCloseTo(0, 12)
    expect(camera.projectionMatrix.elements[9]).not.toBeCloseTo(0, 12)
  })
})
