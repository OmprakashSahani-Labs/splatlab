// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import * as THREE from 'three'
import type { SplatMesh } from '@sparkjsdev/spark'
import type { LocalGaussianAsset } from '../assets/localAsset'
import type { CapturedCamera } from '../core/camera'
import { applyCapturedCamera } from '../rendering/capturedCamera'
import {
  createSparkRenderSession,
  disposeSparkRenderSession,
  type SparkRenderSession,
} from '../rendering/renderSession'
import { loadLocalSplatMesh, disposeSplatMesh } from '../rendering/sparkAsset'
import SplatViewport from './SplatViewport'

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>()
  return { ...actual, WebGLRenderer: vi.fn() }
})

vi.mock('../rendering/renderSession', () => ({
  createSparkRenderSession: vi.fn(),
  renderSparkSession: vi.fn(),
  disposeSparkRenderSession: vi.fn(),
}))

vi.mock('../rendering/sparkAsset', () => ({
  loadLocalSplatMesh: vi.fn(),
  disposeSplatMesh: vi.fn(),
}))

vi.mock('../rendering/capturedCamera', () => ({
  applyCapturedCamera: vi.fn(),
}))

const renderer = {
  setPixelRatio: vi.fn(),
  setSize: vi.fn(),
  dispose: vi.fn(),
}

const session = {
  renderer,
  scene: { add: vi.fn() },
  camera: {},
  spark: {},
}

function createAsset(id: string): LocalGaussianAsset {
  const file = new File(['abc'], `${id}.spz`)
  return {
    descriptor: { id, name: file.name, format: 'spz', sizeBytes: file.size },
    file,
  }
}

function createMesh(name: string): SplatMesh {
  return { name } as unknown as SplatMesh
}

