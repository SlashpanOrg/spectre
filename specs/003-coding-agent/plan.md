# Implementation Plan: Spectre Coding Agent

**Branch:** `003-coding-agent` | **Date:** 2026-05-21 | **Spec:** [spec.md](./spec.md)

## Summary

Transform Spectre from a codebase analysis tool into a production-grade coding agent with conversational chat, file system tools, permission system, sub-agent orchestration, token tracking, real-time timers, session compaction, and persistent agent memory — while preserving all existing features.

## Technical Context

**Language/Version:** TypeScript 5.7+, Node.js >= 20.0.0

**Primary Dependencies:**
- `ink` v5.x, `react` v18.x (TUI framework — already installed)
- `@slashpan/tui` (local TUI component library — already built)
- `openai` v4.x, `@anthropic-ai/sdk` v0.33.x, `@google/generative-ai` v0.24.x (streaming + token tracking)
- `simple-git` v3.36.x (Git operations — already installed)
- `better-sqlite3` v11.10.x (local storage — already installed)
- `crypto-js` v4.2.x (encryption — already installed)
- `glob` / `fast-glob` (file system operations — NEW)
- `diff` (diff generation for file edits — NEW)
- `execa` (safe shell command execution — NEW)

**Current Architecture:**
- Entry: `src/index.tsx` → renders `<SpectreApp>` (Ink/React)
- Agent: `src/agent/orchestrator.ts` — basic task planning and tool execution
- Tools: `src/agent/tool-runner.ts` — dispatches to existing command handlers
- TUI: `src/tui/app.tsx` — chat interface with streaming, progress, command palette
- Config: `src/utils/config.ts` — provider management, API keys
- Storage: `src/storage/` — Qdrant vectors, SQLite metadata, session store

**Target Architecture:**
```
src/
├── agent/
│   ├── orchestrator.ts        # Main agent — conversation + tool orchestration
│   ├── sub-agent.ts           # NEW — concurrent task executor
│   ├── tools/                 # NEW — agent tool implementations
│   │   ├── read-file.ts
│   │   ├── write-file.ts
│   │   ├── edit-file.ts
│   │   ├── run-command.ts
│   │   ├── list-files.ts
│   │   ├── search-files.ts
│   │   ├── debug-code.ts
│   │   └── run-tests.ts
│   ├── permissions.ts         # NEW — permission system
│   ├── memory.ts              # NEW — agent memory management
│   └── compactor.ts           # NEW — session compaction engine
├── tui/
│   ├── app.tsx                # Updated — token bar, task timer, permission prompts
│   ├── components/
│   │   ├── token-bar.tsx      # NEW — animated token progress bar
│   │   ├── task-timer.tsx     # NEW — real-time mm:ss timer
│   │   └── permission-prompt.tsx  # NEW — Allow Once/Always/Decline dialog
├── utils/
│   ├── token-tracker.ts       # NEW — token consumption tracking
│   └── task-timer.ts          # NEW — operation duration tracking
└── ... (existing structure preserved)
```

## Constitution Check

### Article I: Conversation-First Design
- [ ] Agent defaults to chat mode
- [ ] Tool invocations are transparent in chat
- [ ] Agent explains actions before executing

### Article II: Permission-Respecting Execution
- [ ] Destructive operations require permission
- [ ] Three-tier permission system (Once/Always/Decline)
- [ ] Permissions scoped per-project
- [ ] Permission persistence across sessions

### Article III: Tool Transparency
- [ ] Every tool invocation visible in chat
- [ ] Real-time progress and output shown
- [ ] Token usage and time displayed

### Article IV: Sub-Agent Delegation
- [ ] Complex tasks decomposed into parallel sub-tasks
- [ ] Sub-agents inherit permission context
- [ ] Results consolidated by main agent

### Article V: Memory and Growth
- [ ] SOUL.MD, IDENTITY.MD, INFORMATION.MD, PERMISSION.MD, DIARY.MD, SKILLS.MD
- [ ] Memory files stored in ~/.spectre/memory/
- [ ] New sessions load memory context

### Article VI: Session Intelligence
- [ ] Auto-compaction at token threshold
- [ ] Summaries preserve actionable context
- [ ] New sessions inherit previous summaries

### Article VII: Quality Standards
- [ ] Agent follows project conventions
- [ ] Agent reads before writing
- [ ] Tests alongside implementation

### Article VIII: Performance Awareness
- [ ] Real-time task timer (mm:ss)
- [ ] Token progress bar with percentage
- [ ] Incremental progress for long operations

