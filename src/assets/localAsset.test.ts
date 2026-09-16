// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { createLocalGaussianAsset, detectGaussianAssetFormat } from './localAsset'

describe('detectGaussianAssetFormat', () => {
  it('recognizes .ply files', () => {
    expect(detectGaussianAssetFormat('scene.ply')).toBe('ply')
  })

  it('recognizes .spz files', () => {
    expect(detectGaussianAssetFormat('scene.spz')).toBe('spz')
  })

  it('matches extensions case-insensitively', () => {
    expect(detectGaussianAssetFormat('scene.PLY')).toBe('ply')
    expect(detectGaussianAssetFormat('scene.SPZ')).toBe('spz')
  })

  it('returns unknown for unsupported extensions', () => {
    expect(detectGaussianAssetFormat('scene.obj')).toBe('unknown')
    expect(detectGaussianAssetFormat('scene.json')).toBe('unknown')
  })
})

describe('createLocalGaussianAsset', () => {
  it('pairs the original file with its descriptor without a splat count', () => {
    const file = new File(['abc'], 'scene.spz')
    const asset = createLocalGaussianAsset(file, 'asset-1')

    expect(asset.file).toBe(file)
    expect(asset.descriptor.id).toBe('asset-1')
    expect(asset.descriptor.name).toBe('scene.spz')
    expect(asset.descriptor.format).toBe('spz')
    expect(asset.descriptor.sizeBytes).toBe(file.size)
    expect(asset.descriptor).not.toHaveProperty('splatCount')
  })
})
