# SPECTER Project Constitution

## Project Identity

**Project Name:** Spectre  
**Version:** 0.1.0  
**Created:** 2026-05-20  
**Built by:** Slashpan Technologies Private Limited  
**Contact:** sp@slashpan.com  
**Repository:** https://github.com/SlashpanOrg/spectre  
**License:** MIT (Open Source)

## Mission Statement

Spectre is a self-hosted AI Development Intelligence Agent that becomes your team's institutional memory. It runs as a persistent session-based TUI (like Claude Code / OpenCode) where you chat with your codebase's knowledge graph, index repositories, review PRs, detect tech debt, and generate documentation — all within a single interactive terminal session.

## Core Values

1. **Session-First Design** — One command opens everything; no scattered CLI subcommands
2. **Privacy First** — All data stays on user infrastructure
3. **Open Source** — Fully transparent, community-driven development
4. **User-Owned AI** — Users bring their own API keys or local models
5. **Developer Experience** — Sophisticated TUI with chat, tools, and agentic capabilities

## Articles of Development

### Article I: Session-Based TUI Mandate

Spectre MUST be a persistent session-based terminal application, NOT a collection of CLI subcommands.

- Running `spectre` opens a single interactive session (REPL-like)
- ALL functionality is accessed within the session — no external subcommands
- Session must support chat-like interface with streaming responses
- Session must support slash commands for tool invocation (e.g., `/index`, `/query`, `/review`)
- Session must support model switching without restarting
- Session must support tool calling from within the chat
- Session must maintain context across interactions
- Session must have a beautiful ASCII art welcome screen with Slashpan branding
- Session must support keyboard navigation and shortcuts
- Session must be responsive with no perceptible lag

### Article II: In-Session Configuration Wizard

All configuration MUST be accessible within the session.

- `/setup` or `/config` command opens API key configuration wizard
- Users can link/unlink API keys (OpenAI, Anthropic, Google, etc.) within session
- Users can switch models within session without restarting
- Local LLM (Ollama) configuration accessible within session
- All configuration changes take effect immediately in the session
- Configuration persists across sessions

### Article III: Chat-First Interaction Model

The primary interaction mode is conversational chat within the session.

- Users type natural language questions/commands in the chat
- AI responds with streaming text in the terminal
- Chat history is maintained within the session
- Users can reference previous messages in the conversation
- Multi-turn conversations are supported
- Responses include evidence links, code references, and structured data

### Article IV: Tool Calling Within Session

Spectre MUST expose its capabilities as callable tools within the session.

- Tools are invoked via slash commands or natural language
- Available tools: index, query, review, debt, docs, setup, status
- Tool results are displayed inline in the chat
- Tools can be chained or composed within a single session
- Tool parameters can be specified inline or via interactive prompts
- Tool execution progress is shown in real-time

### Article V: Agentic Capabilities

Spectre MUST support agentic workflows within the session.

- Agent can autonomously execute multi-step tasks when requested
- Agent can call tools on behalf of the user
- Agent can report progress and ask for clarification
- Agent can maintain state across multiple actions
- Users can interrupt agent execution at any time

### Article VI: Self-Hosted Mandate

Spectre MUST run entirely on user infrastructure. No cloud dependencies for core functionality.

- All data processing happens locally
- Vector store runs locally (Qdrant/Weaviate self-hosted)
- No telemetry without explicit opt-in
- API keys are stored locally and never transmitted
- Local LLM support is first-class, not secondary

### Article VII: API Key Ownership

Users MUST provide their own AI API keys or configure local models. Spectre never provides AI inference.

- Support OpenAI, Anthropic, Google (Gemini), and other providers
- Support local models via Ollama, LM Studio, etc.
- In-session wizard guides users through API key configuration
- Multiple API keys can be configured and switched within session
- Local LLM configuration must be equally polished

### Article VIII: Dynamic Model Discovery

Spectre MUST dynamically fetch available models from each provider's API rather than relying on hardcoded lists.

- OpenAI: `GET https://api.openai.com/v1/models` — fetch all models, filter for chat models (gpt-*)
- Anthropic: No public model listing API exists — maintain a curated fallback list but allow custom model names
- Google Gemini: `GET https://generativelanguage.googleapis.com/v1beta/models` — fetch all models, filter for generative models (gemini-*)
- Ollama: `GET http://localhost:11434/api/tags` — fetch locally downloaded models
- The `/model` command MUST display dynamically fetched model lists
- The `/setup` wizard MUST use dynamic model lists for provider selection
- If a provider API is unreachable, fall back to a curated list of known models
- Users MUST be able to enter custom model names not present in any list
- Model lists MUST be cached locally to reduce API calls and support offline use

### Article IX: Git-Native Design

Spectre MUST integrate deeply with Git workflows.

- Git repository scanning is core functionality
- Branch-aware analysis
- Commit history as first-class data source
- GitHub, GitLab, and self-hosted Git support

### Article X: Test-First Imperative

This is NON-NEGOTIABLE: All implementation MUST follow strict Test-Driven Development.

- Unit tests written before implementation
- Integration tests for all external connectors
- E2E tests for TUI session workflows
- Tests must pass on CI before merge

## Branding Requirements

- ASCII art octopus logo displayed on session start
- "Built by Slashpan Technologies Private Limited" visible in session
- Contact email: sp@slashpan.com accessible via `/about` command
- GitHub repository URL visible in session

## Technical Standards

- TypeScript for all application code
- ESLint + Prettier for code quality
- Semantic versioning for releases
- Conventional commits for commit messages
- GitHub Actions for CI/CD

## Amendment Process

Modifications to this constitution require:
- Explicit documentation of the rationale for change
- Review and approval by project maintainers
- Backwards compatibility assessment
- Version bump and changelog entry
