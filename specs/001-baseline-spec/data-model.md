# Data Model: Baseline News Aggregator

## Entities

### NewsArticle
*Core entity representing a news card.*

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique ID (base64 of url + index) |
| title | string | Yes | Headline (translated if needed) |
| summary | string | Yes | 2-3 sentence summary in Chinese |
| source | string | Yes | Publisher name (e.g., "路透社") |
| url | string | Yes | Original article URL |
| imageUrl | string | No | Thumbnail URL (upscaled if low-res) |
| timestamp | string | Yes | ISO 8601 Date string |
| category | NewsCategory | Yes | Topic enum |
| syncDate | string | No | Date when this was fetched (YYYY-MM-DD) |

### NewsCategory (Enum)
*Allowed topics.*
- `Politics` (Global/China)
- `Finance` (Market/Economy)
- `AI` (Tech/Research)
- `Entertainment` (Movies/Music)

## Validations

1. **Category Strictness**: `article.category` MUST match the requested category. Mis-categorized items from AI response must be filtered.
2. **Deduplication**: Articles with identical `url` should update the existing record, not create duplicates.
