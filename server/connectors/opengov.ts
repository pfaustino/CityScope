import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  OPENGOV_ALT_FILE,
  OPENGOV_AP_FILE,
  OPENGOV_DEFAULT_FILE,
  parseOpenGovAnnualCsv,
  parseOpenGovPaymentsCsv,
} from '../../shared/opengov.ts'
import type { OpenGovAnnualSnapshot, OpenGovPaymentRollup } from '../../shared/types.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const CANDIDATES = [
  path.join(ROOT, OPENGOV_DEFAULT_FILE),
  path.join(ROOT, OPENGOV_ALT_FILE),
  path.join(ROOT, 'data', OPENGOV_DEFAULT_FILE),
  path.join(ROOT, 'data', OPENGOV_ALT_FILE),
]

const AP_CANDIDATES = [path.join(ROOT, OPENGOV_AP_FILE), path.join(ROOT, 'data', OPENGOV_AP_FILE)]

export function findOpenGovCsv(): string | null {
  return firstExisting(CANDIDATES)
}

export function findOpenGovApCsv(): string | null {
  return firstExisting(AP_CANDIDATES)
}

export function loadOpenGovAnnual():
  | OpenGovAnnualSnapshot
  | { status: string; message: string } {
  const file = findOpenGovCsv()
  if (!file) {
    return {
      status: 'unavailable',
      message: `No ${OPENGOV_DEFAULT_FILE} found at repo root or data/. Export Annual — Departments from OpenGov (Share → Spreadsheet).`,
    }
  }
  return parseOpenGovAnnualCsv(readFileSync(file, 'utf8'), path.basename(file))
}

export function loadOpenGovPayments():
  | OpenGovPaymentRollup
  | { status: string; message: string } {
  const file = findOpenGovApCsv()
  if (!file) {
    return {
      status: 'unavailable',
      message: `No ${OPENGOV_AP_FILE} found at repo root or data/. Download Accounts Payable Transactions from ${'https://burbankca.opengov.com/data/#/1296'}.`,
    }
  }
  return parseOpenGovPaymentsCsv(readFileSync(file, 'utf8'), path.basename(file))
}

function firstExisting(candidates: string[]): string | null {
  for (const file of candidates) {
    if (existsSync(file)) return file
  }
  return null
}
