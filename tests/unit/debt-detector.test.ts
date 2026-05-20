import { describe, it, expect } from 'vitest'
import { DebtDetector, DebtPattern } from '../../src/core/debt-detector.js'

describe('DebtDetector', () => {
  it('should instantiate with repo path', () => {
    const detector = new DebtDetector('.')
    expect(detector).toBeDefined()
  })

  it('should parse valid JSON debt response', () => {
    const detector = new DebtDetector('.')
    const response = JSON.stringify({
      patterns: [
        {
          id: 'debt-1',
          type: 'complexity',
          severity: 'high',
          files: ['src/complex.ts'],
          description: 'Too many nested conditions',
          recommendation: 'Extract into separate functions',
          evidence: 'abc1234',
          trend: 'increasing',
        },
      ],
      overallHealth: 6,
      summary: 'Moderate debt detected',
    })

    const report = (detector as any).parseDebtResponse(response, 100)
    expect(report.totalPatterns).toBe(1)
    expect(report.patterns[0].severity).toBe('high')
    expect(report.overallHealth).toBe(6)
    expect(report.summary).toBe('Moderate debt detected')
    expect(report.bySeverity.high).toBe(1)
    expect(report.byType.complexity).toBe(1)
  })

  it('should handle invalid JSON response gracefully', () => {
    const detector = new DebtDetector('.')
    const response = 'Not valid JSON'

    const report = (detector as any).parseDebtResponse(response, 50)
    expect(report.totalPatterns).toBe(0)
    expect(report.patterns).toEqual([])
    expect(report.overallHealth).toBe(5)
  })
})
