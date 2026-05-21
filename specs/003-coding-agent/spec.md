# Feature Specification: Spectre Coding Agent

**Feature Branch:** `003-coding-agent`
**Created:** 2026-05-21
**Status:** Draft

## User Scenarios & Testing

### User Story 1 — Conversation-First Agent with File System Tools (Priority: P1)

As a developer, I want Spectre to act as a conversational coding agent that can read, write, debug, and run code in my project so that I can delegate development tasks naturally through chat.

**Why this matters:** This is the core transformation — Spectre becomes a coding agent, not just an analysis tool.

**Independent Test:** Launch Spectre, ask it to read a file, modify it, and run a command. Verify all operations work with proper permission prompts.

**Acceptance Scenarios:**

1. **Given** Spectre is running, **When** user asks "read the package.json file", **Then** agent reads and displays the file content in chat
2. **Given** user asks to modify a file, **When** agent proposes changes, **Then** user sees a diff preview and can approve/reject
3. **Given** user asks to run a command, **When** command is potentially destructive, **Then** agent asks permission with Allow Once / Allow Always / Decline options
4. **Given** user grants "Allow Always" for a command pattern, **When** same pattern is requested again, **Then** agent executes without prompting
5. **Given** user declines a command, **When** agent receives decline, **Then** agent suggests safer alternatives

**Tools Required:**
- `read_file` — Read file contents with line numbers
- `write_file` — Write/overwrite file contents (with diff preview)
- `edit_file` — Apply targeted edits (search/replace, insert, delete)
- `run_command` — Execute shell commands (permission-gated)
- `list_files` — List directory contents with filtering
- `search_files` — Grep-like content search across project
- `debug_code` — Run code with breakpoints/step-through (where supported)
- `run_tests` — Execute test suites and report results

---

### User Story 2 — Permission System (Priority: P1)

As a user, I want fine-grained control over what the agent can do in my project so that I maintain security while enabling productive automation.

**Why this matters:** Trust is critical. Users need to know the agent won't accidentally delete files or run dangerous commands.

**Independent Test:** Configure permissions for read/write/run operations. Verify permission prompts appear correctly and "Allow Always" persists across sessions.

**Acceptance Scenarios:**

1. **Given** agent needs to run `rm -rf dist`, **When** permission prompt appears, **Then** user sees three options: Allow Once, Allow Always, Decline
2. **Given** user selects "Allow Always" for `npm run build`, **When** agent runs build again, **Then** no permission prompt appears
3. **Given** user declines a destructive operation, **When** agent processes decline, **Then** operation is blocked and alternative is suggested
4. **Given** permissions are set for a project, **When** user opens a new session in same project, **Then** permissions are loaded automatically
5. **Given** user runs `/permissions`, **When** command executes, **Then** all active permissions are listed with edit capability

---

### User Story 3 — Sub-Agent Orchestration (Priority: P2)

As a user, I want Spectre to spawn sub-agents for parallel work so that complex tasks complete faster without losing coordination.

**Why this matters:** Single-threaded agents are slow. Parallel sub-agents enable complex multi-part tasks to complete efficiently.

**Independent Test:** Assign a multi-part task ("analyze all components in src/ and report issues"). Verify sub-agents spawn, work in parallel, and results consolidate.

**Acceptance Scenarios:**

1. **Given** user assigns a task with independent sub-tasks, **When** agent plans execution, **Then** sub-agents spawn for parallel work
2. **Given** sub-agents are running, **When** user checks status, **Then** each sub-agent's progress is visible
3. **Given** a sub-agent completes, **When** results are ready, **Then** main agent consolidates and presents unified output
4. **Given** user interrupts during sub-agent execution, **When** Ctrl+C is pressed, **Then** all sub-agents stop gracefully with partial results preserved
5. **Given** sub-agent encounters an error, **When** error occurs, **Then** main agent reports error and offers retry/skip/cancel

---

### User Story 4 — Token Usage and Task Timer Display (Priority: P2)

As a user, I want to see real-time token usage and task duration so that I can manage context window limits and understand operation costs.

**Why this matters:** Token limits are real. Users need visibility into context consumption to avoid mid-conversation truncation.

**Independent Test:** Start a conversation, observe token progress bar. Run a task, observe real-time timer. Verify both update continuously.

**Acceptance Scenarios:**

1. **Given** conversation is active, **When** tokens are consumed, **Then** animated progress bar shows used/total tokens with percentage
2. **Given** progress bar approaches 80%, **When** threshold is reached, **Then** visual warning indicator appears
3. **Given** task is running, **When** time elapses, **Then** mm:ss timer updates in real-time next to task description
4. **Given** task completes, **When** results are shown, **Then** final token count and duration are displayed in summary
5. **Given** context window is nearly full, **When** threshold is reached, **Then** agent suggests session compaction

---

### User Story 5 — Session Compaction and Summarization (Priority: P2)

As a user, I want long sessions to automatically compact into summaries so that context is preserved without exceeding token limits.

**Why this matters:** Long conversations exceed context windows. Smart compaction preserves knowledge while freeing space.

**Independent Test:** Have a long conversation that exceeds token threshold. Verify auto-compaction triggers and summary is accurate. Start new session and verify context carries over.

**Acceptance Scenarios:**

1. **Given** session approaches token limit, **When** threshold is reached, **Then** agent triggers auto-compaction
2. **Given** compaction runs, **When** summary is generated, **Then** key decisions, file changes, and action items are preserved
3. **Given** session is compacted, **When** user continues chatting, **Then** agent references summary context accurately
4. **Given** new session starts, **When** previous session had a summary, **Then** summary is loaded as initial context
5. **Given** user runs `/compact`, **When** manual compaction is triggered, **Then** current session is summarized and context is freed

