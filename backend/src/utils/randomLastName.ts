const RANDOM_SURNAMES = [
  'Romano',
  'Galli',
  'Conti',
  'Fontana',
  'Moretti',
  'Barbieri',
  'Ferraro',
  'Marini',
  'Greco',
  'Bruno',
  'Ricci',
  'Lombardi',
  'Costa',
  'Giordano',
  'Mancini',
  'Rizzo',
  'Lombardo',
  'Colombo',
  'Ferrari',
  'Esposito',
  'Caruso',
  'Serra',
  'Monti',
  'Palmieri',
  'Fabbri',
  'Santoro',
  'Martini',
  'Leone',
  'Longo',
  'Gentile',
] as const

export function generateRandomLastName(): string {
  const index = Math.floor(Math.random() * RANDOM_SURNAMES.length)
  return RANDOM_SURNAMES[index] ?? 'Romano'
}

export function isPlaceholderLastName(lastName: string | null | undefined): boolean {
  if (!lastName) return true
  const normalized = lastName.trim().toLowerCase()
  return normalized === 'team' || normalized === 'utente'
}
