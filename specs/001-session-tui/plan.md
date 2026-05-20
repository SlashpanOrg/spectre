# Implementation Plan: SPECTRE Session-Based TUI

**Feature:** 001-session-tui  
**Status:** Draft  
**Created:** 2026-05-20  
**Built by:** Slashpan Technologies Private Limited  
**Contact:** sp@slashpan.com

## Technical Context

**Language/Version:** TypeScript 5.x, Node.js 20+  
**Primary Dependencies:**
- `ink` + `react` for TUI framework (session rendering)
- `ink-text-input` for chat input with history
- `simple-git` for Git operations
- `@qdrant/js-client-rest` for vector storage
- `openai` + `@anthropic-ai/sdk` for AI provider support
- `better-sqlite3` for local metadata and session state
- `chalk` for terminal styling
- `ora` for spinners (tool progress)

**Architecture:**
- Single entry point: `spectre` command opens persistent session
- Session manager handles REPL loop, chat history, and command routing
- Chat interface with streaming AI responses
- Slash command parser routes to tool executors
- Tool executors run async and report progress inline
- Agent orchestrator handles multi-step workflows
- Model manager handles provider switching

**Storage:**
- Qdrant (self-hosted) for vector embeddings
- SQLite for metadata, configuration, session state
- Local filesystem for cached analysis results

**AI Provider Support:**
- OpenAI: dynamic model listing via `GET /v1/models`, filtered for chat models (gpt-*)
- Anthropic: curated fallback list (claude-sonnet-4, claude-haiku, etc.) with custom model name support
- Ollama: dynamic model listing via `GET /api/tags` for locally downloaded models
- Model lists cached locally with TTL-based refresh

**Development Standards:**
- ESLint + Prettier for code quality
- Vitest for testing
- TypeScript strict mode
- Conventional commits
- Semantic versioning

## Constitution Check

### Article I: Session-Based TUI Mandate
- [x] Single `spectre` command opens persistent session
- [x] All functionality accessed within session via slash commands
- [x] Chat-like interface with streaming responses
- [x] Model switching without restart
- [x] Tool calling from within chat
- [x] Context maintained across interactions
- [x] ASCII art octopus welcome screen
- [x] Keyboard navigation and shortcuts

### Article II: In-Session Configuration Wizard
- [x] `/setup` opens API key wizard within session
- [x] Link/unlink API keys within session
- [x] Switch models within session
- [x] Ollama configuration within session
- [x] Changes take effect immediately

### Article III: Chat-First Interaction Model
- [x] Natural language input as primary interaction
- [x] Streaming AI responses
- [x] Chat history maintained
- [x] Multi-turn conversations
- [x] Evidence links in responses

### Article IV: Tool Calling Within Session
- [x] Slash commands for all tools
- [x] Inline tool results
- [x] Tool chaining support
- [x] Real-time progress display
- [x] Interactive parameter prompts

### Article V: Agentic Capabilities
- [x] Multi-step task execution
- [x] Tool calling by agent
- [x] Progress reporting
- [x] Clarification requests
- [x] User interrupt support

### Article VI: Self-Hosted Mandate
- [x] Qdrant runs locally
- [x] All processing on user machine
- [x] No cloud dependencies
- [x] Local LLM support

### Article VII: API Key Ownership
- [x] In-session wizard for configuration
- [x] Multiple providers supported
- [x] Keys stored encrypted locally
- [x] No AI inference provided by Spectre

### Article VIII: Dynamic Model Discovery
- [x] OpenAI model listing via `GET /v1/models` with gpt-* filtering
- [x] Ollama model listing via `GET /api/tags` for local models
- [x] Anthropic curated fallback list with custom model name support
- [x] `/model` command uses dynamic model lists
- [x] `/setup` wizard uses dynamic model lists
- [x] Fallback to curated list when API unreachable
- [x] Custom model name entry supported
- [x] Local caching of model lists

### Article IX: Git-Native Design
- [x] Deep Git integration
- [x] Branch-aware analysis
- [x] Commit history as first-class data

### Article X: Test-First Imperative
- [x] All implementation follows TDD
- [x] Unit, integration, and E2E tests
- [x] CI pipeline configured

## Project Structure

