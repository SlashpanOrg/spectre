import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PermissionManager } from '../../src/agent/permissions.js'
import { existsSync, rmSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('PermissionManager', () => {
  let testDir: string
  let manager: PermissionManager

  beforeEach(() => {
    testDir = join(tmpdir(), `spectre-perm-test-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    process.chdir(testDir)
    manager = new PermissionManager(testDir)
  })

  afterEach(() => {
    manager.clearPermissions()
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should start with no permissions', () => {
    expect(manager.getAllPermissions()).toHaveLength(0)
  })

  it('should grant a once permission (not persisted)', () => {
    const perm = manager.grantPermission('write_file', 'test.txt', 'once')
    expect(perm.level).toBe('once')
    expect(perm.tool).toBe('write_file')
    expect(manager.getAllPermissions()).toHaveLength(0)
  })

  it('should grant an always permission', () => {
    manager.grantPermission('write_file', 'test.txt', 'always')
    const perms = manager.getAllPermissions()
    expect(perms).toHaveLength(1)
    expect(perms[0].level).toBe('always')
  })

  it('should check and find always permission', () => {
    manager.grantPermission('write_file', 'test.txt', 'always')
    const found = manager.checkPermission('write_file', 'test.txt')
    expect(found).not.toBeNull()
    expect(found?.level).toBe('always')
  })

  it('should not find once permission on check', () => {
    manager.grantPermission('write_file', 'test.txt', 'once')
    const found = manager.checkPermission('write_file', 'test.txt')
    expect(found).toBeNull()
  })

  it('should decline a permission', () => {
    const perm = manager.declinePermission('run_command', 'rm -rf')
    expect(perm.level).toBe('declined')
    expect(manager.getAllPermissions()).toHaveLength(1)
  })

  it('should revoke a permission by id', () => {
    const perm = manager.grantPermission('write_file', 'test.txt', 'always')
    expect(manager.revokePermission(perm.id)).toBe(true)
    expect(manager.getAllPermissions()).toHaveLength(0)
  })

  it('should return false when revoking non-existent permission', () => {
    expect(manager.revokePermission('non-existent')).toBe(false)
  })

  it('should clear all permissions', () => {
    manager.grantPermission('write_file', 'file1.txt', 'always')
    manager.grantPermission('write_file', 'file2.txt', 'always')
    expect(manager.getAllPermissions()).toHaveLength(2)

    manager.clearPermissions()
    expect(manager.getAllPermissions()).toHaveLength(0)
  })

  it('should update use count on check', () => {
    manager.grantPermission('write_file', 'test.txt', 'always')
    manager.checkPermission('write_file', 'test.txt')
    manager.checkPermission('write_file', 'test.txt')

    const perms = manager.getAllPermissions()
    expect(perms[0].useCount).toBe(3)
  })
})
