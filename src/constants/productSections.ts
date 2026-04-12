/** Must match backend PRODUCT_SECTIONS */
export const PRODUCT_SECTIONS = [
  'Anime',
  'Sports',
  'Streetwear',
  'Customisation',
  'Raabta Lifestyle',
  'Raabta Studio',
] as const

export type ProductSection = (typeof PRODUCT_SECTIONS)[number]

/** Pre-migration category values still in DB → current section id */
export const LEGACY_CATEGORY_MAP: Record<string, ProductSection> = {
  Islamic: 'Raabta Lifestyle',
  Lifestyle: 'Raabta Studio',
}

export function normalizeCategoryForForm(raw: string): ProductSection {
  if ((PRODUCT_SECTIONS as readonly string[]).includes(raw)) {
    return raw as ProductSection
  }
  return LEGACY_CATEGORY_MAP[raw] ?? PRODUCT_SECTIONS[0]
}

/** Display label for table (handles legacy DB values before migration) */
export function displayCategoryLabel(raw: string): string {
  const mapped = LEGACY_CATEGORY_MAP[raw as keyof typeof LEGACY_CATEGORY_MAP]
  return mapped ?? raw
}
