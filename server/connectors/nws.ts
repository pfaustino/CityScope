const USER_AGENT = 'CityScope/0.1 (Burbank public-data research; local app)'

export async function fetchForecast() {
  const res = await fetch('https://api.weather.gov/gridpoints/LOX/154,51/forecast', {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/geo+json' },
  })
  if (!res.ok) throw new Error(`NWS HTTP ${res.status}`)
  return res.json()
}
