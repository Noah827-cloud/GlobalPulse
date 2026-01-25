# Tasks: Baseline News Aggregator

**Feature**: `001-baseline-spec`
**Status**: In Progress

## Phase 1: Setup

*Metric: Project initializes and runs locally.*

- [x] T001 Initialize React+Vite project with TypeScript and Tailwind CSS
- [x] T002 Install dependencies (@google/genai, rss2json logic)
- [x] T003 Configure environment variables (VITE_API_KEY) in `.env.local`

## Phase 2: Foundational

*Metric: Core types and services are available.*

- [x] T004 [P] Define `NewsArticle` and `NewsCategory` types in `src/types.ts`
- [x] T005 [P] Implement `geminiService.ts` with `fetchFromRSS` (fallback logic)
- [x] T006 [P] Implement `geminiService.ts` with `syncNewsForCategory` (AI logic)
- [x] T007 [P] Create `ConfirmModal.tsx` component
- [x] T008 [P] Create `NewsCard.tsx` component
- [x] T009 [P] Create `ArticleModal.tsx` component

## Phase 3: User Story 1 - View Latest News (P1)

*Goal: Users can view categorized news feeds.*
*Test: Open app -> switch tabs -> see content update.*

- [x] T010 [US1] Implement `App.tsx` state management (articles, category, loading)
- [x] T011 [US1] Implement `App.tsx` filtering logic (strict category match)
- [x] T012 [P] [US1] Implement `App.tsx` UI layout (Header + Grid + Responsive)
- [x] T013 [US1] Integrate `geminiService` calls into `performFullSync` in `App.tsx`

## Phase 4: User Story 2 - Clear Cache (P2)

*Goal: Users can manually clear cached data.*
*Test: Click trash icon -> Confirm -> List clears and reloads.*

- [x] T014 [US2] Implement `executeClearCache` logic in `App.tsx`
- [x] T015 [US2] Integrate `ConfirmModal` state and callbacks in `App.tsx`

## Phase 5: User Story 3 - Read Native Content (P3)

*Goal: Users see Chinese source names and summaries.*
*Test: Check card source name is "新浪" or translated.*

- [x] T016 [US3] Verify AI prompt in `geminiService.ts` requests Chinese source translation
- [x] T017 [US3] Verify `NewsCard.tsx` correctly renders `source` field

## Phase 6: Polish & Verification

- [x] T018 Check mobile responsiveness logic in `App.tsx` (hidden nav handling)
- [x] T019 Verify error handling in `geminiService.ts` (catch blocks for RSS fallback)

## Implementation Strategy

1.  **Done**: All core MVP features (Stories 1-3) are detected as implemented in the current codebase.
2.  **Next**: Full end-to-end manual verification (User Test).
