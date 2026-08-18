# CityScope

Web desk that turns **Burbank, California** public data into verifiable information. Investigative without being accusatory: facts, calculations, correlations, observations, and hypotheses stay labeled. Correlation is never treated as causation.

**Public site:** https://pfaustino.github.io/CityScope/

The GitHub Pages build is a static UI. It reads committed/baked public snapshots (OpenJustice annual totals, SWITRS collisions from `Crashes.csv`, OpenGov Annual — Departments from `Burbank Data Snapshot.csv`, OpenGov Accounts Payable from `OpenGov-Accounts-Payable.csv`, OnBase Building Documents from `OnBase-Building-Permits.csv`, Census, USGS, NWS, and other already-ingested series). Live keyed ingest stays local.

## Run locally

```bash
npm install
npm run dev
```

App: http://127.0.0.1:5173  
API: http://127.0.0.1:8787

```bash
npm run check          # lint, typecheck, unit tests, build
npm run ingest         # snapshot USGS, NWS, Census, NOAA, OpenJustice, FBI CDE, SWITRS (immutable files under data/raw)
npm run bake           # write public/overlay.json + public/sources.json from snapshots + Crashes.csv + OpenGov CSV + OnBase permits CSV (no API keys)
```

## What is live vs not connected

| Connected / snapshot | Not loaded (no fake counts) | Restricted |
| --- | --- | --- |
| Census ACS (live with key; snapshots on Pages) | Crime incidents | Flock / ALPR |
| USGS earthquakes | Business licenses | Use-of-force / complaints (CPRA) |
| NWS forecast | Airport passengers | |
| NOAA GHCND (token; snapshots on Pages) | | |
| AirNow (key; preliminary; snapshots on Pages) | | |
| CA DOJ OpenJustice annual totals | | |
| CA DOJ OpenJustice hate-crime events (NCIC 1912) | | |
| SWITRS collisions (`Crashes.csv`) | | |
| OpenGov Annual — Departments (`Burbank Data Snapshot.csv`) | | |
| OpenGov Accounts Payable (`OpenGov-Accounts-Payable.csv`) | | |
| OnBase Building Documents (`OnBase-Building-Permits.csv`) | | |

Click any statistic for provenance (source, query, period, transformation, limitations).

Set keys in `.env` (copy from `.env.example`). Census and NOAA email the credential after signup:

- Census: https://api.census.gov/data/key_signup.html
- NOAA CDO: https://www.ncdc.noaa.gov/cdo-web/token
- AirNow (optional): https://docs.airnowapi.org/account/request/

```bash
npm run access         # shows which keys are set (not the secret values)
```

Never put Census / NOAA / AirNow / DATA_GOV keys in the frontend bundle. `.env` is gitignored.

## Publish notes

GitHub Pages serves `dist` from the `main` branch via Actions. Refreshing public numbers: run `npm run ingest` locally (needs keys for Census/NOAA/AirNow/FBI), then `npm run bake`, commit the baked JSON (and `Crashes.csv` if it changed), and push.

Not published:

- `.env` and API keys
- `PRRForm-filled.pdf` and `scripts/fill_prr_form.py` (requester personal information)
- `data/raw/**` ingest dumps (local only; Pages uses `public/overlay.json`)