```
spectre/
├── src/
│   ├── session/                # Session management
│   │   ├── session.ts          # Main session manager (REPL loop)
│   │   ├── chat.ts             # Chat interface component
│   │   ├── history.ts          # Chat history management
│   │   └── shortcuts.ts        # Keyboard shortcut handler
│   ├── commands/               # Slash command handlers
│   │   ├── parser.ts           # Slash command parser
│   │   ├── help.ts             # /help command
│   │   ├── setup.ts            # /setup command (config wizard)
│   │   ├── model.ts            # /model command (switch model)
│   │   ├── index.ts            # /index command
│   │   ├── query.ts            # /query command
│   │   ├── review.ts           # /review command
│   │   ├── debt.ts             # /debt command
│   │   ├── docs.ts             # /docs command
│   │   ├── status.ts           # /status command
│   │   ├── about.ts            # /about command
│   │   └── quit.ts             # /quit command
│   ├── tools/                  # Tool executors
│   │   ├── indexer.ts          # Git indexing tool
│   │   ├── query-engine.ts     # Knowledge graph query tool
│   │   ├── pr-reviewer.ts      # PR review tool
│   │   ├── debt-detector.ts    # Tech debt tool
│   │   └── doc-generator.ts    # Documentation tool
│   ├── agent/                  # Agentic capabilities
│   │   ├── orchestrator.ts     # Multi-step workflow executor
│   │   ├── planner.ts          # Task decomposition
│   │   └── interrupt.ts        # User interrupt handler
│   ├── ai/                     # AI provider abstraction
│   │   ├── provider.ts         # Provider interface
│   │   ├── openai.ts           # OpenAI provider
│   │   ├── anthropic.ts        # Anthropic provider
│   │   ├── ollama.ts           # Local LLM provider
│   │   ├── manager.ts          # Model switching manager
│   │   ├── config.ts           # API key management
│   │   └── model-discovery.ts  # Dynamic model fetching & caching
│   ├── storage/                # Storage layer
│   │   ├── vector-store.ts     # Qdrant vector store
│   │   ├── metadata-store.ts   # SQLite metadata store
│   │   └── session-store.ts    # Session state persistence
│   ├── tui/                    # TUI components
│   │   ├── app.tsx             # Main TUI app (session view)
│   │   ├── welcome.tsx         # ASCII art welcome screen
│   │   ├── chat-view.tsx       # Chat message display
│   │   ├── input-view.tsx      # Chat input with history
│   │   ├── tool-output.tsx     # Tool result display
│   │   ├── progress.tsx        # Tool progress spinner
│   │   └── status-bar.tsx      # Session status bar
│   └── utils/                  # Shared utilities
│       ├── branding.ts         # ASCII art and branding
│       ├── config.ts           # Configuration management
│       └── logger.ts           # Logging
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                    # Session E2E tests
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Implementation Strategy

### Phase 1: Session Foundation (Week 1-2)
- Session manager with REPL loop
- Chat interface with streaming responses
- ASCII art octopus welcome screen
- Slash command parser
- Keyboard shortcuts (Ctrl+C, Ctrl+D, arrow history)
- `/help`, `/about`, `/quit` commands
- Session state management

### Phase 2: In-Session Configuration (Week 3)
- `/setup` command with interactive wizard
- API key input with masking
- Provider selection and dynamic model listing
  - OpenAI: fetch `GET /v1/models`, filter for gpt-* chat models
  - Anthropic: use curated fallback list, allow custom model names
  - Ollama: fetch `GET /api/tags` for local models
- `/model` command for switching models with dynamic model lists
- Model discovery module with provider-specific fetchers
- Local model cache with TTL-based refresh
- Fallback to curated list when provider API unreachable
- Custom model name entry support
- Model manager for provider switching
- Configuration persistence

### Phase 3: Core Tools (Week 4-5)
- `/index` command with Git scanner and Qdrant
- `/query` command with knowledge graph
- Chat integration for natural language queries
- Tool progress display in session
- Async tool execution without blocking chat

### Phase 4: Advanced Tools (Week 6-7)
- `/review` command for PR analysis
- `/debt` command for tech debt detection
- `/docs` command for documentation generation
- Tool result display in chat
- Tool chaining support

### Phase 5: Agentic Capabilities (Week 8)
- Agent orchestrator for multi-step workflows
- Task decomposition and planning
- Progress reporting and clarification requests
- User interrupt handling
- Workflow state management

### Phase 6: Polish & Release (Week 9-10)
- Comprehensive testing
- Performance optimization
- Documentation
- Docker support
- Release preparation

## Phase -1: Pre-Implementation Gates

### Simplicity Gate (Article VII)
- [x] Using 1 main package with internal modules
- [x] No future-proofing abstractions
- [x] Clear separation of concerns

### Anti-Abstraction Gate (Article VIII)
- [x] Using frameworks directly (Ink, commander, simple-git)
- [x] Single model representation for session state

### Integration-First Gate (Article IX)
- [x] Real Git repository testing planned
- [x] Real AI provider integration tests
- [x] Real Qdrant integration tests
- [x] E2E session workflow tests

## Test Strategy

### Unit Tests
- Session manager tested in isolation
- Slash command parser tested with various inputs
- Tool executors tested with mock data
- Model manager tested with provider switching

### Integration Tests
- Real Git repository indexing within session
- Real AI provider queries within session
- Real Qdrant vector operations within session
- End-to-session-tool-execution cycle

### E2E Tests
- Full session workflow testing
- Welcome screen display
- Chat interaction flow
- Slash command execution
- Model switching within session
- Tool chaining within session
- Agent multi-step workflow

## Risk Mitigation

1. **Session Stability:** Implement error boundaries and graceful recovery
2. **Streaming Performance:** Optimize React rendering for streaming responses
3. **Memory Management:** Clear chat history after configurable threshold
4. **Tool Blocking:** Ensure all tools run async and don't block chat input
5. **Multi-Platform:** Test session on macOS, Linux, and Windows (WSL) early
