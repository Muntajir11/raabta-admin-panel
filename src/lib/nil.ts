/** Display placeholder for missing profile / optional text (admin UI). */
export function nil(v: string | null | undefined): string {
  if (v == null || String(v).trim() === '') return 'NIL'
  return String(v)
}
