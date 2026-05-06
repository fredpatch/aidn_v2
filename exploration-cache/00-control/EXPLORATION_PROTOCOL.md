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

## What not to do
- Do not copy large code blocks into cache files.
- Do not claim command/test success unless actually run.
- Do not describe planned architecture as already implemented.
