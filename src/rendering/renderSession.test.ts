import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import {
  createSparkRenderSession,
  renderSparkSession,
  disposeSparkRenderSession,
} from './renderSession'
import { createSparkRenderer, disposeSparkRenderer } from './sparkRenderer'

vi.mock('./sparkRenderer', () => ({
  createSparkRenderer: vi.fn(),
  disposeSparkRenderer: vi.fn(),
}))

beforeEach(() => {
  vi.resetAllMocks()
})

describe('createSparkRenderSession', () => {
  it('creates a scene and camera and adds Spark to the scene', () => {
    const renderer = { render: vi.fn() } as unknown as THREE.WebGLRenderer
    const spark = new THREE.Object3D() as ReturnType<typeof createSparkRenderer>
    vi.mocked(createSparkRenderer).mockReturnValue(spark)

    const session = createSparkRenderSession(renderer)

    expect(session.renderer).toBe(renderer)
    expect(session.scene).toBeInstanceOf(THREE.Scene)
    expect(session.camera).toBeInstanceOf(THREE.PerspectiveCamera)
    expect(session.spark).toBe(spark)
    expect(createSparkRenderer).toHaveBeenCalledOnce()
    expect(createSparkRenderer).toHaveBeenCalledWith(renderer)
    expect(session.scene.children).toContain(spark)
    expect(spark.parent).toBe(session.scene)
  })
})

describe('renderSparkSession', () => {
  it('renders the session scene with its camera exactly once', () => {
    const renderer = { render: vi.fn() }
    const session = {
      renderer: renderer as unknown as THREE.WebGLRenderer,
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(),
      spark: new THREE.Object3D() as ReturnType<typeof createSparkRenderer>,
    }

    renderSparkSession(session)

    expect(renderer.render).toHaveBeenCalledOnce()
    expect(renderer.render).toHaveBeenCalledWith(session.scene, session.camera)
  })
})

describe('disposeSparkRenderSession', () => {
  it('disposes Spark without disposing the caller-owned renderer', () => {
    const renderer = { dispose: vi.fn() }
    const session = {
      renderer: renderer as unknown as THREE.WebGLRenderer,
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(),
      spark: new THREE.Object3D() as ReturnType<typeof createSparkRenderer>,
    }

    disposeSparkRenderSession(session)

    expect(disposeSparkRenderer).toHaveBeenCalledOnce()
    expect(disposeSparkRenderer).toHaveBeenCalledWith(session.spark)
    expect(renderer.dispose).not.toHaveBeenCalled()
  })
})
