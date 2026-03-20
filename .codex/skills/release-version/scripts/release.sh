#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  release.sh <patch|minor|major|x.y.z> [--dry-run] [--skip-checks] [--remote <name>]

Examples:
  release.sh patch
  release.sh minor --remote upstream
  release.sh 1.2.3 --dry-run
EOF
}

die() {
  echo "Error: $*" >&2
  exit 1
}

run() {
  if ((DRY_RUN)); then
    printf '[dry-run]'
    printf ' %q' "$@"
    printf '\n'
    return 0
  fi
  "$@"
}

DRY_RUN=0
SKIP_CHECKS=0
REMOTE='origin'
BUMP=''

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --skip-checks)
      SKIP_CHECKS=1
      shift
      ;;
    --remote)
      shift
      [[ $# -gt 0 ]] || die '--remote requires a value'
      REMOTE="$1"
      shift
      ;;
    *)
      if [[ -n "$BUMP" ]]; then
        die "Unexpected argument: $1"
      fi
      BUMP="$1"
      shift
      ;;
  esac
done

[[ -n "$BUMP" ]] || {
  usage
  exit 1
}

command -v git >/dev/null 2>&1 || die 'git is required'
command -v node >/dev/null 2>&1 || die 'node is required'
if (( !SKIP_CHECKS )); then
  command -v pnpm >/dev/null 2>&1 || die 'pnpm is required unless --skip-checks is set'
fi

[[ -f package.json ]] || die 'package.json not found in current directory'
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die 'Current directory is not a git repository'

if [[ -n "$(git status --porcelain)" ]]; then
  die 'Working tree is not clean. Commit or stash current changes first.'
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[[ "$BRANCH" != "HEAD" ]] || die 'Detached HEAD is not supported'
git remote get-url "$REMOTE" >/dev/null 2>&1 || die "Remote ${REMOTE} not found"

CURRENT_VERSION="$(node -p "JSON.parse(require('fs').readFileSync('package.json', 'utf8')).version")"
NEXT_VERSION="$(node - "$CURRENT_VERSION" "$BUMP" <<'NODE'
const current = process.argv[2]
const bump = process.argv[3]

const parse = (value) => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(value)
  if (!m) return null
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) }
}

const compare = (a, b) => {
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  return a.patch - b.patch
}

const currentParsed = parse(current)
if (!currentParsed) {
  console.error(`Current version "${current}" is not strict semver (x.y.z).`)
  process.exit(1)
}

let nextParsed
if (bump === 'patch') {
  nextParsed = { ...currentParsed, patch: currentParsed.patch + 1 }
} else if (bump === 'minor') {
  nextParsed = { major: currentParsed.major, minor: currentParsed.minor + 1, patch: 0 }
} else if (bump === 'major') {
  nextParsed = { major: currentParsed.major + 1, minor: 0, patch: 0 }
} else {
  nextParsed = parse(bump)
  if (!nextParsed) {
    console.error(`Unsupported bump value "${bump}". Use patch/minor/major or x.y.z.`)
    process.exit(1)
  }
  if (compare(nextParsed, currentParsed) <= 0) {
    console.error(`Explicit version "${bump}" must be greater than current version "${current}".`)
    process.exit(1)
  }
}

process.stdout.write(`${nextParsed.major}.${nextParsed.minor}.${nextParsed.patch}`)
NODE
)"

TAG="v${NEXT_VERSION}"
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  die "Tag ${TAG} already exists locally"
fi

if (( !DRY_RUN )); then
  if git ls-remote --exit-code --tags "$REMOTE" "$TAG" >/dev/null 2>&1; then
    die "Tag ${TAG} already exists on remote ${REMOTE}"
  fi
fi

echo "Current version: ${CURRENT_VERSION}"
echo "Next version:    ${NEXT_VERSION}"
echo "Branch:          ${BRANCH}"
echo "Remote:          ${REMOTE}"

if (( !SKIP_CHECKS )); then
  run pnpm lint
  run pnpm typecheck
  run pnpm test
  run pnpm build
fi

if (( DRY_RUN )); then
  run git add package.json
  run git commit -m "chore: release ${TAG}"
  run git tag "${TAG}"
  run git push "$REMOTE" "$BRANCH"
  run git push "$REMOTE" "${TAG}"
  exit 0
fi

node - "$NEXT_VERSION" <<'NODE'
const fs = require('fs')
const path = 'package.json'
const nextVersion = process.argv[2]
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'))
pkg.version = nextVersion
fs.writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`)
NODE

git add package.json
git commit -m "chore: release ${TAG}"
git tag "${TAG}"
git push "$REMOTE" "$BRANCH"
git push "$REMOTE" "${TAG}"

echo "Release complete: ${TAG}"
echo "GitHub publish workflow should start after tag push."
