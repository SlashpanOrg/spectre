import { describe, it, expect } from 'vitest'
import { PRReviewer, ReviewComment } from '../../src/core/pr-reviewer.js'

describe('PRReviewer', () => {
  it('should instantiate with repo path', () => {
    const reviewer = new PRReviewer('.')
    expect(reviewer).toBeDefined()
  })

  it('should parse valid JSON review response', () => {
    const reviewer = new PRReviewer('.')
    const response = JSON.stringify({
      summary: 'Good changes overall',
      comments: [
        {
          file: 'src/index.ts',
          severity: 'warning',
          category: 'performance',
          message: 'Consider caching this result',
          suggestion: 'Add memoization',
        },
      ],
      overallScore: 8,
      categories: { architecture: 8, security: 7, performance: 6, maintainability: 9, convention: 8 },
    })

    const result = (reviewer as any).parseReviewResponse(response)
    expect(result.summary).toBe('Good changes overall')
    expect(result.comments).toHaveLength(1)
    expect(result.comments[0].severity).toBe('warning')
    expect(result.overallScore).toBe(8)
  })

  it('should handle invalid JSON response gracefully', () => {
    const reviewer = new PRReviewer('.')
    const response = 'This is not JSON at all'

    const result = (reviewer as any).parseReviewResponse(response)
    expect(result.summary).toBe('This is not JSON at all')
    expect(result.comments).toEqual([])
    expect(result.overallScore).toBe(5)
  })
})
