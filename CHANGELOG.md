# Changelog

## 0.1.1

- Removed thin Claude Code slash command aliases so `implementation-workflow` exposes only 3 skills.
- Clarified source-of-truth precedence, lightweight planning, auditor next actions, AskUser criteria, and default stack policy including Sentry, Biome, and Knip.
- Added repo-local operating instructions in Japanese with `AGENTS.md` as the source and `CLAUDE.md` as a symlink.
- Documented version bump and update-cache requirements for plugin distribution.
- Documented `/goal` usage for long-running Codex / Claude Code execution work.
- Hardened plugin validation to ignore non-directory files such as `.DS_Store`.

## 0.1.0

- Added `implementation-workflow` plugin.
- Added `implementation-planner`, `implementation-executor`, and `implementation-auditor` skills.
- Added Codex and Claude Code plugin manifests.
- Added Claude Code compatibility commands.
- Added plugin validation, Biome, Knip, and CI.
