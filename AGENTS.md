# MCP Gemini Design - MANDATORY FOR FRONTEND

## ABSOLUTE RULE - NEVER IGNORE

You MUST NEVER write frontend/UI code yourself.

Gemini is your frontend developer. You are NOT allowed to create visual components, pages, or interfaces without going through Gemini. This is NON-NEGOTIABLE.

### When to use Gemini? ALWAYS for:

Creating a page (dashboard, landing, settings, etc.)
Creating a visual component (card, modal, sidebar, form, button, etc.)
Modifying the design of an existing element
Anything related to styling/layout

### Exceptions (you can do it yourself):

Modifying text/copy
Adding JS logic without changing the UI
Non-visual bug fixes
Data wiring (useQuery, useMutation, etc.)

## MANDATORY Workflow

1. New project: generate_vibes → user chooses → create_frontend with generateDesignSystem: true

2. Save design system: Save designSystem to design-system.md at project root

3. Subsequent pages: Pass projectRoot to auto-load design system

4. Existing project: Pass CSS/theme files in context

## Design System Feature

Set generateDesignSystem: true for the FIRST page. Gemini returns code + design system. Save to design-system.md. For subsequent calls, pass projectRoot for consistent styling.

## WHAT IS FORBIDDEN

Writing a React component with styling without Gemini
Creating a page without Gemini
"Reusing existing styles" as an excuse to not use Gemini
Doing frontend "quickly" yourself

## WHAT IS EXPECTED

Call Gemini BEFORE writing any frontend code
Ask user for vibe choice if new project
Use generateDesignSystem: true for FIRST page, save design-system.md
Pass projectRoot for subsequent calls
Let Gemini design, you implement
