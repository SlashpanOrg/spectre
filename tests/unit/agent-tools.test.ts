import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileTool } from '../../src/agent/tools/read-file.js'
import { writeFileTool } from '../../src/agent/tools/write-file.js'
import { editFileTool } from '../../src/agent/tools/edit-file.js'
import { listFilesTool } from '../../src/agent/tools/list-files.js'
import { searchFilesTool } from '../../src/agent/tools/search-files.js'
import { ToolRegistry } from '../../src/agent/tools/registry.js'
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('Agent Tools', () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `spectre-test-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    process.chdir(testDir)
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('readFileTool', () => {
    it('should read an existing file', async () => {
      const filePath = join(testDir, 'test.txt')
      writeFileSync(filePath, 'Hello, world!')

      const result = await readFileTool.execute({ path: 'test.txt' })
      expect(result.success).toBe(true)
      expect(result.output).toContain('Hello, world!')
    })

    it('should return error for non-existent file', async () => {
      const result = await readFileTool.execute({ path: 'nonexistent.txt' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should respect start_line and end_line parameters', async () => {
      const filePath = join(testDir, 'long.txt')
      const content = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`).join('\n')
      writeFileSync(filePath, content)

      const result = await readFileTool.execute({ path: 'long.txt', start_line: 1, end_line: 10 })
      expect(result.success).toBe(true)
      const lines = result.output.split('\n').filter((l) => l.includes('Line'))
      expect(lines.length).toBeLessThanOrEqual(10)
    })
  })

  describe('writeFileTool', () => {
    it('should write content to a new file', async () => {
      const result = await writeFileTool.execute({ path: 'new.txt', content: 'New content' })
      expect(result.success).toBe(true)
      expect(existsSync(join(testDir, 'new.txt'))).toBe(true)
      expect(readFileSync(join(testDir, 'new.txt'), 'utf-8')).toBe('New content')
    })

    it('should overwrite existing file', async () => {
      const filePath = join(testDir, 'existing.txt')
      writeFileSync(filePath, 'Old content')

      const result = await writeFileTool.execute({ path: 'existing.txt', content: 'New content' })
      expect(result.success).toBe(true)
      expect(readFileSync(filePath, 'utf-8')).toBe('New content')
    })

    it('should require content parameter', async () => {
      const result = await writeFileTool.execute({ path: 'test.txt' })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Content is required')
    })
  })

  describe('editFileTool', () => {
    beforeEach(() => {
      writeFileSync(join(testDir, 'edit.txt'), 'Line 1\nLine 2\nLine 3\n')
    })

    it('should replace text in a file', async () => {
      const result = await editFileTool.execute({
        path: 'edit.txt',
        operation: 'replace',
        search: 'Line 2',
        replacement: 'Replaced',
      })
      expect(result.success).toBe(true)
      expect(readFileSync(join(testDir, 'edit.txt'), 'utf-8')).toBe('Line 1\nReplaced\nLine 3\n')
    })

    it('should insert text at a line number', async () => {
      const result = await editFileTool.execute({
        path: 'edit.txt',
        operation: 'insert',
        line_number: 2,
        replacement: 'Inserted',
      })
      expect(result.success).toBe(true)
      expect(readFileSync(join(testDir, 'edit.txt'), 'utf-8')).toBe('Line 1\nInserted\nLine 2\nLine 3\n')
    })

    it('should delete text by search', async () => {
      const result = await editFileTool.execute({
        path: 'edit.txt',
        operation: 'delete',
        search: 'Line 2',
      })
      expect(result.success).toBe(true)
      expect(readFileSync(join(testDir, 'edit.txt'), 'utf-8')).toBe('Line 1\n\nLine 3\n')
    })

    it('should return error for missing search text in replace', async () => {
      const result = await editFileTool.execute({
        path: 'edit.txt',
        operation: 'replace',
      })
      expect(result.success).toBe(false)
      expect(result.error).toContain('Search text is required')
    })
  })

  describe('listFilesTool', () => {
    beforeEach(() => {
      mkdirSync(join(testDir, 'subdir'))
      writeFileSync(join(testDir, 'file1.txt'), 'content')
      writeFileSync(join(testDir, 'file2.ts'), 'content')
      writeFileSync(join(testDir, 'subdir', 'file3.txt'), 'content')
    })

    it('should list directory contents', async () => {
      const result = await listFilesTool.execute({ path: '.' })
      expect(result.success).toBe(true)
      expect(result.output).toContain('file1.txt')
      expect(result.output).toContain('file2.ts')
      expect(result.output).toContain('subdir')
    })
  })

  describe('searchFilesTool', () => {
    beforeEach(() => {
      writeFileSync(join(testDir, 'search1.txt'), 'Hello world\nThis is a test')
      writeFileSync(join(testDir, 'search2.txt'), 'Another file\nHello there')
    })

    it('should find matching text across files', async () => {
      const result = await searchFilesTool.execute({ pattern: 'Hello' })
      expect(result.success).toBe(true)
      expect(result.output).toContain('Hello')
    })

    it('should return no matches for non-existent pattern', async () => {
      const result = await searchFilesTool.execute({ pattern: 'xyz123nonexistent' })
      expect(result.success).toBe(true)
      expect(result.output).toContain('No matches found')
    })
  })

  describe('ToolRegistry', () => {
    it('should register and retrieve tools', () => {
      const registry = new ToolRegistry()
      expect(registry.get('read_file')).toBeDefined()
      expect(registry.get('write_file')).toBeDefined()
      expect(registry.get('edit_file')).toBeDefined()
      expect(registry.get('list_files')).toBeDefined()
      expect(registry.get('search_files')).toBeDefined()
      expect(registry.get('run_command')).toBeDefined()
    })

    it('should return all tool names', () => {
      const registry = new ToolRegistry()
      const names = registry.getNames()
      expect(names.length).toBeGreaterThanOrEqual(7)
      expect(names).toContain('read_file')
      expect(names).toContain('write_file')
    })

    it('should execute a tool', async () => {
      const registry = new ToolRegistry()
      const result = await registry.execute('read_file', { path: 'nonexistent.txt' })
      expect(result.success).toBe(false)
    })

    it('should return error for unknown tool', async () => {
      const registry = new ToolRegistry()
      const result = await registry.execute('unknown_tool', {})
      expect(result.success).toBe(false)
      expect(result.error).toContain('Unknown tool')
    })
  })
})
