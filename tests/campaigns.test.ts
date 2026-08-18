import { describe, expect, it } from 'vitest'
import {
  CAMPAIGN_SNAPSHOT,
  campaignUsd,
  committeesByContributions,
  committeesByElectionYear,
  contributionRatio,
} from '../shared/campaigns.ts'

describe('campaign Form 460 snapshot', () => {
  it('keeps the published year-end Line 5 Column B totals', () => {
    const rizzotti = CAMPAIGN_SNAPSHOT.committees.find((c) => c.stateId === '1466605')
    const anthony = CAMPAIGN_SNAPSHOT.committees.find((c) => c.stateId === '1470392')
    const mullins = CAMPAIGN_SNAPSHOT.committees.find((c) => c.stateId === '1450408')
    const perez = CAMPAIGN_SNAPSHOT.committees.find((c) => c.stateId === '1448423')
    const takahashi = CAMPAIGN_SNAPSHOT.committees.find((c) => c.stateId === '1448296')
    expect(CAMPAIGN_SNAPSHOT.committees).toHaveLength(5)
    expect(rizzotti?.yearEnd460.totalContributionsReceived).toBe(82429)
    expect(anthony?.yearEnd460.totalContributionsReceived).toBe(25583.48)
    expect(mullins?.yearEnd460.totalContributionsReceived).toBe(80772.35)
    expect(perez?.yearEnd460.totalContributionsReceived).toBe(44975.58)
    expect(takahashi?.yearEnd460.totalContributionsReceived).toBe(17902)
    expect(rizzotti?.yearEnd460.totalExpendituresMade).toBe(82429)
    expect(anthony?.yearEnd460.totalExpendituresMade).toBe(25353.03)
    expect(rizzotti?.yearEnd460.endingCashBalance).toBe(0)
    expect(anthony?.yearEnd460.endingCashBalance).toBe(-736.05)
  })

  it('groups 2022 and 2024 separately and ratios only the 2024 pair', () => {
    const groups = committeesByElectionYear(CAMPAIGN_SNAPSHOT)
    expect(groups.map((g) => g.year)).toEqual([2024, 2022])
    expect(groups[0]?.committees.map((c) => c.candidateName)).toEqual([
      'Christopher Rizzotti',
      'Konstantine Anthony',
    ])
    expect(groups[1]?.committees.map((c) => c.candidateName)).toEqual([
      'Zizette Mullins',
      'Nikki Perez',
      'Tamala Takahashi',
    ])
    const y2024 = groups[0]?.committees ?? []
    const ratio = contributionRatio(
      y2024[0]?.yearEnd460.totalContributionsReceived ?? 0,
      y2024[1]?.yearEnd460.totalContributionsReceived ?? 0,
    )
    expect(ratio).toBeCloseTo(3.22, 2)
    expect(contributionRatio(1, 0)).toBeNull()
    expect(committeesByContributions(CAMPAIGN_SNAPSHOT.committees)[0]?.candidateName).toBe(
      'Christopher Rizzotti',
    )
  })

  it('formats cents as published', () => {
    expect(campaignUsd(25583.48)).toBe('$25,583.48')
    expect(campaignUsd(-736.05)).toBe('-$736.05')
  })
})
