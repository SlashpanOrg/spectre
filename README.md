# Spectre

> Your AI-powered development companion

Spectre is a session-based TUI AI developer tool that helps you understand, review, and document your codebase. Built for developers who want to stay in flow.

**Built by Slashpan Technologies Private Limited** | Contact: sp@slashpan.com

## Features

- **Session-based TUI**: Single REPL-like session, no CLI subcommands
- **Multi-provider AI**: OpenAI, Anthropic, Ollama with dynamic model discovery
- **Codebase indexing**: Git history → vector embeddings → semantic search
- **PR review**: AI-powered branch diff analysis
- **Tech debt detection**: Code quality analysis with health scoring
- **Documentation generation**: Runbooks, onboarding guides, ADRs, architecture docs
- **Agentic workflows**: Multi-step task planning and execution

## Quick Start

```bash
# Install
npm install -g spectre

# Or run from source
git clone https://github.com/SlashpanOrg/spectre.git
cd spectre
npm install
npm run build
npm start

# Or use Docker
docker compose up spectre
```

## Commands

| Command | Description |
|---------|-------------|
| `/help` | List all available commands |
| `/about` | Show version and contact info |
| `/quit` | Exit session |
| `/setup` | Configure AI providers and API keys |
| `/model` | Switch AI model |
| `/status` | Show current configuration |
| `/index` | Index a Git repository |
| `/query <question>` | Ask about your codebase |
| `/review [base]` | Review current branch changes |
| `/debt [branch]` | Analyze technical debt |
| `/docs <type>` | Generate documentation |
| `/agent <task>` | Run multi-step agent task |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Session (REPL)                 │
├──────────┬──────────┬──────────┬────────────────┤
│ Commands │   AI     │  Tools   │    Agent       │
├──────────┼──────────┼──────────┼────────────────┤
│ /setup   │ OpenAI   │ Index    │ Orchestrator   │
│ /model   │ Anthropic│ Query    │ Planner        │
│ /review  │ Ollama   │ Review   │ Interrupt      │
│ /debt    │          │ Debt     │ Clarification  │
│ /docs    │          │ Docs     │                │
└──────────┴──────────┴──────────┴────────────────┘
┌─────────────────────────────────────────────────┐
│                 Storage Layer                     │
├──────────────────┬──────────────────────────────┤
│   Qdrant         │   SQLite                      │
│   (vectors)      │   (metadata, history)         │
└──────────────────┴──────────────────────────────┘
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build

# Lint
npm run lint

# Format
npm run format
```

## Configuration

Spectre stores configuration in `~/.spectre/config.json`. API keys are encrypted locally using AES encryption.

## Docker

```bash
# Start with Qdrant
docker compose up

# Run against a local repo
docker compose run -v $(pwd):/workspace spectre
```

## License

MIT

---

Built by **Slashpan Technologies Private Limited**
Contact: sp@slashpan.com
