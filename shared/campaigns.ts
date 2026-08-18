import { SCHEDULE_A_BY_STATE_ID } from './campaignScheduleA.ts'
import { makeProvenance } from './provenance.ts'
import type { CampaignCommittee, CampaignContributorCode, CampaignSnapshot, Provenance, Warehouse } from './types.ts'

export const EFILE_SEARCH_URL = 'https://efile.burbankca.gov/public/search/campaign'
export const CAMPAIGN_SOURCE_ID = 'burbank-efile-campaign'

export const CAMPAIGN_LIMITATIONS = [
  'Official City of Burbank Electronic Filing System Form 460 summary figures — not demonstration data.',
  'Line 5 Column B on the last campaign-year Form 460 is that calendar year’s contribution total. Summing every 460 in the year would double-count.',
  '2022 and 2024 are different elections. Totals from different years are not a same-race ranking.',
  'These totals are what the named candidate committees received. Independent expenditures for or against them are on other committees’ Form 496s and are not included.',
  'This extract covers the five sitting Burbank City Council members’ campaign-year Form 460 filings, not every committee in eFile.',
  'Itemized names are from Schedule A on every Form 460 in that campaign calendar year. Gifts under $100 are usually unitemized unless the giver already hit $100 that year.',
  'Unitemized is Line 1 Column B (monetary) minus the itemized Schedule A sum. It is not a list of people.',
  'Street addresses are on the PDFs and are not copied here. Some committee names are shortened where the PDF layout split the name across columns.',
  'A contribution is not evidence that a later vote was caused by a donor. Correlation is not causation.',
  'Form 470 is a short-form certification that the officeholder does not expect to raise or spend $2,000 in that calendar year. It is not a dollar total.',
]

const SNAP = 'snapshot' as const
const RETRIEVED = '2026-08-18T11:30:00-07:00'
const OFFICE = 'City of Burbank Council Member'

function pdf(ext: string): string {
  return `https://efile.burbankca.gov/pdfview?doc_public=${ext}`
}

function scheduleAFor(stateId: string) {
  const row = SCHEDULE_A_BY_STATE_ID[stateId]
  if (!row) throw new Error(`missing Schedule A extract for ${stateId}`)
  return row
}

