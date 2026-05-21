import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ErrorLearner } from '../../src/agent/error-learner.js'
import { MemoryManager } from '../../src/agent/memory.js'
import { existsSync, rmSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('ErrorLearner', () => {
  let testDir: string
  let memoryManager: MemoryManager
  let errorLearner: ErrorLearner

  beforeEach(() => {
    testDir = join(tmpdir(), `spectre-error-learner-test-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    process.env.HOME = testDir
    memoryManager = new MemoryManager('/test/project')
    errorLearner = new ErrorLearner(memoryManager)
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should handle known model errors', async () => {
    const result = await errorLearner.handleError(
      '[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse: [404 Not Found] This model models/gemini-2.0-flash is no longer available to new users.',
    )

    expect(result.recovery).toBeDefined()
    expect(result.recovery).toContain('model')
  })

  it('should handle interaction-only model errors', async () => {
    const result = await errorLearner.handleError(
      '[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/deep-research-max-preview-04-2026:streamGenerateContent?alt=sse: [400 Bad Request] This model only supports Interactions API.',
    )

    expect(result.recovery).toBeDefined()
    expect(result.recovery).toContain('model')
  })

  it('should handle clarification handler errors', async () => {
    const result = await errorLearner.handleError('No clarification handler available')

    expect(result.recovery).toBeDefined()
    expect(result.recovery).toContain('clarification')
  })

  it('should handle unknown errors', async () => {
    const result = await errorLearner.handleError('Some completely unknown error xyz123')

    expect(result.recovery).toBeDefined()
    expect(result.recovery).toContain('unknown')
  })

  it('should add custom skills', async () => {
    const skill = await errorLearner.addSkill({
      name: 'Handle network timeout',
      description: 'Retry with exponential backoff',
      triggerPattern: 'ETIMEDOUT',
      solution: 'Wait 5 seconds and retry',
      category: 'network',
    })

    expect(skill.id).toBeDefined()
    expect(skill.name).toBe('Handle network timeout')

    const skills = errorLearner.getSkills()
    expect(skills.some((s) => s.name === 'Handle network timeout')).toBe(true)
  })

  it('should find matching skill for error', async () => {
    await errorLearner.addSkill({
      name: 'Handle 404 errors',
      description: 'Model not found',
      triggerPattern: '404',
      solution: 'Try a different model',
      category: 'model',
    })

    const result = await errorLearner.handleError('Error: 404 Not Found for model xyz')
    expect(result.skill).toBeDefined()
    expect(result.skill?.name).toBe('Handle 404 errors')
  })

  it('should remove skills', async () => {
    const skill = await errorLearner.addSkill({
      name: 'Temporary skill',
      description: 'Test',
      triggerPattern: 'test',
      solution: 'Test solution',
      category: 'unknown',
    })

    const removed = await errorLearner.removeSkill(skill.id)
    expect(removed).toBe(true)

    const skills = errorLearner.getSkills()
    expect(skills.some((s) => s.id === skill.id)).toBe(false)
  })

  it('should record lessons in diary', async () => {
    await errorLearner.recordLesson('Test Lesson', 'This is a test lesson')

    const diary = await memoryManager.get('diary')
    expect(diary).toContain('Test Lesson')
    expect(diary).toContain('This is a test lesson')
  })

  it('should get skills by category', async () => {
    await errorLearner.addSkill({
      name: 'Model skill 1',
      description: 'Test',
      triggerPattern: 'model1',
      solution: 'Solution 1',
      category: 'model',
    })

    await errorLearner.addSkill({
      name: 'Network skill 1',
      description: 'Test',
      triggerPattern: 'network1',
      solution: 'Solution 2',
      category: 'network',
    })

    const modelSkills = errorLearner.getSkillsByCategory('model')
    expect(modelSkills).toHaveLength(1)
    expect(modelSkills[0].category).toBe('model')
  })
})
