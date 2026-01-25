# Quickstart: Baseline News Aggregator

## Prerequisites

- Node.js 18+
- Gemini API Key

## Setup

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Environment**
   Create `.env.local`:
   ```env
   VITE_API_KEY=your_gemini_key_here
   ```
   *(Note: Code currently uses `process.env.API_KEY`, ensure Vite config enables this or switch to `import.meta.env`)*

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## Development Workflow

- **Sync logic**: Modify `geminiService.ts`.
- **UI Components**: Check `components/` folder.
- **State**: `App.tsx` manages global state and `localStorage`.

## Common Commands

- `npm run build`: Production build
- `npm run preview`: Test production build locally
