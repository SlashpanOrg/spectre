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
- **Coding Agent** — Conversational agent with 13 built-in tools
- **Dynamic Tool Creation** — Agent can generate restart-ready tools when it detects a capability gap
- **Telegram Gateway** — Optional background gateway for Telegram bot messages
- **Permission System** — Per-project Allow Once/Always/Decline for destructive operations
- **Sub-Agents** — Concurrent task execution for complex workflows
- **Session Compaction** — Auto-summarization at token thresholds
- **Agent Memory** — Persistent SOUL.MD, IDENTITY.MD, DIARY.MD across sessions
- **Token Tracking** — Real-time progress bar with context window awareness
- **Task Timer** — Real-time mm:ss operation duration display

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
| `/tool <prompt>` | Create a dynamic tool explicitly |
| `/tools list` | List restart-ready dynamic tools |
| `/tools inspect <name>` | Show generated tool source |
| `/tools remove <name>` | Remove a generated tool |
| `/gateway start <token>` | Start Telegram gateway |
| `/gateway stop` | Stop Telegram gateway |
| `/memory` | View and edit agent memory files |
| `/compact` | Manually compact conversation |
| `/permissions` | List and manage permissions |
| `/help` | List all commands |
| `/quit` | Exit session |

## Agent Tools

The coding agent has 13 built-in tools:

| Tool | Description | Permission |
|------|-------------|------------|
| `read_file` | Read file contents with line numbers | No |
| `write_file` | Write content to file with diff preview | Yes |
| `edit_file` | Search/replace, insert, delete in files | Yes |
| `list_files` | List directory contents | No |
| `search_files` | Search text patterns across files | No |
| `run_command` | Execute shell commands | Yes |
| `run_tests` | Execute test suites | Yes |
| `debug_code` | Run code with verbose output | Yes |
| `index_repo` | Index Git repository | No |
| `query_codebase` | Semantic codebase search | No |
| `review_pr` | Review PR/branch changes | No |
| `analyze_debt` | Technical debt analysis | No |
| `generate_docs` | Generate documentation | No |
| `create_tool` | Generate restart-ready dynamic tools | Yes |

## Dynamic Tools

Spectre can generate tools during a session when it detects a capability gap, or explicitly with `/tool <prompt>`.

Generated tools are compiled and stored under `~/.spectre/tools/`, but they are linked only when Spectre starts. After a tool is created, restart Spectre now or later to make it executable.

Commands:
- `/tool <prompt>` creates a restart-ready tool
- `/tools list` shows generated tools
- `/tools inspect <name>` shows generated source
- `/tools remove <name>` deletes a generated tool

This restart boundary avoids unsafe current-process code injection while still allowing automated runtime tool creation.

## Telegram Gateway

Create a Telegram bot with `@BotFather`, then start the gateway:

```bash
spectre gateway start <BOT_TOKEN>
```

The gateway runs in the background and can be managed with:

```bash
spectre gateway status
spectre gateway logs
spectre gateway stop
```

## Permission System

Destructive operations (`write_file`, `edit_file`, `run_command`, `run_tests`, `debug_code`) require permission:

- **Allow Once** — Permit this single invocation
- **Allow Always** — Permit all future invocations (persisted per-project)
- **Decline** — Block this invocation

Permissions are stored in `~/.spectre/projects/<hash>/permissions.json` with 0600 permissions.

## Agent Memory

Memory files are stored in `~/.spectre/memory/<project>/`:

| File | Purpose |
|------|---------|
| `SOUL.MD` | Agent personality and communication style |
| `IDENTITY.MD` | Role, capabilities, and limitations |
| `INFORMATION.MD` | Project knowledge and architecture |
| `PERMISSION.MD` | Active permissions and trust levels |
| `DIARY.MD` | Interaction history and lessons learned |
| `SKILLS.MD` | Capabilities and learned patterns |

Memory persists across sessions and is loaded into the system prompt on startup.

## Session Compaction

When token usage reaches 80% of the context window, the agent automatically:
1. Summarizes conversation history using the LLM
2. Preserves key decisions, file changes, and action items
3. Replaces old messages with the summary
4. Maintains the last 10 messages for context

Use `/compact` to trigger manual compaction at any time.

## Sub-Agents

Complex tasks can be decomposed into parallel sub-tasks. Each sub-agent:
- Runs concurrently (default: 3 max)
- Inherits the main agent's permission context
- Has isolated conversation context
- Reports status and results back to the orchestrator

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
