# Implementation Plan: Keyword Filter Bar

**Branch**: `002-keyword-filter` | **Date**: 2026-01-25 | **Spec**: [Link](./spec.md)
**Input**: Feature specification from `/specs/002-keyword-filter/spec.md`

## Summary

Implement a dynamic Keyword Bar that indexes current news content for quick filtering. Enhance `geminiService` to extract AI tags, and add a robust RSS fallback that matches titles against a user-configurable "Hot Keyword Library".

## Technical Context

**State Management**: `App.tsx` will hold `selectedKeyword` and `keywordLibrary` state.
**Storage**: `keyword_library` persisted in `localStorage`.
**Algorithm**: Client-side frequency counting for "Trending" bar; Partial string match for "Filtering".
**New Components**: `KeywordBar.tsx`, `SettingsModal.tsx`.

## Constitution Check

- [x] **AI-Assisted Intelligence**: Enhances Gemini prompt for Tagging.
- [x] **Local-First**: Config stored in `localStorage`, processing done client-side.
- [x] **Aesthetic Excellence**: Settings UI must match ConfirmModal style (Glassmorphism).
- [x] **Resilience**: Explicit RSS fallback logic defined.

## Project Structure

### Documentation (this feature)
```text
specs/002-keyword-filter/
├── plan.md              # This file
├── research.md          # Algorithm & Storage decisions
└── data-model.md        # Schema updates
```

### Source Code Updates
```text
src/
├── components/
│   ├── KeywordBar.tsx    # [NEW]
│   └── SettingsModal.tsx # [NEW]
├── geminiService.ts      # [UPDATE] Add fallback logic & prompt update
└── App.tsx               # [UPDATE] Integrate filtering & state
```

## Complexity Tracking

| Violation | Why Needed | But... |
|-----------|------------|--------|
| Client-Side Indexing | Instant UI feedback | N < 500 items, negligible perf cost |
