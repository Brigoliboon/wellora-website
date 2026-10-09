<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## Constraints

- DO NOT perform DESTRUCTIVE operations such as:
    - git:
        - `git add`
        - `git revert`
        - `git reset`
        - `git push`
        - Etc.
    - Supabase:
        - `supabase push`
        - Etc.
## UI Design

- Should be consistent with, or inspired by, the landing page design across the rest of the pages.
	- if non existent or fresh project with no UI, inspect `globals.css` and ask user to assign color pallets, and font combinations if non-existent. 
- Maintain a clear, consistent color scheme and ui/ux philosophy across the project.
- Get Context font combination(s) used across the project.
- ### Constraints
	-  DO NOT use aggressively ui/ux safe design approach, specifically;
		-  cards - rounded card borders for  page section separation
		- width control mobile safe-contstraints (`ex. max-w-*`) so that it would center all the content and mobile-friendly
		-  tables for data display and modification for users
	- DO NOT implement generic, static, card-based, no section separation.
- ### Checklist
	-  must follow proper ui/ux design philosophy principle, specifically;
		-  negative spacing
		-  visual heirarchy
		-  etc.

## Stack (depends on the project)

(Always fetch latest/current version docs before implementing.)

- Next.js + Tailwind CSS
- Node.js
- Lint
- Lucide icons, react-icons
- Framer Motion

## Practices

### Naming Convention

- Function: `my_func` (snake_case)
- React Component: `MyComponent()` (PascalCase)
- Filename:
    - React component: `MyComponent.ts`
    - lib, utils, funcs: `supabase.ts` (lowercase)

## File Locations

- `lib/supabase/models.ts` — Supabase prod schema data type reference
- `lib/supabase/tables/` — Postgres table database helpers
- `components/ui/` — custom UI (fields, textviews, containers, buttons, etc.)
- `components/sections/` — reusable UI components used across section pages (headers, footers, etc.)
- `components/{page_name}/` (ex. `landingpage`) — components exclusive to that specific page (Hero, Features, Subscription, About Us, etc.)
- `components/{component_group}/` (ex. `mealcards`) — global reusable custom components shared across pages

# Agent Workflow

(STRICTLY follow this rule.)

## Plan

- Understand the user's intent — their objective and what they want to accomplish.
- Propose your understanding of the task. If the user agrees, proceed to the next step; otherwise, ask clarifying questions.

## Analyze

- STRICTLY consider the following:
    - When performing fetching, updates, or uploads — implement loading states on the frontend.
    - Keep page load and performance in mind:
        - Optimization:
            - Use the Next/Image component.
            - Convert images to WebP.
            - Implement alt text for all images.
            - Modify `next.config` for optimizations such as image resolution and format.
            - Etc.
        - If applicable/necessary, implement lazy loading and code splitting.
- Analyze how it would be implemented:
    - List all files in the codebase that need to be modified, any new files to be created, API endpoints to modify (if any), and any SQL query needed for a database modification.
- Propose how you would implement it — specifically, but not limited to, the files, endpoints, and SQL query involved. Do NOT provide code (unless the user explicitly asks for it) — describe only the features, changes/removals, and how they'd be implemented. If the user agrees, proceed to the next step; otherwise, ask clarifying questions.

## Implement

- Create todos for phase tracking.
- For any SQL query:
    - Do NOT apply/push to production — just provide the query; the user will handle the production update themselves.
    - For each approved query, create a `database/migration/{...}.sql` file for tracking.
- After, create a test-case checklist doc for each feature implemented, at `tests/{FEATURE_TESTCASE}.md` (ex. `CHEF_SCHEDULES_TESTCASE.md`).
    - Sample content: `- [ ] C15: Paused subscriptions are excluded from Schedule/Today/Still-to-pick lists.`

## Check

- Check for lint errors and fix if any.

## Report

- Provide a report of changes, modifications, and creations.
