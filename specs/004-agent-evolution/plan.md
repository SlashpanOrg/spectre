# Implementation Plan: Spectre Agent Evolution

**Branch:** `004-agent-evolution` | **Date:** 2026-05-21 | **Spec:** [spec.md](./spec.md)

## Summary

Add dynamic tool creation, model availability validation, model-specific communication adaptation, error learning with skill creation, clarification handler integration, and optional Spectre Gateway for Telegram.

## Technical Context

**Language/Version:** TypeScript 5.7+, Node.js >= 20.0.0

**Primary Dependencies:**
- Existing: `ink`, `react`, `openai`, `@anthropic-ai/sdk`, `@google/generative-ai`, `execa`, `fast-glob`, `diff`
- No new gateway dependencies: Telegram uses HTTPS Bot API directly via `fetch`

**Current Architecture:**
- Tool registry: `src/agent/tools/registry.ts` — static tool registration
- Model discovery: `src/ai/model-discovery.ts` — lists models but doesn't validate availability
- Orchestrator: `src/agent/orchestrator.ts` — conversation-first agent
- Memory: `src/agent/memory.ts` — SOUL.MD, SKILLS.MD, DIARY.MD, etc.
- TUI: `src/tui/app.tsx` — React/Ink interface

**Target Architecture:**
```
src/
├── agent/
│   ├── orchestrator.ts              # UPDATED — model adaptation, error learning, clarification
│   ├── tools/
│   │   ├── registry.ts              # UPDATED — restart-time dynamic tool linking from ~/.spectre/tools/
│   │   ├── tool-creator.ts          # NEW — generates and validates new tools
│   │   └── create-tool.ts           # NEW — agent tool for creating tools
│   ├── error-learner.ts             # NEW — analyzes errors, creates skills
│   ├── clarification-handler.ts     # NEW — interactive clarification system
│   └── memory.ts                    # UPDATED — skill creation integration
├── ai/
│   ├── model-discovery.ts           # UPDATED — availability validation
│   ├── model-validator.ts           # NEW — cross-checks model availability
│   └── model-profiles.ts            # NEW — capability profiles per model
├── gateway/
│   ├── index.ts                     # NEW — gateway CLI entry
│   ├── gateway-manager.ts           # NEW — start/stop/logs management
│   ├── telegram.ts                  # NEW — Telegram bot integration
│   └── slack.ts                     # NEW — Slack bot integration
├── commands/
│   ├── gateway.ts                   # NEW — gateway CLI commands
│   └── tools.ts                     # NEW — manage dynamic tools
├── tui/
│   └── components/
│       └── clarification-prompt.tsx # NEW — clarification dialog
└── utils/
    └── error-patterns.ts            # NEW — error pattern matching
```

## Constitution Check

### Article I: Conversation-First Design
- [ ] Agent explains when creating new tools before executing
- [ ] Agent asks for clarification naturally in conversation
- [ ] Agent explains model capability limitations transparently

### Article II: Permission-Respecting Execution
- [ ] Dynamically created tools are generated/compiled at runtime but linked only after restart
- [ ] Gateway operations respect same permission system as TUI
- [ ] Tool creation itself requires user approval

### Article III: Tool Transparency
- [ ] New tool code is shown to user before registration
- [ ] Model validation failures are logged and visible
- [ ] Error learning is transparent — user can view/edit skills

### Article IV: Sub-Agent Delegation
- [ ] Tool creation can be delegated to sub-agent for complex requirements
- [ ] Gateway runs as separate process, not blocking main agent

### Article V: Memory and Growth
- [ ] Error lessons stored in DIARY.MD
- [ ] New skills stored in SKILLS.MD
- [ ] Dynamic tools persisted in ~/.spectre/tools/
- [ ] Model profiles cached in ~/.spectre/models/

### Article VI: Session Intelligence
- [ ] Model availability cached with TTL
- [ ] Error patterns recognized across sessions
- [ ] Dynamic tools loaded only on session start/restart

### Article VII: Quality Standards
- [ ] Generated tools must compile before being marked restart-ready
- [ ] Gateway has proper error handling and reconnection
- [ ] All new code follows existing conventions

### Article VIII: Performance Awareness
- [ ] Model validation runs asynchronously, doesn't block startup
- [ ] Gateway uses lightweight polling, not heavy resource usage
- [ ] Tool creation has timeout to prevent infinite generation

## Project Structure