/** Year-end Form 460 Column B totals transcribed from the published PDFs. */
export const CAMPAIGN_SNAPSHOT: CampaignSnapshot = {
  sourceUrl: EFILE_SEARCH_URL,
  retrievedAt: RETRIEVED,
  election: 'Sitting Burbank City Council',
  electionDate: '2022-11-08 / 2024-11-05',
  dataClass: SNAP,
  committees: [
    {
      candidateName: 'Christopher Rizzotti',
      office: OFFICE,
      committeeName: 'Elect Rizzotti to Burbank City Council 2024',
      stateId: '1466605',
      electionYear: 2024,
      electionDate: '2024-11-05',
      yearEnd460: {
        calendarYear: 2024,
        coversFrom: '2024-10-31',
        coversThrough: '2024-12-31',
        filedOn: '2025-01-26',
        filingId: '212948293',
        pdfUrl: pdf('Ext_0dfe976d-fbf4-a946-f265-07133b2fb208'),
        monetaryContributions: 81575,
        loansReceived: 0,
        nonmonetaryContributions: 854,
        totalContributionsReceived: 82429,
        totalExpendituresMade: 82429,
        endingCashBalance: 0,
        terminated: true,
      },
      officeholder470: [
        {
          calendarYear: 2025,
          coversFrom: '2025-01-01',
          coversThrough: '2025-12-31',
          filedOn: '2025-07-16',
          pdfUrl: pdf('Ext_7924d8b0-c8c2-8374-1c5e-6da062865258'),
        },
        {
          calendarYear: 2026,
          coversFrom: '2026-01-01',
          coversThrough: '2026-12-31',
          filedOn: '2026-07-07',
          pdfUrl: pdf('Ext_c325c335-7998-4cc0-9db3-db1e3420446e'),
        },
      ],
      scheduleA: scheduleAFor('1466605'),
    },
    {
      candidateName: 'Konstantine Anthony',
      office: OFFICE,
      committeeName: 'Konstantine Anthony for Burbank City Council 2024',
      stateId: '1470392',
      electionYear: 2024,
      electionDate: '2024-11-05',
      yearEnd460: {
        calendarYear: 2024,
        coversFrom: '2024-10-31',
        coversThrough: '2024-12-31',
        filedOn: '2025-01-31',
        filingId: '213045810',
        pdfUrl: pdf('Ext_c9ca952e-3b14-290b-c375-e58cd322f951'),
        monetaryContributions: 25206,
        loansReceived: 0,
        nonmonetaryContributions: 377.48,
        totalContributionsReceived: 25583.48,
        totalExpendituresMade: 25353.03,
        endingCashBalance: -736.05,
        terminated: false,
      },
      officeholder470: [
        {
          calendarYear: 2025,
          coversFrom: '2025-01-01',
          coversThrough: '2025-12-31',
          filedOn: '2025-07-31',
          pdfUrl: pdf('Ext_a9a9458e-44e0-72f9-42f1-50f5bddefd22'),
        },
      ],
      scheduleA: scheduleAFor('1470392'),
    },
    {
      candidateName: 'Zizette Mullins',
      office: OFFICE,
      committeeName: 'Mullins for City Council 2022',
      stateId: '1450408',
      electionYear: 2022,
      electionDate: '2022-11-08',
      yearEnd460: {
        calendarYear: 2022,
        coversFrom: '2022-11-03',
        coversThrough: '2022-12-31',
        filedOn: '2023-03-16',
        filingId: '207122934',
        pdfUrl: pdf('Ext_c122b5a9-5717-81e1-7750-fe2ecedb1514'),
        monetaryContributions: 80772.35,
        loansReceived: 0,
        nonmonetaryContributions: 0,
        totalContributionsReceived: 80772.35,
        totalExpendituresMade: 72788.01,
        endingCashBalance: 26688.12,
        terminated: true,
      },
      officeholder470: [
        {
          calendarYear: 2024,
          coversFrom: '2024-01-01',
          coversThrough: '2024-12-31',
          filedOn: '2024-07-15',
          pdfUrl: pdf('Ext_93afe053-395b-334a-f1fa-ff5f3ef0718d'),
        },
        {
          calendarYear: 2025,
          coversFrom: '2025-01-01',
          coversThrough: '2025-12-31',
          filedOn: '2025-07-30',
          pdfUrl: pdf('Ext_b54a156e-5af5-0e5d-3071-b6596c539716'),
        },
      ],
      scheduleA: scheduleAFor('1450408'),
    },
    {
      candidateName: 'Nikki Perez',
      office: OFFICE,
      committeeName: 'Nikki Perez for City Council 2022',
      stateId: '1448423',
      electionYear: 2022,
      electionDate: '2022-11-08',
      yearEnd460: {
        calendarYear: 2022,
        coversFrom: '2022-11-03',
        coversThrough: '2022-12-31',
        filedOn: '2023-01-30',
        filingId: '206101802',
        pdfUrl: pdf('Ext_a55cc24f-03e8-68ba-28ce-1aa91e9f6ccc'),
        monetaryContributions: 41760,
        loansReceived: 3000,
        nonmonetaryContributions: 215.58,
        totalContributionsReceived: 44975.58,
        totalExpendituresMade: 44606.91,
        endingCashBalance: 1818.67,
        terminated: true,
      },
      officeholder470: [
        {
          calendarYear: 2024,
          coversFrom: '2024-01-01',
          coversThrough: '2024-12-31',
          filedOn: '2024-07-31',
          pdfUrl: pdf('Ext_dcb17043-041f-15d7-98a2-73b1a4fb5370'),
        },
        {
          calendarYear: 2025,
          coversFrom: '2025-01-01',
          coversThrough: '2025-12-31',
          filedOn: '2025-08-08',
          pdfUrl: pdf('Ext_5e9b64b3-bc79-467f-9407-6ed1ebc8f408'),
        },
      ],
      scheduleA: scheduleAFor('1448423'),
    },
    {
      candidateName: 'Tamala Takahashi',
      office: OFFICE,
      committeeName: 'Tamala Takahashi for City Council 2022',
      stateId: '1448296',
      electionYear: 2022,
      electionDate: '2022-11-08',
      yearEnd460: {
        calendarYear: 2022,
        coversFrom: '2022-11-03',
        coversThrough: '2022-12-31',
        filedOn: '2023-01-29',
        filingId: '206070434',
        pdfUrl: pdf('Ext_0da9610b-ab1a-5b11-9fa3-44d2e740a2ff'),
        monetaryContributions: 17902,
        loansReceived: 0,
        nonmonetaryContributions: 0,
        totalContributionsReceived: 17902,
        totalExpendituresMade: 19728.98,
        endingCashBalance: 2484.47,
        terminated: true,
      },
      officeholder470: [
        {
          calendarYear: 2023,
          coversFrom: '2023-01-01',
          coversThrough: '2023-12-31',
          filedOn: '2023-07-25',
          pdfUrl: pdf('Ext_75186f24-e385-6d35-470a-467bd33feae4'),
        },
        {
          calendarYear: 2024,
          coversFrom: '2024-01-01',
          coversThrough: '2024-12-31',
          filedOn: '2024-07-31',
          pdfUrl: pdf('Ext_c5789a05-e07f-9cd8-8424-47a69ff4e060'),
        },
        {
          calendarYear: 2025,
          coversFrom: '2025-01-01',
          coversThrough: '2025-12-31',
          filedOn: '2025-07-28',
          pdfUrl: pdf('Ext_baa7cb5c-9c46-977d-899f-95a2190317eb'),
        },
      ],
      scheduleA: scheduleAFor('1448296'),
    },
  ],
}

