# Tasks: Spectre Agent Evolution

**Input:** spec.md, plan.md from `specs/004-agent-evolution/`

## Phase 1: Model Validation and Profiles (US2, US3 — P1)

### Model Validator
- [ ] T001 [P] Create `src/ai/model-validator.ts`
- [ ] T002 [US2] Implement model availability check per provider (OpenAI, Anthropic, Gemini, Ollama)
- [ ] T003 [US2] Filter out deprecated, interaction-only, and restricted models
- [ ] T004 [US2] Add async validation with timeout (5s per model)
- [ ] T005 [US2] Implement result caching with configurable TTL (default 1 hour)
- [ ] T006 [US2] Add graceful fallback to cached list or full list on validation failure

### Model Profiles
- [ ] T007 [P] Create `src/ai/model-profiles.ts`
- [ ] T008 [US3] Define `ModelProfile` interface (streaming, maxTokens, contextWindow, toolCalling, reasoning)
- [ ] T009 [US3] Create initial profile database for common models
- [ ] T010 [US3] Implement profile loading from `~/.spectre/models/`
- [ ] T011 [US3] Add profile auto-update from provider API responses
- [ ] T012 [US3] Create `/model-info <name>` command

### Integration
- [ ] T013 [US2] Update `model-discovery.ts` to use validator
- [ ] T014 [US2] Update model switcher to show only validated models
- [ ] T015 [US3] Update orchestrator to adapt behavior based on model profile
- [ ] T016 [US2] Add model error handling with fallback suggestions
- [ ] T017 [US2] Test: Verify deprecated models are filtered out
- [ ] T018 [US2] Test: Verify model errors trigger fallback

---

## Phase 2: Error Learning and Skill Creation (US4 — P1)

### Error Pattern Analyzer
- [ ] T019 [P] Create `src/utils/error-patterns.ts`
- [ ] T020 [US4] Define `ErrorPattern` interface (pattern, category, solution, frequency)
- [ ] T021 [US4] Implement error categorization (model, tool, permission, network, unknown)
- [ ] T022 [US4] Add fuzzy pattern matching for similar errors
- [ ] T023 [US4] Implement error frequency tracking

### Error Learner
- [ ] T024 [P] Create `src/agent/error-learner.ts`
- [ ] T025 [US4] Integrate with MemoryManager for SKILLS.MD and DIARY.MD updates
- [ ] T026 [US4] Implement skill creation from resolved errors
- [ ] T027 [US4] Add skill lookup on error occurrence
- [ ] T028 [US4] Implement error recovery suggestions
- [ ] T029 [US4] Add skill editing via `/skill edit` command
- [ ] T030 [US4] Test: Verify error creates skill entry
- [ ] T031 [US4] Test: Verify similar error triggers skill lookup

### Orchestrator Integration
- [ ] T032 [US4] Wire error learner into orchestrator error handling
- [ ] T033 [US4] Add skill context to system prompt
- [ ] T034 [US4] Test: Verify error recovery flows work end-to-end

---

## Phase 3: Dynamic Tool Creation (US1 — P1)

### Tool Creator
- [ ] T035 [P] Create `src/agent/tools/tool-creator.ts`
- [ ] T036 [US1] Implement TypeScript tool code generation from requirements using LLM
- [ ] T037 [US1] Add tool metadata generation (name, description, parameters)
- [ ] T038 [US1] Implement compilation validation and `.mjs` output generation
- [ ] T039 [US1] Mark tool as restart-ready, not current-process executable
- [ ] T040 [US1] Implement tool persistence to `~/.spectre/tools/`
- [ ] T041 [US1] Add tool linking from `~/.spectre/tools/active` on initialization

### Automatic Gap Detection
- [ ] T042 [US1] Update orchestrator to detect when no tool matches user request
- [ ] T043 [US1] Log gap in DIARY.MD with tool creation plan
- [ ] T044 [US1] Spawn internal micro-agent path to generate, validate, and prepare tool automatically
- [ ] T045 [US1] Notify user post-creation with restart now/later instruction
- [ ] T046 [US1] Test: Verify automatic tool creation flow

### Explicit Tool Creation
- [ ] T047 [US1] Create `/tool <prompt>` command for explicit tool creation
- [ ] T048 [US1] Same validation and registration as automatic flow
- [ ] T049 [US1] Test: Verify explicit tool creation flow

### Tool Management
- [ ] T050 [P] Create `src/commands/tools.ts`
- [ ] T051 [US1] Implement `/tools list` command
- [ ] T052 [US1] Implement `/tools inspect <name>` command
- [ ] T053 [US1] Implement restart-ready status display
- [ ] T054 [US1] Implement `/tools remove <name>` command
- [ ] T055 [US1] Update ToolRegistry to load dynamic tools on init
- [ ] T056 [US1] Test: Verify dynamic tools persist across sessions