```
spectre/
├── src/
│   ├── agent/
│   │   ├── tools/
│   │   │   ├── tool-creator.ts      # NEW — generates, validates, compiles tool code
│   │   │   └── create-tool.ts       # NEW — agent tool interface
│   │   ├── error-learner.ts         # NEW — error analysis and skill creation
│   │   ├── clarification-handler.ts # NEW — clarification system
│   │   └── orchestrator.ts          # UPDATED — integrates new systems
│   ├── ai/
│   │   ├── model-validator.ts       # NEW — validates model availability
│   │   ├── model-profiles.ts        # NEW — capability profiles
│   │   └── model-discovery.ts       # UPDATED — uses validator
│   ├── gateway/
│   │   ├── index.ts                 # NEW — gateway entry point
│   │   ├── gateway-manager.ts       # NEW — process management
│   │   ├── telegram.ts              # NEW — Telegram integration
│   │   └── slack.ts                 # NEW — Slack integration
│   ├── commands/
│   │   ├── gateway.ts               # NEW — gateway CLI
│   │   └── tools.ts                 # NEW — tool management CLI
│   ├── tui/
│   │   └── components/
│   │       └── clarification-prompt.tsx # NEW — clarification dialog
│   └── utils/
│       └── error-patterns.ts        # NEW — error pattern matching
├── tests/
│   └── unit/
│       ├── tool-creator.test.ts     # NEW
│       ├── error-learner.test.ts    # NEW
│       ├── model-validator.test.ts  # NEW
│       ├── clarification-handler.test.ts # NEW
│       └── model-profiles.test.ts   # NEW
└── ...
```

## Implementation Strategy

### Phase 1: Model Validation and Profiles (Week 1)
- Build model validator that tests model availability
- Create model capability profiles
- Update model discovery to use validated list
- Add graceful fallback on model errors
- Tests for validator and profiles

### Phase 2: Error Learning and Skill Creation (Week 2)
- Build error pattern analyzer
- Integrate with memory system (SKILLS.MD, DIARY.MD)
- Add error recovery suggestions
- Create skill lookup on error occurrence
- Tests for error learning

### Phase 3: Dynamic Tool Creation (Week 3)
- Build tool code generator that creates TypeScript tool code from requirements
- Add compilation validation and compile to `~/.spectre/tools/active/<name>.mjs`
- Implement automatic gap detection in orchestrator — when no tool matches, agent logs gap and spawns sub-agent
- Internal micro-agent path generates, validates, and prepares the tool automatically
- User is notified post-creation with restart now/later option
- Implement tool persistence to `~/.spectre/tools/` and linking on next Spectre start
- Create `/tool <prompt>` command for explicit tool creation
- Create `/tools` management command (list, enable, disable, remove)
- Tests for tool creation flow

### Phase 4: Clarification Handler (Week 4)
- Build clarification system
- Integrate into TUI as interactive prompt
- Add CLI support
- Wire into orchestrator
- Tests for clarification flow

### Phase 5: Spectre Gateway (Week 5)
- Build gateway process manager (`spectre gateway start/stop/status/logs`)
- Implement Telegram integration via Bot API fetch polling
- User creates bot via @BotFather, shares token — that's it
- Gateway receives messages, processes through agent, sends responses back
- **Slack dropped** — requires app creation, OAuth, webhooks, ngrok/public URL. Too much overhead for user. Can be added later if demand exists.
- Tests for gateway components

### Phase 6: Integration and Polish (Week 7)
- Integrate all systems into orchestrator
- Update README with new features
- Performance optimization
- Cross-platform testing
- Release preparation

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Dynamic tool creation | Agent needs to extend capabilities without code updates | Static tools can't cover all user needs |
| Model validation | Provider APIs list models that may not be usable | Without validation, users hit confusing errors |
| Error learning | Agent should improve from experience | Without learning, same errors repeat indefinitely |
| Model profiles | Different models have different capabilities | One-size-fits-all approach wastes capabilities |
| Gateway | Users want agent access outside terminal | Terminal-only limits agent accessibility |

## Risk Mitigation

1. **Generated Tool Safety:** All generated tools go through compilation check and permission review before registration
2. **Model Validation Performance:** Validation runs async with timeout, cached results used on failure
3. **Gateway Security:** Bot tokens stored encrypted, gateway process isolated from main agent
4. **Error Learning Accuracy:** Pattern matching uses fuzzy similarity, not exact string matching
5. **Clarification Timeout:** Clarification prompts have configurable timeout to prevent blocking
6. **Dependency Management:** Telegram/Slack deps are optional, only installed when gateway is enabled
