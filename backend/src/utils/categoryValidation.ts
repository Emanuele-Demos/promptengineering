const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

export function sanitizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, 100)
}

export function isValidHexColor(color: string): boolean {
  return HEX_COLOR_REGEX.test(color)
}

export function normalizeHexColor(color: string): string {
  return color.trim().toUpperCase()
}

export function validateCategoryInput(
  name: unknown,
  color: unknown
): { name: string; color: string } {
  if (typeof name !== 'string' || !sanitizeCategoryName(name)) {
    throw new Error('Il nome della categoria è obbligatorio')
  }

  if (typeof color !== 'string' || !isValidHexColor(color.trim())) {
    throw new Error('Il colore deve essere in formato HEX (es. #3B82F6)')
  }

  return {
    name: sanitizeCategoryName(name),
    color: normalizeHexColor(color),
  }
}
