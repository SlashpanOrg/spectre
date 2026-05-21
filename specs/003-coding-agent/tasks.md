# Tasks: Spectre Coding Agent

**Input:** spec.md, plan.md from `specs/003-coding-agent/`

## Phase 1: Core Agent Tools and Permission System (US1, US2 — P1)

### Tool Infrastructure
- [ ] T001 [P] Create `src/agent/tools/` directory structure
- [ ] T002 [P] Define `AgentTool` interface in `src/agent/tools/types.ts`
- [ ] T003 [P] Create tool registry in `src/agent/tools/registry.ts`
- [ ] T004 [P] Add `fast-glob` and `diff` and `execa` to package.json dependencies

### File System Tools
- [ ] T005 [US1] Implement `read_file` tool in `src/agent/tools/read-file.ts`
- [ ] T006 [US1] Implement `write_file` tool in `src/agent/tools/write-file.ts` with diff preview
- [ ] T007 [US1] Implement `edit_file` tool in `src/agent/tools/edit-file.ts` (search/replace, insert, delete)
- [ ] T008 [US1] Implement `list_files` tool in `src/agent/tools/list-files.ts`
- [ ] T009 [US1] Implement `search_files` tool in `src/agent/tools/search-files.ts`

### Execution Tools
- [ ] T010 [US1] Implement `run_command` tool in `src/agent/tools/run-command.ts` with execa
- [ ] T011 [US1] Implement `run_tests` tool in `src/agent/tools/run-tests.ts`
- [ ] T012 [US1] Implement `debug_code` tool in `src/agent/tools/debug-code.ts`

### Permission System
- [ ] T013 [US2] Define `Permission` interface in `src/agent/permissions.ts`
- [ ] T014 [US2] Implement permission store with per-project scoping
- [ ] T015 [US2] Implement permission checker with pattern matching
- [ ] T016 [US2] Implement permission persistence (JSON file with 0600 permissions)
- [ ] T017 [US2] Create `/permissions` command to list and manage permissions

### Permission Prompt TUI
- [ ] T018 [US2] Create `PermissionPrompt` component in `src/tui/components/permission-prompt.tsx`
- [ ] T019 [US2] Implement Allow Once / Allow Always / Decline selection
- [ ] T020 [US2] Wire permission prompt to tool execution flow
- [ ] T021 [US2] Test: Run destructive command, verify permission prompt appears

### Agent Orchestrator Rewrite
- [ ] T022 [US1] Rewrite `orchestrator.ts` for conversation-first mode
- [ ] T023 [US1] Integrate tool registry into orchestrator
- [ ] T024 [US1] Add tool invocation logging for auditability
- [ ] T025 [US1] Test: Ask agent to read/write file, verify tool execution

### Phase 1 Tests
- [ ] T026 Write unit tests for all agent tools
- [ ] T027 Write unit tests for permission system
- [ ] T028 Run `npm test`, verify all pass

---

## Phase 2: Token Tracking and Task Timer (US4 — P2)

### Token Tracker
- [ ] T029 [P] Create `src/utils/token-tracker.ts`
- [ ] T030 [P] Implement token counting for OpenAI responses
- [ ] T031 [P] Implement token counting for Anthropic responses
- [ ] T032 [P] Implement token counting for Gemini responses
- [ ] T033 [P] Implement fallback token estimation when provider doesn't return counts
- [ ] T034 [P] Add context window size configuration per model

### Task Timer
- [ ] T035 [P] Create `src/utils/task-timer.ts`
- [ ] T036 [P] Implement real-time timer with mm:ss formatting
- [ ] T037 [P] Add pause/resume support
- [ ] T038 [P] Add elapsed time reporting

### TUI Components
- [ ] T039 [US4] Create `TokenBar` component in `src/tui/components/token-bar.tsx`
- [ ] T040 [US4] Implement animated progress bar with percentage
- [ ] T041 [US4] Add visual warning at 80% threshold
- [ ] T042 [US4] Create `TaskTimer` component in `src/tui/components/task-timer.tsx`
- [ ] T043 [US4] Implement real-time mm:ss display
- [ ] T044 [US4] Integrate TokenBar and TaskTimer into app header/status bar

### Integration
- [ ] T045 [US4] Wire token tracker to AI provider responses
- [ ] T046 [US4] Wire task timer to tool execution
- [ ] T047 [US4] Show final token count and duration in task summary
- [ ] T048 [US4] Test: Verify token bar updates accurately
- [ ] T049 [US4] Test: Verify timer updates every second

---

## Phase 3: Sub-Agents and Session Compaction (US3, US5 — P2)

### Sub-Agent System
- [ ] T050 [US3] Create `src/agent/sub-agent.ts`
- [ ] T051 [US3] Implement sub-agent spawner with concurrent execution
- [ ] T052 [US3] Implement sub-agent context isolation
- [ ] T053 [US3] Implement permission context inheritance
- [ ] T054 [US3] Implement sub-agent status monitoring
- [ ] T055 [US3] Implement result consolidation
- [ ] T056 [US3] Implement graceful interrupt handling for sub-agents
- [ ] T057 [US3] Update orchestrator to detect parallelizable tasks
- [ ] T058 [US3] Test: Assign multi-part task, verify sub-agents run in parallel

