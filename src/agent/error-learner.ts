import { MemoryManager } from './memory.js'
import { analyzeError, getRecoverySuggestions, ErrorAnalysis } from '../utils/error-patterns.js'
import { logger } from '../utils/logger.js'

export interface Skill {
  id: string
  name: string
  description: string
  triggerPattern: string
  solution: string
  category: string
  createdAt: number
  lastUsed: number
  useCount: number
}

export class ErrorLearner {
  private memoryManager: MemoryManager
  private skills: Skill[] = []

  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager
    this.loadSkills()
  }

  private async loadSkills(): Promise<void> {
    try {
      const skillsContent = await this.memoryManager.get('skills')
      const skillMatches = skillsContent.match(/## Skill:\s*(.+?)\n([\s\S]*?)(?=## Skill:|$)/g)

      if (skillMatches) {
        for (const match of skillMatches) {
          const nameMatch = match.match(/## Skill:\s*(.+?)\n/)
          const descMatch = match.match(/Description:\s*(.+?)\n/)
          const triggerMatch = match.match(/Trigger:\s*(.+?)\n/)
          const solutionMatch = match.match(/Solution:\s*([\s\S]*?)(?=\n\n|$)/)
          const categoryMatch = match.match(/Category:\s*(.+?)\n/)

          if (nameMatch && descMatch && triggerMatch && solutionMatch) {
            this.skills.push({
              id: `skill-${nameMatch[1].toLowerCase().replace(/\s+/g, '-')}`,
              name: nameMatch[1].trim(),
              description: descMatch[1].trim(),
              triggerPattern: triggerMatch[1].trim(),
              solution: solutionMatch[1].trim(),
              category: categoryMatch?.[1].trim() || 'unknown',
              createdAt: Date.now(),
              lastUsed: Date.now(),
              useCount: 0,
            })
          }
        }
      }
    } catch (error) {
      logger.warn(`Failed to load skills: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async handleError(error: string): Promise<{ recovery: string; skill?: Skill }> {
    const analysis = analyzeError(error)

    const matchingSkill = this.findMatchingSkill(error)
    if (matchingSkill) {
      matchingSkill.useCount++
      matchingSkill.lastUsed = Date.now()
      logger.info(`Applied skill "${matchingSkill.name}" to handle error`)
      return {
        recovery: matchingSkill.solution,
        skill: matchingSkill,
      }
    }

    const suggestions = getRecoverySuggestions(analysis.category)

    if (analysis.shouldCreateSkill) {
      const skill = await this.createSkillFromError(analysis, error)
      return {
        recovery: `Created new skill: ${skill.name}. ${skill.solution}`,
        skill,
      }
    }

    return {
      recovery: `Error analysis: ${analysis.category} error.\nSuggestions:\n${suggestions.map((s) => `- ${s}`).join('\n')}`,
    }
  }

  private findMatchingSkill(error: string): Skill | null {
    const lowerError = error.toLowerCase()

    for (const skill of this.skills) {
      const lowerTrigger = skill.triggerPattern.toLowerCase()
      if (lowerError.includes(lowerTrigger) || lowerTrigger.includes(lowerError.substring(0, 50))) {
        return skill
      }
    }

    return null
  }

  private async createSkillFromError(analysis: ErrorAnalysis, error: string): Promise<Skill> {
    const skillName = `Handle ${analysis.category} error`
    const skillId = `skill-${analysis.category}-${Date.now()}`

    const skill: Skill = {
      id: skillId,
      name: skillName,
      description: `Automatically created skill for recurring ${analysis.category} error`,
      triggerPattern: error.substring(0, 100),
      solution: analysis.suggestedRecovery,
      category: analysis.category,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 1,
    }

    this.skills.push(skill)

    const skillEntry = `
## Skill: ${skillName}
Description: ${skill.description}
Trigger: ${skill.triggerPattern}
Category: ${skill.category}
Solution:
${skill.solution}
`

    await this.memoryManager.append('skills', skillEntry)

    const diaryEntry = `
### Error Learning Event
Error: ${error.substring(0, 200)}
Category: ${analysis.category}
Action: Created skill "${skillName}"
`

    await this.memoryManager.appendDiaryEntry(diaryEntry)

    logger.info(`Created new skill: ${skillName}`)
    return skill
  }

  async addSkill(skill: Omit<Skill, 'id' | 'createdAt' | 'lastUsed' | 'useCount'>): Promise<Skill> {
    const newSkill: Skill = {
      ...skill,
      id: `skill-${skill.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 0,
    }

    this.skills.push(newSkill)

    const skillEntry = `
## Skill: ${newSkill.name}
Description: ${newSkill.description}
Trigger: ${newSkill.triggerPattern}
Category: ${newSkill.category}
Solution:
${newSkill.solution}
`

    await this.memoryManager.append('skills', skillEntry)
    return newSkill
  }

  getSkills(): Skill[] {
    return [...this.skills]
  }

  getSkillsByCategory(category: string): Skill[] {
    return this.skills.filter((s) => s.category === category)
  }

  async removeSkill(skillId: string): Promise<boolean> {
    const index = this.skills.findIndex((s) => s.id === skillId)
    if (index >= 0) {
      this.skills.splice(index, 1)
      const currentSkills = await this.memoryManager.get('skills')
      const skillToRemove = this.skills.find((s) => s.id === skillId)
      if (skillToRemove) {
        const updated = currentSkills.replace(
          new RegExp(`## Skill: ${skillToRemove.name}[\\s\\S]*?(?=## Skill:|$)`, 'g'),
          '',
        )
        await this.memoryManager.update('skills', updated)
      }
      return true
    }
    return false
  }

  async recordLesson(title: string, content: string): Promise<void> {
    const entry = `
### ${title}
${content}
`
    await this.memoryManager.appendDiaryEntry(entry)
  }
}
