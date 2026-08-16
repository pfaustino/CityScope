const USER_AGENT = 'CityScope/0.1 (Burbank public-data research; local app)'

export async function fetchEarthquakes() {
  const url =
    'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=34.1808&longitude=-118.3090&maxradiuskm=40&starttime=2026-01-01&minmagnitude=2.5'
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`USGS HTTP ${res.status}`)
  return res.json()
}