## Project Structure

```
spectre/
├── src/
│   ├── index.tsx                    # Entry point (KEEP, add terminal clear)
│   ├── tui/
│   │   ├── app.tsx                  # UPDATE — add token bar, timer, permission prompts
│   │   └── components/
│   │       ├── token-bar.tsx        # NEW — animated token progress bar
│   │       ├── task-timer.tsx       # NEW — real-time mm:ss timer
│   │       └── permission-prompt.tsx # NEW — Allow Once/Always/Decline
│   ├── agent/
│   │   ├── orchestrator.ts          # REWRITE — conversation-first agent
│   │   ├── sub-agent.ts             # NEW — concurrent task executor
│   │   ├── tools/                   # NEW — agent tool implementations
│   │   │   ├── read-file.ts
│   │   │   ├── write-file.ts
│   │   │   ├── edit-file.ts
│   │   │   ├── run-command.ts
│   │   │   ├── list-files.ts
│   │   │   ├── search-files.ts
│   │   │   ├── debug-code.ts
│   │   │   └── run-tests.ts
│   │   ├── permissions.ts           # NEW — permission system
│   │   ├── memory.ts                # NEW — agent memory management
│   │   └── compactor.ts             # NEW — session compaction
│   ├── utils/
│   │   ├── token-tracker.ts         # NEW — token consumption tracking
│   │   └── task-timer.ts            # NEW — operation duration tracking
│   ├── commands/                    # KEEP — existing commands as agent tools
│   ├── ai/                          # KEEP — provider abstraction
│   ├── tools/                       # KEEP — existing tools (index, query, review, debt, docs)
│   ├── storage/                     # KEEP — vector store, metadata, sessions
│   └── tui-lib/                     # KEEP — shared component library
├── tests/
│   ├── unit/
│   │   ├── agent-tools.test.ts      # NEW
│   │   ├── permissions.test.ts      # NEW
│   │   ├── token-tracker.test.ts    # NEW
│   │   ├── task-timer.test.ts       # NEW
│   │   ├── compactor.test.ts        # NEW
│   │   └── memory.test.ts           # NEW
│   └── integration/
│       ├── agent-workflow.test.ts   # NEW
│       └── sub-agent.test.ts        # NEW
└── ...
```

## Implementation Strategy

### Phase 1: Core Agent Tools and Permission System (Week 1-2)
- Implement file system tools (read, write, edit, list, search)
- Implement execution tools (run_command, run_tests)
- Build permission system with per-project scoping
- Add permission prompts to TUI
- Integrate tools into agent orchestrator
- Tests for all tools and permissions

### Phase 2: Token Tracking and Task Timer (Week 3)
- Build token tracker with provider-specific counting
- Create animated token progress bar component
- Build real-time task timer (mm:ss)
- Integrate into TUI header/status bar
- Tests for token tracking and timer accuracy

### Phase 3: Sub-Agents and Session Compaction (Week 4)
- Implement sub-agent spawner and orchestrator
- Build session compaction engine
- Create summary generation from conversation history
- Integrate compaction trigger at token threshold
- Tests for sub-agent parallelism and compaction accuracy

### Phase 4: Agent Memory Files (Week 5)
- Create memory file manager (SOUL.MD, IDENTITY.MD, etc.)
- Implement memory loading on session start
- Build `/memory` command for viewing/editing
- Implement memory updates from agent interactions
- Tests for memory persistence and loading

### Phase 5: Integration and Polish (Week 6)
- Integrate existing features as agent tools
- Update README with agent documentation
- Performance optimization
- Cross-platform testing
- Release preparation

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Permission system | Security requirement for file/shell operations | No permissions = unsafe agent that users won't trust |
| Sub-agents | Parallel task execution for speed | Single-threaded agent too slow for complex tasks |
| Token tracking | Context window management | Without tracking, conversations hit limits unexpectedly |
| Memory files | Persistent agent learning | Stateless agent forgets everything between sessions |
| Session compaction | Context window limits | Without compaction, long sessions lose context |

## Risk Mitigation

1. **File System Safety:** All write operations show diff preview before execution
2. **Shell Command Safety:** Permission gating with pattern matching for allow-always
3. **Token Accuracy:** Fallback estimation when provider doesn't return token counts
4. **Sub-Agent Isolation:** Each sub-agent has isolated context but shared permissions
5. **Memory File Corruption:** Atomic writes with backup for memory files
6. **Compaction Quality:** LLM-based summarization with user-editable output
