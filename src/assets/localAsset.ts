import type { AssetDescriptor, GaussianAssetFormat } from '../core/asset'

export interface LocalGaussianAsset {
  readonly descriptor: AssetDescriptor
  readonly file: File
}

export function detectGaussianAssetFormat(
  fileName: string,
): GaussianAssetFormat {
  const normalizedName = fileName.toLowerCase()

  if (normalizedName.endsWith('.ply')) return 'ply'
  if (normalizedName.endsWith('.spz')) return 'spz'
  return 'unknown'
}

export function createLocalGaussianAsset(
  file: File,
  id: string,
): LocalGaussianAsset {
  return {
    descriptor: {
      id,
      name: file.name,
      format: detectGaussianAssetFormat(file.name),
      sizeBytes: file.size,
    },
    file,
  }
}
