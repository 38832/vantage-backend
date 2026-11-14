## graphify

For any question about this repo's architecture, structure, components, or how to add/modify/find
code, your first action should be `graphify query "<question>"` when `graphify-out/graph.json`
exists. Use `graphify path "<A>" "<B>"` for relationship questions and `graphify explain "<concept>"`
for focused-concept questions. These return a scoped subgraph, usually much smaller than the full
report or raw grep output.

Type `/graphify` in Copilot Chat to build or update the graph.

## Everything Claude Code (ECC) Engineering Rules

When planning, writing, refactoring, or reviewing code in this repository:
1. **Plan First (ecc:planner)**: Before implementing non-trivial features, outline architecture, dependencies, and file touches.
2. **Immutability First**: Always produce new objects; avoid in-place mutations of state or arguments.
3. **File & Function Focus**: Keep functions under 50 lines and source files under 800 lines (200-400 lines preferred). Prefer high cohesion and low coupling.
4. **Mandatory Code Review (ecc:code-reviewer)**: Verify explicit error handling, strict typing, and zero console/debug leftovers.
5. **Security Gates (ecc:security-reviewer)**:
   - Validate and sanitize all external inputs at system boundaries.
   - Never hardcode secrets, API keys, or credentials.
   - Enforce server-side authentication and role-based access control (RBAC) on sensitive endpoints.
6. **Test-Driven Rigor (ecc:tdd-guide)**: Maintain >= 80% test coverage on business logic and write regression tests before bug fixes.
