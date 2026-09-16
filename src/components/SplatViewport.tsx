import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  createSparkRenderSession,
  renderSparkSession,
  disposeSparkRenderSession,
} from '../rendering/renderSession'

/**
 * Owns the WebGLRenderer; SparkRenderSession owns the scene, camera, and Spark.
 * Assets will have their own explicit lifecycle.
 */
export default function SplatViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const session = createSparkRenderSession(renderer)

    const resize = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (width > 0 && height > 0) {
        renderer.setSize(width, height, false)
      }
    }

    window.addEventListener('resize', resize)
    resize()

    let animationFrameId: number
    const renderFrame = () => {
      renderSparkSession(session)
      animationFrameId = requestAnimationFrame(renderFrame)
    }
    animationFrameId = requestAnimationFrame(renderFrame)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
      disposeSparkRenderSession(session)
      renderer.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} aria-label="Gaussian splat viewport" />
}
