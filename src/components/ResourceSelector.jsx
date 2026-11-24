import { useEffect, useMemo, useRef, useState } from 'react'
import { REFINED_RESOURCES, filterResources } from '../data/resources'

/**
 * Editable drop-down (combobox) with type-to-filter autocomplete over every
 * refined resource (T2–T8 × 5 types). Fully keyboard accessible.
 */
export default function ResourceSelector({ value, onSelect }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const options = useMemo(() => filterResources(query), [query])
  const selected = REFINED_RESOURCES.find((r) => r.id === value) ?? null
  const displayValue = open ? query : (selected?.name ?? '')

  // Close when clicking anywhere outside the widget.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  // Never let the highlight point outside the current result list.
  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, options.length - 1)))
  }, [options.length])

  // Keep the highlighted option visible while arrowing through the list.
  useEffect(() => {
    const el = listRef.current?.children[activeIndex]
    if (el?.scrollIntoView) el.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  const openList = () => {
    const highlight = value
      ? REFINED_RESOURCES.findIndex((r) => r.id === value)
      : 0
    setQuery('')
    setActiveIndex(highlight >= 0 ? highlight : 0)
    setOpen(true)
  }

  const select = (opt) => {
    onSelect(opt.id)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return openList()
      if (options.length === 0) return
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((i) => Math.max(0, Math.min(options.length - 1, i + step)))
    } else if (e.key === 'Enter') {
      if (open && options[activeIndex]) {
        e.preventDefault()
        select(options[activeIndex])
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        setOpen(false)
        setQuery('')
      }
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className="combo" ref={wrapRef}>
      <label className="field-label" htmlFor="resource-input">
        Refined resource
      </label>
      <div className="combo-control">
        <input
          id="resource-input"
          ref={inputRef}
          className="text-input combo-input"
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-expanded={open}
          aria-controls="resource-listbox"
          aria-autocomplete="list"
          aria-activedescendant={
            open && options[activeIndex] ? `resource-option-${activeIndex}` : undefined
          }
          placeholder="Search… e.g. T5 Granite Block"
          value={displayValue}
          onFocus={() => {
            if (!open) openList()
          }}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(0)
          }}
          onKeyDown={handleKeyDown}
        />
        <span className={`combo-caret ${open ? 'is-open' : ''}`} aria-hidden="true" />
      </div>

      {open && (
        <ul
          className="combo-menu"
          id="resource-listbox"
          role="listbox"
          aria-label="Refined resources"
          ref={listRef}
        >
          {options.length === 0 && (
            <li className="combo-empty" role="presentation">
              No resource matches “{query}”
            </li>
          )}
          {options.map((opt, i) => (
            <li
              key={opt.id}
              id={`resource-option-${i}`}
              role="option"
              aria-selected={opt.id === value}
              className={`combo-option ${i === activeIndex ? 'is-active' : ''}`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => e.preventDefault()} // keep focus in the input
              onClick={() => select(opt)}
            >
              <img className="opt-icon" src={opt.icon} alt="" aria-hidden="true" width="26" height="26" />
              <span className="opt-tier">T{opt.tier}</span>
              <span className="opt-name">{opt.baseName}</span>
              <span className="opt-raw">{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