function createCamera(id: string): CapturedCamera {
  return {
    id,
    pose: {
      position: [1, 2, 3],
      quaternion: [0, 0, 0, 1],
    },
    intrinsics: {
      width: 1920,
      height: 1080,
      fx: 1000,
      fy: 1000,
      cx: 960,
      cy: 540,
      near: 0.01,
      far: 1000,
    },
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(THREE.WebGLRenderer).mockImplementation(function () {
    return renderer as unknown as THREE.WebGLRenderer
  })
  vi.mocked(createSparkRenderSession).mockReturnValue(
    session as unknown as SparkRenderSession,
  )
  vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('SplatViewport asset lifecycle', () => {
  it('loads and attaches one asset and disposes it exactly once on unmount', async () => {
    const asset = createAsset('asset')
    const mesh = createMesh('mesh')
    vi.mocked(loadLocalSplatMesh).mockResolvedValueOnce(mesh)

    const { unmount } = render(<SplatViewport asset={asset} />)

    expect(THREE.WebGLRenderer).toHaveBeenCalledOnce()
    expect(createSparkRenderSession).toHaveBeenCalledOnce()
    expect(createSparkRenderSession).toHaveBeenCalledWith(renderer)
    expect(loadLocalSplatMesh).toHaveBeenCalledExactlyOnceWith(asset)
    await waitFor(() => {
      expect(session.scene.add).toHaveBeenCalledExactlyOnceWith(mesh)
    })
    expect(THREE.WebGLRenderer).toHaveBeenCalledOnce()
    expect(createSparkRenderSession).toHaveBeenCalledOnce()
    expect(disposeSplatMesh).not.toHaveBeenCalled()

    unmount()

    expect(disposeSplatMesh).toHaveBeenCalledExactlyOnceWith(mesh)
    expect(disposeSparkRenderSession).toHaveBeenCalledExactlyOnceWith(session)
    expect(renderer.dispose).toHaveBeenCalledOnce()
    expect(cancelAnimationFrame).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('replaces an attached asset while keeping the same renderer and session', async () => {
    const assetA = createAsset('asset-a')
    const assetB = createAsset('asset-b')
    const meshA = createMesh('mesh-a')
    const meshB = createMesh('mesh-b')
    vi.mocked(loadLocalSplatMesh)
      .mockResolvedValueOnce(meshA)
      .mockResolvedValueOnce(meshB)

    const { rerender } = render(<SplatViewport asset={assetA} />)
    await waitFor(() => {
      expect(session.scene.add).toHaveBeenCalledExactlyOnceWith(meshA)
    })

    rerender(<SplatViewport asset={assetB} />)

    await waitFor(() => {
      expect(session.scene.add).toHaveBeenNthCalledWith(2, meshB)
    })
    expect(session.scene.add).toHaveBeenCalledTimes(2)
    expect(loadLocalSplatMesh).toHaveBeenNthCalledWith(2, assetB)
    expect(disposeSplatMesh).toHaveBeenCalledExactlyOnceWith(meshA)
    expect(THREE.WebGLRenderer).toHaveBeenCalledOnce()
    expect(createSparkRenderSession).toHaveBeenCalledOnce()
    expect(disposeSparkRenderSession).not.toHaveBeenCalled()
    expect(renderer.dispose).not.toHaveBeenCalled()
  })

  it('disposes a late superseded result without attaching it', async () => {
    const assetA = createAsset('asset-a')
    const assetB = createAsset('asset-b')
    const meshA = createMesh('mesh-a')
    const meshB = createMesh('mesh-b')
    const loadA = deferred<SplatMesh>()
    const loadB = deferred<SplatMesh>()
    vi.mocked(loadLocalSplatMesh)
      .mockReturnValueOnce(loadA.promise)
      .mockReturnValueOnce(loadB.promise)

    const { rerender } = render(<SplatViewport asset={assetA} />)
    rerender(<SplatViewport asset={assetB} />)

    loadB.resolve(meshB)
    await waitFor(() => {
      expect(session.scene.add).toHaveBeenCalledExactlyOnceWith(meshB)
    })

    loadA.resolve(meshA)
    await waitFor(() => {
      expect(disposeSplatMesh).toHaveBeenCalledExactlyOnceWith(meshA)
    })
    expect(session.scene.add).not.toHaveBeenCalledWith(meshA)
    expect(session.scene.add).toHaveBeenCalledExactlyOnceWith(meshB)
    expect(disposeSplatMesh).not.toHaveBeenCalledWith(meshB)
    expect(THREE.WebGLRenderer).toHaveBeenCalledOnce()
    expect(createSparkRenderSession).toHaveBeenCalledOnce()
    expect(disposeSparkRenderSession).not.toHaveBeenCalled()
  })

  it('reports the current load error to the callback once', async () => {
    const asset = createAsset('asset')
    const error = new Error('Asset initialization failed')
    const onError = vi.fn()
    vi.mocked(loadLocalSplatMesh).mockRejectedValueOnce(error)

    render(<SplatViewport asset={asset} onAssetLoadError={onError} />)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledExactlyOnceWith(error)
    })
    expect(onError.mock.calls[0][0]).toBe(error)
    expect(session.scene.add).not.toHaveBeenCalled()
    expect(disposeSplatMesh).not.toHaveBeenCalled()
  })

  it('ignores a cancelled load error while the replacement asset attaches', async () => {
    const assetA = createAsset('asset-a')
    const assetB = createAsset('asset-b')
    const meshB = createMesh('mesh-b')
    const loadA = deferred<SplatMesh>()
    const loadB = deferred<SplatMesh>()
    const onError = vi.fn()
    vi.mocked(loadLocalSplatMesh)
      .mockReturnValueOnce(loadA.promise)
      .mockReturnValueOnce(loadB.promise)

    const { rerender } = render(
      <SplatViewport asset={assetA} onAssetLoadError={onError} />,
    )
    rerender(<SplatViewport asset={assetB} onAssetLoadError={onError} />)

    loadA.reject(new Error('Superseded asset failed'))
    loadB.resolve(meshB)

    await waitFor(() => {
      expect(session.scene.add).toHaveBeenCalledExactlyOnceWith(meshB)
    })
    expect(onError).not.toHaveBeenCalled()
    expect(disposeSplatMesh).not.toHaveBeenCalled()
  })
})

describe('SplatViewport captured camera', () => {
  it('applies a captured camera to the existing session camera', async () => {
    const camera = createCamera('camera')

    render(<SplatViewport camera={camera} />)

    await waitFor(() => {
      expect(applyCapturedCamera).toHaveBeenCalledExactlyOnceWith(session.camera, camera)
    })
    expect(vi.mocked(applyCapturedCamera).mock.calls[0][0]).toBe(session.camera)
    expect(vi.mocked(applyCapturedCamera).mock.calls[0][1]).toBe(camera)
    expect(THREE.WebGLRenderer).toHaveBeenCalledOnce()
    expect(createSparkRenderSession).toHaveBeenCalledOnce()
    expect(disposeSparkRenderSession).not.toHaveBeenCalled()
  })

  it('keeps the renderer, session, and loaded asset stable when the camera changes', async () => {
    const asset = createAsset('asset')
    const mesh = createMesh('mesh')
    const cameraA = createCamera('camera-a')
    const cameraB = createCamera('camera-b')
    vi.mocked(loadLocalSplatMesh).mockResolvedValueOnce(mesh)

    const { rerender } = render(<SplatViewport asset={asset} camera={cameraA} />)
    await waitFor(() => {
      expect(session.scene.add).toHaveBeenCalledExactlyOnceWith(mesh)
      expect(applyCapturedCamera).toHaveBeenCalledExactlyOnceWith(session.camera, cameraA)
    })

    rerender(<SplatViewport asset={asset} camera={cameraB} />)

    await waitFor(() => {
      expect(applyCapturedCamera).toHaveBeenCalledTimes(2)
      expect(applyCapturedCamera).toHaveBeenNthCalledWith(2, session.camera, cameraB)
    })
    expect(vi.mocked(applyCapturedCamera).mock.calls[1][0]).toBe(session.camera)
    expect(THREE.WebGLRenderer).toHaveBeenCalledOnce()
    expect(createSparkRenderSession).toHaveBeenCalledOnce()
    expect(loadLocalSplatMesh).toHaveBeenCalledExactlyOnceWith(asset)
    expect(disposeSplatMesh).not.toHaveBeenCalled()
    expect(session.scene.add).toHaveBeenCalledExactlyOnceWith(mesh)
    expect(disposeSparkRenderSession).not.toHaveBeenCalled()
    expect(renderer.dispose).not.toHaveBeenCalled()
  })

  it('does not reset the current camera when the camera prop becomes null', async () => {
    const cameraA = createCamera('camera-a')
    const { rerender } = render(<SplatViewport camera={cameraA} />)
    await waitFor(() => {
      expect(applyCapturedCamera).toHaveBeenCalledExactlyOnceWith(session.camera, cameraA)
    })

    rerender(<SplatViewport camera={null} />)

    expect(applyCapturedCamera).toHaveBeenCalledOnce()
    expect(THREE.WebGLRenderer).toHaveBeenCalledOnce()
    expect(createSparkRenderSession).toHaveBeenCalledOnce()
    expect(disposeSparkRenderSession).not.toHaveBeenCalled()
    expect(renderer.dispose).not.toHaveBeenCalled()
  })
})
