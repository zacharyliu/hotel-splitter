import { describe, it, expect } from 'vitest'
import {
  calculateNights,
  getNightDates,
  calculateCosts,
  type Person,
} from '../src/calculations'

describe('calculateNights', () => {
  it('should calculate correct number of nights for a single night stay', () => {
    expect(calculateNights('2024-01-15', '2024-01-16')).toBe(1)
  })

  it('should calculate correct number of nights for a multi-night stay', () => {
    expect(calculateNights('2024-01-15', '2024-01-18')).toBe(3)
  })

  it('should return 0 when check-out is same as check-in', () => {
    expect(calculateNights('2024-01-15', '2024-01-15')).toBe(0)
  })

  it('should return 0 when check-out is before check-in', () => {
    expect(calculateNights('2024-01-15', '2024-01-14')).toBe(0)
  })

  it('should return 0 when check-in is empty', () => {
    expect(calculateNights('', '2024-01-16')).toBe(0)
  })

  it('should return 0 when check-out is empty', () => {
    expect(calculateNights('2024-01-15', '')).toBe(0)
  })

  it('should handle dates across month boundaries', () => {
    expect(calculateNights('2024-01-31', '2024-02-03')).toBe(3)
  })

  it('should handle dates across year boundaries', () => {
    expect(calculateNights('2023-12-30', '2024-01-02')).toBe(3)
  })
})

describe('getNightDates', () => {
  it('should return empty array for 0 nights', () => {
    expect(getNightDates('2024-01-15', 0)).toEqual([])
  })

  it('should return empty array for empty check-in date', () => {
    expect(getNightDates('', 3)).toEqual([])
  })

  it('should return correct dates for a single night', () => {
    expect(getNightDates('2024-01-15', 1)).toEqual(['2024-01-15'])
  })

  it('should return correct dates for multiple nights', () => {
    expect(getNightDates('2024-01-15', 3)).toEqual([
      '2024-01-15',
      '2024-01-16',
      '2024-01-17',
    ])
  })

  it('should handle dates across month boundaries', () => {
    expect(getNightDates('2024-01-31', 3)).toEqual([
      '2024-01-31',
      '2024-02-01',
      '2024-02-02',
    ])
  })

  it('should handle dates across year boundaries', () => {
    expect(getNightDates('2023-12-31', 3)).toEqual([
      '2023-12-31',
      '2024-01-01',
      '2024-01-02',
    ])
  })
})

describe('calculateCosts', () => {
  it('should return empty array when nights is 0', () => {
    const people: Person[] = [
      { id: '1', name: 'Alice', nights: [] },
    ]
    expect(calculateCosts(people, 100, 0)).toEqual([])
  })

  it('should return empty array when totalPrice is 0', () => {
    const people: Person[] = [
      { id: '1', name: 'Alice', nights: [true] },
    ]
    expect(calculateCosts(people, 0, 1)).toEqual([])
  })

  it('should return empty array when people array is empty', () => {
    expect(calculateCosts([], 100, 2)).toEqual([])
  })

  it('should calculate cost for single person staying all nights', () => {
    const people: Person[] = [
      { id: '1', name: 'Alice', nights: [true, true] },
    ]
    const costs = calculateCosts(people, 200, 2)
    expect(costs).toHaveLength(1)
    expect(costs[0].personId).toBe('1')
    expect(costs[0].perNight).toEqual([100, 100])
    expect(costs[0].total).toBe(200)
  })

  it('should calculate cost for single person staying some nights', () => {
    const people: Person[] = [
      { id: '1', name: 'Alice', nights: [true, false, true] },
    ]
    const costs = calculateCosts(people, 300, 3)
    expect(costs).toHaveLength(1)
    expect(costs[0].personId).toBe('1')
    expect(costs[0].perNight).toEqual([100, 0, 100])
    expect(costs[0].total).toBe(200)
  })

  it('should split cost equally when multiple people stay the same nights', () => {
    const people: Person[] = [
      { id: '1', name: 'Alice', nights: [true, true] },
      { id: '2', name: 'Bob', nights: [true, true] },
    ]
    const costs = calculateCosts(people, 200, 2)
    expect(costs).toHaveLength(2)
    expect(costs[0].perNight).toEqual([50, 50])
    expect(costs[0].total).toBe(100)
    expect(costs[1].perNight).toEqual([50, 50])
    expect(costs[1].total).toBe(100)
  })

  it('should split cost per night based on who stayed that night', () => {
    const people: Person[] = [
      { id: '1', name: 'Alice', nights: [true, true, true] },
      { id: '2', name: 'Bob', nights: [true, true, false] },
      { id: '3', name: 'Charlie', nights: [true, false, false] },
    ]
    const costs = calculateCosts(people, 300, 3)
    expect(costs).toHaveLength(3)
    
    // Night 1: All 3 people (100/3 = 33.33...)
    expect(costs[0].perNight[0]).toBeCloseTo(33.33, 2)
    expect(costs[1].perNight[0]).toBeCloseTo(33.33, 2)
    expect(costs[2].perNight[0]).toBeCloseTo(33.33, 2)
    
    // Night 2: Alice and Bob (100/2 = 50)
    expect(costs[0].perNight[1]).toBe(50)
    expect(costs[1].perNight[1]).toBe(50)
    expect(costs[2].perNight[1]).toBe(0)
    
    // Night 3: Only Alice (100/1 = 100)
    expect(costs[0].perNight[2]).toBe(100)
    expect(costs[1].perNight[2]).toBe(0)
    expect(costs[2].perNight[2]).toBe(0)
    
    // Totals
    expect(costs[0].total).toBeCloseTo(183.33, 2)
    expect(costs[1].total).toBeCloseTo(83.33, 2)
    expect(costs[2].total).toBeCloseTo(33.33, 2)
  })

  it('should handle decimal prices correctly', () => {
    const people: Person[] = [
      { id: '1', name: 'Alice', nights: [true] },
      { id: '2', name: 'Bob', nights: [true] },
    ]
    const costs = calculateCosts(people, 99.99, 1)
    expect(costs).toHaveLength(2)
    expect(costs[0].perNight[0]).toBeCloseTo(49.995, 2)
    expect(costs[0].total).toBeCloseTo(49.995, 2)
    expect(costs[1].perNight[0]).toBeCloseTo(49.995, 2)
    expect(costs[1].total).toBeCloseTo(49.995, 2)
  })

  it('should handle person with no nights stayed', () => {
    const people: Person[] = [
      { id: '1', name: 'Alice', nights: [false, false] },
      { id: '2', name: 'Bob', nights: [true, true] },
    ]
    const costs = calculateCosts(people, 200, 2)
    expect(costs).toHaveLength(2)
    expect(costs[0].perNight).toEqual([0, 0])
    expect(costs[0].total).toBe(0)
    expect(costs[1].perNight).toEqual([100, 100])
    expect(costs[1].total).toBe(200)
  })
})

