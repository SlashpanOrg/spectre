import { logger } from '../utils/logger.js'

export interface IntentResult {
  intent: IntentType
  confidence: number
  entities: ExtractedEntity[]
  enhancedPrompt: string
}

export type IntentType =
  | 'summarize'
  | 'fix'
  | 'create'
  | 'explain'
  | 'test'
  | 'debug'
  | 'search'
  | 'review'
  | 'refactor'
  | 'unknown'

interface ExtractedEntity {
  type: 'file' | 'directory' | 'function' | 'command' | 'term'
  value: string
}

const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  summarize: [
    /summarize\s+(this\s+)?(file|code|class|function|module)/i,
    /explain\s+(this\s+)?(file|code|function|class)/i,
    /what\s+(does|is|are)/i,
    /give\s+me\s+(a\s+)?(summary|overview)/i,
    /overview\s+of/i,
  ],
  fix: [
    /fix\s+(this\s+)?(bug|issue|error|problem)/i,
    /solve\s+(this|the)\s+(bug|issue|problem)/i,
    /resolve/i,
    /repair/i,
    /there['']?s\s+(a|an)\s+(bug|error)/i,
    /not\s+working/i,
    /broken/i,
  ],
  create: [
    /create\s+(a|an|new)\s+/i,
    /write\s+(a|an|new)\s+(file|function|class|module|test|script)/i,
    /generate\s+(a|an)\s+/i,
    /implement\s+/i,
    /add\s+(a|an|new)\s+/i,
    /build\s+(a|an)\s+/i,
  ],
  explain: [
    /explain\s+(this|how|what|why)/i,
    /how\s+(does|do|can|to)/i,
    /what\s+is\s+(the\s+)?(meaning|purpose|difference)/i,
    /why\s+does/i,
    /walk\s+me\s+through/i,
    /break\s+down/i,
  ],
  test: [
    /write\s+(a\s+)?test/i,
    /add\s+(a\s+)?test/i,
    /create\s+(a\s+)?test/i,
    /run\s+(the\s+)?tests/i,
    /test\s+coverage/i,
    /unit\s+test/i,
  ],
  debug: [
    /debug\s+/i,
    /why\s+is/i,
    /trace\s+/i,
    /log\s+/i,
    /diagnose/i,
    /investigate/i,
  ],
  search: [
    /search\s+(for|the)/i,
    /find\s+(the|all|where)/i,
    /look\s+for/i,
    /locate/i,
  ],
  review: [
    /review\s+(this|the|my)/i,
    /check\s+(this|the|my|for)/i,
    /audit/i,
    /analyze\s+(this|the|my|code)/i,
  ],
  refactor: [
    /refactor\s+/i,
    /optimize/i,
    /improve\s+(this|the|performance|code)/i,
    /clean\s+up/i,
    /restructure/i,
  ],
  unknown: [],
}

const FILE_PATTERNS = [
  /[`'"]?([\w./-]+\.[\w]+)[`'"]?/g,
  /(?:file|path|at)\s+[`'"]?([\w./-]+)[`'"]?/gi,
]

const FUNCTION_PATTERNS = [
  /(?:function|method|def)\s+[`'"]?(\w+)[`'"]?/gi,
  /[`'"]?(\w+)\(\)[`'"]?/g,
]

function extractEntities(input: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = []
  const seen = new Set<string>()

  for (const pattern of FILE_PATTERNS) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(input)) !== null) {
      const value = match[1].replace(/[`'"]/g, '')
      if (value && !seen.has(value)) {
        seen.add(value)
        entities.push({ type: 'file', value })
      }
    }
  }

  for (const pattern of FUNCTION_PATTERNS) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(input)) !== null) {
      const value = match[1].replace(/[`'"]/g, '')
      if (value && !seen.has(value)) {
        seen.add(value)
        entities.push({ type: 'function', value })
      }
    }
  }

  return entities
}

function classifyIntent(input: string): { intent: IntentType; confidence: number } {
  const trimmed = input.trim().toLowerCase()
  const bestMatch: { intent: IntentType; confidence: number } = { intent: 'unknown', confidence: 0 }

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intent === 'unknown') continue

    for (const pattern of patterns) {
      if (pattern.test(trimmed)) {
        const matchLen = trimmed.match(pattern)?.[0]?.length || 0
        const confidence = Math.min(matchLen / trimmed.length, 1) * 0.5 + 0.3
        if (confidence > bestMatch.confidence) {
          bestMatch.intent = intent as IntentType
          bestMatch.confidence = confidence
        }
      }
    }
  }

  return bestMatch
}

function buildEnhancedPrompt(input: string, intent: IntentType, entities: ExtractedEntity[]): string {
  const intentDescriptions: Record<IntentType, string> = {
    summarize: 'Provide a clear, concise summary of the key points.',
    fix: 'Identify the root cause and propose a specific, actionable fix.',
    create: 'Generate production-ready code following best practices.',
    explain: 'Provide a thorough yet accessible explanation suitable for the user.',

    test: 'Write or analyze test coverage, focusing on edge cases and reliability.',
    debug: 'Trace through the logic systematically and identify the specific issue.',
    search: 'Search the codebase thoroughly and return relevant results.',
    review: 'Review the code for quality, security, and performance issues.',
    refactor: 'Suggest concrete improvements with clear before/after examples.',
    unknown: 'Analyze the request and provide the best possible response.',
  }

  const entityContext = entities.length > 0
    ? `\n\nRelevant entities detected:\n${entities.map((e) => `  - ${e.type}: ${e.value}`).join('\n')}`
    : ''

  const enhanced = `[INTENT: ${intent.toUpperCase()}]
[INTENT GUIDANCE: ${intentDescriptions[intent]}]
[USER REQUEST]: ${input}${entityContext}

Process this request according to the detected intent. If the request involves files or code, use your tools to read the relevant files before responding.`

  return enhanced
}

export function analyzeIntent(input: string): IntentResult {
  const trimmed = input.trim()
  const { intent, confidence } = classifyIntent(trimmed)
  const entities = extractEntities(trimmed)
  const enhancedPrompt = buildEnhancedPrompt(trimmed, intent, entities)

  logger.info(`Intent analysis: ${intent} (confidence: ${confidence.toFixed(2)})`)

  if (entities.length > 0) {
    logger.info(`Extracted entities: ${entities.map((e) => `${e.type}=${e.value}`).join(', ')}`)
  }

  return {
    intent,
    confidence,
    entities,
    enhancedPrompt,
  }
}
