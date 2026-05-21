import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'

export interface Permission {
  id: string
  pattern: string
  tool: string
  level: 'once' | 'always' | 'declined'
  createdAt: number
  lastUsed?: number
  useCount: number
}

export interface PermissionStore {
  permissions: Permission[]
}

export class PermissionManager {
  private storePath: string
  private store: PermissionStore

  constructor(projectDir: string = process.cwd()) {
    const projectHash = createHash('md5').update(projectDir).digest('hex').slice(0, 8)
    const configDir = join(process.env.HOME || '~', '.spectre', 'projects', projectHash)

    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true, mode: 0o700 })
    }

    this.storePath = join(configDir, 'permissions.json')
    this.store = this.load()
  }

  private load(): PermissionStore {
    if (existsSync(this.storePath)) {
      try {
        const data = readFileSync(this.storePath, 'utf-8')
        return JSON.parse(data) as PermissionStore
      } catch {
        return { permissions: [] }
      }
    }
    return { permissions: [] }
  }

  private save(): void {
    writeFileSync(this.storePath, JSON.stringify(this.store, null, 2), {
      mode: 0o600,
    })
  }

  checkPermission(tool: string, pattern: string): Permission | null {
    const now = Date.now()
    const alwaysPerm = this.store.permissions.find(
      (p) => p.tool === tool && p.pattern === pattern && p.level === 'always',
    )

    if (alwaysPerm) {
      alwaysPerm.lastUsed = now
      alwaysPerm.useCount++
      this.save()
      return alwaysPerm
    }

    return null
  }

  grantPermission(tool: string, pattern: string, level: 'once' | 'always'): Permission {
    const permission: Permission = {
      id: `${tool}-${pattern}-${Date.now()}`,
      pattern,
      tool,
      level,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 1,
    }

    if (level === 'always') {
      const existing = this.store.permissions.findIndex(
        (p) => p.tool === tool && p.pattern === pattern,
      )
      if (existing >= 0) {
        this.store.permissions[existing] = permission
      } else {
        this.store.permissions.push(permission)
      }
    }

    this.save()
    return permission
  }

  declinePermission(tool: string, pattern: string): Permission {
    const permission: Permission = {
      id: `${tool}-${pattern}-${Date.now()}`,
      pattern,
      tool,
      level: 'declined',
      createdAt: Date.now(),
      useCount: 0,
    }

    this.store.permissions.push(permission)
    this.save()
    return permission
  }

  getAllPermissions(): Permission[] {
    return this.store.permissions
  }

  revokePermission(id: string): boolean {
    const index = this.store.permissions.findIndex((p) => p.id === id)
    if (index >= 0) {
      this.store.permissions.splice(index, 1)
      this.save()
      return true
    }
    return false
  }

  clearPermissions(): void {
    this.store.permissions = []
    this.save()
  }
}
