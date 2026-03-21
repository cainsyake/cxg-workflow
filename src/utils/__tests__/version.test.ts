import { describe, expect, it } from 'vitest'
import { compareVersions, getCurrentVersion } from '../version'

describe('version utils', () => {
  it('compareVersions identifies newer versions', () => {
    expect(compareVersions('1.2.3', '1.2.2')).toBe(1)
    expect(compareVersions('1.2.2', '1.2.3')).toBe(-1)
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0)
  })

  it('compareVersions treats missing segments as zero', () => {
    expect(compareVersions('1.7', '1.7.0')).toBe(0)
    expect(compareVersions('1.7.1', '1.7')).toBe(1)
    expect(compareVersions('1.7', '1.7.1')).toBe(-1)
  })

  it('getCurrentVersion returns a semantic version string', async () => {
    const version = await getCurrentVersion()
    expect(version).toMatch(/^\d+\.\d+\.\d+/)
  })
})