---

## Phase 4: Clarification Handler (US4 — P2)

### Clarification System
- [ ] T053 [P] Create `src/agent/clarification-handler.ts`
- [ ] T054 [US4] Define `ClarificationRequest` interface
- [ ] T055 [US4] Implement clarification queue management
- [ ] T056 [US4] Add timeout support (configurable, default 5 minutes)
- [ ] T057 [US4] Implement clarification result passing to agent

### TUI Integration
- [ ] T058 [US4] Create `src/tui/components/clarification-prompt.tsx`
- [ ] T059 [US4] Implement interactive clarification dialog
- [ ] T060 [US4] Add keyboard navigation for clarification responses
- [ ] T061 [US4] Wire clarification prompt into app.tsx
- [ ] T062 [US4] Test: Verify clarification flow in TUI

### CLI Integration
- [ ] T063 [US4] Add CLI clarification via stdin prompt
- [ ] T064 [US4] Wire into agent command
- [ ] T065 [US4] Test: Verify "No clarification handler available" error is resolved

---

## Phase 5: Spectre Gateway (US5 — P3)

### Gateway Manager
- [ ] T066 [P] Create `src/gateway/gateway-manager.ts`
- [ ] T067 [US5] Implement gateway process spawning
- [ ] T068 [US5] Add process monitoring and auto-restart
- [ ] T069 [US5] Implement graceful shutdown
- [ ] T070 [US5] Add logging to `~/.spectre/logs/gateway.log`

### Telegram Integration
- [ ] T071 [P] Create `src/gateway/telegram.ts`
- [ ] T072 [US5] Implement Telegram bot initialization with user-provided token
- [ ] T073 [US5] Add message receiving and agent processing
- [ ] T074 [US5] Implement response sending back to Telegram
- [ ] T075 [US5] Add permission system integration
- [ ] T076 [US5] Test: Verify Telegram message flow

### Gateway CLI
- [ ] T083 [P] Create `src/commands/gateway.ts`
- [ ] T084 [US5] Implement `spectre gateway start` command
- [ ] T085 [US5] Implement `spectre gateway stop` command
- [ ] T086 [US5] Implement `spectre gateway status` command
- [ ] T087 [US5] Implement `spectre gateway logs` command
- [ ] T088 [US5] Add configuration for Telegram/Slack tokens
- [ ] T089 [US5] Test: Verify gateway lifecycle commands

---

## Phase 6: Integration and Polish (P3)

### Integration
- [ ] T090 [P] Integrate all new systems into orchestrator
- [ ] T091 [P] Update system prompt to include model capabilities, skills, and dynamic tools
- [ ] T092 [P] Add comprehensive error handling across all new systems
- [ ] T093 [P] Update README with new feature documentation
- [ ] T094 [P] Add migration guide for existing users

### Testing
- [ ] T095 Write unit tests for model validator
- [ ] T096 Write unit tests for error learner
- [ ] T097 Write unit tests for tool creator
- [ ] T098 Write unit tests for clarification handler
- [ ] T099 Write unit tests for gateway components
- [ ] T100 Run `npm test`, verify all pass
- [ ] T101 Run `npm run typecheck`, verify no errors
- [ ] T102 Run `npm run lint`, fix any issues

### Release
- [ ] T103 Bump version to 0.5.0
- [ ] T104 Update changelog
- [ ] T105 Final testing on macOS, Linux
- [ ] T106 Commit and push

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1** (Model Validation): No dependencies — can start immediately
- **Phase 2** (Error Learning): Depends on Phase 1 (needs model error handling)
- **Phase 3** (Dynamic Tools): Depends on Phase 2 (error learning helps refine tool creation)
- **Phase 4** (Clarification): Depends on Phase 2 (error learning covers clarification errors)
- **Phase 5** (Gateway): Depends on Phase 1-4 (needs all agent systems)
- **Phase 6** (Release): Depends on all previous phases

### Parallel Opportunities
- Within Phase 1: T001-T006 (validator) and T007-T012 (profiles) can run in parallel
- Within Phase 2: T019-T023 (patterns) and T024-T031 (learner) can run in parallel
- Within Phase 3: T035-T041 (creator) and T042-T045 (agent tool) can run in parallel
- Within Phase 5: T071-T076 (Telegram) and T077-T082 (Slack) can run in parallel

### Implementation Strategy
1. Complete Phase 1 → No more model availability errors
2. Add Phase 2 → Agent learns from errors, creates skills
3. Add Phase 3 → Agent can create new tools dynamically
4. Add Phase 4 → Clarification handler works in TUI and CLI
5. Add Phase 5 → Gateway enables Telegram/Slack communication
6. Phase 6 → Test, optimize, release
