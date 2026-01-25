# Research: Keyword Filter Feature

**Feature**: `002-keyword-filter`

## Decision: Client-Side Tag Frequency Analysis

### Rationale
We need to display "Top Keywords". Since we fetch data per category, calculating this on the client is cheap (N=500 items).
**Algorithm**:
1. Flatten all `tags` arrays from `filteredArticles`.
2. Count frequency.
3. Sort desc.
4. Take top 15.
**Constraint**: Must ignore generic tags like "Policies" or the Category name itself to avoid noise.

## Decision: Keyword Library Storage

### Rationale
User needs to valid config.
**Storage**: `localStorage.getItem('keyword_library')`
**Format**: `string[]`.
**Default Seed**: `['Trump', 'OpenAI', 'China', 'Stock', 'DeepSeek', 'Tesla', 'Nvidia', 'iPhone', 'Gaza', 'Ukriane']` (Bilingual strings).

## Decision: RSS Fallback Matching

### Rationale
RSS has no AI tags.
**Logic**: 
Iterate through the `keyword_library`. If `title` or `summary` contains the keyword (case-insensitive), add it to tags.
**Optimization**: Use a single Regex pass? `new RegExp(keywords.join('|'), 'gi')`.