### Session Compaction
- [ ] T059 [US5] Create `src/agent/compactor.ts`
- [ ] T060 [US5] Implement token threshold detection
- [ ] T061 [US5] Implement LLM-based session summarization
- [ ] T062 [US5] Implement summary preservation of decisions, changes, action items
- [ ] T063 [US5] Implement context clearing after compaction
- [ ] T064 [US5] Create `/compact` command for manual compaction
- [ ] T065 [US5] Implement new session loading of previous summary
- [ ] T066 [US5] Test: Exceed token threshold, verify auto-compaction triggers
- [ ] T067 [US5] Test: Start new session, verify previous summary loads

### Phase 3 Tests
- [ ] T068 Write unit tests for sub-agent system
- [ ] T069 Write unit tests for compaction engine
- [ ] T070 Write integration tests for sub-agent parallelism

---

## Phase 4: Agent Memory Files (US6 — P2)

### Memory File System
- [ ] T071 [P] Create `src/agent/memory.ts`
- [ ] T072 [P] Define memory file structure and types
- [ ] T073 [P] Implement SOUL.MD manager (personality, communication style)
- [ ] T074 [P] Implement IDENTITY.MD manager (role, capabilities, limitations)
- [ ] T075 [P] Implement INFORMATION.MD manager (project knowledge, architecture)
- [ ] T076 [P] Implement PERMISSION.MD manager (active permissions, trust levels)
- [ ] T077 [P] Implement DIARY.MD manager (interaction history, lessons learned)
- [ ] T078 [P] Implement SKILLS.MD manager (capabilities, learned patterns)
- [ ] T079 [P] Implement memory file loading on session start
- [ ] T080 [P] Implement memory file updates from agent interactions
- [ ] T081 [P] Create `/memory` command for viewing and editing memory files
- [ ] T082 [P] Test: Modify memory, restart session, verify memory persists

### Memory Integration
- [ ] T083 [US6] Wire memory context into agent system prompt
- [ ] T084 [US6] Implement automatic memory updates from conversations
- [ ] T085 [US6] Test: Agent learns preference, restarts, applies preference

---

## Phase 5: Integration with Existing Features (US7 — P3)

### Feature Integration
- [ ] T086 [US7] Register existing tools (index, query, review, debt, docs) as agent tools
- [ ] T087 [US7] Update orchestrator to route to existing tools
- [ ] T088 [US7] Test: Ask agent to index repo, verify existing indexer runs
- [ ] T089 [US7] Test: Ask agent to review branch, verify existing PR reviewer runs
- [ ] T090 [US7] Test: Ask agent about tech debt, verify existing debt detector runs

### Documentation
- [ ] T091 [P] Update README.md with agent documentation
- [ ] T092 [P] Add agent commands to command reference
- [ ] T093 [P] Add memory file documentation
- [ ] T094 [P] Add permission system documentation

---

## Phase 6: Testing, Polish, and Release (P3)

### Comprehensive Testing
- [ ] T095 Write E2E tests for full agent workflow
- [ ] T096 Write E2E tests for permission flow
- [ ] T097 Write E2E tests for sub-agent orchestration
- [ ] T098 Write E2E tests for session compaction
- [ ] T099 Run `npm test`, verify all pass
- [ ] T100 Run `npm run typecheck`, verify no errors
- [ ] T101 Run `npm run lint`, fix any issues

### Performance Optimization
- [ ] T102 Optimize tool execution latency
- [ ] T103 Optimize token tracking overhead
- [ ] T104 Optimize memory file loading
- [ ] T105 Optimize sub-agent spawning

### Release Preparation
- [ ] T106 Bump version to 0.4.0
- [ ] T107 Update changelog
- [ ] T108 Final testing on macOS, Linux
- [ ] T109 Commit and push

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1** (Tools + Permissions): No dependencies — can start immediately
- **Phase 2** (Token + Timer): Depends on Phase 1 (needs agent orchestrator)
- **Phase 3** (Sub-Agents + Compaction): Depends on Phase 1 (needs tools) and Phase 2 (needs token tracking)
- **Phase 4** (Memory): Depends on Phase 1 (needs agent orchestrator)
- **Phase 5** (Integration): Depends on Phase 1-4
- **Phase 6** (Release): Depends on all previous phases

### Parallel Opportunities
- Within Phase 1: T005-T009 (file tools) can run in parallel
- Within Phase 1: T010-T012 (execution tools) can run in parallel
- Within Phase 1: T013-T017 (permissions) can run in parallel with tools
- Within Phase 2: T029-T034 (token tracker) and T035-T038 (timer) can run in parallel
- Within Phase 3: T050-T058 (sub-agents) and T059-T067 (compaction) can run in parallel
- Within Phase 4: T071-T082 (memory files) can run in parallel

### Implementation Strategy
1. Complete Phase 1 → Agent can read/write files with permissions
2. Add Phase 2 → Token tracking and timers visible
3. Add Phase 3 → Sub-agents and compaction working
4. Add Phase 4 → Memory files persisting
5. Add Phase 5 → Existing features integrated
6. Phase 6 → Test, optimize, release
