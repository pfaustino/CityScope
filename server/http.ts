export function redact(text: string): string {
  return text
    .replace(/key=[^&\s]+/gi, 'key=REDACTED')
    .replace(/API_KEY=[^&\s]+/gi, 'API_KEY=REDACTED')
    .replace(/token=[^&\s]+/gi, 'token=REDACTED')
}

export async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { ...init, signal: init?.signal ?? AbortSignal.timeout(20_000) })
  const text = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status} ${redact(url)}`)
  const trimmed = text.trimStart()
  if (trimmed.startsWith('<')) throw new Error(`HTTP ${res.status} HTML (not JSON) from ${redact(url)}`)
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error(`HTTP ${res.status} response was not JSON from ${redact(url)}`)
  }
}
