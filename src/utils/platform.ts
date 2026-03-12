export function isWindows(): boolean {
  return process.platform === 'win32'
}

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/')
}
