import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  parseSwitrsCsv,
  SWITRS_DEFAULT_FILE,
  SWITRS_GLENDALE_FILE,
  type SwitrsCity,
} from '../../shared/switrs.ts'
import type { Collision } from '../../shared/types.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const BURBANK_CANDIDATES = [
  path.join(ROOT, 'Crashes.csv'),
  path.join(ROOT, 'crashes.csv'),
  path.join(ROOT, 'data', 'Crashes.csv'),
  path.join(ROOT, 'data', 'crashes.csv'),
]

const GLENDALE_CANDIDATES = [
  path.join(ROOT, 'Crashes-Glendale.csv'),
  path.join(ROOT, 'crashes-glendale.csv'),
  path.join(ROOT, 'data', 'Crashes-Glendale.csv'),
  path.join(ROOT, 'data', 'crashes-glendale.csv'),
]

export function findCrashesCsv(): string | null {
  return firstExisting(BURBANK_CANDIDATES)
}

export function findGlendaleCrashesCsv(): string | null {
  return firstExisting(GLENDALE_CANDIDATES)
}

export function loadSwitrsCrashes():
  | {
      fileName: string
      collisions: Collision[]
      glendaleFileName: string | null
      collisionsGlendale: Collision[]
    }
  | { status: string; message: string } {
  const file = findCrashesCsv()
  if (!file) {
    return {
      status: 'needs_registration',
      message: `No ${SWITRS_DEFAULT_FILE} found at repo root or data/. Export Burbank collisions from TIMS.`,
    }
  }
  const fileName = path.basename(file)
  const collisions = parseSwitrsCsv(readFileSync(file, 'utf8'), fileName, 'BURBANK')
  const glendale = loadOptionalCity(GLENDALE_CANDIDATES, 'GLENDALE', SWITRS_GLENDALE_FILE)
  return {
    fileName,
    collisions,
    glendaleFileName: glendale?.fileName ?? null,
    collisionsGlendale: glendale?.collisions ?? [],
  }
}

function loadOptionalCity(
  candidates: string[],
  city: SwitrsCity,
  fallbackName: string,
): { fileName: string; collisions: Collision[] } | null {
  const file = firstExisting(candidates)
  if (!file) return null
  const fileName = path.basename(file)
  return { fileName: fileName || fallbackName, collisions: parseSwitrsCsv(readFileSync(file, 'utf8'), fileName, city) }
}

function firstExisting(candidates: string[]): string | null {
  for (const file of candidates) {
    if (existsSync(file)) return file
  }
  return null
}
