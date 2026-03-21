import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import fs from 'fs-extra'
import { join } from 'pathe'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  downloadBinary,
  showBinaryDownloadWarning,
  verifyBinary,
  verifyBinaryChecksum,
} from '../binary'

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(join(tmpdir(), 'cxg-binary-test-'))
}

describe('binary utils', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('falls back to secondary source when primary fails', async () => {
    const tempDir = await makeTempDir()
    const destPath = join(tempDir, 'codeagent-wrapper')
    const payload = Buffer.from('binary-from-mirror')

    const fetchMock = vi.fn(async (input: unknown) => {
      const url = String(input)
      if (url.startsWith('https://primary.test') && !url.endsWith('.sha256')) {
        return new Response('', { status: 500 })
      }
      if (url.startsWith('https://mirror.test') && url.endsWith('.sha256')) {
        return new Response('', { status: 404 })
      }
      if (url.startsWith('https://mirror.test')) {
        return new Response(payload, { status: 200 })
      }
      return new Response('', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await downloadBinary('codeagent-wrapper-linux-amd64', destPath, {
      sources: [
        { name: 'Primary', url: 'https://primary.test/preset', timeoutMs: 1_000 },
        { name: 'Mirror', url: 'https://mirror.test/preset', timeoutMs: 1_000 },
      ],
      retryAttempts: 1,
    })

    expect(result.success).toBe(true)
    expect(result.sourceName).toBe('Mirror')
    expect(result.checksumStatus).toBe('missing')
    expect(await fs.readFile(destPath, 'utf-8')).toBe('binary-from-mirror')
  })

  it('verifies checksum when sha256 sidecar exists', async () => {
    const tempDir = await makeTempDir()
    const destPath = join(tempDir, 'codeagent-wrapper')
    const payload = Buffer.from('binary-with-checksum')
    const checksum = createHash('sha256').update(payload).digest('hex')

    const fetchMock = vi.fn(async (input: unknown) => {
      const url = String(input)
      if (url.endsWith('.sha256')) {
        return new Response(`${checksum}  codeagent-wrapper-linux-amd64`, { status: 200 })
      }
      return new Response(payload, { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await downloadBinary('codeagent-wrapper-linux-amd64', destPath, {
      sources: [{ name: 'Only', url: 'https://single.test/preset', timeoutMs: 1_000 }],
      retryAttempts: 1,
    })

    expect(result.success).toBe(true)
    expect(result.checksumStatus).toBe('verified')
  })

  it('verifies checksum helper correctly', async () => {
    const tempDir = await makeTempDir()
    const binaryPath = join(tempDir, 'binary')
    const payload = Buffer.from('checksum-payload')
    const checksum = createHash('sha256').update(payload).digest('hex')

    await fs.writeFile(binaryPath, payload)

    expect(await verifyBinaryChecksum(binaryPath, checksum)).toBe(true)
    expect(await verifyBinaryChecksum(binaryPath, '0'.repeat(64))).toBe(false)
  })

  it('returns false when binary path does not exist', async () => {
    expect(await verifyBinary('/path/does/not/exist/codeagent-wrapper')).toBe(false)
  })

  it('renders binary download warning', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    showBinaryDownloadWarning('/tmp/cxg-bin')
    const output = logSpy.mock.calls.map(call => call.join(' ')).join('\n')
    expect(output).toContain('codeagent-wrapper 下载失败')
    expect(output).toContain('手动修复')
  })
})
