export interface ToolInput {
  [key: string]: string | number | boolean | undefined
}

export interface ToolResult {
  success: boolean
  output: string
  error?: string
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, { type: string; description: string; required: boolean }>
  requiresPermission: boolean
  permissionPattern?: string
  execute: (input: ToolInput) => Promise<ToolResult>
}
