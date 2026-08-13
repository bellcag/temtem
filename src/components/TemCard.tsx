import { TYPE_COLORS, type Temtem } from '../data/temtem'

interface TemCardProps {
  tem: Temtem
  isFavorite: boolean
  onToggleFavorite: (id: number) => void
}

const STATS: { key: keyof Pick<Temtem, 'hp' | 'atk' | 'def' | 'spd'>; label: string }[] = [
  { key: 'hp', label: 'HP' },
  { key: 'atk', label: 'ATK' },
  { key: 'def', label: 'DEF' },
  { key: 'spd', label: 'SPD' },
]

export function TemCard({ tem, isFavorite, onToggleFavorite }: TemCardProps) {
  const accent = TYPE_COLORS[tem.types[0]]

  return (
    <li className="card" style={{ ['--accent' as string]: accent }}>
      <div className="card__top">
        <span className="card__id">#{String(tem.id).padStart(3, '0')}</span>
        <button
          type="button"
          className={`card__fav ${isFavorite ? 'card__fav--on' : ''}`}
          onClick={() => onToggleFavorite(tem.id)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remove ${tem.name} from favorites` : `Add ${tem.name} to favorites`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </div>

      <div className="card__avatar" aria-hidden>
        {tem.name.charAt(0)}
      </div>

      <h2 className="card__name">{tem.name}</h2>

      <div className="card__types">
        {tem.types.map((type) => (
          <span
            key={type}
            className="type-badge"
            style={{ background: TYPE_COLORS[type] }}
          >
            {type}
          </span>
        ))}
      </div>

      <p className="card__desc">{tem.description}</p>

      <dl className="card__stats">
        {STATS.map(({ key, label }) => (
          <div key={key} className="stat">
            <dt>{label}</dt>
            <dd>
              <span className="stat__value">{tem[key]}</span>
              <span className="stat__bar" aria-hidden>
                <span
                  className="stat__fill"
                  style={{ width: `${Math.min(100, (tem[key] / 90) * 100)}%` }}
                />
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </li>
  )
}
