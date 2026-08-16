import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { analyzeWarehouse } from '../shared/analysis.ts'
import { SOURCES, liveSourceView } from '../shared/catalog.ts'
import { investigate, type EntityKind } from '../shared/investigate.ts'
import { buildReport, REPORT_DEFS } from '../shared/reports.ts'
import { applyOverlay } from '../shared/overlay.ts'
import { getWarehouse } from '../shared/warehouse.ts'
import { fetchCensusHint } from './connectors/census.ts'
import { fetchForecast } from './connectors/nws.ts'
import { fetchEarthquakes } from './connectors/usgs.ts'
import { accessStatus, loadEnv } from './env.ts'
import { runIngest } from './ingest.ts'
import { buildLiveOverlay } from './overlay.ts'

loadEnv()

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const baseWarehouse = getWarehouse()
let overlayCache: { at: number; overlay: Awaited<ReturnType<typeof buildLiveOverlay>> } | null = null

async function warehouseWithLive() {
  const overlay = await getOverlay()
  return applyOverlay(baseWarehouse, overlay)
}

async function getOverlay() {
  const now = Date.now()
  if (overlayCache && now - overlayCache.at < 15 * 60 * 1000) return overlayCache.overlay
  const overlay = await buildLiveOverlay()
  overlayCache = { at: now, overlay }
  return overlay
}

app.get('/api/overlay', async (_req, res) => {
  try {
    res.json(await getOverlay())
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) })
  }
})


app.get('/api/access', (_req, res) => {
  res.json(accessStatus())
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, city: 'Burbank, California', generatedAt: baseWarehouse.generatedAt })
})

app.get('/api/sources', async (_req, res) => {
  const keys = accessStatus()
  let overlay: Awaited<ReturnType<typeof getOverlay>> | null = null
  try {
    overlay = await getOverlay()
  } catch {
    overlay = null
  }
  res.json(SOURCES.map((s) => liveSourceView(s, keys, overlay)))
})

app.get('/api/warehouse', async (_req, res) => {
  res.json(await warehouseWithLive())
})

app.get('/api/analysis', async (_req, res) => {
  const live = await warehouseWithLive()
  res.json(analyzeWarehouse(live))
})

app.get('/api/reports', (_req, res) => {
  res.json(REPORT_DEFS.map((d) => ({ id: d.id, category: d.category, title: d.title, period: d.period })))
})

app.get('/api/reports/:id', async (req, res) => {
  const id = req.params.id
  if (!id || !REPORT_DEFS.some((d) => d.id === id)) {
    res.status(404).json({ error: 'Unknown report' })
    return
  }
  const live = await warehouseWithLive()
  const liveAnalysis = analyzeWarehouse(live)
  res.json(buildReport(id, live, liveAnalysis))
})

app.get('/api/investigate/:kind/:id', (req, res) => {
  const kind = req.params.kind as EntityKind
  const id = req.params.id
  if (!id) {
    res.status(400).json({ error: 'Missing id' })
    return
  }
  const bundle = investigate(baseWarehouse, kind, id)
  if (!bundle) {
    res.status(404).json({ error: 'Unknown entity' })
    return
  }
  res.json(bundle)
})

app.get('/api/live/earthquakes', async (_req, res) => {
  try {
    res.json(await fetchEarthquakes())
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.get('/api/live/weather', async (_req, res) => {
  try {
    res.json(await fetchForecast())
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.get('/api/live/census', async (_req, res) => {
  try {
    res.json(await fetchCensusHint())
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) })
  }
})

app.post('/api/ingest', async (_req, res) => {
  const results = await runIngest()
  overlayCache = null
  res.json({ results })
})

const isProd = process.env.NODE_ENV === 'production'
if (isProd) {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
  app.use(express.static(dist))
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'))
  })
}

const port = Number(process.env.PORT ?? 8787)
app.listen(port, () => {
  console.log(`CityScope API http://127.0.0.1:${port}`)
})
