# Implementation Plan: SPECTER Initial Release

**Feature:** 001-initial-release  
**Status:** Draft  
**Created:** 2026-05-20  
**Built by:** Slashpan Technologies Private Limited  
**Contact:** sp@slashpan.com

## Technical Context

**Language/Version:** TypeScript 5.x, Node.js 20+  
**Primary Dependencies:**
- `ink` + `react` for TUI framework
- `simple-git` for Git operations
- `@qdrant/js-client-rest` for vector storage (self-hosted Qdrant)
- `openai` + `@anthropic-ai/sdk` for AI provider support
- `commander` for CLI command parsing
- `better-sqlite3` for local metadata storage
- `tree-sitter` + `tree-sitter-typescript` for code parsing

**Storage:**
- Qdrant (self-hosted via Docker or local binary) for vector embeddings
- SQLite for metadata, configuration, and indexing state
- Local filesystem for cached analysis results

**AI Provider Support:**
- OpenAI (gpt-4o, gpt-4o-mini)
- Anthropic (claude-sonnet-4, claude-haiku)
- Local LLM via Ollama (llama3, mistral, etc.)

**Development Standards:**
- ESLint + Prettier for code quality
- Vitest for testing
- TypeScript strict mode
- Conventional commits
- Semantic versioning

## Constitution Check

### Article I: Terminal-First Design
- [x] TUI is the primary interface using Ink + React
- [x] All features accessible via CLI commands
- [x] ASCII art intro screen planned
- [x] Keyboard navigation throughout

### Article II: Self-Hosted Mandate
- [x] Qdrant runs locally (Docker or binary)
- [x] All processing happens on user machine
- [x] No cloud dependencies for core functionality
- [x] Local LLM support via Ollama

### Article III: API Key Ownership
- [x] Setup wizard for API key configuration
- [x] Multiple providers supported
- [x] Keys stored encrypted locally
- [x] No AI inference provided by Specter

### Article IV: Test-First Imperative
- [x] All implementation follows TDD
- [x] Unit, integration, and E2E tests planned
- [x] CI pipeline configured

### Article V: Easy Setup Mandate
- [x] `npm install && npm start` works
- [x] Setup wizard guides configuration
- [x] Docker support included
- [x] Clear error messages

### Article VI: Git-Native Design
- [x] Deep Git integration via simple-git
- [x] Branch-aware analysis
- [x] Commit history as first-class data
- [x] Webhook support for real-time updates

### Article VII: Simplicity Over Complexity
- [x] Maximum 3 core packages
- [x] No premature abstraction
- [x] Clear separation of concerns

### Article VIII: Documentation as Code
- [x] Auto-generated CLI help
- [x] Comprehensive README
- [x] Tested examples

### Article IX: Open Source Community Standards
- [x] CONTRIBUTING.md planned
- [x] CODE_OF_CONDUCT.md planned
- [x] Security policy planned
- [x] GitHub Actions CI/CD

## Project Structure

```
spectre/
├── src/
│   ├── cli/                    # CLI entry point and commands
│   │   ├── index.ts            # Main CLI entry
│   │   ├── commands/           # CLI commands
│   │   │   ├── init.ts         # Initialize Specter
│   │   │   ├── setup.ts        # Setup wizard (API keys, providers)
│   │   │   ├── index.ts        # Index repository
│   │   │   ├── query.ts        # Query knowledge graph
│   │   │   ├── review.ts       # PR review
│   │   │   ├── debt.ts         # Tech debt analysis
│   │   │   └── docs.ts         # Documentation generation
│   │   └── tui/                # TUI components
│   │       ├── app.tsx         # Main TUI app
│   │       ├── intro.tsx       # ASCII art intro screen
│   │       ├── query-panel.tsx # Query interface
│   │       ├── results.tsx     # Results display
│   │       └── navigation.tsx  # Keyboard navigation
│   ├── core/                   # Core business logic
│   │   ├── indexer.ts          # Git repository indexer
│   │   ├── knowledge-graph.ts  # Knowledge graph builder
│   │   ├── query-engine.ts     # Natural language query engine
│   │   ├── pr-reviewer.ts      # PR analysis engine
│   │   ├── debt-detector.ts    # Tech debt pattern detection
│   │   └── doc-generator.ts    # Documentation generation
│   ├── ai/                     # AI provider abstraction
│   │   ├── provider.ts         # Provider interface
│   │   ├── openai.ts           # OpenAI provider
│   │   ├── anthropic.ts        # Anthropic provider
│   │   ├── ollama.ts           # Local LLM provider
│   │   └── config.ts           # API key management
│   ├── storage/                # Storage layer
│   │   ├── vector-store.ts     # Qdrant vector store
│   │   ├── metadata-store.ts   # SQLite metadata store
│   │   └── cache.ts            # Local file cache
│   └── utils/                  # Shared utilities
│       ├── logger.ts           # Logging
│       ├── config.ts           # Configuration management
│       └── branding.ts         # ASCII art and branding
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests
├── docs/                       # Documentation
├── examples/                   # Example configurations
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Complexity Tracking

- **Vector Store Choice:** Qdrant selected for self-hosted capability and TypeScript support. Alternative: Weaviate.
- **TUI Framework:** Ink + React selected for component-based TUI development. Alternative: Blessed.
- **Git Library:** simple-git selected for comprehensive Git operations. Alternative: nodegit (deprecated).

## Implementation Strategy

### Phase 1: Foundation (Week 1-2)
- Project setup with TypeScript, ESLint, Prettier
- CLI framework with commander
- TUI framework with Ink + React
- ASCII art intro screen with branding
- Setup wizard for API key configuration
- Configuration management system

### Phase 2: Core Indexing (Week 3-4)
- Git repository scanning with simple-git
- Commit, branch, and file history parsing
- Vector embedding generation via AI providers
- Qdrant vector store integration
- SQLite metadata storage
- Indexing progress tracking in TUI

### Phase 3: Query Engine (Week 5-6)
- Natural language query interface
- Knowledge graph construction
- Evidence-linked answer generation
- TUI query panel with results display
- Query history and favorites

### Phase 4: Advanced Features (Week 7-8)
- PR review engine
- Tech debt pattern detection
- Documentation generation
- Webhook integration for real-time updates
- Export functionality

### Phase 5: Polish & Release (Week 9-10)
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
- [x] Single model representation for knowledge graph

### Integration-First Gate (Article IX)
- [x] Real Git repository testing planned
- [x] Real AI provider integration tests
- [x] Real Qdrant integration tests

## Test Strategy

### Unit Tests
- All core modules tested in isolation
- Mock AI providers for deterministic testing
- Mock Git repositories for indexing tests

### Integration Tests
- Real Git repository indexing
- Real AI provider queries
- Real Qdrant vector operations
- End-to-index-query cycle

### E2E Tests
- Full TUI workflow testing
- Setup wizard completion
- Query and answer flow
- PR review workflow

## Risk Mitigation

1. **Vector Store Performance:** Benchmark Qdrant with large repositories early
2. **AI Cost:** Implement query caching and response optimization
3. **Memory Usage:** Monitor and optimize for large repositories
4. **TUI Complexity:** Start simple, add features incrementally
5. **Multi-Platform:** Test on macOS, Linux, and Windows (WSL) early
