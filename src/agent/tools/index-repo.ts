import { ToolDefinition, ToolInput, ToolResult } from './types.js'
import { GitScanner } from '../../tools/indexer.js'

export const indexRepoTool: ToolDefinition = {
  name: 'index_repo',
  description: 'Index a Git repository for codebase analysis',
  parameters: {
    path: { type: 'string', description: 'Path to the Git repository (default: current directory)', required: false },
  },
  requiresPermission: false,
  execute: async (input: ToolInput): Promise<ToolResult> => {
    const repoPath = (input.path as string) || '.'

    try {
      const scanner = new GitScanner(repoPath)
      const isRepo = await scanner.isGitRepo()

      if (!isRepo) {
        return { success: false, output: '', error: `Not a Git repository: ${repoPath}` }
      }

      const branch = await scanner.getCurrentBranch()
      const commitCount = await scanner.getCommitCount()

      return {
        success: true,
        output: `📁 Repository: ${repoPath}\n🌿 Branch: ${branch}\n📊 Commits: ${commitCount}\n\nRepository is ready for indexing.`,
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to index repository: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
}
