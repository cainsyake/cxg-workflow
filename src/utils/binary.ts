import type { BinarySource } from './constants'
import ansis from 'ansis'
import fs from 'fs-extra'
import { createHash } from 'node:crypto'
import { basename, join } from 'pathe'
import {
  BINARY_DOWNLOAD_RETRY_ATTEMPTS,
  BINARY_RELEASE_URL,
  BINARY_SOURCES,
} from './constants'
import { isWindows } from './platform'

export type BinaryChecksumStatus = 'verified' | 'missing' | 'failed' | 'skipped'

export interface BinaryDownloadResult {
  success: boolean
  sourceName?: string
  attempts: number
  checksumStatus: BinaryChecksumStatus
  error?: string
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Resolve platform-specific binary name for codeagent-wrapper.
 */
export function resolveBinaryName(): string {
  const platform = process.platform
  const arch = process.arch

  if (platform === 'darwin') {
    return arch === 'arm64' ? 'codeagent-wrapper-darwin-arm64' : 'codeagent-wrapper-darwin-amd64'
  }
  if (platform === 'linux') {
    return arch === 'arm64' ? 'codeagent-wrapper-linux-arm64' : 'codeagent-wrapper-linux-amd64'
  }
  if (platform === 'win32') {
    return arch === 'arm64' ? 'codeagent-wrapper-windows-arm64.exe' : 'codeagent-wrapper-windows-amd64.exe'
  }

  throw new Error(`Unsupported platform: ${platform}/${arch}`)
}

function normalizeChecksum(content: string): string | null {
  const hash = content.trim().split(/\s+/)[0]?.toLowerCase()
  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
    return null
  }
  return hash
}

async function fetchChecksum(binaryUrl: string, timeoutMs: number): Promise<string | null> {
  const checksumUrl = `${binaryUrl}.sha256`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(checksumUrl, { redirect: 'follow', signal: controller.signal })
    if (!response.ok) {
      return null
    }
    const text = await response.text()
    return normalizeChecksum(text)
  }
  catch {
    return null
  }
  finally {
    clearTimeout(timer)
  }
}

/**
 * Verify binary checksum with SHA-256.
 */
export async function verifyBinaryChecksum(binaryPath: string, expectedSha256: string): Promise<boolean> {
  try {
    const buffer = await fs.readFile(binaryPath)
    const actual = createHash('sha256').update(buffer).digest('hex')
    return actual.toLowerCase() === expectedSha256.toLowerCase()
  }
  catch {
    return false
  }
}

async function downloadFromUrl(
  source: BinarySource,
  binaryName: string,
  destPath: string,
  maxAttempts = BINARY_DOWNLOAD_RETRY_ATTEMPTS,
): Promise<BinaryDownloadResult> {
  const binaryUrl = `${source.url}/${binaryName}`
  const tempPath = `${destPath}.download`
  let lastError = ''

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), source.timeoutMs)

    try {
      const response = await fetch(binaryUrl, { redirect: 'follow', signal: controller.signal })
      if (!response.ok) {
        lastError = `HTTP ${response.status}`
        if (attempt < maxAttempts) {
          await sleep(attempt * 1500)
          continue
        }
        return {
          success: false,
          attempts: attempt,
          checksumStatus: 'skipped',
          error: `${source.name}: ${lastError}`,
        }
      }

      const buffer = Buffer.from(await response.arrayBuffer())
      await fs.writeFile(tempPath, buffer)

      let checksumStatus: BinaryChecksumStatus = 'skipped'
      const expectedChecksum = await fetchChecksum(binaryUrl, source.timeoutMs)
      if (expectedChecksum) {
        const checksumOk = await verifyBinaryChecksum(tempPath, expectedChecksum)
        if (!checksumOk) {
          checksumStatus = 'failed'
          await fs.remove(tempPath)
          lastError = `${source.name}: checksum mismatch`
          if (attempt < maxAttempts) {
            await sleep(attempt * 1500)
            continue
          }
          return {
            success: false,
            attempts: attempt,
            checksumStatus,
            error: lastError,
          }
        }
        checksumStatus = 'verified'
      }
      else {
        checksumStatus = 'missing'
      }

      await fs.move(tempPath, destPath, { overwrite: true })
      if (!isWindows()) {
        await fs.chmod(destPath, 0o755)
      }

      return {
        success: true,
        sourceName: source.name,
        attempts: attempt,
        checksumStatus,
      }
    }
    catch (error) {
      lastError = `${source.name}: ${String(error)}`
      await fs.remove(tempPath).catch(() => {})
      if (attempt < maxAttempts) {
        await sleep(attempt * 1500)
        continue
      }
      return {
        success: false,
        attempts: attempt,
        checksumStatus: 'skipped',
        error: lastError,
      }
    }
    finally {
      clearTimeout(timer)
    }
  }

  return {
    success: false,
    attempts: maxAttempts,
    checksumStatus: 'skipped',
    error: lastError || 'Unknown download error',
  }
}

