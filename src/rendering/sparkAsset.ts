import { SplatMesh } from '@sparkjsdev/spark'
import type { LocalGaussianAsset } from '../assets/localAsset'

/**
 * Loads a local asset into an initialized SplatMesh owned by the caller.
 * Callers must release it with disposeSplatMesh().
 */
export async function loadLocalSplatMesh(
  asset: LocalGaussianAsset,
): Promise<SplatMesh> {
  const fileBytes = await asset.file.arrayBuffer()
  const mesh = new SplatMesh({ fileBytes, fileName: asset.file.name })

  try {
    await mesh.initialized
  } catch (error) {
    mesh.dispose()
    throw error
  }

  return mesh
}

/** Detaches and disposes a SplatMesh owned by the caller. */
export function disposeSplatMesh(mesh: SplatMesh): void {
  mesh.removeFromParent()
  mesh.dispose()
}
