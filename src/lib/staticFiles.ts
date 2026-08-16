export function publicFileUrl(name: string): string {
  const base = import.meta.env.BASE_URL
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}${name}`
}

export async function fetchLiveOrBaked<T>(apiPath: string, bakedFile: string): Promise<T | null> {
  try {
    const live = await fetch(apiPath)
    if (live.ok) return (await live.json()) as T
  } catch {
    /* GitHub Pages / no Express */
  }
  try {
    const baked = await fetch(publicFileUrl(bakedFile))
    if (baked.ok) return (await baked.json()) as T
  } catch {
    return null
  }
  return null
}
