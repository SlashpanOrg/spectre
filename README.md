# Spectre

> Your AI-powered development companion

Spectre is a session-based TUI AI developer tool that helps you understand, review, and document your codebase. Built for developers who want to stay in flow.

**Built by Slashpan Technologies Private Limited** | Contact: sp@slashpan.com

## Features

- **Full-screen TUI**: React-based terminal UI with Ink framework and shared component library
- **Interactive setup wizard**: Scrollable, searchable provider/model selection with `SelectableList`
- **Streaming AI responses**: Token-by-token response rendering with `useStreaming` hook
- **Command Palette**: VS Code-style command discovery with `Ctrl+K`
- **Context Side Panel**: Toggleable panel with session info and shortcuts (`Ctrl+G`)
- **Progress Indicators**: Animated progress bars for long-running operations
- **Multi-provider AI**: OpenAI, Anthropic, Google Gemini, Ollama with dynamic model discovery
- **Codebase indexing**: Git history → vector embeddings → semantic search
- **PR review**: AI-powered branch diff analysis
- **Tech debt detection**: Code quality analysis with health scoring
- **Documentation generation**: Runbooks, onboarding guides, ADRs, architecture docs
- **Agentic workflows**: Multi-step task planning and execution

## Installation

### Quick Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/SlashpanOrg/spectre/main/install.sh | bash
```

That's it. Spectre will be available globally as `spectre`.

### Update

```bash
curl -fsSL https://raw.githubusercontent.com/SlashpanOrg/spectre/main/install.sh | bash
```

### Uninstall

```bash
curl -fsSL https://raw.githubusercontent.com/SlashpanOrg/spectre/main/uninstall.sh | bash
```

### Alternative Methods

**npm (global):**
```bash
npm install -g spectre
```

**From source:**
```bash
git clone https://github.com/SlashpanOrg/spectre.git
cd spectre
npm install
npm run build
npm start
```

**Docker:**
```bash
docker compose up spectre
```

## Quick Start

```bash
spectre              # Launch Spectre
spectre --version    # Show version
```

Run `/setup` inside Spectre to configure your AI provider.

## TUI Architecture

Spectre uses a React-based terminal UI built with [Ink](https://github.com/vadimdemedes/ink) and a shared component library (`@slashpan/tui`):

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header                                                              │
│  Spectre v0.1.0                          Provider: openai            │
│  AI Development Intelligence Agent       Model: gpt-4o-mini          │
├──────────────────────────────────────────────────────────┬──────────┤
│  Chat View                                               │ Side     │
│                                                          │ Panel    │
│  You                                                     │          │
│  /index this repo                                        │ Session  │
│                                                          │ ID: abc  │
│  AI ⠋                                                    │ Provider │
│  Streaming response appears here token-by-token...       │ Model    │
│                                                          │          │
│  ┌────────────────────────────────────────────────────┐  │ Shortcuts│
│  │ ProgressIndicator                                  │  │ Ctrl+K   │
│  │ ████████████░░░░░░░░░░░░░░░░░░░░ 45%              │  │ Ctrl+G   │
│  │ Indexing: 45/100 commits                           │  │ Ctrl+Q   │
│  └────────────────────────────────────────────────────┘  │          │
│                                                          │          │
│  > Enter command or question... │ Ctrl+C to cancel       │          │
├──────────────────────────────────────────────────────────┴──────────┤
│  Status Bar                                                          │
│  ● Streaming │ openai/gpt-4o-mini │ Ctrl+K commands │ Ctrl+G panel  │
└─────────────────────────────────────────────────────────────────────┘
```

### TUI Component Library

Spectre includes a shared component library at `src/tui-lib/` with 11 components, 3 hooks, and utilities:

**Components:**
- `Header` - Top bar with branding, provider, and model info
- `StatusBar` - Bottom bar with status indicator and keyboard shortcuts
- `SidePanel` - Toggleable context panel with sections
- `SelectableList` - Scrollable, searchable list with fuzzy filtering
- `ChatView` - Message display with streaming support
- `Message` - Individual message renderer with code block detection
- `CodeBlock` - Syntax-highlighted code blocks
- `CommandPalette` - Modal command palette (Ctrl+K)
- `ProgressIndicator` - Animated progress bar with spinner
- `Spinner` - Loading animation
- `TextInput` - Enhanced input with autocomplete suggestions

**Hooks:**
- `useKeyboard` - Unified keyboard event handling
- `useScroll` - Scroll position and viewport management
- `useStreaming` - AI response streaming with cancel support

