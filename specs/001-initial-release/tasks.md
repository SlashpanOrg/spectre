# Task Breakdown: SPECTER Initial Release

**Feature:** 001-initial-release  
**Generated:** 2026-05-20  
**Built by:** Slashpan Technologies Private Limited  
**Contact:** sp@slashpan.com

## Phase 1: Foundation (Week 1-2)

### Task 1.1: Project Setup [P]
**File:** `package.json`, `tsconfig.json`, `vitest.config.ts`, `.eslintrc.js`, `.prettierrc`
- Initialize Node.js project with TypeScript
- Configure ESLint + Prettier
- Configure Vitest for testing
- Set up GitHub Actions CI workflow
- Add conventional commit hooks

### Task 1.2: CLI Framework [P]
**File:** `src/cli/index.ts`, `src/cli/commands/*.ts`
- Set up commander.js CLI structure
- Create command stubs: init, setup, index, query, review, debt, docs
- Implement help system with auto-generation
- Add version and about commands with branding

### Task 1.3: TUI Framework [P]
**File:** `src/cli/tui/app.tsx`, `src/cli/tui/intro.tsx`
- Set up Ink + React TUI framework
- Create ASCII art intro screen with "Built by Slashpan Technologies Private Limited"
- Implement main TUI app shell
- Add keyboard navigation foundation
- Create branding utilities (`src/utils/branding.ts`)

### Task 1.4: Setup Wizard [P]
**File:** `src/cli/commands/setup.ts`, `src/cli/tui/setup-wizard.tsx`
- Create interactive setup wizard TUI component
- Implement API key input with masking
- Add provider selection (OpenAI, Anthropic, Ollama)
- Implement API key validation
- Create configuration storage (`src/utils/config.ts`)
- Add local LLM (Ollama) configuration flow

### Task 1.5: Configuration Management [P]
**File:** `src/utils/config.ts`, `src/ai/config.ts`
- Implement configuration file management
- Add encrypted API key storage
- Create provider configuration schema
- Implement multi-provider support
- Add configuration validation

**Checkpoint 1:** `spectre init` shows intro, `spectre setup` guides through API key config, configuration persists

---

## Phase 2: Core Indexing (Week 3-4)

### Task 2.1: Git Repository Scanner [P]
**File:** `src/core/indexer.ts`
- Implement Git repository scanning with simple-git
- Parse commit history (hash, author, message, date, files)
- Parse branch and tag information
- Extract file change history per commit
- Add progress tracking for large repositories

### Task 2.2: Vector Store Integration [P]
**File:** `src/storage/vector-store.ts`
- Set up Qdrant client integration
- Implement vector embedding generation via AI providers
- Create collection management (create, delete, query)
- Add batch embedding insertion
- Implement embedding caching

### Task 2.3: Metadata Storage [P]
**File:** `src/storage/metadata-store.ts`
- Set up SQLite database schema
- Implement repository metadata storage
- Add indexing state tracking
- Create query history storage
- Implement data migration support

### Task 2.4: Indexing Pipeline [P]
**File:** `src/core/indexer.ts`, `src/cli/commands/index.ts`
- Connect Git scanner to vector store
- Implement incremental indexing (only new commits)
- Add indexing progress display in TUI
- Implement indexing pause/resume
- Add indexing statistics and summary

### Task 2.5: Index Command & TUI [P]
**File:** `src/cli/commands/index.ts`, `src/cli/tui/index-panel.tsx`
- Create `spectre index` CLI command
- Build TUI panel for indexing progress
- Add repository connection management
- Implement indexing status display
- Add error handling and recovery

**Checkpoint 2:** `spectre index` scans a Git repo, stores embeddings in Qdrant, progress visible in TUI

---

## Phase 3: Query Engine (Week 5-6)

### Task 3.1: Knowledge Graph Builder [P]
**File:** `src/core/knowledge-graph.ts`
- Build knowledge graph from indexed data
- Link commits, files, authors, and decisions
- Implement graph traversal algorithms
- Add semantic relationship detection
- Create graph serialization

### Task 3.2: Query Engine [P]
**File:** `src/core/query-engine.ts`
- Implement natural language query processing
- Connect to AI providers for query understanding
- Build evidence retrieval from knowledge graph
- Implement answer generation with evidence links
- Add query caching for performance

### Task 3.3: Query Command & TUI [P]
**File:** `src/cli/commands/query.ts`, `src/cli/tui/query-panel.tsx`, `src/cli/tui/results.tsx`
- Create `spectre query` CLI command
- Build TUI query interface with input field
- Implement results display with evidence links
- Add query history navigation
- Create interactive result exploration

### Task 3.4: Evidence Linking [P]
**File:** `src/core/query-engine.ts`, `src/cli/tui/results.tsx`
- Implement commit-level evidence linking
- Add PR description and comment references
- Create file-level code references
- Implement evidence confidence scoring
- Add evidence display in TUI