/**
 * Download codeagent-wrapper binary with dual-source fallback and retry.
 */
export async function downloadBinary(
  binaryName: string,
  destPath: string,
  options?: {
    sources?: BinarySource[]
    retryAttempts?: number
  },
): Promise<BinaryDownloadResult> {
  const sources = options?.sources || BINARY_SOURCES
  const retryAttempts = options?.retryAttempts || BINARY_DOWNLOAD_RETRY_ATTEMPTS

  const errors: string[] = []
  let totalAttempts = 0

  for (const source of sources) {
    const result = await downloadFromUrl(source, binaryName, destPath, retryAttempts)
    totalAttempts += result.attempts
    if (result.success) {
      return {
        ...result,
        attempts: totalAttempts,
      }
    }
    if (result.error) {
      errors.push(result.error)
    }
  }

  return {
    success: false,
    attempts: totalAttempts,
    checksumStatus: 'skipped',
    error: errors.join(' | ') || 'Failed to download binary from all sources',
  }
}

/**
 * Verify binary installation by running --version.
 */
export async function verifyBinary(binaryPath: string): Promise<boolean> {
  try {
    const { execSync } = await import('node:child_process')
    execSync(`"${binaryPath}" --version`, { stdio: 'pipe' })
    return true
  }
  catch {
    return false
  }
}

export function showBinaryDownloadWarning(binDir: string): void {
  const binaryExt = isWindows() ? '.exe' : ''
  let binaryFileName = 'codeagent-wrapper-<platform>'

  try {
    binaryFileName = resolveBinaryName()
  }
  catch {
    // Keep fallback name for unsupported platforms.
  }

  const destFileName = `codeagent-wrapper${binaryExt}`
  const destination = isWindows()
    ? `${binDir.replace(/\//g, '\\')}\\${destFileName}`
    : join(binDir, destFileName)

  console.log()
  console.log(ansis.red.bold('  ╔════════════════════════════════════════════════════════════╗'))
  console.log(ansis.red.bold('  ║  ⚠ codeagent-wrapper 下载失败                              ║'))
  console.log(ansis.red.bold('  ║    Binary download failed                                  ║'))
  console.log(ansis.red.bold('  ╚════════════════════════════════════════════════════════════╝'))
  console.log()
  console.log(ansis.yellow('  这会影响子进程编排能力，请按以下步骤手动修复：'))
  console.log(ansis.cyan(`  1) 下载: ${BINARY_RELEASE_URL}`))
  console.log(ansis.gray(`     文件名: ${binaryFileName}`))
  console.log(ansis.cyan(`  2) 放置到: ${destination}`))
  if (!isWindows()) {
    console.log(ansis.cyan(`  3) 授权执行: chmod +x "${destination}"`))
  }
  console.log(ansis.gray(`  4) 验证: ${join(binDir, basename(destFileName))} --version`))
  console.log()
}
