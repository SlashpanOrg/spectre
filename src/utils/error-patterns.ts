export interface ErrorPattern {
  id: string
  pattern: RegExp
  category: 'model' | 'tool' | 'permission' | 'network' | 'clarification' | 'unknown'
  description: string
  suggestedAction: string
  frequency: number
  lastSeen: number
}

export interface ErrorAnalysis {
  originalError: string
  category: ErrorPattern['category']
  matchedPattern: ErrorPattern | null
  isKnown: boolean
  suggestedRecovery: string
  shouldCreateSkill: boolean
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    id: 'model-400',
    pattern: /400.*Bad Request/i,
    category: 'model',
    description: 'Model returned 400 Bad Request — model may be unavailable or restricted',
    suggestedAction: 'Mark model as unavailable, suggest alternative',
    frequency: 0,
    lastSeen: 0,
  },
  {
    id: 'model-404',
    pattern: /404.*Not Found/i,
    category: 'model',
    description: 'Model not found — model may be deprecated or removed',
    suggestedAction: 'Mark model as unavailable, suggest alternative',
    frequency: 0,
    lastSeen: 0,
  },
  {
    id: 'model-403',
    pattern: /403.*Forbidden/i,
    category: 'model',
    description: 'Access forbidden — model may require special access',
    suggestedAction: 'Mark model as unavailable, check API key permissions',
    frequency: 0,
    lastSeen: 0,
  },
  {
    id: 'model-interaction-only',
    pattern: /only supports Interactions API/i,
    category: 'model',
    description: 'Model only supports Interactions API, not content generation',
    suggestedAction: 'Mark model as unavailable, suggest content-generation model',
    frequency: 0,
    lastSeen: 0,
  },
  {
    id: 'model-deprecated',
    pattern: /no longer available to new users|deprecated/i,
    category: 'model',
    description: 'Model is deprecated or no longer available',
    suggestedAction: 'Mark model as unavailable, suggest newer alternative',
    frequency: 0,
    lastSeen: 0,
  },
  {
    id: 'clarification-no-handler',
    pattern: /No clarification handler available/i,
    category: 'clarification',
    description: 'Agent needs clarification but no handler is configured',
    suggestedAction: 'Use clarification handler to prompt user',
    frequency: 0,
    lastSeen: 0,
  },
  {
    id: 'tool-unknown',
    pattern: /Unknown tool:/i,
    category: 'tool',
    description: 'Agent tried to use an unknown tool',
    suggestedAction: 'Check tool registry, suggest creating tool if needed',
    frequency: 0,
    lastSeen: 0,
  },
  {
    id: 'tool-permission-denied',
    pattern: /Permission denied|permission.*declined/i,
    category: 'permission',
    description: 'Tool execution denied by permission system',
    suggestedAction: 'Request permission from user',
    frequency: 0,
    lastSeen: 0,
  },
  {
    id: 'network-timeout',
    pattern: /timeout|ETIMEDOUT|ECONNREFUSED/i,
    category: 'network',
    description: 'Network connection failed or timed out',
    suggestedAction: 'Retry with backoff, check network connectivity',
    frequency: 0,
    lastSeen: 0,
  },
  {
    id: 'network-rate-limit',
    pattern: /429.*Too Many Requests|rate limit/i,
    category: 'network',
    description: 'API rate limit exceeded',
    suggestedAction: 'Wait and retry, reduce request frequency',
    frequency: 0,
    lastSeen: 0,
  },
]

export function analyzeError(error: string): ErrorAnalysis {
  const lowerError = error.toLowerCase()

  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(error)) {
      pattern.frequency++
      pattern.lastSeen = Date.now()
      return {
        originalError: error,
        category: pattern.category,
        matchedPattern: pattern,
        isKnown: true,
        suggestedRecovery: pattern.suggestedAction,
        shouldCreateSkill: pattern.frequency >= 3,
      }
    }
  }

  let category: ErrorPattern['category'] = 'unknown'
  if (lowerError.includes('model') || lowerError.includes('400') || lowerError.includes('404')) {
    category = 'model'
  } else if (lowerError.includes('tool')) {
    category = 'tool'
  } else if (lowerError.includes('permission')) {
    category = 'permission'
  } else if (lowerError.includes('network') || lowerError.includes('connection')) {
    category = 'network'
  }

  return {
    originalError: error,
    category,
    matchedPattern: null,
    isKnown: false,
    suggestedRecovery: `Unknown error in ${category} category. Analyze and create skill if recurring.`,
    shouldCreateSkill: false,
  }
}

export function getRecoverySuggestions(category: ErrorPattern['category']): string[] {
  const suggestions: Record<string, string[]> = {
    model: [
      'Try a different model from the same provider',
      'Check if the model requires special access',
      'Verify API key has access to this model',
      'Use model validator to check availability',
    ],
    tool: [
      'Check if the tool exists in the registry',
      'Consider creating a new tool for this requirement',
      'Verify tool parameters are correct',
    ],
    permission: [
      'Request permission from user',
      'Check permission settings for this tool',
      'Consider allowing always if this is a trusted operation',
    ],
    network: [
      'Retry the operation',
      'Check network connectivity',
      'Verify API endpoint is accessible',
      'Check for rate limiting',
    ],
    clarification: [
      'Use clarification handler to ask user',
      'Provide more context in the request',
      'Break down the request into smaller parts',
    ],
    unknown: [
      'Analyze the error message for patterns',
      'Check logs for more context',
      'Create a skill if this error recurs',
    ],
  }

  return suggestions[category] || suggestions.unknown
}

export function addCustomPattern(pattern: Omit<ErrorPattern, 'frequency' | 'lastSeen'>): void {
  ERROR_PATTERNS.push({
    ...pattern,
    frequency: 0,
    lastSeen: 0,
  })
}

export function getErrorPatterns(): ErrorPattern[] {
  return [...ERROR_PATTERNS]
}
