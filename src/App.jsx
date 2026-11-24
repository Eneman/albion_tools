import RefiningTool from './tools/RefiningTool.jsx'
import BrandMark from './components/BrandMark.jsx'

export default function App() {
  return (
    <div className="app">
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="./">
            <BrandMark width={26} height={26} />
            <span className="brand-name">
              Albion <span className="brand-accent">Tools</span>
            </span>
          </a>
          <nav className="site-nav" aria-label="Tools">
            <a className="nav-link is-active" href="#refining" aria-current="page">
              Refining Calculator
            </a>
          </nav>
        </div>
      </header>

      <main className="container main" id="refining">
        <div className="page-intro">
          <h1>Refining Calculator</h1>
          <p className="lede">
            Pick a refined resource, set the quantity you want and tick what you already own at
            every level — the list of missing materials updates as you type.
          </p>
        </div>
        <RefiningTool />
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>
            Fan-made tools for Albion Online · Not affiliated with Sandbox Interactive GmbH
          </p>
        </div>
      </footer>
    </div>
  )
}
