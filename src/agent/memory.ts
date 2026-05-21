import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs'
import { join } from 'path'
import { logger } from '../utils/logger.js'

export interface MemoryFile {
  name: string
  content: string
  lastModified: number
  size: number
}

export interface MemoryStore {
  soul: string
  identity: string
  information: string
  permission: string
  diary: string
  skills: string
}

const MEMORY_FILES: (keyof MemoryStore)[] = [
  'soul',
  'identity',
  'information',
  'permission',
  'diary',
  'skills',
]

const DEFAULT_CONTENTS: MemoryStore = {
  soul: `# SOUL.MD - Agent Personality

## Communication Style
- Be concise and direct
- Explain actions before executing them
- Show diffs before making changes
- Ask for clarification when requests are ambiguous

## Values
- Quality over speed
- Read before writing
- Test before committing
- Respect user permissions
`,
  identity: `# IDENTITY.MD - Agent Identity

## Role
I am Spectre, a coding agent that helps developers with codebase analysis, file operations, and development tasks.

## Capabilities
- Read, write, and edit files
- Search and list project files
- Run commands and tests
- Debug code issues
- Index and query codebases
- Review pull requests
- Analyze technical debt
- Generate documentation

## Limitations
- I cannot access files outside the project directory
- I require permission for destructive operations
- I work within the context window limits of my model
`,
  information: `# INFORMATION.MD - Project Knowledge

## Project Structure
(Will be populated as I learn about the project)

## Key Architecture Decisions
(Will be populated during conversations)

## Important Patterns
(Will be populated during conversations)
`,
  permission: `# PERMISSION.MD - Active Permissions

## Trust Levels
- File reads: Always allowed
- File writes: Requires permission
- Command execution: Requires permission
- Destructive operations: Requires explicit permission

## Permission History
(Will be populated as permissions are granted)
`,
  diary: `# DIARY.MD - Interaction History

## Session Log
(Will be populated with session summaries)

## Lessons Learned
(Will be populated during conversations)

## User Preferences
(Will be populated as I learn preferences)
`,
  skills: `# SKILLS.MD - Capabilities & Learned Patterns

## Core Skills
- File manipulation (read, write, edit)
- Code search and analysis
- Command execution
- Test running
- Debugging

## Learned Patterns
(Will be populated as I discover project-specific patterns)
`,
}

export class MemoryManager {
  private memoryDir: string
  private cache: MemoryStore | null = null

  constructor(projectDir: string = process.cwd()) {
    const projectHash = projectDir.replace(/[^a-zA-Z0-9]/g, '_').slice(-32)
    this.memoryDir = join(process.env.HOME || '~', '.spectre', 'memory', projectHash)
    this.ensureMemoryDir()
  }

  private ensureMemoryDir(): void {
    if (!existsSync(this.memoryDir)) {
      mkdirSync(this.memoryDir, { recursive: true, mode: 0o700 })
    }

    for (const file of MEMORY_FILES) {
      const filePath = this.getFilePath(file)
      if (!existsSync(filePath)) {
        writeFileSync(filePath, DEFAULT_CONTENTS[file], { mode: 0o600 })
      }
    }
  }

  private getFilePath(name: keyof MemoryStore): string {
    return join(this.memoryDir, `${name.toUpperCase()}.md`)
  }

  async load(): Promise<MemoryStore> {
    if (this.cache) return this.cache

    const store: Partial<MemoryStore> = {}

    for (const file of MEMORY_FILES) {
      const filePath = this.getFilePath(file)
      try {
        if (existsSync(filePath)) {
          store[file] = readFileSync(filePath, 'utf-8')
        } else {
          store[file] = DEFAULT_CONTENTS[file]
        }
      } catch (error) {
        logger.warn(`Failed to load memory file ${file}: ${error instanceof Error ? error.message : String(error)}`)
        store[file] = DEFAULT_CONTENTS[file]
      }
    }

    this.cache = store as MemoryStore
    return this.cache
  }

  async save(store: MemoryStore): Promise<void> {
    for (const file of MEMORY_FILES) {
      const filePath = this.getFilePath(file)
      try {
        writeFileSync(filePath, store[file], { mode: 0o600 })
      } catch (error) {
        logger.warn(`Failed to save memory file ${file}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    this.cache = store
  }

  async get(name: keyof MemoryStore): Promise<string> {
    const filePath = this.getFilePath(name)
    if (existsSync(filePath)) {
      return readFileSync(filePath, 'utf-8')
    }
    return DEFAULT_CONTENTS[name]
  }

  async update(name: keyof MemoryStore, content: string): Promise<void> {
    const filePath = this.getFilePath(name)
    writeFileSync(filePath, content, { mode: 0o600 })
    if (this.cache) {
      this.cache[name] = content
    }
  }

  async append(name: keyof MemoryStore, content: string): Promise<void> {
    const current = await this.get(name)
    await this.update(name, `${current}\n${content}`)
  }

  async list(): Promise<MemoryFile[]> {
    const files: MemoryFile[] = []

    for (const file of MEMORY_FILES) {
      const filePath = this.getFilePath(file)
      if (existsSync(filePath)) {
        const stats = statSync(filePath)
        files.push({
          name: `${file.toUpperCase()}.md`,
          content: readFileSync(filePath, 'utf-8'),
          lastModified: stats.mtimeMs,
          size: stats.size,
        })
      }
    }

    return files
  }

  async getSystemPrompt(): Promise<string> {
    const store = await this.load()

    return `You are Spectre, a coding agent.

## Your Identity
${store.identity}

## Your Personality
${store.soul}

## Project Knowledge
${store.information}

## Your Skills
${store.skills}

## User Preferences (from diary)
${store.diary}

## Permission Guidelines
${store.permission}

Use this context to inform your responses. Be helpful, concise, and always respect permissions.`
  }

  async appendDiaryEntry(entry: string): Promise<void> {
    const timestamp = new Date().toISOString()
    await this.append('diary', `\n## ${timestamp}\n${entry}`)
  }

  async updateInformation(info: string): Promise<void> {
    const current = await this.get('information')
    if (!current.includes(info)) {
      await this.append('information', `\n${info}`)
    }
  }

  async addSkill(skill: string): Promise<void> {
    const current = await this.get('skills')
    if (!current.includes(skill)) {
      await this.append('skills', `\n- ${skill}`)
    }
  }

  getMemoryDir(): string {
    return this.memoryDir
  }

  clearCache(): void {
    this.cache = null
  }
}
