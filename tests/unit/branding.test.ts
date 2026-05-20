import { describe, it, expect } from 'vitest'
import { getWelcomeBanner, getVersionInfo, TOOL_NAME, TAGLINE, BUILT_BY, CONTACT_EMAIL, GITHUB_URL } from '../../src/utils/branding.js'

describe('Branding', () => {
  it('should export correct constants', () => {
    expect(TOOL_NAME).toBe('SPECTRE')
    expect(TAGLINE).toBe('AI Development Intelligence Agent')
    expect(BUILT_BY).toBe('Built by Slashpan Technologies Private Limited')
    expect(CONTACT_EMAIL).toBe('sp@slashpan.com')
    expect(GITHUB_URL).toBe('https://github.com/SlashpanOrg/spectre')
  })

  it('should generate welcome banner with all branding', () => {
    const banner = getWelcomeBanner()
    expect(banner).toContain('SPECTRE')
    expect(banner).toContain('AI Development Intelligence Agent')
    expect(banner).toContain('Slashpan Technologies Private Limited')
    expect(banner).toContain('sp@slashpan.com')
    expect(banner).toContain('github.com/SlashpanOrg/spectre')
  })

  it('should generate version info', () => {
    const info = getVersionInfo('1.2.3')
    expect(info).toContain('SPECTRE v1.2.3')
    expect(info).toContain('Slashpan Technologies Private Limited')
    expect(info).toContain('sp@slashpan.com')
  })
})
