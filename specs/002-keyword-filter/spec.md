# Feature Specification: Keyword Filter Bar

**Feature Branch**: `002-keyword-filter`
**Created**: 2026-01-25
**Status**: Draft
**Input**: User request for "Keyword Indexing and Filtering"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Auto-Generated Keyword Index (Priority: P1)

As a user, I want to see a list of trending keywords (e.g., "Trump", "OpenAI", "Stock") below the category title, so I can see what topics are hot at a glance.

**Why this priority**: Core discovery feature.
**Independent Test**: Load news -> Check if a "Keyword Bar" appears with tags -> Verify tags are relevant to current news.

**Acceptance Scenarios**:
1. **Given** loaded articles, **When** I view the main page, **Then** a horizontal scrollable bar of "Top Keywords" appears.
2. **Given** articles about "OpenAI", **When** I check the bar, **Then** "OpenAI" should be visible.
3. **Given** 50 articles, **When** calculating keywords, **Then** only the most frequent/relevant (Top 10-15) are shown.

### User Story 2 - Filter by Keyword (Priority: P1)

As a user, I want to click a keyword to filter the news list, showing only articles relevant to that topic.

**Why this priority**: Core interaction.
**Independent Test**: Click "Nvidia" -> Verify only Nvidia-related articles remain.

**Acceptance Scenarios**:
1. **Given** the keyword bar, **When** I click "Tesla", **Then** the news grid updates to show only articles containing "Tesla" in title/summary or tags.
2. **Given** a selected filter, **When** I click it again, **Then** the filter is cleared and all articles return.
3. **Given** a filtered state, **When** I switch categories, **Then** the filter is reset.

### User Story 3 - AI-Enhanced Tagging (Priority: P2)

As a system, I want Gemini to extract specific entities (People, Companies, Topics) during the fetch phase, so that the keywords are high-quality and not just random words.

**Why this priority**: Quality of life. Simple frequency count is okay, but AI entities are better.
**Independent Test**: Fetch new news -> Inspect JSON -> Verify `tags` array contains real entities.

**Acceptance Scenarios**:
1. **Given** the Gemini prompt, **When** fetching news, **Then** the `tags` field is populated with 3-5 keywords (e.g., "SpaceX", "Elon Musk").
2. **Given** RSS fallback (AI failure), **When** processing articles, **Then** the system MUST extract keywords using the "Hot Topic Library" (User Configurable).
3. **Given** bilingual content, **When** matching, **Then** both English ("Trump") and Chinese ("特朗普") keywords must be recognized.

### User Story 4 - Manage Keyword Library (Priority: P3)

As a user, I want a settings interface to add or remove "Hot Keywords" for the RSS fallback, so I can ensure my specific interests (e.g., "DeepSeek", "茅台") are tagged even without AI.

**Why this priority**: Customization for power users and specific local interests.
**Independent Test**: Open Settings -> Add "DeepSeek" -> Clear Cache -> Fetch RSS -> Verify "DeepSeek" tag appears on relevant articles.

**Acceptance Scenarios**:
1. **Given** the header, **When** I click a "Settings" icon, **Then** a configuration modal opens.
2. **Given** the keywords list, **When** I add "黄金 (Gold)", **Then** it is saved to local storage.
3. **Given** the backup logic, **When** parsing RSS, **Then** it checks against this dynamic list instead of a hardcoded one.

---

### Edge Cases

- **No keywords found**: Hide the bar or show generic category tags.
- **Too many keywords**: Algorithm should limit to top N by frequency.
- **Long keywords**: Truncate or allow horizontal scroll.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST update the Gemini Prompt to request extraction of 3-5 keywords per article into the `tags` field.
- **FR-002**: System MUST calculate "Trending Keywords" on the client side based on the frequency of tags in the currently displayed articles.
- **FR-003**: System MUST render a `KeywordBar` component between the Header and the News Grid.
- **FR-004**: System MUST filter `App.tsx` article list based on the selected keyword (Client-side filtering).
- **FR-005**: Filtering MUST support partial string matching against Title, Summary, and Tags.

### Key Entities

- **Keyword**: A string derived from `NewsArticle.tags`.
- **KeywordFilter**: State in `App.tsx` tracking the currently active filter string.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clicking a keyword filters the list in < 100ms (instant UI feedback).
- **SC-002**: Verification that "Top Keywords" bar contains at least 5 distinct items for a full category fetch.
- **SC-003**: 90% of AI-fetched articles contain at least 1 non-generic tag.
