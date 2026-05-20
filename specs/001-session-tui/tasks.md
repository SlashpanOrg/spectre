# Task Breakdown: SPECTRE Session-Based TUI

**Feature:** 001-session-tui  
**Generated:** 2026-05-20  
**Built by:** Slashpan Technologies Private Limited  
**Contact:** sp@slashpan.com

## Phase 1: Session Foundation (Week 1-2)

### Task 1.1: Project Setup [P]
**File:** `package.json`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc`
- Initialize Node.js project with TypeScript
- Configure ESLint + Prettier
- Configure Vitest for testing
- Set up GitHub Actions CI workflow
- Add conventional commit hooks

### Task 1.2: Session Manager [P]
**File:** `src/session/session.ts`
- Implement REPL-like session loop
- Handle session lifecycle (start, run, exit)
- Manage session state (active tools, current model, chat history)
- Implement graceful shutdown (Ctrl+D, /quit)
- Add session error boundaries

### Task 1.3: Chat Interface [P]
**File:** `src/session/chat.ts`, `src/tui/chat-view.tsx`, `src/tui/input-view.tsx`
- Build chat message display component
- Implement chat input with history (arrow keys)
- Add streaming response rendering
- Support multi-line input
- Implement chat scroll behavior

### Task 1.4: Welcome Screen [P]
**File:** `src/tui/welcome.tsx`, `src/utils/branding.ts`
- Create ASCII art octopus welcome screen
- Display "Built by Slashpan Technologies Private Limited"
- Show available commands on first launch
- Auto-transition to chat after welcome

### Task 1.5: Slash Command Parser [P]
**File:** `src/commands/parser.ts`
- Parse slash commands from chat input
- Route commands to handlers
- Support command arguments
- Handle unknown commands with suggestions
- Implement command help system

### Task 1.6: Basic Commands [P]
**File:** `src/commands/help.ts`, `src/commands/about.ts`, `src/commands/quit.ts`
- Implement `/help` — list all commands with descriptions
- Implement `/about` — show branding, version, contact
- Implement `/quit` — exit session gracefully
- Add keyboard shortcuts (Ctrl+C interrupt, Ctrl+D exit)

### Task 1.7: Status Bar [P]
**File:** `src/tui/status-bar.tsx`
- Display current model and provider
- Show session status (idle, tool running, agent active)
- Display connection status
- Update in real-time

**Checkpoint 1:** `spectre` opens session with welcome screen, chat works, `/help`, `/about`, `/quit` functional

---

## Phase 2: In-Session Configuration (Week 3)

### Task 2.1: Configuration Wizard [P]
**File:** `src/commands/setup.ts`, `src/tui/setup-wizard.tsx`
- Create `/setup` command handler
- Build interactive wizard within session
- Implement API key input with masking
- Add provider selection (OpenAI, Anthropic, Ollama)
- Implement API key validation

### Task 2.2: Model Manager [P]
**File:** `src/ai/manager.ts`
- Implement model switching without session restart
- Manage active provider and model state
- Handle provider initialization and cleanup
- Support multiple configured providers
- Persist model preferences

### Task 2.3: Dynamic Model Discovery [P]
**File:** `src/ai/model-discovery.ts`
- Implement OpenAI model fetcher: `GET https://api.openai.com/v1/models`, filter for gpt-* chat models
- Implement Ollama model fetcher: `GET http://localhost:11434/api/tags` for local models
- Implement Anthropic curated fallback list with custom model name support
- Build model cache with TTL-based refresh to reduce API calls
- Implement fallback to curated list when provider API is unreachable
- Support custom model name entry not present in any list
- Integrate model discovery with `/setup` wizard and `/model` command

### Task 2.4: Model Command [P]
**File:** `src/commands/model.ts`
- Implement `/model` command
- Display current model and provider
- Show available models for switching
- Handle model switch within session
- Validate model compatibility

### Task 2.5: AI Provider Abstraction [P]
**File:** `src/ai/provider.ts`, `src/ai/openai.ts`, `src/ai/anthropic.ts`, `src/ai/ollama.ts`
- Create provider interface
- Implement OpenAI provider with streaming
- Implement Anthropic provider with streaming
- Implement Ollama provider with streaming
- Add streaming response support for all providers

