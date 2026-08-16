import { describe, expect, it } from 'vitest'
import { mean, monthOverMonth, pearson, percentChange, ratePerPopulation, rollingAverage, stddev, zScore } from '../shared/stats.ts'

describe('stats', () => {
  it('computes percent change and treats zero baseline as undefined', () => {
    expect(percentChange(150, 100)).toBe(50)
    expect(percentChange(80, 100)).toBe(-20)
    expect(monthOverMonth(10, 0)).toBeNull()
  })

  it('computes rolling average with a bounded window', () => {
    expect(rollingAverage([1, 2, 3, 4], 3)).toBe(3)
    expect(rollingAverage([1, 2], 3)).toBeNull()
  })

  it('computes population rates', () => {
    expect(ratePerPopulation(105, 105165, 1000)?.toFixed(2)).toBe('1.00')
    expect(ratePerPopulation(1, 0)).toBeNull()
  })

  it('computes z-score and Pearson r', () => {
    const sample = [10, 12, 11, 13, 10, 12]
    expect(mean(sample)).toBeCloseTo(11.333, 2)
    expect(stddev(sample)).not.toBeNull()
    expect(zScore(20, sample)).toBeGreaterThan(2)
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 5)
    expect(pearson([1, 2], [1, 2])).toBeNull()
  })
})
