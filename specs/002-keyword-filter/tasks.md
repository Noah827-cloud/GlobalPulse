# Tasks: Keyword Filter Bar

**Feature**: `002-keyword-filter`
**Status**: Todo

## Phase 1: Foundation & Data Model

*Metric: Types are defined and Storage wrappers exist.*

- [ ] T001 Define `tags` field in `NewsArticle` interface in `src/types.ts`
- [ ] T002 Implement `KeywordLibrary` storage helper (get/set `localStorage`)

## Phase 2: Logic & Service Enhancement

*Metric: Articles have tags populated from AI or RSS.*

- [ ] T003 Update `geminiService.ts` prompt to request `tags` (JSON schema update)
- [ ] T004 Implement `extractTagsFromRSS` in `geminiService.ts` matching title/summary against Library
- [ ] T005 [P] Implement `extractTagsFallback` that uses `KeywordLibrary` for non-AI items

## Phase 3: Components Implementation

*Metric: UI components are visible and interactive.*

- [ ] T006 [P] Create `SettingsModal.tsx` for adding/removing keywords from Library
- [ ] T007 [P] Create `KeywordBar.tsx` that calculates unique tags from articles and sorts by frequency
- [ ] T008 [P] Update `NewsCard.tsx` to display tags visually

## Phase 4: Integration (App.tsx)

*Metric: Clicking a tag filters the list.*

- [ ] T009 Integrate `SettingsModal` into `Header` (Add Settings Icon)
- [ ] T010 Integrate `KeywordBar` into `Main` layout (below Title)
- [ ] T011 Implement `filterByKeyword` logic in `App.tsx` (modifies `filteredArticles`)
- [ ] T012 Implement `onTagClick` in `NewsCard` to trigger global filter

## Phase 5: Polish & Verification

- [ ] T013 Verify "Top Keywords" algorithm (Top 15, valid sorting)
- [ ] T014 Verify "RSS Fallback" works using the Settings list
