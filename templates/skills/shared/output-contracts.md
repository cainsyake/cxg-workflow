# Output Contracts

Every `$cxg-*` skill should produce a result that is easy to review and act on.

## Minimum Output Shape

1. `Goal`: what the skill understood the user wanted.
2. `Context`: the files, systems, or constraints that mattered.
3. `Work`: the analysis, plan, edits, or commands performed.
4. `Result`: the concrete deliverable, decision, or recommendation.
5. `Verification`: the checks run, or the reason verification could not be completed.

## Delivery Expectations By Skill Type

- Analysis skills should return findings, assumptions, risks, and recommended next actions.
- Planning skills should return sequenced steps, touched files, and validation points.
- Execution skills should return implemented changes, tests run, and any follow-up work.
- Review skills should return prioritized issues first, then overall assessment.
- Meta skills should return reusable artifacts such as prompts, plans, commit messages, or docs.

## Quality Bar

1. Be explicit about whether the skill changed files or stayed read-only.
2. Prefer file paths, commands, and acceptance criteria over abstract advice.
3. Separate observed facts from inference.
4. Do not imply success without evidence from the verification step.
5. Keep the summary concise enough for a teammate to scan quickly.
