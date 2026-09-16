export type GaussianAssetFormat = 'ply' | 'spz' | 'unknown'

export interface AssetDescriptor {
  readonly id: string
  readonly name: string
  readonly format: GaussianAssetFormat
  readonly sizeBytes: number
  readonly splatCount?: number
}

export type AssetRole = 'reference' | 'candidate'
