## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, vitest, playwright, tailwindcss, sveltekit-adapter, devtools-json, mdsvex, mcp

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

---

## Project Architecture

GitDoc is a Git + Markdown team document management tool. See [doc/architecture.md](doc/architecture.md) for the full architecture design (in Chinese).

### Key Directories

```
src/
├── routes/              # SvelteKit pages and API endpoints
│   ├── auth/            # OAuth login/callback/logout
│   ├── setup/           # First-use repo configuration
│   ├── doc/             # Document browsing, editing, commenting
│   ├── search/          # Full-text search
│   ├── admin/           # User management
│   └── api/v1/          # REST API for LLM/Agent integration
├── lib/
│   ├── server/          # Server-only modules (NEVER import from client code)
│   │   ├── git/         # Git operations via isomorphic-git (clone, pull, commit, push)
│   │   ├── auth/        # GitHub OAuth, JWT sessions, permission checks
│   │   ├── docs/        # Document reading, writing, search
│   │   └── config.ts    # Repo config.json management
│   └── components/      # Shared Svelte components
│       ├── layout/      # Navbar, Sidebar
│       ├── doc/         # DocViewer, DocEditor, DocList
│       ├── comment/     # CommentList, CommentForm
│       ├── search/      # SearchBar
│       └── auth/        # LoginButton
```

### Coding Conventions

- **Svelte 5 Runes**: Always use `$state()`, `$derived()`, `$effect()`, `$props()` — never legacy `let` reactivity
- **Server-only code**: All git operations, auth logic, and data access go in `$lib/server/`. SvelteKit enforces this boundary.
- **Git operations**: Use `isomorphic-git` (pure JS, no system git binary). Never use `simple-git` or shell `git` commands.
- **Auth**: GitHub OAuth with JWT session cookies. Check permissions via `event.locals.user` in server routes.
- **Data storage**: All data lives in the user's remote git repo, NOT in this codebase. This repo is the manager only.
- **Commits**: Each edit or comment = exactly 1 git commit. Commit messages follow: `"编辑: [section]/[doc] by @username"` or `"评论: [section]/[doc] by @username"`.

### Route Naming

- Pages: `src/routes/doc/[section]/[doc]/+page.svelte`
- Server loaders: `+page.server.ts` (for page data) or `+server.ts` (for API endpoints)
- API routes: `src/routes/api/v1/...` — RESTful, JSON responses

### Environment Variables

```
GITHUB_CLIENT_ID       # GitHub OAuth App Client ID
GITHUB_CLIENT_SECRET   # GitHub OAuth App Client Secret
JWT_SECRET             # JWT signing secret
REPO_URL               # Default doc repo URL (optional)
```

### Testing

- **Unit tests**: Vitest — `src/**/*.spec.ts` or `src/**/*.svelte.spec.ts`
- **E2E tests**: Playwright — `src/**/*.e2e.ts`
- Run `npm run test:unit` for unit tests, `npm run test:e2e` for E2E, `npm run test` for all
