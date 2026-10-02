import { useCallback, useState } from 'react'
import { createLocalGaussianAsset, type LocalGaussianAsset } from './assets/localAsset'
import SplatViewport from './components/SplatViewport'
import './App.css'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
}

function App() {
  const [asset, setAsset] = useState<LocalGaussianAsset | null>(null)
  const [assetLoadError, setAssetLoadError] = useState<string | null>(null)

  const handleAssetLoadError = useCallback((error: unknown) => {
    setAssetLoadError(
      error instanceof Error ? error.message : 'Failed to load Gaussian asset.',
    )
  }, [])

  return (
    <main className="app">
      <header className="app-header">
        <div className="app-header-main">
          <h1>SplatLab</h1>
          <p>Reproducible Gaussian Splatting comparison and debugging.</p>
        </div>
        <div className="asset-controls">
          <label>
            Open Gaussian asset
            <input
              className="asset-input"
              type="file"
              accept=".ply,.spz"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                if (!file) return

                setAsset(createLocalGaussianAsset(file, crypto.randomUUID()))
                setAssetLoadError(null)
              }}
            />
          </label>
          {asset && (
            <p className="asset-summary">
              {asset.descriptor.name} · {asset.descriptor.format.toUpperCase()} ·{' '}
              {formatBytes(asset.descriptor.sizeBytes)}
            </p>
          )}
          {assetLoadError && (
            <p className="asset-error" role="alert">
              {assetLoadError}
            </p>
          )}
        </div>
      </header>
      <section className="viewport-panel">
        <SplatViewport asset={asset} onAssetLoadError={handleAssetLoadError} />
      </section>
    </main>
  )
}

export default App
