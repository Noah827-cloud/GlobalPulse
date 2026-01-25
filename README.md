# GlobalPulse - AI News Aggregator

An intelligent news aggregator powered by Google Gemini, capable of fetching, summarizing, and filtering global news from diverse RSS sources.

## 🚀 Features

- **AI Summarization**: Uses Google Gemini Pro to generate concise summaries and extract key tags from long articles.
- **Smart Filtering**: Filter news by auto-generated top keywords (e.g., "Trump", "AI", "Economy").
- **Multi-Source Support**:
  - **Politics**: BBC, CNN, Sky News, The Guardian, China News
  - **Finance**: Yahoo Finance, Investing.com, Jiemian, China News Finance
  - **AI & Tech**: TechCrunch, Ars Technica, InfoQ, 36Kr, BestBlogs
  - **Entertainment**: Variety, Hollywood Reporter, Huxiu
- **Robust Architecture**:
  - **Proxy Fallback**: Automatically switches between proxies (`AllOrigins`, `CorsProxy`) to bypass CORS/Region blocks.
  - **Crash Prevention**: Advanced unique ID generation prevents React rendering conflicts.
  - **Cache Management**: Versioned local storage ensures data integrity.

## 🛠️ Setup & Run

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API Key**
   Create a `.env` file (or set in environment variables) with your Google Gemini API Key:
   ```env
   VITE_API_KEY=your_gemini_api_key_here
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 🌐 Deployment (Publish to Internet)

The easiest way to deploy this app is using **Vercel** (recommended for Vite/React apps).

### Step 1: Push to GitHub
Ensure your latest code is pushed to your GitHub repository (you just did this).

### Step 2: Deploy on Vercel
1. Go to [Vercel.com](https://vercel.com) and sign up/login.
2. Click **"Add New..."** -> **"Project"**.
3. Import your `GlobalPulse` repository.
4. **Crucial Step**: In the "Environment Variables" section, add:
   - **Name**: `VITE_API_KEY`
   - **Value**: Your Google Gemini API Key (starts with `AIza...`)
5. Click **Deploy**.

Vercel will build your site and give you a public URL (e.g., `https://globalpulse-news.vercel.app`) that you can share with anyone.

### Alternative: Netlify
Similar process: Connect GitHub -> Select Repo -> Set `VITE_API_KEY` in "Site settings" -> Deploy.

## 🧩 Recent Updates

- **Fixed**: React "Duplicate Key" crash caused by base64 ID collisions.
- **Added**: New Chinese & Tech sources (36Kr, BestBlogs, The Guardian).
- **Improved**: Logic for missing images and RSS proxy reliability.

## 📄 License

MIT
