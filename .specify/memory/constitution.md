# SPECTER Project Constitution

## Project Identity

**Project Name:** Specter  
**Version:** 0.1.0  
**Created:** 2026-05-20  
**Built by:** Slashpan Technologies Private Limited  
**Contact:** sp@slashpan.com  
**Repository:** https://github.com/slashpan/spectre  
**License:** MIT (Open Source)

## Mission Statement

Specter is a self-hosted AI Development Intelligence Agent that becomes your team's institutional memory. It ingests your entire development lifecycle — repos, PRs, issues, commits, discussions, and decisions — to build a living, queryable knowledge graph of your codebase and team's collective intelligence.

## Core Values

1. **Privacy First** — All data stays on user infrastructure
2. **Open Source** — Fully transparent, community-driven development
3. **User-Owned AI** — Users bring their own API keys or local models
4. **Developer Experience** — Terminal-first with beautiful TUI
5. **Extensibility** — Plugin architecture for custom connectors

## Articles of Development

### Article I: Terminal-First Design

Every feature MUST be accessible through the terminal user interface (TUI). The TUI is the primary interface, not an afterthought.

- All core functionality must work via CLI commands
- TUI must be beautiful, responsive, and intuitive
- ASCII art intro screen required for brand identity
- Keyboard navigation must be fully supported
- Color schemes must be accessible (colorblind-friendly)

### Article II: Self-Hosted Mandate

Specter MUST run entirely on user infrastructure. No cloud dependencies for core functionality.

- All data processing happens locally
- Vector store runs locally (Qdrant/Weaviate self-hosted)
- No telemetry without explicit opt-in
- API keys are stored locally and never transmitted
- Local LLM support is first-class, not secondary

### Article III: API Key Ownership

Users MUST provide their own AI API keys or configure local models. Specter never provides AI inference.

- Support OpenAI, Anthropic, Google, and other providers
- Support local models via Ollama, LM Studio, etc.
- Setup wizard must guide users through API key configuration
- Multiple API keys can be configured and switched
- Local LLM configuration must be equally polished

### Article IV: Test-First Imperative

This is NON-NEGOTIABLE: All implementation MUST follow strict Test-Driven Development.

- Unit tests written before implementation
- Integration tests for all external connectors
- E2E tests for TUI workflows
- Tests must pass on CI before merge

### Article V: Easy Setup Mandate

Specter MUST be runnable immediately after cloning with minimal setup.

- `npm install && npm start` must work
- Setup wizard guides through all configuration
- Default configurations work out of the box
- Docker support for containerized deployment
- Clear error messages for missing dependencies

### Article VI: Git-Native Design

Specter MUST integrate deeply with Git workflows.

- Git repository scanning is core functionality
- Branch-aware analysis
- Commit history as first-class data source
- GitHub, GitLab, and self-hosted Git support
- Webhook integration for real-time updates

### Article VII: Simplicity Over Complexity

Start simple, add complexity only when proven necessary.

- Maximum 3 core packages for initial implementation
- No premature abstraction
- Clear separation of concerns
- Each module must be independently testable

### Article VIII: Documentation as Code

All documentation MUST be versioned with code and generated where possible.

- README must be comprehensive
- CLI help must be auto-generated
- API docs must be generated from code
- Examples must be tested and working

### Article IX: Open Source Community Standards

Specter MUST follow open source best practices.

- CONTRIBUTING.md with clear guidelines
- CODE_OF_CONDUCT.md required
- Security policy documented
- Release process automated
- Community issue templates provided

## Branding Requirements

- All tools must display "Built by Slashpan Technologies Private Limited"
- Contact email: sp@slashpan.com must be visible in help/about
- ASCII art logo must be consistent across tools
- GitHub repository must have proper attribution

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
