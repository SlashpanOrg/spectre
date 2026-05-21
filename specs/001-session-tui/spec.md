# Feature Specification: SPECTRE Session-Based TUI

**Feature Branch:** 001-session-tui  
**Status:** Draft  
**Created:** 2026-05-20  
**Built by:** Slashpan Technologies Private Limited  
**Contact:** sr@slashpan.com

## User Scenarios & Testing

### User Story 1 - Session Launch

As a developer, I want to run `spectre` and immediately enter an interactive session with a beautiful welcome screen so that I can start working with my codebase's institutional memory without learning multiple CLI commands.

**Why This Matters:** Scattered CLI commands create cognitive overhead. A single session-based interface is intuitive and powerful, like Claude Code or OpenCode.

**Acceptance Criteria:**

1. WHEN a developer runs `spectre` THEN they see an ASCII art octopus welcome screen with "Built by Slashpan Technologies Private Limited"
2. WHEN the session opens THEN they see a chat-like input prompt with available commands listed
3. WHEN the user types a message THEN the session processes it and displays a response
4. WHEN the user types `/help` THEN they see all available commands and shortcuts
5. WHEN the user types `/quit` or presses Ctrl+D THEN the session exits gracefully

### User Story 2 - In-Session Model Configuration

As a user, I want to configure and switch AI models within the session so that I don't need to restart or use external commands.

**Why This Matters:** Model switching should be seamless. Users may want to use different models for different tasks (cheap for indexing, premium for analysis).

**Acceptance Criteria:**

1. WHEN a user types `/setup` THEN an interactive wizard opens within the session
2. WHEN the wizard runs THEN it guides through API key input with masking
3. WHEN a provider is selected THEN available models are displayed for selection
4. WHEN a model is selected THEN it becomes active immediately in the session
5. WHEN a user types `/model` THEN they see the current model and can switch
6. WHEN a user switches models THEN the session continues without interruption

### User Story 3 - Chat with Codebase

As a developer, I want to ask natural language questions about my codebase within the session so that I get instant answers with evidence from the knowledge graph.

**Why This Matters:** Understanding codebase history and decisions should be conversational, not command-driven.

**Acceptance Criteria:**

1. WHEN a user types a question like "Why did we choose PostgreSQL?" THEN the session queries the knowledge graph
2. WHEN the response streams THEN it appears incrementally in the terminal (not all at once)
3. WHEN the answer includes evidence THEN commit hashes, authors, and dates are displayed inline
4. WHEN the user follows up with a related question THEN the session maintains context
5. WHEN the user references a previous answer THEN the session understands the reference

### User Story 4 - Tool Invocation Within Session

As a user, I want to invoke Spectre's tools (index, review, debt, docs) via slash commands within the session so that all functionality is accessible from one place.

**Why This Matters:** Users shouldn't need to exit the session to use different features. Everything should be available in-context.

**Acceptance Criteria:**

1. WHEN a user types `/index` THEN the indexing process starts within the session
2. WHEN indexing runs THEN real-time progress is displayed in the chat
3. WHEN a user types `/review` THEN PR analysis runs and results appear inline
4. WHEN a user types `/debt` THEN tech debt analysis runs and report appears inline
5. WHEN a user types `/docs runbook` THEN documentation is generated and previewed inline
6. WHEN any tool runs THEN the user can continue chatting while it processes (async)

### User Story 5 - Agentic Multi-Step Workflows

As a user, I want to ask Spectre to perform multi-step tasks (e.g., "index this repo and then analyze tech debt") so that the agent handles the workflow autonomously.

**Why This Matters:** Complex tasks require multiple tool calls. The agent should orchestrate these without manual intervention.

**Acceptance Criteria:**

1. WHEN a user requests a multi-step task THEN the agent breaks it down and executes sequentially
2. WHEN each step completes THEN progress is reported in the chat
3. WHEN the agent needs clarification THEN it pauses and asks the user
4. WHEN the user interrupts (Ctrl+C) THEN the agent stops gracefully
5. WHEN all steps complete THEN a summary is displayed

## Requirements

### Functional Requirements

