import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SparkRenderer } from '@sparkjsdev/spark'
import * as THREE from 'three'
import { createSparkRenderer, disposeSparkRenderer } from './sparkRenderer'

vi.mock('@sparkjsdev/spark', () => ({ SparkRenderer: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
})

describe('createSparkRenderer', () => {
  it('disables LoD and preserves ownership of the supplied WebGLRenderer', () => {
    const renderer = { dispose: vi.fn() }
    const spark = {
      renderer,
      removeFromParent: vi.fn(),
      dispose: vi.fn(),
      geometry: { dispose: vi.fn() },
      material: { dispose: vi.fn() },
    }
    vi.mocked(SparkRenderer).mockImplementation(function () {
      return spark as unknown as SparkRenderer
    })

    const result = createSparkRenderer(renderer as unknown as THREE.WebGLRenderer)

    expect(SparkRenderer).toHaveBeenCalledOnce()
    expect(SparkRenderer).toHaveBeenCalledWith({
      renderer,
      enableLod: false,
      enableDriveLod: false,
      enableLodFetching: false,
    })
    expect(result).toBe(spark)

    disposeSparkRenderer(result)

    expect(renderer.dispose).not.toHaveBeenCalled()
  })
})

describe('disposeSparkRenderer', () => {
  it('removes Spark and disposes its resources in order for a single material', () => {
    const spark = {
      removeFromParent: vi.fn(),
      dispose: vi.fn(),
      geometry: { dispose: vi.fn() },
      material: { dispose: vi.fn() },
    }

    disposeSparkRenderer(spark as unknown as SparkRenderer)

    expect(spark.removeFromParent).toHaveBeenCalledOnce()
    expect(spark.dispose).toHaveBeenCalledOnce()
    expect(spark.geometry.dispose).toHaveBeenCalledOnce()
    expect(spark.material.dispose).toHaveBeenCalledOnce()
    expect(spark.removeFromParent.mock.invocationCallOrder[0]).toBeLessThan(
      spark.dispose.mock.invocationCallOrder[0],
    )
    expect(spark.dispose.mock.invocationCallOrder[0]).toBeLessThan(
      spark.geometry.dispose.mock.invocationCallOrder[0],
    )
    expect(spark.geometry.dispose.mock.invocationCallOrder[0]).toBeLessThan(
      spark.material.dispose.mock.invocationCallOrder[0],
    )
  })

  it('disposes each material in a material array', () => {
    const firstMaterial = { dispose: vi.fn() }
    const secondMaterial = { dispose: vi.fn() }
    const spark = {
      removeFromParent: vi.fn(),
      dispose: vi.fn(),
      geometry: { dispose: vi.fn() },
      material: [firstMaterial, secondMaterial],
    }

    disposeSparkRenderer(spark as unknown as SparkRenderer)

    expect(spark.removeFromParent).toHaveBeenCalledOnce()
    expect(spark.dispose).toHaveBeenCalledOnce()
    expect(spark.geometry.dispose).toHaveBeenCalledOnce()
    expect(firstMaterial.dispose).toHaveBeenCalledOnce()
    expect(secondMaterial.dispose).toHaveBeenCalledOnce()
  })
})
