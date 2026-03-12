import fs from 'fs-extra'
import { BINARY_DOWNLOAD_URL } from './constants'
import { isWindows } from './platform'

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

/**
 * Download codeagent-wrapper binary from GitHub Release.
 */
export async function downloadBinary(binaryName: string, destPath: string): Promise<boolean> {
  const url = `${BINARY_DOWNLOAD_URL}/${binaryName}`

  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) {
    return false
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await fs.writeFile(destPath, buffer)

  if (!isWindows()) {
    await fs.chmod(destPath, 0o755)
  }

  return true
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
