# AIDN Exploration Cache

Purpose: reduce future codebase exploration by keeping stable, updateable project knowledge in one folder.

This cache is not source code. It is a living map of the project: routes, modules, workflows, data models, decisions, QA notes, and known gaps.

## How to use

1. Before starting any implementation, read:
   - `00-control/INDEX.md`
   - `00-control/CURRENT_STATE.md`
   - the specific module file related to the task.

2. During implementation, update only the touched cache files.

3. After implementation, append a short note in:
   - `99-session-notes/YYYY-MM-DD-session-note.md`

4. Never let the cache become a second codebase. Keep it factual, short, and linked to actual files.

## Update rule

Each cache page should include:
- last reviewed date
- source files inspected
- current facts
- known gaps
- next exploration targets
