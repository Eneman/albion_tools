import RefiningTool from './tools/RefiningTool.jsx'
import BrandMark from './components/BrandMark.jsx'
import { I18nProvider, useI18n } from './i18n.jsx'

export default function App() {
  return (
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  )
}

function AppShell() {
  const { t, lang, setLang } = useI18n()

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
          <nav className="site-nav" aria-label={t('navLabel')}>
            <a className="nav-link is-active" href="#refining" aria-current="page">
              {t('navLink')}
            </a>
            <div className="lang-switch" role="group" aria-label={t('langGroup')}>
              <span className="lang-segments">
                <button
                  type="button"
                  className={`lang-seg ${lang === 'en' ? 'is-active' : ''}`}
                  aria-pressed={lang === 'en'}
                  aria-label="English"
                  onClick={() => setLang('en')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`lang-seg ${lang === 'fr' ? 'is-active' : ''}`}
                  aria-pressed={lang === 'fr'}
                  aria-label="Français"
                  onClick={() => setLang('fr')}
                >
                  FR
                </button>
              </span>
            </div>
          </nav>
        </div>
      </header>

      <main className="container main" id="refining">
        <div className="page-intro">
          <h1>{t('title')}</h1>
          <p className="lede">{t('lede')}</p>
        </div>
        <RefiningTool />
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>{t('footer')}</p>
        </div>
      </footer>
    </div>
  )
}