### Task 2.6: Config Persistence [P]
**File:** `src/utils/config.ts`, `src/storage/session-store.ts`
- Implement encrypted API key storage
- Create configuration file management
- Persist session preferences
- Load configuration on session start
- Handle configuration errors gracefully

**Checkpoint 2:** `/setup` configures API keys, `/model` switches models, changes take effect immediately

---

## Phase 3: Core Tools (Week 4-5)

### Task 3.1: Git Scanner [P]
**File:** `src/tools/indexer.ts`
- Implement Git repository scanning with simple-git
- Parse commit history, branches, tags
- Extract file change history per commit
- Add progress tracking for large repositories

### Task 3.2: Vector Store Integration [P]
**File:** `src/storage/vector-store.ts`
- Set up Qdrant client integration
- Implement vector embedding generation via AI providers
- Create collection management
- Add batch embedding insertion
- Implement embedding caching

### Task 3.3: Metadata Storage [P]
**File:** `src/storage/metadata-store.ts`
- Set up SQLite database schema
- Implement repository metadata storage
- Add indexing state tracking
- Create query history storage

### Task 3.4: Index Command [P]
**File:** `src/commands/index.ts`, `src/tui/progress.tsx`
- Implement `/index` command handler
- Connect Git scanner to vector store
- Add real-time progress display in session
- Implement incremental indexing
- Show indexing summary on completion

### Task 3.5: Knowledge Graph [P]
**File:** `src/tools/query-engine.ts`
- Build knowledge graph from indexed data
- Link commits, files, authors, and decisions
- Implement graph traversal algorithms
- Add semantic relationship detection

### Task 3.6: Query Command [P]
**File:** `src/commands/query.ts`
- Implement `/query` command handler
- Connect to knowledge graph for answers
- Add evidence-linked responses
- Display results inline in chat
- Support follow-up questions with context

### Task 3.7: Chat Integration for Queries [P]
**File:** `src/session/chat.ts`
- Integrate query engine with chat interface
- Stream query responses in chat
- Display evidence links inline
- Support multi-turn query conversations
- Cache query results for performance

**Checkpoint 3:** `/index` indexes repo with progress, `/query "question"` returns answers with evidence in chat

---

## Phase 4: Advanced Tools (Week 6-7)

### Task 4.1: PR Review Tool [P]
**File:** `src/tools/pr-reviewer.ts`, `src/commands/review.ts`
- Implement PR change analysis
- Build architectural context integration
- Create review suggestion generation
- Add `/review` command with inline results
- Display severity-scored comments in chat

### Task 4.2: Tech Debt Tool [P]
**File:** `src/tools/debt-detector.ts`, `src/commands/debt.ts`
- Implement tech debt pattern detection
- Create pattern classification system
- Build severity scoring algorithm
- Add `/debt` command with inline report
- Display health score and breakdown in chat

### Task 4.3: Documentation Tool [P]
**File:** `src/tools/doc-generator.ts`, `src/commands/docs.ts`
- Implement runbook, onboarding, decision log generation
- Add `/docs <type>` command
- Display generated docs inline in chat
- Support preview and export
- Show generation progress

### Task 4.4: Tool Output Display [P]
**File:** `src/tui/tool-output.tsx`
- Build tool result display component
- Support structured data rendering
- Add collapsible sections for large outputs
- Implement syntax highlighting for code snippets
- Support markdown rendering in tool output

### Task 4.5: Async Tool Execution [P]
**File:** `src/session/session.ts`
- Implement non-blocking tool execution
- Allow chat input while tools run
- Show tool progress in status bar
- Handle tool errors without crashing session
- Support multiple concurrent tools

### Task 4.6: Tool Chaining [P]
**File:** `src/commands/parser.ts`
- Support chaining tools in single command
- Pass output of one tool as input to next
- Display chain progress in chat
- Handle chain errors gracefully

**Checkpoint 4:** `/review`, `/debt`, `/docs` all work within session with inline results

---

## Phase 5: Agentic Capabilities (Week 8)

