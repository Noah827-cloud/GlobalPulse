# GlobalPulse News Aggregator Constitution
<!-- Project: GlobalPulse News Aggregator -->

## Core Principles

### I. AI-Assisted Intelligence
<!-- Principle 1 -->
All content retrieval, categorization, and summarization MUST leverage Generative AI (Google Gemini) to transform raw RSS/web data into structured, high-value insights. The system acts not just as a reader, but as an intelligent analyst.

### II. Local-First & Privacy Preserving
<!-- Principle 2 -->
The application operates primarily client-side. User preferences, cache, and news history are stored in `localStorage` or `IndexedDB`. No external backend database is required for core functionality, ensuring speed and privacy.

### III. Aesthetic Excellence
<!-- Principle 3 -->
The UI MUST adhere to a "Premium" aesthetic: glassmorphism, fluid animations (re-rendering logic handled via exact keys), high-contrast typography, and responsive modern layout (Tailwind CSS). "Good enough" UI is not acceptable.

### IV. Resilience & Fallback
<!-- Principle 4 -->
The system MUST be resilient to API failures and network issues. A hybrid approach is strictly enforced: AI search is primary, but hardcoded RSS feeds act as robust fallbacks. Image upscaling and proxy handling must degrade gracefully.

### V. Strict Typing & Component Modularity
<!-- Principle 5 -->
TypeScript strict mode is mandatory. Components must be small, single-purpose (e.g., `NewsCard`, `ConfirmModal`), and defined with explicit interfaces. `any` type usage is strictly discouraged.

## Technology Stack
<!-- Section 2 -->

### Core Framework
- **Runtime**: React 19+ (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Utility-first)

### Integration
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Data Source**: RSS feeds (`rss2json`) + AI Search Tools
- **State Management**: React Hooks (`useState`, `useReducer`) + `localStorage` persistence

## Development Standards
<!-- Section 3 -->

### Workflow
1.  **AI-Driven Dev**: Use `specify` or `gemini` agents to plan major features.
2.  **Linting**: Follow default Vite/TS linting rules.
3.  **Commit Policy**: Atomic commits with clear prefixes (`feat:`, `fix:`, `chore:`).

### Quality Gates
- All UI changes must be verified on both Desktop and Mobile viewports.
- AI prompts must be "Prompt Engineered" for strict JSON output (schema enforcement).

## Governance

### Amendments
Any changes to Core Principles (e.g., adding a backend) require a MAJOR version bump and team consensus.

### Versioning
Follow Semantic Versioning (Major.Minor.Patch).

**Version**: 1.0.0 | **Ratified**: 2026-01-24 | **Last Amended**: 2026-01-24
