#!/usr/bin/env node
import cac from 'cac'
import { setupCommands } from './cli-setup'

async function main(): Promise<void> {
  const cli = cac('cxg')
  setupCommands(cli)
  cli.parse()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
