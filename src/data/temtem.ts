export type TemType =
  | 'Neutral'
  | 'Fire'
  | 'Water'
  | 'Nature'
  | 'Electric'
  | 'Earth'
  | 'Mental'
  | 'Wind'
  | 'Digital'
  | 'Melee'
  | 'Crystal'
  | 'Toxic'

export interface Temtem {
  id: number
  name: string
  types: TemType[]
  description: string
  hp: number
  atk: number
  def: number
  spd: number
}

export const TYPE_COLORS: Record<TemType, string> = {
  Neutral: '#9aa3b2',
  Fire: '#ff6b4a',
  Water: '#39a7ff',
  Nature: '#4bd16a',
  Electric: '#ffd23f',
  Earth: '#c08a4a',
  Mental: '#c56bff',
  Wind: '#8fe3d2',
  Digital: '#6b8bff',
  Melee: '#ff8a3c',
  Crystal: '#ff6fae',
  Toxic: '#8f5bd6',
}

export const TEMTEM: Temtem[] = [
  {
    id: 1,
    name: 'Bunbun',
    types: ['Neutral'],
    description: 'A fluffy starter companion with an ever-curious nose.',
    hp: 48,
    atk: 40,
    def: 30,
    spd: 62,
  },
  {
    id: 2,
    name: 'Emberby',
    types: ['Fire', 'Wind'],
    description: 'A tiny ember that drifts on warm updrafts.',
    hp: 44,
    atk: 58,
    def: 28,
    spd: 71,
  },
  {
    id: 3,
    name: 'Tidepod',
    types: ['Water'],
    description: 'Carries a droplet of every sea it has ever visited.',
    hp: 55,
    atk: 45,
    def: 52,
    spd: 40,
  },
  {
    id: 4,
    name: 'Sprigglet',
    types: ['Nature'],
    description: 'A sprout that hums a tune when the sun is out.',
    hp: 52,
    atk: 50,
    def: 48,
    spd: 46,
  },
  {
    id: 5,
    name: 'Voltuff',
    types: ['Electric'],
    description: 'Static clings to its coat, crackling with every step.',
    hp: 46,
    atk: 62,
    def: 34,
    spd: 68,
  },
  {
    id: 6,
    name: 'Boulderkin',
    types: ['Earth', 'Crystal'],
    description: 'A wandering stone that grows brilliant facets with age.',
    hp: 70,
    atk: 55,
    def: 78,
    spd: 22,
  },
  {
    id: 7,
    name: 'Psyowl',
    types: ['Mental', 'Wind'],
    description: 'Reads the wind and, sometimes, your thoughts.',
    hp: 50,
    atk: 60,
    def: 38,
    spd: 66,
  },
  {
    id: 8,
    name: 'Pixibyte',
    types: ['Digital'],
    description: 'A glitchy sprite that renders itself into being.',
    hp: 42,
    atk: 66,
    def: 30,
    spd: 74,
  },
  {
    id: 9,
    name: 'Grapplon',
    types: ['Melee'],
    description: 'Never met a boulder it did not want to wrestle.',
    hp: 64,
    atk: 72,
    def: 50,
    spd: 44,
  },
  {
    id: 10,
    name: 'Venomoth',
    types: ['Toxic', 'Wind'],
    description: 'Its wing dust induces the sweetest, worst dreams.',
    hp: 48,
    atk: 58,
    def: 40,
    spd: 70,
  },
  {
    id: 11,
    name: 'Coralux',
    types: ['Water', 'Crystal'],
    description: 'A living reef that glows softly in the deep.',
    hp: 60,
    atk: 52,
    def: 64,
    spd: 38,
  },
  {
    id: 12,
    name: 'Magmadon',
    types: ['Fire', 'Earth'],
    description: 'Sleeps in calderas and snores gentle plumes of ash.',
    hp: 78,
    atk: 76,
    def: 60,
    spd: 30,
  },
]
