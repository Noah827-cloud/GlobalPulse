# Data Model: Keyword Filter

## Storage Schema

### `keyword_library` (localStorage)
- **Type**: `string[]`
- **Default**: `["Trump", "OpenAI", "China", "Tesla", "Nvidia", "DeepSeek", "Apple", "Google", "Microsoft", "Bitcoin"]`
- **Desc**: User-defined list for RSS matching fallback.

### `NewsArticle` (Updated)
- **Field**: `tags`
- **Change**: Now crucial for filtering. Must be populated by AI or RSS Fallback.

## Component Contracts

### `KeywordBar`
- **Props**:
  - `articles: NewsArticle[]` (Source data to calculate specific trends)
  - `onSelectKeyword: (keyword: string | null) => void`
  - `selectedKeyword: string | null`
  - `onOpenSettings: () => void`

### `SettingsModal`
- **Props**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onSave: (newKeywords: string[]) => void`
  - `initialKeywords: string[]`

### `geminiService.ts`
- **Function**: `extractTagsFromRSS(item: any, library: string[])`
- **Logic**: Returns `string[]` based on matches.