export const CONTRIBUTOR_CODE_LABEL: Record<CampaignContributorCode, string> = {
  IND: 'Individual',
  COM: 'Recipient committee',
  OTH: 'Other',
  PTY: 'Political party',
  SCC: 'Small contributor committee',
}

export function campaignUsd(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

/** Ratio of two Line 5 Column B totals. Not a ranking of influence. */
export function contributionRatio(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null
  return numerator / denominator
}

export function committeesByContributions(committees: CampaignCommittee[]): CampaignCommittee[] {
  return [...committees].sort(
    (a, b) => b.yearEnd460.totalContributionsReceived - a.yearEnd460.totalContributionsReceived,
  )
}

export function committeesByElectionYear(
  snap: CampaignSnapshot,
): { year: number; electionDate: string; committees: CampaignCommittee[] }[] {
  const years = [...new Set(snap.committees.map((c) => c.electionYear))].sort((a, b) => b - a)
  return years.map((year) => {
    const committees = snap.committees.filter((c) => c.electionYear === year)
    return {
      year,
      electionDate: committees[0]?.electionDate ?? String(year),
      committees: committeesByContributions(committees),
    }
  })
}

export function campaignContributionProvenance(wh: Warehouse, committee: CampaignCommittee): Provenance {
  const year = committee.yearEnd460.calendarYear
  return makeProvenance({
    label: `${year} total contributions received (${committee.candidateName})`,
    value: committee.yearEnd460.totalContributionsReceived,
    unit: 'USD',
    sourceId: CAMPAIGN_SOURCE_ID,
    dataset: `FPPC Form 460 Line 5 Column B (${committee.committeeName})`,
    retrievedAt: wh.campaigns?.retrievedAt ?? wh.generatedAt,
    query: {
      committee: committee.committeeName,
      stateId: committee.stateId,
      filingId: committee.yearEnd460.filingId,
      url: committee.yearEnd460.pdfUrl,
    },
    geographicFilter: 'City of Burbank, California',
    timePeriod: {
      start: `${year}-01-01`,
      end: committee.yearEnd460.coversThrough,
    },
    transformation:
      'Copied Line 5 TOTAL CONTRIBUTIONS RECEIVED, Column B (calendar year to date) from the last campaign-year Form 460. Overlapping 460s are not summed.',
    claimType: 'fact',
    dataClass: wh.campaigns?.dataClass ?? 'snapshot',
    limitations: CAMPAIGN_LIMITATIONS,
  })
}
