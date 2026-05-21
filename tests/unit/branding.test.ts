import { describe, it, expect } from 'vitest'
import {
  TOOL_NAME,
  TAGLINE,
  BUILT_BY,
  CONTACT_EMAIL,
  GITHUB_URL,
  WELCOME_MESSAGE,
  HELP_MESSAGE,
  VERSION,
} from '../../src/utils/branding.js'

describe('Branding', () => {
  it('should export correct constants', () => {
    expect(TOOL_NAME).toBe('SPECTRE')
    expect(TAGLINE).toBe('AI Development Intelligence Agent')
    expect(BUILT_BY).toBe('Built by Slashpan Technologies Private Limited')
    expect(CONTACT_EMAIL).toBe('sp@slashpan.com')
    expect(GITHUB_URL).toBe('https://github.com/SlashpanOrg/spectre')
    expect(VERSION).toBe('0.5.0')
  })

  it('should generate welcome message with all branding', () => {
    expect(WELCOME_MESSAGE).toContain('AI Development Intelligence Agent')
    expect(WELCOME_MESSAGE).toContain('Slashpan Technologies Private Limited')
    expect(WELCOME_MESSAGE).toContain('sp@slashpan.com')
    expect(WELCOME_MESSAGE).toContain('github.com/SlashpanOrg/spectre')
  })

  it('should include ASCII art in welcome message', () => {
    expect(WELCOME_MESSAGE).toContain('██')
    expect(WELCOME_MESSAGE).toContain('v0.5.0')
  })

  it('should generate help message with commands', () => {
    expect(HELP_MESSAGE).toContain('/help')
    expect(HELP_MESSAGE).toContain('/setup')
    expect(HELP_MESSAGE).toContain('/model')
    expect(HELP_MESSAGE).toContain('/index')
    expect(HELP_MESSAGE).toContain('/query')
    expect(HELP_MESSAGE).toContain('/quit')
  })
})