### Task 3.5: Query Optimization [P]
**File:** `src/core/query-engine.ts`, `src/storage/cache.ts`
- Implement query result caching
- Add response streaming for long queries
- Optimize vector search performance
- Implement query timeout handling
- Add query cost tracking

**Checkpoint 3:** `spectre query "why did we choose X?"` returns answer with evidence links in TUI

---

## Phase 4: Advanced Features (Week 7-8)

### Task 4.1: PR Review Engine [P]
**File:** `src/core/pr-reviewer.ts`
- Implement PR change analysis
- Build architectural context integration
- Create review suggestion generation
- Add code-level feedback with references
- Implement review severity classification

### Task 4.2: PR Review Command & TUI [P]
**File:** `src/cli/commands/review.ts`, `src/cli/tui/review-panel.tsx`
- Create `spectre review` CLI command
- Build TUI review display panel
- Implement review navigation
- Add review export functionality
- Create review summary generation

### Task 4.3: Tech Debt Detector [P]
**File:** `src/core/debt-detector.ts`
- Implement tech debt pattern detection
- Create pattern classification system
- Build severity scoring algorithm
- Add pattern evidence collection
- Implement debt trend analysis

### Task 4.4: Tech Debt Command & TUI [P]
**File:** `src/cli/commands/debt.ts`, `src/cli/tui/debt-panel.tsx`
- Create `spectre debt` CLI command
- Build TUI debt report display
- Implement debt navigation and filtering
- Add debt trend visualization
- Create debt export functionality

### Task 4.5: Documentation Generator [P]
**File:** `src/core/doc-generator.ts`
- Implement runbook generation from codebase
- Create onboarding guide generation
- Build decision log extraction
- Add documentation template system
- Implement multi-format export (markdown, PDF)

### Task 4.6: Docs Command & TUI [P]
**File:** `src/cli/commands/docs.ts`, `src/cli/tui/docs-panel.tsx`
- Create `spectre docs` CLI command
- Build TUI documentation browser
- Implement doc generation progress display
- Add doc export and sharing
- Create doc template customization

### Task 4.7: Webhook Integration [P]
**File:** `src/core/webhook-handler.ts`
- Implement webhook server for real-time updates
- Add GitHub webhook event handling
- Create automatic re-indexing on push
- Implement webhook security (secret validation)
- Add webhook configuration in TUI

**Checkpoint 4:** All advanced features accessible via CLI and TUI with proper branding

---

## Phase 5: Polish & Release (Week 9-10)

### Task 5.1: Comprehensive Testing [P]
**File:** `tests/unit/*`, `tests/integration/*`, `tests/e2e/*`
- Write unit tests for all core modules
- Create integration tests with real Git repos
- Build E2E tests for TUI workflows
- Add performance benchmark tests
- Implement test coverage reporting

### Task 5.2: Performance Optimization [P]
**Files:** Multiple
- Optimize indexing for large repositories
- Improve query response times
- Reduce memory footprint
- Add connection pooling for Qdrant
- Implement lazy loading for large results

### Task 5.3: Documentation [P]
**Files:** `README.md`, `docs/*`, `examples/*`
- Write comprehensive README
- Create getting started guide
- Add API documentation
- Create example configurations
- Write CONTRIBUTING.md

### Task 5.4: Docker Support [P]
**Files:** `Dockerfile`, `docker-compose.yml`
- Create Dockerfile for Specter
- Add docker-compose with Qdrant
- Implement Docker configuration wizard
- Add Docker documentation
- Test Docker deployment

### Task 5.5: Release Preparation [P]
**Files:** Multiple
- Final branding review (ASCII art, contact info)
- Version bump and changelog
- GitHub release preparation
- Security policy documentation
- CODE_OF_CONDUCT.md creation

**Checkpoint 5:** Specter is fully functional, tested, documented, and ready for open source release

---

## Parallel Execution Groups

### Group A (Can run in parallel)
- Task 1.1: Project Setup
- Task 1.2: CLI Framework
- Task 1.3: TUI Framework

### Group B (Can run in parallel)
- Task 2.1: Git Repository Scanner
- Task 2.2: Vector Store Integration
- Task 2.3: Metadata Storage

### Group C (Can run in parallel)
- Task 3.1: Knowledge Graph Builder
- Task 3.2: Query Engine

### Group D (Can run in parallel)
- Task 4.1: PR Review Engine
- Task 4.3: Tech Debt Detector
- Task 4.5: Documentation Generator

## Dependencies

```
1.1, 1.2, 1.3 → 1.4 → 1.5
1.5 → 2.1, 2.2, 2.3 → 2.4 → 2.5
2.5 → 3.1, 3.2 → 3.3, 3.4 → 3.5
3.5 → 4.1, 4.3, 4.5 → 4.2, 4.4, 4.6, 4.7
All → 5.1, 5.2, 5.3, 5.4 → 5.5
```
