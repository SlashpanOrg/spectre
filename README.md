# Spectre

> Your AI-powered development companion

Spectre is a session-based TUI AI developer tool that helps you understand, review, and document your codebase. Built for developers who want to stay in flow.

**Built by Slashpan Technologies Private Limited** | Contact: sp@slashpan.com

## Features

- **Full-screen TUI**: React-based terminal UI with Ink framework
- **Interactive setup wizard**: Scrollable, searchable provider/model selection
- **Streaming AI responses**: Token-by-token response rendering
- **Multi-provider AI**: OpenAI, Anthropic, Google Gemini, Ollama with dynamic model discovery
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

## TUI Architecture

Spectre uses a React-based terminal UI built with [Ink](https://github.com/vadimdemedes/ink):

```
┌─────────────────────────────────────────────────┐
│                    Spectre TUI                    │
├─────────────────────────────────────────────────┤
│  Header (branding, provider, model)              │
├─────────────────────────────────────────────────┤
│                                                   │
│  Chat View (messages, streaming responses)        │
│  ┌─────────────────────────────────────────────┐ │
│  │ User: /index this repo                       │ │
│  │ AI: ✓ Indexed 42 commits...                  │ │
│  │                                              │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
├─────────────────────────────────────────────────┤
│  Setup Wizard (when /setup is triggered)         │
│  ▸ OpenAI                                        │
│    Anthropic                                     │
│    Google Gemini                                 │
│    Ollama                                        │
├─────────────────────────────────────────────────┤
│  Status Bar [provider:model] Ctrl+Q to quit      │
└─────────────────────────────────────────────────┘
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Q` | Quit |
| `↑/↓` | Navigate command history |
| `Tab` | Autocomplete |
| `Esc` | Cancel operation |

### Setup Wizard

When you run `/setup`, an interactive wizard appears:

1. **Select Provider** - Arrow keys to navigate, Enter to select
2. **Enter API Key** - Type your key (encrypted locally)
3. **Select Model** - Scrollable list with fuzzy search (press `/` or `Tab` to filter)
4. **Complete** - Provider configured!

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
│                   Spectre TUI (Ink/React)         │
├──────────┬──────────┬──────────┬────────────────┤
│ Commands │   AI     │  Tools   │    Agent       │
├──────────┼──────────┼──────────┼────────────────┤
│ /setup   │ OpenAI   │ Index    │ Orchestrator   │
│ /model   │ Anthropic│ Query    │ Planner        │
│ /review  │ Gemini   │ Review   │ Streaming      │
│ /debt    │ Ollama   │ Debt     │ Interrupt      │
│ /docs    │          │ Docs     │ Clarification  │
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
