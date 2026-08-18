import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ONBASE_PERMIT_FILE, parseOnBasePermitsCsv, permitListingForOverlay } from '../../shared/onbase.ts'
import type { OnBasePermitSnapshot } from '../../shared/types.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const CANDIDATES = [path.join(ROOT, ONBASE_PERMIT_FILE), path.join(ROOT, 'data', ONBASE_PERMIT_FILE)]

export function findOnBasePermitCsv(): string | null {
  for (const file of CANDIDATES) {
    if (existsSync(file)) return file
  }
  return null
}

export function loadOnBasePermits():
  | OnBasePermitSnapshot
  | { status: string; message: string } {
  const file = findOnBasePermitCsv()
  if (!file) {
    return {
      status: 'unavailable',
      message: `No ${ONBASE_PERMIT_FILE} found at repo root or data/. Search Building Documents at https://ccpa.burbankca.gov/PublicAccess/cq-search/index.html.`,
    }
  }
  return permitListingForOverlay(parseOnBasePermitsCsv(readFileSync(file, 'utf8'), path.basename(file)))
}
