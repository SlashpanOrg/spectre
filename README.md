# Spectre

```
███████╗██████╗ ███████╗ ██████╗████████╗██████╗ ███████╗
██╔════╝██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔════╝
███████╗██████╔╝█████╗  ██║        ██║   ██████╔╝█████╗  
╚════██║██╔═══╝ ██╔══╝  ██║        ██║   ██╔══██╗██╔══╝  
███████║██║     ███████╗╚██████╗   ██║   ██║  ██║███████╗
╚══════╝╚═╝     ╚══════╝ ╚═════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝
```

> AI Development Intelligence Agent — Session-based TUI for codebase institutional memory

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/SlashpanOrg/spectre/main/install.sh | bash
```

## Usage

```bash
spectre              # Launch interactive TUI
spectre --version    # Show version
spectre --help       # Show help
```

Run `/setup` inside Spectre to configure your AI provider.

## Features

- **Full-screen TUI** — React-based terminal UI with Ink framework
- **Streaming AI responses** — Token-by-token rendering
- **Multi-provider AI** — OpenAI, Anthropic, Google Gemini, Ollama with dynamic model discovery
- **Codebase indexing** — Git history → vector embeddings → semantic search
- **PR review** — AI-powered branch diff analysis
- **Tech debt detection** — Code quality analysis with health scoring
- **Documentation generation** — Runbooks, onboarding guides, ADRs
- **Agentic workflows** — Multi-step task planning and execution

## Commands

| Command | Description |
|---------|-------------|
| `/setup` | Configure AI providers and API keys |
| `/model` | Open interactive model switcher |
| `/index` | Index a Git repository |
| `/query <question>` | Ask about your codebase |
| `/review [base]` | Review current branch changes |
| `/debt [branch]` | Analyze technical debt |
| `/docs <type>` | Generate documentation |
| `/agent <task>` | Run multi-step agent task |
| `/help` | List all commands |
| `/quit` | Exit session |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Command palette |
| `Ctrl+G` | Toggle side panel |
| `Ctrl+C` | Cancel streaming |
| `Ctrl+Q` | Quit |

## Development

```bash
npm install
npm run build
npm test
```

---

**MIT License** · Built by **Slashpan Technologies Private Limited** · [sp@slashpan.com](mailto:sp@slashpan.com)
