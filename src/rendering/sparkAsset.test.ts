// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SplatMesh } from '@sparkjsdev/spark'
import type { LocalGaussianAsset } from '../assets/localAsset'
import { disposeSplatMesh, loadLocalSplatMesh } from './sparkAsset'

vi.mock('@sparkjsdev/spark', () => ({ SplatMesh: vi.fn() }))

function createAsset(): LocalGaussianAsset {
  const file = new File(['abc'], 'scene.spz')
  return {
    descriptor: {
      id: 'asset-1',
      name: file.name,
      format: 'spz',
      sizeBytes: file.size,
    },
    file,
  }
}

function createMesh(initialized: Promise<void> = Promise.resolve()) {
  return {
    initialized,
    removeFromParent: vi.fn(),
    dispose: vi.fn(),
  }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('loadLocalSplatMesh', () => {
  it('loads file bytes and waits for initialization before returning the mesh', async () => {
    const asset = createAsset()
    const arrayBuffer = vi.spyOn(asset.file, 'arrayBuffer')
    let finishInitialization!: () => void
    const mesh = createMesh(new Promise<void>((resolve) => {
      finishInitialization = resolve
    }))
    vi.mocked(SplatMesh).mockImplementation(function () {
      return mesh as unknown as SplatMesh
    })
    const onSettled = vi.fn()

    const loading = loadLocalSplatMesh(asset)
    void loading.then(onSettled, onSettled)

    await vi.waitFor(() => expect(SplatMesh).toHaveBeenCalledOnce())
    expect(arrayBuffer).toHaveBeenCalledOnce()
    const fileBytes = await arrayBuffer.mock.results[0].value
    expect(fileBytes).toBeInstanceOf(ArrayBuffer)
    expect(SplatMesh).toHaveBeenCalledWith({
      fileBytes,
      fileName: 'scene.spz',
    })
    expect(vi.mocked(SplatMesh).mock.calls[0][0]?.fileBytes).toBe(fileBytes)
    expect(onSettled).not.toHaveBeenCalled()

    finishInitialization()

    await expect(loading).resolves.toBe(mesh)
    expect(mesh.dispose).not.toHaveBeenCalled()
  })

  it('disposes a failed mesh and rethrows the original initialization error', async () => {
    const error = new Error('Initialization failed')
    const mesh = createMesh()
    vi.mocked(SplatMesh).mockImplementation(function () {
      mesh.initialized = Promise.reject(error)
      return mesh as unknown as SplatMesh
    })

    await expect(loadLocalSplatMesh(createAsset())).rejects.toBe(error)

    expect(mesh.dispose).toHaveBeenCalledOnce()
    expect(mesh.removeFromParent).not.toHaveBeenCalled()
  })
})

describe('disposeSplatMesh', () => {
  it('removes the mesh from its parent before disposing it', () => {
    const mesh = createMesh()

    disposeSplatMesh(mesh as unknown as SplatMesh)

    expect(mesh.removeFromParent).toHaveBeenCalledOnce()
    expect(mesh.dispose).toHaveBeenCalledOnce()
    expect(mesh.removeFromParent.mock.invocationCallOrder[0]).toBeLessThan(
      mesh.dispose.mock.invocationCallOrder[0],
    )
  })
})
