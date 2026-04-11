/** Must match backend PRODUCT_SECTIONS */
export const PRODUCT_SECTIONS = [
  'Anime',
  'Sports',
  'Streetwear',
  'Customisation',
  'Islamic',
  'Lifestyle',
] as const

export type ProductSection = (typeof PRODUCT_SECTIONS)[number]
