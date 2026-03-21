import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'fs-extra'
import { dirname, join } from 'pathe'
import { fileURLToPath } from 'node:url'

const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function findPackageRoot(startDir: string): string {
  let dir = startDir
  while (true) {
    if (fs.existsSync(join(dir, 'package.json'))) {
      return dir
    }

    const parentDir = dirname(dir)
    if (parentDir === dir) {
      return dir
    }
    dir = parentDir
  }
}

const PACKAGE_ROOT = findPackageRoot(__dirname)

async function readPackageVersion(pkgPath: string): Promise<string | null> {
  try {
    if (!(await fs.pathExists(pkgPath))) {
      return null
    }
    const pkg = await fs.readJSON(pkgPath)
    return pkg.version || null
  }
  catch {
    return null
  }
}

/**
 * Get current running package version.
 */
export async function getCurrentVersion(): Promise<string> {
  const relativePkgPath = fileURLToPath(new URL('../../package.json', import.meta.url))
  const relativeVersion = await readPackageVersion(relativePkgPath)
  if (relativeVersion) {
    return relativeVersion
  }

  const rootPkgPath = join(PACKAGE_ROOT, 'package.json')
  const rootVersion = await readPackageVersion(rootPkgPath)
  if (rootVersion) {
    return rootVersion
  }

  return process.env.npm_package_version || '0.0.0'
}

/**
 * Get latest version from npm registry.
 */
export async function getLatestVersion(packageName = 'cxg-workflow'): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`npm view ${packageName} version`, { timeout: 10_000 })
    return stdout.trim()
  }
  catch {
    return null
  }
}

/**
 * Compare two semantic versions.
 * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0
    const num2 = parts2[i] || 0

    if (num1 > num2) {
      return 1
    }
    if (num1 < num2) {
      return -1
    }
  }

  return 0
}

/**
 * Check whether npm has a newer version.
 */
export async function checkForUpdates(): Promise<{
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string | null
}> {
  const currentVersion = await getCurrentVersion()
  const latestVersion = await getLatestVersion()

  if (!latestVersion) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: null,
    }
  }

  return {
    hasUpdate: compareVersions(latestVersion, currentVersion) > 0,
    currentVersion,
    latestVersion,
  }
}