### Task 5.1: Agent Orchestrator [P]
**File:** `src/agent/orchestrator.ts`
- Implement multi-step workflow executor
- Support task decomposition
- Handle tool calling by agent
- Manage workflow state
- Report progress in chat

### Task 5.2: Task Planner [P]
**File:** `src/agent/planner.ts`
- Implement natural language task parsing
- Break down complex requests into steps
- Determine tool sequence
- Handle dependencies between steps
- Generate execution plan

### Task 5.3: Interrupt Handler [P]
**File:** `src/agent/interrupt.ts`
- Implement Ctrl+C interrupt during agent execution
- Gracefully stop current step
- Preserve partial results
- Allow user to resume or cancel
- Clean up resources on interrupt

### Task 5.4: Clarification System [P]
**File:** `src/agent/orchestrator.ts`
- Implement agent clarification requests
- Pause execution for user input
- Resume after user response
- Handle timeout for no response
- Support multiple clarification rounds

### Task 5.5: Agent Chat Integration [P]
**File:** `src/session/chat.ts`
- Integrate agent with chat interface
- Display agent progress in chat
- Show step-by-step execution
- Allow user interaction during execution
- Display final summary

**Checkpoint 5:** Agent handles multi-step requests like "index this repo and analyze tech debt"

---

## Phase 6: Polish & Release (Week 9-10)

### Task 6.1: Comprehensive Testing [P]
**File:** `tests/unit/*`, `tests/integration/*`, `tests/e2e/*`
- Write unit tests for all modules
- Create integration tests with real Git repos
- Build E2E tests for full session workflows
- Add performance benchmark tests
- Implement test coverage reporting

### Task 6.2: Performance Optimization [P]
**Files:** Multiple
- Optimize session startup time
- Improve streaming response performance
- Reduce memory footprint for long sessions
- Add chat history pagination
- Implement lazy loading for tool outputs

### Task 6.3: Documentation [P]
**Files:** `README.md`, `docs/*`, `examples/*`
- Write comprehensive README
- Create getting started guide
- Add session command reference
- Create example workflows
- Write CONTRIBUTING.md

### Task 6.4: Docker Support [P]
**Files:** `Dockerfile`, `docker-compose.yml`
- Create Dockerfile for Spectre
- Add docker-compose with Qdrant
- Implement Docker session support
- Add Docker documentation
- Test Docker deployment

### Task 6.5: Release Preparation [P]
**Files:** Multiple
- Final branding review (ASCII art, contact info)
- Version bump and changelog
- GitHub release preparation
- Security policy documentation
- CODE_OF_CONDUCT.md creation

**Checkpoint 6:** Spectre is fully functional, tested, documented, and ready for open source release

---

## Parallel Execution Groups

### Group A (Can run in parallel)
- Task 1.1: Project Setup
- Task 1.2: Session Manager
- Task 1.3: Chat Interface

### Group B (Can run in parallel)
- Task 2.1: Configuration Wizard
- Task 2.2: Model Manager
- Task 2.3: Dynamic Model Discovery
- Task 2.5: AI Provider Abstraction

### Group C (Can run in parallel)
- Task 3.1: Git Scanner
- Task 3.2: Vector Store Integration
- Task 3.3: Metadata Storage

### Group D (Can run in parallel)
- Task 4.1: PR Review Tool
- Task 4.2: Tech Debt Tool
- Task 4.3: Documentation Tool

### Group E (Can run in parallel)
- Task 5.1: Agent Orchestrator
- Task 5.2: Task Planner
- Task 5.3: Interrupt Handler

## Dependencies

```
1.1, 1.2, 1.3 → 1.4 → 1.5 → 1.6 → 1.7
1.7 → 2.1, 2.2, 2.3, 2.5 → 2.4 → 2.6
2.5 → 3.1, 3.2, 3.3 → 3.4 → 3.5 → 3.6 → 3.7
3.7 → 4.1, 4.2, 4.3 → 4.4 → 4.5 → 4.6
4.6 → 5.1, 5.2, 5.3 → 5.4 → 5.5
All → 6.1, 6.2, 6.3, 6.4 → 6.5
```
