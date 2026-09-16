import * as THREE from 'three'
import type { SparkRenderer } from '@sparkjsdev/spark'
import { createSparkRenderer, disposeSparkRenderer } from './sparkRenderer'

/**
 * Shares one scene, camera, and renderer so Reference and Candidate assets can
 * later be swapped under identical rendering conditions.
 * The session owns Spark resources; the viewport owns the WebGLRenderer.
 */
export interface SparkRenderSession {
  readonly renderer: THREE.WebGLRenderer
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly spark: SparkRenderer
}

/** Creates a caller-owned session to release with disposeSparkRenderSession(). */
export function createSparkRenderSession(
  renderer: THREE.WebGLRenderer,
): SparkRenderSession {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()
  const spark = createSparkRenderer(renderer)
  scene.add(spark)

  return { renderer, scene, camera, spark }
}

/** Renders one frame using the shared scene and camera. */
export function renderSparkSession(session: SparkRenderSession): void {
  session.renderer.render(session.scene, session.camera)
}

/**
 * Releases the session's Spark resources, leaving the WebGLRenderer viewport-owned.
 * Callers must dispose future SplatMesh assets separately before session teardown.
 */
export function disposeSparkRenderSession(session: SparkRenderSession): void {
  disposeSparkRenderer(session.spark)
}
