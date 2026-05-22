# Exploration Protocol

## Goal

Keep this cache factual, concise, and source-linked.

## Required first reads

1. 00-control/SOURCE_OF_TRUTH.md
2. 00-control/CURRENT_STATE.md
3. 01-project-map/REPO_STRUCTURE.md
4. 01-project-map/ROUTES_MAP.md

## Required commands before documentation updates

- pwd
- ls
- find . -maxdepth 3 -type f | sort (excluding heavy folders)
- route search in apps/admin/src (Router/Route/path)
- package script inspection (apps/admin/package.json)

## Update method

- Prefer updating existing cache files over creating ad-hoc new files.
- Add exact source paths for each non-trivial claim.
- Mark assumptions as "assumption" explicitly.
- Record uncertain areas in 10-decisions/OPEN_QUESTIONS.md.

## Implementation Report required

Every implementation pass MUST produce a summary file under `exploration-cache/tasks/summaries/` before the pass is marked complete. The summary must include:

- Objective
- Files changed (table)
- Key decisions
- Build verification result (`npm run build` pass/fail)
- Runtime validation result - checklist of tests actually run, each marked PASS or FAIL
- Deferred items (explicit list)
- Next step

A pass is NOT complete if:

- the summary file does not exist
- build verification is not recorded
- runtime validation has not been run and recorded (or explicitly noted as pending with reason)

## What not to do

- Do not copy large code blocks into cache files.
- Do not claim command/test success unless actually run.
- Do not describe planned architecture as already implemented.
- Do not mark a pass complete without a summary file and build/runtime result.