**Utilities:**
- `fuzzyMatch`, `fuzzyFilter`, `highlightMatches` - Fuzzy search
- `highlightCode`, `detectLanguage` - Syntax highlighting
- Color utilities with theme system

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Q` | Quit session |
| `Ctrl+K` | Toggle command palette |
| `Ctrl+G` | Toggle side panel |
| `Ctrl+C` | Cancel streaming response |
| `↑/↓` | Navigate lists and command history |
| `Tab` | Autocomplete / Start filtering |
| `/` | Start filtering in lists |
| `Esc` | Cancel operation / Clear filter |

### Command Palette

Press `Ctrl+K` to open the command palette. Type to filter commands by name or description, then press `Enter` to execute. All registered slash commands are available.

### Side Panel

Press `Ctrl+G` to toggle the side panel. Shows:
- Current session ID, provider, and model
- Message count
- Available keyboard shortcuts

### Setup Wizard

When you run `/setup`, an interactive wizard appears using `SelectableList`:

1. **Select Provider** - Scrollable list with arrow key navigation
2. **Enter API Key** - Masked input (encrypted locally)
3. **Select Model** - Dynamic model discovery with fuzzy search (press `/` or `Tab` to filter)
4. **Complete** - Provider configured, with next-step hints

### Model Switching

Use `/model` to open an interactive model switcher:

- Dynamically discovers models from the active provider
- Falls back to curated list when API is unreachable
- Scrollable list with fuzzy filtering
- Shows current active model indicator

### Streaming AI Responses

AI responses stream token-by-token using the `useStreaming` hook:

- Real-time token rendering as they arrive
- Streaming indicator (⠋) shown in chat
- `Ctrl+C` cancels streaming gracefully
- Progress indicator shown during planning phase

### Progress Indicators

Long-running operations show animated progress:

- `/index` - Shows commit count and percentage
- Agent tasks - Shows step completion progress
- Model discovery - Shows spinner during API calls

### Agent Task Assignment

Use `/agent <task>` to assign multi-step workflows:

- Task card updates with planning/running/completed/failed status
- Progress indicator shows step completion
- Current step description displayed
- Final summary with all steps

Agent-planned tools dispatch through Spectre's real command handlers:
- `index` → `/index`
- `query` → `/query`
- `review` → `/review`
- `debt` → `/debt`
- `docs` → `/docs`

### Sessions

Spectre creates a saved TUI session on launch and persists messages under the Spectre config directory:

- `/new [title]` - Start a fresh saved session
- `/sessions` - List recent sessions
- `/resume <session-id>` - Show recent messages from a session

The status bar shows the active provider/model and session info.

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
┌─────────────────────────────────────────────────────────┐
│                   Spectre TUI (Ink/React)                 │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│ Commands │   AI     │  Tools   │  Agent   │  TUI Lib     │
├──────────┼──────────┼──────────┼──────────┼──────────────┤
│ /setup   │ OpenAI   │ Index    │ Orchestr │ SelectableL. │
│ /model   │ Anthropic│ Query    │ Planner  │ ChatView     │
│ /review  │ Gemini   │ Review   │ Stream   │ CmdPalette   │
│ /debt    │ Ollama   │ Debt     │ Interrup │ ProgressInd. │
│ /docs    │          │ Docs     │ Clarify  │ StatusBar    │
└──────────┴──────────┴──────────┴──────────┴──────────────┘
┌─────────────────────────────────────────────────────────┐
│                 Storage Layer                             │
├──────────────────┬──────────────────────────────────────┤
│   Qdrant         │   SQLite                              │
│   (vectors)      │   (metadata, history, sessions)       │
└──────────────────┴──────────────────────────────────────┘
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

### Project Structure

```
spectre/
├── src/
│   ├── index.tsx                    # Entry point (renders SpectreApp)
│   ├── tui/
│   │   └── app.tsx                  # Main TUI app component
│   ├── tui-lib/                     # Shared TUI component library
│   │   ├── components/              # 11 React components
│   │   ├── hooks/                   # 3 custom hooks
│   │   ├── utils/                   # Fuzzy search, syntax, colors
│   │   └── types/                   # TypeScript type definitions
│   ├── commands/                    # Slash command handlers
│   ├── agent/                       # Agent orchestrator and tool runner
│   ├── ai/                          # AI provider abstraction layer
│   ├── tools/                       # Tool executors (index, query, etc.)
│   ├── storage/                     # Vector store and metadata store
│   └── utils/                       # Config, branding, logger
├── tests/
│   ├── unit/                        # Unit tests (12 test files)
│   └── tui/                         # TUI component tests (8 test files)
└── ...
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
