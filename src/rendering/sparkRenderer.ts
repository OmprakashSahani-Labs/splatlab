import { SparkRenderer } from '@sparkjsdev/spark'
import * as THREE from 'three'

/**
 * Creates a SparkRenderer owned by the caller.
 * Callers must release it with disposeSparkRenderer().
 */
export function createSparkRenderer(
  renderer: THREE.WebGLRenderer,
): SparkRenderer {
  // Disable LoD for exact captured-camera comparisons, avoiding LoD behavior
  // and camera.fov-derived LoD calculations.
  return new SparkRenderer({
    renderer,
    enableLod: false,
    enableDriveLod: false,
    enableLodFetching: false,
  })
}

/** Releases Spark resources; the supplied WebGLRenderer remains caller-owned. */
export function disposeSparkRenderer(spark: SparkRenderer): void {
  spark.removeFromParent()
  spark.dispose()
  spark.geometry.dispose()

  if (Array.isArray(spark.material)) {
    for (const material of spark.material) {
      material.dispose()
    }
  } else {
    spark.material.dispose()
  }
}
