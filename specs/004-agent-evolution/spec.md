# Spec: Spectre Agent Evolution — Dynamic Tool Creation, Model Intelligence, Error Learning, and Communication Gateway

## Context

Spectre is a coding agent with 13 built-in tools, permission system, sub-agents, session compaction, and memory files. Users report several critical issues:

1. **Model availability errors**: Google Gemini returns 400/404 for models that are deprecated, restricted, or interaction-only (e.g., `deep-research-max-preview-04-2026`, `gemini-2.0-flash`)
2. **Clarification handler missing**: Agent fails with "No clarification handler available" when it needs to ask the user questions
3. **Static tool set**: Agent can only use pre-built tools, cannot create new tools based on novel requirements
4. **No model-specific adaptation**: Agent treats all models the same, but different models have different capabilities, token limits, and communication patterns
5. **No error learning**: When the agent encounters new errors, it doesn't learn from them or create skills to handle them next time

Additionally, users want optional communication channel integration (Telegram) via a background gateway process.

## Goals

1. Agent can dynamically create new tools when existing tools don't cover a requirement
2. Agent validates model availability before use, filtering out deprecated/restricted/interaction-only models
3. Agent adapts communication style based on model capabilities (streaming support, token limits, tool calling format)
4. Agent learns from errors and creates persistent skills to handle similar errors in the future
5. Clarification handler is fully integrated into the TUI and CLI workflows
6. Optional Spectre Gateway runs in background for Telegram communication (user provides bot token only)

## Non-Goals

- Building full Telegram bot infrastructure (user creates bot, we only integrate)
- Slack integration is out of scope because it requires Slack app/OAuth/event subscription/public webhook setup.
- Replacing existing tools with dynamic ones (dynamic tools supplement, not replace)
- Real-time model capability detection beyond what provider APIs expose

## Requirements

### Requirement 1: Dynamic Tool Creation

**User Story 1.1:** As a user, I want the agent to automatically detect when no existing tool can fulfill my request, so that I don't need to manually request tool creation.

**Acceptance Criteria:**
- Agent detects when no existing tool matches the user's request or when a task cannot be completed with available tools
- Agent logs the gap in DIARY.MD with a tool creation plan
- Agent uses an internal micro-agent path to generate, validate, and prepare the new tool
- Sub-agent generates TypeScript tool code based on the requirement
- Generated tool is validated and compiled during runtime
- Generated tool is not linked into the current process; it becomes available after Spectre restart
- User is notified when a new tool is ready and can choose restart now or later
- Tool is saved to `~/.spectre/tools/` for persistence across sessions

**User Story 1.2:** As a user, I want to explicitly request tool creation via `/tool <prompt>`.

**Acceptance Criteria:**
- `/tool <description>` command triggers tool creation flow
- Same validation and registration process as automatic creation
- User can review and remove the generated tool before restarting

**User Story 1.3:** As a user, I want dynamically created tools to persist across sessions.

**Acceptance Criteria:**
- Tools saved to `~/.spectre/tools/` are loaded on agent initialization
- Each tool has a metadata file describing its purpose, parameters, and creation date
- Tools can be listed, inspected, and removed via `/tools` command

### Requirement 2: Model Availability Validation

**User Story 2.1:** As a user, I want the agent to only show and use models that are actually available, so I don't encounter 400/404 errors.

**Acceptance Criteria:**
- On provider initialization, fetch available models from the provider API
- Filter out models that are: deprecated, interaction-only, require special access, or return errors
- Cache the validated model list with a TTL (configurable, default 1 hour)
- Model switcher only shows validated models
- If a model becomes unavailable during a session, agent gracefully falls back to the next available model

**User Story 2.2:** As a user, I want the agent to handle model errors gracefully when they occur.

**Acceptance Criteria:**
- When a model returns 400/404/403, agent logs the error and marks the model as unavailable
- Agent suggests alternative models from the same provider
- Agent updates the cached model list to exclude the failed model
- Error is recorded in the agent's DIARY.MD for future reference

### Requirement 3: Model-Specific Communication Adaptation

**User Story 3.1:** As a user, I want the agent to adapt its communication style based on the active model's capabilities.

**Acceptance Criteria:**
- Each model has a capability profile: streaming support, max tokens, tool calling format, context window, reasoning capabilities
- Agent adjusts system prompt based on model capabilities (e.g., simpler prompts for smaller models, structured output for reasoning models)
- Agent uses appropriate tool calling format per model (some models support native tool calling, others need text-based parsing)
- Agent adjusts response length expectations based on model's max output tokens

**User Story 3.2:** As a user, I want the agent to know which models support which features.

**Acceptance Criteria:**
- Model capability profiles are stored in `~/.spectre/models/` as JSON files
- Profiles are updated automatically when provider API returns capability metadata
- User can view model capabilities via `/model-info <name>` command
- Agent warns when using a model with limited capabilities (e.g., no streaming, small context window)

### Requirement 4: Error Learning and Skill Creation

**User Story 4.1:** As a user, I want the agent to learn from errors and create skills to handle them in the future.

**Acceptance Criteria:**
- When the agent encounters an error it hasn't seen before, it analyzes the error pattern
- Agent creates a "skill" entry in SKILLS.MD describing the error and its resolution
- Agent creates a "lesson" entry in DIARY.MD with the full error context and solution
- On similar errors in the future, agent checks SKILLS.MD first before failing
- Skills are categorized: model errors, tool errors, permission errors, network errors, unknown errors

**User Story 4.2:** As a user, I want the agent to handle the "No clarification handler available" error.

**Acceptance Criteria:**
- Clarification handler is integrated into the TUI as an interactive prompt
- When agent needs clarification, TUI shows a clarification dialog with the agent's question
- User can type a response directly in the TUI
- CLI mode supports clarification via stdin prompt
- Clarification responses are passed back to the agent as tool results

### Requirement 5: Spectre Gateway (Optional, Telegram Only)

**User Story 5.1:** As a user, I want to run Spectre as a background gateway that accepts messages from Telegram.

**Acceptance Criteria:**
- `spectre gateway start` starts a background process
- User provides Telegram bot token (from @BotFather)
- Gateway receives messages from Telegram, processes them through the agent, and sends responses back
- Gateway supports the same tools and permissions as the TUI
- Gateway can be stopped with `spectre gateway stop`
- Gateway logs are available via `spectre gateway logs`

## Constraints

- Dynamic tool creation must be sandboxed — generated tools cannot execute arbitrary code without permission
- Model validation must not block startup — if validation fails, fall back to cached list or all models
- Gateway must be optional — no dependencies installed unless user explicitly enables it
- All error learning must respect user privacy — no error data sent to external servers

## Success Metrics

- Zero 400/404 model errors in normal usage
- Agent can create at least one new tool per session when needed
- Error recurrence rate decreases over time (agent learns from past errors)
- Gateway maintains stable connection for 24+ hours without restart
