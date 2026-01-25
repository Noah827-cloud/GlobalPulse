# Research: Baseline News Aggregator

**Feature**: `001-baseline-spec`

## Decision: Hybrid Fetching Architecture

### Rationale
Pure AI fetching is slow and cost-intensive. Pure RSS is fast but lacks "Intelligence" (translation/categorization).
**Selected Approach**: Use `Promise.race` or sequenced calls?
**Decision**: Sequenced. Try AI first (Quality). If error, fallback to RSS (Resilience).
**Refinement per Constitution**: UI should show "AI Processing..." vs "RSS Fallback" states if possible, but for MVP, transparency is key.

## Decision: Data Persistence Strategy

### Rationale
`localStorage` has a ~5MB limit. Storing full HTML or images will crash it.
**Selected Approach**: Store only metadata (Title, Summary, URL).
**Constraint**: Pruning strategy needed.
**Action**: Implement `slice(0, 500)` on save to prevent quota overflow.

## Decision: Chinese Localization

### Rationale
Source names like 'The Verge' are alien to some target users.
**Selected Approach**:
1. AI Prompt Instruction: "Translate source names..."
2. RSS Fallback: Hardcoded lookup table (e.g., `{'The Verge': 'The Verge科技'}`) if AI fails?
**Decision**: Stick to AI prompt for now (simpler). RSS fallback will just show original hostname if map missing, acceptable for MVP.

## Resolved Clarifications
- **Auth**: None needed (Local-First).
- **Backend**: None (Serverless/Client-side).
