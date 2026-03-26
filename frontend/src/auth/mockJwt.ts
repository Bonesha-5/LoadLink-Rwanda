/** Demo auth helpers. Set `VITE_USE_MOCK_AUTH=false` for real API auth. */
export function isMockAuthMode(): boolean {
  const v = import.meta.env.VITE_USE_MOCK_AUTH as string | undefined
  return v !== 'false'
}

export function isMockSessionToken(token: string | null | undefined): boolean {
  return Boolean(token && token.endsWith('.mock-signature'))
}

/** Use only for API calls (mock tokens return null). */
export function getApiToken(token: string | null | undefined): string | null {
  if (!token) return null
  if (isMockSessionToken(token)) return null
  return token
}

export function createMockJwt(parts: { role: string; email?: string; name?: string; status?: string | null }): string {
  const header = btoa(unescape(encodeURIComponent(JSON.stringify({ alg: 'none', typ: 'JWT' }))))
  const payload = btoa(
    unescape(
      encodeURIComponent(
        JSON.stringify({
          ...parts,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400,
        }),
      ),
    ),
  )
  return `${header}.${payload}.mock-signature`
}
