import SplatViewport from './components/SplatViewport'
import './App.css'

function App() {
  return (
    <main className="app">
      <header className="app-header">
        <h1>SplatLab</h1>
        <p>Reproducible Gaussian Splatting comparison and debugging.</p>
      </header>
      <section className="viewport-panel">
        <SplatViewport />
      </section>
    </main>
  )
}

export default App