- **FR-1:** System MUST open a persistent session when `spectre` is run (no subcommands)
- **FR-2:** Session MUST display ASCII art octopus welcome screen with Slashpan branding
- **FR-3:** Session MUST provide a chat-like input interface with streaming responses
- **FR-4:** Session MUST support slash commands: `/help`, `/setup`, `/model`, `/index`, `/query`, `/review`, `/debt`, `/docs`, `/status`, `/about`, `/quit`
- **FR-5:** Session MUST support model switching without restart
- **FR-6:** Session MUST maintain conversation context across messages
- **FR-7:** Session MUST support tool invocation with real-time progress display
- **FR-8:** Session MUST support agentic multi-step workflows
- **FR-9:** Session MUST support keyboard shortcuts (Ctrl+C interrupt, Ctrl+D exit, arrow history)
- **FR-10:** In-session wizard MUST guide API key configuration with masking
- **FR-11:** System MUST support OpenAI, Anthropic, and Ollama providers
- **FR-11a:** System MUST dynamically fetch available models from OpenAI API (`GET /v1/models`) and filter for chat models (gpt-*)
- **FR-11b:** System MUST dynamically fetch available models from Ollama (`GET /api/tags`) for locally downloaded models
- **FR-11c:** System MUST maintain a curated fallback list for Anthropic models (no public listing API) and allow custom model names
- **FR-11d:** The `/model` command MUST display dynamically fetched model lists from the active provider
- **FR-11e:** The `/setup` wizard MUST use dynamic model lists when guiding provider and model selection
- **FR-11f:** If a provider API is unreachable, the system MUST fall back to a curated list of known models
- **FR-11g:** Users MUST be able to enter custom model names not present in any fetched or fallback list
- **FR-11h:** Dynamically fetched model lists MUST be cached locally to reduce API calls and support offline use
- **FR-12:** System MUST index Git repositories and build knowledge graph
- **FR-13:** System MUST answer natural language questions with evidence
- **FR-14:** System MUST analyze PRs with architectural context
- **FR-15:** System MUST detect tech debt patterns
- **FR-16:** System MUST generate documentation (runbook, onboarding, decisions)
- **FR-17:** All data MUST be stored locally (no cloud dependencies)
- **FR-18:** System MUST be runnable via `npm install && spectre`
- **FR-19:** Session MUST display "Built by Slashpan Technologies Private Limited"
- **FR-20:** `/about` MUST show contact email sr@slashpan.com

### Non-Functional Requirements

- **NFR-1:** Session MUST start within 2 seconds
- **NFR-2:** Chat responses MUST stream with <500ms time-to-first-token
- **NFR-3:** Session MUST handle 100+ messages without performance degradation
- **NFR-4:** Tool execution MUST not block chat input (async processing)
- **NFR-5:** Memory usage MUST not exceed 2GB for typical sessions
- **NFR-6:** System MUST work offline after initial setup (when using local LLM)
- **NFR-7:** All API keys MUST be encrypted at rest
- **NFR-8:** System MUST be compatible with macOS, Linux, and Windows (WSL)

### Key Entities

- **Session:** A persistent interactive terminal session (REPL-like)
- **Chat Message:** A user input or AI response within the session
- **Slash Command:** A tool invocation prefixed with `/` (e.g., `/index`)
- **Tool:** A callable capability (index, query, review, debt, docs)
- **Agent:** The autonomous executor for multi-step workflows
- **Model Config:** The active AI provider and model configuration
- **Knowledge Graph:** The semantic representation of codebase history

## Success Criteria

### Measurable Outcomes

1. **Session Adoption:** 90%+ of users complete their first task within the session
2. **Model Switching:** Users switch models at least once per session on average
3. **Tool Usage:** 80%+ of sessions use at least 2 different tools
4. **Chat Satisfaction:** Users rate chat responses 4/5+ for accuracy
5. **Zero CLI Confusion:** Users never need to look up subcommand syntax

### User Experience Metrics

- Session startup time < 2 seconds
- First response time < 3 seconds
- Session stability: < 1% crash rate
- User retention: 70%+ return within 24 hours

## [NEEDS CLARIFICATION]

1. **NC-1:** Should the session support multiple panes (chat + tool output side by side) or single-pane with scrollback?
2. **NC-2:** Should slash commands support tab completion?
3. **NC-3:** Should the session support markdown rendering in responses or plain text only?
4. **NC-4:** Should chat history persist across sessions or reset each time?
5. **NC-5:** Should the session support file attachments (e.g., paste a diff for review)?

## Review & Acceptance Checklist

### Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [ ] All user stories have acceptance criteria
- [ ] Non-functional requirements are specific

### Session Design Compliance

- [ ] Single entry point (`spectre` with no subcommands)
- [ ] Chat-like interface within session
- [ ] Slash commands for all tools
- [ ] Model switching within session
- [ ] Agentic capabilities
- [ ] In-session configuration wizard

### Branding Compliance

- [ ] ASCII art octopus on session start
- [ ] Slashpan Technologies branding visible
- [ ] Contact email sr@slashpan.com accessible
- [ ] Open source attribution clear