---

### User Story 6 — Agent Memory Files (Priority: P2)

As a user, I want Spectre to maintain persistent memory files that grow with my usage so that the agent learns my preferences, project patterns, and improves over time.

**Why this matters:** An agent that forgets everything between sessions is useless. Persistent memory enables continuous improvement.

**Independent Test:** Configure agent preferences, have it learn project patterns. Restart Spectre and verify memory is loaded and applied.

**Acceptance Scenarios:**

1. **Given** Spectre runs in a project, **When** agent learns user preferences, **Then** preferences are recorded in SOUL.MD
2. **Given** agent discovers project architecture, **When** knowledge is gained, **Then** architecture notes are added to INFORMATION.MD
3. **Given** agent completes tasks, **When** lessons are learned, **Then** insights are recorded in DIARY.MD
4. **Given** agent develops new capabilities, **When** skill is discovered, **Then** capability is documented in SKILLS.MD
5. **Given** user runs `/memory`, **When** command executes, **Then** all memory files are displayed with edit capability
6. **Given** memory files exist, **When** new session starts, **Then** agent loads and applies memory context

---

### User Story 7 — Existing Features Integration (Priority: P3)

As a user, I want Spectre's existing features (indexing, PR review, tech debt, docs) to work seamlessly alongside the new coding agent capabilities so that I have a unified tool.

**Why this matters:** Existing features are valuable. They should not be lost — they should become agent tools.

**Independent Test:** Run `/index`, then ask agent to "review the current branch" and "analyze tech debt". Verify existing features work as agent tools.

**Acceptance Scenarios:**

1. **Given** agent is in chat mode, **When** user asks about codebase, **Then** agent uses indexed knowledge graph
2. **Given** user asks for PR review, **When** agent processes request, **Then** existing PR review tool is invoked
3. **Given** user asks about tech debt, **When** agent analyzes, **Then** existing debt detection tool provides results
4. **Given** user asks for documentation, **When** agent generates, **Then** existing doc generator produces output

---

## Requirements

### Functional Requirements

- **FR-001:** Agent MUST default to conversational chat mode
- **FR-002:** Agent MUST have file system tools: read_file, write_file, edit_file, list_files, search_files
- **FR-003:** Agent MUST have execution tools: run_command, run_tests, debug_code
- **FR-004:** All destructive operations MUST require user permission
- **FR-005:** Permission system MUST support Allow Once, Allow Always, Decline
- **FR-006:** Permissions MUST be scoped per-project
- **FR-007:** Agent MUST support spawning sub-agents for parallel task execution
- **FR-008:** TUI MUST display token usage as animated progress bar with percentage
- **FR-009:** TUI MUST display real-time task timer in mm:ss format
- **FR-010:** Session MUST auto-compact when token context approaches limit
- **FR-011:** Compaction MUST preserve actionable summaries
- **FR-012:** Agent MUST maintain memory files: SOUL.MD, IDENTITY.MD, INFORMATION.MD, PERMISSION.MD, DIARY.MD, SKILLS.MD
- **FR-013:** Memory files MUST be stored in `~/.spectre/memory/`
- **FR-014:** New sessions MUST load memory context from previous sessions
- **FR-015:** Existing features (index, query, review, debt, docs) MUST remain functional
- **FR-016:** Agent MUST show diff preview before writing files
- **FR-017:** Agent MUST log all tool invocations for auditability
- **FR-018:** Token tracking MUST support OpenAI, Anthropic, Gemini token counting
- **FR-019:** Sub-agents MUST inherit parent permission context
- **FR-020:** `/permissions` command MUST list and manage active permissions
- **FR-021:** `/memory` command MUST display and edit memory files
- **FR-022:** `/compact` command MUST manually trigger session compaction

### Non-Functional Requirements

- **NFR-001:** Tool invocations MUST complete within 5 seconds for file operations
- **NFR-002:** Token progress bar MUST update within 100ms of token consumption
- **NFR-003:** Task timer MUST update every second with <10ms drift
- **NFR-004:** Session compaction MUST complete within 10 seconds
- **NFR-005:** Memory files MUST be loaded within 200ms of session start
- **NFR-006:** Sub-agent spawning MUST complete within 1 second
- **NFR-007:** Permission checks MUST add <5ms overhead to tool execution
- **NFR-008:** All tool outputs MUST be streamable for real-time display

### Key Entities

- **AgentTool** — Callable capability with input validation and permission gating
- **Permission** — User-granted authorization scoped to project and operation pattern
- **SubAgent** — Concurrent task executor with isolated context and shared permissions
- **TokenTracker** — Real-time token consumption monitor with progress display
- **TaskTimer** — Real-time duration tracker for operations
- **SessionCompactor** — Context summarization engine
- **MemoryFile** — Persistent agent knowledge stored in markdown format

## Success Criteria

### Measurable Outcomes

- **SC-001:** Agent can read, write, and modify files with 100% accuracy on test cases
- **SC-002:** Permission prompts appear for all destructive operations with zero false negatives
- **SC-003:** Sub-agents complete parallel tasks 2x+ faster than sequential execution
- **SC-004:** Token progress bar accurately reflects context window usage within 5% margin
- **SC-005:** Session compaction preserves 95%+ of actionable context
- **SC-006:** Memory files load and apply correctly across session restarts
- **SC-007:** All existing features remain functional after agent integration

## Assumptions

- AI providers return token usage in API responses (OpenAI, Anthropic, Gemini all support this)
- User's project directory is accessible and readable
- Shell commands execute in the current working directory context
- Sub-agents run as concurrent async tasks within the same process
- Memory files are stored in `~/.spectre/memory/` with project-specific subdirectories
