import { ToolDefinition, ToolInput, ToolResult } from './types.js'
import { ToolCreator } from './tool-creator.js'
import { getProvider } from '../../ai/config.js'

export const createToolTool: ToolDefinition = {
  name: 'create_tool',
  description: 'Create a new tool dynamically based on a requirement. Used when no existing tool can fulfill the request.',
  parameters: {
    requirement: {
      type: 'string',
      description: 'Description of what the tool should do. Be specific about inputs, outputs, and behavior.',
      required: true,
    },
    source: {
      type: 'string',
      description: 'How the tool was requested: "auto" (agent detected gap) or "manual" (user requested)',
      required: false,
    },
  },
  requiresPermission: true,
  permissionPattern: 'create_tool',
  execute: async (input: ToolInput): Promise<ToolResult> => {
    const requirement = input.requirement as string
    if (!requirement) {
      return { success: false, output: '', error: 'Requirement is required' }
    }

    try {
      const provider = getProvider()
      const creator = new ToolCreator(provider)

      const result = await creator.createToolFromRequirement(
        requirement,
        (input.source as string) === 'manual' ? 'manual' : 'auto',
      )

      if (result.success) {
        return {
          success: true,
          output: `✅ Created restart-ready tool: ${result.toolName}\n\n📋 Metadata:\n- Name: ${result.metadata.name}\n- Description: ${result.metadata.description}\n- Parameters: ${Object.keys(result.metadata.parameters).join(', ')}\n- Requires Permission: ${result.metadata.requiresPermission}\n- Status: ${result.metadata.status}\n\n📁 Source: ${result.metadata.sourcePath}\n📦 Compiled: ${result.metadata.compiledPath}\n\nRestart Spectre to link this tool into the agent runtime.`,
        }
      }

      return {
        success: false,
        output: `❌ Failed to create tool\n\nError: ${result.error}\n\nGenerated code:\n${result.code.substring(0, 500)}...`,
        error: result.error,
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Tool creation failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  },
}
