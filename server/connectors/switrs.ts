import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSwitrsCsv, SWITRS_DEFAULT_FILE } from '../../shared/switrs.ts'
import type { Collision } from '../../shared/types.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const CANDIDATES = [
  path.join(ROOT, 'Crashes.csv'),
  path.join(ROOT, 'crashes.csv'),
  path.join(ROOT, 'data', 'Crashes.csv'),
  path.join(ROOT, 'data', 'crashes.csv'),
]

export function findCrashesCsv(): string | null {
  for (const file of CANDIDATES) {
    if (existsSync(file)) return file
  }
  return null
}

export function loadSwitrsCrashes():
  | { fileName: string; collisions: Collision[] }
  | { status: string; message: string } {
  const file = findCrashesCsv()
  if (!file) {
    return {
      status: 'needs_registration',
      message: `No ${SWITRS_DEFAULT_FILE} found at repo root or data/. Export Burbank collisions from TIMS.`,
    }
  }
  const text = readFileSync(file, 'utf8')
  const fileName = path.basename(file)
  return { fileName, collisions: parseSwitrsCsv(text, fileName) }
}
