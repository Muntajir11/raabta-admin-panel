type AnyErr = unknown

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

export function formatApiError(err: AnyErr, fallback: string): string {
  const raw = err instanceof Error ? err.message : ''
  const msg = raw.trim() ? raw : fallback

  // Avoid dumping internal details to admins.
  const lowered = msg.toLowerCase()
  if (
    lowered.includes('cast to objectid') ||
    lowered.includes('validationerror') ||
    lowered.includes('mongo') ||
    lowered.includes('stack') ||
    lowered.includes('jwt') ||
    lowered.includes('csrf')
  ) {
    return fallback
  }

  return msg.length > 200 ? `${msg.slice(0, 200)}…` : msg
}

export function isNetworkError(err: AnyErr): boolean {
  if (err instanceof TypeError) return true
  if (isRecord(err) && safeString(err.name) === 'TypeError') return true
  return false
}

