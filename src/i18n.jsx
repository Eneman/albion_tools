import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { baseName, resourceName } from './data/resources'

/**
 * Tiny i18n layer: English + French UI strings, official item names, and the
 * language toggle. The chosen language is persisted to localStorage and
 * reflected on <html lang>, <title> and the meta description.
 */

const STORAGE_KEY = 'albion-tools:lang'

const STRINGS = {
  en: {
    docTitle: 'Albion Tools · Refining Calculator',
    docDescription:
      'Free Albion Online tools: refining calculator for T2–T8 stone, wood, hide, cotton and ore. Compute the full material chain and track what you are missing.',
    navLabel: 'Tools',
    navLink: 'Refining Calculator',
    langGroup: 'Language',
    lede: 'Pick a refined resource, set the quantity you want and tick what you already own at every level — the list of missing materials updates as you type.',
    footer: 'Fan-made tools for Albion Online · Not affiliated with Sandbox Interactive GmbH',
    labelResource: 'Refined resource',
    labelQuantity: 'Quantity wanted',
    placeholderSearch: 'Search… e.g. T5 Granite Block',
    placeholderNone: 'Select a resource',
    placeholderQty: 'e.g. 100',
    listboxLabel: 'Refined resources',
    noMatch: 'No resource matches “{q}”',
    emptyResTitle: 'No resource selected',
    emptyResText:
      'Pick a refined resource above — T2 to T8 blocks, planks, leather, cloth or metal bars — and we will list every material in the chain.',
    emptyQtyTitle: 'Enter a quantity',
    emptyQtyText:
      'Tell us how many {name} you want and we will list every material involved.',
    title: 'Refining Calculator',
    panelMaterials: 'Materials needed',
    panelMissing: 'Missing',
    clearOwned: 'Clear owned',
    summaryCraft: 'Crafting',
    thResource: 'Resource',
    thNeeded: 'Needed',
    thOwned: 'You have',
    thMissing: 'Missing',
    ariaOwned: 'How many {name} you already have',
    allGood: 'You already have all the raw materials.',
  },
  fr: {
    docTitle: 'Albion Tools · Calculateur de raffinage',
    docDescription:
      'Outils Albion Online gratuits : calculateur de raffinage pour les ressources T2–T8 (pierre, bois, cuir, fibre, minerai). Calculez toute la chaîne de ressources et suivez ce qui vous manque.',
    navLabel: 'Outils',
    navLink: 'Calculateur de raffinage',
    langGroup: 'Langue',
    lede: 'Choisissez une ressource raffinée, indiquez la quantité voulue et cochez ce que vous possédez déjà à chaque niveau — la liste des ressources manquantes se met à jour au fil de la frappe.',
    footer: 'Outils fans pour Albion Online · Non affilié à Sandbox Interactive GmbH',
    labelResource: 'Ressource raffinée',
    labelQuantity: 'Quantité voulue',
    placeholderSearch: 'Rechercher… ex. T5 Bloc de granite',
    placeholderNone: 'Choisissez une ressource',
    placeholderQty: 'ex. 100',
    listboxLabel: 'Ressources raffinées',
    noMatch: 'Aucune ressource ne correspond à « {q} »',
    emptyResTitle: 'Aucune ressource sélectionnée',
    emptyResText:
      'Choisissez une ressource raffinée ci-dessus — T2 à T8 : blocs, planches, cuir, tissu ou barres de métal — et nous listerons toutes les ressources de la chaîne.',
    emptyQtyTitle: 'Indiquez une quantité',
    emptyQtyText:
      'Indiquez combien de {name} vous souhaitez fabriquer et nous listerons toutes les ressources concernées.',
    title: 'Calculateur de raffinage',
    panelMaterials: 'Ressources nécessaires',
    panelMissing: 'Manquant',
    clearOwned: 'Réinitialiser',
    summaryCraft: 'Fabrication de',
    thResource: 'Ressource',
    thNeeded: 'Besoin',
    thOwned: 'Vous avez',
    thMissing: 'Manquant',
    ariaOwned: 'Combien de {name} avez-vous déjà',
    allGood: 'Vous avez déjà toutes les ressources brutes.',
  },
}

function initialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'fr') return stored
  } catch {
    // storage unavailable — fall through to browser language
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('fr')
    ? 'fr'
    : 'en'
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(initialLang)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // storage unavailable — language still applies for this session
    }
    document.documentElement.lang = lang
    const strings = STRINGS[lang]
    document.title = strings.docTitle
    document.querySelector('meta[name="description"]')?.setAttribute('content', strings.docDescription)
  }, [lang])

  const value = useMemo(() => {
    const t = (key, vars) => {
      let s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v)
      }
      return s
    }
    return {
      lang,
      setLang,
      t,
      /** Official item name in the current language, tier included. */
      resourceName: (id) => resourceName(id, lang),
      /** Official item name without the tier prefix. */
      baseName: (id) => baseName(id, lang),
    }
  }, [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
