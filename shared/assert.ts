export class CityScopeError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'CityScopeError'
    this.code = code
  }
}

export function assert(condition: unknown, code: string, message: string): asserts condition {
  if (condition) return
  throw new CityScopeError(code, `Invariant failed: ${code} — ${message}`)
}
