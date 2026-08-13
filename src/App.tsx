import { useEffect, useMemo, useState } from 'react'
import { TEMTEM, TYPE_COLORS, type TemType } from './data/temtem'
import { TemCard } from './components/TemCard'
import './App.css'

const FAVORITES_KEY = 'temtem-dex:favorites'

const ALL_TYPES = Object.keys(TYPE_COLORS) as TemType[]

function loadFavorites(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

function App() {
  const [query, setQuery] = useState('')
  const [activeType, setActiveType] = useState<TemType | 'All'>('All')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [favorites, setFavorites] = useState<number[]>(loadFavorites)

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  function toggleFavorite(id: number) {
    setFavorites((current) =>
      current.includes(id) ? current.filter((n) => n !== id) : [...current, id],
    )
  }

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return TEMTEM.filter((tem) => {
      const matchesQuery =
        normalized === '' || tem.name.toLowerCase().includes(normalized)
      const matchesType = activeType === 'All' || tem.types.includes(activeType)
      const matchesFavorite = !onlyFavorites || favorites.includes(tem.id)
      return matchesQuery && matchesType && matchesFavorite
    })
  }, [query, activeType, onlyFavorites, favorites])

  const typesInUse = useMemo(() => {
    const used = new Set<TemType>()
    for (const tem of TEMTEM) for (const t of tem.types) used.add(t)
    return ALL_TYPES.filter((t) => used.has(t))
  }, [])

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__brand">
          <span className="hero__logo" aria-hidden>◆</span>
          <div>
            <h1>Temtem Dex</h1>
            <p>Browse the archipelago's creatures, filter by type, and build your squad.</p>
          </div>
        </div>

        <div className="controls">
          <div className="search">
            <span className="search__icon" aria-hidden>⌕</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              aria-label="Search Temtem by name"
            />
          </div>

          <button
            type="button"
            className={`fav-toggle ${onlyFavorites ? 'fav-toggle--on' : ''}`}
            onClick={() => setOnlyFavorites((v) => !v)}
            aria-pressed={onlyFavorites}
          >
            ★ Favorites{favorites.length > 0 ? ` (${favorites.length})` : ''}
          </button>
        </div>

        <div className="filters" role="group" aria-label="Filter by type">
          <button
            type="button"
            className={`chip ${activeType === 'All' ? 'chip--active' : ''}`}
            onClick={() => setActiveType('All')}
          >
            All
          </button>
          {typesInUse.map((type) => (
            <button
              key={type}
              type="button"
              className={`chip ${activeType === type ? 'chip--active' : ''}`}
              style={
                activeType === type
                  ? { background: TYPE_COLORS[type], borderColor: TYPE_COLORS[type], color: '#0b1020' }
                  : { borderColor: TYPE_COLORS[type], color: TYPE_COLORS[type] }
              }
              onClick={() => setActiveType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </header>

      <main>
        <p className="result-count" role="status">
          {results.length} {results.length === 1 ? 'creature' : 'creatures'}
        </p>

        {results.length === 0 ? (
          <div className="empty">
            <p>No Temtem match your filters.</p>
            <button
              type="button"
              className="chip"
              onClick={() => {
                setQuery('')
                setActiveType('All')
                setOnlyFavorites(false)
              }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <ul className="grid">
            {results.map((tem) => (
              <TemCard
                key={tem.id}
                tem={tem}
                isFavorite={favorites.includes(tem.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </ul>
        )}
      </main>

      <footer className="footer">
        <span>{TEMTEM.length} creatures catalogued</span>
      </footer>
    </div>
  )
}

export default App
