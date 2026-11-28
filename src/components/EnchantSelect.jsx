import { enchantOptions } from '../data/resources'
import { useI18n } from '../i18n.jsx'

/**
 * Enchantment grade drop-down (`.0` – `.4`) shown between the resource picker
 * and the quantity field.
 *
 * Only T4–T8 have enchanted variants, so lower tiers offer `.0` alone and the
 * control is disabled — that reads as "this resource cannot be enchanted"
 * rather than silently hiding a field and shifting the layout. Stone caps at
 * `.3`: the game has no pristine rocks.
 *
 * A plain native <select> is used on purpose: five options need no autocomplete
 * and the native control gives keyboard and screen-reader support for free.
 */
export default function EnchantSelect({ tier, type, value, onChange, disabled = false }) {
  const { t } = useI18n()
  const options = enchantOptions(tier, type)
  const locked = disabled || options.length === 1

  return (
    <div className="field">
      <label className="field-label" htmlFor="enchant-select">
        {t('labelEnchant')}
      </label>
      <span className="select-wrap">
        <select
          id="enchant-select"
          className="text-input select-input"
          value={value}
          disabled={locked}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {options.map((level) => (
            <option key={level} value={level}>
              {t(`enchant${level}`)}
            </option>
          ))}
        </select>
        <span className="select-caret" aria-hidden="true" />
      </span>
    </div>
  )
}
