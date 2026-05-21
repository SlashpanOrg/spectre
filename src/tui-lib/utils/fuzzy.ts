export interface FuzzyResult {
  score: number
  indices: number[]
}

export function fuzzyMatch(pattern: string, text: string): FuzzyResult | null {
  if (!pattern) return { score: 0, indices: [] }

  const patternLower = pattern.toLowerCase()
  const textLower = text.toLowerCase()
  const patternLen = patternLower.length
  const textLen = textLower.length

  if (patternLen > textLen) return null

  const indices: number[] = []
  let patternIdx = 0
  let textIdx = 0

  while (patternIdx < patternLen && textIdx < textLen) {
    if (patternLower[patternIdx] === textLower[textIdx]) {
      indices.push(textIdx)
      patternIdx++
    }
    textIdx++
  }

  if (patternIdx < patternLen) return null

  const score = calculateScore(patternLower, textLower, indices)
  return { score, indices }
}

function calculateScore(pattern: string, text: string, indices: number[]): number {
  let score = 0

  score += (pattern.length / text.length) * 100

  if (indices[0] === 0) score += 20

  let consecutiveBonus = 0
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] === indices[i - 1] + 1) {
      consecutiveBonus += 5
    } else {
      consecutiveBonus = 0
    }
  }
  score += consecutiveBonus

  for (const idx of indices) {
    if (idx > 0 && text[idx - 1] === ' ') score += 10
    if (idx > 0 && text[idx - 1] === '-') score += 8
    if (idx > 0 && text[idx - 1] === '_') score += 8
    if (idx > 0 && text[idx - 1] === '/') score += 5
    if (text[idx] === text[idx].toUpperCase() && text[idx] !== text[idx].toLowerCase()) {
      score += 5
    }
  }

  return score
}

export function fuzzyFilter<T>(
  items: T[],
  pattern: string,
  getText: (item: T) => string,
): { item: T; score: number }[] {
  if (!pattern.trim()) {
    return items.map((item) => ({ item, score: 0 }))
  }

  const results: { item: T; score: number }[] = []

  for (const item of items) {
    const text = getText(item)
    const match = fuzzyMatch(pattern, text)
    if (match) {
      results.push({ item, score: match.score })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results
}

export function highlightMatches(text: string, pattern: string): string {
  if (!pattern.trim()) return text

  const match = fuzzyMatch(pattern, text)
  if (!match) return text

  let result = ''
  let textIdx = 0

  for (const char of text) {
    if (match.indices.includes(textIdx)) {
      result += `[bold]${char}[/bold]`
    } else {
      result += char
    }
    textIdx++
  }

  return result
}
