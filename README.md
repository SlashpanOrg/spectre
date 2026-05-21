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

When you run `/setup`, an interactive Hermes-like wizard appears:

1. **Select Provider** - Arrow keys to navigate, Enter to select
2. **Enter API Key** - Type your key; the TUI masks it and stores it encrypted locally
3. **Select Model** - Scrollable list with fuzzy search (press `/` or `Tab` to filter)
4. **Complete** - Provider configured, with next-step hints for `/model` and `/agent`

### Model Switching

Use `/model` to open an interactive model switcher for the active provider:

- It discovers models from the provider when possible
- It falls back to the current/default model when discovery is unavailable
- Use `↑/↓` to navigate, `/` or `Tab` to filter, `Enter` to switch, `Esc` to cancel
- You can still switch directly with `/model <name>`

### Agent Task Assignment

Use `/agent <task>` to assign a multi-step workflow to Spectre. The TUI now keeps a single task card updated with:

- Assigned task description
- Planning/running/completed/failed status
- Completed step count
- Current step or failure reason
- Final step summary

Agent-planned tools now dispatch through Spectre's real command handlers instead of placeholder strings:

- `index` → `/index`
- `query` → `/query`
- `review` → `/review`
- `debt` → `/debt`
- `docs` → `/docs`

### Sessions

Spectre creates a saved TUI session on launch and persists user/tool messages under the Spectre config directory. Use:

- `/new [title]` to start a fresh saved session
- `/sessions` to list recent sessions
- `/resume <session-id>` to show recent messages from a session

The status bar shows both the active provider/model and current session id.

## Commands

| Command | Description |
|---------|-------------|
| `/help` | List all available commands |
| `/about` | Show version and contact info |
| `/quit` | Exit session |
| `/new [title]` | Start a fresh saved chat session |
| `/sessions` | List saved chat sessions |
| `/resume <id>` | Show recent messages from a saved session |
| `/setup` | Configure AI providers and API keys |
| `/model` | Open interactive model switcher |
| `/model <name>` | Switch directly to model name |
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

Spectre stores configuration in `~/.spectre/config.json` with private permissions (`0700` directory, `0600` config file). API keys are encrypted locally before being written. Repository indexing state and saved TUI sessions are stored under the Spectre config directory rather than mutating indexed repositories.

Set `SPECTRE_QDRANT_URL` to override the default Qdrant URL, for example inside Docker Compose: `SPECTRE_QDRANT_URL=http://qdrant:6333`.

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
